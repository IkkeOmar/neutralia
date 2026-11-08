import { initPhysics, PhysicsWorld } from '../shared/physics.js';
import { createPlayerState, stepMovement, applyImpulse } from '../shared/movement.js';
import { WEAPONS, blastEffect, PLAYER_MASS } from '../shared/combat.js';

await initPhysics('standard');
const w = new PhysicsWorld();
const p = createPlayerState({ x: -24, y: 0.01, z: -24 });
p.bodyId = w.addCharacter(1, p.x, p.y, p.z);
w.step();
console.log('after spawn: y=', p.y.toFixed(4), 'onGround=', p.onGround);

const explosion = { x: -23.72, y: 1.0008, z: -23.7826 };
const eff = blastEffect(WEAPONS.rocket.blast, p, explosion, PLAYER_MASS, true, p.onGround);
console.log('blast effect: dv =', eff.dvx.toFixed(2), eff.dvy.toFixed(2), eff.dvz.toFixed(2), ' dmg =', eff.damage.toFixed(1));
applyImpulse(p, eff.dvx, eff.dvy, eff.dvz);
console.log('after impulse: vy =', p.vy.toFixed(2), 'onGround =', p.onGround);
console.log('');

const DT = 1/60;
let peak = p.y;
for (let i = 0; i < 120; i++) {
  stepMovement(p, { mx:0, mz:0, jump:false }, DT, w);
  peak = Math.max(peak, p.y);
  if (i < 10) console.log(`  step ${i}: y=${p.y.toFixed(4)} vy=${p.vy.toFixed(3)} onGround=${p.onGround}`);
}
console.log('');
console.log('PEAK =', peak.toFixed(3), 'm');
