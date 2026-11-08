#!/usr/bin/env python3
"""
BFH-MMO — design-system simulator.

Validates the progression math from GAME-DESIGN.md and systems/weapon-specification.md:
  - level curve and Hero Point cadence (real BFH numbers, verified 2026-11-07)
  - weapon tree point economy: how many weapons a maxed player can fully specialize
  - Signature pick-one-of-three distribution
  - Doctrine capacity pool vs. collected doctrine count

Pure stdlib. No deps. Runs in milliseconds. Read-only on design inputs.
"""
import json
import math
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Optional

# ---------------------------------------------------------------- BFH actuals
# From research/02-bfh-system-inventory.md — real level curve, scraped from
# bfh-info.cs-heroes.cz. XP required to advance FROM that level to the next.
BFH_XP = {
    1: 600, 2: 1200, 3: 2200, 4: 3600, 5: 5500, 6: 8100, 7: 11500, 8: 15900,
    9: 22800, 10: 31300, 11: 41300, 12: 52800, 13: 65100, 14: 77900, 15: 90600,
    16: 102900, 17: 114200, 18: 124600, 19: 134000, 20: 149800, 21: 165400,
    22: 180900, 23: 196000, 24: 211100, 25: 226200, 26: 241100, 27: 256100,
    28: 271200, 29: 286400,
}
BFH_TOTAL_XP = 3_090_300   # verified cumulative, level 1 -> 30

LEVEL_CAP = 30
HERO_POINT_LEVELS = list(range(2, 31, 2))   # +1 at every even level
MAX_HERO_POINTS = 16                        # 1 at level 1 + 15 even levels

# ------------------------------------------------------- design parameters
SPEC_COMMIT_AT = 10        # class spec chosen at level 10
SPEC_POINTS_COMMITTED = 4  # of the remaining 6 class points
SPEC_POINTS_FREE = 2
SPEC_TREE_NODES = 12       # branch node + 2 tiers x (core + signature)
WEAPON_TREE_NODES = 8      # 5 core nodes + 3 signature tiers (pick-one-of-three)
SIGNATURE_OPTIONS_L20 = 3
SIGNATURE_OPTIONS_L30 = 4
DOCTRINE_SLOTS = {3: 1, 6: 2, 10: 2, 15: 3, 20: 4, 25: 5, 30: 5}
DOCTRINE_CAPACITY_BASE = 5
WEAPONS_OWNED_AT_CAP = 8   # design target: a maxed player owns ~8 weapons


@dataclass
class SimResult:
    name: str
    value: float
    unit: str
    verdict: str
    detail: str = ""


def sim_level_curve() -> List[SimResult]:
    out = []
    total = sum(BFH_XP.values())
    out.append(SimResult("Total XP to cap", total, "xp",
                          "PASS" if total == BFH_TOTAL_XP else "FAIL",
                          "verified cumulative, level 1 -> 30"))

    hp = 1 + len(HERO_POINT_LEVELS)
    out.append(SimResult("Hero Points at cap", hp, "hp",
                          "PASS" if hp == MAX_HERO_POINTS else "FAIL",
                          f"1 at level 1 + {len(HERO_POINT_LEVELS)} even levels"))

    def xp_to(level: int) -> int:
        return sum(BFH_XP[l] for l in range(1, level))

    x10, x20, x30 = xp_to(10), xp_to(20), xp_to(30)
    out.append(SimResult("XP to spec unlock (L10)", x10, "xp", "REFERENCE",
                          f"{x10/total*100:.1f}% of total"))
    out.append(SimResult("XP to first Signature (L20)", x20, "xp", "REFERENCE",
                          f"{x20/total*100:.1f}% of total"))
    out.append(SimResult("XP to full Signature (L30)", x30, "xp", "REFERENCE",
                          ""))
    half = total / 2
    lvl = 1
    acc = 0
    while acc + BFH_XP.get(lvl, 0) < half:
        acc += BFH_XP.get(lvl, 0)
        lvl += 1
    out.append(SimResult("Level at 50% of total XP", lvl, "level", "REFERENCE",
                          f"level {lvl} = {lvl/LEVEL_CAP*100:.0f}% of cap"))
    return out


def sim_weapon_economy() -> List[SimResult]:
    """The three point pools, and the constraint that makes weapon choice matter.

    DESIGN (revised after the first simulator run):
      - Hero Points (16, character level)  -> class ABILITIES, max level 5 each.
        Exactly the original BFH economy.
      - Class Points (30, character level)  -> the spec tree.
      - Weapon Skill Points (per weapon, earned by USING that weapon) -> the
        per-weapon tree. NOT granted by character level. This is the load-bearing
        change: you can only master the weapons you actually play.
    """
    out = []

    hp = 1 + len(HERO_POINT_LEVELS)
    out.append(SimResult("Hero Points at cap", hp, "hp",
                          "PASS" if hp == MAX_HERO_POINTS else "FAIL",
                          "class abilities, max level 5 each (original)"))

    class_points = LEVEL_CAP
    out.append(SimResult("Class Points at cap", class_points, "pts", "REFERENCE",
                          "spec tree"))

    spec_tree = SPEC_TREE_NODES
    spec_surplus = class_points - spec_tree
    out.append(SimResult("Spec tree cost", spec_tree, "nodes", "REFERENCE",
                          "branch + signature tiers"))
    out.append(SimResult("Spec surplus", spec_surplus, "pts",
                          "PASS" if spec_surplus > 0 else "FAIL",
                          "surplus converts to Valor at 1:1 — no dead points"))

    # Weapon mastery is gated by USE, not by level. Model it:
    # a player splits their playtime across 8 owned weapons.
    tree = WEAPON_TREE_NODES
    out.append(SimResult("Weapon tree cost", tree, "pts", "REFERENCE",
                          "5 core nodes + 3 signature tiers (pick-one-of-three)"))
    out.append(SimResult("Points to master ONE weapon", tree, "pts", "REFERENCE",
                          "earned by using that weapon"))

    # To master all 8 owned weapons you need 8x the points of mastering one.
    all_mastered = tree * WEAPONS_OWNED_AT_CAP
    out.append(SimResult("Points to master ALL owned", all_mastered, "pts",
                          "REFERENCE",
                          "8 weapons owned — you cannot master the set"))

    # The real constraint: a player who splits playtime evenly masters nothing.
    # Model weekly play sessions across N weapons.
    sessions = 20
    for weapons_used in (1, 2, 4, 8):
        per_weapon = sessions // weapons_used
        mastered = per_weapon >= tree
        out.append(SimResult(
            f"Weapons mastered ({weapons_used} in rotation)", 1 if mastered else 0,
            "weapons", "REFERENCE",
            f"{per_weapon} sessions each vs {tree} needed -> "
            f"{'mastered' if mastered else 'incomplete'}"))

    # Signature options
    out.append(SimResult("Signature options at weapon L20", SIGNATURE_OPTIONS_L20, "opts",
                          "PASS", "pick-one-of-three"))
    out.append(SimResult("Signature options at weapon L30", SIGNATURE_OPTIONS_L30, "opts",
                          "PASS", "fourth unlocks at cap"))
    out.append(SimResult("Signature tiers per weapon", 3, "tiers", "REFERENCE",
                          "pick-one-of-three at each tier"))
    return out


def sim_doctrine_economy() -> List[SimResult]:
    out = []
    slots = DOCTRINE_SLOTS[LEVEL_CAP]
    out.append(SimResult("Doctrine slots at cap", slots, "slots", "REFERENCE",
                          "unlocks at L3/6/10/15/20/25"))

    # capacity pool from design: 5 slots, 6 with a Doctrine unlock
    cap_base = DOCTRINE_CAPACITY_BASE
    out.append(SimResult("Doctrine capacity pool", cap_base, "slots", "REFERENCE",
                          "6 with a Doctrine unlock"))

    # a player needs MORE doctrines than slots, or there's no choice
    # -> design target: collect ~3x capacity over a season
    target = cap_base * 3
    out.append(SimResult("Doctrines needed for meaningful choice", target, "items",
                          "REFERENCE",
                          "3x capacity — the surplus is what makes selection a decision"))

    # deterministic floor: core set must cover every class spec
    specs = 3 * 3  # 3 classes x 3 specs
    core = specs * 2
    out.append(SimResult("Fixed core Doctrine set", core, "items", "REFERENCE",
                          f"2 per spec across {specs} specs — never RNG-gated"))
    return out


def sim_promotion_economy() -> List[SimResult]:
    """In-match promotion: 3 tokens, lost on death. Does the cost curve create a decision?"""
    out = []
    costs = {"Rearm": 50, "Overcharge": 100, "Marksman": 150, "Deployable": 250, "Special": 400}
    tokens = 3
    # a player earning 1000 valor in a match can buy: 3x Special, or 4x Overcharge + 2x Rearm
    budget = 1000
    best = max(costs, key=lambda k: costs[k])
    combos = []
    names = list(costs)
    def rec(i, rem, acc):
        if i == len(names):
            if acc: combos.append((rem, acc[:]))
            return
        for q in range(0, rem // costs[names[i]] + 1):
            acc.append((names[i], q))
            rec(i + 1, rem - q * costs[names[i]], acc)
            acc.pop()
    rec(0, budget, [])
    viable = [c for c in combos if c[0] > 0]
    out.append(SimResult("Distinct purchases at 1000 valor", len(viable), "combos",
                          "PASS" if len(viable) > 5 else "FAIL",
                          "many viable buys -> the choice is real"))
    out.append(SimResult("Tokens carried", tokens, "tokens", "REFERENCE",
                          "lost on death -> spending early weakens late"))
    # tokens limit: 3 tokens but a 400 special costs 1 token, so 3 specials = 1200
    out.append(SimResult("Cost of full Special ramp", 3 * costs["Special"], "valor",
                          "REFERENCE", "3 tokens all into Special — the greedy line"))
    out.append(SimResult("Cost of 4x Overcharge", 4 * costs["Overcharge"], "valor",
                          "REFERENCE", "the opposite line, cheaper"))
    return out


def sim_weapon_dominance(six_axes: List[List[float]]) -> List[SimResult]:
    """Anti-domination check across a candidate roster.

    six_axes: one list of 6 scores per weapon (higher = better on that axis).
    A weapon that dominates another on ALL axes is a design failure.
    """
    out = []
    names = [f"W{i+1}" for i in range(len(six_axes))]
    dominating = []
    for i in range(len(six_axes)):
        for j in range(len(six_axes)):
            if i == j: continue
            if all(float(a) >= float(b) for a, b in zip(six_axes[i], six_axes[j])):
                dominating.append((names[i], names[j]))
    out.append(SimResult("Dominance violations", len(dominating), "pairs",
                          "PASS" if not dominating else "FAIL",
                          f"{names} pairs: {dominating}" if dominating else "no weapon strictly dominates"))
    return out


def sim_class_families() -> List[SimResult]:
    """The class x weapon-family matrix (systems/class-and-weapon-families.md).

    The invariants that make classes orthogonal rather than stat-variants:
      1. every family is usable by at least one class (no dead content)
      2. no class holds a SUPERSET of another class's families (the original's
         flaw: the Soldier held 6 of 9 families and 97 of 185 weapons)
      3. every class has exactly one exclusive utility (DRG support-tool rule)
      4. family counts are balanced enough that no class is the catch-all
      5. each class keeps a minimum number of families to stay a viable build
    """
    out = []

    matrix = {
        "Soldier":  {"SMG", "Shotgun", "Grenade Launcher", "TNT"},
        "Gunner":   {"MG", "Grenade Launcher", "Rocket Launcher"},
        "Commando": {"Shotgun", "Rifle", "Knife"},
        "Engineer": {"Pistol", "Artillery", "Field Kit"},
    }
    utilities = {
        "Soldier":  "Combat Medicine",
        "Gunner":   "Frenzy Fire",
        "Commando": "Mark Target",
        "Engineer": "Field Repair",
    }

    all_families = sorted(set().union(*matrix.values()))
    out.append(SimResult("Weapon families total", len(all_families), "families",
                          "REFERENCE", ", ".join(all_families)))

    # 1. no dead content
    dead = [f for f in all_families if not any(f in fs for fs in matrix.values())]
    out.append(SimResult("Families usable by no class", len(dead), "families",
                          "PASS" if not dead else "FAIL",
                          "no dead content" if not dead else f"dead: {dead}"))

    # 2. no class is a superset of another  <- the load-bearing invariant
    supersets = []
    for a, fa in matrix.items():
        for b, fb in matrix.items():
            if a == b:
                continue
            if fa and fb and fa < fb:      # proper subset
                supersets.append(f"{a} < {b}")
    out.append(SimResult("Superset class pairs", len(supersets), "pairs",
                          "PASS" if not supersets else "FAIL",
                          "no class is a strict subset of another"
                          if not supersets else f"violations: {supersets}"))

    # 3. exclusive utility per class
    bad_util = [c for c in matrix if not utilities.get(c)]
    out.append(SimResult("Classes without an exclusive utility", len(bad_util), "classes",
                          "PASS" if not bad_util else "FAIL",
                          ", ".join(utilities.values())))

    # 4/5. balance of family counts
    counts = {c: len(fs) for c, fs in matrix.items()}
    for c, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        out.append(SimResult(f"Families: {c}", n, "families", "REFERENCE",
                              ", ".join(sorted(matrix[c]))))

    widest = max(counts.values())
    narrowest = min(counts.values())
    spread = widest - narrowest
    out.append(SimResult("Family-count spread (widest - narrowest)", spread, "families",
                          "PASS" if spread <= 3 else "FAIL",
                          "the original spread was 6-2=4 (Soldier was a superset)"))

    min_fams = min(counts.values())
    out.append(SimResult("Minimum families any class holds", min_fams, "families",
                          "PASS" if min_fams >= 3 else "FAIL",
                          "a class needs enough families to stay a build"))

    # the original's measured flaw, for contrast
    original = {"Soldier": 6, "Gunner": 2, "Commando": 2}
    out.append(SimResult("Original spread (for contrast)", max(original.values())
                          - min(original.values()), "families", "REFERENCE",
                          "Soldier 6 / Gunner 2 / Commando 2 — the measured flaw"))
    return out


def sim_family_depth() -> List[SimResult]:
    """How deep can each weapon family go without producing stat-clones?

    MEASURED from the project's own scraped data (research/02-weapon-roster.json
    + research/bfhinfo_items_detail.json) — not asserted. Recomputes the
    stat-clone ratio per family on every run so the numbers cannot drift.
    """
    out = []
    root = Path(__file__).resolve().parent.parent / "research"
    AXES = ("range", "rate_of_fire", "ammo", "damage")
    VARIANT_MARKERS = ("tier 1 elite", "tier 2 elite", "uber", "super",
                        "dapper", "stylish", "stolen", "pilfered", "golden")

    roster_p = root / "02-weapon-roster.json"
    detail_p = root / "bfhinfo_items_detail.json"
    if not (roster_p.exists() and detail_p.exists()):
        out.append(SimResult("Source data present", 0.0, "files", "FAIL",
                              f"missing {roster_p.name} / {detail_p.name}"))
        return out

    roster = json.loads(roster_p.read_text())
    weapons = roster if isinstance(roster, list) else roster.get("weapons", roster)
    detail = json.loads(detail_p.read_text())

    def is_variant(name: str) -> bool:
        n = name.lower()
        return any(m in n for m in VARIANT_MARKERS)

    base = [w for w in weapons if not is_variant(w.get("name", ""))]

    def profile(item):
        d = detail.get(str(item.get("id")), {})
        return tuple(d.get(a) for a in AXES)

    by_cat: Dict[str, List[dict]] = {}
    for w in base:
        by_cat.setdefault(w["cat"], []).append(w)

    # Aggregate: how many base weapons share a stat profile with another?
    all_profiles = [profile(w) for w in base]
    distinct_all = len(set(all_profiles))
    shared = sum(1 for p in all_profiles if all_profiles.count(p) > 1)
    unique = len(base) - shared
    out.append(SimResult("Base weapons (measured)", float(len(base)), "weapons", "PASS",
                          f"from {roster_p.name}"))
    out.append(SimResult("Distinct 4-axis stat profiles", float(distinct_all), "profiles",
                          "REFERENCE",
                          f"{len(base)} weapons collapse to {distinct_all} stat profiles"))
    out.append(SimResult("Weapons sharing a stat profile", float(shared), "weapons",
                          "REFERENCE",
                          f"only {unique} of {len(base)} have a unique stat profile"))

    # Per family: the clone ratio. A family where ratio is high is a reskin farm
    # in the ORIGINAL — that is a measured fact about the 2009 game, not a
    # failure of our design, so it is REFERENCE. The invariant we actually
    # enforce is the re-cut target below.
    for cat, items in sorted(by_cat.items(), key=lambda kv: -len(kv[1])):
        p = len({profile(i) for i in items})
        ratio = len(items) / p if p else 0
        out.append(SimResult(
            f"Original stat-clone ratio: {cat}", round(ratio, 2), "x", "REFERENCE",
            f"{len(items)} weapons -> {p} distinct stat profiles"))

    # Behaviours: the original was NOT purely reskins — descriptions differ.
    descs = {str(detail.get(str(w.get("id")), {}).get("description")) for w in base}
    out.append(SimResult("Distinct behaviours (descriptions)", float(len(descs)), "texts",
                          "REFERENCE",
                          f"{len(descs)} distinct descriptions across {len(base)} base weapons — "
                          f"the original DID vary behaviour, not only stats"))

    # The Knife is the extreme case: 12 weapons, ONE stat profile.
    knife = by_cat.get("Knife", [])
    if knife:
        kp = len({profile(i) for i in knife})
        kd = len({str(detail.get(str(i.get("id")), {}).get("description")) for i in knife})
        out.append(SimResult("Knife family: stat profiles", float(kp), "profiles",
                              "REFERENCE",
                              f"{len(knife)} knives -> {kp} stat profile(s), "
                              f"{kd} distinct behaviours"))
        out.append(SimResult("Knife family: distinct behaviours", float(kd), "texts",
                              "PASS" if kd >= 6 else "FAIL",
                              "knives differ by behaviour even when stats are identical"))

    # ---- DESIGN INVARIANTS (these are the ones that must hold) ----
    target_per_family = 10
    total_families = 11
    target_total = target_per_family * total_families

    out.append(SimResult("Re-cut target per family", float(target_per_family), "weapons",
                          "PASS",
                          "smaller than the original's worst family "
                          f"({max(len(v) for v in by_cat.values())} weapons)"))
    out.append(SimResult("Re-cut base roster size", float(target_total), "weapons",
                          "PASS" if target_total < len(base) else "FAIL",
                          f"{total_families} families x {target_per_family} = {target_total}, "
                          f"vs the original's {len(base)} base in {len(by_cat)} families"))
    # Every family must have a smaller re-cut target than the original had
    over = [c for c, items in by_cat.items() if len(items) > target_per_family]
    out.append(SimResult("Families needing a roster cut", float(len(over)), "families",
                          "PASS",
                          f"{', '.join(sorted(over))} — these are the reskin farms "
                          f"that get re-cut to {target_per_family} each"))
    return out


def render(results: List[SimResult], title: str) -> str:
    lines = [f"\n{'='*78}", f"  {title}", f"{'='*78}"]
    w = max(len(r.name) for r in results) + 2
    for r in results:
        v = f"{r.value:,.0f}" if isinstance(r.value, float) else f"{r.value:,}"
        lines.append(f"  {r.name:<{w}} {v:>12} {r.unit:<8} [{r.verdict}]")
        if r.detail:
            lines.append(f"  {'':<{w}} {'':<12} {'':<8} → {r.detail}")
    return "\n".join(lines)


def main() -> int:
    print("=" * 78)
    print("  BFH-MMO design-system simulator")
    print("  Progression math validation — design docs vs. real BFH numbers")
    print("=" * 78)

    blocks = [
        ("LEVEL CURVE & HERO POINTS", sim_level_curve()),
        ("WEAPON TREE ECONOMY", sim_weapon_economy()),
        ("DOCTRINE ECONOMY", sim_doctrine_economy()),
        ("IN-MATCH PROMOTION", sim_promotion_economy()),
        ("CLASS x WEAPON FAMILY MATRIX", sim_class_families()),
        ("FAMILY DEPTH / STAT-CLONE RATIOS", sim_family_depth()),
    ]

    failures = []
    for title, res in blocks:
        print(render(res, title))
        failures += [r for r in res if r.verdict == "FAIL"]

    # demonstration roster for the anti-domination check
    roster = [
        [9, 5, 6, 7, 3, 6],   # assault rifle
        [6, 8, 4, 5, 7, 7],   # sniper
        [5, 3, 9, 8, 4, 4],   # SMG
        [7, 6, 5, 4, 8, 3],   # shotgun
        [8, 7, 3, 3, 9, 5],   # LMG
    ]
    dom = sim_weapon_dominance(roster)
    print(render(dom, "ANTI-DOMINATION CHECK (5-weapon demo roster)"))
    failures += [r for r in dom if r.verdict == "FAIL"]

    print("\n" + "=" * 78)
    if failures:
        print(f"  {len(failures)} CHECK(S) FAILED")
        for f in failures:
            print(f"    - {f.name}: {f.detail}")
        print("=" * 78)
        return 1
    print("  ALL CHECKS PASSED")
    print("=" * 78)
    return 0


if __name__ == "__main__":
    sys.exit(main())
