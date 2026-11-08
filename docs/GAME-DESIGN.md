# GAME DESIGN — Battlefield Heroes MMO (working title: NEUTRALIA)

Status: design in progress. Research inputs land in `research/`. System specs in `systems/`.
Last updated: 2026-11-07

---

## 1. Thesis

Battlefield Heroes (2009) was a 5-minute browser shooter: two cartoon factions, three classes,
50 tickets, a metagame of 28 campaigns, and a shutdown in July 2015.

An MMO built on it must keep the visual language, the class skeleton, and the *scale of the
map fight* — and replace the round-based economy with a persistent world. The central design
problem is not rendering an MMO. It is making progression horizontal rather than vertical, so
that a 2026 newcomer and a 2019 veteran fight on the same terms.

Everything below follows from three pillars.

**P1 — Weapon choice is the game.**
A player who cannot explain why they use a rifle over a shotgun has no reason to log in.
Every weapon must differ functionally from every other along at least three axes. Cosmetics
are the *reward* for depth, never a substitute for it.

**P2 — Leveling unlocks options, never power.**
Level 30 and level 1 have identical combat statistics. Level grants access to branches,
doctrines, and signatures — a wider choice set, not bigger numbers. Vertical power exists
only inside a single match, and only for the player who earns it there.

**P3 — The war you fight is not the war that exists.**
The 1936 Royal–National conflict is a proxy war fought for someone else's benefit. The
third faction is not a bolt-on; it is the premise.

---

## 2. Progression architecture — four nested layers

Each layer answers a different question, and each is tuned on a different timescale.

| Layer | Question it answers | Timescale | Currency | Resettable |
|---|---|---|---|---|
| **A. Class spec** | "What role do I play?" | Weeks–months | Class Points | Yes (free, 24h downtime) |
| **B. Weapon spec** | "How does this weapon behave?" | Weeks | Weapon Skill Points | Yes (Valor) |
| **C. Doctrine** | "What am I specifically good at?" | Days–weeks | Drop / rep | Yes (free, 30s cooldown) |
| **D. Field promotion** | "What am I good at *right now*?" | One match | Valor (in-match) | Lost on death |

The separation is deliberate. A player changes role rarely (A), tunes a weapon persistently
(B), swaps playstyle freely (C), and gambles for a temporary edge inside a fight (D).

**Three separate point pools, and the third one is the load-bearing change:**

| Pool | Source | Spends on | Cap |
|---|---|---|---|
| **Hero Points** (16) | Character level — 1 at level 1, +1 every even level | Class abilities, max level 5 each | 16 |
| **Class Points** (30) | Character level — 1 per level | The spec tree | 30 |
| **Weapon Skill Points** | **Using that weapon.** Not character level. | That weapon's tree | 8 per weapon |

Hero Points are the original's economy, unchanged — the original let players reset
abilities for a full refund, and we keep that.

**Weapon Skill Points are earned by playing the weapon, not by leveling.** This is the
single change that makes weapon choice mean something: with 8 weapons owned and 8 points
each, a player who spreads playtime across the set masters *none* of them. A player who
commits masters exactly one.

*(This was found by running the numbers — the first draft granted weapon points from
character level, which allowed a maxed player to fully specialize 3–5 weapons and made
the whole tree optional. `tools/simulate-design.py` now asserts this invariant.)*

### Layer A — Class spec (identity)

WoW pre-Mists-of-Pandaria style, reworked — but fixing the specific thing WoW got wrong.
The old talent tree failed because it produced "dip to capstone, spend leftovers
elsewhere": tons of *filler* talents taken only to reach the next tier, and one
community-solved cookie-cutter build per spec. The tree pretended to offer choice and
actually offered one answer.

**The rule: a spec must be granted, not bought with filler.** Each of the three BFH
classes has three specializations. Choosing a branch at level 10 commits 4 of 6
subsequent Class Points to it; the remaining 2 stay free. There are no filler nodes — a
point you cannot spend on something meaningful is a point you are punished for missing.

**Respec cost matters more than respec availability.** Shadowlands Covenants proved this:
heavy, hard-to-switch binding creates a meta trap where a balance patch strands you in an
off-meta choice and the "meaningful choice" becomes a resentful sunk cost. Our rule:
class spec respec is **free**, but takes 24 hours of downtime. The friction is real
enough to matter, cheap enough never to trap anyone.

| Class | Spec A | Spec B | Spec C |
|---|---|---|---|
| Soldier | **Medic** — scales *Combat Medicine* (scales with # healed), revives, deployable cover | **Demolitions** — satchel charges, mines, breach; scales *Blasting Strike* (throws players *and vehicles* aside) | **Marksman** — SMG at rifle range, scales *6th Sense* into long-range team spotting |
| Gunner | **Heavy** — *Frenzy Fire* focus-fire MG, sustained; scales *Hero Shield* | **Anti-Tank** — GL/Rocket specialisation, vehicle killing; scales *Explosive Keg* | **Sapper** — *I Eats Grenades* ordnance play, repair, area denial |
| Commando | **Recon** — *Stealth*, *Troop Trap*, spotting, sabotage | **Sniper** — *Piercing Shot*, long range, marked kills via *Mark Target* | **Infiltrator** — *Poisoned Blade*, unlock, supply theft, *Elixir* speed |

Every spec is built on an ability that **already shipped in 2009** — the specs are a
reorganization of the original's kit, not an invention on top of it. Full ability list in
`research/02-bfh-system-inventory.md`.

The Commando split (Recon / Sniper / Infiltrator) is deliberate: in the original, Commando
carried 6 abilities spanning stealth, marking, knives *and* poison — three identities, none
of them deep. Splitting it creates three viable team compositions from one base class.

### Layer B — Weapon spec (mechanics)

Every weapon carries its own short tree. Not a shared talent tree — a per-weapon tree,
because the point is that *this* weapon behaves differently from *that* weapon.

Full rules in `systems/weapon-specification.md`.

### Layer C — Doctrine (flex)

Doctrines are passive items occupying a shared capacity pool. They are earned from
reputation, quest lines, and drops. They are the layer that lets two players of the same
class play differently without respecing: a Medic running *Field Surgery* (fast self-revive,
lower heal potency) is a different player from one running *Mass Casualty* (slower, larger
AoE heal).

**Three rules, each taken from a shipped game that got it right:**

1. **Doctrines key to weapon mechanics, not to flat stats.** A Doctrine that says "+8%
   damage" is a stat. A Doctrine that says "your SMG's Burning Bullets burn 3 seconds
   longer and spread to targets within 6m" is a build. *(Hunt: Showdown trait model — the
   trait combo, not the gun, is the identity.)*
2. **A shared capacity pool is the constraint.** 5 slots, 6 with a Doctrine unlock. This
   forces trade-offs. Free-form slots with no cap produce no decisions. *(Hunt weapon
   capacity.)*
3. **Per-school exclusive perks create identity without lockout.** Doctrines tagged
   *Close*, *Heavy*, *Marksman*, *Support* only apply to weapons of that kind. Your build
   is legible at a glance and nobody is locked out of content. *(Destiny's Incandescent /
   Headstone model — it removed elemental affinity entirely because affinity *lockout*
   forced duplicate grinding, and kept the synergy.)*

**Drop model — hybrid with a deterministic floor:**
- **Fixed/crafted sources** for the core starter set. Basic competence is never gated
  behind RNG.
- **Random drops with pity/dupe-protection** for the chase tier, where scarcity makes it
  feel earned.
- **Pick-one-of-three whenever a rare Doctrine drops**, so RNG becomes a *choice* rather
  than a lottery. *(Deep Rock Galactic's Blank Core lesson — the moment is owned, not
  won.)*

**The gap between "good enough" and "perfect" must stay wide.** Chris Wilson's rule from
Path of Exile: you can clear the hardest content with roughly 70 % of the items, and the
perfect items are bragging rights, not a power wall. *(Principle 5 in
`research/03-build-design-systems.md`.)*

Applied here: a level-30 player with a competent build clears the hardest content. A
player with the *perfect* Signature and the ideal Doctrine set is faster, more elegant,
and carries visible flair — but not categorically stronger. If the perfect build were
required to clear content, every new player would hit a wall, and the chase would stop
being a chase and become a tax.

This is also the rule that keeps horizontal progression honest: the reward for mastering a
weapon is *how you play it*, not a damage number that makes the alternatives obsolete.

### Layer D — Field promotion (in-match)

In-match valor buys temporary upgrades, spent from a loadout of 3 tokens carried on the
player. **Tokens are lost on death.** A promoted player pushing an objective with +30%
damage and a temporary ability is a real, visible threat — and a real, visible loss when
they die. This is the tension that a static "grind to level" system cannot produce.

---

## 3. Level-up: exactly what it does

Level cap **30**, matching the original. The original's numbers are kept: **1 Hero Point
at level 1, +1 at every even level → 16 Hero Points maximum**, ~3.2 million XP to cap,
and a curve that flattens hard (the level 30 step is 105,6 % of the previous one). Full
curve in `research/02-bfh-system-inventory.md`.

- **Every level:** +1 Class Point. Hero Points on even levels (16 max). Weapon Skill Points
  come from **using** the weapon, not from leveling.
- **Level 3:** unlocks Doctrine slot 1.
- **Level 6:** unlocks Doctrine slot 2.
- **Level 10:** **class spec choice** — commit to a branch.
- **Level 15:** unlocks Doctrine slot 3.
- **Level 20:** unlocks Doctrine slot 4.
- **Level 25:** unlocks Doctrine slot 5.
- **Level 30:** unlocks Doctrine slot 5 (max) and the third Signature tier becomes
  reachable on any weapon with the points for it.

**Signature tiers are per weapon, not per character.** A weapon's first Signature tier
unlocks once its 5-point core tree is complete; tiers 2 and 3 follow. Each tier is a
pick-one-of-three.

**Level grants zero combat statistics.** No HP, no damage, no mobility. This is the
load-bearing decision of the whole design. It means:

- A day-one player is not a worse player; they are a more constrained one.
- Monetization cannot sell power, because power does not exist outside the match.
- Veteran gear is expressed as options (doctrines, signatures, talent branches), so new
  content widens the build space for everyone rather than invalidating old players.

**The original already had the respec.** The 2009 game let players reset ability upgrades
for a full Hero Point refund. We keep that — free respec up to the Signature, Signature
respec for 1 500 Valor. The one thing we add is the class-spec respec (free, 24h downtime),
because that is the one binding choice the original never had.

What *does* scale with progress: knowledge, loadout breadth, and access to faction content.
War effort and faction standing are tracked separately from character level, so a level-1
player who contributes to the faction war gets rewarded in the faction track, not the
character track.

---

## 4. Functional weapon differentiation — the rules

Every weapon must differ from every other weapon along at least **three** of six axes:

1. **DPS profile** — burst vs sustained vs spike
2. **Range** — effective distance and falloff shape
3. **Mobility** — movement speed, sprint, ADS timing, strafe
4. **Handling** — recoil, spread, reload, swap
5. **Utility** — slows, reveals, marks, denies, heals
6. **Team function** — what role the weapon enables a player to fill

**Anti-domination rule.** No weapon may be strictly better than another. If A beats B on
every axis at every level, one of them is cut. Every new weapon entering the roster must
be submitted with a comparison against the two weapons it most resembles.

**Specialization tree.** Each weapon has 5 nodes plus 1 Signature:

- Nodes 1–3: small mechanical shifts (branching at node 2 into two mutually exclusive paths)
- Nodes 4–5: substantial shifts that change the weapon's role in a fight
- **Signature:** the top node — one permanent choice that defines the weapon's identity

*Corrected 2026-11-07:* an earlier draft attributed this to "the Worms Weapon Factory
'special' slot". That does not exist — Worms 4's factory is a budgeted custom-weapon
builder with an overheat gauge, and the Forts Weapon Factory is a crate-producing
building. The honest origin is **Battlefield Heroes' own Workbench** (December 2012),
which attached per-weapon *Secondary Fire* and *Special Features* — but as a flat slot
swap bought with real money, with no progression and no branching.

So the tree is not an invention. **The contribution is that it is earned, branchable, and
sized.** The original let you buy a behaviour for money and apply it in one slot; ours
makes you earn a behaviour through use, choose it from three, and live with it for
months. That is a bigger difference than it sounds, and it is the difference between
*a system* and *a content pipeline*.

**The original's Workbench Special Features are the style guide for what a Signature
should feel like** — *Dr. Bullet* (heal on crit chains), *Berserk* (more damage when low),
*Meep meep!* (faster when low), *I Feel Lucky* (+5 % crit, −2 min damage at both ranges).
None is a flat stat; each is a rule about how you fight.

**Faction asymmetry.** Nationals and Royals use different weapons with different stats.
This is the original's strongest asset and it should be intensified, not flattened. A
National rifle and a Royal rifle of the same archetype should not be stat-swapped versions
of each other — they should have different falloff curves, different handling, and different
Doctrine interactions.

---

## 5. The third faction

Full treatment in `lore/third-faction.md`. Summary:

The Royal Kingdom and the National Federation have been at war since 25 August 1936 over a
disputed Olympic track-cycling result. Neither side knows that both were armed, supplied,
and directed by **Neutralia** — the only major power that signed neither the Royal Pact
nor the National Compact. Neutralia has profited from the conflict for 79 years and is now
the world's dominant power without firing a shot.

This recontextualizes the original's own content. *Summer of Heroes* (2011) put pirates,
superheroes and telekinetic wizards into the war. In the new canon, those were not
supernatural accidents: they were **products** — Neutralia's "extraordinary hero" program,
marketed to both sides, which is how the company that sells arms to everyone comes to
control the war.

**Faction structure:** three banners, one persistent world.
- **National Army** — 7 countries, capital Kyiv. Grassroots, improvised, anti-establishment.
- **Royal Army** — 6 countries, capital Paris. Institutional, professional, hierarchy.
- **Neutralia** — neutral until the endgame, offers contracts to both sides, and is the
  antagonist.

The truce that ended the original game becomes the opening: the truce was real, and it was
the moment both nations discovered what they had been fighting.

---

## 6. Quest structure

Three parallel quest tracks, deliberately layered so a player always has something to do:

**Track 1 — Contracts (repeatable, daily).**
Neutralia hires both sides. Objectives are deliberately *communal* — "hold Valley for 8
minutes", "destroy 40 structures", "escort a convoy". Neutralia pays in neutral currency and
in reputation with Neutralia. Doing them advances Neutralia standing and counts against
your own faction's war effort. This is the friction that makes faction identity a choice
rather than a formality.

**Track 2 — Commendations (tutorializing, persistent).**
The original's missions ("kill five enemies in a row without dying") become a permanent,
tracked series. Each teaches one mechanic — movement, suppression, promotion, vehicle
entry. Completing a commendation unlocks a Doctrine. This is how complex systems get taught
without a tutorial that lies.

**Track 3 — War effort (faction, world-scale).**
The metagame of 28 campaigns from the original, rebuilt as a persistent regional war with a
shared progress bar per territory. Both factions contribute to a *world* conflict meter —
and when it crosses a threshold, Neutralia responds. Seasonal cadence: ~8 weeks per season.

**Dungeons and raids** map onto the original's map vocabulary: a base is a bunker
instance, a hangar is an aircraft hangar instance, a town raid is a multi-phase urban
instance where the boss is a named commander of either faction.

---

## 7. What we are *not* doing on this server

Resource reality of this host: 3 vCPU, 3.7 GB RAM, 27 GB free disk, no GPU.

- No game binaries. The original client is closed-source and Windows-only; running it here
  would need Wine plus a full FESL/Theater stack, and would not produce a reusable artifact.
- No server emulator stood up here. The open implementations (abarichello/bfheroesFesl,
  bfhz/battlefieldHeroesBackend, lucasluqui/bfheroes-offline) are protocol references —
  valuable to *read*, expensive to *run*, and they need a real client to talk to.
- No Docker images of game server stacks. Disk and RAM do not allow it, and there is no
  client to connect.

What happens here instead: research, protocol reading, design, and at most a tiny web
prototype of the *design systems* (spec trees, promotion math) in a scratch directory — a
few hundred KB, no daemon, no port exposure.

---

## 8. Open design questions

1. **Faction switching.** Can a player change banner? If the war effort is per-faction and
   contracts advance Neutralia, is cross-faction play a feature (like classic WoW) or a bug?
2. **Doctrine drop economy.** Random drops create build lottery; fixed drops create a
   meta. A hybrid (fixed core, random affix) needs testing.
3. **Vehicle crew.** The original had 4 vehicles per faction. Are vehicles player-owned
   persistent mounts (with their own trees) or map objects?
4. **The endgame.** What does a maxed player do? Neutralia must have a raiding tier that is
   not "kill the boss harder" — the third faction needs its own build vocabulary.

---

## 9. What is built and verified

| Artifact | Path | Verified by |
|---|---|---|
| Design master | `GAME-DESIGN.md` | — |
| Weapon system spec | `systems/weapon-specification.md` | — |
| **Class × weapon-family system** | `systems/class-and-weapon-families.md` | **NEW 2026-11-07** — matrix, 4th class, art direction |
| **Class-exclusivity precedent research** | `research/04-class-weapon-family-exclusivity.md` | **NEW** — DRG, TF2, WoW, Overwatch, Hunt, New World, GDP3 |
| Lore / third faction / quests | `lore/third-faction.md` | — |
| Feasibility report | `FEASIBILITY.md` | Gate 0–3, live API checks |
| BFH system inventory | `research/02-bfh-system-inventory.md` | Scraped from battlefield.fandom.com + bfh-info |
| Artillery reference | `research/01-weapon-factory-mechanics.md` | Tank Stars, Worms, Cannonheim, ShellShock Live |
| BFH Workbench analysis | `systems/weapon-specification.md` §1b | battlefield.fandom.com + bfh-info |
| Build-system principles | `research/03-build-design-systems.md` | DRG, PoE, WoW, Hunt, Destiny 2, Valorant/Warframe |
| Progression simulator | `tools/simulate-design.py` | `ALL CHECKS PASSED` — asserts the invariants |
| Interactive prototype | `prototype/index.html` | `39/39` DOM checks pass in headless Chromium |

**The prototype is the reference implementation of the progression design.** It implements
the three point pools, the per-weapon tree with its branch, the three pick-one-of-three
signature tiers, Doctrine capacity and its per-weapon keying, and the in-match promotion
cost curve. Click through it to feel whether the choices are real.

**What the simulator caught.** The first draft granted Weapon Skill Points from character
level. The simulator proved that let a maxed player fully specialize 3–5 weapons, which
made the entire tree optional and killed the design's central premise. The fix — points
earned by *using* the weapon — is now asserted in both the simulator and the DOM test.

**What the research corrections caught (2026-11-07).** Three claims in this design were
wrong and have been fixed against primary sources:

1. **The "Worms random special effect" tier system does not exist.** Worms 4's Weapon
   Factory is a budgeted custom-weapon builder with an overheat gauge; the Forts Weapon
   Factory is a crate-producing building; the W.M.D. weapon table has no tier column. The
   pick-one-of-three Signature rule is now correctly sourced to **Deep Rock Galactic's**
   Overclock offer.
2. **BFH's Widgets were functional, not cosmetic.** Bandages, Terrific Health Tonic
   (instant 50 HP), Sarge's Stamina Boost (+10 max HP) and the telekinetic Amassing Force
   were sold for real money. The "premium buys cosmetics only" rule now stands as a
   deliberate *correction* of the original rather than a description of it.
3. **The 346-weapon arithmetic was wrong.** It is 185 base weapons plus 161 tier
   variants — and the 185 base weapons occupy only **55 distinct stat profiles** (34
   grenade launchers → 5), though they carry **95 distinct behaviours**, so they were not
   interchangeable. The original reskinned itself twice.

**And one finding that improves the design rather than correcting it:** Battlefield Heroes
shipped a **Workbench** in December 2012 — per-weapon upgrade slots with *Secondary Fire*
and *Special Features* rows. The original already had per-weapon behavioural upgrades.
They were bought with real money, applied as flat slot swaps, and never grown into depth.
See `systems/weapon-specification.md` §1b.

---

## 10. Class × weapon-family system (added 2026-11-07)

The class is no longer a stat block. **A class is the set of weapon families it may use,
plus one utility only it can perform.** The full system is in
`systems/class-and-weapon-families.md`.

The concept is **Orthogonal Differentiation** — *"differences in abilities of game
entities that are in type rather than in value"* (GDP3 / Chalmers; coined by Harvey Smith
2003). The original already had the backbone: **7 of its 9 weapon families were
class-locked.** The flaw was where the boundary was drawn — the Soldier held 6 of 9
families and 97 of 185 weapons, while the Gunner and Commando held 2 each. One class was
a superset of the game.

| Family | Soldier | Gunner | Commando | **Engineer** (new) |
|---|:--:|:--:|:--:|:--:|
| SMG | ● | | | |
| Pistol | | | | ● |
| Shotgun | ● | | ● | |
| MG | | ● | | |
| Rifle | | | ● | |
| Knife | | | ● | |
| Grenade Launcher | ● | ● | | |
| Rocket Launcher | | ● | | |
| Artillery | | | | ● |
| TNT / Demolition | ● | | | |
| Field Kit / Support | | | | ● |
| **Families** | **4** | **3** | **3** | **3** |

**Invariant (asserted by the simulator): no class is a strict subset of another's
families, every family is usable by someone, and every class has exactly one exclusive
utility.** The original's spread was 6-2 = 4 families; ours is 4-3 = 1.

**The fourth class is the Engineer** — Pistol, Artillery, Field Kit, with
*Field Repair* as its exclusive utility. It is built from **widgets the original already
sold as consumable premium items** (Supreme Wrench, Metallo's Rocket Jump, Titan
Security Thruster Fuel, Jeep Jump): the original sold the concept as a purchase, we give
it a permanent home as a class. It serves whichever faction holds the field, which is
also what makes Neutralia concrete in fiction.

**A new roster target follows from this:** 11 families × 10 weapons = **110 base
weapons**, each required to differ from its two nearest family-mates on ≥3 of 6 axes —
against an original that shipped 185 base weapons in 9 families, with 34 grenade
launchers sharing 5 stat profiles and 12 knives sharing exactly 1.

**Art direction for the new class** (read from the original's renders via vision, 2026-11-07):
top-heavy heroic proportion rather than chibi, angular jaw, exaggerated hands and boots,
thick variable-width ink outline, cel-shading with soft digital-paint shadows, weapons held
away from the body for silhouette readability. The Engineer reads as a tradesman — satchel,
tool roll, goggles on the forehead, a bolted-on mechanical silhouette, industrial
yellow-ochre deliberately outside both factions' palettes.
