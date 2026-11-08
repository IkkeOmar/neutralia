# Build & Design Systems — Research Report

How shipped games make weapon choice and specialization matter *functionally* — and what that means for a free-to-play MMO where level grants **zero** combat stats, weapons end in a "Signature" permanent choice, players slot 3–5 "Doctrine" passives, the meta must not go stale, and monetization may only sell cosmetics.

---

## 1. Per-System Structural Mechanics

### 1.1 Deep Rock Galactic — Weapon Overclocks (closest analogue to "per-weapon specialization tree with a signature")

**Mechanic:** Each weapon has its own pool of Overclocks (160 total, ~39–42 per class) that are permanently unlocked via an infused Matrix Core at the Forge. Every Overclock is **weapon-specific** — it cannot be moved to another gun. They come in three archetypes: **Clean** (green border, small buff, no downside), **Balanced** (yellow, larger buff + equal penalty), and **Unstable** (red, massive/transformative effect + heavy penalty). Acquisition is a **pick-one-of-three** offer: a Blank Matrix Core infused at a Machine Event lets the player choose from 3 options (2 weapon, 1 cosmetic), and otherwise the reward is rolled at drop time. This makes the *choice* — not the grind — the moment of identity.

Why it works for our design: the pick-one-of-three generates horizontal variety and ownership ("*my* Flamethrower is the Sticky Fuel one"), weapon identity comes from the Overclock changing *behavior* (new fire modes, new mechanics) rather than only numbers, and class identity is preserved because the Overclock pool is gated by class.

Source: https://deeprockgalactic.wiki.gg/wiki/Weapon_Overclocks

### 1.2 Path of Exile — Item Bases & Crafting

**Mechanic:** A rare item's value comes from the *intersection* of base type (implicit mod + defense type + stat requirements), item level (which affix tiers can roll), influence type (which special mod pool), and 6 rolled explicit affixes across tiers. No single base is strictly best because *what is optimal depends on what you are building*: Two-Toned Boots' resistance implicit wins for most builds but Sorcerer Boots' ES base wins for ES stacking; a low ilvl Hunter boot can roll Tailwind but is the *wrong* base if you need top movement speed. Crafting is a set of tools that let you *partially* control the RNG (crafting bench plugs one hole with a weaker version, Harvest targeted a specific affix family), which deliberately keeps a wide gap between "good enough" (70% item, clears all content) and "chase" (perfect item, bragging rights).

Why it matters: avoiding "one item strictly best" is achieved through **multiple orthogonal axes of value** (defense type, implicit, ilvl, influence, affix) so that different builds rank different bases differently — plus **hard RNG kept soft by partial-targeting tools**.

Sources: https://www.exiledbench.com/blog/choosing-crafting-bases-item-level · https://www.reddit.com/r/pathofexile/comments/q6x6hn/heterogeneity_in_base_items_gloves_are_great/ · Baeclast #61, Chris Wilson on item philosophy (https://www.youtube.com/watch?v=FpIB2dMzNu8)

### 1.3 World of Warcraft — Talent Trees vs. Specialization Trees

**Mechanic:** Classic talent trees (pre-5.0.4) were three per class with ~51 points; players "dipped" to a deep capstone then spent leftovers in off-trees, producing filler talents, cookie-cutter "correct" builds, and an illusion of choice. Specializations (introduced 4.0.1) locked the tree to a spec and stripped it down, trading breadth for a *defined identity* with real signature abilities. Shadowlands' Covenants added a **weighty, hard-to-switch** class-specific tree (plus spec-specific Conduits socketed into a universal Soulbind tree) — this gave strong identity but punished experimentation with switching friction and balance-driven resentment. Dragonflight (10.0) rebuilt it as **two trees**: a shared *class* tree (utility/hybrid flavor) and a *spec* tree (role power), with 61 points, communicating dependencies by tree depth.

What this teaches: pure point-spend trees collapse into solved builds and filler nodes; **spec identity must be granted by baseline signature abilities, not bought back with points** — and *binding* choices (Covenant) create great identity but become a liability when meta shifts, so you need cheap/safe respec or the binding choice must feel cosmetic to power.

Sources: https://wowpedia.fandom.com/wiki/Talent_tree · https://www.gamebanshee.com/news/126454-world-of-warcraft-dragonflight-talent-preview.html · Shadowlands Covenant/Soulbind/Conduit update: https://warcraft.blizzplanet.com/world-of-warcraft-shadowlands-developer-update-july-8-transcript/6

### 1.4 Hunt: Showdown — Bounty Weapon Slots & Traits

**Mechanic:** A Hunter carries two weapons within a **shared Weapon Capacity pool of 5** (sizes 1–5; Quartermaster trait raises to 6), forcing real trade-offs between a big rifle and a small pistol vs. two mediums. Traits (up to 15, bought with per-Hunter Upgrade Points from Hunter XP) are *weapon-family-keyed*: Fanning only helps single-action revolvers, Levering only lever-actions, Iron Eye only bolt/lever, Bolt Thrower only crossbows/bomb launchers. Because traits key to *action types and ammo types* rather than individual weapons, **the trait combination, not the gun, is the build identity** — a Sparks rifle is a completely different playstyle with Bulletgrubber + Iron Eye vs. a fanning pistol build. Weapons themselves are unlocked per-family via Weapon XP, and perks are scarce/burn/regular tiers with Solo/Catalyst conditional bonuses.

What this teaches: build identity can come from a *small shared pool of passives that interact with weapon mechanics*, not from per-weapon stat trees — and a **capacity pool** (slots as a resource) does more to create variety than raw number of slots.

Sources: https://huntshowdown.wiki.gg/wiki/Traits · https://huntshowdown.wiki.gg/wiki/Weapons · https://www.huntshowdown.com/player-guide

### 1.5 Destiny 2 — Subclass + Elemental Affinity + Sandbox Weapons

**Mechanic:** Build space = subclass (Aspects/Fragments), exotic armor, armor mods (Armor Charge economy), and weapons — all joined by **damage type / elemental affinity**. Bungie's trajectory is instructive: it *started* with energy-type-locked mods and Match Game (forcing element diversity) then **removed armor elemental affinity entirely** ("removing Energy types from mods and armor, giving players more flexibility"), and moved from weapon-archetype-specific mods to damage-type-specific mods — because forcing four armor sets per build was friction, not depth. Elemental *flavor* survives as per-element spawned objects (Firesprite, Ionic Trace, Void Breach, Stasis Shard, Strand Tangle) that create loop synergy, and weapon identity lives in per-element exclusive perks (Incandescent = Solar only, Headstone = Stasis only). The lesson: **restrictive affinity (the constraint) must be cheap to change and must not force duplicate grinding; the payoff must be synergy loops, not lockout.**

Sources: https://www.bungie.net/7/en/News/article/buildcrafting (Buildcrafting Evolved) · https://www.bungie.net/7/en/News/article/ability-changes-lightfall-d2 · https://d2.destinygamewiki.com/wiki/Element · buildcrafting history by designer Rodney Thompson: https://rodneythompson.design/digital-games-portfolio/buildcrafting-advancements

### 1.6 F2P Monetization — Cosmetic-Only Stores

**Mechanic/principle:** The surviving, non-predatory model is: **power comes from gameplay, money buys cosmetics and time, never power.** Valorant's store is explicitly cosmetic-only (skins, gun buddies, sprays, battle-pass cosmetics; "never sells power", "a gun with a skin shoots exactly like a gun without one"). Warframe sells *speed* (skip build timers, buy with Platinum) and cosmetics, but every frame/weapon is farmable in-game; Polygon's feature documents its "ethical F2P" framing — cosmetics carry no sting, so the community helps each other rather than resents whales. This is the model the parent design must copy: cosmetics + convenience (XP boosters/slots), never stats, never exclusive power.

Sources: https://allvalorant.gg/is-valorant-free · https://www.destructoid.com/is-warframe-pay-to-win · https://www.polygon.com/2018/1/2/16830328/warframe-free-to-play-f2p-platinum · https://wiki.warframe.com/w/User%3AWarcoin/Monetization

---

## 2. Distilled Design Principles

1. **Specialization identity must change *behavior*, not just numbers.** DRG Unstable Overclocks add new fire modes/mechanics; pure +X% passives read as filler. (https://deeprockgalactic.wiki.gg/wiki/Weapon_Overclocks)

2. **Bind choices to the weapon, not the account, to create per-weapon identity.** Every DRG Overclock is weapon-specific and non-transferable, which is what makes "my gun" feel distinct. (https://deeprockgalactic.wiki.gg/wiki/Weapon_Overclocks)

3. **Use pick-one-of-three for the signature moment.** DRG's Blank Core → choose 2 weapon / 1 cosmetic turns a random drop into an ownership decision; choice is the memory, grind is the setup. (https://deeprockgalactic.wiki.gg/wiki/Weapon_Overclocks)

4. **Prevent "strictly best" with multiple orthogonal value axes, not with more stat tiers.** PoE bases differ on implicit, defense type, ilvl, influence, and affixes so different builds rank different bases best. (https://www.exiledbench.com/blog/choosing-crafting-bases-item-level)

5. **Keep a wide gap between "good enough to clear" and "perfect chase", and make chase items about pride, not power.** Chris Wilson: you can clear hardest content with ~70% items; perfect items are bragging rights. This preserves a loot chase without a power wall. (https://www.youtube.com/watch?v=FpIB2dMzNu8)

6. **Don't make players buy back baseline identity with points.** WoW's problem was filler talents and mandatory "correct" builds; spec identity must be granted, with trees *shaping* it. (https://wowpedia.fandom.com/wiki/Talent_tree)

7. **Heavy binding choices (Covenants) give great identity but need cheap respec or they become a meta trap.** WoW Covenant switching friction caused resentment the moment balance shifted. (https://warcraft.blizzplanet.com/world-of-warcraft-shadowlands-developer-update-july-8-transcript/6)

8. **Express a build as a small shared pool of passives that *key to weapon mechanics*.** Hunt traits (Fanning→revolvers, Levering→lever-action) mean the trait combo, not the gun, is the identity. (https://huntshowdown.wiki.gg/wiki/Traits)

9. **Make a shared capacity pool the constraint.** Hunt's 5-slot weapon capacity (6 with Quartermaster) forces more interesting trade-offs than free-form slots. (https://huntshowdown.wiki.gg/wiki/Weapons)

10. **Constraints must be cheap to change or they're friction, not depth.** Destiny 2 removed armor elemental affinity because it forced duplicate grinding; the synergy payoff survived as per-element pickups. (https://www.bungie.net/7/en/News/article/buildcrafting)

11. **Per-element (or per-school) exclusive perks create identity without lockout.** Destiny's Incandescent=Solar-only, Headstone=Stasis-only makes element meaningful while keeping everything else swappable. (https://d2.destinygamewiki.com/wiki/Element)

12. **Sell cosmetics and time, never power — power is the gameplay reward.** Valorant is strictly cosmetic; Warframe sells speed and cosmetics while every item stays farmable. (https://allvalorant.gg/is-valorant-free · https://www.destructoid.com/is-warframe-pay-to-win)

---

## 3. Failure Modes (games that got it wrong)

- **WoW classic talent trees (pre-4.0.1):** 51 points across three trees produced "dip to capstone, spend leftovers elsewhere", tons of *filler* talents you took only to reach the next tier, and community-solved cookie-cutter builds — the tree pretended to offer choice but was actually one correct answer per spec. (https://wowpedia.fandom.com/wiki/Talent_tree)
- **WoW Shadowlands Covenants:** a weighty, hard-to-switch class tree + spec Conduits created strong fantasy but the *switching friction* meant a bad balance patch trapped you in a Covenant that was now off-meta; the "meaningful choice" became a sunk cost players resented. (https://warcraft.blizzplanet.com/world-of-warcraft-shadowlands-developer-update-july-8-transcript/6)
- **PoE base homogeneity (self-identified by the community):** Two-Toned Boots and Astral Plate became near-universal picks because one implicit so dominated its slot that the "choice" collapsed — proof that a *single* too-good axis (resists implicit vs. small defense loss) destroys heterogeneity. (https://www.reddit.com/r/pathofexile/comments/q6x6hn/heterogeneity_in_base_items_gloves_are_great/)
- **PoE Harvest (2019–20) as cautionary overcorrection:** full-targeted crafting "ruined the game" by short-circuiting item acquisition — Chris Wilson admitted it "did actually really shortcut the item acquisition game by quite a lot more than we expected." The lesson: too much determinism collapses the chase. (https://www.youtube.com/watch?v=FpIB2dMzNu8)
- **Destiny 2 armor elemental affinity (Armor 2.0, 2019):** energy-type-locked mods forced players to farm four copies of each armor piece to fit mods — pure friction with no fantasy payoff — so Bungie removed affinity entirely in Lightfall. (https://www.bungie.net/7/en/News/article/buildcrafting)
- **Destiny 2 Match Game:** required element diversity against shields and made single-element builds feel hopeless, restricting freedom until removed and replaced with per-element synergy instead of per-element lockout. (https://www.bungie.net/7/en/News/article/buildcrafting)

---

## 4. Recommended Progression Structure

**What level-up does beyond appearance.** Level grants *no* combat stats. It unlocks **options**: new Doctrine slots (3 at start → 5 at cap), new weapon families, access to each weapon's Signature choice, and content gates (higher-tier activities). This mirrors Hunt's Bloodline (unlocks weapon variants and traits) and Destiny's power-from-activity, not power-from-level. The emotional beat of leveling is "now I *can do* X", never "now I hit harder."

**Weapon leveling / spec — in vs. out of combat.** Weapon XP accrues **in combat** (per-weapon use, like Hunt's per-family Weapon XP and Warframe's "upgrade gear by using it in combat" — https://www.polygon.com/2018/1/2/16830328/warframe-free-to-play-f2p-platinum). The short upgrade tree (4–6 nodes, ending in the Signature) is *spent* out of combat at a bench/armory, and the tree is fully and cheaply respec-able up to the Signature node. **The Signature is the one permanent, binding choice** — it should be the DRG Unstable-style behavioral change, not a stat boost, and it must be reversible for a non-trivial but *affordable* cost (avoiding the WoW Covenant trap while preserving the identity weight). Pick-one-of-three for the Signature is ideal: the moment feels owned.

**Keeping the shared meta fresh.** Rotate a **seasonal Doctrine pool** and a **seasonal "Affinity/Element" modifier** rather than buff/nerfing numbers: (a) introduce new Doctrines each season that key to weapon mechanics (Hunt-style), retire/rotate some into a legacy pool; (b) add per-season elemental/school-exclusive perks (Destiny-style Incandescent/Headstone) so weapons get new *synergy loops* without stat creep; (c) use pick-one-of-three rewards to inject novelty. The goal is **horizontal churn** (new combinations to discover) rather than vertical power creep, and a shared meta stays fresh because *validity* shifts while raw power stays flat.

**Doctrine (passive item) drops — random vs. fixed vs. hybrid.** Recommend **hybrid with a deterministic floor**:
- **Fixed/crafted sources** for the core starter set (guaranteed path to a playable build — never gate basic competence behind RNG).
- **Random drops with a pity/dupe-protection** for the chase tier (Warframe/DRG-style), where scarcity makes them feel earned.
- **Pick-one-of-three** whenever a "rare" Doctrine drops, so RNG becomes a *choice*, not a lottery (DRG's Blank Core lesson).
This keeps the chase (Principle 5) without ever blocking progression, and a dupe-protection/pity system prevents the "played 200h, never got the one I need" resentment.

**Monetization placement.** Sell cosmetics (skins, VFX, weapon/armor skins), quality-of-life (loadout slots, stash space), and *time* conveniences (XP boosters) — explicitly **never** stats, never Doctrines, never Signature nodes, never power. Copy Valorant/Warframe framing: every power item is farmable in-game; paid items are aesthetic or convenience only.

---

## 5. If You Only Do 5 Things, Do These

| # | Action | Why (principle ref.) |
|---|--------|----------------------|
| 1 | Signature = a **behavioral** change (new fire mode/mechanic), pick-one-of-three, weapon-bound and respec-able-but-weighty | Identity from behavior, not stats (P1, P2, P3) |
| 2 | Level grants **options only** (Doctrine slots, weapon access, Signature) — zero combat stats | Level = "can do", never "hit harder" (P6) |
| 3 | Doctrines key to **weapon mechanics/action types**, not to +X% stats | Build identity = passive combo, Hunt-style (P8) |
| 4 | Multiple **orthogonal** value axes per item (implicit, affinity, school, ilvl) so no single "best" | Kills strictly-best items, PoE-style (P4) |
| 5 | Seasonal **horizontal** rotation (new Doctrines + element-exclusive perks), plus cheap respec on anything binding | Fresh meta without power creep (P7, P10, P11) |

**Bottom line:** the shipped games agree on one thing — *functional* weapon/specialization depth comes from **behavior-changing, choice-driven, respec-able horizontal options**, not from bigger numbers; and the moment any system starts trading real money for any of that power, it loses the community trust that the whole model depends on.
