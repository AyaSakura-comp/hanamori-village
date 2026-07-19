# Hanamori Village

Mobile-first pixel-art narrative village built with Phaser 4.2.1.

## Play

GitHub Pages: <https://ayasakura-comp.github.io/hanamori-village/>

For local preview:

```bash
python3 -m http.server 8088
open http://localhost:8088
```

Move by pressing anywhere on the map and dragging. Follow the pale cobblestone road through South Wind Gate, Hanamori Central Square, and Riverside Shopping Street. The protagonist animates in four directions; the river can only be crossed at the central bridge. Approach a villager and tap **對話** to start their story.

## Verify

```bash
node --check game.js
python3 -m unittest tests/test_app.py -v
```

## Documentation discipline

- Update `CLAUDE.md` when architecture, commands, or engineering conventions change.
- Update `DESIGN.md` when visual tokens, art direction, controls, layout, or dialogue presentation change.
- CI runs the game contracts and deploys the static site to GitHub Pages on every push to `main`.
