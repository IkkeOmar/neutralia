import { WEAPONS, blastEffect, PLAYER_MASS } from '../shared/combat.js';
import { PLAYER_HEIGHT } from '../shared/protocol.js';

const rocket = WEAPONS.rocket;

// The real scenario: the rocket detonates where the muzzle ray met the
// ground - right at the shooter's feet.
const shooter = { x: -24, y: 0.01, z: -24 };
const explosion = { x: -23.720, y: 0.000, z: -23.394 };

const comY = shooter.y + PLAYER_HEIGHT / 2;
console.log('shooter feet y =', shooter.y, ' COM y =', comY.toFixed(3));
console.log('explosion at   =', JSON.stringify(explosion));
const dx = shooter.x - explosion.x, dy = comY - explosion.y, dz = shooter.z - explosion.z;
console.log('vector feet->explosion:', dx.toFixed(3), dy.toFixed(3), dz.toFixed(3));
console.log('vector COM->explosion:', dx.toFixed(3), (comY - explosion.y).toFixed(3), dz.toFixed(3));
const dist = Math.hypot(dx, dy, dz);
console.log('distance COM to blast centre =', dist.toFixed(3), 'm');
console.log('blast impulseRadius =', rocket.blast.impulseRadius);
console.log('');

const eff = blastEffect(rocket.blast, shooter, explosion, PLAYER_MASS, true, true);
console.log('SELF blast effect:');
console.log('  damage  =', eff.damage.toFixed(1));
console.log('  dvx/dvy/dvz =', eff.dvx.toFixed(2), eff.dvy.toFixed(2), eff.dvz.toFixed(2));
console.log('  grounded = true, so dvy<0 would bounce');
console.log('');

// And the case where the rocket lands a couple of metres in FRONT (the real
// BFH rocket jump: you shoot the ground ahead of you and jump).
for (const fwd of [1.0, 2.0, 3.0, 4.0]) {
  const ex = { x: shooter.x, y: 0, z: shooter.z + fwd };
  const e = blastEffect(rocket.blast, shooter, ex, PLAYER_MASS, true, true);
  console.log(`blast ${fwd} m in front: dvy=${e.dvy.toFixed(2)} dvz=${e.dvz.toFixed(2)} dmg=${e.damage.toFixed(0)}`);
}
