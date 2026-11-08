// NEUTRALIA — vehicle chassis × variant data.
//
// Canonical, machine-readable rendering of `systems/vehicle-system.md` (the source of
// truth). That document defines seven player-selectable chassis (C1–C7) with 20 variants
// total (3+3+3+3+3+3+2), plus a map-only emplacement (C8) that is NOT a spawn choice and
// is therefore deliberately excluded here.
//
// Two binding design rules are encoded (see VEHICLE_RULES below):
//   R8 — every variant must be WORSE than its chassis at something (a variant with no
//        downside is an upgrade, and upgrades become mandatory).
//   R9 — no two variants of the same chassis may be alike (two variants you cannot tell
//        apart in one sentence are the same variant).
//
// NAMES, MOUNTS, GADGETS and WEAKNESSES come from the doc's §3.1 variant tables and its
// §5.1 R8 table (authoritative). NUMERIC physics (hp, mass, speed, armour, radius,
// height, …) are NOT set in the doc — §7 explicitly defers "handling model, armour model,
// hit-point values". Every such value below is an inference from the doc's described role,
// marked `// inferred` and recorded in PENDING.

export const DOMAINS = {
  ground: {
    label: 'Ground',
    note:
      'Land vehicles. R7 applies: a chassis that appears on many maps must have the ' +
      'lowest power ceiling — the Scout car is the universal chassis (on 6 of BFH\u2019s ' +
      '14 maps), so it carries the lightest armament.'
  },
  air: {
    label: 'Air',
    note:
      'Air chassis do not ground-clear (R3): air superiority is the primary role, ground ' +
      'support secondary. A vehicle that can kill tanks, planes and infantry from a safe ' +
      'position deletes the infantry\u2019s reason to exist.'
  },
  marine: {
    label: 'Marine',
    note:
      'Water-bound. Only the Landing craft beaches (amphibious drop onto a beach); the ' +
      'Gunboat is bounded to water and cannot go ashore.'
  }
};

export const VEHICLE_RULES = {
  R8:
    'A variant must be worse than the chassis baseline at something. A variant with no ' +
    'downside is an upgrade, and an upgrade becomes mandatory.',
  R9:
    'Two variants that cannot be told apart in one sentence are the same variant.'
};

// ─────────────────────────────────────────────────────────────────────────────
// armour semantics: damage MULTIPLIER taken (lower = tougher). §7 leaves the model
// unset; values below are inferred from each chassis's described role.
// ─────────────────────────────────────────────────────────────────────────────

export const CHASSIS = [
  {
    id: 'scout_car',
    name: 'Scout car',
    domain: 'ground',
    origin: 'bfh',
    bfhOrigin: 'Jeep',
    lineage: 'BFH Jeep (Willys MB / Kübelwagen)',
    role: 'Transport / recon / forward resupply',
    // §3 roster lists 3 seats (the BFH Jeep figure); the Courier variant carries 5, and
    // R4 says a variant may never ADD seats — so the hull capacity is 5. // inferred
    seats: 5,
    hp: 250,            // inferred — lightest hull in the roster
    mass: 1800,         // inferred — kg-ish, a jeep
    speed: 16.0,        // inferred — fastest ground chassis ("Fast, quiet")
    reverseSpeed: 6.0,  // inferred
    turnRate: 1.8,      // inferred — agile recon
    accel: 7.0,         // inferred
    armour: {           // inferred — unarmoured transport takes the most damage
      front: 0.60, side: 0.50, rear: 0.40, vsInfantry: 0.50, vsVehicle: 0.75
    },
    radius: 1.9,        // inferred — collision radius, m
    height: 2.0,        // inferred — m
    variants: [
      {
        id: 'scout',
        name: 'Scout',
        role: 'recon',
        line: 'Recon',
        seats: 3,
        mount: null, // "None (passenger weapons only)" — passengers fire their own weapons
        gadget: 'smoke_screen',
        weak: 'no weapon at all',
        identity: 'Fast, quiet, reveals. The BFH jeep exactly.',
        stats: {}
      },
      {
        id: 'technical',
        name: 'Technical',
        role: 'anti-infantry',
        line: 'Anti-infantry',
        seats: 2,
        mount: { name: 'Light machine gun' },
        gadget: 'repair_kit',
        weak: 'no anti-vehicle capability', // §3.1: Anti-vehicle = None
        identity: 'Improvised fighting car. Cheap, expendable, good at infantry.',
        stats: {}
      },
      {
        id: 'courier',
        name: 'Courier',
        role: 'transport',
        line: 'Transport',
        seats: 5,
        mount: null,
        gadget: 'radio_relay',
        weak: 'unarmed — pure transport', // mount None; moves the squad, never fights
        identity: 'Moves the squad. The forward-respawn vehicle.',
        stats: {}
      }
    ]
  },

  {
    id: 'armoured_car',
    name: 'Armoured car',
    domain: 'ground',
    origin: 'new',
    bfhOrigin: null,
    lineage: 'Half-track (new chassis)',
    role: 'Mobile support, infantry carrier',
    seats: 6,           // inferred — max variant seats (APC 6) per R4
    hp: 400,            // inferred — infantry carrier, tougher than the jeep
    mass: 6000,         // inferred
    speed: 12.0,        // inferred
    reverseSpeed: 4.0,  // inferred
    turnRate: 1.2,      // inferred
    accel: 5.0,         // inferred
    armour: {           // inferred — moderate armour
      front: 0.45, side: 0.35, rear: 0.30, vsInfantry: 0.40, vsVehicle: 0.60
    },
    radius: 2.2,        // inferred
    height: 2.4,        // inferred
    variants: [
      {
        id: 'apc',
        name: 'APC',
        role: 'transport',
        line: 'Transport',
        seats: 6,
        mount: null,
        gadget: 'smoke',
        weak: 'no weapon at all',
        identity: 'The squad taxi. Battlefield 1\u2019s "Squad Support".',
        stats: {}
      },
      {
        id: 'carrier',
        name: 'Carrier',
        role: 'anti-infantry',
        line: 'Anti-infantry',
        seats: 3,
        mount: { name: 'Light machine gun' },
        gadget: 'ammo_crate',
        weak: 'no anti-vehicle capability', // §3.1: Anti-vehicle = None
        identity: 'Sustained fire support on foot. Anti-infantry line.',
        stats: {}
      },
      {
        id: 'recovery',
        name: 'Recovery',
        role: 'support',
        line: 'Support',
        seats: 4,
        mount: null,
        gadget: 'repair_hull',
        weak: 'unarmed — no combat role', // mount None; exists to repair, not to fight
        identity: 'Repairs and revives friendly vehicles. The Engineer vehicle. Support line.',
        stats: {}
      }
    ]
  },

  {
    id: 'light_tank',
    name: 'Light tank',
    domain: 'ground',
    origin: 'bfh',
    bfhOrigin: 'Light tank',
    lineage: 'BFH Light tank (M4 Sherman / Panzer IV)',
    role: 'Direct-fire, anti-vehicle',
    seats: 2,           // BFH light tank = driver + turret gunner (§1.1, §3)
    hp: 550,            // inferred — armoured, below the heavy tank
    mass: 12000,        // inferred
    speed: 9.0,         // inferred
    reverseSpeed: 3.0,  // inferred
    turnRate: 1.0,      // inferred
    accel: 4.0,         // inferred
    armour: {           // inferred — armoured but a light hull
      front: 0.30, side: 0.25, rear: 0.20, vsInfantry: 0.30, vsVehicle: 0.50
    },
    radius: 2.3,        // inferred
    height: 2.6,        // inferred
    variants: [
      {
        id: 'javelin',
        name: 'Javelin',
        role: 'anti-infantry',
        line: 'Anti-infantry',
        seats: 2, // inferred — doc's C3 table omits seats; BFH light tank is 2
        mount: { name: '20mm autocannon' },
        gadget: 'smoke',
        weak: 'armour (light hull)', // §5.1 R8 table (verbatim)
        identity: 'Fast flanker. BF1 "Flanker". Anti-infantry line.',
        stats: { antiVehicle: 'low', antiInfantry: 'high' } // §3.1 C3 columns
      },
      {
        id: 'bulwark',
        name: 'Bulwark',
        role: 'heavy',
        line: 'Heavy',
        seats: 2, // inferred
        mount: { name: '37mm main gun' },
        gadget: 'emergency_repair',
        weak: 'medium anti-vehicle — no tank-killing specialisation', // §3.1: AV "Medium"
        identity: 'The line holder. Heavy line.',
        stats: { antiVehicle: 'medium', antiInfantry: 'high' } // §3.1 C3 columns
      },
      {
        id: 'hunter',
        name: 'Hunter',
        role: 'anti-vehicle',
        line: 'Anti-vehicle',
        seats: 2, // inferred
        mount: { name: 'AT gun (anti-tank)' },
        gadget: 'mine_dispenser',
        weak: 'everything but anti-vehicle', // §5.1 R8 table (verbatim)
        identity: 'Anti-vehicle specialist. BF1 "Tank Hunter".',
        stats: { antiVehicle: 'high', antiInfantry: 'low' } // §3.1 C3 columns
      }
    ]
  },

  {
    id: 'heavy_tank',
    name: 'Heavy tank',
    domain: 'ground',
    origin: 'new',
    bfhOrigin: null,
    lineage: 'A7V (new chassis)',
    role: 'Breakthrough, area denial',
    seats: 3,           // §3 roster + §3.1 C4 table (Assault 3, Dug-in 3, Siege 2)
    hp: 750,            // inferred — heaviest hull in the roster
    mass: 45000,        // inferred
    speed: 7.0,         // inferred — slow
    reverseSpeed: 2.5,  // inferred
    turnRate: 0.6,      // inferred
    accel: 3.0,         // inferred
    armour: {           // inferred — heaviest armour, lowest multipliers
      front: 0.20, side: 0.18, rear: 0.15, vsInfantry: 0.25, vsVehicle: 0.40
    },
    radius: 3.2,        // inferred
    height: 3.4,        // inferred
    variants: [
      {
        id: 'assault',
        name: 'Assault',
        role: 'heavy',
        line: 'Heavy',
        seats: 3,
        mount: { name: '57mm + coaxial MG' },
        gadget: 'smoke',
        weak: 'no indirect fire', // direct-fire 57mm; the Siege is the arc-fire variant
        identity: 'Pushes the line.',
        stats: {}
      },
      {
        id: 'dug_in',
        name: 'Dug-in',
        role: 'hold',
        line: 'Hold',
        seats: 3,
        mount: { name: '57mm, slow traverse' },
        gadget: 'emergency_repair_ammo',
        weak: 'static — slow traverse, cannot relocate', // "slow traverse" mount + "Static" identity
        identity: 'Static, durable, holds an objective. Hold line.',
        stats: {}
      },
      {
        id: 'siege',
        name: 'Siege',
        role: 'indirect',
        line: 'Indirect',
        seats: 2,
        mount: { name: 'Howitzer (arc)' },
        gadget: 'repair',
        weak: 'direct fire (arc trajectory)', // §5.1 R8 table (verbatim)
        identity: 'Indirect fire. Cannot hit what it can see.',
        stats: {}
      }
    ]
  },

  {
    id: 'fighter',
    name: 'Fighter',
    domain: 'air',
    origin: 'bfh',
    bfhOrigin: 'Plane',
    lineage: 'BFH Plane (Spitfire / Bf 109)',
    role: 'Air superiority, anti-ground strafing',
    seats: 3,           // §3 roster; Liaison carries 3, the others fewer (R4)
    hp: 450,            // inferred
    mass: 5000,         // inferred
    speed: 55.0,        // inferred — fastest chassis
    reverseSpeed: 0.0,  // inferred — fixed-wing aircraft do not reverse
    turnRate: 2.5,      // inferred
    accel: 20.0,        // inferred
    armour: {           // inferred — fragile; BFH plane sat mid-HP
      front: 0.45, side: 0.45, rear: 0.45, vsInfantry: 0.40, vsVehicle: 0.50
    },
    radius: 4.0,        // inferred — wingspan
    height: 3.0,        // inferred
    variants: [
      {
        id: 'interceptor',
        name: 'Interceptor',
        role: 'air-superiority',
        line: 'Air superiority',
        seats: 1,
        mount: { name: '2× machine gun' },
        gadget: null, // "None" — no gadget
        weak: 'cannot attack ground (no bombs, no rockets)', // identity: "No bombs, no rockets"
        identity: 'Air superiority. No bombs, no rockets.',
        stats: {}
      },
      {
        id: 'bomber',
        name: 'Bomber',
        role: 'bombing',
        line: 'Bombing',
        seats: 1,
        mount: { name: '2× bombs' },
        gadget: null, // "None" — no gadget
        weak: 'dogfighting (no cannon)', // §5.1 R8 table (verbatim)
        identity: 'Softens ground, then leaves. Cannot dogfight.',
        stats: {}
      },
      {
        id: 'liaison',
        name: 'Liaison',
        role: 'recon',
        line: 'Recon',
        seats: 3,
        mount: { name: 'Machine gun' },
        gadget: 'radio_relay',
        weak: 'speed and survivability', // §5.1 R8 table (verbatim)
        identity: 'Carries two passengers, relays spots. Weak in a dogfight.',
        stats: {}
      }
    ]
  },

  {
    id: 'helicopter',
    name: 'Helicopter',
    domain: 'air',
    origin: 'bfh',
    bfhOrigin: 'Helicopter',
    lineage: 'BFH Helicopter',
    role: 'Transport, spotting, indirect fire',
    seats: 4,           // inferred — max variant seats (Transport 4); §3 roster lists 2
    hp: 400,            // inferred
    mass: 4500,         // inferred
    speed: 40.0,        // inferred
    reverseSpeed: 0.0,  // inferred — no reversing; hovers instead
    turnRate: 2.0,      // inferred
    accel: 15.0,        // inferred
    armour: {           // inferred — fragile, AA-vulnerable
      front: 0.50, side: 0.50, rear: 0.50, vsInfantry: 0.40, vsVehicle: 0.55
    },
    radius: 3.5,        // inferred — rotor disc
    height: 3.2,        // inferred
    variants: [
      {
        id: 'transport',
        name: 'Transport',
        role: 'transport',
        line: 'Transport',
        seats: 4,
        mount: null,
        gadget: 'smoke',
        weak: 'no weapons at all', // identity: "No weapons at all"
        identity: 'The fast drop. No weapons at all.',
        stats: {}
      },
      {
        id: 'gunship',
        name: 'Gunship',
        role: 'anti-infantry',
        line: 'Anti-infantry',
        seats: 2,
        mount: { name: '2× machine gun' },
        gadget: 'rocket_pod',
        weak: 'vulnerable to anti-air', // identity: "Vulnerable to AA"
        identity: 'Anti-infantry. Vulnerable to AA.',
        stats: {}
      },
      {
        id: 'spotter',
        name: 'Spotter',
        role: 'recon',
        line: 'Recon',
        seats: 2,
        mount: null,
        gadget: 'laser_designator',
        weak: 'everything — it carries no weapon', // §5.1 R8 table (verbatim)
        identity: 'Marks targets for everyone. Cannot fight.',
        stats: {}
      }
    ]
  },

  {
    id: 'boat',
    name: 'Boat',
    domain: 'marine',
    origin: 'bfh',
    bfhOrigin: 'Boat',
    lineage: 'BFH Boat',
    role: 'Amphibious transport, naval support',
    seats: 6,           // inferred — max variant seats (Landing craft 6); §3 roster lists 4
    hp: 500,            // inferred
    mass: 9000,         // inferred
    speed: 11.0,        // inferred
    reverseSpeed: 4.0,  // inferred
    turnRate: 0.8,      // inferred
    accel: 4.0,         // inferred
    armour: {           // inferred
      front: 0.35, side: 0.30, rear: 0.30, vsInfantry: 0.35, vsVehicle: 0.50
    },
    radius: 2.8,        // inferred
    height: 2.5,        // inferred
    variants: [
      {
        id: 'landing_craft',
        name: 'Landing craft',
        role: 'transport',
        line: 'Transport',
        seats: 6,
        mount: null,
        gadget: 'ramp',
        weak: 'no weapons at all', // mount None
        identity: 'Amphibious drop onto a beach.',
        stats: {}
      },
      {
        id: 'gunboat',
        name: 'Gunboat',
        role: 'naval',
        line: 'Naval',
        seats: 3,
        mount: { name: '20mm autocannon' },
        gadget: 'smoke',
        weak: 'amphibious use (water-bound)', // §5.1 R8 table (verbatim)
        identity: 'Naval support. Bounded to water.',
        stats: {}
      }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Every value inferred rather than read from the doc. §7 explicitly defers all
// physics numbers ("the numbers are not set here"), and §5.1's R8 table spells out
// only 7 of the 20 weaknesses — the rest are derived from the §3.1 identity/role
// columns. Each entry is one inference with its reason.
// ─────────────────────────────────────────────────────────────────────────────
export const PENDING = [
  // Physics + armour blocks (per chassis) — doc §7: "the numbers are not set here".
  'scout_car physics (hp 250, mass 1800, speed 16.0, rev 6.0, turn 1.8, accel 7.0, radius 1.9, height 2.0) — inferred from "fast, quiet, unarmoured recon jeep"',
  'scout_car.armour — inferred: unarmoured transport, highest damage multipliers',
  'armoured_car physics (hp 400, mass 6000, speed 12.0, rev 4.0, turn 1.2, accel 5.0, radius 2.2, height 2.4) — inferred from "infantry carrier, moderate armour"',
  'armoured_car.armour — inferred: moderate armour',
  'light_tank physics (hp 550, mass 12000, speed 9.0, rev 3.0, turn 1.0, accel 4.0, radius 2.3, height 2.6) — inferred from "light hull, direct-fire tank"',
  'light_tank.armour — inferred: armoured but light hull',
  'heavy_tank physics (hp 750, mass 45000, speed 7.0, rev 2.5, turn 0.6, accel 3.0, radius 3.2, height 3.4) — inferred from "heaviest, breakthrough, area denial"',
  'heavy_tank.armour — inferred: heaviest armour, lowest multipliers',
  'fighter physics (hp 450, mass 5000, speed 55.0, rev 0.0, turn 2.5, accel 20.0, radius 4.0, height 3.0) — inferred from "fast air superiority fighter"',
  'fighter.armour — inferred: fragile airframe',
  'helicopter physics (hp 400, mass 4500, speed 40.0, rev 0.0, turn 2.0, accel 15.0, radius 3.5, height 3.2) — inferred from "transport/spotting helicopter"',
  'helicopter.armour — inferred: fragile, AA-vulnerable',
  'boat physics (hp 500, mass 9000, speed 11.0, rev 4.0, turn 0.8, accel 4.0, radius 2.8, height 2.5) — inferred from "naval transport"',
  'boat.armour — inferred: hull armour, mid durability',

  // Chassis seat counts where the §3 roster figure (a BFH-origin reference) is below the
  // largest variant — resolved to max-variant-seats so R4 ("never add seats") holds.
  'scout_car.seats=5 — §3 roster says 3 (BFH Jeep); Courier variant carries 5, so hull capacity is 5',
  'armoured_car.seats=6 — §3 roster says 4; APC variant carries 6',
  'helicopter.seats=4 — §3 roster says 2; Transport variant carries 4',
  'boat.seats=6 — §3 roster says 4; Landing craft carries 6',

  // Light tank variant seats — the doc's C3 table has no Seats column; all three are set
  // to 2 from the BFH light tank (driver + turret gunner) and the §3 roster.
  'light_tank variant seats=2 (Javelin/Bulwark/Hunter) — C3 table omits seats; BFH light tank is 2 seats',

  // Weakness strings derived from §3.1 (the §5.1 R8 table only lists 7 of 20).
  'scout weak "no weapon at all" — derived from mount "None (passenger weapons only)"',
  'technical weak "no anti-vehicle capability" — derived from C1 Anti-vehicle=**None**',
  'courier weak "unarmed — pure transport" — derived from mount None + "Moves the squad"',
  'apc weak "no weapon at all" — derived from mount None',
  'carrier weak "no anti-vehicle capability" — derived from C2 Anti-vehicle=**None**',
  'recovery weak "unarmed — no combat role" — derived from mount None + "Repairs and revives"',
  'bulwark weak "medium anti-vehicle — no tank-killing specialisation" — derived from C3 Anti-vehicle=**Medium**',
  'assault weak "no indirect fire" — derived from direct-fire 57mm vs Siege howitzer',
  'dug_in weak "static — slow traverse, cannot relocate" — derived from "57mm, slow traverse" mount + "Static" identity',
  'interceptor weak "cannot attack ground (no bombs, no rockets)" — derived from identity "No bombs, no rockets"',
  'transport weak "no weapons at all" — derived from identity "No weapons at all"',
  'gunship weak "vulnerable to anti-air" — derived from identity "Vulnerable to AA"',
  'landing_craft weak "no weapons at all" — derived from mount None',

  // Gadget representation: the doc's C5 table gives both Interceptor and Bomber the
  // gadget "None"; a null gadget is an ABSENCE, not a shared gadget (R9 is still met —
  // the two differ by mount and role).
  'fighter Interceptor & Bomber gadget=null — doc lists gadget "None" for both; represented as null (no gadget)',

  // Light tank qualitative combat ratings mapped to stats slugs.
  'light_tank variant stats.antiVehicle/antiInfantry — C3 columns (Low/Medium/High) mapped to slugs'
];
