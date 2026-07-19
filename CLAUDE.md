# CLAUDE.md

## Project

Hanamori Village is a mobile-first pixel-art narrative game built with Phaser 4.2.1 and deployed as a static site through GitHub Pages.

## Commands

```bash
python3 -m unittest tests/test_app.py -v
node --check game.js
python3 -m http.server 8088
```

## Architecture

- `index.html`: game shell and accessible DOM dialogue overlays.
- `game.js`: Phaser scene, world rendering, Arcade Physics, camera, touch input, and story state.
- `style.css`: iPhone-first fullscreen UI and visual-novel overlay.
- `assets/`: generated pixel-art textures, portraits, transparent character CGs, and three original BGM tracks under `assets/bgm/`.
- `vendor/phaser.min.js`: pinned Phaser 4.2.1 runtime for offline/reliable deployment.
- `.github/workflows/ci.yml`: verifies every change and deploys `main` to GitHub Pages.
- `tests/test_app.py`: static behavioral contracts.

## Rules

1. Target iPhone portrait viewports first; verify at 390 × 844 before shipping.
2. Preserve full-screen map rendering and touch-anywhere virtual movement.
3. Use Phaser cameras and Arcade Physics; do not reintroduce a hand-written canvas engine.
4. Character CG PNGs must have transparent backgrounds so the paused map remains visible.
5. Keep pixel-art objects aligned to integer coordinates and retain `pixelArt: true`.
6. Add or update a failing test before changing game behavior.
7. Run all commands above before committing.
8. Update this file whenever commands, architecture, or project conventions change.
9. Update `DESIGN.md` whenever colors, typography, spacing, controls, character scale, art direction, or dialogue presentation changes.
10. Keep generated assets in `assets/`; record their purpose in the commit message.

## Current gameplay

The player explores a 1200 × 1800 HD-2D village generated as a detailed diorama background, with a smooth following camera, collision against houses, 280 px/s touch-anywhere movement, four transparent pixel-character sprites, three NPCs, and four-line visual-novel conversations with transparent full-body CGs. Original BGM selects day or twilight music by local time, switches to a quieter dialogue theme during stories, and starts only after a user gesture for iPhone compatibility.
