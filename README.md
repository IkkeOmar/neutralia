# NEUTRALIA — interactive design prototypes

Public site for the Battlefield Heroes MMO design work (working title: NEUTRALIA).

- `index.html` — landing page
- `prototype/classes.html` — class x weapon-family system
- `prototype/index.html` — weapon specialisation tree
- `docs/*.html` — rendered design documents (sources are the `.md` beside them)
- `tools/simulate-design.py` — progression/design simulator
- `tools/render-docs.py` — markdown -> HTML renderer
- `research/` — scraped primary sources + research reports

Design docs live in the private `bfh-mmo` repository; this repo carries the public
rendering of them plus the interactive prototypes.

## Verify

```bash
python3 tools/simulate-design.py   # ALL CHECKS PASSED
NODE_PATH=<path-to>/node_modules node prototype/test-classes.js http://127.0.0.1:PORT/prototype/classes.html
```
