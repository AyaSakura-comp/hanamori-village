# Hanamori Village

Mobile-first 3D-ground + pixel-billboard fantasy-town narrative game built with Babylon.js.

## Play

GitHub Pages: <https://ayasakura-comp.github.io/hanamori-village/>

For local preview:

```bash
python3 -m http.server 8088
open http://localhost:8088
```

Move by pressing anywhere on the map and dragging. Follow the detailed cobblestone streets through South Wind Gate, Hanamori Central Square, and Riverside Shopping Street. Explore eleven distinct fantasy landmarks—including a guild, magic shop, alchemist, smithy, tavern, chapel, clocktower, and market—layered with cinematic shadows, foreground depth, warm haze, and reflective river details. The protagonist animates in four directions; the river can only be crossed at the central bridge. Approach a villager and tap **對話** to start their story.

## Verify

```bash
node --check game.js
python3 -m unittest tests/test_app.py -v
```

## Material source

- Medieval street PBR: [Poly Haven — Cobblestone Floor 001](https://polyhaven.com/a/cobblestone_floor_001), CC0 by Rob Tuytel. The 1K albedo, OpenGL normal, roughness, and extracted AO channel are hosted locally.

## Documentation discipline

- Update `CLAUDE.md` when architecture, commands, or engineering conventions change.
- Update `DESIGN.md` when visual tokens, art direction, controls, layout, or dialogue presentation change.
- CI runs the game contracts and deploys the static site to GitHub Pages on every push to `main`.
