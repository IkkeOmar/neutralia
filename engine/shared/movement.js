// Shared movement + collision. The server runs this authoritatively; the client
// runs the SAME function for prediction. One implementation, zero divergence.

import { MAP } from './map.js';
import {
  PLAYER_RADIUS, PLAYER_HEIGHT, MAX_SPEED, ACCEL, FRICTION,
  GRAVITY, JUMP_VELOCITY, MAX_HEALTH
} from './protocol.js';

const EPS = 1e-3;

export function createPlayerState(spawn) {
  return {
    x: spawn.x, y: 0, z: spawn.z,
    vx: 0, vy: 0, vz: 0,
    onGround: true,
    yaw: spawn.yaw || 0,
    pitch: 0,
    hp: MAX_HEALTH,
    alive: true
  };
}

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

// input: { mx: strafe (-1..1), mz: forward (-1..1), jump: bool }
export function stepMovement(p, input, dt) {
  if (!p.alive) {
    p.vx = 0; p.vy = 0; p.vz = 0;
    return;
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
