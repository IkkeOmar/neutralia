# Reference — Weapon Specialization in 2D Artillery Duels

The console game Omar described: 2D, one opponent with a cannon, you level up and
specialize your cannon through the run. This is the closest existing reference for
"weapon leveling that matters", and it is a family of games with well-documented mechanics.

**Research note.** Tank Stars' fandom wiki is CAPTCHA-protected and the Worms W.M.D. wiki
is intermittently archived. Numbers below are marked by confidence: **[verified]** = read
from a primary wiki/official page this session, **[corroborated]** = consistent across
multiple secondary sources, **[structural]** = the mechanic is well-established but the
exact numbers vary by version.

---

## 1. Tank Stars (Casual Azur Games) — the direct reference

Available on mobile and console. Turn-based 1v1 artillery: set angle, set power, fire.

| Mechanic | Detail | Confidence |
|---|---|---|
| **Turn structure** | Each turn the player gets a small movement allowance to find a better angle, then the shot | [verified] |
| **Damage model** | High arcs clear ridges, low trajectories punch through slopes, blast radius punishes sloppy aim | [verified] |
| **Weapon roster** | Dozens of weapons: nukes, freezing bombs, tasers, railguns, plasma cannons | [verified] |
| **Tank chassis** | Collectible — T-34, Tiger, through to a futuristic Atomic Launcher. The chassis is a separate choice from the weapon | [verified] |
| **Upgrade axis** | Weapons upgrade to boost **damage, utility, and tactical options** — three separate axes, not one | [verified] |
| **Progression** | Wins earn coins to expand the garage and level weapons | [verified] |
| **Modes** | Online PvP plus offline play | [verified] |
| **Weapon names** | Weapons have evocative names — *Volley* (up to 5 volleys of multiple projectiles), *Vertical Slam* (up to 3 guided rockets), *Splitter Chain* (up to 4 shells → 8 projectiles), *Napalm Strike*, *Artillery Support*, *Lightning Drone*, *Ice Splitter*, *High Pressure*, *Helios*, *Dubstep Grenade* — plus chassis *Abrams*, *Mark 1*, *Big One*, *Spectre*, *Pumpkin Tank* | [verified] |
| **How weapons upgrade** | Not a random slot: **weapon-specific duplicate cards → star upgrades**. Chassis have their own upgrade path (Abrams HP 800 → 1600 across 7 tiers). | [verified] |

**The single most important detail:** the upgrade improves *utility* and *tactical options*
alongside damage. That is the distinction between a shallow weapon system and a deep one,
and it is the same distinction this design makes in `systems/weapon-specification.md`.

**The chassis/weapon split** is the second key insight. Tank Stars separates *what you
drive* from *what you shoot*. That is exactly the split between Doctrine and weapon tree
in our design — and it is why two players of the same class can play differently.

**The naming is the third insight, and it is a naming lesson.** Almost none of these names
describe a number. *Volley*, *Vertical Slam*, *Splitter Chain*, *Napalm Strike* — each names
a *behaviour* a player can picture, and the wiki text tells you what it does: *Volley* fires
"an increasing number of projectiles per volley"; *Vertical Slam* fires "up to 3 guided
rockets" that loop in the air and track a target it flies over. A player reading "Vertical
Slam" understands what they will be doing at the 30 % mark. That is the naming standard the
Signature system should copy: **name the behaviour, not the bonus.**

---

## 2. Worms — the Weapon Factory (corrected 2026-11-07)

**An earlier draft of this document misattributed a tiered weapon-upgrade system with a
random "special effect" to Worms. That system does not exist. It was checked against the
primary wikis and is corrected below.**

What Worms actually ships:

| Mechanic | Detail | Confidence |
|---|---|---|
| **Worms 4 Team Weapon** | A *budgeted custom-weapon builder*. Choose Launched / Thrown / Air Strike, then configure parts, homing, wind-affect, poison, detonation, land/worm damage, blast strength, clusters. | [verified] |
| **Overheat gauge** | A power gauge blocks saving a weapon that is too strong. The builder is a *budget*, not a progression ladder. | [verified] |
| **Worms Forts Weapon Factory** | A *special building* (50 HP) that **generates weapon crates** — 3 victory locations required, crate count scales with its condition. Not an upgrade menu. | [verified] |
| **Worms W.M.D. crafting** | Ingredients from crates are spent to craft weapons; dismantling a weapon returns extra resources. Crafting happens *between turns*. | [verified] |
| **Crate economy** | Crates drop Weapon / Health / Utility / Building / Mystery / Coin / Ingredients. Health crates typically restore 25 HP. | [verified] |
| **Airstrike scaling** | Per-bomb damage **weakens as bomb count rises** — 1 bomb strongest, 10 weakest. | [verified] |

**What we actually take from Worms — and it is still the right lesson, sourced correctly:**

The lesson is **not** "random special → pick-one-of-three". It is **"the arsenal changes
during the run"**. Worms' escalation is mid-match: crates drop, the weapon you are holding
changes, and you adapt. MobyGames' review of Worms 4 makes the trade-off explicit — the
weapon factory is "very limited… your weapons cannot be very powerful", which is why the
game's mid-match crate economy, not the builder, is the source of the stories.

The design lesson that survives: **a weapon tree that is capped at a fixed budget creates
meaningful constraints; an uncapped one does not.** Our 8-point weapon tree with an
8-point cap is that budget. And the moment-to-moment variety in Worms maps onto our
**Doctrine layer** — the flexible, swappable half of the build.

---

## 3. Cannonheim

A modern artillery duellist with explicit age tiers and research. The most directly
documented of the group.

| Age | Unlock | Cost | Notes |
|---|---|---|---|
| **I** (start) | Cannon, stone walls, market, workshop | 500 starting gold | Every match starts here |
| **II** | Mortar, explosive shot, incendiary bomb | 800 gold research | Gunpowder artillery: high-angle fire over walls, area damage, burning over time |
| **III** | Heavy howitzer, armour-piercing and shrapnel shot | 700 gold research | Breaks armour and terrain alike |

The economy around it (all numbers from the developer, v1.1): the keep has **90 HP**, a
tower reduces damage taken by the keep to **25 %**, and an intact market adds **50 gold
per round**. Gold arrives every round — not for hits — so defending the market is a real
economic decision, not decoration.

Weapon data (from the developer, version 1.1):

| Weapon | Damage | Radius | Armour piercing | Price |
|---|---|---|---|---|
| Cannon | 45 | 140 | 35 % | starting gear |
| Explosive Shot | 36 | **190** | 28 % | 400 gold |

**The two specializations — one per match, explicitly:**

| Specialization | Effect | Cost |
|---|---|---|
| **Siegecraft** | Shells explode over a **25 % larger area** — more parts per hit, shrapnel included | 500 gold |
| **Engineering** | Repairs restore **50 % more HP** at the same price | 500 gold |

**Three lessons:**
1. **The explosive shot trades direct damage for area** — 45→36 damage but 140→190 radius.
   That is a *behavioural* difference, not a numeric one. The weapon plays differently.
2. **Specialization is one per match, and it is a genuine fork.** Siegecraft vs Engineering
   are opposite answers to the same question, and neither is universally better.
3. **The specialization costs resources that compete with everything else** (500 gold for
   a spec vs 800 for an age). Spending on the spec means not spending on walls.

---

## 4. ShellShock Live, and the general family

ShellShock Live (mobile) has **two distinct systems**, and conflating them is a trap:

- **Account-level skill trees** (Chassis / Track / Gun / Luck), bought with **1 upgrade
  token per level, 2 at level 100**, freely redistributable every 7 days. Chassis gives
  1 % HP per point (max +40 % armour); Gun gives +0.5 % crit per point (max 20 %) on a
  1.5× baseline. Luck raises crate tier and adds *Hefty Haul* (armour cap 30 → 45).
- **Weapon tiers are the in-match progression** — *Shot* (unlocked) → *Big Shot*
  (10 → 20 damage, 12 radius, **req 100 XP**) → *Heavy Shot* → *Massive Shot*; the
  projectile families run the same way (*Three-Ball* → *Five-Ball* → *Eleven-Ball* →
  *TwentyFive-Ball*).

So the "weapon levels unlock special abilities" claim belongs to the **tier tree**, not
to the account trees. The useful pattern for us is the tier ladder itself: **each tier
raises a number *and* changes what the projectile does** — a cluster tier adds projectiles
rather than adding damage per projectile.

---

## 5. Distilled principles

**P1 — Upgrade changes behaviour, not magnitude.**
Every reference game above distinguishes a weapon that *does something new* from one that
*does the same thing harder*. Cannonheim's explosive shot is the cleanest example: less
damage, much more area. A tree whose final node is "+8% damage" has failed.

**P2 — The last upgrade must be a fork, and both branches must be situational.**
Cannonheim's Siegecraft/Engineering split works because neither wins universally.
Worms' utility-vs-damage split works because the terrain and the match state decide.

**P3 — Separate the chassis from the weapon.**
Tank Stars: tank body and gun are separate choices. Hunt: Showdown: weapon + trait slots.
This is what lets two players of the same "class" play differently without either of them
having picked a different class.

**P4 — Keep the randomness in the *drop*, never in the identity-defining choice.**
Deep Rock Galactic is the correct reference for this, not Worms: an Overclock is offered
**pick-one-of-three** at the moment it drops (a Blank Core lets you choose 2 weapon / 1
cosmetic), so the *choice* becomes the memory and the grind is only the setup. A Signature
that is rolled at random and then bound to your account for six months is a bad-luck tax,
not a story. The randomness belongs to *what you get*, never to *what it is*.

**P4b — Cap the budget, not just the node count.** Worms' weapon factory shows the value of
a hard ceiling: the overheat gauge refuses to save an overpowered weapon. Our 8-point cap
is that gauge.

**P5 — Specialization must compete with something else for resources.**
Cannonheim's 500 gold spec competes with walls, repairs, and research. A specialization
that is free is a default; one that competes is a decision.

**P6 — Utility is its own track.**
Across the family, utility (teleport, earthquake, drill, freeze) is upgraded separately
from damage weapons. Utility and damage answer different questions — "how do I get there"
and "how do I hurt them" — and merging them blunts both.

---

## 6. What we take, and what we change

| Reference | What we take | What we change |
|---|---|---|
| **BFH Workbench** (the original's own system) | Per-weapon upgrade slots, one of each type at a time, with **Secondary Fire** and **Special Features** rows | Fix its flaws: it is a slot-swap with mostly flat stats; ours is a branching tree with a behaviour-only Signature |
| Worms 4 Weapon Factory | A hard power budget (overheat gauge) — the cap is the design | Ours is a node budget on a persistent tree, not a one-off builder |
| Worms crate economy | The arsenal changes mid-run; adaptation is the story | Moves to the Doctrine layer + in-match field promotion |
| Tank Stars | Chassis/weapon split; upgrades across damage + utility + tactics | Persistent across a character, not per-match |
| Cannonheim | One specialization per session, situational branches; resource competition | Signature is per-weapon and permanent, not per-match |
| Cannonheim Explosive Shot | Trades for area — behaviour over magnitude | Directly adopted as the Node-2 branch model |
| ShellShock Live | Weapon tier ladder where each tier adds projectiles, not just damage | Adopted as a Signature rule |
| Deep Rock Galactic | Overclock offered **pick-one-of-three** at drop time | Directly adopted — this, not Worms, is the source of the pick-one-of-three rule |

**The gap in the market this design occupies:** every reference game above is either
(a) a short-session competitive game with no persistence, or (b) a persistent MMO with
weapon *variety* but no per-weapon *tree*. Nobody has shipped "persistent character, per-
weapon tree, pick-one-of-three signature, zero stat levels." That is the space.

---

## 7. Sources

- Tank Stars — fandom wiki (via API): weapon pages confirm *Volley*, *Vertical Slam*, *Napalm Strike* are **weapons** on the Abrams, whose upgrades come from **weapon-specific duplicate cards → star upgrades**, not a random slot. https://tank-stars.fandom.com/wiki/Volley
- Cannonheim — official site, weapon tables (v1.1), ages, research, specializations. https://cannonheim.com/en/
- Worms W.M.D. — crafting page: "Craft Crates give you access to Ingredients… Craft in between turns. Dismantle to obtain Extra resources." https://wormswmd.fandom.com/wiki/Crafting
- Worms Forts Weapon Factory — special building, 50 HP, 3 victory locations, generates weapon crates. https://worms.miraheze.org/wiki/Weapon_Factory
- Worms 4 Team Weapon — the budgeted builder and its overheat gauge. https://worms.miraheze.org/wiki/Team_Weapon
- Worms 4 — MobyGames review: the weapon factory is limited and gated by a power gauge. https://www.mobygames.com/game/18593/worms-4-mayhem/
- ShellShock Live — account skill trees (1 token per level, 2 at level 100, 7-day redistribution) and the weapon tier ladder (*Shot* → *Big Shot*, req 100 XP). https://web.archive.org/web/20250512212532/https://shellshocklive.fandom.com/wiki/Upgrades
- BFH Workbench — per-weapon upgrade slots, Secondary Fire and Special Features rows, introduced 5 Dec 2012. https://battlefield.fandom.com/wiki/Workbench
- BFH weapon-upgrade price list — upgrade items 8000-8089, priced in Play4Free Funds. https://bfh-info.cs-heroes.cz/en/item/weapon-upgrade/
- Deep Rock Galactic — weapon Overclocks (pick-one-of-three), for the pick-one-of-three pattern. https://deeprockgalactic.wiki.gg/wiki/Weapon_Overclocks
- Hunt: Showdown — trait slots and weapon capacity. https://huntshowdown.wiki.gg/wiki/Traits · https://huntshowdown.wiki.gg/wiki/Weapons
- DUSTLINE — a browser artillery duel with 224 weapons and card-hand loadout (for the "card draft inside the match" variant). https://github.com/PV-Bhat/Dustline-game
