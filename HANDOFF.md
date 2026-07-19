# Hanamori Village — Handoff

## Project status

**The engine migration is only a technical first pass. The overall scene design is not complete.**

The current build proves that Babylon.js can render a real 3D ground with flat pixel-art billboards, but it must not be treated as the finished visual target. The town still needs a full environment-design pass covering composition, terrain, architecture, props, lighting, depth, traversal, collision, and mobile performance.

## North-star goal

Build an iPhone-first fantasy-town exploration game that visually follows the production method demonstrated in the referenced HD-2D implementation video:

- Reference: <https://youtu.be/YGY6p-cnb08?si=VMztJzzFrLP49W6H>
- The world is fundamentally 3D.
- Ground, roads, rivers, bridges, walls, elevation, and collision are 3D geometry.
- Characters, NPCs, buildings, trees, and many props are flat pixel-art planes placed inside that 3D world.
- The camera presents a mostly side-on composition with a slight downward angle.
- It should feel like a cinematic horizontal-scrolling RPG while still allowing movement up, down, left, and right on the X/Z ground plane.
- Billboards must remain visually integrated with the 3D ground through shadows, depth, occlusion, matching pixel density, and restrained post-processing.

Do not solve the remaining visual problems by flattening the scene back into a 2D top-down map or by stacking CSS filters over an unfinished layout.

## Current technical foundation

- Runtime: locally hosted Babylon.js (`vendor/babylon.js`).
- Deployment: public GitHub repository and GitHub Pages.
- Target viewport: iPhone portrait, `390 × 844`.
- Camera: orthographic, slightly elevated, following the player.
- Movement: X/Z four-direction movement with anywhere-touch temporary joystick.
- Movement speed contract: `280 px/s` equivalent.
- World: three connected districts:
  1. South Wind Gate
  2. Hanamori Central Square
  3. Riverside Shopping Street
- Existing assets retained:
  - four-direction protagonist sheet;
  - six NPC idle sheets;
  - six four-line NPC stories;
  - six transparent full-body dialogue CGs;
  - eleven transparent fantasy-building designs.
- Current 3D systems:
  - ground meshes;
  - road meshes;
  - river and bridge meshes;
  - X/Z movement and mesh collision;
  - billboard planes;
  - directional and hemispheric lighting;
  - shadow map;
  - low depth of field;
  - restrained bloom;
  - color grading and vignette;
  - environmental particles.
- The game remains intentionally silent: no BGM, audio player, or music control.

## What is not finished

### Scene composition

- The current scene reads as a sparse technical layout, not a designed fantasy town.
- Buildings are arranged too mechanically and lack convincing street frontage.
- The three districts do not yet have sufficiently distinct silhouettes, landmarks, or visual identities.
- Foreground, middle ground, and background layers are not composed into strong cinematic frames.
- Empty green areas and rectangular ground patches remain visually obvious.
- The camera framing is still too close to a conventional top-down map in places.

### 3D environment

- Ground needs authored geometry instead of mostly flat rectangular slabs.
- Add curbs, steps, embankments, riverbanks, retaining walls, bridge structure, terrain transitions, and subtle elevation.
- Roads and plazas need coherent 3D edges and intersections.
- The river must visually and physically restrict crossing to the intended bridge.
- Add proper town boundaries, gates, alleys, side paths, and navigable spaces between buildings.
- Collision volumes must match visible architecture and must not obstruct intended routes.

### Billboard integration

- Buildings must be positioned and scaled to look grounded rather than floating or pasted onto the scene.
- Building planes need consistent baselines, pivots, depth placement, and collision footprints.
- Characters, NPCs, trees, and props need contact shadows.
- Sprite pixel density must remain consistent across distance and screen position.
- Nearest-neighbour sampling must remain enabled; do not blur pixel sprites with texture interpolation.
- Occlusion and render order must behave correctly when the player walks in front of or behind scene elements.

### Environment density

Every visible town corner should contain intentional detail. Add and arrange:

- trees and foreground foliage;
- flower beds and climbing plants;
- fences, posts, lamps, signs, flags, and bunting;
- stalls, awnings, tables, carts, barrels, crates, sacks, and baskets;
- benches, wells, fountains, statues, docks, and river props;
- small elevation changes and architectural transitions;
- foreground silhouettes that occasionally occlude the camera without hiding navigation.

Avoid large undecorated grass fields.

### Lighting and post-processing

The final look should combine:

- directional warm sunlight;
- cooler green-blue ambient shadow;
- contact shadow and ambient-occlusion-like grounding;
- billboard sprite shadows cast into the 3D scene;
- depth of field based on real scene depth;
- restrained bloom only on bright highlights;
- color grading;
- vignette;
- sun shafts or projected light;
- floating light particles;
- water highlights and reflections.

Effects must support composition rather than compensate for weak scene design. Avoid excessive blur, bloom, darkness, or saturation.

### Gameplay validation

- Walk the complete main road through all three districts.
- Test every branch road, alley, plaza edge, riverbank, bridge entrance, and town corner.
- Confirm the player cannot cross the river outside the bridge.
- Confirm all six NPCs can be approached and their four-line dialogue completed.
- Confirm buildings and props do not trap the player.
- Confirm the temporary joystick starts anywhere, tracks the thumb, and stops immediately on release or cancel.
- Confirm keyboard controls continue to work for desktop testing.
- Confirm dialogue and CG overlays do not leak movement input.

### Mobile performance

- Validate on a `390 × 844` viewport and, when available, a physical iPhone.
- Maintain responsive movement and stable rendering while the camera moves through dense areas.
- Keep shadow-map size, particle count, depth of field, bloom, and device scaling conservative.
- Prefer instancing, shared materials, texture atlases, and bounded effect counts.
- Do not remove required depth, shadow, or scene density merely to hide an unmeasured performance problem; profile first.

## Visual acceptance procedure

For every significant scene iteration:

1. Open the production-like build at `390 × 844`.
2. Capture both sides and important corners of all three districts.
3. Capture the central road, plaza, riverbanks, bridge, and town gate.
4. Compare screenshots against the visual reference for:
   - camera angle;
   - architectural density;
   - depth separation;
   - grounded billboards;
   - directional lighting;
   - contact shadows;
   - foreground occlusion;
   - bloom and water highlights;
   - readability of roads and NPCs.
5. Walk every intended route and verify collisions.
6. Reject the iteration if it only improves the spawn screen while leaving other areas sparse or broken.

## Required preservation rules

- Keep the iPhone-first portrait layout.
- Keep the anywhere-touch temporary joystick.
- Keep four-direction movement and the `280 px/s` contract.
- Keep the protagonist centered near the gameplay focus while the world scrolls.
- Keep six NPCs, their existing identities, four complete lines each, portraits, and transparent full-body CGs.
- Keep character animation frames derived from a consistent master character; do not introduce morphing faces, costumes, or proportions.
- Keep professional semantic background removal (`isnet-anime` or `birefnet-general`) for production art assets.
- Keep the game silent.
- Keep static GitHub Pages deployment.
- Keep `CLAUDE.md`, `DESIGN.md`, `README.md`, tests, and this handoff document synchronized with architectural changes.

## Verification commands

```bash
node --check game.js
python3 -m unittest tests/test_app.py -v
npx -y @google/design.md lint DESIGN.md
```

All tests must pass before deployment. Visual and traversal validation are still mandatory because contract tests alone cannot prove that the scene design is complete.

## Current deployment

- Repository: <https://github.com/AyaSakura-comp/hanamori-village>
- GitHub Pages: <https://ayasakura-comp.github.io/hanamori-village/>
- First Babylon.js migration commit: `151fd9d`

## Immediate next steps

1. Redesign the camera and blockout to establish the intended side-on, slightly elevated composition.
2. Replace rectangular ground patches with authored 3D terrain, road edges, riverbanks, bridge structure, and elevation.
3. Recompose all three districts around landmarks and continuous street frontage.
4. Ground every billboard with correct pivot, scale, collision footprint, shadow, and occlusion.
5. Add dense props and vegetation throughout the complete map.
6. Tune lighting and post-processing only after the scene composition reads clearly without effects.
7. Perform full-map mobile screenshot, traversal, collision, NPC, and performance validation.

**Definition of done:** the project is complete only when all three districts are visually authored and dense, every intended route is traversable, all billboards integrate convincingly with the 3D world, the cinematic lighting remains readable on iPhone, all NPC interactions work, and automated plus visual validation pass. The current build does not yet meet this definition.
