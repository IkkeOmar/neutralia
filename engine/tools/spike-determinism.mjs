// Does the standard compat build and the deterministic build agree BIT-EXACTLY?
// If they do, the client can use the standard build and the server the
// deterministic one (server-side determinism across machines is the point of
// the deterministic build; client/server agreement is what prediction needs).
// If they do NOT, both sides must use the same build.

const script = async (pkg) => {
  const RAPIER = (await import(pkg)).default;
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -22, z: 0 });
  const g = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(32, 0.5, 32).setTranslation(0, -0.5, 0), g);
  const wall = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(1, 2, 8).setTranslation(-12, 2, -10), wall);
  const step = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(2, 0.15, 2).setTranslation(3, 0.15, 0), step);

  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.9, 0));
  const col = world.createCollider(RAPIER.ColliderDesc.capsule(0.5, 0.4), body);
  const k = world.createCharacterController(0.01);
  k.enableAutostep(0.45, 0.2, true);
  k.setMaxSlopeClimbAngle(50 * Math.PI / 180);
  k.setMinSlopeSlideAngle(30 * Math.PI / 180);
  k.disableSnapToGround();

  let vy = 0;
  const trace = [];
  for (let i = 0; i < 400; i++) {
    // a deliberately awkward path: fall, run, jump, rocket-jump, land on a step
    let dx = 0.03, dz = 0.017;
    if (i === 60) vy = 26;          // rocket jump
    if (i === 200) dx = -0.09;      // reverse
    if (i === 300) dz = -0.05;
    k.computeColliderMovement(col, { x: dx, y: vy * (1/60), z: dz });
    const mv = k.computedMovement();
    const t = body.translation();
    body.setNextKinematicTranslation({ x: t.x + mv.x, y: t.y + mv.y, z: t.z + mv.z });
    world.step();
    vy -= 22 * (1/60);
    const nt = body.translation();
    trace.push(nt.x.toExponential(17) + ',' + nt.y.toExponential(17) + ',' + nt.z.toExponential(17));
  }
  return trace;
};

const a = await script('@dimforge/rapier3d-compat');
const b = await script('@dimforge/rapier3d-deterministic-compat');

console.log('=== compat vs deterministic-compat ===');
console.log('  steps compared:', a.length);
let diff = -1;
for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { diff = i; break; }
if (diff === -1) {
  console.log('  BIT-IDENTICAL across all', a.length, 'steps');
  console.log('  final:', a[a.length - 1]);
} else {
  console.log('  FIRST DIVERGENCE at step', diff);
  console.log('    compat        :', a[diff]);
  console.log('    deterministic :', b[diff]);
}
