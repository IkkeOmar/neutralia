// NEUTRALIA — wire protocol and tuning constants.
// Imported verbatim by BOTH client and server so the two can never disagree.

export const TICK_RATE = 30;
export const TICK_MS = 1000 / TICK_RATE;
export const TICK_DT = 1 / TICK_RATE;

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
  LEAVE: 'leave'
};
