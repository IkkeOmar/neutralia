# Class Systems and Weapon Families

Companion to `GAME-DESIGN.md` and `systems/weapon-specification.md`. Implements the deeper
half of pillar P1: *weapon choice is the game* — and the class is what makes the weapon
families mean something.

Research basis: `research/04-class-weapon-family-exclusivity.md` (precedents),
`research/02-bfh-system-inventory.md` (the original's real numbers),
`research/02-weapon-roster.json` + `research/bfhinfo_items_detail.json` (measured data).
All primary sources were fetched live on 2026-11-07; claims are marked `[verified]`.

---

## 1. The concept that names this problem

**Orthogonal Differentiation** — *"Differences in abilities of game entities that are in
type rather than in value."* `[verified]` — GDP3 Game Design Pattern Library, Chalmers
University of Technology / University of Gothenburg, `gdp.cse.chalmers.se`. Coined by
**Harvey Smith** (GDC 2003), formalised as a design pattern by **Björk & Holopainen**
(*Patterns in Game Design*, 2004).

The argument, verbatim:

> "When these abilities and the functionality they provide do not only have quantitative
> but also qualitative difference this means that the games have Orthogonal
> Differentiation. This give the different game pieces additional value since they
> represent **the only ways for players to perform certain actions**. Not all or many
> aspects of the game entities need to be unique; often it is sufficient that a
> **single ability is radically different** from other units for it to have special
> gameplay value."

Two sentences from that page matter most for us:

> "It is achieved through Asymmetric Abilities between Characters or Units. However,
> Asymmetric Abilities is not enough since **the differences need to be in type rather
> than in degree.**"

> "Orthogonal Differentiation is used in games to either provide more gameplay without
> increasing production costs or create more Complex Gameplay, or both."

**Why this is the right frame for the brief Omar gave.** "Make the weapon system much more
detailed and much more specialized according to different classes" is, in design terms, a
request for *orthogonal* differentiation — the class must differ by **what it can do**,
not by **how much**. A Gunner with 150 HP is a value difference. A Gunner who is the
*only* class that can repair a vehicle mid-fight is a type difference, and no amount of
stat tuning can substitute for it.

**The resolution the GDP3 page hands us for free:**

> "However, they can be combined by treating the differentiated units as a set and have
> the same sets for all players or all Teams."

That is the fairness answer: every team faces the *same set* of orthogonal classes, so
type-difference and symmetry coexist. We do not need the classes to be numerically equal.

### 1.1 The failure mode we are steering away from

**Apex Legends** is the clean shipped example of what not to do. Its classes are numeric
perks on fully shared weapons — *"Assault Legends carry more ammo per stack and have extra
grenade slots… They also use weapons faster than other Legends"*; Rampart's passive is
*"increased magazine capacity and faster reloads when using LMGs."* `[verified]` — EA
official help page + Apex Legends wiki.

Every Legend can carry every gun. The class only nudges how good you are with certain
ones. That is value-differentiation pretending to be type-differentiation, and it is
exactly the design where "one class is a strict upgrade" is impossible to avoid.

---

## 2. What the original already had — and the flaw in it

The 2009 game shipped **185 base weapons** across **nine categories** and three classes.
Measured from the scraped roster (`research/02-weapon-roster.json`):

| Category | Soldier | Gunner | Commando | Total |
|---|---|---|---|---|
| SMG | 29 | — | — | 29 |
| Pistol | 22 | — | — | 22 |
| Shotgun | 18 | — | — | 18 |
| Grenade Launcher | 18 | 16 | — | 34 |
| Grenade | 4 | — | — | 4 |
| Sticky TNT | 6 | — | — | 6 |
| MG | — | 29 | — | 29 |
| Rifle | — | — | 31 | 31 |
| Knife | — | — | 12 | 12 |
| **Total** | **97** | **45** | **43** | **185** |

**Seven of the nine families are already class-locked.** Only the Grenade Launcher is
shared (Soldier *and* Gunner). The Gunner's own page states it: *"The gunner specializes in
the use of machine guns, shotguns, and rocket launchers… the **only class with Rocket
Launchers**."* `[verified]` — battlefield.fandom.com/wiki/Gunner. The Soldier's page:
*"capable of utilizing submachine guns, shotguns, and pistols."* `[verified]`

**So the original already had the backbone of orthogonal differentiation. And this is the
flaw: the Soldier held six of the nine families and 97 of the 185 weapons; the Gunner and
Commando held two each.** One class was a superset of the game.

**The measured problem is therefore not "weapons are too similar" — it is that the class
boundary was drawn in the wrong place.** The Soldier was a catch-all, and the other two
were specialists with almost nothing to specialise in. Measured exclusive-only weapons:

| Class | Weapons only this class can use | Weapons in a shared family |
|---|---|---|
| Soldier | 79 | 18 |
| Gunner | 29 | 16 |
| Commando | 43 | 0 |

### 2.1 The second measured problem: the roster was mostly stat-clones

Recomputed directly from the project's own scraped data (`02-weapon-roster.json` +
`bfhinfo_items_detail.json`), over the four stat axes the site exposes (range, rate of
fire, ammo, damage):

**185 base weapons collapse to 55 distinct stat profiles. Only 7 of 185 have a unique
profile; 178 share theirs with at least one other weapon.**

| Family | Weapons | Distinct stat profiles | Clone ratio | Distinct behaviours |
|---|---|---|---|---|
| Grenade Launcher | 34 | 5 | **6.8×** | 11 |
| MG | 29 | 8 | 3.6× | 17 |
| Rifle | 31 | 10 | 3.1× | 17 |
| SMG | 29 | 11 | 2.6× | 16 |
| Shotgun | 18 | 7 | 2.6× | 10 |
| Pistol | 22 | 9 | 2.4× | 12 |
| **Knife** | **12** | **1** | **12×** | **7** |
| TNT | 6 | 4 | 1.5× | 3 |
| Grenade | 4 | 3 | 1.3× | 2 |

**But the important finding is the last column, and it corrects the obvious reading.**
There are **95 distinct behaviour descriptions** across the 185 base weapons. The
Grenade Launcher's 14 identical-stat weapons are not interchangeable — *Tank Buster* is a
"long range anti-vehicle weapon", *M32 MGL* is a "bulky grenade launcher... great for
laying down areas of infantry destruction", *Sam's SAM* is a different weapon entirely.
The Knife family is the extreme case: **12 knives, one single stat profile** (range 1,
ROF 3, no ammo, no damage value) but **7 distinct behaviours** — *Sensei's Striking Edge*
has "slow but long and powerful" swings, *Knuckleduster Dagger* is "a perfect weapon for
those surprise attacks deep behind enemy lines", *Dirk's Digger* is "for digging graves".

**So the original was never purely a reskin farm — it differentiated by *behaviour* and
wasted the *numbers*.** That is the accurate statement, and it matters for the design: we
are not adding a dimension the original lacked (it had behaviour variation), we are
**fixing the dimension it had and did not use** — and this is the same correction the
Workbench finding forced on the special-features argument. *(Retraction, 2026-11-07: an
earlier draft of this section said "the original's 346 weapons was really about 25" and
cited the clone ratios as pure duplication. The behavioural evidence above shows that was
too strong. The stat-clone ratio is real and measured; the claim that the weapons were
*interchangeable* was wrong.)*

**Our pivot:** keep the original's class-locked families — that is the sound part — and
**re-cut the boundary so that every class holds a roughly equal *number of families*, and
add families that the original never had** so that no class is a superset.

---

## 3. Precedents we are copying, and what each teaches

### 3.1 Deep Rock Galactic — hard slot exclusivity `[verified]`

Official wiki, `deeprockgalactic.wiki.gg/wiki/Equipment`:

> "All of the classes carry several items of Equipment at once - a Primary Weapon, a
> Secondary Weapon, two Support Tools and a Throwable item (such as a grenade)."

> "Support Tools assist the Dwarves with mobility and utility - **every class has a unique
> pair of Support Tools related to their job.**"

> "The options for the **Primary Weapon, Secondary Weapon, Support Tools, Throwables, and
> Armor are unique for each class.**"

Three lessons:

1. **Five exclusive slots, none shared.** A Gunner cannot equip a Driller primary. This is
   the hard constraint we want.
2. **Every class gets one *traversal* tool and one *job* tool.** Driller: Reinforced Power
   Drills (traversal) + Satchel Charge (HE). Engineer: Platform Gun + LMG Gun Platform
   (sentry). Gunner: Zipline Launcher + Shield Generator. Scout: Grappling Hook + Flare
   Gun. The traversal slot guarantees every class can still reach places; the job slot is
   where identity lives.
3. **Within a class, the three primaries are *variants of one family* with different
   mechanics** (Driller: flamethrower / cryo / sludge), not stat-clones.

*Correction applied to our own notes:* an earlier draft of this research cited DRG
weapons by names that **do not exist** — "Flak Cannon", "MOLOK", "Scorcher", "Breacher".
None appears on the current official wiki (checked: zero occurrences of each). The real
names are CRSPR Flamethrower / Cryo Cannon / Corrosive Sludge Pump, Warthog Auto 210 /
Stubby Voltaic SMG / LOK-1 Smart Rifle, Lead Storm Minigun / Thunderhead Autocannon /
Hurricane Guided Rocket System, Deepcore GK2 / M1000 Classic / DRAK-25 Plasma Carbine.
*(This is the fourth time a plausible-sounding weapon name turned out to be wrong; the
rule stands — fetch the primary list, never reconstruct it from memory.)*

### 3.2 Team Fortress 2 — per-class pools with a small shared set `[verified]`

Nine classes, each with a Primary / Secondary / Melee table of its own. Each class's
*defining* weapon is exclusive: Scattergun (Scout), Rocket Launcher (Soldier), Flamethrower
(Pyro), Grenade Launcher (Demoman), Minigun (Heavy), Sentry (Engineer), Medi Gun (Medic),
Sniper Rifle (Sniper), Knife/Revolver (Spy). Verified by fetching each class page: the
**Grenade Launcher appears on the Demoman page and on no other class page.**

Shared exceptions are narrow and meaningful: the **Shotgun** (Soldier, Pyro, Heavy
secondary, Engineer primary) and the **Pistol** (Scout, Engineer), plus all-class melee
reskins — and it is telling that the shared weapons are the *generic* ones. TF2 also
introduced the word **Subclass**: *"a set of weapons a class has that drastically changes
the way a class is played."*

### 3.3 World of Warcraft — the model to *avoid* `[verified]`

WoW has a 15-row × 13-class proficiency matrix, and it is **broadly overlapping**. Two
facts that correct common assumptions:

- **A Warrior CAN equip a Bow, a Crossbow and a Gun.** The Warrior's weapon list on
  warcraft.wiki.gg includes Axe, Bow, Crossbow, Dagger, Fist weapon, Mace, Polearm, Shield,
  Staff, Sword.
- **A Mage CAN equip a one-handed Sword** — but not a two-handed sword, axe, mace, fist
  weapon or polearm. The Mage's kit is Staves, Daggers, 1H Swords, Wands.

**The lesson:** WoW's proficiency matrix is a *gear gate* (which drops can you use), not
an identity mechanism. Warrior, Death Knight and Paladin share nearly the entire matrix.
If we copied WoW, weapon type would tell a player almost nothing about how a class plays.

### 3.4 Overwatch, Hunt, New World — the other three poles

- **Overwatch** `[verified]`: *"Every hero wields a unique weapon, which is their main way
  of dealing damage and/or healing."* Total type-difference at the highest production cost
  — and note that role-queue still had to be added, because orthogonality alone did not
  prevent degenerate compositions.
- **Hunt: Showdown** `[verified]`: no classes at all; every hunter can equip every weapon,
  differentiated by a loadout point budget and Traits. The pure-freedom pole — it dodges
  the stat-variant problem by removing the problem, and pays with meta convergence.
- **New World** `[verified/reported]`: no classes; *"Each Weapon Mastery has 2 Skill Trees…
  bonuses that are exclusive to that weapon."* The **weapon is the class**, with
  differentiation inside the weapon's own tree. A useful alternative, but it transfers the
  balance problem rather than solving it.

### 3.5 The failure modes, condensed

| Game | What went wrong | What we avoid |
|---|---|---|
| DRG | Core traversal gated on a single class with no fallback | Every class gets a traversal tool |
| DRG | A class's 3 primaries can read as "same gun, different damage number" | Variants must be mechanically distinct, not recoloured |
| TF2 | Exclusivity produced near-absent classes in 6v6 (Pyro/Spy/Engineer) | Exclusivity ≠ always-useful; every class's niche must be live |
| TF2 | Hundreds of weapons are reskins or minor stat swaps | Never inflate a count with stat-clones |
| WoW | Proficiency matrix overlaps; two plate DPS feel like number-swaps | Proficiency is a gate, not identity |
| Overwatch | Bespoke weapon per hero is unaffordable at scale | Family-level design, not per-item |
| Overwatch | Orthogonality alone did not stop degenerate comps | Assume balance needs a separate mechanism |
| Apex | Class perks are numeric modifiers on shared guns | No ammo/reload/move-speed perks as a class identity |
| Hunt | Open pools collapse to one optimal loadout | Keep hard family gates |
| New World | "Weapon = class" means 11 trees must all be balanced against each other | Bound the number of families |

---

## 4. The class system

### 4.1 The rule

**A class is a *set of weapon families it may use*, plus one utility only it can perform.**
Not a stat block. Not a talent tree. The families are the class.

### 4.2 The six families

We keep the original's four classes but **re-cut which families each holds**, and **add
two families the original never had**. The additions exist to solve the measured problem in
§2: the Soldier had 6 families and the others had 2.

| # | Family | What it is | Not to be confused with |
|---|---|---|---|
| 1 | **SMG** | High ROF, short range, fast recovery | — |
| 2 | **Pistol** | Sidearm: low damage, fast, cheap to draw | — |
| 3 | **Shotgun** | Cone burst, brutal up close | — |
| 4 | **MG** | Sustained, heavy, punishing to use badly | — |
| 5 | **Rifle** | Marksman: slow, precise, long | — |
| 6 | **Knife** | Melee, close, the Commando's signature | — |
| 7 | **Grenade Launcher** | Arcing indirect explosive | **not** a shoulder-fired launcher |
| 8 | **Rocket Launcher** | *New.* Flat-trajectory, direct-fire anti-vehicle | the Grenade Launcher is arcing, this is not |
| 9 | **Artillery** | *New.* Lobbed shell, long sight-lines, indirect | a map weapon, not a personal one |
| 10 | **TNT / Demolition** | *New.* Placed charge, area denial, breaching | sticky-timed-only; TNT is a placed charge |
| 11 | **Field Kit / Support** | *New.* Deployables: repair, shield, cover, spotting | not the original's Widgets (those were consumable premium items) |

Eleven families across four classes. The original's nine map onto eight of them; the
Grenade Launcher and the Rocket Launcher were conflated in the original's data (both
appear as "GL"), and separating them is the single biggest functional unlock in this
document — it lets the Gunner and the Soldier coexist without either being a superset.

### 4.3 The matrix

Read it as: **no cell is empty, no row is a superset, no column is a superset.**

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
| **Original class?** | yes | yes | yes | **new** |

**Every family is used by at least one class. No class can use another's signature
family.** The Soldier is still the widest at four families, and its four are *one* combat
role (fight in close quarters and hold ground) rather than "everything". It has no MG, no
Rifle, no Knife, no Rocket Launcher, no Artillery, no Pistol and no Field Kit.

**Anti-domination check on the matrix itself.** The Soldier and the Commando both get
Shotgun. The Soldier and Gunner both get Grenade Launcher. Those are the only two
overlaps, and they are deliberate: the Shotgun is the generic weapon (TF2 shares it
across four classes), and the GL overlap is the original's own arrangement, kept so the
Gunner's ordnance identity and the Soldier's support role share a tool but not a doctrine.

**The Engineer shares NO family with the Soldier.** This is the load-bearing consequence of
the re-cut, and it is the check that the first draft of this matrix failed: the Engineer was
originally given SMG, Pistol *and* Field Kit — three of its four families were the
Soldier's — which is precisely the "Soldier with a spanner" failure this document warns
about. The prototype made it visible; the invariant now makes it impossible.

**Each class also owns exactly one utility that no other class can perform.** This is the
DRG support-tool rule and it is where the type-difference actually lives:

| Class | Exclusive utility | Why it cannot belong to anyone else |
|---|---|---|
| Soldier | **Combat Medicine** — instant heal, scaling with the number of allies healed | A healing AoE that scales with team size is a *support* identity; giving it to a class means that class stops being a shooter |
| Gunner | **Frenzy Fire** — narrows spread to focus one target *and* heals on every 4th hit | Focus-fire + self-sustain is a heavy-weapon behaviour; on a Commando it would make the knife irrelevant |
| Commando | **Mark Target** — earns points for designating enemies, and reveals stealthed Commandos | Information *for the team*, not for yourself; it converts stealth from a hiding mechanic into a team resource |
| Engineer | **Field Repair** — repairs a vehicle or deployable in the field, mid-fight | Nobody else has the toolkit; it is the Engineer's reason to exist |

### 4.4 Why the Engineer is the fourth class and not a fourth Soldier

The Engineer was chosen against the measured failure in §2, not for flavour.

- The original's **Soldier was already a superset** (6 families, 97 weapons). Adding
  another catch-all would repeat the mistake.
- The Engineer needs the **Gunner's job without the Gunner's gun**: the original's widgets
  prove the concept existed and was sold as consumables — *Supreme Wrench* ("Repairs a
  major portion of your vehicle armor over time. Any damage taken will cancel the
  effect."), *Metallo's Rocket Jump* ("Activates your rocket boots and launches you in the
  air"), *Titan Security Thruster Fuel*, *Jeep Jump*, *Frost's Amassing Force* ("Use the
  Amassing Force to grab the battlefield") — all `[verified]` from bfh-info item pages,
  all class-agnostic, all priced in Play4Free Funds.
- Those widgets are **the Engineer's kit, un-classed**. The original sold them as
  consumable premium items. We make them a **class with a permanent identity** — which is
  exactly the correction the Widgets finding demanded: *no premium currency may purchase
  any combat advantage*. The Engineer takes the widget abilities and gives them a home.

**The Engineer's three families — Pistol, Artillery, Field Kit — give it a role no
other class can fill:** a mid-range combat engineer who repairs vehicles, plants
emplacements, and shells targets from behind cover. It has no MG (not a heavy gunner),
no Rifle (not a marksman), no Shotgun (not a brawler), no Knife (not an infiltrator),
no SMG (not a close-quarters fighter) and no Rocket Launcher (not an ordnance gunner).

**Anti-domination, honestly stated:** the Engineer risks becoming "Soldier-lite with a
wrench". The guard is that the Engineer's *identity* is the Field Kit — repair, deploy,
shell — and its personal gunplay is deliberately modest (SMG + Pistol + Artillery). If the
Engineer's kit is ever merely a Soldier who also owns a spanner, it has failed.

### 4.5 The four classes in play

**SOLDIER — 110 HP.** *Close-quarters, team-scale sustain.* Six families: SMG, Pistol,
Shotgun, Grenade Launcher, TNT, Field Kit. Original kit: Sixth Sense, Burning Bullets,
Combat Medicine, Grenade Spam, Blasting Strike `[verified]`. Burning Bullets is the
mechanical signature: the SMG sets enemies on fire, which is damage-over-time as a
*weapon property*, not a status effect bolted on.

**GUNNER — 150 HP.** *Heavy weapons, anti-vehicle, the only rocket gunner.* Three families:
MG, Grenade Launcher, Rocket Launcher. Original kit: Hero Shield, Leg It, Explosive Keg,
Frenzy Fire, I Eats Grenades `[verified]`. The Gunner is the class that dies in the open
and comes back firing — its own trailer line: *"Stands in the open firing his gun, taking
the bullets but he never runs. After death, he comes back with his gun, this time, firing
with fun."*

**COMMANDO — 80 HP.** *Fastest, weakest, the only one who sees.* Three families: Shotgun,
Rifle, Knife. Original kit: Stealth, Elixir, Mark Target, Troop Trap, Piercing Shot,
Poisoned Blade `[verified]`. Six abilities spanning stealth, marking, knives and poison —
three identities, none of them deep, which is why the specs split it three ways.

**ENGINEER — 130 HP (proposed).** *Fieldcraft, vehicles, emplacements.* Four families: SMG,
Pistol, Artillery, Field Kit. Proposed kit: **Field Repair** (exclusive utility),
**Deployable Emplacement** (a sandbag nest or MG nest that a team can use and an enemy can
destroy), **Shell** (artillery strike on a marked point), **Field Dressing** (repairs an
ally's armour over time, cancelled by damage — the syringe mechanic the original gave the
Soldier, but as a *targeted* version rather than a team AoE).

### 4.6 Class abilities are not new — they are the original's, re-cut

Every ability above except the Engineer's is from the 2009 game. The Engineer's four are
built from **widgets the original already shipped** (repair, rocket jump, thruster fuel,
jeep jump) and from mechanics the original already had (the deployable sandbag from the
promotion table; artillery from the map vocabulary of bunkers and emplacements).

This is the same discipline the class-spec table already used: *"Every spec is built on an
ability that already shipped in 2009 — the specs are a reorganization of the original's
kit, not an invention on top of it."* `[from GAME-DESIGN.md]`

---

## 5. Specialisation *within* a family — how the weapon tree gets deeper

The class matrix says which families a class may use. The weapon tree says how a given
weapon inside a family becomes *yours*. Two additions make the tree family-aware.

### 5.1 The tree is per-weapon, and the family gives it a shared skeleton

Every weapon still carries its own 8-point tree (`systems/weapon-specification.md`). But
the **shape** of the tree is inherited from the family, so that a family of nine
grenade launchers still produces nine *different* weapons rather than nine recolours.

The rule that enforces this, and that the original broke:

> **Anti-domination.** A weapon is only allowed into a family if it differs from the two
> weapons in that family it most resembles on at least **three of six axes**.

Measured on the original's base roster, the Grenade Launcher family **fails this test
badly**: 34 grenade launchers collapse to **5 distinct stat profiles**. *M32 MGL* and
*Tank Buster* differ only in magazine count (6 vs 1) — though the behavioural layer
still separates them (§2.1). The Knife family is worse: 12 knives, **one** stat profile.

### 5.2 Family-specific node grammar

Each family gets a **distinct grammatical shape** for its tree, so that a shotgun tree
cannot be reskinned into a rifle tree. This is the DRG rule — *"within a class, the three
primaries are variants of a family, different mechanics"* — extended from the slot to the
whole tree.

| Family | Node 2 branch | What the branch changes | Signature examples |
|---|---|---|---|
| **SMG** | *Spread* ↔ *Focus* | pellet cone vs single-target | *Phantom* (appear as a friendly dot when not firing), *Interceptor* (speed on destroying deployables) |
| **Shotgun** | *Slug* ↔ *Scatter* | single heavy pellet vs wide cone | *Meat Grinder* (each pellet can crit independently) |
| **MG** | *Sustain* ↔ *Burst* | long belt vs short bursts | *Frenzy* (spread collapses on a held trigger) |
| **Rifle** | *Marksman* ↔ *Duelist* | one-shot discipline vs hipfire | *Overwatch* (first shot after 2 s unscoped ×2), *Saboteur* (+30 % vs vehicles) |
| **Pistol** | *Rapid* ↔ *Precise* | spam vs tap | *Executioner* (a kill refreshes 25 % of magazine) |
| **Grenade Launcher** | *Bounce* ↔ *Direct* | arcing vs flat | *Sapper* (kills drop an ammo crate) |
| **Rocket Launcher** | *Cluster* ↔ *Pierce* | multi-warhead vs single-tap | *Demolition* (destroyed vehicles detonate) |
| **Artillery** | *Bunker* ↔ *Spread* | one deep crater vs shrapnel | *Siege* (artillery damage from the sky is doubled) |
| **TNT** | *Breach* ↔ *Trap* | open doors vs deny approach | *Ambush* (a placed charge arms faster but has a shorter fuse) |
| **Knife** | *Slash* ↔ *Throw* | close vs thrown | *Poisoned Blade* (DoT on knife hits) |
| **Field Kit** | *Repair* ↔ *Fortify* | keep it alive vs make it strong | *Bulwark* (deployables absorb damage while you build) |

Note that the **branch in each family is a different kind of decision** — spread vs focus,
slug vs scatter, sustain vs burst — not a repeated "more damage vs more range". That is
what makes 11 families feel like 11 games rather than 11 recolours.

### 5.3 Three Signature tiers, per weapon, as already specified

Unchanged from `systems/weapon-specification.md`: tiers 1–3, each **pick-one-of-three**,
behavioural not statistical, respec for 1 500 Valor. The family grammar above only decides
*which* three are offered, not how the tier works.

---

## 6. Doctrines: how classes interlock

Doctrines remain passive items in a shared capacity pool (5 slots, 6 with an unlock), keyed
to **weapon families** — so a doctrine tagged *Heavy* only applies to MG / Rocket Launcher,
and a *Close* doctrine only to Shotgun / Knife / SMG. `[from GAME-DESIGN.md]`

**The class matrix is now legible in the loadout.** A team of four is not "three DPS and
one healer" — it is four different family-sets, and the Doctrine pool lets two Commandos
play as a sniper and an infiltrator without respeccing.

**A new doctrine family per class**, each exclusive to that class's families:

| Doctrine school | Applies to | Effect shape | Example |
|---|---|---|---|
| **Fieldcraft** | Field Kit, Artillery | deployables, emplacements, indirect fire | *Field Dressing*: repair continues while you move, at half rate |
| **Ballistics** | MG, Rocket Launcher | sustained fire, ordnance | *Recoil Discipline*: MG recoil recovers 30 % faster while firing |
| **Marksmanship** | Rifle, Knife | long range, precision | *Measured Shot*: the first shot after reloading deals ×2 |
| **Close Quarters** | SMG, Shotgun, Grenade Launcher | short range, aggression | *Point Blank*: below 8 m, all shotguns deal +25 % |

This gives the Engineer a doctrine school of its own (Fieldcraft) — which is what stops
it being "Soldier with a spanner" at the build layer too.

---

## 7. The art direction for new classes

Read from the original's own renders and icons via vision on 2026-11-07 (art pulled from
battlefield.fandom.com; the CDN needs a browser User-Agent — plain urllib gets 403).
Contact sheet: `research/art/_contact_sheet.png`.

**Character render rules:**
- **Top-heavy heroic ratio.** Not chibi — roughly 8 heads tall, small head, massive
  shoulders and torso. The Commando reads as lean but the head stays small.
- **Angular, near-square jaw, minimal chin**, neck flowing straight into the jawline.
- **Exaggerated hands and boots** (~1.5× realistic) to sell action.
- **Contrapposto / casual-aggressive pose.** Never a neutral standing pose; lean into a
  hip or crouch.
- **Thick, variable-width black ink outline**; interior detail lines thinner.
- **Hybrid cel-shading + soft digital-paint shadows**, with a subtle canvas/paper texture
  for the vintage-poster feel.
- **Sharp white rim highlights on leather** (boots, belts, coats) — the gloss reads as
  stylised, not realistic.
- **Weapons held away from the body** to keep the silhouette readable: two-handed guns at
  hip or chest height, never shouldered like a real rifle. Iconic silhouette over
  mechanical detail.

**Ability icon language (80×50):**
- The icon is a **physical object**, not a flat symbol — die-cut to the object's own
  outline, or a pill-shaped metallic bezel.
- Heavy **bevel-and-emboss** with a gloss highlight; reads as a 3D object under light.
- Colour coding follows the ability's school (heal = green/white, ordnance = orange/red,
  information = blue, movement = yellow).

**Drafting rules for the four classes, from the render language:**
- **Soldier** — broad, layered, belt-heavy. The original's Royal Soldier render is
  tall and vertical with a long coat line.
- **Gunner** — heaviest shoulders, lowest stance, helmet-dominant; the Gunner logo is a
  mass rather than a figure.
- **Commando** — leanest silhouette, hood/cap, minimal kit, weapon held close and low.
- **Engineer** (new) — *reads as a tradesman*: satchel, tool roll, a heavy apron or
  mechanic's bib, goggles pushed up on the forehead, and a **bolted-on mechanical
  silhouette** (a tool harness, or a small shoulder-mounted repair rig) so the class is
  unmistakable in a 32 px minimap dot. The engineer's colour should be **industrial
  yellow-ochre** — deliberately outside the Royals' blue-grey and Nationals' drab olive,
  because the Engineer is the one class that serves *both* factions in the fiction.

---

## 8. What this does to the rest of the design

| Design element | Effect of the class change |
|---|---|
| **P1 — weapon choice is the game** | Strengthened. Choice now has three levels: which class, which family, which weapon, which signature. |
| **P2 — levelling unlocks options** | Unchanged. Class and family are fixed at character creation; the tree is where options open. |
| **Class specs (3 per class)** | The Engineer needs three specs. Draft below. |
| **Doctrine schools** | One per class, each keyed to that class's families. |
| **Anti-domination rule** | Now has a matrix-level form: no class may hold a superset of another's families. |
| **Weapon roster** | The 185 base weapons must be re-cut so each family holds ~8–12 *mechanically distinct* weapons, not 34 near-clones. |
| **Faction asymmetry** | Unchanged. National = handling/utility, Royal = precision/reach. The Engineer's kit is the one place this softens — the Engineer works for whoever holds the field. |

### 8.1 The Engineer's three specs (draft)

| Spec | Identity | Built on |
|---|---|---|
| **Artificer** | Builds, repairs and multiplies deployables | *Field Repair* → emplacements that regrow; *Bulwark* deployables absorb damage |
| **Gunner's Adjutant** | Anti-vehicle artillery at range | *Shell* → longer range, faster reload, deeper craters; marks vehicles for the team |
| **Pioneer** | Forward mobility, path-opening, rapid redeploy | *Field Dressing* + movement → launches the Engineer into position, deploys on arrival |

### 8.2 What still needs Omar's call

1. **Is the Engineer a new class, or a new *faction*?** A fourth class is cheap and fits
   the timeline. A fourth faction breaks the two-sided war premise in `lore/third-faction.md`.
   Recommendation: **class**, and the Engineer is written as neutral — employed by whoever
   holds the objective.
2. **Does the Engineer get the two factions' vehicles, or its own?** Neutralia sells arms to
   both sides — an Engineer faction of "hired engineers" would make Neutralia concrete.
   But it risks the third-faction-can't-be-played problem the lore doc already flags.
3. **Should Artillery be a personal weapon at all?** It is a map weapon in the original.
   Recommendation: yes, as a *limited, slow, long-cooldown* personal artillery — that
   limitation is what keeps it from dominating, and it gives the Engineer a real identity.

---

## 9. Sources

**Primary, fetched and read on 2026-11-07:**
- `https://deeprockgalactic.wiki.gg/wiki/Equipment` — DRG slot exclusivity, per-class kits, support tools `[verified]`
- `https://wiki.teamfortress.com/wiki/Weapons` + per-class pages — TF2 pools, shared weapons `[verified]`
- `https://warcraft.wiki.gg/wiki/Weapon` + `/wiki/Warrior` — WoW proficiencies; the Warrior *can* equip bows `[verified]`
- `https://gdp.cse.chalmers.se/index.php?title=Orthogonal_Differentiation` — the concept, verbatim `[verified]`
- `https://overwatch.fandom.com/wiki/Heroes` — "Every hero wields a unique weapon" `[verified]`
- `https://help.ea.com/en/articles/apex-legends/abilities/` — the numeric-perk failure mode `[verified]`
- `https://huntshowdown.wiki.gg/wiki/Weapons` — no classes, budget + traits `[verified]`
- `https://www.newworld.com/en/news/articles/character-progression` — weapon mastery trees `[verified]`
- `https://battlefield.fandom.com/wiki/Gunner` · `/wiki/Soldier` · `/wiki/Commando` · `/wiki/Abilities` — the original's exact class text and kits `[verified]`
- `https://bfh-info.cs-heroes.cz/en/item/widget/` + individual widget pages — the widget roster and effects `[verified]`

**Measured from the project's own scraped data:**
- `research/02-weapon-roster.json` — 346 weapons, 185 base, 161 tier variants
- `research/bfhinfo_items_detail.json` — per-weapon stats; the 34-GL→5-profiles collapse

**Full precedent write-up:** `research/04-class-weapon-family-exclusivity.md`

**Unfetched / corrected:** the GDP3 pattern was first sought at
`virt10.itu.chalmers.se` (timed out) and the earlier draft of this research cited DRG
weapons by names that do not exist on the current wiki. Both corrected above.
