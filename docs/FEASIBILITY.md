# FEASIBILITY REPORT — Battlefield Heroes MMO

Date: 2026-11-07
Method: `creativity` skill, Gate 0–3. Research only — nothing built.

---

## PREMISE

> "Battlefield Heroes is already open sourced and playable online (RisingHub), so we can clone
> and copy the game and build an MMO out of it."

## VERDICT

**PARTIALLY TRUE — and the true part is not the part the plan depends on.**

- The **game client is NOT open source.** It has never been open-sourced. EA's assets
  (models, textures, audio, animation) are likewise closed.
- The **backend protocol IS open.** The FESL/Theater/GameSpy stack has multiple working
  open-source reimplementations. These are the reusable, legally clean foundation.
- **RisingHub is a running private server, not a source tree.** It runs the original
  closed client with a patched backend. It proves the protocol is reimplementable; it does
  not give us a codebase to fork.

So the project is **not** "clone and extend". It is **"reimplement the backend, and build
new art, new engine, new content"** — or **"build a new game that shares BFH's design
DNA"**. The second framing is where the MMO actually lives.

---

## EVIDENCE

### Gate 0 — What is actually open

Verified live via GitHub API on 2026-11-07 (not from blog posts):

| Repository | Language | License (API) | Last push | Stars |
|---|---|---|---|---|
| `abarichello/bfheroesFesl` | Go | **The Unlicense** (public domain) | 2018-10-01 | 5 |
| `lucasluqui/bfheroes-offline` | Python | **none declared** | 2025-08-07 | 16 |
| `g91/BFHeroes_MasterServer` | Python | **GPL-3.0** | 2018-07-27 | 8 |
| `bfhz/battlefieldHeroesBackend` | Go | — | **repo now 404s** | — |

Notes that matter:

- `bfhz/battlefieldHeroesBackend` was **deleted or renamed**. Its README is still
  reachable via cached web pages, but the repository itself is gone. Any plan citing it
  must cite the surviving forks instead.
- The **Unlicense** on `bfheroesFesl` is the cleanest asset here: public domain, no
  attribution obligation, no copyleft. It credits Aluigi, TechnoGods, the1domo and
  piquus in its README — attribution is good practice even when not required.
- `lucasluqui/bfheroes-offline` has **no license file**. That is legally ambiguous: without
  an explicit grant, default copyright applies and the code is not ours to reuse. Treat as
  **read-only reference**.
- `g91/BFHeroes_MasterServer` is **GPL-3.0** — any derivative work must be GPL-3.0. If we
  ever ship a server, that license governs it. Fine for a project, relevant for a
  commercial one.
- `lucasluqui/bfheroes-offline` was pushed **2025-08-07** — under a year old. The offline
  emulator is alive; the multiplayer server emulators have not been touched since 2018.

### Gate 0 — The protocol layer, in detail

BFH uses the **GameSpy protocol family** (also in BF2/BF2142/NFS), structured as five
components:

1. **gameClient.exe** — front-end, runs on the player's machine. Closed.
2. **gameServer.exe** — per-match coordinator, hosts the shared match area. Open
   reimplementation exists (`bfheroesFesl`).
3. **FESL login server** — authentication, account, stats. Open reimplementations exist.
4. **Theater server** — player/server data, matchmaking, ranking, levelling, server
   bookmarks. Open reimplementations exist.
5. **Magma** — HTTP/XML API for login, validation, `web_token` sessions, store,
   entitlements, friends, server bookmarks. Open reimplementation exists.

Fixed ports in the `bfheroesFesl` config (these are the ground truth the emulators are
validated against, and they match the original `Readme.txt` inside the game files):

| Purpose | Port |
|---|---|
| FESL client | 18270 |
| FESL server | 18051 |
| Theater client | 18275 |
| Theater server | 18056 |
| HTTP bind | 8080 |
| HTTPS bind | 443 |
| LevelDB | `_data/lvl.db` |

UDP packets are encoded with the **GameSpy XOR** scheme. The original `Readme.txt` shipped
with the game lists these ports — that is our golden reference for verifying any
reimplementation.

### Gate 0 — RisingHub's actual status

RisingHub (risinghub.net) is a **live private server**: a launcher (`DarkLauncher.exe`)
fetches the original client, patches it, and points it at RisingHub's own backend. The
site is live and shipping content as of 2026 (recent updates include Atomic Avenue, new
t-shirts, Moonwalk Emote, a "Demon of Chaos" gene fix).

What this means for us:
- The **game is alive and playable** — correct, and a good sign for community interest.
- The **client is unobtainable-as-source** — correct, we have a binary, not a repo.
- **Private servers are a legal grey area** and their assets are not ours. Do not depend
  on RisingHub for anything; do not mirror its assets.

### Gate 0 — Other live projects (2026)

- A **solo Unity3D rebuild** is in active development (r/BattlefieldHeroes, Sept 2026) —
  described as "the most promising BFH project yet".
- A **1.126 client-fix project** (r/BattlefieldHeroes, Sept 2026) by a 15–20-year private
  server developer. He reports a working client with store, settings, customisation,
  friends, server browsing, fixed protocol handlers, character data and multiplayer
  replication. He asks whether to make it public if a playerbase exists.
- **Older:** the "Open Heroes" project and the Phoenix Network fork, both largely dormant
  since ~2018.

**These are the highest-value leads.** The 1.126 project in particular is someone who has
already done the hardest part (a working patched client). Whether to approach him is a
decision for Omar, not a technical question.

### Gate 1 — Toolchain on this host

| Tool | Status | Notes |
|---|---|---|
| **REA MCP** (`Reverse Engineer Anything`) | **LIVE** | `mcp__rea__*` tools respond. Verified: `mcp__rea__list_documents` returns `target_unavailable` ("No app is open"), proving the server is connected. npm latest: **6.8.0** |
| REA skill | **indexed but not loadable** | `skill_view('reverse-engineer-anything')` fails. Check `~/.hermes/skills-archive/<cat>/<name>/SKILL.md` directly instead |
| Ghidra / Hopper / IDA | not verified | REA supports them; needs a native-analysis provider present |
| DeepSeek API | **LIVE** | `deepseek-flash`, `deepseek-v4-pro` reachable. Delegation pinned to `deepseek-v4-pro` for this session's generation work |
| Wine | not verified | Would be needed to run the Windows client at all |

**REA's documented capability set** (from the project README, v6.x): JavaScript/Electron
apps, native binaries, .NET assemblies, websites, Android APKs — with Ghidra/IDA/Hopper,
JADX/apktool/adb, Chrome DevTools/mitmproxy, Frida/Binwrap.

**Critical caveat from the REA project's own documentation:** recovered code is *not*
original source. Native decompilation yields pseudocode and assembly — no comments, no
original naming, no original build system. A reconstruction still needs review and tests.

**The realistic REA use here is not "clone the game."** It is:
- inspect `gameClient.exe` to map the class/ability/weapon data structures
- confirm what the client sends to the backend vs what the backend computes
- validate our reimplementation against the real client's expectations

### Gate 2 — The minimum running slice

**One map. One mode. One class. One weapon. One vehicle. Running end-to-end against our own
backend.**

That is: a Go process that speaks FESL + Theater + Magma, serving a single battle on
*Alpine Assault* with the Soldier class, the StG 44, and a jeep, where two clients (ours or
a patched original) log in, spawn, capture a flag, and the match resolves.

**Why this and not something smaller:** the entire risk of the project lives in the
protocol seam. A lobby that works but a match that does not proves nothing. Conversely, one
match that works proves the whole stack.

**Why this and not something bigger:** it is achievable on 3 vCPU / 3.7 GB RAM, it is
verifiable against the original `Readme.txt` port list, and it is the smallest artifact that
makes "the rest of the project is obviously possible" true.

**What it does NOT prove:** art pipeline, content volume, persistence at scale, netcode
under 50 players, and anything about the MMO layer. Those come after.

### Gate 3 — Real scope

The line, stated plainly:

| Layer | Status | Cost |
|---|---|---|
| Backend protocol (FESL/Theater/Magma/Match) | **Open, reusable, legal** | Weeks to get right |
| Original client binary | Closed, Windows-only, EULA-restricted | Not distributable |
| Original assets (models/textures/audio) | Closed | Not usable in a new game |
| MMO layer (persistent chars, inventory, mail, guild, AH, matchmaking) | **Must be written** | Months |
| Art direction | **Must be produced** | The real cost |
| Content volume (maps, weapons, quests) | **Must be produced** | The other real cost |

**The honest reframe:** we are not extending Battlefield Heroes. We are building a new game
that uses an open network protocol and borrows a design language. The BFH codebase is worth
maybe 2–4 weeks of reading. The game is worth 1–3 years.

**This does not kill the idea — it clarifies it.** Two viable readings:

**(A) Protocol-first.** Build our own backend + client on top of the open FESL stack, ship
a modern lightweight client, keep BFH's cartoon WWII look and class structure. Most
interesting, most work.

**(B) Design-first (recommended starting point).** Forget the protocol. Build the *game
design* — weapon trees, Doctrine system, quest structure, lore — as a documented,
playable-in-browser prototype using modern tech. The design is the hard intellectual
problem, and it is where Omar's actual creative energy is.

---

## LINE

**Reusable as-is:** the FESL/Theater/Magma protocol layer and its open implementations
(Unlicense + GPL-3.0, both readable and one directly reusable).

**Must be built:** the MMO layer, the client, all art, all content, and — if we go
protocol-first — the client-side rendering.

**Cannot be used:** EA's client binary and EA's assets, for legal reasons, not technical
ones. This is a hard line, and it does not move with scale.

---

## MINIMUM SLICE

> A Go backend speaking FESL + Theater + Magma, running one Conquest match on *Alpine
> Assault* with Soldier / StG 44 / jeep, where two clients authenticate, spawn, fight over
> one flag, and the match resolves — with the port configuration matching the original
> `Readme.txt` and the packet encoding validated against the GameSpy XOR scheme.

**Do not build this yet.** It is the destination for the feasibility phase, not a task to
start on.

---

## LEGAL NOTE (not a footnote — a gate)

| Activity | Status |
|---|---|
| Reimplementing the FESL/Theater protocol | **Interoperability.** Fine. The existing emulators do exactly this. |
| Reading and citing the open emulators | **Fine.** Mind the licenses: Unlicense is clean, GPL-3.0 is copyleft, `bfheroes-offline` has no license grant — read-only reference only. |
| Running the original client locally for research | Legal grey. Personal research, no distribution. |
| Shipping EA's client or assets in a new game | **Not permissible.** Copyright. |
| Building on RisingHub | **Not permissible.** Private-server assets, no license. |
| Using BFH's *lore* (factions, names, the war premise) | **Grey.** Character names and specific story elements can be protected. Faction structure and general WWII-parody premise are far safer. Our lore draft deliberately reframes rather than copies. |

---

## OPEN QUESTIONS

1. **Approach — (A) protocol-first or (B) design-first?** Recommendation: (B). The design is
   the intellectual core; the protocol is a solvable engineering problem that a subagent can
   grind on while Omar does the creative work.
2. **The 1.126 project author.** A working patched client is the single biggest
   accelerant available. Does Omar want to be approached? (Also: he asked the Reddit
   whether to publish. Someone might answer.)
3. **Client distribution.** If protocol-first, do we ship our own client (lightweight, modern)
   or rely on a patched original? The former is legally clean and lets us hit the
   "super lightweight" target.
4. **Scope of the original lore.** How far do we stay recognisably BFH? The Neutralia
   reframe keeps the factions and the war but replaces the antagonist — this may be the
   right line, or too far.
5. **Engine.** For (B), a browser-based prototype (no install, matches BFH's heritage and
   the "super lightweight" goal) versus a native client. For (A), the client is a larger
   question entirely.

---

## WHAT WAS NOT DONE (and why)

- **No game binaries downloaded or run.** The client is Windows-only and closed; running it
  here needs Wine plus the full stack, and produces no reusable artifact. Server
  emulators were *read*, not stood up — they need a real client to talk to, and this host
  has 3.7 GB RAM with no GPU.
- **No code written.** This was a feasibility pass, per the explicit instruction.
- **The design documents are documentation**, not a build: `GAME-DESIGN.md`,
  `systems/weapon-specification.md`, `lore/third-faction.md`.
