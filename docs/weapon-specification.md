# Weapon Specification System

Companion to `GAME-DESIGN.md`. Implements pillar P1 — weapon choice must be functional.

**All numbers below are drawn from the actual Battlefield Heroes data** (scraped from
battlefield.fandom.com and bfh-info.cs-heroes.cz on 2026-11-07; raw data in
`research/02-weapon-roster.json` and `research/wt_Weapon_Variants.txt`).

---

## 1. The problem this solves — measured, not asserted

The original Battlefield Heroes shipped **346 weapons**. The breakdown, from the scraped
roster:

| Category | Count | Class |
|---|---|---|
| SMG | 64 | Soldier |
| Rifle | 64 | Commando |
| MG | 62 | Gunner |
| Pistol | 44 | Soldier |
| Grenade Launcher | 40 | Soldier + Gunner |
| Shotgun | 40 | Soldier + Gunner |
| Knife | 22 | Commando |
| Sticky TNT | 6 | Soldier |
| Grenade | 4 | Soldier |

**346 weapons. Nine functional archetypes. And the arithmetic is worse than "9 × 5".**

Measured against the scraped roster and stat detail:

- **185 base weapons**, **161 tier variants** (37 Super, 37 Uber, 21 Stolen, 21 Pilfered,
  13 Dapper, 13 Stylish, 16 Golden).
- The 185 base weapons **share their stat profiles heavily**: only **55 distinct 4-axis
  stat profiles** across all 185 (range, rate of fire, ammo, damage), so only 7 weapons
  have a unique profile. **34 grenade launchers collapse to 5** — *M32 MGL* and
  *Tank Buster* differ only in magazine count. Across the rest: 29 SMGs → 11 profiles,
  29 MGs → 8, 31 rifles → 10, 22 pistols → 9, 18 shotguns → 7, **12 knives → 1**.
- **But they are not interchangeable.** The same 185 weapons carry **95 distinct
  behaviour descriptions**. *Tank Buster* is a "long range anti-vehicle weapon";
  *M32 MGL* is a "bulky grenade launcher... great for laying down areas of infantry
  destruction". The Knife family is the extreme case — **12 knives, one stat profile,
  7 distinct behaviours** (*Sensei's Striking Edge*: "slow but long and powerful";
  *Dirk's Digger*: "for digging graves").

The tier system on top:

| Tier | Stat effect | Cost | Release |
|---|---|---|---|
| **Base** | — | Valor / Play4Free Funds | launch |
| **Dapper** (Roy) / **Stylish** (Nat) | **statistically identical**, cosmetic only | Battlefunds / P4F | Heroes of the Fall |
| **Super** / **Uber** | "statistically and cosmetically different... featuring **minor stat changes**" | Battlefunds / VP / P4F | Winter Armistice |
| **Stolen** / **Pilfered** | identical, but the *enemy's* weapon | Battlefunds | 19 May 2010 |
| **Golden** | premium | — | later |

Faction split is exactly 173 / 173. Class split: Soldier 178, Commando 86, Gunner 82.

**This is the actual design problem, stated in numbers.** The original reskinned itself
twice: 185 base weapons occupying **55 stat profiles but 95 distinct behaviours**, then
161 cosmetic-and-minor-stat variants on top. Weapon choice was therefore mostly *cosmetic
choice*, and the "minor stat changes" on Super/Uber were **paid** upgrades — a
pay-to-win layer bolted onto a reskin farm. Precisely the model that cannot survive into
an MMO where horizontal progression is the whole point.

*(Correction, 2026-11-07: an earlier draft of this paragraph said the base weapons were
"functionally ~25" and were "near-duplicates". The measured behaviour data shows that was
too strong — 95 distinct behaviours across 185 weapons is not 25. The stat-clone ratios
are real and measured; the interchangeability claim was wrong. See
`systems/class-and-weapon-families.md` §2.1.)*

**The pivot:** keep the 9 archetypes (they are good — 3 classes × primary + secondary),
and make the *depth per archetype* the content instead of the *count*.

**Follow-on (2026-11-07):** the class×family re-cut and the fourth class now live in
`systems/class-and-weapon-families.md`. The 9 archetypes are re-cut into **11 families**
across **4 classes**, and the roster target drops to **110 base weapons** — 10 per family,
each required to differ on ≥3 of 6 axes.

---

## 1b. What the original already had: the Workbench

**Added 2026-11-07.** An earlier draft of this document claimed the original "had no way
to express" a behaviour-only weapon option. That was wrong. **Battlefield Heroes shipped
exactly that system** — and it shipped it *last*, in December 2012, as a late content
patch.

The **Workbench** (introduced 5 December 2012) lets you modify any weapon you own
permanently. Each weapon has a limited number of upgrade slots, and **only one upgrade of
each type can be equipped at a time** — equipping a second of the same type deletes the
first. Three categories:

**1. Upgrades** (mostly flat stats, per weapon class): *Super Packin'* (MG ammo +10),
*Packin' I–III* (ammo +2/+3/+4, crit +1 %/+1 %/+1 %, crit damage +1/+1/+2), *Fingers
Crossed I–III* (crit), *Come Closer I–III* (short-range distance), *Just Right I–III*
(short-range min. damage, with range falloff), *Rifle Focus I–III* (recoil), *Highly
Explosive I–III* (explosion damage/radius/force), *Go Away! I–III* (pushback), *Super
Crit*, *Standard Scope* (equips a scope but **blocks the secondary-fire slot**).

**2. Secondary Fire** — this is the important one. These are *new behaviours bolted onto
the weapon*:
| Secondary Fire | Effect | Applies to |
|---|---|---|
| **Explosive Shot** | Adds a burst of explosive firepower | MGs |
| **Quick Fire** | Raises the weapon's rate of fire | MGs |
| **Push Beam** | Fires a beam that **pushes enemies away** | SMGs |
| **Underslug Grenade Launcher** | Equips the weapon with a grenade launcher | SMGs, Shotguns |
| **Shotgun Attachment** | Equips the sidearm with a shotgun | Sidearms |
| **Laser Beam / Laser Charge / Punk Shotgun / Energy Ball** | Replaces the firing mode entirely | various |

**3. Special Features** — *conditional* behaviours, not stats:
| Special Feature | Effect |
|---|---|
| **Dr. Bullet** | Regain 5 HP every 3rd critical hit |
| **Berserk** | Deal 17 % more damage at 20 HP or below |
| **Explosion Demotion** | Take 20 % less explosion damage |
| **Meep meep!** | Run faster at 30 HP or below (scales with Leg It) |
| **Heavy 'n Steady** | Take 35 % less explosion force |
| **I Feel Lucky** | **+5 % crit chance, but −2 min damage at short *and* medium range** |

**I Feel Lucky is the exact principle this document was built on, shipped in 2009-era code:**
a real trade — you gain crit, you lose flat damage — expressed as a *gamble* the player
opts into, because it narrows their effective band.

**What the Workbench gets right, and what it does not:**

- *Right:* per-weapon identity. *Push Beam* on an SMG makes that SMG a different weapon.
  *Meep meep!* is a real playstyle. One upgrade per type forces a coherent build instead of
  a pile of stacking bonuses.
- *Wrong:* it is a **slot-swap grid, not a tree**. No progression path, no branching, no
  depth. You either own the upgrade or you do not. There is no *earning* a signature; you
  buy it — and it was priced in **Play4Free Funds**, i.e. real money.
- *Wrong:* the upgrade slots were not standardised, so the best build was whichever weapon
  happened to have the most slots.

**So the pivot stands, but it is now sharper and better founded.** The original shipped a
*flat* version of this system two years in and then never built depth on top of it. Our
contribution is not "per-weapon upgrades exist" — **the original did that** — it is that
they become a **branching tree earned through use**, with a behaviour-only Signature at
the end that cannot be bought.

---

## 2. The six axes

Every weapon is defined across six axes. A weapon is valid only if it differs from every
other weapon in the same archetype by at least **three**.

| Axis | What it controls | Range in this design |
|---|---|---|
| **DPS profile** | How damage arrives | burst 3×100 / sustained 8×25 / spike 1×250 |
| **Range** | Effective distance, falloff shape | sharp falloff past 40m / flat to 90m / short-range only |
| **Mobility** | Move speed, sprint, ADS time | fast strafe + slow ADS / slow + instant ADS |
| **Handling** | Recoil, spread, reload, swap | high recoil + fast reload / low recoil + slow swap |
| **Utility** | Secondary effects | slow / reveal / mark / deny / heal / resupply |
| **Team function** | The role it enables | solo-ko, team-stabilize, zone-control, objective-hold |

**Anti-domination check.** Before a weapon ships it must be compared against the two
weapons it most resembles. If it wins on all six axes, it is cut. If it wins on four, one
win must be paid for on one of the other two.

**Functional floor.** A weapon's category is defined by what it does, not what it looks
like. A "rifle" that cannot contest mid-range is not a rifle in this system regardless of
its model.

---

## 3. The per-weapon tree

Each owned weapon has its own tree. Shared currency (Valor, earned by playing) buys nodes.
Short tree, meaningful branch.

```
        [Node 1]              cost 1
             |
        [Node 2] ──┬── [Node 3a] ──┐   cost 2 for the branch
                    └── [Node 3b] ──┤
                                    ├── [Node 4] ── [Node 5]      cost 1 each
                                    └── [Node 4′]
        [Signature tier 1]   cost 1  — pick one of three
        [Signature tier 2]   cost 1  — pick one of three
        [Signature tier 3]   cost 1  — pick one of three
                                    TOTAL = 8 points per weapon
```

- **Node 1** — small mechanical shift. Always a straight upgrade of an existing behaviour.
- **Node 2** — the branch point. Two mutually exclusive paths, each pushing one axis hard
  in one direction. This is where identity starts.
- **Node 3a / 3b** — commit to a path. Respec allowed for Valor.
- **Node 4 / 4′** — role shift. A mid-range shooter becomes either an objective-holding
  tool or a pure duelist.
- **Node 5** — capstone: a change that interacts with other systems (a suppressor that
  also cuts spotting radius; a shotgun that also breaks vehicle tracks).
- **Signature tiers 1–3** — three separate pick-one-of-three choices, each unlocking a
  further permanent change to what the weapon does.

**Weapon Skill Points accrue in combat.** Per-weapon use XP, so levelling a weapon means
playing that weapon — not clicking a button, and not leveling your character. The tree
itself is spent out of combat at a bench, and the whole tree respecs cheaply and freely
up to the Signature.

### The Signature is the load-bearing node

A Signature must be a **behavioural change**, not a stat. A new fire mode, a new
interaction, a new rule about what the weapon can do — not "+8% damage".

**Name the behaviour, not the bonus.** Tank Stars names its *weapons* *Volley*, *Vertical
Slam*, *Splitter Chain*, *Napalm Strike* — almost none of them describe a number, because
a player reading "Vertical Slam" understands what they will be doing at the 30 % mark (it
fires up to 3 guided rockets that loop in the air and track a target they fly over). The
original Battlefield Heroes' Workbench Special Features follow the same discipline:
*Dr. Bullet*, *Berserk*, *Meep meep!*, *I Feel Lucky* — none of them is a number. Our
Signatures follow the same rule: *Executioner*, *Phantom*, *Overwatch*, *Interceptor*,
*Saboteur*. If a Signature name can be replaced with "+8 % damage" without anyone
noticing, the name failed.

**It is offered pick-one-of-three.** This is the single most important interaction
decision in the system. The source is **Deep Rock Galactic**: a weapon Overclock is
normally *rolled* at drop time, but a Blank Matrix Core lets the player **choose** — 2
weapon options and 1 cosmetic — so the *choice* becomes the memory and the grind is only
the setup. *(Not Worms: an earlier draft of this document attributed a random "special
effect" upgrade tier to the Worms Weapon Factory. That system does not exist — Worms 4's
factory is a budgeted custom-weapon builder with an overheat gauge, and the Forts Weapon
Factory is a crate-producing building. Checked against the primary wikis on 2026-11-07.)* When a rare drop happens, offering three Signature options turns
a lottery into a choice, and the moment becomes *owned* rather than *won* — the player
remembers choosing, not getting lucky. *(Deep Rock Galactic's Blank Core lesson.)*

**It binds, but respecs for a non-trivial yet affordable cost.** Weight without a trap.
Fully free respec makes the choice meaningless; hard-lock traps people in a bad pick
after a balance change and turns the "meaningful choice" into a resentful sunk cost
*(Shadowlands Covenants)*. Our rule: **the Signature respecs for 1 500 Valor** — two
hours of play, never a trap.

**Why three tiers rather than one.** A single Signature is a single decision, and after a
month of play every player has made it and never thinks about it again. Three tiers means
the weapon keeps asking the player a question, and the weapon's identity evolves over the
first three months of ownership rather than being fixed on day one.

**Total investment per weapon: 8 points.** With 8 weapons owned, mastering the set costs
64 points — and points are earned per weapon by playing it. A player who spreads playtime
across the set masters *none* of them. A player who commits masters exactly one.

*(The first draft of this document granted weapon points from character level, which let a
maxed player fully specialize 3–5 weapons and made the whole tree optional. The numbers
were run and the design was corrected. `tools/simulate-design.py` now asserts this
invariant, and `prototype/test-prototype.js` asserts it in the live DOM.)*

---

## 4. The three real BFH classes, as they actually were

Extracted from the wikitext, not invented. Health and ability counts are the original's.

### Soldier — 110 HP, "combines aspects of the Assault and Medic kits"
Weapons: SMG (primary, 64), Pistol (44), Shotgun (40), GL (20), Grenade (4), Sticky TNT (6)

| Ability | Actual effect |
|---|---|
| **Sixth Sense** | You and your team see all nearby enemies for a short time |
| **Burning Bullets** | SMG shots set enemies on fire, damage over time (extinguished by Combat Medicine) |
| **Combat Medicine** | Instantly heals player and nearby allies; amount scales with number healed |
| **Grenade Spam** | Throws multiple grenades at a target |
| **Blasting Strike** | Strikes with such force that nearby players *and vehicles* are thrown aside |

Note *Combat Medicine* scales with player count — it was already a **cooperative** ability
in 2009. That is a gift to the MMO design: the class fantasy was already team-scale, not
solo-sustain.

### Gunner — 150 HP (highest), "the go-to class for Anti-Vehicle Warfare"
Weapons: MG (primary, 62), GL (20)

| Ability | Actual effect |
|---|---|
| **Leg It** | Increases movement speed of player and nearby allies |
| **Frenzy Fire** | Improves MG accuracy to focus a single target; heals a % of health every 4th hit |
| **Explosive Keg** | Hurls a large explosive barrel that can be shot to explode early; causes enemies hit to run slower |
| **Hero Shield** | Absorbs damage for player and nearby allies for a few seconds |
| **I Eats Grenades** | Gobbles up all nearby explosives for a short time; each grenade eaten recovers health |

### Commando — 80 HP (weakest), "can do the most damage per hit", fastest infantry
Weapons: Rifle (primary, 64), Knife (22)

| Ability | Actual effect |
|---|---|
| **Stealth** | Cloaking from enemy view |
| **Elixir** | Increases speed and defense for a short time |
| **Mark Target** | Receive points for designating enemy targets for your team; can reveal enemy Commandos using Stealth |
| **Troop Trap** | Place an explosive that triggers when enemies approach too close *or when it is shot* |
| **Piercing Shot** | Increases damage done by sniper rifles |
| **Poisoned Blade** | Knife damage poisons the victim, losing health over time |

**Two design golds in the original, already present:**
1. *Mark Target* / *Sixth Sense* — **team information as an ability**. The Commando earns
   points for marking; the Soldier reveals for the whole team. Information warfare was
   native to the class kit.
2. *Poisoned Blade* / *Burning Bullets* — **damage-over-time as a weapon property**, not a
   status effect bolted on. The knife and the SMG have their own identity.

---

## 4b. Worked examples

Illustrative. Final numbers come from the roster research in
`research/02-bfh-system-inventory.md`.

### 4b.1 National Army assault rifle — "StG 44"

Base: 24 damage, 600 RPM, 4-round mag, moderate falloff past 45m, 4.2 m/s strafe.

| Node | Axis | Change |
|---|---|---|
| 1 | Handling | −25% vertical recoil |
| 2 | **branch** | *Marksmanship* → *Close-quarters* |
| 3a | Range | ×1.4 effective range, falloff starts at 70m |
| 3b | Handling | ×1.8 ADS speed, −15% damage |
| 4a | Team function | Marks kills reveal the target for 2s to teammates |
| 4b | DPS profile | Sustained fire becomes burst-fire, ×2.2 burst damage |
| 5 | Utility | Suppressed fire: no tracers, −40% audio detection radius |
| **Signature A** | — | *Executioner*: a kill instantly refreshes 25% of magazine |
| **Signature B** | — | *Sapper*: kills drop a 15-second ammo crate |
| **Signature C** | — | *Ghost*: standing still for 3s grants full concealment for 1 shot |
| **Signature D** (L30) | — | *Marksman*: every 5th kill grants +20% movement speed for 3s |

**Signature D is the model to copy.** It is not a bigger number — it is a *new interaction*
(kills feed mobility) that changes how the weapon is played: the SMG becomes a hit-and-move
weapon rather than a static spray. All four signatures change behaviour, never just damage.

### 4b.2 Royal Army sniper rifle — "Lee-Enfield"

Base: 85 damage, 45 RPM, 5-round mag, very sharp falloff past 120m, slow ADS.

| Node | Axis | Change |
|---|---|---|
| 1 | Range | −10% falloff beyond 150m |
| 2 | **branch** | *Stability* → *Speed* |
| 3a | Handling | −40% recoil, +1 zoom step |
| 3b | DPS profile | ×1.6 fire rate, −15% damage |
| 4a | Utility | Hits mark the target (shows on all team displays) |
| 4b | Mobility | +12% movement speed while scoped, −25% while unscoped |
| 5 | Team function | Destroying a vehicle with this weapon awards a squad-wide damage buff |
| **Signature A** | — | *Overwatch*: the first shot after 2s unscoped deals ×2 |
| **Signature B** | — | *Spotter*: marks last for 8s and shows enemy count, not positions |
| **Signature C** | — | *Saboteur*: +30% damage to vehicles |
| **Signature D** (L30) | — | *Marksman*: a marked target takes +15% damage from all sources |

*Spotter* and *Marksman* build on the original's own *Mark Target* ability — the
Commando's kit already had team information as a mechanic. The Signature system extends
what the game already did well.

### 4b.3 Commando SMG — suppressed "MP40"

Base: 14 damage, 900 RPM, 30-round mag, short range, fast movement.

This weapon's identity is **information denial**, not damage. Its tree pushes utility and
mobility, and its signatures remove the enemy team's advantage rather than dealing more
damage:

- **Signature A** — *Phantom*: while not firing for 4s, the player appears as a friendly
  dot on enemy minimaps.
- **Signature B** — *Interceptor*: destroying enemy deployables (sandbags, ammo crates)
  grants +40% movement speed for 4s.
- **Signature C** — *Saboteur*: destroyed enemy deployables drop the enemy's own valor.

**Signature A is the strongest idea in this document.** It is purely about *information*,
with zero damage attached, and it inverts the enemy's scouting advantage rather than
out-shooting anyone.

*Corrected 2026-11-07:* an earlier draft said this "could not exist in the original's
model". That is no longer defensible — the Workbench (see §1b) could attach a *Special
Feature* to any weapon, and the original already had information-warfare abilities
(*Sixth Sense* reveals for the whole team; *Mark Target* counters stealth). What the
original could not do was make a signature *earned and permanent* — Workbench upgrades
were bought with real money and applied as slot swaps, with no progression. **The gap is
in the economy and the depth, not in the expressive range.** That is a more useful and
more honest framing, and it is also a better argument for the design: we are not
inventing a capability, we are making the capability *earned, branchable, and paid for
with play*.

---

## 5. Three specs per class

WoW pre-Mists-of-Pandaria style, reworked. Each class has three specializations. Choosing
a branch at level 10 commits 4 of 6 subsequent Class Points to it; 2 stay free.

| Class | Spec A | Spec B | Spec C |
|---|---|---|---|
| **Soldier** | **Medic** — scales Combat Medicine, revives, deployable cover | **Demolitions** — satchel charges, mines, breach; scales Blasting Strike | **Marksman** — SMG at rifle range, scales Sixth Sense into long-range spotting |
| **Gunner** | **Heavy** — Frenzy Fire focus, sustained MG, scales Hero Shield | **Anti-Tank** — GL/Rocket specialisation, vehicle killing, scales Explosive Keg | **Sapper** — I Eats Grenades ordnance play, repair, area denial |
| **Commando** | **Recon** — Stealth, Troop Trap, spotting, sabotage | **Sniper** — Piercing Shot, long range, marked kills | **Infiltrator** — Poisoned Blade, unlock, supply theft, speed |

**The Commando split is deliberate.** In the original, Commando was a single sniper
archetype with 6 abilities covering stealth, marking and knives all at once — a class
carrying three identities and none of them deeply. Splitting it into Recon / Sniper /
Infiltrator creates three viable team compositions from one base class.

---

## 6. Field promotion (in-match)

Separate from the persistent tree. In-match valor buys temporary upgrades from **3 tokens
carried on the player**. Tokens are lost on death.

| Cost | Upgrade | Effect |
|---|---|---|
| 50 | *Rearm* | Refill magazine, no reload animation |
| 100 | *Overcharge* | +25% damage to the next 8 shots |
| 150 | *Marksman* (temporary) | Reveal all enemies within 60m for 3s |
| 250 | *Deployable* | Spawn a temporary sandbag or ammo crate |
| 400 | *Special* | Class-specific temporary ability |

Cost curve matters: 400 valor buys either two Overcharges or one Deployable. Tokens are
the scarce resource, not money — so a player who spends early is weak late in the match.

---

## 7. Faction asymmetry

National and Royal weapons are **not** stat-swapped variants. The original's roster has
perfect 173/173 symmetry, which is a design dead end — same numbers, different names.

**We keep the symmetry of availability but break the symmetry of behaviour:**

- **National weapons** — high handling, lower range, faster recovery, more utility.
  Grassy, improvised, forgiving. Utility leans on the original's own kit: Burning Bullets,
  Blasting Strike, Poisoned Blade.
- **Royal weapons** — precision, reach, heavier handling, higher burst damage.
  Institutional, deliberate, punishing to use badly. Utility leans on suppression and
  control: Hero Shield, Leg It, Frenzy Fire.

A National rifle and a Royal rifle of the same archetype differ in falloff *shape*, not
falloff *amount*. Two players at the same level with the same Doctrine still fight
differently because their tools behave differently.

**Doctrine interaction.** Each weapon declares which doctrine families it interacts with —
some doctrines only work with close-range weapons, some with heavy. This makes loadouts
cohere rather than being a bag of unrelated percentages.

---

## 8. Anti-patterns

- **Stat inflation.** Upgrading a weapon should change *behaviour*, not just numbers. If
  Node 5 is "+8% damage", the weapon is still the same weapon — the tree failed.
- **Dominant branch.** If one branch of Node 2 is strictly better, the branch is a fake
  choice. Every branch must be better in a different situation.
- **Respec as punishment.** Respec must be affordable. A player who experiments should not
  be locked into a bad tree for a month.
- **Horizontal bloat.** Nine weapons with identical function and different names is a
  worse roster than five weapons with distinct functions. **The original had 346 and it
  was the problem, not the solution.**
- **Signature dilution.** If a signature is a flat bonus, it is a cosmetic tier. Each
  signature must change *what the weapon does in a fight*.
- **Paid power tiers.** Super/Uber were bought with premium currency for "minor stat
  changes". In this design, **no premium currency may purchase any stat**. Premium buys
  cosmetics, Doctrine *variants*, and storage — nothing else.
