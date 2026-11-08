import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();

const world = new RAPIER.World({ x: 0, y: -22, z: 0 });
const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
world.createCollider(RAPIER.ColliderDesc.cuboid(32, 0.5, 32).setTranslation(0, -0.5, 0), ground);

const HALF = 0.5, RAD = 0.4;
const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 5, 0));
const col = world.createCollider(RAPIER.ColliderDesc.capsule(HALF, RAD), body);

console.log('collider shape:', col.shape.type, 'halfHeight=', col.shape.halfHeight, 'radius=', col.shape.radius);
console.log('capsule total height =', 2*HALF + 2*RAD);

const ctrl = world.createCharacterController(0.02);
console.log('\ncontroller defaults:');
console.log('  offset =', ctrl.offset);
console.log('  autostep =', ctrl.autostepEnabled, 'maxHeight =', ctrl.autostepMaxHeight);
console.log('  maxSlopeClimbAngle =', ctrl.maxSlopeClimbAngle);
console.log('  snapToGround =', ctrl.snapToGroundEnabled, 'dist =', ctrl.snapToGroundDistance);
console.log('  slideEnabled =', ctrl.slideEnabled);
console.log('  applyImpulses =', ctrl.applyImpulsesToDynamicBodies);
console.log('  characterMass =', ctrl.characterMass);
console.log('  up =', ctrl.up);

// fall, printing trajectory
console.log('\n--- fall trajectory (dy=-0.2/step) ---');
for (let i = 0; i < 12; i++) {
  ctrl.computeColliderMovement(col, { x: 0, y: -0.2, z: 0 });
  const mv = ctrl.computedMovement();
  const t = body.translation();
  body.setNextKinematicTranslation({ x: t.x + mv.x, y: t.y + mv.y, z: t.z + mv.z });
  world.step();
  const nt = body.translation();
  console.log(`  step ${String(i).padStart(2)}: y=${nt.y.toFixed(4)} mv.y=${mv.y.toFixed(4)} grounded=${ctrl.computedGrounded()} collisions=${ctrl.numComputedCollisions()}`);
}

console.log('\n--- try snapToGround disabled, offset variants ---');
for (const off of [0.01, 0.02, 0.05]) {
  const w2 = new RAPIER.World({ x: 0, y: -22, z: 0 });
  const g2 = w2.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  w2.createCollider(RAPIER.ColliderDesc.cuboid(32, 0.5, 32).setTranslation(0, -0.5, 0), g2);
  const b2 = w2.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 2, 0));
  const c2 = w2.createCollider(RAPIER.ColliderDesc.capsule(HALF, RAD), b2);
  const k2 = w2.createCharacterController(off);
  for (let i = 0; i < 200; i++) {
    k2.computeColliderMovement(c2, { x: 0, y: -0.1, z: 0 });
    const mv = k2.computedMovement();
    const t = b2.translation();
    b2.setNextKinematicTranslation({ x: t.x + mv.x, y: t.y + mv.y, z: t.z + mv.z });
    w2.step();
  }
  console.log(`  offset=${off}: settled y=${b2.translation().y.toFixed(4)} (expect 0.9)`);
}

console.log('\n--- does autostep work? (0.3m step) ---');
{
  const w3 = new RAPIER.World({ x: 0, y: -22, z: 0 });
  const g3 = w3.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  w3.createCollider(RAPIER.ColliderDesc.cuboid(32, 0.5, 32).setTranslation(0, -0.5, 0), g3);
  const stepBody = w3.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  w3.createCollider(RAPIER.ColliderDesc.cuboid(2, 0.15, 2).setTranslation(3, 0.15, 0), stepBody);
  const b3 = w3.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.9, 0));
  const c3 = w3.createCollider(RAPIER.ColliderDesc.capsule(HALF, RAD), b3);
  const k3 = w3.createCharacterController(0.02);
  k3.enableAutostep(0.45, 0.2, true);
  k3.enableSnapToGround(0.3);
  for (let i = 0; i < 120; i++) {
    k3.computeColliderMovement(c3, { x: 0.03, y: -0.05, z: 0 });
    const mv = k3.computedMovement();
    const t = b3.translation();
    b3.setNextKinematicTranslation({ x: t.x + mv.x, y: t.y + mv.y, z: t.z + mv.z });
    w3.step();
  }
  const t = b3.translation();
  console.log(`  walked to x=${t.x.toFixed(3)} y=${t.y.toFixed(3)} (step top at 0.3, expect y~1.2 on the step)`);
}
