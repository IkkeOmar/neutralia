import { initPhysics, PhysicsWorld } from '../shared/physics.js';
await initPhysics('standard');
const w = new PhysicsWorld();
w.addCharacter(1, -24, 0.01, -24);
w.step();

// Enumerate every collider in the world and find what the ray touches.
const world = w.world;
let n = 0;
world.forEachCollider((col) => {
  n++;
  const h = col.handle;
  const parent = col.parent();
  const bodyType = parent ? parent.bodyType() : 'none';
  const t = col.translation();
  const shape = col.shape;
  const type = shape ? shape.type : '?';
  console.log(`collider ${h}: type=${type} bodyType=${bodyType} translation=(${t.x.toFixed(3)}, ${t.y.toFixed(3)}, ${t.z.toFixed(3)})`);
});
console.log('total colliders:', n);
