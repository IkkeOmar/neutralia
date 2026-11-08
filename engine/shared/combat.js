// NEUTRALIA — weapons, projectiles and explosions.
//
// Pure functions, no engine dependency, imported VERBATIM by both the client
// and the server so prediction and authority can never disagree.
//
// The explosion model is grounded in three sources:
//
// 1. Battlefield Heroes runs on DICE's Refractor 2 engine. The MDT property
//    `ObjectTemplate.ForceOnExplosion` is the engine's push-on-explosion value,
//    range 0-50, most commonly 15, with documented typical values:
//      exppacks 50 | landmines 30 | katyushas 15 | grenades 10 | bazookas 2 | flak 1
//    (https://bfmods.com/mdt/scripting/ObjectTemplate/Properties/ForceOnExplosion.html)
//    That fixes the RELATIVE ordering: sticky TNT shoves hardest, a rifle grenade
//    less, a bazooka shell least.
//
// 2. BFH's own community knowledge confirms all three explosives can be used to
//    launch yourself ("Roquet-Jump"): the Panzerfaust/Tank Buster by firing at
//    a wall while jumping, the M32 MGL by firing grenades at a wall and running
//    into the blast, and sticky TNT by standing on it as it detonates.
//
// 3. Quake II's rocket-jump hack is the canonical implementation of the
//    self-blast rule: a player's own splash does HALF damage but pushes with
//    1600/mass instead of 500/mass - 3.2x the push anyone else gets.
//    (https://frameadvance.net/mechanics/rocket-jumping/)
//
// Where the sources give a shape but no absolute number (the Refractor force
// scale is engine-internal, not metres), we use our own SI units and mark the
// values as TUNED. The ordering, the self-damage halving and the 3.2x
// self-push ratio are all source-grounded.

import { GRAVITY, PLAYER_HEIGHT } from './protocol.js';

// ── Weapon / explosive definitions ──────────────────────────────────────────
//
// BFH's item database gives each explosive a damage tier (1-5) and, for the
// grenade launchers, a radius tier (1-5, where M32 MGL = 3). We map the tiers
// onto metres:
//
//   damage tier 1..5  -> 20, 40, 65, 95, 130 HP at the centre of the blast
//   radius tier 1..5  -> 2.0, 3.0, 4.5, 6.0, 8.0 metres
//
// BFH player health: Commando 100, Soldier 120, Gunner 150.
// BFH's own grenade launchers are lethal to infantry at point blank ("kill in
// one hit from splash damage if it hits close enough"), and the community
// guide notes players "often kill themselves using it at close range".

export const TIER_DAMAGE = { 1: 20, 2: 40, 3: 65, 4: 95, 5: 130 };
export const TIER_RADIUS = { 1: 2.0, 2: 3.0, 3: 4.5, 4: 6.0, 5: 8.0 };

// The player is pushed by the blast as a body of finite mass.
export const PLAYER_MASS = 80;          // kg, a person with kit

export const WEAPONS = {
  rifle: {
    id: 'rifle', name: 'Rifle', kind: 'hitscan',
    damage: 25, cooldownMs: 120, range: 120,
    clips: 30
  },

  // --- explosives -----------------------------------------------------------

  // The Panzerfaust / Tank Buster. BFH: Gunner only, one shot, damage tier 4,
  // range tier 4. The community-documented "Roquet-Jump" weapon.
  rocket: {
    id: 'rocket', name: 'Panzerfaust', kind: 'projectile',
    explosive: 'rocket',
    class: 'Gunner',
    ammo: 1,
    cooldownMs: 900,
    projectile: {
      speed: 42,          // m/s initial
      gravityScale: 1.0,
      fuseMs: 5000,       // detonate on impact, or on fuse
      lifeMs: 8000
    },
    blast: {
      damageTier: 4, radiusTier: 4,
      impulse: 700,       // N.s at the centre  (TUNED)
      impulseRadius: 5.0, // m
      selfDamageMult: 0.5,   // Quake II: own splash is halved
      selfImpulseMult: 3.2,  // Quake II: own push is 1600/mass vs 500/mass
      falloff: 'quadratic',
      // BFH: "Bon contre les infanteries ... Permet de faire un Roquet-Jump.
      // Excellent contre les vehicules."
      vsInfantry: 1.0, vsVehicle: 2.2   // energy-like spread
    }
  },

  // The M32 MGL / MGL 140. BFH: Soldier + Gunner + Commando, six rounds,
  // radius tier 3, lethal to infantry at point blank. The community's
  // favourite rocket-jump tool.
  mgl: {
    id: 'mgl', name: 'M32 MGL', kind: 'projectile',
    explosive: 'grenade',
    class: 'Soldier',
    ammo: 6,
    cooldownMs: 650,
    projectile: {
      speed: 34,
      gravityScale: 1.0,
      fuseMs: 2600,       // hand-thrown, timed fuse
      lifeMs: 6000
    },
    blast: {
      damageTier: 4, radiusTier: 3,
      impulse: 500,       // (TUNED: DICE grenade force 10 vs katyusha 15)
      impulseRadius: 3.8,
      selfDamageMult: 0.5,   // Quake II
      selfImpulseMult: 3.2,  // Quake II
      falloff: 'quadratic',
      // BFH: "Tres faible contre les vehicules. ... A 1-hit kill from splash
      // damage if it hits close enough to an enemy." Our radius tier 3 and
      // damage tier 4 give the infantry lethality; vehicle damage is low.
      vsInfantry: 1.0, vsVehicle: 0.6
    }
  },

  // Sticky TNT. BFH: every class, short range / medium radius, sticks to walls
  // AND to vehicles. Refractor's exppack carries the engine's highest
  // ForceOnExplosion (50 of a 0-50 range), so this is the biggest shover.
  tnt: {
    id: 'tnt', name: 'Sticky TNT', kind: 'projectile',
    explosive: 'exppack',
    class: 'Soldier',
    ammo: 3,
    cooldownMs: 1200,
    projectile: {
      speed: 18,
      gravityScale: 1.0,
      fuseMs: 2200,
      lifeMs: 6000,
      sticks: true          // adheres to the surface it hits
    },
    blast: {
      damageTier: 2, radiusTier: 3,
      impulse: 870,       // (TUNED: DICE exppack force 50 vs katyusha 15)
      impulseRadius: 4.5,
      selfDamageMult: 0.5,   // Quake II
      selfImpulseMult: 3.2,  // Quake II
      falloff: 'quadratic',
      // BFH: "Tres faible contre les joueurs. ... Tres puissants contre les
      // vehicules." Sticky TNT has its own vehicle-like code, so it is weak
      // against infantry and devastating against vehicles.
      vsInfantry: 0.45, vsVehicle: 2.6
    }
  }
};

export const WEAPON_IDS = Object.keys(WEAPONS);

// ── Explosion maths ─────────────────────────────────────────────────────────

// Damage falls off linearly from the centre, matching BFH's own behaviour:
// "the farther the enemy is from the central explosion, the less damage you'll
// deal". Returns 0 outside the radius.
export function blastDamage(blast, distance) {
  const radius = TIER_RADIUS[blast.radiusTier];
  if (distance >= radius) return 0;
  const t = 1 - distance / radius;
  return TIER_DAMAGE[blast.damageTier] * t;
}

// Push falls off with distance. Quadratic because a blast's energy does not
// spread evenly; linear makes the edge of the radius feel like a wall.
export function blastImpulseScale(blast, distance) {
  const R = blast.impulseRadius;
  if (distance >= R) return 0;
  const t = 1 - distance / R;
  // Quadratic falloff crushed the near field: a rocket 0.6 m under your feet
  // got 25% of the push while one at 0 m got 100%, so the same weapon felt
  // like it either did nothing or launched you into orbit. t^1.5 keeps the
  // falloff physical but keeps the near field usable - which is the whole
  // point of a rocket jump.
  if (blast.falloff === 'quadratic') return t * Math.sqrt(t);
  return t;
}

// The push is applied to the CENTRE OF MASS, so the relevant distance to the
// blast centre is measured from there. A player standing on a rocket has their
// centre of mass 0.9 m above it.

// The full effect of one explosion on one body.
//
//   target: { x, y, z }  the body's FEET position
//   blast:  the weapon's `blast` block
//   mass:   kg. A Scout car (1800 kg) and a Heavy tank (~12000 kg) are thrown
//           very differently by the same blast. BFH's own TNT is described as
//           behaving "like attaching a vehicle to another vehicle, or like
//           launching a tank against another one" - so this ratio matters.
//   isSelf: true when the body is the one that fired the explosive. Quake II
//           halves the self-damage and triples the self-push; that asymmetry
//           is the entire reason a rocket jump works.
//   grounded: true when the body is standing on a surface.
//
// THE CENTRE OF MASS MATTERS. The push acts on the body's centre of mass, not
// on its feet. A rocket detonating at ground level under a standing player is
// 0.9 m BELOW that player's centre of mass, so the push is straight UP. This
// is the whole physical reason the rocket jump works, and getting it wrong
// (measuring from the feet) makes the blast push the player sideways instead.
//
// THE GROUND BOUNCES. When the body is grounded, the surface blocks any
// downward motion, so the downward part of the blast is redirected upward as a
// bounce. This is the "bounce super high" case: a rocket at your feet in
// front of you shoves you back, and the ground turns the rest into lift.
//
// Returns { damage, dvx, dvy, dvz, distance }.
export function blastEffect(blast, target, explosion, mass, isSelf, grounded = false) {
  // The body's centre of mass.
  const comY = target.y + PLAYER_HEIGHT / 2;
  const dx = target.x - explosion.x;
  const dy = comY - explosion.y;
  const dz = target.z - explosion.z;
  const distance = Math.hypot(dx, dy, dz);

  let damage = blastDamage(blast, distance);
  let impulseScale = blastImpulseScale(blast, distance);

  if (isSelf) {
    damage *= blast.selfDamageMult;
    impulseScale *= blast.selfImpulseMult;
  }
  if (damage <= 0 && impulseScale <= 0) {
    return { damage: 0, dvx: 0, dvy: 0, dvz: 0, distance };
  }

  // Direction from the blast centre to the body's centre of mass. A body
  // directly above the explosion gets a purely vertical push - that is the
  // rocket jump.
  let nx = dx, ny = dy, nz = dz;
  const len = Math.hypot(nx, ny, nz);
  if (len < 1e-4) { nx = 0; ny = 1; nz = 0; }
  else { nx /= len; ny /= len; nz /= len; }

  const impulse = blast.impulse * impulseScale;
  const dv = impulse / Math.max(1, mass);

  let dvx = nx * dv;
  let dvy = ny * dv;
  let dvz = nz * dv;

  // The ground cannot be pushed through. Any downward component is converted
  // into an upward bounce.
  if (grounded && dvy < 0) {
    dvy = -dvy * GROUND_BOUNCE;
  }

  return { damage, dvx, dvy, dvz, distance };
}

// How much of a downward blast is converted into an upward bounce when the
// body is standing on the ground. A surface cannot be pushed through, so the
// energy goes up instead.
export const GROUND_BOUNCE = 0.55;

// Apply a blast to a player state. Mutates and returns the state.
// Kept separate from blastEffect so the client and server can both call it.
export function applyBlastToPlayer(state, blast, explosion, isSelf) {
  const eff = blastEffect(
    blast, state, explosion, PLAYER_MASS, isSelf, state.onGround);
  state.vx += eff.dvx;
  state.vy += eff.dvy;
  state.vz += eff.dvz;
  if (eff.dvy > 0) state.onGround = false;
  state.lastBlast = { damage: eff.damage, dx: eff.dvx, dy: eff.dvy, dz: eff.dvz };
  return eff;
}

// ── Projectiles ─────────────────────────────────────────────────────────────

export function createProjectile(weaponId, ownerId, ox, oy, oz, dx, dy, dz) {
  const w = WEAPONS[weaponId];
  const len = Math.hypot(dx, dy, dz) || 1;
  return {
    id: `${ownerId}:${weaponId}:${Math.random().toString(36).slice(2, 9)}`,
    weapon: weaponId,
    owner: ownerId,
    x: ox, y: oy, z: oz,
    vx: dx / len * w.projectile.speed,
    vy: dy / len * w.projectile.speed,
    vz: dz / len * w.projectile.speed,
    born: 0,        // set by the caller (ms)
    fuse: w.projectile.fuseMs,
    life: w.projectile.lifeMs,
    alive: true
  };
}

// Advance a projectile by dt seconds. Returns true when it should detonate.
// `groundY` is the height of the surface below it.
export function stepProjectile(p, dt, now, groundY = 0) {
  if (!p.alive) return false;
  if (now - p.born > p.life) return true;
  p.vy -= GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.z += p.vz * dt;
  if (p.y <= groundY) {
    p.y = groundY;
    return true;
  }
  return now - p.born >= p.fuse;
}
