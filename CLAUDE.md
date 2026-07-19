# CLAUDE.md

## Project

Hanamori Village is a mobile-first 3D-ground and pixel-billboard narrative game built with Babylon.js and deployed as a static site through GitHub Pages.

## Commands

```bash
python3 -m unittest tests/test_app.py -v
node --check game.js
python3 -m http.server 8088
```

## Architecture

- `index.html`: game shell and accessible DOM dialogue overlays.
- `game.js`: Babylon.js scene, 3D X/Z world, mesh collisions, orthographic camera, touch input, and story state.
- `style.css`: iPhone-first fullscreen UI and visual-novel overlay.
- `assets/`: eleven BiRefNet-matted HD-2D fantasy buildings in `assets/buildings/`, a consistency-locked 12-frame protagonist sheet, six model-matted NPC idle sheets, and six transparent character CGs.
- `vendor/babylon.js`: locally hosted Babylon.js runtime for offline/reliable deployment.
- `.github/workflows/ci.yml`: verifies every change and deploys `main` to GitHub Pages.
- Keep the production host as static GitHub Pages; do not add or redesign a server solely to disable browser caching. Whenever a browser-loaded JS or CSS file changes, bump its query-string version in `index.html` (for example `game.js?v=3d-10`) so users receive the new build without requiring a manual cache clear.
- `tests/test_app.py`: static behavioral contracts.

## Rules

1. Target iPhone portrait viewports first; verify at 390 × 844 before shipping.
2. Preserve full-screen map rendering and touch-anywhere virtual movement.
3. Use Babylon.js meshes, orthographic camera, collisions, lights, shadows, and post-processing; do not flatten the world back into a hand-written 2D canvas.
4. Character CG PNGs must have transparent backgrounds so the paused map remains visible.
5. Keep pixel-art objects aligned to integer coordinates and retain `pixelArt: true`.
6. Add or update a failing test before changing game behavior.
7. Run all commands above before committing.
8. Update this file whenever commands, architecture, or project conventions change.
9. Update `DESIGN.md` whenever colors, typography, spacing, controls, character scale, art direction, or dialogue presentation changes.
10. Keep generated assets in `assets/`; record their purpose in the commit message.
11. Use a segmentation model (`isnet-anime` or BiRefNet) for production alpha mattes; do not use color-threshold background removal.
12. Build animation frames from one consistent character master whenever possible; motion may change, identity pixels must not morph.

## Art asset production flow

### Approved tools and models

| Asset | Generation tool/model | Background removal | Final location |
|---|---|---|---|
| Pixel characters and buildings | Local `create-image` pipeline with Anima Base V10 and `ElinSprite_AnimaBaseV10_byKonan.safetensors` pixel-sprite LoRA | `rembg` with `isnet-anime`; use `birefnet-general` when ISNet loses dark clothing or hair | `assets/hero-walk.png`, `assets/npcs/`, `assets/building-*.png` |
| Full-body dialogue CG | Local `create-image --anime` pipeline (Anima Base V10 anime workflow) | BiRefNet General preferred; ISNet Anime is an acceptable comparison pass | `assets/village-cg-{face}.png` |
| Sprite-sheet assembly, crop, and inspection | Pillow; nearest-neighbour scaling for pixel assets | Never use RGB/white-threshold removal | final PNG listed above |

Use the project machine's `create-image` skill/script rather than an online image generator. A typical generation command is:

```bash
cd /home/chihmin/models-work/flux2
source .venv-rocm72/bin/activate
python ~/.hermes/skills/create-image/scripts/create_image.py \
  "<character or building prompt; pure white background; no text; no overlap>" \
  --anime --aspect-ratio 16:9
```

For pixel assets, select the create-image pixel-art workflow so the Elin sprite LoRA is loaded. Prompts must request separated subjects, complete silhouettes, consistent scale, a plain background, no shadows, no text, and no overlap. Generate a character master first; do not ask the model to independently redraw every animation frame.

Run professional semantic matting on each isolated subject. The reproducible CLI form is:

```bash
uv tool run --python 3.13 --with 'numba>=0.61' \
  --from 'rembg[cpu,cli]>=2.0.70' \
  rembg i -m isnet-anime input.png output.png

# Fallback for dark/complex silhouettes
uv tool run --python 3.13 --with 'numba>=0.61' \
  --from 'rembg[cpu,cli]>=2.0.70' \
  rembg i -m birefnet-general input.png output.png
```

Do not calculate transparency from white pixels, chroma distance, flood-fill color, or hand-tuned RGB thresholds. Cropping disconnected neighbouring subjects after model inference is allowed, but it must not decide foreground from background color. Pixel-edge alpha may only be snapped after the segmentation model has produced its semantic mask; it is presentation cleanup, not background detection. Inspect every matte over both light and dark checkerboards, especially dark hair, capes, fingers, shoes, and transparent edge halos.

### Character consistency and sheet assembly

1. Approve one master image for the character's face, hair, outfit, palette, body ratio, and equipment.
2. Isolate it with ISNet Anime or BiRefNet; crop to the non-transparent subject bounds.
3. Derive frames from that same master. Idle motion is limited to one- or two-pixel breathing/bobbing, a blink, or a tiny pose offset. Walking may alter limbs and direction, but identity and proportions must not morph.
4. Assemble sheets with Pillow on a transparent canvas. Use nearest-neighbour scaling for pixel art and integer placement; never upscale a map sprite to create dialogue CG.
5. Verify every frame individually and while looping on Babylon.js billboard planes. Reject sheets with jittering feet, changing faces, moving equipment, inconsistent baselines, or clipped pixels.
6. Keep runtime sheets compact and commit only reviewed production outputs to `assets/`.

### Runtime asset contracts

| File contract | Frame/layout contract | Babylon.js/DOM usage |
|---|---|---|
| `assets/hero-walk.png` | `288 × 512`; 3 columns × 4 rows; each frame `96 × 128`; rows are down, left, right, up | Loaded as `heroWalk`; `walk-*` animations use three frames at 8 fps. Display size is `64 × 86`; Arcade body is feet-only (`34 × 22`) so roofs and walls collide naturally. |
| `assets/npcs/npc-idle-{0..5}.png` | `288 × 128`; three `96 × 128` transparent frames from one master | Loaded as `npc0`…`npc5`; `idle-{i}` loops `0,1,2,1` at 3 fps. Displayed at `66 × 94`. The middle frame is also drawn into the 56 px dialogue portrait canvas. |
| `assets/village-cg-{0..5}.png` | Independent transparent full-body PNG, approximately 1080 px tall; never a scaled map sprite | The NPC's numeric `face` selects the file in `interact()`. The DOM `#story-cg` layer displays it above the paused map while `#story` owns dialogue text. |
| `assets/building-{key}.png` | One transparent pixel building per file | `preload()` maps keys to images. `house()` renders at the requested size and creates a separate invisible Arcade rectangle for collision; visible pixels are not used as a collision mask. |

Each entry in `npcs` couples narrative and art through `{ name, face, texture, x, y, lines }`: `texture:'npc3'` selects the map sheet, `face:3` selects both `npc-idle-3.png` for the portrait and `village-cg-3.png` for the full-body CG, and `x/y` places the world object. Keep these indices aligned. Every NPC requires exactly one idle sheet, one full-body CG, four complete dialogue lines, and a reachable non-colliding map position.

### Art acceptance checklist

- Open at 390 × 844 with camera zoom 0.7 and confirm map sprite scale, silhouette, density, and depth sorting.
- Teleport or walk to the left and right corners of all three districts and capture screenshots; every corner must contain layered buildings and props rather than broad empty grass.
- Confirm all three idle frames run and the character does not morph or drift.
- Trigger all four dialogue lines and confirm the matching name, portrait, and full-body CG.
- Inspect transparent assets over light and dark backgrounds; there must be no white box, coloured fringe, neighbouring character fragment, or clipped body part.
- Confirm buildings align with roads and their invisible collision rectangles block only the occupied footprint.
- Confirm CSS tilt-shift keeps the middle gameplay band sharp while the top and bottom are softly blurred; verify the warm/cool grade, long directional shadows, contact shadows, and additive lantern pulses do not hide paths or NPCs.
- The scene uses real Babylon.js hemispheric/directional lighting, shadow maps, low depth-of-field, restrained bloom, ACES tone mapping, color grading, and vignette. Its golden-hour atmosphere is rendered with a camera-side warm directional sun, three low-intensity facade spotlights, a lowered camera-visible procedural cloud layer, three inexpensive diagonal additive light-ray planes, and a capped 140-particle dust system. Billboard textures are streamed only within `STREAM_DISTANCE` (24 world units) and disposed outside that radius; loaded meshes beyond `RENDER_DISTANCE` (18 units) are explicitly hidden. The street uses Poly Haven `cobblestone_floor_001` CC0 PBR maps with shallow parallax occlusion and perspective-compensated world-Z scale so grazing side light reveals stone relief. Characters, NPCs, buildings, and props are vertical billboard planes; ground, roads, river, bridge, and collisions are true 3D meshes.
- Run `node --check game.js` and `python3 -m unittest tests/test_app.py -v` before commit, then verify the deployed GitHub Pages build.

## Fixed viewport and debug camera

- Babylon always renders at the iPhone 14 Pro Max native panel resolution rotated to landscape, `2796 × 1290`, with a fixed 2796:1290 composition. Keep FXAA and depth-of-field disabled: native-resolution pixel billboards must remain crisp on Retina displays rather than being softened by post-processing. CSS letterboxes that landscape frame inside both portrait and landscape browser viewports.
- Global text selection is disabled so drag controls and subtitles cannot be accidentally selected.
- The authored orthographic camera uses `CAM.view = 6.2`, keeping the player and nearby facade details closer and larger without changing the fixed native render target.
- The top-right debug toggle enables two-pointer camera orbit; `重置相機` restores the authored side view. Debug orbit is inspection-only and does not alter normal movement mapping.

## Current gameplay

The player explores a continuous 20 × 72-unit 3D fantasy town made of three connected districts: South Wind Gate, Hanamori Central Square, and Riverside Shopping Street. Eleven flat pixel-building designs are reused across 26 billboard placements while roads, grass, river, bridge, shadows, depth and collisions exist in 3D. A portrait orthographic camera follows movement on the X/Z plane and keeps both sides of the street visible on iPhone. The protagonist has four-direction, three-frame walking animation. Because Babylon loads the sheet with inverted V coordinates, the authored top-to-bottom facing rows map at runtime as `{down:3,left:2,right:1,up:3}`. Upward and downward movement deliberately share the front-facing row; the back-facing artwork is retired and must never be displayed. Do not swap left/right. Movement runs at 280 px/s equivalent and uses animation built from consistent master poses rather than cross-generation morphs. Six NPCs each have a three-frame idle loop, a four-line story, and a transparent full-body dialogue CG. The game intentionally has no background music or audio controls.
