# Class Differentiation at the Weapon-Family Level
### Citation-backed precedents for a Battlefield Heroes (2009)-style MMO

**Research file 04 — Class / Weapon-Family Exclusivity**
Prepared 2026-11-07 · All URLs fetched live during research unless marked otherwise.

**Verification legend**
- `[verified]` — I fetched the page and read the mechanism/quote directly.
- `[reported]` — secondary source only (search snippet, abstract, or third-party page I did not open in full).
- `could not fetch` — page unreachable; no claim is made from memory.

---

## 0. TL;DR — the five models and what to copy

| Game | Differentiation mechanism | Weapon-family exclusivity? |
|---|---|---|
| Deep Rock Galactic | Unique weapon *slots* per class + a unique **pair of support tools** | **Yes — hard exclusivity** |
| Team Fortress 2 | 9 classes, each with own primary/secondary/melee pool; small shared set | **Yes — with shared exceptions** |
| World of Warcraft | Overlapping class **proficiencies** (equipment gates, not identity) | **Partial — broad overlap** |
| Overwatch | One **unique weapon per hero**, never swappable | **Yes — total, but per-hero not per-class** |
| Apex Legends | Abilities + *numeric* class perks; weapons fully shared | **No** |
| Hunt: Showdown | No classes at all; loadout point budget + traits | **No** |
| New World | No classes; weapon-mastery trees + attribute scaling | **No (weapon = class)** |

The recurring, citable conclusion: **orthogonal differentiation (differences in *type*, not *value*) is what makes a class feel distinct rather than like a stat-variant.** The games that do this best at the weapon level (DRG, TF2, Overwatch) all make the *type* of weapon/tool a class may use a hard constraint. The games that skip it (Apex, Hunt, New World) must lean entirely on abilities or economy, and repeatedly fall back on numeric perks and meta convergence.

---

## 1. DEEP ROCK GALACTIC — hard weapon-slot exclusivity + unique support tools

**Source:** Official DRG Wiki, page "Equipment"
URL: `https://deeprockgalactic.wiki.gg/wiki/Weapons`
(`?action=raw` plain text also available; the rendered page is titled "Equipment".)

### The rule, quoted verbatim `[verified]`

> "All of the classes carry several items of Equipment at once - a Primary Weapon, a Secondary Weapon, two Support Tools and a Throwable item (such as a grenade)."

> "Support Tools assist the Dwarves with mobility and utility - **every class has a unique pair of Support Tools related to their job.**"

> "The options for the **Primary Weapon, Secondary Weapon, Support Tools, Throwables, and Armor are unique for each class.**"

These three sentences are the exclusivity rule. Each dwarf has **five equipment slots** (Primary, Secondary, two Support Tools, Throwable), and **none of them is shared across classes** — a Gunner cannot equip a Driller primary, a Scout cannot equip an Engineer support tool, etc.

### Per-class equipment (all `[verified]` from the table on that page)

**Driller**
- Primary: CRSPR Flamethrower · Cryo Cannon · Corrosive Sludge Pump (all tagged "Heavy Weapon")
- Secondary: Subata 120 · Experimental Plasma Charger · Colette Wave Cooker
- Support Tools: **Reinforced Power Drills** (Traversal) + **Satchel Charge** (High Explosive)

**Engineer**
- Primary: "Warthog" Auto 210 (Shotgun) · "Stubby" Voltaic SMG · LOK-1 Smart Rifle
- Secondary: Deepcore 40mm PGL · Breach Cutter · Shard Diffractor (all "Heavy Weapon")
- Support Tools: **Platform Gun** (Traversal) + **LMG Gun Platform** (Sentry Gun)

**Gunner**
- Primary: "Lead Storm" Powered Minigun · "Thunderhead" Heavy Autocannon · "Hurricane" Guided Rocket System
- Secondary: "Bulldog" Heavy Revolver · BRT7 Burst Fire Gun · ArmsKore Coil Gun
- Support Tools: **Zipline Launcher** (Traversal) + **Shield Generator** (Support)

**Scout**
- Primary: Deepcore GK2 · M1000 Classic · DRAK-25 Plasma Carbine
- Secondary: Jury-Rigged Boomstick (Shotgun) · Zhukov NUK17 · Nishanka Boltshark X-80 (Crossbow)
- Support Tools: **Grappling Hook** (Traversal) + **Flare Gun** (Support)

Note the **support-tool pattern**: every class gets exactly one *traversal* tool (Drills / Platform Gun / Zipline / Grappling Hook) and one *job* tool (Satchel Charge / Sentry / Shield / Flare Gun). That is a clean example of orthogonal differentiation applied twice — weapon slots *and* utility slots.

### ⚠️ Correction to the task brief `[verified]`

The brief's parenthetical weapon names do **not** match the current official wiki:

- "Engineer = Flak Cannon / Platform Gun" — Engineer has **no** "Flak Cannon". His primaries are the Warthog (shotgun), Stubby (SMG), and LOK-1 (smart rifle). Only "Platform Gun" is correct.
- "Driller = C4 / MOLOK" — there is **no** "MOLOK". Driller's weapons are the CRSPR/Cryo/Sludge primaries + Subata/EPC/Wave Cooker secondaries; "C4" is the community nickname for the **Satchel Charge** support tool.
- "Gunner = Minigun / Flak Cannon / Scorcher" — no "Scorcher" and no "Flak Cannon" in current names. Gunner primaries are the "Lead Storm" Minigun, "Thunderhead" Autocannon, and "Hurricane" rocket system. (The "Thunderhead" is the closest thing to a "flak cannon", but the name is different.)
- "Scout = Breacher / SMG" — no "Breacher". Scout secondaries are the Boomstick, Zhukov NUK17, and Boltshark. ("Breach Cutter" is an *Engineer* secondary.)

Treating the task's names as a superseded/early list — do not copy them into the design doc without reconciling against the current wiki above.

### Why it works `[verified]`
Weapon families are typed ("Heavy Weapon", "Shotgun", "SMG", "Crossbow"), and those types are distributed so that **no two classes share a single weapon**. Within a class, the 3 primaries are *variants of a family* (e.g., three "Heavy Weapon" primaries for Driller) — the same weapon *slot* role, different mechanics (fire vs. freeze vs. sludge), which is itself a second-order differentiation.

---

## 2. TEAM FORTRESS 2 — per-class weapon pools with a small shared set

**Sources:**
- `https://wiki.teamfortress.com/wiki/Weapons` `[verified]`
- `https://wiki.teamfortress.com/wiki/Classes` `[verified]`

### The rule, quoted verbatim `[verified]`

> "Most classes have three weapon slots: a primary, secondary, and melee slot. The Engineer has an additional PDA slot (for the Construction/Destruction PDA). The Spy has no primary weapon, but has a PDA (Disguise Kit), PDA 2 (invisibility watches), and Building slot (sappers)."

> "There are nine official **classes** that can be played in *Team Fortress 2*…"

The Weapons page lists a distinct Primary / Secondary / Melee weapon table **for each of the 9 classes** (Scout, Soldier, Pyro, Demoman, Heavy, Engineer, Medic, Sniper, Spy), plus a final **"All classes"** section. Each class's *defining* weapon is exclusive to it: Scattergun (Scout), Rocket Launcher (Soldier), Flamethrower (Pyro), Grenade Launcher (Demoman), Minigun (Heavy), Sentry (Engineer), Medi Gun (Medic), Sniper Rifle (Sniper), Knife/Revolver (Spy). No other class can equip another class's defining weapon.

### Shared weapons (the exceptions) `[verified]`
From the Weapons page and cross-referencing the class sections:

- **Shotgun** — shared by **4 classes**: Soldier (secondary), Pyro (secondary), Heavy (secondary), and Engineer (primary). It is the game's canonical "shared weapon", and its being shared is precisely *because* it is a generic weapon, not a class-defining one.
- **Pistol** — shared by **Scout** and **Engineer** (secondary).
- **All-class melee reskins** — Saxxy, Frying Pan, Conscientious Objector, Freedom Staff, etc., with the footnote: *"†Usable by all classes except Engineer and Spy."* `[verified]`

### ⚠️ Correction to the task brief `[verified]`
The brief lists "grenade launcher" as a shared weapon — **it is not.** The Grenade Launcher is the **Demoman's exclusive stock primary**. The shared weapons are the Shotgun (4 classes) and Pistol (2 classes), plus all-class melee reskins.

### Subclass concept `[verified]`
> "**Subclass** is a term used to describe a set of weapons a class has that drastically changes the way a class is played. There is currently only one subclass, the **Demoknight**."

This is TF2's answer to "variation within a class without breaking type exclusivity": a *set* of weapons (boots + shield + sword) turns Demoman into a melee charger, but still only within Demoman's own slots.

---

## 3. WORLD OF WARCRAFT — class weapon proficiencies (equipment gates, not identity)

**Sources:**
- `https://warcraft.wiki.gg/wiki/Weapon` `[verified]`
- `https://warcraft.wiki.gg/wiki/Class_proficiencies` (page titled "Proficiency") `[verified]`

### The rule, quoted verbatim `[verified]`

> "Each [class] has certain [weapons it is allowed to use] (Class proficiencies)."

> "**Proficiency** is a type of skill that allows the use of certain armor and weapon types, depending on a character's class."

### Class → weapon-type proficiency matrix `[verified]`
(from the "Proficiency" page; ✓ = can equip, — = cannot)

| Weapon type | DK | DH | Dru | Evo | Hun | Mage | Monk | Pal | Pri | Rog | Sha | War | Warr |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1H Axe | ✓ | ✓ | — | ✓ | ✓ | — | ✓ | ✓ | — | ✓ | ✓ | — | ✓ |
| 1H Mace | ✓ | — | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| 1H Sword | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | ✓ |
| Dagger | — | — | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Fist weapon | — | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | — | ✓ | ✓ | — | ✓ |
| 2H Axe | ✓ | — | — | ✓ | ✓ | — | — | ✓ | — | — | ✓ | — | ✓ |
| 2H Mace | ✓ | — | ✓ | ✓ | — | — | — | ✓ | — | — | ✓ | — | ✓ |
| 2H Sword | ✓ | — | — | ✓ | ✓ | — | — | ✓ | — | — | — | — | ✓ |
| Staff | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | ✓ | ✓ |
| Polearm | ✓ | — | ✓ | — | ✓ | — | ✓ | ✓ | — | — | — | — | ✓ |
| Warglaive | — | ✓ | — | — | — | — | — | — | — | — | — | — | — |
| Bow | — | — | — | — | ✓ | — | — | — | — | ✓ | — | — | ✓ |
| Crossbow | — | — | — | — | ✓ | — | — | — | — | ✓ | — | — | ✓ |
| Gun | — | — | — | — | ✓ | — | — | — | — | ✓ | — | — | ✓ |
| Wand | — | — | — | — | — | ✓ | — | — | ✓ | — | — | ✓ | — |

*(DK=Death Knight, DH=Demon Hunter, Dru=Druid, Evo=Evoker, Hun=Hunter, Pal=Paladin, Pri=Priest, Rog=Rogue, Sha=Shaman, War=Warlock, Warr=Warrior.)*

### ⚠️ Two corrections to the task brief `[verified]`

1. **"A Warrior cannot equip a Bow" is FALSE.** The matrix shows Warriors **can** equip Bows, Crossbows, and Guns (they are the classic "pull with a ranged weapon" class). The Weapon page's "Additional Info" states outright: *"Warriors can use any weapon type in the game, except wands."* `[verified]`

2. **"A Mage cannot equip a Sword" is PARTIALLY false.** Mages **can** equip **one-handed swords** (matrix: Mage ✓ on 1H Sword), but **cannot** equip two-handed swords, axes, maces, fist weapons, or polearms. A Mage's actual kit is Staves, Daggers, 1H Swords, and Wands. `[verified]`

### What this actually means for the design `[verified]`
WoW's proficiency matrix is **broad and overlapping**, not exclusive. Class identity does **not** come from weapon type — it comes from the spellbook, talents, and specialization. Proficiency is primarily a *gear gate* (which drops can you use), not an orthogonal-differentiation mechanism. The honest read: **WoW is a poor model for "class = weapon family"** because several classes (Warrior/DK/Paladin; Hunter/Rogue/Warrior on ranged) share almost the entire matrix, and the ones that differ do so in *spells*, not *weapons*.

---

## 4. OVERWATCH / HUNT: SHOWDOWN / APEX LEGENDS / NEW WORLD — how each avoids "stat-variant" classes

### 4.1 Overwatch — one unique weapon per hero `[verified]`
**Source:** `https://overwatch.fandom.com/wiki/Heroes`

> "**Every hero wields a unique weapon**, which is their main way of dealing damage and/or healing."

> "Heroes have at least two abilities for additional sources of damage, healing, or utility… All heroes also have an ultimate ability…"

**Mechanism:** a hero's weapon is a bespoke, never-swappable object tied to that hero — Reinhardt's Rocket Hammer is a melee swing, Winston's Tesla Cannon is a cone of electricity, Widowmaker's Widow's Kiss is a sniper rifle. Heroes are grouped into roles (Tank / Damage / Support), but weapons are never shared or traded. Differentiation is **total type-difference at the weapon level plus a unique ability kit** — the strongest possible version of the pattern, at the highest production cost (every hero needs bespoke weapon art, feel, and balance).

### 4.2 Apex Legends — abilities + *numeric* class perks; weapons fully shared `[verified]`
**Sources:** `https://help.ea.com/en/articles/apex-legends/abilities/` (official EA) · `https://apexlegends.wiki.gg/wiki/Weapon`

> "Each Legend has three unique abilities: an ultimate… a tactical… and a passive…"

> "Legends are divided into five classes: Assault, Controller, Recon, Skirmisher, and Support. **Classes determine a Legend's fighting style and give them unique perks.**"

**Mechanism:** Legends are differentiated by their **ability kit**, and by **class perks** — but the class perks are *numeric* modifiers to shared weapons, not type restrictions. Example from EA: *"Assault Legends carry more ammo per stack and have extra grenade slots. They also use weapons faster than other Legends…"* Rampart's passive is *"increased magazine capacity and faster reloads when using LMGs."* `[verified]`

**Critical observation for this project:** Apex is the clearest shipped example of the *failure mode the task is trying to avoid* — its classes modify the **value** (reload speed, ammo, move speed) of weapons everyone can use, rather than restricting **type**. Any Legend can carry any gun; the class only nudges how good they are with certain ones. This is value-differentiation, not type-differentiation.

### 4.3 Hunt: Showdown — no classes at all `[verified]`
**Sources:** `https://huntshowdown.wiki.gg/wiki/Weapons` · official `https://www.huntshowdown.com/player-guide` `[reported]`

> "All base weapons are available to buy… and can be used from Bloodline Rank 0…"

> "Each Hunter is able to equip two weapons in their loadout, which can be any combination of weapons within a player's Weapon Capacity." (weapons range 1–5 slots; Quartermaster trait raises capacity 5 → 6)

**Mechanism:** There is **no class system**. Every hunter can equip every weapon; differentiation comes from (a) a loadout **point budget** and (b) **Traits** (e.g., Levering improves lever-action hipfire, Fanning improves single-action revolvers). This is the "pure freedom" pole — it avoids the "stat-variant class" problem by *not having classes*, and pays for it with meta convergence (nothing stops everyone running the same optimal pair).

### 4.4 New World — weapon = class, via mastery trees `[verified]` / `[reported]`
**Sources:** official `https://www.newworld.com/en-us/news/articles/character-progression` `[verified]` · `https://newworld.wiki.fextralife.com/Weapon_Skills` `[reported]`

> "Characters progress across three major categories: Core Attributes, Trade Skills, and Weapon Mastery. While you are free to master as many or as few weapons and Trade Skills as you like, your Core Attributes ultimately govern a large part of how powerful you are…"

> "Every weapon in the game can be mastered. Each Weapon Mastery has 2 Skill Trees, and each Skill Tree has a selection of active abilities, passive modifiers, and bonuses that **are exclusive to that weapon**." `[verified]`

> "As there are no classes in New World and any character can equip any weapon, it is possible to master all weapon types." `[reported, Fextralife]`

**Mechanism:** No classes. Your "class" is the **two weapons you equip** plus attribute allocation. Each of the 11 weapon types has exclusive mastery trees (type-differentiated abilities), and weapon damage scales off attributes (Strength/Dexterity/Intelligence/Focus/Constitution). This inverts the usual relationship: **the weapon *is* the class**, and the differentiation lives inside the weapon's exclusive ability tree rather than in a class gate.

---

## 5. THE CONCEPT — "Orthogonal Differentiation"

### Primary source (live, fully read) `[verified]`
**GDP3 Game Design Pattern Library** (Chalmers University of Technology / University of Gothenburg, maintained by Staffan Björk's research group)
URL: `https://gdp.cse.chalmers.se/index.php?title=Orthogonal_Differentiation`

### Definition, verbatim `[verified]`
> "**Orthogonal Differentiation** — *Differences in abilities of game entities that are in type rather than in value.*"

### The argument, verbatim `[verified]`
> "When these abilities and the functionality they provide do not only have quantitative but also qualitative difference this means that the games have Orthogonal Differentiation. This give the different game pieces additional value since they represent the **only ways for players to perform certain actions**. Not all or many aspects of the game entities need to be unique; often it is sufficient that a **single ability is radically different** from other units for it to have special gameplay value. In team games, the differentiation may actually be between players so that each player has unique abilities."

> "It is achieved through Asymmetric Abilities between Characters or Units. **However, Asymmetric Abilities is not enough since the differences need to be in type rather than in degree.**"

> "Orthogonal Differentiation is used in games to either provide more gameplay without increasing production costs or create more Complex Gameplay, or both."

> "The unique abilities required by Orthogonal Differentiation makes it difficult to combine with Symmetry… This cause also makes Orthogonal Differentiation problematic for Player Balance and Team Balance… **However, they can be combined by treating the differentiated units as a set and have the same sets for all players or all Teams.**"

The last sentence is the key practical resolution for a competitive MMO: if every *team* has access to the same set of orthogonal classes, you get type-difference *and* side-symmetry (fairness).

### Attribution `[verified]`
From the page's "History" and "References":
> "An updated version of the pattern **Orthogonal Unit Differentiation** that was part of the original collection in the book *Patterns in Game Design* (Björk & Holopainen 2004). The concept was first introduced by **Harvey Smith** to game developers at a presentation at **GDC 2003**."

References cited on the page:
- Björk, S. & Holopainen, J. (2004). *Patterns in Game Design*. Charles River Media. ISBN 1-58450-354-8.
- Smith, H. (2003). *Orthogonal Unit Differentiation*. GDC 2003 presentation (archived at `http://www.planetdeusex.com/witchboy/`).

So: the term was coined by **Harvey Smith** (GDC 2003), formalized as a design pattern by **Staffan Björk & Jussi Holopainen** (*Patterns in Game Design*, 2004), and the live citable page is the **GDP3 wiki at Chalmers/University of Gothenburg**.

### About the URL in the task brief `could not fetch`
The brief pointed to `virt10.itu.chalmers.se` (the IT University's Chalmers subdomain). That host **timed out and could not be fetched** during this research. The GDP3 pattern library has moved to `gdp.cse.chalmers.se`, where the same pattern now lives as "Orthogonal Differentiation" (renamed from "Orthogonal Unit Differentiation"). The gdp.cse.chalmers.se URL above is the **working citation**; use it, not the virt10 URL.

### Secondary academic source `[reported]`
A peer-reviewed test of the concept: "Orthogonal analysis of StarCraft II for game balance" (Australasian Computer Science Week, 2017), ACM DOI `10.1145/3014812.3014844`, page `https://dl.acm.org/doi/10.1145/3014812.3014844`. Abstract states: *"Orthogonal differentiation is a suggested approach to game balance… we test whether game units are orthogonally differentiated… the orthogonal differentiation test is negative [for StarCraft II]…"* — i.e., a data-driven study that confirms orthogonal differentiation is a *design property* that must be deliberately constructed, not an automatic byproduct. `[reported — abstract only]`

---

## 6. FAILURE MODES — what went wrong in each game, and what to avoid

**Deep Rock Galactic**
- **Hard dependency on unique support tools.** Because each class's traversal tool is exclusive (no Scout = no flares/light, no Driller = no terrain carving, no Gunner = no zipline/shield), a 3-person team *feels* the missing class acutely. DRG mitigates this with solo-mode **Bosco** and by never *requiring* a class to finish a mission — but the pressure is real. **Avoid:** gating core traversal/mobility on a single class with no fallback.
- **Within-class weapons are family variants, not new families.** The Driller's three "Heavy Weapon" primaries differ in *damage type* (fire/cold/sludge), which risks reading as a stat-variant if the status effects are not mechanically distinct. **Avoid:** letting a class's 3 weapon options collapse into "same gun, different damage number."

**Team Fortress 2**
- **Class marginalization at high-level play.** The strong exclusivity produces classes (Pyro, Spy, Engineer) that are near-absent in the dominant 6v6 competitive meta, because their *orthogonal* niches aren't valuable in that format. Exclusivity ≠ always-useful. **Avoid:** designing classes whose exclusive weapon is only situationally relevant.
- **Reskin/stat-clone bloat.** Hundreds of unlockable weapons are near-identical reskins or minor stat swaps of the class's stock gun — value-differentiation masquerading as type-differentiation. **Avoid:** inflating a class's weapon count with stat-clones; keep each slot's options mechanically distinct (as DRG's 3-per-slot does).

**World of Warcraft**
- **Proficiencies are gear gates, not identity.** Because the matrix overlaps heavily (Warrior/DK/Paladin; Hunter/Rogue/Warrior on ranged), weapon type tells you almost nothing about *how* a class plays — the spellbook does. **Avoid:** expecting an equipment-proficiency matrix to carry class fantasy; it only filters loot.
- **"Stat-variant" feeling persists at the class level** precisely because weapons don't differentiate — two plate DPS classes can feel like number-swaps. **Avoid:** copying WoW's proficiency approach as your differentiation; it is orthogonal only in armor type, not in play.

**Overwatch**
- **Highest cost of the highest-fidelity solution.** A unique weapon per hero means bespoke art/feel/balance per hero and a combinatorial balance load as the roster grows. **Avoid:** committing to per-class bespoke weapons if your budget can't sustain 9+ fully unique weapon behaviors.
- **Degenerate comps still happened despite orthogonality.** Role queue was introduced to fix GOATS-style comps, i.e., orthogonality alone did not prevent dominant strategies. **Avoid:** assuming type-difference automatically yields balance — see the GDP3 "problematic for Player Balance" caveat.

**Apex Legends**
- **Class perks are numeric, not typal.** "More ammo per stack, faster reload, more grenades" are value modifiers on shared guns — exactly the "stat variant" the task warns against. Legends are only saved from feeling like clones by their ability kits. **Avoid:** differentiating classes with reload-speed/ammo/move-speed passives and calling it done.

**Hunt: Showdown**
- **No class constraint → meta convergence.** With every hunter able to run anything, play gravitates to an optimal weapon pair, and the "class" role pressure migrates onto a single best loadout. **Avoid:** fully open weapon pools unless you accept that balance collapses to a small optimal set.

**New World**
- **"Class = weapon" transfers the balancing problem, it doesn't remove it.** All 11 weapon trees must be viable against each other, and with free respec, players hop to whichever weapon is currently strongest. **Avoid:** weapon-mastery-as-class if you can't budget for cross-tree balance; also note the team-role guarantee a class system provides (tank/healer/DPS) is lost.

### Net guidance for the BFH-MMO `[synthesis, not a cited claim]`
The shipped games that *successfully* differentiate classes at the weapon-family level (DRG, TF2, Overwatch) share three traits: (1) the **type** of weapon/tool a class may use is a hard constraint, (2) each class has at least one **unique utility** that only it can perform (DRG's support tools, TF2's PDAs/buildings, Overwatch's ability kits), and (3) within-class options are **mechanically distinct variants of one family**, never stat-clones. The games that avoid weapon exclusivity (Apex, Hunt, New World) all fall back on abilities/economy and on *numeric* modifiers — the exact failure the brief asks us to avoid.

---

## 7. Source list (all URLs)

**Verified (fetched and read):**
1. `https://deeprockgalactic.wiki.gg/wiki/Weapons`
2. `https://wiki.teamfortress.com/wiki/Weapons`
3. `https://wiki.teamfortress.com/wiki/Classes`
4. `https://warcraft.wiki.gg/wiki/Weapon`
5. `https://warcraft.wiki.gg/wiki/Class_proficiencies`
6. `https://overwatch.fandom.com/wiki/Heroes`
7. `https://help.ea.com/en/articles/apex-legends/abilities/`
8. `https://apexlegends.wiki.gg/wiki/Weapon`
9. `https://huntshowdown.wiki.gg/wiki/Weapons`
10. `https://www.newworld.com/en-us/news/articles/character-progression`
11. `https://gdp.cse.chalmers.se/index.php?title=Orthogonal_Differentiation`

**Reported (secondary only):**
12. `https://newworld.wiki.fextralife.com/Weapon_Skills`
13. `https://www.huntshowdown.com/player-guide`
14. `https://dl.acm.org/doi/10.1145/3014812.3014844` (StarCraft II orthogonal-differentiation study)

**Could not fetch:**
15. `http://virt10.itu.chalmers.se/index.php/Orthogonal_Unit_Differentiation` — timed out; superseded by #11.
