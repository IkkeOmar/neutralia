import { initPhysics, PhysicsWorld } from '../shared/physics.js';

await initPhysics('standard');
const w = new PhysicsWorld();

// Two characters, exactly like the integration test.
w.addCharacter(1, -24, 0, -24);
w.addCharacter(2,  24, 0, -24);
w.step();

// The test aims from A's position at +1.5 height toward B at +1.0.
const ox = -24, oy = 1.5, oz = -24;
const tx =  24, ty = 1.0, tz = -24;
const dx = tx-ox, dy = ty-oy, dz = tz-oz;
const len = Math.hypot(dx,dy,dz);
const ndx=dx/len, ndy=dy/len, ndz=dz/len;

console.log('ray from', ox, oy, oz, 'dir', ndx.toFixed(4), ndy.toFixed(4), ndz.toFixed(4));

const wh = w.raycast(ox, oy, oz, ndx, ndy, ndz, 120, 1);
console.log('world hit:', wh ? wh.t.toFixed(4) : 'none');

const ch = w.raycastCharacters(ox, oy, oz, ndx, ndy, ndz, 120, 1);
console.log('character hit:', ch ? JSON.stringify({id: ch.id, t: ch.t.toFixed(4)}) : 'none');

// What does a ray straight at B's chest hit?
const ch2 = w.raycastCharacters(tx, 1.0, tz, 0, 0, 1, 10, 1);
console.log('reverse ray from B:', ch2 ? JSON.stringify({id: ch2.id, t: ch2.t.toFixed(4)}) : 'none');

// Check the character colliders exist and where they are.
console.log('\ncharacter colliders:');
for (const [id, rec] of w.characters) {
  const t = rec.body.translation();
  const shape = rec.collider.shape;
  console.log(`  id=${id} body=(${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)}) shape=${shape.type} halfHeight=${shape.halfHeight} radius=${shape.radius}`);
}

// Does a ray at B's exact chest height, aimed at B, hit?
const direct = w.raycastCharacters(tx - 5, 1.0, tz, 1, 0, 0, 10, 1);
console.log('\nray from 5m away at chest height:', direct ? JSON.stringify({id: direct.id, t: direct.t.toFixed(4)}) : 'none');

// What about the pelvis height (0.9)?
const pelvis = w.raycastCharacters(tx - 5, 0.9, tz, 1, 0, 0, 10, 1);
console.log('ray at pelvis height (0.9):', pelvis ? JSON.stringify({id: pelvis.id, t: pelvis.t.toFixed(4)}) : 'none');

// Ground level?
const groundLvl = w.raycastCharacters(tx - 5, 0.1, tz, 1, 0, 0, 10, 1);
console.log('ray at 0.1:', groundLvl ? JSON.stringify({id: groundLvl.id, t: groundLvl.toFixed?.(4) ?? groundLvl.t.toFixed(4)}) : 'none');
