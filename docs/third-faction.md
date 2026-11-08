# Lore — The Third Faction and the Structure of the War

Companion to `GAME-DESIGN.md`. Built on the original game's own canon, verified against
battlefield.fandom.com in `research/`.

---

## 1. What the original actually established

The canon facts we are building on:

- **Setting:** parody of 1930s Europe. War declared by the Royals on **Tuesday, 25 August 1936**.
- **The trigger:** during the Olympics, the Royal Nation accused the National Homeland of
  cheating in a track-cycling contest. The Nationals responded by mocking the Royal King's
  moustache. The Royals declared war.
- **Royal Kingdom** — France, United Benelux, Switzerland, Tirol-Austria, Czechia, West
  Germany. Capital Paris.
- **National Federation** — Slovenia, Hungary, Slovakia, Czechia, East Germany, Poland,
  Belarus, Ukraine. Capital Kyiv. (Note: Czechia is claimed by both — a deliberate
  ambiguity in the original that this design leans into.)
- **The metagame:** 28 campaigns fought. **22 National victories, 5 Royal victories, 1
  inconclusive.** The Nationals won overwhelmingly, yet the Royals declared the war and
  held it for 79 years.
- **The truce:** when EA shut the game in July 2015, the lore revealed the war had ended in
  a truce. The shutdown *was* the peace.

This is the single most important fact in the design space: the war is a **truce**, not a
victory. Both nations survived.

---

## 2. The third faction: Neutralia

### 2.1 The premise

**Neutralia** signed neither the Royal Pact nor the National Compact. It supplied arms to
both, lent money to both, and mediated both. For 79 years it profited from a war it never
fought.

The war was never between France and Ukraine. It was between two proxies of a third party
who wanted the continent split enough that neither side could industrialise its own heavy
industry without orders.

### 2.2 Why this reads as true to the original

The original's own content already contains the third faction, and never explains it:

- **Summer of Heroes (May 2011)** — both armies recruit "extraordinary heroes" worldwide.
  Pirates answer first, then superheroes who crashed to Earth with super-speed and
  super-jump, then wizards with telekinesis. Meanwhile tribes in the north fight their own
  war until a National supply crate lands between them; they fight over a rocket launcher,
  it misfires, and a Royal supply drop crushes the survivor. Both tribes join the wider
  war with the fresh ordnance.
- **Heroes of Halloween (October 2011)** — an Anubis statue fractures in a National port.
  Anubis frees itself, shrouds the area in green mist, and converts National soldiers into
  servants. A similar statue wakes a Pharaoh. Both then take control of Royal and National
  soldiers alike, turning them into minions.

Read one way, these are seasonal carnival events. Read another way, they are a catalogue of
Neutralia's products and experiments — supernatural capabilities delivered to both sides
equally, with the attendant chaos of two armies using the same "extraordinary hero"
catalogue against each other. The third faction was already in the game. It just had no
name.

### 2.3 Structure

| | National Army | Royal Army | Neutralia |
|---|---|---|---|
| **Nature** | Grassroots federation | Institutional kingdom | Corporate state |
| **Members** | Slovenia, Hungary, Slovakia, Czechia, East Germany, Poland, Belarus, Ukraine | France, Benelux, Switzerland, Tirol-Austria, Czechia, West Germany | Unaligned, transnational |
| **Capital** | Kyiv | Paris | Geneva (later) |
| **Doctrine** | Improvised, mobile, anti-hierarchy | Professional, entrenched, chain of command | Contractual — sells to everyone |
| **Economic base** | Grain, industry, manpower | Finance, administration, legitimacy | Arms, credit, "extraordinary heroes" |
| **War aim** | Survive and win outright | Survive and win outright | Keep them both surviving and divided |

**Neutralia's neutrality is the joke and the trap.** It is not a peacekeeping force; it is
the only party for whom the war continuing is a commercial success. Its Contracts system
(§3, Track 1) is the gameplay expression of this: you do Neutralia's work for neutral
money, while your own faction's war effort ticks down.

### 2.4 What Neutralia wants

The endgame cannot be "defeat the third faction" without a twist, or it is just a raid tier.

Neutralia's aim is **managed coexistence**: a permanent two-sided proxy conflict that keeps
the continent dependent. It is the arms dealer that needs the war.

This creates the sharpest endgame problem in the design: the factions' war effort meter and
Neutralia's Contracts economy are in direct opposition. A player can win the season by
serving the antagonist.

**Resolution option (recommended, needs Omar's call):** a seasonal world event where the
Contract track and the War Effort track converge — the war crosses the threshold that
forces Neutralia to commit openly, and both factions get a window to either finish the war
or accept the truce and inherit Neutralia's portfolio. Two endings, chosen by the players,
not by the developers.

---

## 3. Quest structure

Three tracks, deliberately layered so a player always has something to do at any level, and
each track teaches a different system.

### 3.1 Track 1 — Contracts (repeatable, daily, Neutralia-sourced)

Neutralia hires both sides. Neutral currency + Neutralia reputation in exchange for
objectives that are **communal, not factional**:

- Hold *Valley* for 8 minutes
- Destroy 40 structures
- Escort a convoy from A to B
- Reduce the enemy flag count to zero
- Collect 5 supply crates from neutral ground

**Why communal:** a Contract must be completable by either faction, otherwise it is a
faction quest wearing a contract's clothes. Communal objectives also mean National and
Royal players can complete the same Contract together — the first mechanic that puts the
two factions on the same side of an objective without a special event.

**The tension:** Contracts advance your *Neutralia* standing and count *against* your
faction's war effort. This is deliberate friction. A player must ask: do I want the neutral
money and the doctrine it unlocks, or the faction contribution my general is counting on?

**Reward:** Neutral currency (buyable only in Neutralia's store, which sells cosmetics and
doctrine *variants*, never power) + Doctrine unlocks + the "Contract" title track.

### 3.2 Track 2 — Commendations (tutorializing, persistent)

The original's "missions" (up to three active, achievement-style: *kill five enemies in a row
without dying*) become a permanent tracked series of 40+ Commendations. Each teaches one
mechanic and unlocks one Doctrine on completion.

| Commendation | Teaches | Unlocks |
|---|---|---|
| *Five in a Row* | suppressing fire, combo tracking | *Focus* doctrine |
| *Field Promotion* | the token economy | *Overcharge* doctrine |
| *Wheels* | vehicle entry and crew roles | *Motor Pool* doctrine |
| *Nothing Personal* | do not kill the same enemy twice in a life | *Conscience* doctrine |
| *Both Sides* | complete a Contract with an enemy player on the same team | *Diplomat* doctrine |

This is how complex systems get taught without a tutorial that lies or a wall of text. A
Doctrine is a reward for understanding something.

### 3.3 Track 3 — War Effort (faction, world-scale)

The original's 28-campaign metagame, rebuilt as a persistent regional war.

- **Territory map:** the two factions' claimed territories (from the original's metagame
  map) as a shared, persistent board. Each week, campaigns are fought for control of a
  territory. Both factions fight *for* their own territory — a National player pushes
  north-east, a Royal player pushes south-west — and the map visibly changes.
- **Shared conflict meter:** beyond territory, a per-season **world meter** tracks total
  war activity. When it crosses thresholds, Neutralia responds: escalating supplies, then
  an "extraordinary hero" deployment (a Summer-of-Heroes-style event), then open
  intervention.
- **Cadence:** ~8 weeks per season. Each season ends with a truce (of course) — the next
  season starts from the new border.

**Why seasonal truces:** the original's own ending was a truce. Making truces the
*structure* rather than the *ending* means the world's borders are player-made history,
and each season has a genuine beginning and end.

### 3.4 Instanced content

Vocabulary taken directly from the original's maps and vehicles:

| Instance type | Original basis | Content |
|---|---|---|
| **Bunker** | Base / emplacement maps | 4–6 player, objective-based, faction-locked |
| **Hangar** | Airfield maps, fighter planes | 6–8 player, vehicle-heavy, escort/defend |
| **Town raid** | Urban conquest maps | 10 player, multi-phase, boss = a named commander |
| **Convoy** | Jeep-route maps | 3–5 player, escort with pursuers, no revives |

Bosses are **named commanders of the opposing faction** — not monsters. This preserves the
cartoon-military tone and makes faction identity meaningful in PvE.

---

## 4. Player-facing lore fragments

Fragments, not exposition. Distributed through Commendations, Contracts, item descriptions,
and idle dialogue at faction hubs.

**On the Olympic incident.** Both factions' official histories claim victory in the
track-cycling race. Neither history includes a photograph. Neutralia's official history of
the race is a single line: *"the outcome was recorded."*

**On the Kings' moustache.** The mock was not about the moustache. The Nationals were
laughing because the Royal delegation had been photographed arriving late, and the Royal
propaganda office had already published a photograph of an earlier arrival. The insult
became a casus belli because both nations had spent two years manufacturing the kind of
incident that could justify one.

**On the truce.** Both armies were told the war had ended. Both armies were told by the
same people who had supplied the weapons.

**On Czechia.** It is claimed by both factions in every official document. Both claims are
genuine. Neutralia has never commented. This is the seed of the endgame.

**On the "extraordinary heroes".** Every hero who arrives with super-speed, super-jump, or
telekinesis arrived from the same place, through the same contract, with the same
paperwork. Neutralia's recruitment form has one field: *Preferred billing*.

---

## 5. Open lore questions for Omar

1. **Continuity or restart?** Continue from the 1936 war and the truce, or set the MMO in a
   new era where the war has already happened and the MMO is about its consequences?
   Continuing is cheaper to write and more satisfying to original players; restarting lets
   us invent a cleaner map. My recommendation: **continue**, and treat the season-1 truce
   as the thing that broke the illusion.
2. **Neutralia's reveal timing.** Immediate reveal (players know from day one who the
   antagonist is) or slow reveal (discovered through Contract anomalies)? Slow reveal
   supports the "both sides are complicit" theme better; immediate reveal is clearer.
3. **Is the third faction playable?** A Neutralia faction is mechanically interesting
   (soldiers-for-hire, no home territory) but risks a third faction being a worse
   experience for the other two. My recommendation: **not a faction** — a vendor and
   employer, plus an endgame presence.
4. **Does the war need a side to win?** A persistent world with player-moved borders is
   more interesting than a winner-take-all war, but it needs a reason for anyone to care
   about a border at all.
