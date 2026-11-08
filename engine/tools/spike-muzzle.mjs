import { MAP } from '../shared/map.js';

console.log('map:', MAP.name, 'bounds:', JSON.stringify(MAP.bounds));
console.log('spawns:', JSON.stringify(MAP.spawns));
console.log('');
const m = { x: -23.72, y: 1.0008, z: -23.7826 };
const eye = { x: -24, y: 0.01 + 1.55, z: -24 };
console.log('muzzle:', JSON.stringify(m));
console.log('eye:   ', JSON.stringify(eye));
console.log('');
for (const b of MAP.boxes) {
  const inside = (p) => p.x >= b.x - b.w/2 && p.x <= b.x + b.w/2 &&
                        p.z >= b.z - b.d/2 && p.z <= b.z + b.d/2 &&
                        p.y >= b.y && p.y <= b.y + b.h;
  const inM = inside(m), inE = inside(eye);
  if (inM || inE) {
    console.log(`box ${b.name ?? ''} c=(${b.x},${b.y},${b.z}) size=(${b.w},${b.h},${b.d})  muzzleInside=${inM} eyeInside=${inE}`);
  }
}
console.log('');
console.log('--- all boxes within 6 m of the spawn ---');
for (const b of MAP.boxes) {
  const d = Math.hypot(b.x - (-24), b.z - (-24));
  if (d < 8) console.log(`  ${(b.name ?? '').padEnd(12)} c=(${b.x},${b.y},${b.z}) size=(${b.w},${b.h},${b.d}) dist=${d.toFixed(2)}`);
}
