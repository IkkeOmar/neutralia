// NEUTRALIA — Rapier collision layer.
//
// Rapier owns the COLLISION QUERIES (capsule vs. world, step height, slopes).
// Our own kinematic controller logic still lives in movement.js and is
// imported verbatim by both sides, so prediction and authority cannot
// diverge.
//
// Two Rapier builds ship with the same API:
//   @dimforge/rapier3d-compat                 1.64 MB gzip  (client)
//   @dimforge/rapier3d-deterministic-compat   1.65 MB gzip  (server)
// The deterministic build is the only one of the four physics engines we
// considered that guarantees bit-identical simulation across machines, which
// is exactly what lockstep prediction/reconciliation depends on.
//
// IMPORTANT SEMANTICS LEARNED IN THE SPIKE (tools/spike-rapier.mjs):
//  - The character controller's `offset` is a COLLISION MARGIN. At offset
//    0.01 the capsule settled 0.0101 m above the surface; at 0.02 it settled
//    0.0201 m above. That is expected, not a bug.
//  - `enableSnapToGround` PULLS the capsule DOWN onto slopes. During a pure
//    vertical fall it made the character sink below the surface. We integrate
//    our own gravity, so snap-to-ground is OFF and the ground contact is
//    derived from `computedGrounded()`.
//  - A capsule of halfHeight 0.5 + radius 0.4 is 1.8 m tall, matching
//    PLAYER_HEIGHT.
//  - `World.castRayAndGetNormal(ray, maxToi, solid, filterFlags, filterGroups,
//    filterExcludeCollider, filterExcludeRigidBody, filterPredicate)` — the
//    filter predicate is the EIGHTH argument.
//
// COORDINATE SPACE: the game works in FEET space (y = 0 at the player's
// feet). Rapier's capsule origin is its CENTRE, at y = PLAYER_HEIGHT/2 above
// the feet. This class converts between the two on every call, so callers
// only ever see feet-space positions.

import RAPIER from '@dimforge/rapier3d-compat';

import { MAP } from './map.js';
import { PLAYER_RADIUS, PLAYER_HEIGHT } from './protocol.js';

const CAPSULE_HALF = (PLAYER_HEIGHT - PLAYER_RADIUS * 2) / 2;  // 0.5
const CONTROLLER_OFFSET = 0.01;
const CENTRE_OFFSET = PLAYER_HEIGHT / 2;

let ready = false;
let activeBuild = 'standard';

// The active Rapier namespace. `initPhysics` decides which build fills it.
const RAPIER_HOLDER = { R: RAPIER };

/** Build the static world colliders from the shared map. */
function buildWorld(world) {
  const groundBody = world.createRigidBody(
    RAPIER_HOLDER.R.RigidBodyDesc.fixed().setTranslation(0, -1, 0));
  world.createCollider(
    RAPIER_HOLDER.R.ColliderDesc.cuboid(MAP.groundSize / 2, 1, MAP.groundSize / 2),
    groundBody);

  for (const b of MAP.boxes) {
    const body = world.createRigidBody(
      RAPIER_HOLDER.R.RigidBodyDesc.fixed().setTranslation(b.x, b.y + b.h / 2, b.z));
    world.createCollider(RAPIER_HOLDER.R.ColliderDesc.cuboid(b.w / 2, b.h / 2, b.d / 2), body);
  }
}

/**
 * A physics world that owns the static map and one kinematic character
 * controller per player.
 *
 * All positions handed in and out are FEET-space: y is the height of the
 * body's lowest point above the ground.
 */
export class PhysicsWorld {
  constructor() {
    if (!ready) throw new Error('PhysicsWorld.init() must be awaited first');
    this.world = new RAPIER_HOLDER.R.World({ x: 0, y: -22, z: 0 });
    buildWorld(this.world);
    this.characters = new Map();   // id -> { body, collider, controller }
  }

  /** Register a player as a kinematic capsule. Feet-space position. */
  addCharacter(id, x, y, z) {
    const body = this.world.createRigidBody(
      RAPIER_HOLDER.R.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(x, y + CENTRE_OFFSET, z));
    const collider = this.world.createCollider(
      RAPIER_HOLDER.R.ColliderDesc.capsule(CAPSULE_HALF, PLAYER_RADIUS), body);
    const controller = this.world.createCharacterController(CONTROLLER_OFFSET);
    controller.enableAutostep(0.45, 0.2, true);   // step up 45 cm ledges
    controller.setMaxSlopeClimbAngle(50 * Math.PI / 180);
    controller.setMinSlopeSlideAngle(30 * Math.PI / 180);
    controller.disableSnapToGround();              // we integrate gravity ourselves
    controller.setSlideEnabled(true);
    controller.setApplyImpulsesToDynamicBodies(true);
    const rec = { body, collider, controller };
    this.characters.set(id, rec);
    return rec;
  }

  removeCharacter(id) {
    this.characters.delete(id);
  }

  /** Teleport a character (used on respawn). Feet-space position. */
  setCharacterPosition(id, x, y, z) {
    const rec = this.characters.get(id);
    if (!rec) return null;
    rec.body.setTranslation({ x, y: y + CENTRE_OFFSET, z }, true);
    rec.body.setNextKinematicTranslation({ x, y: y + CENTRE_OFFSET, z });
    return { x, y, z };
  }

  /**
   * Move a character by a desired displacement and report the result.
   * `desired` is the displacement for this step (metres, feet-space).
   * Returns { x, y, z, grounded } in feet-space.
   */
  /**
   * Move a character by a desired displacement and report the result.
   * `desired` is the displacement for this step (metres, feet-space).
   * Returns { x, y, z, grounded } in feet-space.
   *
   * IMPORTANT: this method STEPS THE WORLD ITSELF and returns the body's
   * ACTUAL position after the step.
   *
   * A kinematicPositionBased body in Rapier only updates its translation
   * when world.step() runs. The earlier version returned `body.translation()
   * + computedMovement` - the TARGET - while the caller also stepped the
   * world. So the returned position and the body's real position were two
   * different things, and the character drifted by the collision margin
   * every step. On a long walk that drift is what stopped the player at
   * the cover box: the logical state said "you moved", the physics body
   * said "you are still against the wall", and the reconciliation fought
   * between the two.
   *
   * One call = one authoritative step. The caller must NOT step again.
   */
  moveCharacter(id, desired) {
    const rec = this.characters.get(id);
    if (!rec) return null;
    const { body, collider, controller } = rec;
    controller.computeColliderMovement(collider, {
      x: desired.x, y: desired.y, z: desired.z
    });
    const mv = controller.computedMovement();
    const t = body.translation();
    body.setNextKinematicTranslation({
      x: t.x + mv.x, y: t.y + mv.y, z: t.z + mv.z
    });
    // Step the world so the body actually reaches the target, then report
    // where it really is.
    this.world.step();
    const after = body.translation();
    return {
      x: after.x,
      y: after.y - CENTRE_OFFSET,
      z: after.z,
      grounded: controller.computedGrounded()
    };
  }

  /** Commit pending kinematic moves. Call once per physics step. */
  step() {
    this.world.step();
  }

  /**
   * Raycast against the static world + character capsules.
   * Returns { t, collider } or null. `excludeId` skips one character.
   *
   * IMPORTANT: the ray origin is an ABSOLUTE WORLD position (e.g. a muzzle at
   * eye height), NOT a feet-space position. The static colliders and the
   * character capsules all live in world space, so no y-conversion happens
   * here. Converting the ray into centre-of-mass space made every shot pass
   * 0.9 m over the target's head - the ray was 0.9 m too high, the capsule
   * was not.
   */
  raycast(ox, oy, oz, dx, dy, dz, maxToi, excludeId) {
    const ray = new RAPIER_HOLDER.R.Ray(
      { x: ox, y: oy, z: oz },
      { x: dx, y: dy, z: dz });
    // Exclude EVERY character capsule. The static-world hit and the character
    // hit are computed separately and then compared, so the static ray must
    // not also stop at a player - otherwise the character hit is never
    // strictly closer than the world hit and nobody can ever be shot.
    const characterColliders = new Set();
    for (const rec of this.characters.values()) characterColliders.add(rec.collider);
    const hit = this.world.castRayAndGetNormal(
      ray, maxToi, true,
      undefined, undefined,
      undefined,
      undefined,
      (collider) => !characterColliders.has(collider));
    if (!hit) return null;
    return { t: hit.timeOfImpact, collider: hit.collider };
  }

  /**
   * Find which character (if any) a ray hits first.
   * Returns { id, t } or null.
   */
  raycastCharacters(ox, oy, oz, dx, dy, dz, maxToi, excludeId) {
    // Absolute world space, same as raycast() above.
    const ray = new RAPIER_HOLDER.R.Ray(
      { x: ox, y: oy, z: oz },
      { x: dx, y: dy, z: dz });
    let best = null;
    for (const [id, rec] of this.characters) {
      if (id === excludeId) continue;
      const hit = this.world.castRay(
        ray, maxToi, true,
        undefined, undefined,
        undefined, undefined,
        (collider) => collider === rec.collider);
      if (hit && (!best || hit.timeOfImpact < best.t)) {
        best = { id, t: hit.timeOfImpact };
      }
    }
    return best;
  }

  /** Does a point sit inside any static box? Used for projectile impacts. */
  pointInSolid(x, y, z) {
    const bd = MAP.bounds;
    if (x < bd.minX || x > bd.maxX || z < bd.minZ || z > bd.maxZ) return true;
    if (y < 0) return true;
    for (const b of MAP.boxes) {
      if (x >= b.x - b.w / 2 && x <= b.x + b.w / 2 &&
          z >= b.z - b.d / 2 && z <= b.z + b.d / 2 &&
          y >= b.y && y <= b.y + b.h) return true;
    }
    return false;
  }

  free() {
    this.world.free();
  }
}

/**
 * Initialise Rapier. Must be awaited before creating a PhysicsWorld.
 *
 * build: 'standard'      -> @dimforge/rapier3d-compat
 *         'deterministic'-> @dimforge/rapier3d-deterministic-compat
 *
 * The server uses 'deterministic' (bit-identical across machines, which is
 * what lockstep prediction depends on). The client uses 'standard'.
 * tools/spike-determinism.mjs proves the two agree bit-identically over 400
 * steps, so client prediction and server authority cannot drift.
 */
export async function initPhysics(build = 'standard') {
  if (build === 'deterministic') {
    const mod = await import('@dimforge/rapier3d-deterministic-compat');
    const R = mod.default;
    await R.init();
    // Swap the module-level binding so the rest of the file uses the
    // deterministic build. ES module bindings are live, but `RAPIER` is a
    // const import, so we route through a mutable holder instead.
    RAPIER_HOLDER.R = R;
    activeBuild = 'deterministic';
  } else {
    await RAPIER.init();
    RAPIER_HOLDER.R = RAPIER;
    activeBuild = 'standard';
  }
  ready = true;
  return RAPIER_HOLDER.R;
}

/** Which build is loaded. */
export function physicsBuild() { return activeBuild; }

export { RAPIER_HOLDER, CAPSULE_HALF, CONTROLLER_OFFSET, CENTRE_OFFSET };
