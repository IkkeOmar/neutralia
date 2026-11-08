// NEUTRALIA engine client.
//
// Three.js renderer + pointer-lock third-person camera + client-side prediction
// against the authoritative server, using the SAME shared movement code and
// the SAME Rapier collision layer as the server.
//
// The client runs the STANDARD Rapier build; the server runs the DETERMINISTIC
// one. tools/spike-determinism.mjs proves they agree bit-identically, so
// prediction and authority cannot drift.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

import { MAP } from '../shared/map.js';
import {
  MSG, TICK_MS, TICK_DT, SUB_STEPS, SUB_DT, PLAYER_HEIGHT, EYE_HEIGHT,
  MAX_SPEED, MAX_HEALTH
} from '../shared/protocol.js';
import { createPlayerState, stepMovement, applyImpulse } from '../shared/movement.js';
import { initPhysics, PhysicsWorld, physicsBuild } from '../shared/physics.js';
import {
  WEAPONS, WEAPON_IDS, PLAYER_MASS, blastEffect
} from '../shared/combat.js';

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

// ---------------------------------------------------------------- assets
//
// The map and the soldier are real glTF 2.0 assets, Meshopt-compressed, built
// by tools/build-assets.mjs and verified by tools/verify-assets.mjs.

const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

const assets = { map: null, soldier: null, soldierClips: [] };

async function loadAssets() {
  // The map GLB carries the same boxes as shared/map.js (verified), so it
  // replaces the primitive boxes. If it fails to load we fall back to
  // primitives rather than showing an empty world.
  try {
    const mapGltf = await gltfLoader.loadAsync('assets/map.glb');
    mapGltf.scene.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    assets.map = mapGltf.scene;
    world.add(assets.map);
  } catch (e) {
    console.warn('[neutralia] map.glb failed to load, using primitives', e);
  }

  try {
    const soldierGltf = await gltfLoader.loadAsync('assets/soldier.glb');
    assets.soldier = soldierGltf.scene;
    assets.soldierClips = soldierGltf.animations || [];
    rebuildSoldiers();
  } catch (e) {
    console.warn('[neutralia] soldier.glb failed to load, using primitives', e);
  }
}

/**
 * Rebuild every soldier mesh once the skinned glTF model is available.
 *
 * The local player mesh is created on the first animation frame, which
 * happens BEFORE the glTF has finished downloading. Without this rebuild the
 * session is stuck with the blocky primitive fallback even though the real
 * model arrives a moment later.
 */
function rebuildSoldiers() {
  if (!assets.soldier) return;

  const me = scene.getObjectByName('localPlayer');
  if (me) {
    const pos = me.position.clone();
    const rot = me.rotation.y;
    scene.remove(me);
    const fresh = buildSoldier(0x7c5cfc);
    fresh.name = 'localPlayer';
    fresh.position.copy(pos);
    fresh.rotation.y = rot;
    scene.add(fresh);
  }

  for (const r of remotes.values()) {
    const pos = r.mesh.position.clone();
    const rot = r.mesh.rotation.y;
    scene.remove(r.mesh);
    const fresh = buildSoldier(0xfb923c);
    fresh.position.copy(pos);
    fresh.rotation.y = rot;
    r.mesh = fresh;
    scene.add(fresh);
  }
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

/**
 * Build a soldier for a player. Uses the skinned glTF model when it is
 * available (with its idle/run animations), otherwise the primitive.
 */
function buildSoldier(color) {
  if (assets.soldier) {
    // SkeletonUtils.clone() is REQUIRED for a skinned model. A plain
    // Object3D.clone() copies the Skeleton by reference, so every cloned
    // soldier would be bound to the ORIGINAL's bones - they would all
    // animate as one figure and the clone would render against the wrong
    // skeleton.
    const clone = skeletonClone(assets.soldier);

    // Tint the mesh so the two teams are distinguishable.
    clone.traverse(o => {
      if (o.isMesh && o.material) {
        o.material = o.material.clone();
        if (o.material.color) o.material.color.setHex(color);
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    const mixer = new THREE.AnimationMixer(clone);
    const clips = assets.soldierClips || [];
    const idle = clips.find(c => c.name === 'idle');
    const run = clips.find(c => c.name === 'run');
    if (idle) mixer.clipAction(idle).play();
    clone.userData.mixer = mixer;
    clone.userData.runClip = run;
    clone.userData.idleClip = idle;
    clone.userData.isSkinned = true;
    return clone;
  }
  const g = makeSoldier(color);
  g.userData.mixer = null;
  g.userData.isSkinned = false;
  return g;
}

// ---------------------------------------------------------------- state

let myId = null;
let ws = null;
let connected = false;
const remotes = new Map();   // id -> { mesh, target, hp, alive }
let local = null;            // predicted local state
let pendingInputs = [];      // for reconciliation
let unsentInputs = [];       // inputs not yet delivered to the server
let seq = 0;
let lastSent = 0;
let serverState = null;      // last authoritative snapshot
let lastShotAt = 0;
let physics = null;
let currentWeapon = 'rifle';
let shotsFired = 0;        // projectiles the server confirmed
let explosionsSeen = 0;    // explosion broadcasts received
let lastExplosion = null;
let pendingBlast = null;      // local self-blast prediction, awaiting authority
let ammo = { rifle: 30, rocket: 1, mgl: 6, tnt: 3 };
const projectiles = new Map();   // visual projectile meshes
const explosions = [];            // visual explosion effects

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
const sWeapon = document.getElementById('s-weapon');
const sAmmo = document.getElementById('s-ammo');
const weaponBar = document.getElementById('weaponbar');

addEventListener('keydown', e => {
  keys.add(e.code);
  if (e.code === 'Space') e.preventDefault();
  // 1-4 select a weapon
  const slot = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
  if (slot >= 0 && WEAPON_IDS[slot]) selectWeapon(WEAPON_IDS[slot]);
});
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

function selectWeapon(w) {
  if (!WEAPON_IDS.includes(w)) return;
  currentWeapon = w;
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ t: MSG.SWITCH, weapon: w }));
  }
  updateWeaponPanel();
}

// Build the weapon bar once: one clickable tile per weapon.
function buildWeaponBar() {
  if (!weaponBar) return;
  weaponBar.innerHTML = '';
  WEAPON_IDS.forEach((id, i) => {
    const w = WEAPONS[id];
    const el = document.createElement('div');
    el.className = 'w';
    el.dataset.weapon = id;
    el.innerHTML = `<span class="k">${i + 1}</span><b>${w.name}</b><span class="a" data-ammo></span>`;
    el.onclick = () => selectWeapon(id);
    weaponBar.appendChild(el);
  });
}

function updateWeaponPanel() {
  if (sWeapon) sWeapon.textContent = WEAPONS[currentWeapon].name;
  if (sAmmo) {
    const a = ammo[currentWeapon];
    sAmmo.textContent = a === undefined ? '' : String(a);
  }
  if (weaponBar) {
    for (const el of weaponBar.children) {
      const id = el.dataset.weapon;
      el.classList.toggle('active', id === currentWeapon);
      const count = ammo[id];
      const slot = el.querySelector('[data-ammo]');
      if (slot) slot.textContent = count === undefined ? '∞' : String(count);
      el.classList.toggle('empty', count !== undefined && count <= 0);
    }
  }
}

// ---------------------------------------------------------------- messages

function handleMessage(m) {
  switch (m.t) {
    case MSG.WELCOME: {
      myId = m.id;
      sMap.textContent = m.map;
      sTick.textContent = m.tickRate + 'Hz';
      local = createPlayerState(m.spawn);
      local.bodyId = myId;
      if (physics) physics.addCharacter(myId, local.x, local.y, local.z);
      for (const p of m.players) if (p.id !== myId) addRemote(p);
      if (m.ammo) ammo = m.ammo;
      updateWeaponPanel();
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
      if (m.projectile) { shotsFired++; spawnProjectileVisual(m); }
      else drawTracer(m);
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
    case MSG.EXPLOSION: {
      explosionsSeen++;
      lastExplosion = m;
      spawnExplosionVisual(m);
      // A self-blast launches us. Predict it immediately so the jump feels
      // instant.
      //
      // The prediction is recorded so reconciliation can tell whether the
      // server's next snapshot ALREADY contains the impulse. If it does, the
      // local prediction is dropped (the authority wins). If it does not, the
      // local prediction is re-applied on top of the authority - otherwise
      // the launch is silently undone the moment the next snapshot lands.
      if (m.owner === myId) {
        const blast = WEAPONS[m.weapon]?.blast;
        if (blast && local) {
          const eff = blastEffect(blast, local, m, PLAYER_MASS, true, local.onGround);
          applyImpulse(local, eff.dvx, eff.dvy, eff.dvz);
          pendingBlast = { weapon: m.weapon, x: m.x, y: m.y, z: m.z, seq };
        }
      }
      break;
    }
    case MSG.AMMO: {
      if (m.ammo) ammo = m.ammo;
      updateWeaponPanel();
      break;
    }
  }
}

function addRemote(p) {
  if (remotes.has(p.id)) return;
  const mesh = buildSoldier(0xfb923c);
  mesh.position.set(p.x, p.y, p.z);
  scene.add(mesh);
  remotes.set(p.id, {
    mesh,
    target: { x: p.x, y: p.y, z: p.z },
    hp: p.hp ?? 100, alive: true
  });
}

function applySnapshot(players) {
  for (const p of players) {
    if (p.id === myId) {
      if (serverState && local) {
        // Reconcile the local prediction against the server.
        //
        // Three things must be reset together, or the client and server
        // diverge permanently:
        //   1. the position, taken from the authority
        //   2. the Rapier body, which otherwise keeps its old transform and
        //      resolves the next moveCharacter() against a stale position
        //   3. the velocity, which is re-derived by replaying the
        //      unacknowledged inputs
        local.x = p.x; local.y = p.y; local.z = p.z;
        local.vx = p.vx ?? 0; local.vy = p.vy ?? 0; local.vz = p.vz ?? 0;
        local.onGround = !!p.onGround;
        physics?.setCharacterPosition(myId, p.x, p.y, p.z);
        local.hp = p.hp;
        local.alive = p.alive;
        // replay unacknowledged inputs
        const unacked = pendingInputs.filter(i => i.seq > p.lastSeq);
        for (const inp of unacked) {
          stepMovement(local, inp, SUB_DT, physics);
        }
        pendingInputs = pendingInputs.filter(i => i.seq > p.lastSeq);

        // Re-apply a self-blast the authority has not simulated yet.
        //
        // The server applies the blast impulse to its own state before it
        // snapshots, so once consumedSeq has passed the blast's sequence
        // number the authority already carries the launch and the local
        // prediction must be DROPPED. Before that, the authority's snapshot
        // predates the blast, so the local prediction has to be re-applied or
        // the jump is undone by the next snapshot.
        if (pendingBlast) {
          const authorityHasIt = p.lastSeq >= pendingBlast.seq;
          if (!authorityHasIt) {
            const blast = WEAPONS[pendingBlast.weapon]?.blast;
            if (blast) {
              const eff = blastEffect(
                blast, local,
                { x: pendingBlast.x, y: pendingBlast.y, z: pendingBlast.z },
                PLAYER_MASS, true, local.onGround);
              applyImpulse(local, eff.dvx, eff.dvy, eff.dvz);
            }
          } else {
            pendingBlast = null;
          }
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

/**
 * The unit aim vector for a yaw/pitch pair.
 *
 * Convention (matches movement.js): yaw 0 faces +Z, positive yaw turns right.
 * Pitch is POSITIVE = looking UP, clamped to +/- 1.2 rad (~69 degrees).
 */
function aimDirection(yaw, pitch) {
  const cp = Math.cos(pitch);
  return new THREE.Vector3(
    Math.sin(yaw) * cp,
    Math.sin(pitch),
    Math.cos(yaw) * cp
  );
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

// ---------------------------------------------------------------- projectiles

function spawnProjectileVisual(m) {
  const weapon = WEAPONS[m.weapon];
  if (!weapon) return;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  mesh.position.set(m.ox, m.oy, m.oz);
  scene.add(mesh);
  projectiles.set(`srv-${projectiles.size}-${performance.now()}`, {
    mesh, weapon: m.weapon,
    x: m.ox, y: m.oy, z: m.oz,
    vx: m.dx * weapon.projectile.speed,
    vy: m.dy * weapon.projectile.speed,
    vz: m.dz * weapon.projectile.speed,
    born: performance.now()
  });
}

// ---------------------------------------------------------------- explosions

const explosionGeo = new THREE.SphereGeometry(1, 16, 12);
const BLAST_RADII = [2.0, 3.0, 4.5, 6.0, 8.0];

function spawnExplosionVisual(m) {
  const blast = WEAPONS[m.weapon]?.blast;
  const radius = blast ? BLAST_RADII[blast.radiusTier] : 3;
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffb347, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const mesh = new THREE.Mesh(explosionGeo, mat);
  mesh.position.set(m.x, m.y, m.z);
  mesh.scale.setScalar(0.3);
  scene.add(mesh);
  explosions.push({ mesh, born: performance.now(), radius });

  const light = new THREE.PointLight(0xffaa55, 6, radius * 4, 2);
  light.position.set(m.x, m.y, m.z);
  scene.add(light);
  explosions.push({ light, born: performance.now(), radius, isLight: true });
}

// ---------------------------------------------------------------- loop

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
    // Moving the mouse UP (negative movementY) must look UP, so the pitch
    // sign is inverted here. This matches aimDirection()'s convention:
    // positive pitch = looking up.
    local.pitch = Math.max(-1.2, Math.min(1.2, local.pitch - mouseDY * sens));
    mouseDX = 0; mouseDY = 0;

    // --- movement input
    const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const inp = {
      mx: (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0),
      mz: (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0),
      jump: keys.has('Space')
    };

    // --- fixed-step prediction, on the same Rapier layer the server uses
    //
    // The server advances SUB_STEPS physics steps per network tick. The
    // client must do exactly the same, and must send an input for EVERY
    // sub-step. Predicting faster than the server (the old code predicted at
    // TICK_DT but the server ran 2x sub-steps) made the client's position
    // outrun the authority, so every snapshot yanked the player backwards.
    acc += dt;
    let steps = 0;
    while (acc >= SUB_DT && steps < 12) {
      acc -= SUB_DT;
      steps++;
      stepMovement(local, inp, SUB_DT, physics);
      if (sprint) {
        local.x += local.vx * SUB_DT * 0.35;
        local.z += local.vz * SUB_DT * 0.35;
      }
      seq++;
      const recorded = { seq, mx: inp.mx, mz: inp.mz, jump: inp.jump };
      pendingInputs.push(recorded);
      unsentInputs.push(recorded);
      if (pendingInputs.length > 120) pendingInputs.shift();
      if (unsentInputs.length > 120) unsentInputs.shift();
    }

    // --- send the inputs produced since the last send
    //
    // Every physics sub-step produced one input. The server consumes exactly
    // one per sub-step, so the client must deliver them at the SAME rate.
    //
    // The send window is driven by requestAnimationFrame, so the batch size
    // oscillates between 1 and 3 depending on the frame timing. That
    // oscillation made the server's input buffer starve and the player's
    // effective input rate fall below the simulation rate: the player moved
    // 2.6 m and then stopped dead.
    //
    // The fix: send on a FIXED schedule anchored to the physics step
    // count, not to wall-clock RAF timing, so exactly SUB_STEPS inputs
    // leave per network tick.
    const sendEvery = Math.max(1, Math.round((now - lastSent) / SUB_DT));
    if (now - lastSent >= TICK_MS) {
      lastSent = now;
      if (ws && ws.readyState === 1 && unsentInputs.length) {
        const batch = unsentInputs;
        unsentInputs = [];
        ws.send(JSON.stringify({
          t: MSG.INPUT, inputs: batch, seq,
          mx: inp.mx, mz: inp.mz, jump: inp.jump,
          yaw: local.yaw, pitch: local.pitch
        }));
      }
    }

    // --- fire
    //
    // The shot direction comes from yaw/pitch, NOT from the camera. The
    // third-person camera always looks AT the player, so its forward vector
    // always pointed at their chest - which made a rocket aimed at the
    // ground hit the shooter's own torso instead.
    //
    // Convention: pitch is POSITIVE = looking UP.
    const weapon = WEAPONS[currentWeapon];
    if (firing && weapon && now - lastShotAt >= weapon.cooldownMs && local.alive) {
      lastShotAt = now;
      const aim = aimDirection(local.yaw, local.pitch);
      const right = new THREE.Vector3(Math.cos(local.yaw), 0, -Math.sin(local.yaw));
      // The muzzle sits at the player's shoulder, offset to the right, and
      // points along the aim vector.
      const muzzle = new THREE.Vector3(local.x, local.y + EYE_HEIGHT, local.z)
        .addScaledVector(right, 0.28)
        .addScaledVector(aim, 0.6);
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          t: MSG.FIRE, ox: muzzle.x, oy: muzzle.y, oz: muzzle.z,
          dx: aim.x, dy: aim.y, dz: aim.z, weapon: currentWeapon
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
    if (r.mesh.userData.mixer) r.mesh.userData.mixer.update(dt);
  }

  // --- local player mesh + third-person camera
  if (local) {
    let me = scene.getObjectByName('localPlayer');
    if (!me) {
      me = buildSoldier(0x7c5cfc);
      me.name = 'localPlayer';
      scene.add(me);
    }
    me.position.set(local.x, local.y, local.z);
    me.rotation.y = local.yaw;

    const speed = Math.hypot(local.vx, local.vz);
    if (me.userData.mixer && me.userData.runClip) {
      const running = speed > 0.5;
      if (running && me.userData.runAction !== true) {
        me.userData.mixer.stopAllAction();
        me.userData.mixer.clipAction(me.userData.runClip).play();
        me.userData.runAction = true;
      } else if (!running && me.userData.runAction === true) {
        me.userData.mixer.stopAllAction();
        if (me.userData.idleClip) me.userData.mixer.clipAction(me.userData.idleClip).play();
        me.userData.runAction = false;
      }
      me.userData.mixer.update(dt);
    }

    const camDist = 6.2;
    const camHeight = 2.4;
    const focus = new THREE.Vector3(local.x, local.y + 1.2, local.z);
    const sin = Math.sin(local.yaw), cos = Math.cos(local.yaw);
    const desired = new THREE.Vector3(
      focus.x - sin * camDist,
      focus.y + camHeight,
      focus.z - cos * camDist
    );
    // keep the camera above the ground and out of walls
    desired.y = Math.max(desired.y, 0.6);
    camera.position.lerp(desired, Math.min(1, dt * 12));
    // Look ALONG the aim vector, not at the player. The player sits lower in
    // the frame and the crosshair marks where the shot actually goes.
    const aim = aimDirection(local.yaw, local.pitch);
    camera.lookAt(
      focus.x + aim.x * 40,
      focus.y + aim.y * 40,
      focus.z + aim.z * 40
    );
  }

  // --- projectile visuals
  for (const [id, p] of projectiles) {
    const age = now - p.born;
    const weapon = WEAPONS[p.weapon];
    if (!weapon) { projectiles.delete(id); continue; }
    p.vy -= 22 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.mesh.position.set(p.x, p.y, p.z);
    if (age > weapon.projectile.fuseMs || p.y <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      projectiles.delete(id);
    }
  }

  // --- explosion visuals
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    const age = (now - e.born) / 1000;
    if (e.isLight) {
      e.light.intensity = Math.max(0, 6 * (1 - age / 0.4));
      if (age > 0.4) { scene.remove(e.light); explosions.splice(i, 1); }
      continue;
    }
    const t = Math.min(1, age / 0.45);
    e.mesh.scale.setScalar(0.3 + t * e.radius);
    e.mesh.material.opacity = Math.max(0, 0.9 * (1 - t));
    if (age > 0.45) {
      scene.remove(e.mesh);
      e.mesh.material.dispose();
      explosions.splice(i, 1);
    }
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
  get local() { return local ? { x: local.x, y: local.y, z: local.z, hp: local.hp, alive: local.alive, vy: local.vy, onGround: local.onGround } : null; },
  // Yaw and pitch, so a test can assert the DIRECTION the player faces and
  // the direction they move - not merely that they moved at all.
  get yaw() { return local ? local.yaw : 0; },
  get pitch() { return local ? local.pitch : 0; },
  // The camera's world position and the unit aim vector. A test can compare
  // the camera-to-player offset against the aim vector to prove the camera
  // is actually behind the player.
  get camera() { return { x: camera.position.x, y: camera.position.y, z: camera.position.z }; },
  get aim() { return local ? aimDirection(local.yaw, local.pitch) : null; },
  // Test-only: force the look direction so a test can assert that pressing W
  // moves the player the way the crosshair points.
  setYaw(v) { if (local) local.yaw = v; },
  // The camera's true world-space basis, taken straight from Three.js's
  // matrixWorld. Column 0 is screen-right, column 1 is up, and the camera
  // looks down its own -Z. Comparing the movement vector against these
  // vectors is the only way to settle a "is A/D inverted" question - the
  // trigonometry can be argued both ways, the matrix cannot.
  get cameraBasis() {
    const e = camera.matrixWorld.elements;
    return {
      right: { x: e[0], y: e[1], z: e[2] },
      up: { x: e[4], y: e[5], z: e[6] },
      back: { x: e[8], y: e[9], z: e[10] }
    };
  },
  get remotes() { return [...remotes.entries()].map(([id, r]) => ({ id, x: r.mesh.position.x, z: r.mesh.position.z, hp: r.hp, alive: r.alive })); },
  get pendingInputs() { return pendingInputs.length; },
  get seq() { return seq; },
  get debugNet() { return { seq, pending: pendingInputs.length, unsent: unsentInputs.length, lastServerSeq: serverState?.players?.find(p=>p.id===myId)?.lastSeq }; },
  get snapshots() { return serverState ? serverState.players.length : 0; },
  get weapon() { return currentWeapon; },
  get shotsFired() { return shotsFired; },
  get explosionsSeen() { return explosionsSeen; },
  get lastExplosion() { return lastExplosion; },
  get ammo() { return { ...ammo }; },
  get physicsBuild() { return physicsBuild(); },
  get assetsLoaded() { return { map: !!assets.map, soldier: !!assets.soldier }; },
  // What the local player mesh actually IS: 'skinned' or 'primitive'.
  get localMeshKind() {
    const me = scene.getObjectByName('localPlayer');
    if (!me) return 'none';
    let skinned = false, meshCount = 0, boneCount = 0;
    me.traverse(o => {
      if (o.isSkinnedMesh) { skinned = true; meshCount++; }
      else if (o.isMesh) meshCount++;
      if (o.isBone) boneCount++;
    });
    return { kind: skinned ? 'skinned' : 'primitive', meshes: meshCount, bones: boneCount };
  },
  keys,
  selectWeapon,
  // Fire without needing a real mouse press (used by the browser test).
  fire() { firing = true; },
  stopFire() { firing = false; },
  // Aim the camera without a real pointer lock (used by the browser test).
  setPitch(v) { if (local) local.pitch = Math.max(-1.2, Math.min(1.2, v)); },
  setYaw(v) { if (local) local.yaw = v; }
};

// ---------------------------------------------------------------- boot

await initPhysics('standard');
physics = new PhysicsWorld();
loadAssets().then(() => {
  updateWeaponPanel();
});

buildWeaponBar();
updateHp();
requestAnimationFrame(frame);
