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
- `assets/`: generated pixel-art building sprites, a consistency-locked 12-frame protagonist sheet, six model-matted NPC idle sheets, and six transparent character CGs.
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
11. Use a segmentation model (`isnet-anime` or BiRefNet) for production alpha mattes; do not use color-threshold background removal.
12. Build animation frames from one consistent character master whenever possible; motion may change, identity pixels must not morph.

## Current gameplay

The player explores a 1000 × 3600 continuous tile-style pixel village made of three connected districts: South Wind Gate, Hanamori Central Square, and Riverside Shopping Street. A clearly marked cobblestone road links every district; the river has collision and a single walkable bridge. The protagonist has four-direction, three-frame walking animation at 280 px/s built from consistent master poses rather than cross-generation morphs. Six NPCs each have a three-frame idle loop, a four-line story, and a transparent full-body dialogue CG. The game intentionally has no background music or audio controls.
