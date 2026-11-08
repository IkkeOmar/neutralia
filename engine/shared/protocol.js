// NEUTRALIA — wire protocol and tuning constants.
// Imported verbatim by BOTH client and server so the two can never disagree.

export const TICK_RATE = 30;
export const TICK_MS = 1000 / TICK_RATE;
export const TICK_DT = 1 / TICK_RATE;

// The server runs SUB_STEPS physics sub-steps per network tick, so the
// authoritative simulation advances at 60 Hz even though the network tick is
// 30 Hz. The client must predict at exactly the same rate or its prediction
// outruns the server and every snapshot yanks the player backwards.
export const SUB_STEPS = 2;
export const SUB_DT = TICK_DT / SUB_STEPS;
export const PHYSICS_DT = SUB_DT;

export const MAX_PLAYERS = 16;

export const PLAYER_RADIUS = 0.4;
export const PLAYER_HEIGHT = 1.8;
export const EYE_HEIGHT = 1.55;

export const MAX_SPEED = 6.2;
export const ACCEL = 55;
export const FRICTION = 12;
export const GRAVITY = 22;
export const JUMP_VELOCITY = 7.2;

export const FIRE_COOLDOWN_MS = 120;
export const MAX_HEALTH = 100;
export const DAMAGE_PER_HIT = 25;
export const WEAPON_RANGE = 120;

export const MSG = {
  HELLO: 'hello',
  WELCOME: 'welcome',
  INPUT: 'input',
  FIRE: 'fire',
  SNAPSHOT: 'snapshot',
  SHOT: 'shot',
  HIT: 'hit',
  DEATH: 'death',
  JOIN: 'join',
  LEAVE: 'leave',
  // --- explosives ---
  EXPLOSION: 'explosion',   // server -> all: an explosive went off
  SWITCH: 'switch',         // client -> server: change weapon
  AMMO: 'ammo'              // server -> client: ammo state
};
