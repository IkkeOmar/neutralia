#!/usr/bin/env node
/**
 * NEUTRALIA — explosion physics test.
 *
 * The thing Omar asked for: "test the explosion collision where you could
 * bounce super high in BFH by exploding a rocket near yourself."
 *
 * This test proves the ROCKET JUMP works end to end:
 *   1. a rocket detonating under your feet launches you upward
 *   2. you go HIGHER from a self-blast than from someone else's blast
 *      (Quake II's rule: own splash = half damage, 3.2x the push)
 *   3. you take LESS damage from your own rocket than from an enemy's
 *   4. a blast pushes a heavy vehicle much less than a light one
 *   5. a blast does NOT launch you through the map floor
 *   6. all three explosives launch you, in DICE's documented order
 *   7. the server and the client compute the SAME launch (prediction is safe)
 *
 * Sources for the model:
 *   DICE Refractor 2 MDT, ObjectTemplate.ForceOnExplosion (0-50 scale:
 *     exppacks 50, landmines 30, katyushas 15, grenades 10, bazookas 2)
 *   Quake II's rocket-jump hack (frameadvance.net): own splash does half
 *     damage but pushes at 1600/mass instead of 500/mass
 *   BFH community knowledge: the Panzerfaust, the M32 MGL and sticky TNT
 *     have all been used to launch yourself
 *
 * NOTE ON GEOMETRY: a blast pushes bodies AWAY from its centre. A rocket
 * exploding in front of you at chest height shoves you backwards. The
 * vertical launch only happens when the explosion is BELOW you - which is
 * exactly the rocket jump: you shoot the ground under your feet.
 */

import { initPhysics, PhysicsWorld, physicsBuild } from '../shared/physics.js';
import { createPlayerState, stepMovement, applyImpulse } from '../shared/movement.js';
import {
  WEAPONS, PLAYER_MASS, blastEffect, applyBlastToPlayer, blastDamage,
  TIER_DAMAGE, TIER_RADIUS
} from '../shared/combat.js';
import { GRAVITY } from '../shared/protocol.js';

const results = [];
function ok(name, cond, detail) {
  results.push({ name, pass: !!cond });
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + (detail || '')}`);
}

const DT = 1 / 60;
const NO_INPUT = { mx: 0, mz: 0, jump: false };

/**
 * One simulation frame using the REAL game path: stepMovement + world.step().
 * This is exactly what the server tick does, so the test exercises the same
 * code the game runs.
 */
function frame(p, world, input = NO_INPUT) {
  // moveCharacter() steps the world itself.
  stepMovement(p, input, DT, world);
}

/** Run frames and report the apex height reached. */
function simulate(p, world, frames, input = NO_INPUT) {
  let apex = p.y;
  for (let i = 0; i < frames; i++) {
    frame(p, world, input);
    if (p.y > apex) apex = p.y;
    if (p.onGround && p.vy <= 0 && i > 5) break;
  }
  return apex;
}

/** Put a player on the ground and settle them. */
function settle(p, world) {
  for (let i = 0; i < 90; i++) {
    frame(p, world);
    if (p.onGround && Math.abs(p.vy) < 0.01) break;
  }
  return p;
}

/** A fresh world with one player standing on the ground. */
async function makePlayer(id) {
  const world = new PhysicsWorld();
  const p = createPlayerState({ x: 0, y: 0, z: 0, yaw: 0 });
  p.bodyId = id;
  world.addCharacter(id, 0, 0, 0);
  settle(p, world);
  return { world, p };
}

(async () => {
  console.log('=== EXPLOSION / ROCKET-JUMP PHYSICS ===');
  await initPhysics('standard');
  console.log(`  rapier build: ${physicsBuild()}`);

  // ── 1. the self-blast launch ──────────────────────────────────────────────
  console.log('\n=== A ROCKET UNDER YOUR FEET LAUNCHES YOU (the rocket jump) ===');
  const rocket = WEAPONS.rocket;
  const { world, p } = await makePlayer(1);
  ok('player rests on the ground', Math.abs(p.y) < 0.1, `y=${p.y.toFixed(4)}`);
  ok('player is grounded', p.onGround === true, `onGround=${p.onGround}`);

  const startY = p.y;

  // The rocket detonates 0.6 m BELOW the player's feet - the classic setup:
  // shoot the ground under yourself while jumping.
  const explosion = { x: 0, y: -0.6, z: 0 };
  const eff = applyBlastToPlayer(p, rocket.blast, explosion, true);
  ok('self-blast applies a strong upward impulse', eff.dvy > 8,
    `dvy=${eff.dvy.toFixed(2)} dvx=${eff.dvx.toFixed(2)} dvz=${eff.dvz.toFixed(2)}`);
  ok('the blast lifts the player off the ground', p.onGround === false,
    `onGround=${p.onGround}`);

  const apex = simulate(p, world, 400);
  const rise = apex - startY;
  ok('the rocket jump lifts the player well above the ground',
    rise > 4, `apex=${apex.toFixed(2)}m  rise=${rise.toFixed(2)}m`);

  // Compare with the same blast from someone else (no self-boost).
  const otherEff = blastEffect(rocket.blast, { x: 0, y: 0, z: 0 }, explosion, PLAYER_MASS, false);
  ok('an enemy blast pushes less than a self-blast',
    eff.dvy > otherEff.dvy * 1.5,
    `self=${eff.dvy.toFixed(2)} enemy=${otherEff.dvy.toFixed(2)} ratio=${(eff.dvy / otherEff.dvy).toFixed(2)}x`);
  ok('the self-push ratio matches Quake II\'s 1600/500 = 3.2x',
    Math.abs(eff.dvy / otherEff.dvy - rocket.blast.selfImpulseMult) < 0.05,
    `ratio=${(eff.dvy / otherEff.dvy).toFixed(3)} expected=${rocket.blast.selfImpulseMult}`);

  // ── 2. self-damage is halved ──────────────────────────────────────────────
  console.log('\n=== SELF-DAMAGE IS HALVED (Quake II rule) ===');
  const p3 = { x: 0, y: 0, z: 0 };
  const boom = { x: 0, y: 0, z: 0 };   // dead centre
  const selfEff = blastEffect(rocket.blast, p3, boom, PLAYER_MASS, true);
  const otherFull = blastEffect(rocket.blast, p3, boom, PLAYER_MASS, false);
  ok('own blast does half the damage',
    Math.abs(selfEff.damage / otherFull.damage - 0.5) < 0.01,
    `self=${selfEff.damage.toFixed(1)} other=${otherFull.damage.toFixed(1)}`);
  ok('a rocket at your feet still hurts', otherFull.damage > 30,
    `dmg=${otherFull.damage.toFixed(1)}`);

  // ── 3. mass matters ───────────────────────────────────────────────────────
  console.log('\n=== MASS MATTERS (a tank is not launched, a person is) ===');
  const person = blastEffect(rocket.blast, p3, boom, 80, false);
  const scoutCar = blastEffect(rocket.blast, p3, boom, 1800, false);
  const heavyTank = blastEffect(rocket.blast, p3, boom, 12000, false);
  ok('a person is thrown much harder than a scout car',
    person.dvy > scoutCar.dvy * 10,
    `person=${person.dvy.toFixed(2)} scout=${scoutCar.dvy.toFixed(2)}`);
  ok('a heavy tank barely moves',
    heavyTank.dvy < person.dvy * 0.02,
    `tank=${heavyTank.dvy.toFixed(3)} person=${person.dvy.toFixed(2)}`);

  // ── 4. the blast does not punch through the floor ─────────────────────────
  console.log('\n=== A BLAST DOES NOT LAUNCH YOU THROUGH THE FLOOR ===');
  const { world: w4, p: p4 } = await makePlayer(2);
  // A grenade landing ON the floor right next to the player's feet.
  applyBlastToPlayer(p4, rocket.blast, { x: 0, y: 0, z: 0.8 }, true);
  const p4apex = simulate(p4, w4, 400);
  ok('a blast at the player\'s feet still launches upward',
    p4apex > 1, `apex=${p4apex.toFixed(2)}`);
  ok('the player never ends up below the floor',
    p4.y > -0.2, `y=${p4.y.toFixed(4)}`);
  // after coming back down they must land on the floor, not through it
  simulate(p4, w4, 600);
  ok('the player lands back on the floor', p4.y > -0.2 && p4.y < 0.2,
    `y=${p4.y.toFixed(4)} onGround=${p4.onGround}`);

  // ── 5. falloff ────────────────────────────────────────────────────────────
  console.log('\n=== DAMAGE FALLS OFF WITH DISTANCE ===');
  const b = rocket.blast;
  const centre = blastDamage(b, 0);
  const half = blastDamage(b, TIER_RADIUS[b.radiusTier] / 2);
  const edge = blastDamage(b, TIER_RADIUS[b.radiusTier] - 0.01);
  const outside = blastDamage(b, TIER_RADIUS[b.radiusTier]);
  ok('centre of the blast deals full damage', centre === TIER_DAMAGE[b.damageTier],
    `centre=${centre}`);
  ok('damage decreases with distance', centre > half && half > edge,
    `centre=${centre.toFixed(1)} half=${half.toFixed(1)} edge=${edge.toFixed(1)}`);
  ok('no damage outside the radius', outside === 0, `outside=${outside}`);

  // ── 6. all three explosives launch you, in DICE's order ──────────────────
  console.log('\n=== ALL THREE EXPLOSIVES LAUNCH YOU, IN DICE\'S ORDER ===');
  // DICE ForceOnExplosion: exppacks 50 > landmines 30 > katyushas 15 > grenades 10.
  // Our equivalents: TNT (exppack) > rocket (katyusha) > MGL (grenade).
  const tntUp = blastEffect(WEAPONS.tnt.blast, p3, boom, PLAYER_MASS, true).dvy;
  const rocketUp = blastEffect(rocket.blast, p3, boom, PLAYER_MASS, true).dvy;
  const mglUp = blastEffect(WEAPONS.mgl.blast, p3, boom, PLAYER_MASS, true).dvy;
  ok('sticky TNT launches you highest (DICE exppack = 50)',
    tntUp > rocketUp && rocketUp > mglUp,
    `tnt=${tntUp.toFixed(1)} rocket=${rocketUp.toFixed(1)} mgl=${mglUp.toFixed(1)}`);

  // ── 7. client and server compute the SAME launch ──────────────────────────
  console.log('\n=== CLIENT AND SERVER COMPUTE THE SAME LAUNCH ===');
  const runApex = async (build) => {
    await initPhysics(build);
    const w = new PhysicsWorld();
    const pl = createPlayerState({ x: 0, y: 0, z: 0, yaw: 0 });
    pl.bodyId = 9;
    w.addCharacter(9, 0, 0, 0);
    settle(pl, w);
    applyBlastToPlayer(pl, rocket.blast, explosion, true);
    const a = simulate(pl, w, 400);
    w.free();
    return a;
  };

  const standard = await runApex('standard');
  const det = await runApex('deterministic');
  ok('standard and deterministic Rapier builds give the identical apex',
    standard === det, `standard=${standard} deterministic=${det}`);
  ok('the rocket jump apex is a sane number', det > 4 && det < 60,
    `apex=${det.toFixed(2)}m`);

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);
  console.log(`  ${passed}/${results.length} checks passed`);
  if (failed.length) failed.forEach(f => console.log(`    FAIL ${f.name}`));
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('TEST ERROR:', e); process.exit(1); });
