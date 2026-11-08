// NEUTRALIA authoritative game server.
// Serves the built client and runs the authoritative simulation over WebSocket.
// The server owns positions, health and hit detection. Clients only ever send
// intent (movement axes + aim) and a fire ray to be validated.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

import { MAP } from '../shared/map.js';
import {
  MSG, TICK_MS, TICK_DT, MAX_PLAYERS, PLAYER_RADIUS, PLAYER_HEIGHT,
  FIRE_COOLDOWN_MS, DAMAGE_PER_HIT, WEAPON_RANGE, MAX_HEALTH
} from '../shared/protocol.js';
import { createPlayerState, stepMovement } from '../shared/movement.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'client', 'dist');
const PORT = Number(process.env.PORT || 8787);

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
const players = new Map();   // id -> player record
const bySocket = new Map(); // ws -> player record

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
    input: { mx: 0, mz: 0, jump: false },
    lastSeq: -1,
    lastFire: 0,
    name: `p${id}`
  };
  players.set(id, player);
  bySocket.set(ws, player);

  send(ws, MSG.WELCOME, {
    id,
    map: MAP.name,
    tickRate: Math.round(1000 / TICK_MS),
    maxHealth: MAX_HEALTH,
    spawn: { x: state.x, y: state.y, z: state.z, yaw: state.yaw },
    players: snapshotPlayers()
  });
  broadcast(MSG.JOIN, { id, name: player.name });

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (m.t === MSG.INPUT) {
      const s = Number(m.seq);
      if (!Number.isFinite(s) || s <= player.lastSeq) return; // stale/duplicate
      player.lastSeq = s;
      player.input = {
        mx: clamp(m.mx), mz: clamp(m.mz), jump: !!m.jump
      };
      if (Number.isFinite(m.yaw)) player.state.yaw = m.yaw;
      if (Number.isFinite(m.pitch)) player.state.pitch = m.pitch;
    } else if (m.t === MSG.FIRE) {
      handleFire(player, m);
    }
  });

  ws.on('close', () => {
    players.delete(id);
    bySocket.delete(ws);
    broadcast(MSG.LEAVE, { id });
  });
});

function clamp(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-1, Math.min(1, n));
}

// ---- hit detection -----------------------------------------------------------

function rayBox(ox, oy, oz, dx, dy, dz, b) {
  const minX = b.x - b.w / 2, maxX = b.x + b.w / 2;
  const minY = b.y, maxY = b.y + b.h;
  const minZ = b.z - b.d / 2, maxZ = b.z + b.d / 2;
  let tmin = 0, tmax = Infinity;
  const axes = [
    [ox, dx, minX, maxX],
    [oy, dy, minY, maxY],
    [oz, dz, minZ, maxZ]
  ];
  for (const [o, d, lo, hi] of axes) {
    if (Math.abs(d) < 1e-8) {
      if (o < lo || o > hi) return Infinity;
      continue;
    }
    let t1 = (lo - o) / d, t2 = (hi - o) / d;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  return tmin;
}

function rayCylinder(ox, oy, oz, dx, dy, dz, cx, cy, cz, r, h) {
  const px = ox - cx, pz = oz - cz;
  const a = dx * dx + dz * dz;
  if (a < 1e-8) return Infinity;
  const b = 2 * (px * dx + pz * dz);
  const c = px * px + pz * pz - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return Infinity;
  const sq = Math.sqrt(disc);
  let t = (-b - sq) / (2 * a);
  if (t < 0) t = (-b + sq) / (2 * a);
  if (t < 0) return Infinity;
  const y = oy + dy * t;
  if (y < cy || y > cy + h) return Infinity;
  return t;
}

function handleFire(player, m) {
  const now = Date.now();
  if (now - player.lastFire < FIRE_COOLDOWN_MS) return;
  const s = player.state;
  if (!s.alive) return;

  const ox = Number(m.ox), oy = Number(m.oy), oz = Number(m.oz);
  const dx = Number(m.dx), dy = Number(m.dy), dz = Number(m.dz);
  if (![ox, oy, oz, dx, dy, dz].every(Number.isFinite)) return;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return;
  const ndx = dx / len, ndy = dy / len, ndz = dz / len;

  player.lastFire = now;

  let best = Infinity;
  let victim = null;
  for (const b of MAP.boxes) {
    const t = rayBox(ox, oy, oz, ndx, ndy, ndz, b);
    if (t < best) best = t;
  }
  for (const other of players.values()) {
    if (other.id === player.id) continue;
    const o = other.state;
    if (!o.alive) continue;
    const t = rayCylinder(ox, oy, oz, ndx, ndy, ndz,
      o.x, o.y, o.z, PLAYER_RADIUS + 0.12, PLAYER_HEIGHT);
    if (t < best) { best = t; victim = other; }
  }

  const hx = ox + ndx * best, hy = oy + ndy * best, hz = oz + ndz * best;
  broadcast(MSG.SHOT, {
    id: player.id, ox, oy, oz, dx: ndx, dy: ndy, dz: ndz,
    hx, hy, hz, hit: !!victim
  });

  if (victim) {
    victim.state.hp -= DAMAGE_PER_HIT;
    if (victim.state.hp <= 0) {
      victim.state.hp = 0;
      victim.state.alive = false;
      broadcast(MSG.DEATH, { id: victim.id, by: player.id });
      const idx = spawnPoint();
      victim.spawnIndex = idx;
      const sp = MAP.spawns[idx];
      victim.state.x = sp.x; victim.state.y = 0; victim.state.z = sp.z;
      victim.state.yaw = sp.yaw || 0;
      victim.state.vx = 0; victim.state.vy = 0; victim.state.vz = 0;
      victim.state.alive = true;
      victim.state.hp = MAX_HEALTH;
    }
    broadcast(MSG.HIT, {
      id: victim.id, by: player.id, dmg: DAMAGE_PER_HIT,
      hp: victim.state.hp, hx, hy, hz
    });
  }
}

// ---- tick loop ----------------------------------------------------------------

function snapshotPlayers() {
  return [...players.values()].map(p => ({
    id: p.id, x: p.state.x, y: p.state.y, z: p.state.z,
    yaw: p.state.yaw, hp: p.state.hp, alive: p.state.alive,
    lastSeq: p.lastSeq
  }));
}

setInterval(() => {
  for (const p of players.values()) {
    stepMovement(p.state, p.input, TICK_DT);
  }
  const snap = { t: MSG.SNAPSHOT, tick: Date.now(), players: snapshotPlayers() };
  const msg = JSON.stringify(snap);
  for (const p of players.values()) {
    if (p.ws.readyState === 1) p.ws.send(msg);
  }
}, TICK_MS);

server.listen(PORT, () => {
  console.log(`[neutralia] authoritative server on :${PORT}  tick=${Math.round(1000 / TICK_MS)}Hz  map=${MAP.name}`);
});
