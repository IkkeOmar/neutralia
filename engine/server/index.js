// NEUTRALIA authoritative game server.
//
// The server owns positions, health, hit detection, projectiles and explosions.
// Clients only ever send intent (movement axes + aim) and a fire command.
//
// Physics: Rapier 3D, DETERMINISTIC build on the server. The client uses the
// standard build; tools/spike-determinism.mjs proves the two agree
// bit-identically across 400 steps, so prediction and authority agree.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

import { MAP } from '../shared/map.js';
import {
  MSG, TICK_MS, TICK_DT, SUB_STEPS, SUB_DT,
  MAX_HEALTH
} from '../shared/protocol.js';
import { createPlayerState, stepMovement, applyImpulse } from '../shared/movement.js';
import { initPhysics, PhysicsWorld, physicsBuild } from '../shared/physics.js';
import {
  WEAPONS, WEAPON_IDS, PLAYER_MASS,
  blastEffect, createProjectile, stepProjectile
} from '../shared/combat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'client', 'dist');
const PORT = Number(process.env.PORT || 8787);

// Sub-steps: 30 Hz network tick, 60 Hz physics. Matches the Colyseus 0.18
// `setFixedTimestep(step, 30, { subSteps: 2 })` shape. The constants live in
// shared/protocol.js so the client predicts at exactly the same rate.

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.bin': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  let file = path.join(DIST, url === '/' ? 'index.html' : url);
  if (!file.startsWith(DIST)) { res.writeHead(403); res.end('forbidden'); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('client not built yet - run: npm run build');
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(file).pipe(res);
});

const wss = new WebSocketServer({ server, path: '/ws' });

let nextId = 1;
const players = new Map();      // id -> player record
const projectiles = new Map();  // id -> projectile
let physics = null;

function spawnPoint() {
  const used = [...players.values()].map(p => p.spawnIndex);
  for (let i = 0; i < MAP.spawns.length; i++) {
    if (!used.includes(i)) return i;
  }
  return Math.floor(Math.random() * MAP.spawns.length);
}

function send(ws, type, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify({ t: type, ...data }));
}

function broadcast(type, data) {
  const msg = JSON.stringify({ t: type, ...data });
  for (const p of players.values()) {
    if (p.ws.readyState === 1) p.ws.send(msg);
  }
}

wss.on('connection', (ws) => {
  const id = nextId++;
  const spawnIndex = spawnPoint();
  const state = createPlayerState(MAP.spawns[spawnIndex]);
  const player = {
    id, ws, spawnIndex,
    state,
    bodyId: id,
    input: { mx: 0, mz: 0, jump: false },
    inputBuffer: [],            // ordered inputs, one consumed per sub-step
    consumedSeq: -1,            // last input the server actually simulated
    lastSeq: -1,
    lastFire: 0,
    weapon: 'rifle',
    ammo: { rifle: 30, rocket: 1, mgl: 6, tnt: 3 },
    name: `p${id}`
  };
  state.bodyId = id;
  players.set(id, player);
  if (physics) physics.addCharacter(id, state.x, state.y, state.z);

  send(ws, MSG.WELCOME, {
    id,
    map: MAP.name,
    tickRate: Math.round(1000 / TICK_MS),
    maxHealth: MAX_HEALTH,
    spawn: { x: state.x, y: state.y, z: state.z, yaw: state.yaw },
    players: snapshotPlayers(),
    weapons: WEAPON_IDS,
    ammo: player.ammo
  });
  broadcast(MSG.JOIN, { id, name: player.name });

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (m.t === MSG.INPUT) {
      // The client sends one input per physics sub-step. The server keeps
      // them in order and consumes ONE per sub-step, so the authority's
      // simulation matches the client's prediction step for step.
      //
      // Reusing the newest input for every sub-step (the old behaviour)
      // advanced the server twice for every one input the client sent, and
      // the two drifted apart within a second.
      const batch = Array.isArray(m.inputs) ? m.inputs : [m];
      for (const inp of batch) {
        const seq = Number(inp.seq);
        if (!Number.isFinite(seq) || seq <= player.lastSeq) continue; // stale
        player.lastSeq = seq;
        player.inputBuffer.push({
          seq,
          mx: clamp(inp.mx), mz: clamp(inp.mz), jump: !!inp.jump
        });
      }
      if (player.inputBuffer.length > 120) {
        player.inputBuffer.splice(0, player.inputBuffer.length - 120);
      }
      if (Number.isFinite(m.yaw)) player.state.yaw = m.yaw;
      if (Number.isFinite(m.pitch)) player.state.pitch = m.pitch;
    } else if (m.t === MSG.FIRE) {
      handleFire(player, m);
    } else if (m.t === MSG.SWITCH) {
      const w = String(m.weapon || '');
      if (WEAPON_IDS.includes(w)) {
        player.weapon = w;
        send(ws, MSG.AMMO, { weapon: player.weapon, ammo: player.ammo });
      }
    }
  });

  ws.on('close', () => {
    players.delete(id);
    if (physics) physics.removeCharacter(id);
    broadcast(MSG.LEAVE, { id });
  });
});

function clamp(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-1, Math.min(1, n));
}

// ── weapons ─────────────────────────────────────────────────────────────────

function handleFire(player, m) {
  const now = Date.now();
  const weaponId = WEAPON_IDS.includes(m.weapon) ? m.weapon : player.weapon;
  const weapon = WEAPONS[weaponId];
  if (!weapon) return;

  if (now - player.lastFire < weapon.cooldownMs) return;
  if (!player.state.alive) return;
  if (player.ammo[weaponId] !== undefined && player.ammo[weaponId] <= 0) return;

  const ox = Number(m.ox), oy = Number(m.oy), oz = Number(m.oz);
  const dx = Number(m.dx), dy = Number(m.dy), dz = Number(m.dz);
  if (![ox, oy, oz, dx, dy, dz].every(Number.isFinite)) return;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return;
  const ndx = dx / len, ndy = dy / len, ndz = dz / len;

  player.lastFire = now;
  if (player.ammo[weaponId] !== undefined) player.ammo[weaponId]--;

  if (weapon.kind === 'hitscan') {
    fireHitscan(player, weapon, ox, oy, oz, ndx, ndy, ndz);
  } else {
    fireProjectile(player, weapon, weaponId, ox, oy, oz, ndx, ndy, ndz, now);
  }
}

function fireHitscan(player, weapon, ox, oy, oz, ndx, ndy, ndz) {
  let best = weapon.range;
  let victim = null;

  // static world first
  const worldHit = physics.raycast(ox, oy, oz, ndx, ndy, ndz, best, player.id);
  if (worldHit) best = worldHit.t;

  // then characters, only if they are closer than the wall
  const charHit = physics.raycastCharacters(ox, oy, oz, ndx, ndy, ndz, best, player.id);
  if (charHit && charHit.t < best) {
    best = charHit.t;
    victim = players.get(charHit.id);
  }

  const hx = ox + ndx * best, hy = oy + ndy * best, hz = oz + ndz * best;
  broadcast(MSG.SHOT, {
    id: player.id, ox, oy, oz, dx: ndx, dy: ndy, dz: ndz,
    hx, hy, hz, hit: !!victim, weapon: 'rifle'
  });

  if (victim) applyDamage(victim, weapon.damage, player.id, hx, hy, hz);
}

function fireProjectile(player, weapon, weaponId, ox, oy, oz, ndx, ndy, ndz, now) {
  const p = createProjectile(weaponId, player.id, ox, oy, oz, ndx, ndy, ndz);
  p.born = now;
  projectiles.set(p.id, p);
  broadcast(MSG.SHOT, {
    id: player.id, ox, oy, oz, dx: ndx, dy: ndy, dz: ndz,
    hx: ox + ndx * 3, hy: oy + ndy * 3, hz: oz + ndz * 3,
    hit: false, weapon: weaponId, projectile: true
  });
}

// ── explosions ──────────────────────────────────────────────────────────────

function detonate(p) {
  const weapon = WEAPONS[p.weapon];
  if (!weapon) return;
  const blast = weapon.blast;
  const explosion = { x: p.x, y: p.y, z: p.z };

  // Hit everything in the radius.
  const affected = [];
  for (const target of players.values()) {
    const st = target.state;
    if (!st.alive) continue;
    const isSelf = target.id === p.owner;
    const eff = blastEffect(blast, st, explosion, PLAYER_MASS, isSelf, st.onGround);
    if (eff.damage <= 0 && eff.dvx === 0 && eff.dvy === 0 && eff.dvz === 0) continue;
    affected.push({ target, eff, isSelf });
  }

  broadcast(MSG.EXPLOSION, {
    x: p.x, y: p.y, z: p.z,
    weapon: p.weapon,
    owner: p.owner,
    radius: blast.radiusTier,
    // The owner needs to know it was a SELF blast to predict the launch.
    selfBlast: affected.some(a => a.isSelf)
  });

  for (const { target, eff, isSelf } of affected) {
    applyImpulse(target.state, eff.dvx, eff.dvy, eff.dvz);
    if (eff.damage > 0) {
      target.state.hp = Math.max(0, target.state.hp - eff.damage);
      broadcast(MSG.HIT, {
        id: target.id, by: p.owner, dmg: Math.round(eff.damage),
        hp: target.state.hp,
        hx: p.x, hy: p.y, hz: p.z,
        cause: 'explosion', self: isSelf
      });
      if (target.state.hp <= 0) killAndRespawn(target, p.owner);
    }
  }
}

// ── damage / death ──────────────────────────────────────────────────────────

function applyDamage(target, dmg, byId, hx, hy, hz) {
  target.state.hp = Math.max(0, target.state.hp - dmg);
  broadcast(MSG.HIT, {
    id: target.id, by: byId, dmg, hp: target.state.hp, hx, hy, hz,
    cause: 'hitscan', self: byId === target.id
  });
  if (target.state.hp <= 0) killAndRespawn(target, byId);
}

function killAndRespawn(target, byId) {
  target.state.alive = false;
  broadcast(MSG.DEATH, { id: target.id, by: byId });
  const idx = spawnPoint();
  target.spawnIndex = idx;
  const sp = MAP.spawns[idx];
  target.state.x = sp.x; target.state.y = 0; target.state.z = sp.z;
  target.state.yaw = sp.yaw || 0;
  target.state.vx = 0; target.state.vy = 0; target.state.vz = 0;
  target.state.alive = true;
  target.state.hp = MAX_HEALTH;
  if (physics) physics.setCharacterPosition(target.id, sp.x, 0, sp.z);
}

// ── tick loop ───────────────────────────────────────────────────────────────

function snapshotPlayers() {
  return [...players.values()].map(p => ({
    id: p.id, x: p.state.x, y: p.state.y, z: p.state.z,
    yaw: p.state.yaw, hp: p.state.hp, alive: p.state.alive,
    vx: p.state.vx, vy: p.state.vy, vz: p.state.vz,
    onGround: p.state.onGround,
    // The CONSUMED sequence number. The client replays everything above it.
    // Reporting the last RECEIVED seq instead would tell the client to drop
    // inputs the server has not simulated yet.
    lastSeq: p.consumedSeq ?? -1
  }));
  // NOTE: vx/vy/vz/onGround are part of the snapshot on purpose. The client
  // replays unacknowledged inputs on top of the authoritative state, and
  // without the authoritative velocity it cannot reconstruct the same
  // motion - the two sides drift apart within a second.
}

function tick() {
  const now = Date.now();

  // physics sub-steps
  //
  // The server consumes ONE INPUT PER SUB-STEP, oldest first. The client
  // sends one input per sub-step at the same rate, so the buffer normally
  // holds exactly the inputs for this tick.
  //
  // If the buffer is EMPTY (a network hiccup, or the client's send window
  // drifted), the server REUSES the last input rather than consuming a
  // phantom one. Reusing the last input is correct: the player keeps
  // holding the key they were holding. The client will reconcile the
  // difference when the snapshot arrives.
  //
  // The earlier bug was consuming 2 inputs per tick unconditionally: when
  // the client's batch happened to contain only 1 input (the send window
  // is driven by requestAnimationFrame, so the batch size oscillates
  // between 1 and 3), the server ran out of inputs and the player's
  // effective input rate dropped below the simulation rate. The player
  // slowed to a crawl and then stopped.
  for (let i = 0; i < SUB_STEPS; i++) {
    for (const p of players.values()) {
      const inp = p.inputBuffer.shift();
      if (inp) { p.input = inp; p.consumedSeq = inp.seq; }
      // moveCharacter() steps the physics world itself, so there is no
      // physics.step() here - doing both would advance the simulation twice
      // per sub-step and desynchronise the client.
      stepMovement(p.state, p.input, SUB_DT, physics);
    }
  }

  // projectiles
  for (const [id, p] of projectiles) {
    // Sweep the projectile against the static world so a rocket detonates
    // on a wall instead of sailing through it. The step is small enough that
    // a point test along the path is accurate enough.
    const stepLen = Math.hypot(p.vx, p.vy, p.vz) * SUB_DT;
    if (stepLen > 1e-4) {
      const hit = physics.raycast(
        p.x, p.y, p.z,
        p.vx / stepLen, p.vy / stepLen, p.vz / stepLen,
        stepLen, undefined
      );
      if (hit) {
        // Move the projectile to the impact point and detonate there.
        p.x += (p.vx / stepLen) * hit.t;
        p.y += (p.vy / stepLen) * hit.t;
        p.z += (p.vz / stepLen) * hit.t;
        projectiles.delete(id);
        detonate(p);
        continue;
      }
    }

    const boom = stepProjectile(p, SUB_DT, now, 0);
    if (boom) {
      projectiles.delete(id);
      detonate(p);
    }
  }

  const snap = { t: MSG.SNAPSHOT, tick: now, players: snapshotPlayers() };
  const msg = JSON.stringify(snap);
  for (const p of players.values()) {
    if (p.ws.readyState === 1) p.ws.send(msg);
  }
}

// ── boot ────────────────────────────────────────────────────────────────────

await initPhysics('deterministic');
physics = new PhysicsWorld();

server.listen(PORT, () => {
  console.log(`[neutralia] authoritative server on :${PORT}  tick=${Math.round(1000 / TICK_MS)}Hz  physics=${Math.round(1000 / TICK_MS) * SUB_STEPS}Hz  map=${MAP.name}`);
  console.log(`[neutralia] rapier=${physicsBuild()}  weapons=${WEAPON_IDS.join(',')}`);
});

setInterval(tick, TICK_MS);
