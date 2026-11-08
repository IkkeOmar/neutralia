#!/usr/bin/env node
/**
 * NEUTRALIA vehicle data — structural + doc-cross-check test.
 *
 * Asserts that engine/shared/vehicles.js is a faithful, machine-readable rendering of
 * systems/vehicle-system.md, and that the two binding rules hold:
 *   R8 — every variant is worse than its chassis at something (non-empty `weak`).
 *   R9 — no two variants of the same chassis are alike (distinct `weak`, distinct gadget).
 *
 * Exit code 0 = all pass, 1 = any fail. No test framework.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHASSIS, DOMAINS, VEHICLE_RULES, PENDING } from '../shared/vehicles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOC = path.resolve(__dirname, '..', '..', 'systems', 'vehicle-system.md');

const results = [];
function ok(name, cond, detail) {
  results.push({ name, pass: !!cond });
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + (detail ?? '')}`);
}

const SNAKE = /^[a-z0-9]+(_[a-z0-9]+)*$/;
const ALL_VARIANTS = CHASSIS.flatMap(c => c.variants);

console.log('=== VEHICLE DATA ===');

// 1. Exactly 7 chassis; ids unique & snake_case; domains valid; roster matches by name.
{
  const ids = CHASSIS.map(c => c.id);
  const unique = new Set(ids);
  ok('exactly 7 chassis', CHASSIS.length === 7, `got ${CHASSIS.length}`);
  ok('chassis ids are unique', unique.size === CHASSIS.length);
  ok('chassis ids are snake_case', ids.every(id => SNAKE.test(id)),
    ids.filter(id => !SNAKE.test(id)).join(','));
  ok('domains drawn from {ground,air,marine}',
    CHASSIS.every(c => ['ground', 'air', 'marine'].includes(c.domain)),
    CHASSIS.map(c => `${c.id}=${c.domain}`).join(' '));

  const doc = parseDoc();
  const moduleNames = CHASSIS.map(c => c.name);
  const missing = doc.chassis.filter(n => !moduleNames.includes(n));
  const extra = moduleNames.filter(n => !doc.chassis.includes(n));
  ok('chassis roster matches the doc by NAME',
    missing.length === 0 && extra.length === 0,
    `missing=[${missing}] extra=[${extra}]`);
}

// 2. Every chassis has 2–3 variants.
{
  const bad = CHASSIS.filter(c => c.variants.length < 2 || c.variants.length > 3);
  ok('every chassis has 2–3 variants', bad.length === 0,
    bad.map(c => `${c.id}=${c.variants.length}`).join(','));
}

// 3. R8: every variant has a non-empty `weak` string.
{
  const bad = ALL_VARIANTS.filter(v => !v.weak || !String(v.weak).trim());
  ok('R8 — every variant has a non-empty weak string', bad.length === 0,
    bad.map(v => `${v.id}: "${v.weak}"`).join(','));
}

// 4. R9: within a chassis, no two variants share a `weak`; no two share a (non-null) gadget.
{
  const dupWeak = [];
  const dupGadget = [];
  for (const c of CHASSIS) {
    const weaks = c.variants.map(v => v.weak);
    if (new Set(weaks).size !== weaks.length) dupWeak.push(c.id);
    const gadgets = c.variants.map(v => v.gadget).filter(g => g != null);
    if (new Set(gadgets).size !== gadgets.length) dupGadget.push(c.id);
  }
  ok('R9 — no two variants of a chassis share a weak string', dupWeak.length === 0,
    `dup=[${dupWeak}]`);
  // A null gadget is an absence (doc gives Interceptor & Bomber both "None"); the real R9
  // distinctness is carried by mount + role + weak. Only non-null gadgets must be unique.
  ok('R9 — no two variants of a chassis share a non-null gadget', dupGadget.length === 0,
    `dup=[${dupGadget}]`);
}

// 5. Every variant's mount is null or an object with at least a `name`.
{
  const bad = ALL_VARIANTS.filter(v =>
    v.mount !== null && (typeof v.mount !== 'object' || !v.mount.name));
  ok('every mount is null or an object with a name', bad.length === 0,
    bad.map(v => `${v.id}: ${JSON.stringify(v.mount)}`).join(','));
}

// 6. Positive hp/mass/speed/seats/radius/height; armour values in [0,1].
{
  const badNum = CHASSIS.filter(c =>
    !([c.hp, c.mass, c.speed, c.seats, c.radius, c.height].every(n => n > 0)));
  const badArmour = CHASSIS.filter(c => {
    const a = c.armour;
    return [a.front, a.side, a.rear, a.vsInfantry, a.vsVehicle].some(x => !(x > 0 && x <= 1));
  });
  ok('every chassis has positive hp/mass/speed/seats/radius/height', badNum.length === 0,
    badNum.map(c => c.id).join(','));
  ok('every armour value is in (0,1]', badArmour.length === 0,
    badArmour.map(c => c.id).join(','));
}

// 7. Variant seats never exceed the chassis seat count (R4).
{
  const bad = CHASSIS.filter(c => c.variants.some(v => v.seats > c.seats));
  ok('R4 — no variant exceeds its chassis seat count', bad.length === 0,
    bad.map(c => `${c.id}(${c.seats})`).join(','));
}

// 8. Cross-check against the SOURCE DOCUMENT.
{
  const doc = parseDoc();
  console.log(`\n=== DOC CROSS-CHECK (${DOC}) ===`);
  console.log(`  doc chassis (${doc.chassis.length}): ${doc.chassis.join(' | ')}`);
  console.log(`  module chassis (${CHASSIS.length}): ${CHASSIS.map(c => c.name).join(' | ')}`);
  console.log(`  doc variants (${doc.variants.length}): ${doc.variants.join(' | ')}`);
  console.log(`  module variants (${ALL_VARIANTS.length}): ${ALL_VARIANTS.map(v => v.name).join(' | ')}`);

  const moduleVariantNames = ALL_VARIANTS.map(v => v.name);
  const missingV = doc.variants.filter(n => !moduleVariantNames.includes(n));
  const extraV = moduleVariantNames.filter(n => !doc.variants.includes(n));
  ok('every doc variant is present in the module', missingV.length === 0 && extraV.length === 0,
    `missing=[${missingV}] extra=[${extraV}]`);

  ok('module variant count matches the doc (20)', ALL_VARIANTS.length === doc.variants.length,
    `module=${ALL_VARIANTS.length} doc=${doc.variants.length}`);
}

console.log(`\n=== PENDING (inferred values) — ${PENDING.length} ===`);
PENDING.forEach((p, i) => console.log(`  ${String(i + 1).padStart(2)}. ${p}`));

console.log('\n=== SUMMARY ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass);
console.log(`  ${passed}/${results.length} checks passed`);
if (failed.length) failed.forEach(f => console.log(`    FAIL  ${f.name}`));
process.exit(failed.length ? 1 : 0);

// ── doc parser ────────────────────────────────────────────────────────────────
function parseDoc() {
  const text = fs.readFileSync(DOC, 'utf8');

  // Chassis: `#### C1 — Scout car (jeep lineage) · 3 variants` → "Scout car".
  // C8 (Emplacement) is excluded — it is map-only, never player-selectable.
  const chassis = [];
  for (const m of text.matchAll(/^#### C([1-7]) —\s*(.+?)(?=\s*(?:\(|·)|$)/gm)) {
    chassis.push(m[2].trim());
  }

  // Variants: `| **Scout** | …` rows. Scoped to §3.1 "Variant matrix" → §3.2 "Totals"
  // so the §4 table's `| **Chassis** |`, `| **Variant** |`, `| **Loadout** |` rows
  // (which share the same leading-bold shape) are not misread as variant names.
  const start = text.indexOf('### 3.1 Variant matrix');
  const end = text.indexOf('### 3.2 Totals');
  const section = text.slice(start, end);
  const variants = [];
  for (const m of section.matchAll(/^\|\s*\*\*([^*]+?)\*\*\s*\|/gm)) {
    variants.push(m[1].trim());
  }

  return { chassis, variants };
}
