---
version: alpha
name: Hanamori Village
description: Cozy pastoral pixel art with clear mobile controls and polished visual-novel character moments.
colors:
  primary: "#17263E"
  ink: "#17263E"
  sky-ink: "#182B45"
  grass: "#79BE55"
  grass-highlight: "#A8DA67"
  path: "#E7BB6B"
  path-highlight: "#F4D98A"
  water: "#5BB8D0"
  accent: "#A94F62"
  gold: "#FFD36E"
  cream: "#FFE1A3"
  white: "#FFFFFF"
typography:
  dialogue:
    fontFamily: system-ui
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: 0em
  label:
    fontFamily: system-ui
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0.08em
rounded:
  dialogue: 16px
  control: 999px
spacing:
  xs: 8px
  sm: 12px
  md: 18px
  lg: 24px
components:
  dialogue-panel:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.dialogue}"
    padding: 20px
  talk-button:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    size: 62px
---

## Overview

Hanamori Village combines a warm European fantasy town, cinematic HD-2D depth, and visual-novel character presentation. The explorable world uses crisp pixel characters against richly detailed generated timber-and-stone buildings, layered shadows, atmospheric light shafts, foreground silhouettes, reflective water, and three intentionally planned districts. Broad pale cobblestone roads, intersections, a central fountain plaza, and a single river bridge make the valid route immediately legible. Exploration must feel immediate under one thumb; conversations should feel warm, personal, and more detailed than the map sprites.

## Colors

Grass and warm paths dominate exploration. Deep navy is reserved for readable overlays. Coral marks the single primary action, while gold communicates names, focus, and story progression.

## Typography

Use the system UI stack for reliable Traditional Chinese rendering on iPhone. Dialogue is large and weighted for outdoor mobile use. Tiny text is limited to optional prompts.

## Layout

The map always fills the viewport, including safe-area edges. HUD and dialogue are overlays rather than layout rows. The reference viewport is 390 × 844. Touch movement can originate anywhere on the map.

## Elevation & Depth

Map objects use Y-based depth so characters pass naturally in front of and behind scenery. Story CGs sit over a translucent map dimmer; transparent pixels must preserve environmental context.

## Camera & terrain (HD-2D horizontal side-scroller)

The world is a **landscape horizontal side-scroller**. The street runs along the world X axis; Z is a shallow depth band. The orthographic camera holds a fixed shallow ~15° side-on tilt (close to the ground, not top-down) and scrolls horizontally, tracking only the player's X so the town reads as a continuous 16:9 Octopath-style frontage. The three districts sit left→right along X. The vertical ortho half-window is fixed at `6.2` world units so the player and nearby facades read larger and closer. It remains near-centred so the town frontage fills the frame (there is no persistent bottom panel to clear). Because Babylon is left-handed, world −X maps to screen-right; horizontal input is negated so controls stay intuitive.

## What is 3D vs 2D

**3D geometry (real meshes, lit, cast/receive shadows, collide):**
- Ground: a single large paved-stone plane driven by a **real seamless texture asset** (CC0 from ambientCG) with **diffuse + normal maps** so the stone catches the directional sun as genuine relief — not a flat image. Files live in `assets/textures/` (`stone_*`), tiled with anisotropic filtering. The plane reaches far into the foreground but ends just behind the back wall, so the background above the buildings is sky + treeline, not stone riding up the screen.
- Enclosure: only off-screen end-cap walls (procedural stone-brick, `drawStoneBrick`) plus the shallow Z clamp keep the player on the street — no back wall and no foreground curb. The backdrop is a fuller second row of houses (offset to peek between the front row) that hides the ground's far edge, with a few scattered trees and open sky above; extra houses may be added anywhere that does not block the walkway or hide the characters.
- Invisible collision slabs behind backdrop buildings and under solid props.

**2D pixel billboards (flat planes, `BILLBOARDMODE_Y`, always face camera):**
- Buildings (backdrop rows + a deeper blurred row + fading foreground occluders), the player, all six NPCs, and every vegetation/street prop (trees, bushes, flowerbeds, lamps, barrels, fountain). Building and prop art is generated pixel art matted to transparency.
- The glowing rune-circle **decal** on the plaza (a flat additive plane, not a billboard).
- Soft radial **contact-shadow** decals under every billboard so nothing floats.

**Removed:** the river/bridge/water were pulled out; anything floor-related is handled with 3D geometry + texture assets. (A future river should also be real 3D geometry, not a flat sprite.)

**Foreground occlusion:** near-camera buildings never collide and fade to ~0.2 opacity when the player passes behind them, so they frame the shot without blocking the path.

## Shapes

Dialogue panels use softly rounded rectangles. Touch indicators and the talk action are circular. Pixel-world geometry remains hard-edged and integer-aligned.

## Components

- **No persistent HUD:** exploration shows only the location label; there is no standing dialogue panel and no talk button. The whole screen is the control surface.
- **Tap to talk:** a quick tap (small movement, short duration) that is not a joystick drag opens a conversation when the player is close enough to an NPC; a subtle rounded **hint** pill ("點一下說話") fades in only while within range.
- **Story panel:** large bottom caption with speaker name in gold and 20px body copy; tapping the story overlay advances it.
- **Character CG:** transparent PNG, full body, contained above the story panel without a white matte.

## Do's and Don'ts

- Do verify every visual change at 390 × 844.
- Do keep player movement responsive at 280 world pixels per second.
- Do use Babylon.js orthographic camera following, X/Z mesh collisions, and nearest-neighbor textures.
- Do account for Babylon's inverted V sheet coordinates: runtime player rows are `{down:3,left:2,right:1,up:3}`. Walking left/right must face the matching screen direction. Both depth directions retain the front-facing art; the back-facing row is retired and must never appear.
- Do preserve the three-district road plan, eleven distinct HD-2D fantasy building types, layered foreground atmosphere, and transparent chibi pixel sprites.
- Do keep the guild, magic shop, alchemist, smithy, tavern, bakery, flower shop, chapel, home, clocktower, and market visually distinct.
- Do keep roads high contrast and unobstructed even when adding atmospheric effects or large buildings.
- Do compose every 390 × 844 camera view as a dense HD-2D town vignette: multiple buildings, layered trees, flowers, barrels or crates, bunting, foreground depth, and no large empty grass fields.
- Do validate density from both sides of all three districts with the portrait orthographic camera.
- Do preserve the cinematic focus hierarchy: sharp playable middle band, softly blurred top/bottom depth planes, warm upper-left sunlight, cool green shadows, contact occlusion, subtle additive lantern glow, saturation/contrast grade, and edge vignette.
- Do keep tilt-shift blur near 2.4 px so atmosphere is visible without obscuring navigation.
- Do use Babylon.js lighting, real shadow maps, low-depth-of-field, restrained bloom, ACES tone mapping, color grading, and vignette; keep the pipeline intentionally small for iPhone performance.
- Do render the street with a real CC0 medieval cobblestone PBR set (albedo, normal, roughness, and AO), shallow parallax occlusion, and grazing directional light so the side-on camera reads genuine stone relief. Stretch its world-Z texture scale enough to counter perspective foreshortening without making individual stones unnaturally long.
- The village is staged at golden dusk: a blue-violet-to-amber sky gradient, camera-visible layered warm/cool clouds, camera-side orange directional sunlight, three restrained diagonal god-rays, three warm facade spotlights with modest specular highlights, and sparse drifting illuminated dust. Keep all atmospheric layers inexpensive enough for iPhone.
- Load building and prop billboards within 24 world units, disable them beyond a 32-unit hysteresis boundary, and stop rendering loaded billboards outside the 18-unit camera budget. Cache and reuse one material per image/flip variant so repeated facades never trigger duplicate texture decoding or district-boundary upload thrashing.
- Cap gameplay at 60 FPS on ProMotion displays and disable PBR parallax occlusion on coarse-pointer/mobile devices; preserve normal, roughness, AO, lighting, and native resolution while avoiding thermal throttling during sustained walking.
- Preserve every tightly cropped billboard's native aspect ratio. Compute facade width from its rendered height and actual PNG width/height; collision footprints and contact shadows must follow that fitted width rather than a generic building box.
- Remain a static GitHub Pages experience; do not introduce a custom no-cache server. Use versioned asset query strings in `index.html`, and increment the affected version whenever deployed JavaScript or CSS changes so clients cannot remain on stale gameplay or presentation code.
- Preserve an authored `2796 × 1290` iPhone 14 Pro Max native landscape frame in every device orientation; portrait devices display the complete landscape composition with neutral letterboxing instead of cropping or switching to portrait framing.
- Keep FXAA and depth-of-field disabled at the native Retina render size. Pixel billboards, UI, and stone detail must remain crisp; atmosphere should come from authored light, color, and particles rather than full-frame softening.
- Prevent text selection throughout gameplay. A compact top-right debug toggle may enable two-finger camera orbit and expose a reset-camera button, but normal players retain the locked authored camera.
- Diagonal aerial rays must visibly terminate as restrained additive light pools on the real cobblestone ground.
- Foreground house billboards sit at world Z `18.5`, using only the bottom edge as a framing layer so the central walking lane remains unobstructed.
- Do give the protagonist distinct down, left, right, and up animation rows with idle middle frames.
- Do keep character identity, palette, hair, outfit, and proportions identical between animation frames; only pose and pixel offsets may change.
- Do give every NPC a subtle three-frame idle loop, four dialogue lines, and a dedicated full-body CG.
- Do produce transparency with an anime-aware segmentation model such as ISNet Anime or BiRefNet, not hand-tuned color thresholds.
- Do keep the experience silent: no BGM, audio player, or music control.
- Do update this document whenever tokens or visual behavior change.
- Don't place opaque backgrounds behind character CGs.
- Don't add a fixed joystick; touch origin follows the player's thumb.
- Don't shrink map characters below the current 1.75 scale without mobile testing.
