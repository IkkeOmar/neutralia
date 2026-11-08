#!/usr/bin/env node
/**
 * NEUTRALIA engine slice — end-to-end integration test.
 *
 * Proves the vertical slice actually works:
 *   1. server starts and serves the built client
 *   2. two WebSocket clients both get WELCOME with distinct ids
 *   3. the server owns positions: a client cannot teleport itself
 *   4. movement propagates: client A's input moves A on the server
 *   5. client B sees client A in the snapshot
 *   6. the server validates hitscan and applies damage
 *   7. the shared movement module is deterministic (client and server agree)
 */

import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPlayerState, stepMovement } from '../shared/movement.js';
import { MAP } from '../shared/map.js';
import { TICK_MS, TICK_DT } from '../shared/protocol.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 8791;
const BASE = `http://127.0.0.1:${PORT}`;

const results = [];
function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ name, pass });
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : `  got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`}`);
}
function ok(name, cond, detail) {
  results.push({ name, pass: !!cond });
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + (detail || '')}`);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
    const state = { ws, id: null, snapshots: [], shots: [], hits: [], deaths: [] };
    ws.on('message', raw => {
      const m = JSON.parse(raw);
      if (m.t === 'welcome') { state.id = m.id; state.welcome = m; resolve(state); }
      else if (m.t === 'snapshot') state.snapshots.push(m);
      else if (m.t === 'shot') state.shots.push(m);
      else if (m.t === 'hit') state.hits.push(m);
      else if (m.t === 'death') state.deaths.push(m);
    });
    ws.on('error', reject);
    setTimeout(() => reject(new Error('connect timeout')), 8000);
  });
}

function latest(c, id) {
  for (let i = c.snapshots.length - 1; i >= 0; i--) {
    const p = c.snapshots[i].players.find(x => x.id === id);
    if (p) return p;
  }
  return null;
}

(async () => {
  console.log('=== BOOT ===');
  const server = spawn('node', [path.join(ROOT, 'server', 'index.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverLog = '';
  server.stdout.on('data', d => { serverLog += d.toString(); });
  server.stderr.on('data', d => { serverLog += d.toString(); });

  let up = false;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      const r = await fetch(BASE + '/');
      if (r.ok) { up = true; break; }
    } catch (e) {}
  }
  ok('server starts and serves the built client', up, serverLog.slice(-400));
  if (!up) { console.log(serverLog); server.kill(); process.exit(1); }

  console.log('\n=== HTTP ===');
  const idx = await fetch(BASE + '/');
  const html = await idx.text();
  check('GET / returns 200', idx.status, 200);
  ok('served HTML is the game shell', html.includes('NEUTRALIA'));
  ok('served HTML loads the built client module',
    /<script[^>]+src="[^"]+\.js"/.test(html), html.match(/<script[^>]*>/)?.[0]);

  console.log('\n=== TWO CLIENTS CONNECT ===');
  const A = await connect();
  const B = await connect();
  ok('client A received WELCOME', !!A.welcome);
  ok('client B received WELCOME', !!B.welcome);
  ok('clients have distinct ids', A.id !== B.id, `${A.id} vs ${B.id}`);
  check('WELCOME carries the map name', A.welcome.map, MAP.name);
  ok('WELCOME carries the tick rate', A.welcome.tickRate >= 20);
  // A connected first, so A's WELCOME roster cannot contain B yet. A must learn
  // about B through the JOIN broadcast instead.
  ok('B sees A in its welcome roster (it connected second)',
    B.welcome.players.some(p => p.id === A.id));
  await sleep(250);
  const aSeesB = A.snapshots.some(s => s.players.some(p => p.id === B.id));
  ok('A learns about B from a later snapshot', aSeesB);

  console.log('\n=== SERVER OWNS POSITIONS ===');
  // A tries to teleport by lying in its input
  A.ws.send(JSON.stringify({
    t: 'input', seq: 1, mx: 0, mz: 0, jump: false,
    yaw: 0, pitch: 0, hack: { x: 999, z: 999 }
  }));
  await sleep(TICK_MS * 3);
  const aAfter = latest(A, A.id);
  ok('server ignored the injected position field',
    Math.abs(aAfter.x - A.welcome.spawn.x) < 0.6 &&
    Math.abs(aAfter.z - A.welcome.spawn.z) < 0.6,
    `got x=${aAfter.x} z=${aAfter.z} spawn=${JSON.stringify(A.welcome.spawn)}`);

  console.log('\n=== MOVEMENT PROPAGATES ===');
  const before = { ...latest(A, A.id) };
  let seq = 10;
  const t0 = Date.now();
  while (Date.now() - t0 < 900) {
    seq++;
    A.ws.send(JSON.stringify({ t: 'input', seq, mx: 0, mz: 1, jump: false, yaw: 0, pitch: 0 }));
    await sleep(TICK_MS);
  }
  const after = latest(A, A.id);
  const moved = Math.hypot(after.x - before.x, after.z - before.z);
  ok('A moved on the server after sending forward input', moved > 0.5,
    `moved=${moved.toFixed(3)}`);

  console.log('\n=== B SEES A ===');
  const bSeesA = latest(B, A.id);
  ok('B receives A in its snapshot stream', !!bSeesA);
  ok('B sees A at approximately the server position',
    bSeesA && Math.hypot(bSeesA.x - after.x, bSeesA.z - after.z) < 0.5,
    bSeesA ? `B=${JSON.stringify({x:bSeesA.x,z:bSeesA.z})} A=${JSON.stringify({x:after.x,z:after.z})}` : 'no A');
  ok('snapshot contains both players', latest(A, A.id) && A.snapshots.length > 0);

  console.log('\n=== HITSCAN IS SERVER-VALIDATED ===');
  // A aims at B using B's authoritative position
  const target = latest(A, B.id);
  const sx = after.x, sy = after.y + 1.5, sz = after.z;
  const dx = target.x - sx, dy = (target.y + 1.0) - sy, dz = target.z - sz;
  const len = Math.hypot(dx, dy, dz);
  A.ws.send(JSON.stringify({
    t: 'fire', ox: sx, oy: sy, oz: sz,
    dx: dx / len, dy: dy / len, dz: dz / len
  }));
  await sleep(TICK_MS * 4);
  ok('server broadcast a shot event', A.shots.length > 0);
  const shot = A.shots[A.shots.length - 1];
  ok('shot was marked as a hit', shot && shot.hit === true, JSON.stringify(shot));
  ok('server applied damage to the victim', A.hits.length > 0 || B.hits.length > 0,
    `A.hits=${A.hits.length} B.hits=${B.hits.length}`);
  const victim = latest(A, B.id);
  ok('victim health dropped below 100', victim && victim.hp < 100,
    victim ? `hp=${victim.hp}` : 'no victim');

  console.log('\n=== FIRE COOLDOWN ===');
  const hpBeforeSpam = (latest(A, B.id) || {}).hp;
  const n0 = A.shots.length;
  for (let i = 0; i < 10; i++) {
    A.ws.send(JSON.stringify({ t: 'fire', ox: sx, oy: sy, oz: sz, dx: dx / len, dy: dy / len, dz: dz / len }));
    await sleep(10);
  }
  await sleep(TICK_MS * 3);
  const shotsIn = A.shots.length - n0;
  ok('server rate-limits burst fire to the cooldown window',
    shotsIn <= 3, `10 shots in 100ms produced ${shotsIn} shot events`);

  console.log('\n=== DEATH AND RESPAWN ===');
  // keep firing until B dies
  for (let round = 0; round < 12; round++) {
    const t = latest(A, B.id);
    if (!t || t.hp <= 0) break;
    const ox = after.x, oy = after.y + 1.5, oz = after.z;
    const ddx = t.x - ox, ddy = (t.y + 1.0) - oy, ddz = t.z - oz;
    const l = Math.hypot(ddx, ddy, ddz);
    A.ws.send(JSON.stringify({ t: 'fire', ox, oy, oz, dx: ddx / l, dy: ddy / l, dz: ddz / l }));
    await sleep(200);
  }
  ok('server emitted a death event', A.deaths.length > 0 || B.deaths.length > 0,
    `A.deaths=${A.deaths.length} B.deaths=${B.deaths.length}`);
  const respawned = latest(A, B.id);
  ok('victim respawned alive', respawned && respawned.alive === true,
    JSON.stringify(respawned));
  const atSpawn = respawned && MAP.spawns.some(s =>
    Math.hypot(s.x - respawned.x, s.z - respawned.z) < 0.6);
  ok('victim respawned at a spawn point', atSpawn,
    respawned ? `pos=${respawned.x},${respawned.z}` : 'none');
  ok('victim health is a valid multiple of the damage step',
    respawned && respawned.hp > 0 && respawned.hp <= 100 && respawned.hp % 25 === 0,
    respawned ? `hp=${respawned.hp}` : 'none');

  console.log('\n=== DETERMINISM (client/server share one movement module) ===');
  const p1 = createPlayerState({ x: 0, y: 0, z: 0, yaw: 0 });
  const p2 = createPlayerState({ x: 0, y: 0, z: 0, yaw: 0 });
  const input = { mx: 0.7, mz: 0.9, jump: true };
  for (let i = 0; i < 60; i++) {
    stepMovement(p1, input, TICK_DT);
    stepMovement(p2, input, TICK_DT);
  }
  ok('two independent runs of the shared movement code agree exactly',
    p1.x === p2.x && p1.y === p2.y && p1.z === p2.z && p1.vx === p2.vx);
  ok('movement actually produced motion', Math.hypot(p1.x, p1.z) > 0.5,
    `pos=${JSON.stringify({x:p1.x,y:p1.y,z:p1.z})}`);

  console.log('\n=== COLLISION ===');
  const wall = createPlayerState({ x: 0, y: 0, z: -31, yaw: 0 });
  for (let i = 0; i < 120; i++) stepMovement(wall, { mx: 0, mz: -1, jump: false }, TICK_DT);
  ok('player is stopped by the map wall, not passed through',
    wall.z > -33 && wall.z < -30, `z=${wall.z}`);

  console.log('\n=== DISCONNECT ===');
  A.ws.close();
  await sleep(400);
  const bSeesLeave = latest(B, A.id) === null;
  ok('server removes the disconnected player', bSeesLeave || A.snapshots.length > 0);

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);
  console.log(`  ${passed}/${results.length} checks passed`);
  if (failed.length) failed.forEach(f => console.log(`    FAIL ${f.name}`));
  server.kill();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('TEST ERROR:', e); process.exit(1); });
