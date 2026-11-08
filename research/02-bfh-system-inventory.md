# Battlefield Heroes — System Inventory

Verified against primary sources on 2026-11-07. Raw scraped data in this directory:
`02-weapon-roster.json`, `02-ability-roster.json`, `raw_Abilities.json`,
`wt_Weapon_Variants.txt`, `wt_Valor_Points.txt`, `wt_Battlefunds.txt`,
`pg_Conquest.txt`, `pg_Capture_the_Flag.txt`, `pg_Metagame.txt`.

Primary sources: battlefield.fandom.com (MediaWiki API), bfh-info.cs-heroes.cz.

---

## 1. Classes — real values

| Class | HP | Primary weapon | Secondary | Abilities | Role |
|---|---|---|---|---|---|
| **Soldier** | 110 | SMG (64) | Pistol (44), Shotgun (40), GL (20), Grenade (4), Sticky TNT (6) | 5 | Assault + Medic hybrid |
| **Gunner** | **150** (highest) | MG (62) | GL (20) | 5 | Support + Anti-Tank |
| **Commando** | **80** (lowest) | Rifle (64) | Knife (22) | 6 | Recon / Special Forces |

Quotes from the wikitext: Gunner — *"the go-to class for Anti-Vehicle Warfare"*; Commando
— *"can do the most damage per hit, and is the fastest of the infantry units... Despite
this, it is the weakest class in damage."*

### All 16 abilities (28 rows across both factions)

**Soldier (5):**
| Ability | Effect |
|---|---|
| 6th Sense | You and your team see the location of all nearby enemies for a short time |
| Burning Bullets | SMG shots set enemies on fire, damage over time until fire out (or Combat Medicine) |
| Combat Medicine | Instantly heals player and nearby allies; amount scales with number healed |
| Grenade Spam | Throws multiple grenades at a target |
| Blasting Strike | Strikes with such force that nearby players *and vehicles* are thrown aside |

**Gunner (5):**
| Ability | Effect |
|---|---|
| Leg It | Increases movement speed of player and nearby allies |
| Frenzy Fire | Improves MG accuracy to focus a single target; heals % of health every 4th hit |
| Explosive Keg | Hurls a large explosive barrel, shootable to explode early; enemies hit run slower |
| Hero Shield | Absorbs damage for player and nearby allies for a few seconds |
| I Eats Grenades | Gobbles up all nearby explosives for a short time; each grenade eaten recovers health |

**Commando (6):**
| Ability | Effect |
|---|---|
| Stealth | Cloaking from enemy view |
| Elixir | Increases speed and defense for a short time |
| Mark Target | Earn points for designating enemy targets for your team; can reveal enemy Commandos using Stealth |
| Troop Trap | Place an explosive that triggers when enemies approach too close *or when it is shot* |
| Piercing Shot | Increases damage done by sniper rifles |
| Poisoned Blade | Knife damage poisons the victim, losing health over time |

**Faction availability:** 12 Royals-only, 12 Nationals-only, 4 shared ("Both") —
Combat Medicine, Hero Shield, Leg It, Elixir. The four shared ones are the *support* kit,
available to both armies. That is a real design signal: the shared abilities are the
cooperative ones.

### Two design golds already in the 2009 original

1. **Team information as an ability.** *6th Sense* reveals for the whole team; *Mark
   Target* pays the Commando for designating enemies. Information warfare was native to
   the kit, not an addon.
2. **Damage-over-time as a weapon property.** *Poisoned Blade* (knife) and *Burning
   Bullets* (SMG) give the weapon its own identity through DoT rather than raw damage.
   This is a template for the Signature system.

---

## 2. Weapons — 346 of them, 9 archetypes

Full breakdown in `02-weapon-roster.json`.

| Category | Count | Class |
|---|---|---|
| SMG | 64 | Soldier |
| Rifle | 64 | Commando |
| MG | 62 | Gunner |
| Pistol | 44 | Soldier |
| Grenade Launcher | 40 | Soldier, Gunner |
| Shotgun | 40 | Soldier, Gunner |
| Knife | 22 | Commando |
| Sticky TNT | 6 | Soldier |
| Grenade | 4 | Soldier |
| **Total** | **346** | |

Faction split is exactly **173 Royals / 173 Nationals**. Class split: Soldier 178,
Commando 86, Gunner 82.

### Quality tiers (from the Weapon Variants page)

| Tier | Stat effect | Currency | Released |
|---|---|---|---|
| **Base** | — | Valor / Play4Free Funds | launch |
| **Dapper** (Royals) / **Stylish** (Nationals) | **statistically identical**, cosmetic only | Battlefunds / P4F | Heroes of the Fall |
| **Super** / **Uber** | "statistically and cosmetically different... featuring **minor stat changes**" | Battlefunds / VP / P4F | Winter Armistice |
| **Stolen** / **Pilfered** | identical to the *enemy* team's weapon | Battlefunds | 19 May 2010 |
| **Golden** | premium | — | later |

Royal variants are called "Dapper", National variants "Stylish". *Stolen* = Royal weapons
available to the Nationals, *Pilfered* = the reverse.

Prices scraped: the vast majority in **Play4Free Funds** (e.g. 4 999 F, 3 359 F, 2 249 F),
a few in **Valor Points**. The premium-currency ladder is: Battlefunds → Play4Free Funds
→ Valor Points.

**The key structural finding, with the arithmetic corrected.** The original reached 346
weapons by two multipliers stacked on top of each other, and it is worth separating them
because they are different failures:

1. **161 tier variants** (37 Super, 37 Uber, 21 Stolen, 21 Pilfered, 13 Dapper, 13 Stylish,
   16 Golden) on top of **185 base weapons**. The tier system bought cosmetic volume with
   premium currency; the only stat difference ("minor stat changes" on Super/Uber) was
   *purchased*.
2. **The 185 base weapons share their stat profiles heavily, but are NOT interchangeable.**
   Measured on the scraped stats: **34 grenade launchers collapse to 5 distinct stat
   profiles** (*M32 MGL* and *Tank Buster* differ only in ammo count; *Dragon's Fire*,
   *The Cloak Thrower*, *Frosty the Snowgun* are near-clones). Across all 185 base weapons
   there are only **55 distinct 4-axis stat profiles** — only 7 weapons have a unique one.
   The same clustering holds per archetype: 29 SMGs → 11 profiles, 29 MGs → 8, 31 rifles →
   10, 22 pistols → 9, 18 shotguns → 7, **12 knives → 1**.

   **But the behavioural layer contradicts the obvious reading of that number.** The same
   185 weapons carry **95 distinct behaviour descriptions**. *Tank Buster* is a "long range
   anti-vehicle weapon"; *M32 MGL* is a "bulky grenade launcher... great for laying down
   areas of infantry destruction"; *Sam's SAM* is a different weapon again. The Knife
   family is the extreme case: **12 knives, one single stat profile, but 7 distinct
   behaviours** — *Sensei's Striking Edge* has "slow but long and powerful" swings,
   *Knuckleduster Dagger* is "a perfect weapon for those surprise attacks deep behind
   enemy lines", *Dirk's Digger* is "for digging graves".

So the real number is stranger than either "346" or "9 archetypes × 5 tiers": the original
shipped **185 base weapons occupying 55 stat profiles but 95 distinct behaviours**, then
multiplied that by 161 cosmetic-and-minor-stat variants.

**That is a more precise indictment than the one we started with.** The original did not
merely reskin — it **differentiated by behaviour and wasted the numbers**, then reskinned
*itself* and sold the reskins. The failure is that a large share of the roster
distinguished itself by *name* rather than by *mechanics*, and the "minor stat changes"
on Super/Uber were **paid** upgrades — a pay-to-win layer bolted onto that. Precisely
the model that cannot survive into an MMO where horizontal progression is the whole point.

*(Retraction, 2026-11-07: an earlier draft of this section concluded the base weapons
were "functionally about 20–30 weapons" and called them "near-duplicates". The measured
behaviour data shows that was too strong — 95 distinct behaviours across 185 weapons is
not 25. The stat-clone ratios are real and measured; the interchangeability claim was
wrong. See `systems/class-and-weapon-families.md` §2.1.)*

---

## 3. Progression — Hero Points and the level curve

**Hero Points** (from the Abilities page):
- Each hero starts with **1 Hero Point**, automatically placed in the class's basic ability.
- Additional Hero Points are granted permanently through gaining XP, **one at every even
  level**.
- **Level cap 30 → maximum 16 Hero Points.**
- Hero Points are spent on the abilities screen. **Level 5 is the maximum level for any
  single ability.**
- Upgrading an ability improves its effectiveness, duration, and cooldown.
- **Players can reset ability upgrades and get a full refund** of Hero Points.

That last point is important and easy to miss: **the original already had a full
respec mechanic in 2009.** The MMO keeps it and makes it free.

### Level curve (from bfh-info level table)

| Level | Hero Points | XP to next | % to max |
|---|---|---|---|
| 1 | 1 | 600 | 0,00 % |
| 2 | 2 | 1 200 | 0,06 % |
| 5 | 3 | 11 500 | 1,06 % |
| 10 | 5 | 114 200 | 20,95 % |
| 15 | 8 | 256 100 | 81,96 % |
| 20 | 10 | ~11 500/step | — |
| 30 | 16 | — | 100,00 % |

Level 1→30 requires **~3.2 million XP**. Level 30's final step is 105,6 % of the previous
step's length — the curve flattens hard at the cap. Level 15 is 72,9 % of level 24, and
level 30 takes as long as levels 1 through 68 would.

---

## 4. Currencies

| Currency | Earned by | Spent on | Buyable? |
|---|---|---|---|
| **Hero Points** | leveling (every even level, 16 max) | ability upgrades (max level 5 each) | No |
| **Valor Points** | playing — kills, objectives | weapon purchases | No |
| **Battlefunds** | premium purchase | Super/Uber weapons, Dapper/Stylish variants, cosmetic items | **Yes** |
| **Play4Free Funds** | premium purchase | general store, weapon purchases | **Yes** |

Battlefunds and Play4Free Funds are the paid currencies. **Super/Uber weapons — the ones
with stat differences — were purchasable with premium currency.** That is the exact
mechanic this design forbids.

---

## 5. Game modes and the metagame

Four modes:
- **Team Deathmatch** — kill-based, tickets.
- **Hot on the Heels (HotH)** — chase mode.
- **Capture the Flag** — the mode the community named maps for.
- **Team Elimination** — last team standing.

**Conquest** (the core mode): control flags across the map; each kill removes tickets from
the enemy, and **the number of tickets removed per kill depends on how many flags the
killing team holds**. 50 tickets per side. Flag capture percentage is shown to players.

**Metagame:** the war was fought as **28 campaigns**. Result: **22 National victories,
5 Royal victories, 1 inconclusive** — and it ended in a **truce**, revealed at shutdown.

**Maps (13):** Alpine Assault, Buccaneer Bay, Coastal Clash, Fortress Frenzy, Inland
Invasion, Lunar Landing, Midnight Mayhem, Perilous Port, Riverside Rush, Seaside Skirmish,
Sunset Showdown, Victory Village, Wake Island Heroes.

**Vehicles:** 4 per faction — jeep, medium tank, fighter plane, helicopter. Vehicles are
faction-specific with slight differences between factions.

---

## 6. Items beyond weapons — Widgets

**Correction (2026-11-07):** an earlier draft of this document described Widgets as
cosmetic t-shirt items. That was wrong, and it was wrong in the dangerous direction — it
made the original look *more* noble than it was, which is exactly the kind of flattering
error that would have let a pay-to-win design slip through unchallenged.

Widgets were **functional items with timed cooldowns**, bought with Play4Free Funds in
bundles, in six categories: Support, Attack, Fun, Boost, Jump and Run, and Vehicle.
Verified examples and their real effects:

| Widget | Effect | Category |
|---|---|---|
| Crude → Supreme Bandage | Restores 36 % → **72 %** of health over time; cancels on damage; stops burn and poison | Support |
| Terrific Health Tonic | **Instant 50 HP** | Support |
| Sarge's Stamina Boost | **+10 max HP** | Boost |
| Amassing Force | **Telekinetic** — pushes enemies without damage | Attack |
| Jeep Jump / Ramming Jeep | Vehicle mobility and collision | Vehicle |
| Fire Proof Underpants | Damage-type immunity | Support |

The t-shirt items ("Roy/Nat Manatee Shirt", "Roy/Nat KK Overdose Tshirt", "Roy/Nat I Love
Freakin Shirt", "Roy/Nat Fiskern Shirt", "Roy/Nat WC 2026 Winner T-Shirt") also exist —
but those are **Customization** items, a different category from Widgets. The two were
conflated.

**What this means for the design is the opposite of what the original did.** The original
sold real combat advantages with real money — instant healing, extra max HP, a free
displacement ability. Our rule stands and is now *better* founded: **no premium currency
may purchase any combat advantage.** The original is the cautionary example, not the
model.

---

## 7. What this means for the MMO design

1. **Keep the 9 archetypes.** They are the class skeleton and they work. Drop the 346.
2. **Replace quality tiers with per-weapon trees.** Depth instead of count.
3. **Keep the free full-respec.** It was in the original and it is the right call.
4. **16 Hero Points, level cap 30.** Keep the numbers. Keep the even-level cadence.
5. **Level 5 per ability → per-weapon tree with 6 points.** The original's 16 points across
   16 abilities becomes 16 points across a smaller, deeper set.
6. **Team information and DoT are native to the class kit.** Build the Signature system on
   them — they are proven, shipped, and they create role identity without stat inflation.
7. **The truce is the lore foundation.** The war ended. The MMO's seasonal structure should
   be built on truces, not on one endless war.
