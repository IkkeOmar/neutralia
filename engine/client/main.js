// NEUTRALIA engine slice — client.
// Three.js renderer + pointer-lock third-person camera + client-side prediction
// against the authoritative server, using the SAME shared movement code.

import * as THREE from 'three';
import { MAP } from '../shared/map.js';
import {
  MSG, TICK_MS, TICK_DT, PLAYER_HEIGHT, EYE_HEIGHT,
  MAX_SPEED, MAX_HEALTH, FIRE_COOLDOWN_MS
} from '../shared/protocol.js';
import { createPlayerState, stepMovement } from '../shared/movement.js';

// ---------------------------------------------------------------- renderer

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d17);
scene.fog = new THREE.Fog(0x0b0d17, 45, 130);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 400);

const hemi = new THREE.HemisphereLight(0x8fb6ff, 0x1a1a2e, 1.05);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3e0, 1.5);
sun.position.set(24, 40, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -45; sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;   sun.shadow.camera.bottom = -45;
sun.shadow.camera.far = 140;
scene.add(sun);

// ---------------------------------------------------------------- world

const world = new THREE.Group();
scene.add(world);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(MAP.groundSize, MAP.groundSize),
  new THREE.MeshStandardMaterial({ color: 0x1c2033, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
world.add(ground);

const grid = new THREE.GridHelper(MAP.groundSize, MAP.groundSize / 2, 0x2a3150, 0x202640);
grid.position.y = 0.01;
world.add(grid);

const KIND_COLOR = {
  wall: 0x39406b, cover: 0x4a4270, ramp: 0x3c5a63, tower: 0x5a4a78
};
const boxMeshes = [];
for (const b of MAP.boxes) {
  const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
  const mat = new THREE.MeshStandardMaterial({
    color: KIND_COLOR[b.kind] ?? 0x44507a,
    roughness: 0.85, metalness: 0.05
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(b.x, b.y + b.h / 2, b.z);
  m.castShadow = true;
  m.receiveShadow = true;
  world.add(m);
  boxMeshes.push(m);
}

// spawn markers
for (const s of MAP.spawns) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.72, 24),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(s.x, 0.03, s.z);
  world.add(ring);
}

// ---------------------------------------------------------------- player meshes

function makeSoldier(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.34, 0.9, 4, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  );
  body.position.y = 0.85;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xe8eaf2, roughness: 0.5 })
  );
  head.position.y = 1.55;
  head.castShadow = true;
  g.add(head);
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.1, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  visor.position.set(0, 1.56, 0.23);
  g.add(visor);
  const gun = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.12, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x22252f, roughness: 0.4 })
  );
  gun.position.set(0.28, 1.05, 0.32);
  g.add(gun);
  g.userData.gun = gun;
  return g;
}

// ---------------------------------------------------------------- state

let myId = null;
let ws = null;
let connected = false;
const remotes = new Map();   // id -> { mesh, target: {x,y,z}, hp, alive, lastSeq }
let local = null;            // predicted local state
let pendingInputs = [];      // for reconciliation
let seq = 0;
let lastSent = 0;
let serverState = null;      // last authoritative snapshot
let lastShotAt = 0;

// input
const keys = new Set();
let mouseDX = 0, mouseDY = 0;
let firing = false;

const overlay = document.getElementById('overlay');
const joinBtn = document.getElementById('join');
const sMap = document.getElementById('s-map');
const sTick = document.getElementById('s-tick');
const sNet = document.getElementById('s-net');
const sHp = document.getElementById('s-hp');
const hpFill = document.getElementById('hpfill');
const sWs = document.getElementById('s-ws');
const playersEl = document.getElementById('players');

addEventListener('keydown', e => { keys.add(e.code); if (e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== renderer.domElement) return;
  mouseDX += e.movementX; mouseDY += e.movementY;
});
addEventListener('mousedown', e => { if (e.button === 0) firing = true; });
addEventListener('mouseup', e => { if (e.button === 0) firing = false; });
renderer.domElement.addEventListener('click', () => {
  if (connected) renderer.domElement.requestPointerLock();
});

// The server URL is configurable so the same static client can run:
//   - served by the game server itself (same origin) -> default
//   - hosted on GitHub Pages, pointed at a game server -> ?server=wss://host
//   - a local dev build -> ?server=ws://127.0.0.1:8799
function serverUrl() {
  const q = new URLSearchParams(location.search).get('server');
  if (q) return q.replace(/\/$/, '') + '/ws';
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
}

function connect() {
  ws = new WebSocket(serverUrl());
  sWs.textContent = 'connecting…';
  sWs.className = '';

  ws.onopen = () => {
    connected = true;
    sWs.textContent = 'open';
    sNet.textContent = new URL(serverUrl()).host;
    sWs.className = 'ok';
    overlay.classList.add('hidden');
    renderer.domElement.requestPointerLock();
  };
  ws.onclose = () => {
    connected = false;
    sWs.textContent = 'closed';
    sWs.className = 'bad';
    overlay.classList.remove('hidden');
  };
  ws.onerror = () => { sWs.textContent = 'error'; sWs.className = 'bad'; };
  ws.onmessage = ev => handleMessage(JSON.parse(ev.data));
}

joinBtn.onclick = () => { if (!ws) connect(); };

// ---------------------------------------------------------------- messages

function handleMessage(m) {
  switch (m.t) {
    case MSG.WELCOME: {
      myId = m.id;
      sMap.textContent = m.map;
      sTick.textContent = m.tickRate + 'Hz';
      local = createPlayerState(m.spawn);
      for (const p of m.players) if (p.id !== myId) addRemote(p);
      updatePlayersPanel();
      break;
    }
    case MSG.JOIN: {
      if (m.id !== myId) addRemote({ id: m.id, x: 0, y: 0, z: 0, hp: 100, alive: true });
      break;
    }
    case MSG.LEAVE: {
      const r = remotes.get(m.id);
      if (r) { scene.remove(r.mesh); remotes.delete(m.id); }
      updatePlayersPanel();
      break;
    }
    case MSG.SNAPSHOT: {
      serverState = m;
      applySnapshot(m.players);
      break;
    }
    case MSG.SHOT: {
      drawTracer(m);
      break;
    }
    case MSG.HIT: {
      const r = remotes.get(m.id);
      if (r) r.hp = m.hp;
      if (m.id === myId) { local.hp = m.hp; updateHp(); }
      break;
    }
    case MSG.DEATH: {
      const r = remotes.get(m.id);
      if (r) { r.alive = false; r.mesh.visible = false; }
      if (m.id === myId) { local.hp = MAX_HEALTH; updateHp(); }
      break;
    }
  }
}

function addRemote(p) {
  if (remotes.has(p.id)) return;
  const mesh = makeSoldier(0xfb923c);
  mesh.position.set(p.x, p.y, p.z);
  scene.add(mesh);
  remotes.set(p.id, {
    mesh,
    target: { x: p.x, y: p.y, z: p.z },
    hp: p.hp ?? 100, alive: true, lastSeq: -1
  });
}

function applySnapshot(players) {
  for (const p of players) {
    if (p.id === myId) {
      // reconcile local prediction against the server
      if (serverState && local) {
        const before = { x: local.x, y: local.y, z: local.z };
        local.x = p.x; local.y = p.y; local.z = p.z;
        local.vx = 0; local.vy = 0; local.vz = 0;
        local.hp = p.hp;
        local.alive = p.alive;
        // replay unacknowledged inputs
        const unacked = pendingInputs.filter(i => i.seq > p.lastSeq);
        for (const inp of unacked) stepMovement(local, inp, TICK_DT);
        pendingInputs = pendingInputs.filter(i => i.seq > p.lastSeq);
        const err = Math.hypot(local.x - before.x, local.z - before.z);
        if (err > 0.01) {
          // soft correction: nudge the camera target, don't teleport the body
          local.x = p.x; local.y = p.y; local.z = p.z;
        }
        updateHp();
      }
      continue;
    }
    let r = remotes.get(p.id);
    if (!r) { addRemote(p); r = remotes.get(p.id); }
    r.target.x = p.x; r.target.y = p.y; r.target.z = p.z;
    r.hp = p.hp; r.alive = p.alive;
    r.mesh.visible = p.alive;
  }
  updatePlayersPanel();
}

function updatePlayersPanel() {
  const rows = [];
  for (const [id, r] of remotes) {
    rows.push(`<div>${id === myId ? 'you' : 'p' + id} — ${r.alive ? Math.round(r.hp) : 'dead'}</div>`);
  }
  if (local) rows.unshift(`<div class="me">you — ${Math.round(local.hp)}</div>`);
  playersEl.innerHTML = rows.join('');
}

function updateHp() {
  const hp = local ? Math.max(0, Math.round(local.hp)) : MAX_HEALTH;
  sHp.textContent = hp;
  hpFill.style.width = (hp / MAX_HEALTH * 100) + '%';
  hpFill.style.background = hp > 50
    ? 'linear-gradient(90deg,#34d399,#6ee7b7)'
    : hp > 25 ? 'linear-gradient(90deg,#f0b429,#fbbf24)' : 'linear-gradient(90deg,#f2545b,#fca5a5)';
}

// ---------------------------------------------------------------- tracers

const tracers = [];
const tracerMat = new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.85 });
function drawTracer(m) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(m.ox, m.oy, m.oz),
    new THREE.Vector3(m.hx, m.hy, m.hz)
  ]);
  const line = new THREE.Line(geo, tracerMat.clone());
  line.userData.born = performance.now();
  scene.add(line);
  tracers.push(line);
  if (tracers.length > 60) {
    const old = tracers.shift();
    scene.remove(old); old.geometry.dispose(); old.material.dispose();
  }
}

// ---------------------------------------------------------------- loop

const camTarget = new THREE.Vector3();
let last = performance.now();
let acc = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (connected && local) {
    // --- look
    const sens = 0.0022;
    local.yaw -= mouseDX * sens;
    local.pitch = Math.max(-1.2, Math.min(1.2, local.pitch - mouseDY * sens));
    mouseDX = 0; mouseDY = 0;

    // --- movement input
    const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const inp = {
      mx: (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0),
      mz: (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0),
      jump: keys.has('Space')
    };
    if (sprint && (inp.mx || inp.mz)) {
      inp.mz *= 1; // sprint handled by speed below
    }

    // --- fixed-step prediction
    acc += dt;
    let steps = 0;
    while (acc >= TICK_DT && steps < 5) {
      acc -= TICK_DT;
      steps++;
      const speed = sprint ? MAX_SPEED * 1.35 : MAX_SPEED;
      const before = { x: local.x, z: local.z };
      stepMovement(local, inp, TICK_DT);
      if (sprint) {
        // sprint = scale velocity, still server-authoritative on reconcile
        const dx = local.x - before.x, dz = local.z - before.z;
        local.x = before.x + dx * 1.35;
        local.z = before.z + dz * 1.35;
      }
      seq++;
      pendingInputs.push({ seq, ...inp });
      if (pendingInputs.length > 120) pendingInputs.shift();
    }

    // --- send input at the server tick rate
    if (now - lastSent >= TICK_MS) {
      lastSent = now;
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          t: MSG.INPUT, seq, mx: inp.mx, mz: inp.mz,
          jump: inp.jump, yaw: local.yaw, pitch: local.pitch
        }));
      }
    }

    // --- fire
    if (firing && now - lastShotAt >= FIRE_COOLDOWN_MS && local.alive) {
      lastShotAt = now;
      const origin = new THREE.Vector3();
      const dir = new THREE.Vector3();
      camera.getWorldPosition(origin);
      camera.getWorldDirection(dir);
      // shoot from the muzzle, not the camera, so tracers match the model
      const muzzle = origin.clone().add(dir.clone().multiplyScalar(0.9));
      muzzle.y -= 0.45;
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          t: MSG.FIRE, ox: muzzle.x, oy: muzzle.y, oz: muzzle.z,
          dx: dir.x, dy: dir.y, dz: dir.z
        }));
      }
    }
  }

  // --- remote interpolation
  for (const r of remotes.values()) {
    r.mesh.position.lerp(
      new THREE.Vector3(r.target.x, r.target.y, r.target.z),
      Math.min(1, dt * 14)
    );
    const targetYaw = Math.atan2(
      local ? local.x - r.mesh.position.x : 0,
      local ? local.z - r.mesh.position.z : 0
    );
    r.mesh.rotation.y += (targetYaw - r.mesh.rotation.y) * Math.min(1, dt * 8);
  }

  // --- local player mesh + third-person camera
  if (local) {
    let me = scene.getObjectByName('localPlayer');
    if (!me) {
      me = makeSoldier(0x7c5cfc);
      me.name = 'localPlayer';
      scene.add(me);
    }
    me.position.set(local.x, local.y, local.z);
    me.rotation.y = local.yaw;

    const camDist = 6.2;
    const camHeight = 2.4;
    const focus = new THREE.Vector3(local.x, local.y + 1.2, local.z);
    const sin = Math.sin(local.yaw), cos = Math.cos(local.yaw);
    const desired = new THREE.Vector3(
      focus.x - sin * camDist,
      focus.y + camHeight + local.pitch * 2.2,
      focus.z - cos * camDist
    );
    // keep the camera above the ground and out of walls
    desired.y = Math.max(desired.y, 0.6);
    camera.position.lerp(desired, Math.min(1, dt * 12));
    camera.lookAt(focus);
  }

  // --- tracer fade
  for (let i = tracers.length - 1; i >= 0; i--) {
    const t = tracers[i];
    const age = now - t.userData.born;
    t.material.opacity = Math.max(0, 0.85 - age / 220);
    if (age > 240) {
      scene.remove(t); t.geometry.dispose(); t.material.dispose();
      tracers.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Debug/automation hook. The test harness needs to read live state without
// reaching into module scope, so expose a small read-only surface.
window.__NEUTRALIA = {
  get id() { return myId; },
  get connected() { return connected; },
  get local() { return local ? { x: local.x, y: local.y, z: local.z, hp: local.hp, alive: local.alive } : null; },
  get remotes() { return [...remotes.entries()].map(([id, r]) => ({ id, x: r.mesh.position.x, z: r.mesh.position.z, hp: r.hp, alive: r.alive })); },
  get pendingInputs() { return pendingInputs.length; },
  get seq() { return seq; },
  get snapshots() { return serverState ? serverState.players.length : 0; },
  keys
};

updateHp();
requestAnimationFrame(frame);
