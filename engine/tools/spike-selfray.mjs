import { initPhysics, PhysicsWorld } from '../shared/physics.js';
import { PLAYER_HEIGHT } from '../shared/protocol.js';

await initPhysics('standard');
const w = new PhysicsWorld();

// One player at the spawn, exactly as the server would have it.
w.addCharacter(1, -24, 0.01, -24);
w.step();

// The muzzle: eye height, 0.28 m to the right, 0.6 m along a -1.2 rad pitch.
const EYE = 1.55, pitch = -1.2, yaw = 0;
const aim = { x: Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: Math.cos(yaw) * Math.cos(pitch) };
const right = { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
const muzzle = {
  x: -24 + right.x * 0.28 + aim.x * 0.6,
  y: 0.01 + EYE + right.y * 0.28 + aim.y * 0.6,
  z: -24 + right.z * 0.28 + aim.z * 0.6
};
console.log('muzzle:', JSON.stringify(muzzle));

// The rocket's first sub-step raycast, exactly as the server does it.
const speed = 42, SUB_DT = 1 / 60;
const stepLen = speed * SUB_DT;
const vx = aim.x * speed, vy = aim.y * speed, vz = aim.z * speed;
console.log('stepLen:', stepLen.toFixed(4), 'dir:', (vx/stepLen).toFixed(4), (vy/stepLen).toFixed(4), (vz/stepLen).toFixed(4));

const hit = w.raycast(muzzle.x, muzzle.y, muzzle.z, vx/stepLen, vy/stepLen, vz/stepLen, stepLen, undefined);
console.log('static raycast hit:', hit ? `t=${hit.t.toFixed(6)} colliderHandle=${hit.collider.handle}` : 'none');

// Is the muzzle inside the player's own capsule?
const ch = w.raycastCharacters(muzzle.x, muzzle.y, muzzle.z, vx/stepLen, vy/stepLen, vz/stepLen, stepLen, undefined);
console.log('character raycast (no exclusion):', ch ? `id=${ch.id} t=${ch.t.toFixed(6)}` : 'none');

// And the ray the way the OLD code called it, with the shooter's id excluded.
const hit2 = w.raycast(muzzle.x, muzzle.y, muzzle.z, vx/stepLen, vy/stepLen, vz/stepLen, stepLen, 1);
console.log('static raycast with excludeId=1:', hit2 ? `t=${hit2.t.toFixed(6)}` : 'none');

// Step the projectile the way the server does and see where it dies.
console.log('');
console.log('=== stepping the projectile ===');
let p = { x: muzzle.x, y: muzzle.y, z: muzzle.z, vx, vy, vz };
for (let i = 0; i < 12; i++) {
  const sl = Math.hypot(p.vx, p.vy, p.vz) * SUB_DT;
  const h = w.raycast(p.x, p.y, p.z, p.vx/sl, p.vy/sl, p.vz/sl, sl, undefined);
  if (h) {
    p.x += (p.vx/sl) * h.t; p.y += (p.vy/sl) * h.t; p.z += (p.vz/sl) * h.t;
    console.log(`  step ${i}: HIT at t=${h.t.toFixed(6)} -> (${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`);
    break;
  }
  p.vy -= 22 * SUB_DT;
  p.x += p.vx * SUB_DT; p.y += p.vy * SUB_DT; p.z += p.vz * SUB_DT;
  console.log(`  step ${i}: no hit -> (${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`);
  if (p.y <= 0) { console.log('  ground reached'); break; }
}
