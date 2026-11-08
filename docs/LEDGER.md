# LEDGER — NEUTRALIA (BFH-MMO)

Durable project state. This file is the source of truth for *where the project is*;
Hermes memory holds only the cross-session pointer to it.

Append-only within a section. When a decision changes, add a new dated entry — do not
silently rewrite history. Superseded entries get a line marked `SUPERSEDED`.

Last updated: 2026-11-08

---

## 1. Identity

- **Working title:** NEUTRALIA
- **Working dir:** `/home/omar/2026-11-07/bfh-mmo/`
- **Public site:** https://ikkeomar.github.io/neutralia/ (repo `IkkeOmar/neutralia`, public, GitHub Pages)
- **Private corpus:** `IkkeOmar/bfh-mmo`
- **Domain rule:** `basednode.xyz` = business domain, NEVER hosts this project.

---

## 2. Design pillars (current)

| # | Pillar | Status |
|---|---|---|
| P1 | Weapon choice is the game — every weapon differs functionally on ≥3 axes | active |
| P2 | Leveling unlocks options, never power | **AMENDED 2026-11-08 — see §5** |
| P3 | The war you fight is not the war that exists (Neutralia = third faction premise) | active |

---

## 3. Measured original-game facts

Source: `research/02-weapon-roster.json`, `research/bfhinfo_items_detail.json`,
`research/02-bfh-system-inventory.md`.

| Fact | Value |
|---|---|
| Base weapons | 185 |
| Tier variants | 161 (37 Super, 37 Uber, 21 Stolen, 21 Pilfered, 13 Dapper, 13 Stylish, 16 Golden) |
| Distinct 4-axis stat profiles | 55 |
| Weapons with a unique stat profile | 7 |
| Distinct behaviour descriptions | 95 |
| Knives sharing one stat profile | 12 |

**Do not** re-derive these from memory — the earlier "functionally ~25 weapons" reading was
wrong and was corrected. 185 weapons collapse to 55 stat profiles but carry 95 distinct
behaviours, so the original was not purely interchangeable reskins.

### Original BFH vehicle roster (measured)

Per faction: **Jeep** (Willys / Kübelwagen, 3 seats, 120 HP), **medium tank**
(M4 Sherman / Panzer IV, 2 seats, 180 HP), **fighter** (Spitfire / Bf 109, 3 seats, 190 HP),
**helicopter** (1 seat). Neutral: **AA gun** (1 seat, 250 HP), **boat** (marine maps).
All are faction-specific except the AA gun. Vehicles carry passengers; the original had
a plain chassis roster with no variant tiers.

---

## 4. Class × weapon-family matrix (current, simulator-validated)

| Class | Families |
|---|---|
| Soldier | SMG, Shotgun, Grenade Launcher, TNT |
| Gunner | MG, Grenade Launcher, Rocket Launcher |
| Commando | Shotgun, Rifle, Knife |
| Engineer | Pistol, Artillery, Field Kit |

Invariants asserted by `tools/simulate-design.py`: no class is a subset of another, no
family is dead, family counts 4/3/3/3, no two classes share more than one family, family
spread = 1.

Family origins: 8 original one-to-one (SMG, Pistol, Shotgun, MG, Rifle, Knife, Grenade
Launcher, TNT) · 1 split (Rocket Launcher — shipped 2009 under the GL category, not a new
family) · 2 genuinely new (Artillery, Field Kit).

---

## 5. Open design decisions

### 5.1 Leveling as power + "honor" PvP brackets — DEFERRED (2026-11-08)

Omar's direction, explicitly parked for the future:

- Leveling **can** be power, not only choice. This lets different levels have **different
  quests and different work**, and creates a vertical power axis alongside the horizontal one.
- **Honor** = the system restricting which levels may fight which levels (PvP brackets),
  and/or the PvP rank ladder. Precedent exists: WoW's old Honor rank system with
  battleground level brackets (10–19, 20–29, 30–39, 40–49, 50–59, 60) and rank-gated
  rewards; R6 Siege's Rank/Skill split with RP-based ladder and squad restrictions.

Not built yet. No design file written. Revisit when the vertical/horizontal balance is
actually needed.

### 5.1 Engine slice — BUILT AND VERIFIED (2026-11-08)

Omar: *"It looks like you've only done some front end stuff right now. That hasn't been
any time into game design how to implement the 3-D stuff and how to actually have a
lightweight playable game engine. I don't know what the stack will be, but you should
definitely learn from the website that I reference to you earlier."*

**The reference** was Ported2Browser / wasm.rip, from this project's earlier research.
The lessons that transferred:
1. **Native WASM in a browser, no plugin.** Every working port ships as WASM in a tab.
   The original needed a *downloadable plugin*, and Chrome pulled NPAPI in 2014 — that
   killed BFH's delivery mechanism while the game ran on it. We ship no plugin.
2. **Tick rate is the multiplayer contract.** Counter-Strike Surf runs a browser-native
   Source-style recreation with ranked servers at 66 tick. We run 30 Hz + 60 Hz substeps.
3. **The Emscripten route does not apply** — that pattern works because ports have
   existing C/C++ to compile. NEUTRALIA is original. The transferable half is the
   architecture: WASM-ready, plugin-free, static delivery.

**Built** (`engine/` in the repo, `systems/engine-stack.md` has the full decision):

| Layer | Choice | Version | Verified |
|---|---|---|---|
| Renderer | Three.js, WebGL2 first | 0.187.0 | bundlephobia + npm |
| Physics | Rapier 3D (deterministic build on server) | 0.21.0 | npm |
| Netcode | Colyseus | 0.18.12 | npm + docs |
| Transport | WebSocket now, WebTransport later | — | Safari 26.4 shipped WebTransport Mar 2026 |
| Assets | glTF + Meshopt + KTX2/ETC1S | — | 2026 benchmarks |
| Hosting | GitHub Pages (app) + R2 (assets) + VPS (server) | — | CF/GH docs |

**Measured:**
- **138 KB gzipped** total download (three 132.9 KB + app 4.7 KB + html 1.7 KB).
  BFH's own 2009 download was ~250 MB.
- Integration test **29/29** — two WebSocket clients, server owns positions,
  movement propagates, hitscan validated, cooldown enforced, death+respawn,
  shared movement module bit-identical.
- Browser render test **16/16** — real Chromium, real WebGL, canvas verified to
  contain rendered geometry, WASD movement confirmed, screenshots taken.
- Visual audit passed: real 3D, third-person camera, shadows, HUD legible.
- **Public URL verified:** HTTP 200 + WSS WELCOME through a Cloudflare quick tunnel.

**Trap found and fixed:** `cloudflared tunnel --url` loads `~/.cloudflared/config.yml`
by default, so its catch-all `http_status:404` ingress rule applied to the quick
tunnel — every request 404'd. A quick tunnel needs an explicit empty config
(`--config /tmp/quick-empty.yml`).

**Why not Unity/Godot:** Unity WebGL is 7.7–10.7 MB and Godot Web export ~5 MB for an
*empty* build. Our whole engine is 138 KB — an order of magnitude leaner, and the
single-threaded choice means no COOP/COEP headers needed, so GitHub Pages works with
zero header hacks.

**Next:** Rapier collision → Colyseus transport + lag compensation → real glTF map →
animated soldier → projectile weapon → vehicles.

### 5.2 Vehicle system — DESIGNED (2026-11-08)

Omar asked whether the original's small vehicle roster could grow, with **specialised
variants per chassis**. Answered: yes, and the model is **Battlefield 1's**, not BFH's.

**BFH measured baseline:** 6 chassis, **0 variants**. Jeep (3 seats, 120 HP, unarmed),
light tank (2 seats, 180 HP), fighter (3 seats, 190 HP), helicopter, AA gun (immobile,
250 HP), boat. Vehicles only at controlled points; 5 of 14 maps had no vehicles at all.
The Jeep was on 6 maps — the most ubiquitous chassis.

**Our system:** 7 player-selectable chassis × 20 variants + 1 map-only emplacement.
Scout car (Scout/Technical/Courier) · Armoured car NEW (APC/Carrier/Recovery) ·
Light tank (Javelin/Bulwark/Hunter) · Heavy tank NEW (Assault/Dug-in/Siege) ·
Fighter (Interceptor/Bomber/Liaison) · Helicopter (Transport/Gunship/Spotter) ·
Boat (Landing craft/Gunboat).

**Rules** (from BF2042's EA dev notes on their named failure modes — "the prevalence of
explosive weaponry, and unclear combat roles across vehicles"):
R1 transport carries no explosives · R2 one battlefield line per variant ·
R3 air does not ground-clear · R4 variant may reduce seats, never add ·
R5 variant chosen at spawn only · R6 anti-vehicle belongs to one chassis per domain ·
R7 ubiquitous chassis has the lowest ceiling.

**Variants earned by playing the chassis**, not by levelling — same trick as the
per-weapon skill tree.

**Armoured car is what makes the Engineer real** — the original had no Engineer class
and vehicle repair was a Gunner ability.

**Rules R8 and R9 (added 2026-11-08 after a second research pass):**
- **R8** — a variant must be *worse* than its chassis at something. From BF2042's
  Hovercraft postmortem (EA launch briefing): *"We designed this vehicle to behave as an
  alternative to the LATV4, but not as an upgrade"* — the community read it as a straight
  upgrade and EA cut its health in Update #2.
- **R9** — two variants you cannot tell apart in one sentence are the same variant. DICE
  on BF3: Fighter Jets and Attack Jets *"were both practically the same class, with few
  differences"* — fixed in BF4 by splitting Stealth Jets from Attack Jets with separate
  unlock trees.

**Simulator:** `sim_vehicle_matrix()` in `tools/simulate-design.py` asserts V1–V6 plus
R8 (every variant has a stated weakness; every chassis has a deliberately-crippled
variant), seat-economy and transport-share. It caught two real flaws on first run
(contested role lines; Scout car with no predator) — both fixed in the design, not in
the assertion.

**Prototype:** `prototype/vehicles.html` — 49 DOM checks, live-verified. The matrix is
chassis (rows) × battlefield-line (columns), so R2 is visible in the DOM: every cell
holds exactly one variant.

Docs: `systems/vehicle-system.md`, `research/05-vehicle-variant-precedent.md`,
`research/bfh_map_vehicles.json`.

---

## 6. Operational state (2026-11-08)

### Cron jobs — audited, all healthy

| ID | Name | Schedule | State |
|---|---|---|---|
| `dd5d41e24800` | Morgencheck: BasedNode + Hermes | `0 7 * * *` | ON → Discord |
| `b6a0ca13df80` | obsidian-vault-sync | `0 3 * * *` | ON |
| `059d461b109f` | Vector Memory Auto-Ingest | every 120m | ON → local |
| `c44bef575fa7` | GXU-påmindelse (elev) | `45 13 30 9 *` | ON |
| `777c04ec6541` | Pi sign-in investigation | once 2026-11-08 13:41 | ON |
| `a63f6726321f` | BFH-MMO idé (1/2) | was 09:00 today | completed, prompt corrected |
| `3543cbeb9a77` | BFH-MMO idé (2/2) | was 14:00 today | **PAUSED**, prompt corrected |
| `ca241ce969bc` | basednode-health-watch | `0 */12 * * *` | paused (pre-existing) |
| `ddd6ac437402` | basednode-watchdog | `0 7,19 * * *` | paused (pre-existing) |

Cron heartbeat confirmed live (24 s age at audit). Both script crons executed clean:
`obsidian-vault-sync.sh` exit 0, `basednode-watchdog.sh` exit 0, "All systems healthy".

### The 09:00 cron incident — root cause

The cron job `a63f6726321f` ("BFH-MMO idé 1/2") fired at 09:00 and its prompt asserted
*"prototypen er live på basednode.xyz/prototype/"*. The cron agent took that as an
instruction and, rather than just describing state, **created the deployment**: it made
`/home/omar/hjemmeside/prod/prototype` → `/var/www/bfh-prototype` and copied the prototype
there. The business domain was serving BFH content again from 09:03.

Fixed at 09:08: symlink + target removed, routing-proxy route deleted, both BFH cron
prompts rewritten to point at GitHub Pages and to carry an explicit hosting prohibition.
Both BFH jobs are now paused/completed; neither will re-fire on its own.

**Lesson recorded:** a cron prompt that *states* a deployment location can cause an agent
to *perform* it. Cron prompts must state the correct location and prohibit the wrong one.

### Business site

All routes 200 (`/`, `/index.html`, `/app.js`, `/i18n.js`, `/ecc-data.json`, `/about.html`,
`/cases.html`, `/contact.html`, `/privacy.html`, clean URLs `/about`, `/cases`, `/contact`,
`/privacy`). `/prototype/*` → 404. `routing-proxy` and `basednode-site` both online.

---

## 7. Verification ledger

| Date | Check | Result |
|---|---|---|
| 2026-11-08 | simulator `tools/simulate-design.py` | ALL CHECKS PASSED |
| 2026-11-08 | `classes.html` DOM suite, live URL | 53/53 |
| 2026-11-08 | `index.html` DOM suite, live URL | 39/39 |
| 2026-11-08 | Pages status | built |
| 2026-11-08 | business site route sweep | all 200 |
| 2026-11-08 | business domain prototype paths | all 404 |
| 2026-11-08 | cron heartbeat | 24 s old |
| 2026-11-08 | script crons executed | both exit 0 |
| 2026-11-08 | `vehicles.html` DOM suite, live URL | 44/44 → 49/49 after R8/R9 |
| 2026-11-08 | engine integration test (2 WS clients) | 29/29 |
| 2026-11-08 | engine browser render test (real WebGL) | 16/16 |
| 2026-11-08 | engine over public WSS tunnel | HTTP 200 + WELCOME received |
| 2026-11-08 | engine visual audit | pass — 3D geometry, camera, shadows, HUD |
| 2026-11-08 | vehicle visual audit, desktop + mobile | pass (R2 visible in the DOM matrix) |
| 2026-11-08 | business-domain prototype paths after cleanup | all 404 |
| 2026-11-08 | `routing-proxy.py` prototype route | removed, proxy restarted, site all 200 |

---

## 8. File map

```
GAME-DESIGN.md            master design
DEPLOY.md                 deploy procedure (GitHub Pages)
LEDGER.md                 this file — durable project state
FEASIBILITY.md            feasibility findings
Battlefield-Heroes-MMO.md project brief
systems/
  engine-stack.md         the 3D stack decision, with sources
  class-and-weapon-families.md
  weapon-specification.md
lore/
  third-faction.md
research/
  02-bfh-system-inventory.md
  02-weapon-roster.json
  04-class-weapon-family-exclusivity.md
  bfhinfo_items_detail.json
  map_*.txt
tools/
  simulate-design.py      progression + class-matrix simulator
  render-docs.py          markdown -> site HTML
engine/                    the playable slice
  shared/                 protocol, map, movement (imported by BOTH sides)
  server/index.js         authoritative server
  client/main.js          Three.js renderer + prediction
  test/slice.js           29 integration checks
  test/browser.cjs        16 browser render checks
prototype/
  classes.html            class x family matrix (53 checks)
  index.html              weapon spec tree (39 checks)
  vehicles.html           chassis x battlefield-line matrix (44 checks)
  test-classes.js
  test-prototype.js
  test-vehicles.js
```

---

## 9. Change log

- **2026-11-08** — BFH content removed from the business domain; moved to
  `IkkeOmar/neutralia` on GitHub Pages. Routing-proxy prototype route deleted.
- **2026-11-08** — 09:00 cron recreated the prototype on the business domain; root-caused,
  removed, and both BFH cron prompts rewritten + paused.
- **2026-11-08** — Vehicle system designed: 7 chassis x 20 variants, simulator-verified, prototype
  built and deployed (44/44 live checks). Armoured car + Heavy tank are new chassis.
- **2026-11-08** — Rules R8 + R9 added from a second research pass (BF2042 Hovercraft, BF3→BF4
  jet split). Both verified verbatim against primary EA/DICE sources, then encoded as
  simulator assertions and prototype DOM checks.
- **2026-11-08** — Pages build STATUS can be stale: the API reports `built` for the previous
  build while the new one queues. Poll on live CONTENT, never on status alone. Recorded in
  skill devops/deliverable-hosting.
- **2026-11-08** — Rocket Launcher reclassified as *split*, not new. Matrix re-cut.
- **2026-11-08** — ENGINE UPGRADED: Rapier 3D collision (deterministic build on the server,
  standard on the client — proven bit-identical over 400 steps), real glTF 2.0 map + animated
  skinned soldier (Meshopt, 33 KB), projectile weapons with explosive physics, and the
  **rocket jump** verified end to end in a browser (Panzerfaust apex ~9.7 m, Sticky TNT ~14 m,
  M32 MGL ~4 m). Ten real bugs found and fixed, each written up as a rule in the new skill
  `development/neutralia-multiplayer-engine`. Test suite grew to 98 checks across five suites
  (20 explosion + 29 integration + 16 assets + 16 browser + 17 rocket-jump). Client bundle
  138 KB → 1.85 MB gzip; Rapier is the whole increase. Colyseus 0.18 SDK installed but NOT yet
  wired — the raw WebSocket transport still runs, so lag compensation is the next gap.

- **2026-11-08** — SECOND BUG ROUND (5 more bugs, found by testing the rocket jump
  repeatedly rather than once): (1) the client's self-blast prediction was erased by
  reconciliation, because a blast impulse is not an input and the snapshot reset discarded
  it — the player launched and snapped back; (2) the projectile ray passed a direction vector
  60x too long, so Rapier's reported hit distance was 60x the real one and the rocket
  detonated mid-flight instead of at the ground; (3) a ray starting inside the shooter's own
  capsule reports a zero-length hit, which detonated the rocket at muzzle height — ABOVE the
  centre of mass — so the blast pushed sideways instead of up; (4) `removeCharacter` leaked the
  Rapier rigid body, collider and CharacterController, so orphaned capsules piled up at the
  spawn point and shoved new players around (this was the real cause of both the flaky rocket
  jump and a movement slowdown); (5) the rocket-jump test harness used plain HTTP and could
  not reach an HTTPS Cloudflare tunnel, reporting "server never came up". All five are now
  rules in the skill. Test suite 98 -> 115 checks across six suites; the rocket-jump suite is
  now 19/19 and passes 5/5 consecutive runs against a clean server. Live playable at
  `https://signature-retained-managing-replica.trycloudflare.com` (ephemeral quick tunnel).

- **2026-11-07** — class × weapon-family system written; simulator extended; prototype built.
