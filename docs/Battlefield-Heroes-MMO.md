# Idé: Battlefield Heroes som MMO (WoW-struktur)

**Status:** Gemt idé — ikke igangværende projekt
**Dato:** 2026-11-07
**Omar**

## Kort fortalt

Gør Battlefield Heroes (2009, EA/DICE/Easy Studios) om til et MMO i World of Warcraft-stil:
persistent verden, faste klasser, servere, instanser, progression over måneder i stedet for
minutter. BFH's cartoon-look, browser-baserede tilgang og lette systemer er bevaret — det er
*spillet omkring* der ændres.

## Hvorfor BFH er et godt MMO-fundament

Originalen er bygget præcis til de ting et MMO har brug for:

- **3 klasser, 2 fraktioner** — Soldier (allround/medic), Gunner (tank, tung), Commando (stealth/sniper)
  → i et MMO: Soldier → Paladin-lignende tank/healer, Gunner → Berserker/Warrior, Commando → Rogue
- **Faction split (National Army / Royal Army)** → servere per faction, factionskrige, racial-flavour
- **Conquest-mode med 50 tickets** → i MMO: felt-objektiver (flags → capture points i felten)
- **Heltepoint / valorpoints / battlefunds** → fuld progression-økonomi: XP, gear-loot, kosmetik, subs
- **Klasser + abilities i 5 steps** → talenttræ, allerede levelsystemet
- **Kørsel: jeep, tank, fly** → mounts/craft, mount-battle, air-guerrilla
- **Browser-baseret, ~200MB, low-end PC** → kræver ingen stor client-installation

## WoW-strukturen der skal mappes på

| WoW-element | BFH-MMO-version |
|---|---|
| Verden ( Azeroth ) | ét stort felt med 2 fraktions-baser, permanent |
| Faction/race | National Army vs Royal Army |
| Class | Soldier / Gunner / Commando |
| Level 1–60 | Hero points, fortsat til max (orig. cap 30) |
| Talent tree | Abilities i 5 steps, klassespecifikke |
| Dungeon | Instanser: base (tank/jeep), hangar (fly), by-raid (multi-boss) |
| Raid | Conquest: 50v50 "flag raid" på stor bane |
| Quest / Daily | Missions + valor points |
| Reputation | Faction standing (National vs Royal) |
| Gear | Weapons, widgets, clothing i store |
| Guild | Armé / klan, 10-25 spillere |
| Mount | Køretøjer som mounts |
| Gold farm | Valor points → hvide markeder, basar |
| Battleground | Ranked conquest, 2 fraktioner |
| Housing | Base-bunker, flags i feltet |

## Udfordringer der kræver en løsning

1. **Originalens balance er lav-niveau** — levels 1–30 med 5 abilitet-steps er for fladt til et
   MMO. Kræver gendesign af XP-kurve, talenttræ og stat-skala.
2. **Mobb-camping erstatter spawn** — BFH-genstartede ved capturede flags. MMO kræver
   permanent befolkede områder (instanser, camps, feltboss).
3. **Conquest-ticket-system passer ikke 1v1-støt** — tickets = 50 lives er ubrugeligt i et
   50v50-stormangreb.
4. **Browser-engine** — hvis web-buildet bevares, kræver det en anden renderer end Refractor 2.
   Alternativt: beholde looket, skifte engine til Unity/Unreal, beholde browser-klienten som thin client.
5. **To sider af samme mønt** — originalen er free-to-play med ads. Et MMO kræver
   abonnement eller robust cosmetics-økonomi. Battlefunds = allerede prototypen på det.
6. **Servere** — kræver backend der ikke eksisterer i browser-spillet: persistent karakter,
   inventory, mail, guild, auction house.

## Alternativer hvis scopeet er for stort

**A. "Battlefield Heroes: Campaign+"** — behold browser-spillet, tilføj permanent verdensbevarelse
   med en stor fælles front og 100+ spillere fordelt i zoner. 20% af arbejdet, 60% af effekten.

**B. Class-based MMO-lite** — drop feltet, gør det til instans-baseret (WoW-instans-stil) med de 3
   klasser, 2 fraktioner og abilities i 5 steps. Lille scope, nemmere at balance.

**C. Fuld MMO** — det her dokument. År, ikke måneder.

## Kendte designs at læne sig op ad

- **Team Deathmatch / HotH / CTF / Team Elimination** — BFH's faktiske modes, brugbare som
  instans-typer
- **TF2 / Planetside 2** — persistent faction-servere, klasse-komposition, "unsung hero"-balance
- **DC Universe Online / Warhammer Online** — browser-startende MMO'er der faktisk kom i live
- **EVE Online** — persistent økonomi og player-driven marked som udgangspunkt for base-game

## Kilder

- Wikipedia: Battlefield Heroes (DICE/Easy Studios, EA, 25. juni 2009, Refractor 2)
- MobyGames: Battlefield Heroes — classes, factions, hero/valor/battlefund-point, køretøjer
- Gamespot hands-on (2008): browser-klient, 16-spillers baner, 50+ våben, 4 widgets
- bfh-info.cs-heroes.cz: modes (TDM, HotH, CTF, Team Elimination)
