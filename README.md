# Hanamori Village

Mobile-first pixel-art narrative village built with Phaser 4.2.1.

## Play locally

```bash
docker compose up -d --build
open http://localhost:8088
```

Move by pressing anywhere on the map and dragging. Approach a villager and tap **對話** to start their story.

## Verify

```bash
node --check game.js
python3 -m unittest tests/test_app.py -v
```

## Documentation discipline

- Update `CLAUDE.md` when architecture, commands, or engineering conventions change.
- Update `DESIGN.md` when visual tokens, art direction, controls, layout, or dialogue presentation change.
- CI runs the game contracts on every push.
