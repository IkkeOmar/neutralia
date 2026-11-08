// Shared movement. The server runs this authoritatively; the client runs the
// SAME function for prediction. One implementation, zero divergence.
//
// The split:
//   movement.js  - the DYNAMICS: acceleration, friction, gravity, jump.
//                  Pure maths, no engine dependency, trivially deterministic.
//   physics.js   - the COLLISION: capsule vs. world, step height, slopes.
//                  Rapier. The server uses the deterministic build, the client
//                  the standard build; tools/spike-determinism.mjs proves the
//                  two agree BIT-IDENTICALLY across 400 steps.
//
// A `world` object with `moveCharacter(id, {x,y,z})` and `step()` is passed
// in. Passing `null` gives a fall-through to the legacy AABB resolver, which
// is what the pure unit tests use.

import { MAP } from './map.js';
import {
  PLAYER_RADIUS, PLAYER_HEIGHT, MAX_SPEED, ACCEL, FRICTION,
  GRAVITY, JUMP_VELOCITY, MAX_HEALTH
} from './protocol.js';

const EPS = 1e-3;

export function createPlayerState(spawn) {
  return {
    x: spawn.x, y: spawn.y ?? 0, z: spawn.z,
    vx: 0, vy: 0, vz: 0,
    onGround: true,
    yaw: spawn.yaw || 0,
    pitch: 0,
    hp: MAX_HEALTH,
    alive: true,
    // Physics ids are assigned by the owner (server or client) so that the
    // same state object can be driven by either side.
    bodyId: null
  };
}

// ── legacy AABB collision ───────────────────────────────────────────────────
// Kept for the pure unit tests and as the fallback when no Rapier world is
// supplied. The Rapier path is what the game actually runs.

function verticalOverlap(p, b) {
  return p.y < b.y + b.h - EPS && p.y + PLAYER_HEIGHT > b.y + EPS;
}

function horizontalOverlap(p, b) {
  return Math.abs(p.x - b.x) < b.w / 2 + PLAYER_RADIUS &&
         Math.abs(p.z - b.z) < b.d / 2 + PLAYER_RADIUS;
}

export function resolveX(p) {
  for (const b of MAP.boxes) {
    if (!verticalOverlap(p, b)) continue;
    if (Math.abs(p.z - b.z) >= b.d / 2 + PLAYER_RADIUS) continue;
    const px = (b.w / 2 + PLAYER_RADIUS) - Math.abs(p.x - b.x);
    if (px <= 0) continue;
    const pz = (b.d / 2 + PLAYER_RADIUS) - Math.abs(p.z - b.z);
    if (px < pz) {
      const dir = Math.sign(p.x - b.x) || 1;
      p.x = b.x + dir * (b.w / 2 + PLAYER_RADIUS);
      p.vx = 0;
    }
  }
}

export function resolveZ(p) {
  for (const b of MAP.boxes) {
    if (!verticalOverlap(p, b)) continue;
    if (Math.abs(p.x - b.x) >= b.w / 2 + PLAYER_RADIUS) continue;
    const pz = (b.d / 2 + PLAYER_RADIUS) - Math.abs(p.z - b.z);
    if (pz <= 0) continue;
    const px = (b.w / 2 + PLAYER_RADIUS) - Math.abs(p.x - b.x);
    if (pz < px) {
      const dir = Math.sign(p.z - b.z) || 1;
      p.z = b.z + dir * (b.d / 2 + PLAYER_RADIUS);
      p.vz = 0;
    }
  }
}

export function resolveY(p) {
  for (const b of MAP.boxes) {
    if (!horizontalOverlap(p, b)) continue;
    const top = b.y + b.h;
    if (p.vy <= 0 && p.y <= top + EPS && p.y + PLAYER_HEIGHT > b.y) {
      p.y = top;
      p.vy = 0;
      p.onGround = true;
    } else if (p.vy > 0 && p.y < b.y && p.y + PLAYER_HEIGHT > b.y) {
      p.y = b.y - PLAYER_HEIGHT;
      p.vy = 0;
    }
  }
}

/**
 * One fixed simulation step.
 *
 * input: { mx: strafe (-1..1), mz: forward (-1..1), jump: bool }
 * world: optional PhysicsWorld. When present, collision is Rapier's.
 * dt:    fixed timestep in seconds.
 *
 * Returns the state (mutated in place).
 */
export function stepMovement(p, input, dt, world) {
  if (!p.alive) {
    p.vx = 0; p.vy = 0; p.vz = 0;
    return p;
  }

  const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
  let wishX = sin * input.mz + cos * input.mx;
  let wishZ = cos * input.mz - sin * input.mx;
  const len = Math.hypot(wishX, wishZ);
  if (len > 1) { wishX /= len; wishZ /= len; }

  if (len > 0.01) {
    const k = Math.min(1, (ACCEL * dt) / MAX_SPEED);
    p.vx += (wishX * MAX_SPEED - p.vx) * k;
    p.vz += (wishZ * MAX_SPEED - p.vz) * k;
  } else {
    const f = Math.max(0, 1 - FRICTION * dt);
    p.vx *= f;
    p.vz *= f;
  }

  if (input.jump && p.onGround) {
    p.vy = JUMP_VELOCITY;
    p.onGround = false;
  }
  p.vy -= GRAVITY * dt;

  if (world && p.bodyId !== null && p.bodyId !== undefined) {
    // --- Rapier path -------------------------------------------------------
    // The character's body origin is at the FEET, but Rapier's capsule centre
    // is at half the player height. The physics world keeps the capsule
    // centre; we convert here.
    const res = world.moveCharacter(p.bodyId, {
      x: p.vx * dt,
      y: p.vy * dt,
      z: p.vz * dt
    });
    if (res) {
      const wasGrounded = p.onGround;
      p.onGround = res.grounded || (wasGrounded && p.vy <= 0);
      if (dt > 0) {
        const actualX = (res.x - p.x) / dt;
        const actualZ = (res.z - p.z) / dt;
        const asked = Math.hypot(p.vx, p.vz);
        const allowed = Math.hypot(actualX, actualZ);
        // If the collision blocked us, scale our velocity down to what the
        // collision actually permitted. Otherwise we accumulate speed into a
        // wall and rocket away from it when we finally move.
        if (asked > 1e-6 && allowed < asked * 0.98) {
          const scale = allowed / asked;
          p.vx *= scale;
          p.vz *= scale;
        }
        const askedY = p.vy;
        const actualY = (res.y - p.y) / dt;
        if (askedY > 0 && actualY < askedY * 0.5) p.vy = 0;          // ceiling
        if (askedY < 0 && actualY > askedY * 0.5) { p.vy = 0; p.onGround = true; }
      }
      p.x = res.x;
      p.y = res.y;
      p.z = res.z;
      if (p.onGround && p.vy < 0) p.vy = 0;
    }
  } else {
    // --- legacy path --------------------------------------------------------
    p.x += p.vx * dt; resolveX(p);
    p.z += p.vz * dt; resolveZ(p);
    p.y += p.vy * dt; resolveY(p);
    if (p.y <= 0) { p.y = 0; p.vy = 0; p.onGround = true; }
    const bd = MAP.bounds;
    if (p.x < bd.minX) { p.x = bd.minX; p.vx = 0; }
    if (p.x > bd.maxX) { p.x = bd.maxX; p.vx = 0; }
    if (p.z < bd.minZ) { p.z = bd.minZ; p.vz = 0; }
    if (p.z > bd.maxZ) { p.z = bd.maxZ; p.vz = 0; }
  }

  return p;
}

/**
 * Add an impulse to a player (m/s). Used by explosions.
 * Kept here so the client and server apply blast push identically.
 */
export function applyImpulse(p, dvx, dvy, dvz) {
  p.vx += dvx;
  p.vy += dvy;
  p.vz += dvz;
  if (dvy > 0) p.onGround = false;
  return p;
}
