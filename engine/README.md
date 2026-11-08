# NEUTRALIA engine

A lightweight, browser-based 3D third-person shooter in the lineage of Battlefield
Heroes (2009). Original game — not a port.

**This is the engine slice.** It is a vertical slice that proves the stack end to end,
not a finished game.

## What works right now

- Authoritative server over WebSocket: the server owns positions, health and hit
  detection. Clients send intent only.
- Three.js third-person renderer with pointer lock, shadows, and a grey-box map.
- Client-side prediction with reconciliation against the server snapshot.
- Shared movement module imported by **both** client and server, so prediction and
  authority can never diverge. The test asserts bit-identical agreement.
- Server-validated hitscan with a fire-rate cooldown, death and respawn.

## Measured

| | |
|---|---|
| Gzipped download | **138 KB** (whole engine, no assets) |
| Server tick | 30 Hz |
| Integration test | 29/29 |
| Browser render test | 16/16 |

BFH's own 2009 download was ~250 MB. This is 138 KB.

## Run it

```bash
npm install
npm run build        # vite build -> client/dist
npm run serve        # authoritative server on :8787
# open http://127.0.0.1:8787/
```

## Test it

```bash
npm test                          # 29 integration checks (headless, two clients)
node test/browser.cjs http://127.0.0.1:8787/   # 16 render checks (real Chromium)
```

## Point the client at a different server

The static client accepts a `server` query parameter:

```
https://your-static-host/index.html?server=wss://your-game-host
```

Same-origin (server serves the client) is the default.

## Layout

```
shared/protocol.js   tuning constants + wire message types
shared/map.js        grey-box map — imported by BOTH client and server
shared/movement.js   kinematic movement + collision — imported by BOTH
server/index.js      authoritative server
client/main.js       Three.js renderer, prediction, interpolation
test/slice.js        integration test
test/browser.cjs     browser render test
```

## Design documents

- `../systems/engine-stack.md` — the stack decision, with sources
- `../systems/vehicle-system.md` — the chassis x variant system
- `../GAME-DESIGN.md` — the master design document

## Roadmap

1. Rapier for collision (capsule controller, step height, slopes)
2. Colyseus for the transport, with server-side lag compensation
3. A real glTF map (Meshopt-compressed)
4. A soldier model with animation (Meshopt + ETC1S/KTX2)
5. A projectile weapon to exercise the non-hitscan path
6. Vehicles — kinematic bodies with a vehicle controller
