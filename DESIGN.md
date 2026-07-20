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

## Character settings (canonical)

The full-body dialogue CG (`assets/village-cg-{face}.png`) is the **source of truth** for each character's design. The map pixel sprite (`assets/npcs/npc-idle-{face}.png`, and `assets/hero-walk.png` for the player) must match its CG in hair colour/shape, outfit silhouette and palette, and key props — only detail is dropped for the chibi pixel scale, never identity. Regenerate the sprite (not the CG) whenever they diverge.

| face | name | role | hair | outfit | signature props |
|---|---|---|---|---|---|
| 0 | 莉亞 | gardener girl | short auburn/ginger, yellow hair ribbon | cream ruffled blouse + small red neck bow, olive-green apron dress over white pinafore, black tights, brown lace-up boots | basket of pink flowers |
| 1 | 米洛 | carpenter, young man | tousled brown | tan short-sleeve tunic, teal-blue neck scarf, brown leather work apron with tool pouches, navy baggy trousers, tall brown boots, fingerless wraps | tool pouches / crossed arms |
| 2 | 莎婆婆 | village elder | grey, tied back | lavender shawl over a sage-green floral long dress | wooden walking cane |
| 3 | 艾妲 | baker girl | wavy blonde, shoulder-length | white headscarf/kerchief, cream puff-sleeve blouse, burnt-orange apron dress, white socks, short brown boots | basket of bread (baguettes) |
| 4 | 凱恩 | town guard (**female knight**) | long, straight black, past the shoulders | blue tabard + short blue skirt over light silver plate armour, dark blue cape, white greaves/boots | sword at hip |
| 5 | 菲菲 | fountain child | light teal/blue | wide tan sun hat, cream vintage lace dress | wildflowers + small basket |

### Protagonist — 遙 (Haruka)

The player character is **遙 (Haruka)**, a cheerful young traveller. Design (canonical for `assets/hero-walk.png`): soft **lavender short wavy hair** under a **green beret**; **cream/white blouse**; **brown traveller's vest**; **khaki short shorts**; **brown lace-up boots**; a **brown leather satchel** worn across the shoulder. Her palette is deliberately distinct from all six NPCs.

Walk sheet: `assets/hero-walk.png`, `288×512`, 3 columns × 4 rows of `96×128`. Columns are the approved walk cycle — **col 1 is the neutral idle from the middle tile of `frontwalk_tile2.jpg`** (shown when standing), while cols 0/2 are the opposing step poses from `walk_final.gif`, cycled at 8 fps while moving. The supplied artwork's canonical orientation is **left-facing**: keep left/up/down and every idle frame unmirrored, and horizontally mirror only active rightward movement. The character remains front-facing in every directional row (the retired back-facing artwork is not used); keep her feet on the shared baseline (`y≈124`) at the same scale as the NPCs. Regenerate as a single multi-pose sheet (identity-consistent) if the design changes.

Pixel sprites are generated in the chibi Elin-sprite pixel-art style, matted to transparency, and assembled into the runtime idle/walk sheets.

**Dialogue portraits** (`assets/dialogue/`): during a conversation the two speakers face inward — the **player (遙) portrait sits on the LEFT** (`hero.png`, her CG turned ¾ to the right so she faces the centre), and the **NPC portrait on the RIGHT** (`npc-{face}.png`, turned to face left). 遙's dialogue portrait preserves her complete transparent full-body CG; it is not reduced to a half-body crop.

### Idle animations

Each NPC **holds one calm resting pose** — the idle motion is deliberately small: a gentle breathing/cloth sway, not pose-swapping. The sprite sheet (`npc-idle-{face}.png`, `288×128`, three `96×128` frames) is still authored as one multi-pose sheet (generated in a single pass so identity never morphs, every frame sharing one scale factor and a common feet baseline), but at runtime only the character's resting frame (`NPC_REST`) is shown. The other two poses remain in the sheet as a reserve for future richer idles.

The sway is procedural, per `animateNpcs()`: a feet-anchored vertical stretch (~2%) plus a slight width oscillation (~1.3%), each NPC desynced by a phase and driven by wall-clock time so the cadence is framerate-independent. Feet stay planted (position compensates the vertical scale). Keep it subtle.

| face | name | resting pose (`NPC_REST`) | (reserve poses in sheet) |
|---|---|---|---|
| 0 | 莉亞 | frame 2 — hold the flower basket | stand, wave |
| 1 | 米洛 | frame 1 — arms crossed | hand out, hand on hip + hammer |
| 2 | 莎婆婆 | frame 0 — lean on the cane | gesture, glance aside |
| 3 | 艾妲 | frame 1 — hold the bread basket | wave, offer a loaf |
| 4 | 凱恩 | frame 0 — stand at attention | hand on sword, arms crossed |
| 5 | 菲菲 | frame 0 — hold wildflowers | cheer arms up, hands behind back |

## Camera & terrain (HD-2D horizontal side-scroller)

The world is a **landscape horizontal side-scroller**. The street runs along the world X axis; Z is a shallow depth band. The orthographic camera holds a fixed ~15° downward tilt (close to the ground, not top-down) and scrolls horizontally, tracking only the player's X so the town reads as a continuous 16:9 Octopath-style frontage. The three districts sit left→right along X. The orthographic half-window uses proportional `5.0`-unit bounds in both axes, so the wider view never squeezes the world horizontally. Player and NPC billboards are enlarged by the matching ~1.48× factor to retain their prior screen size while more of the environment remains visible. It remains near-centred so the town frontage fills the frame (there is no persistent bottom panel to clear). Because Babylon is left-handed, world −X maps to screen-right; horizontal input is negated so controls stay intuitive.

## What is 3D vs 2D

**3D geometry (real meshes, lit, cast/receive shadows, collide):**
- Ground: a single large paved-stone plane extending from world Z `-18` into the deep foreground, so the surface continues behind the rear facade layer without exposing an early edge. It uses the Poly Haven CC0 cobblestone PBR maps in `assets/textures/` with anisotropic filtering, normal relief, roughness, and AO.
- Enclosure: only off-screen end-cap walls (procedural stone-brick, `drawStoneBrick`) plus the shallow Z clamp keep the player on the street — no back wall and no foreground curb. The backdrop is a fuller second row of houses (offset to peek between the front row) that hides the ground's far edge, with a few scattered trees and open sky above; extra houses may be added anywhere that does not block the walkway or hide the characters.
- Invisible collision slabs behind backdrop buildings and under solid props.

**2D pixel billboards (flat planes, `BILLBOARDMODE_Y`, always face camera):**
- Buildings (backdrop rows + a deeper blurred row + fading foreground occluders), the player, all six NPCs, and every vegetation/street prop (trees, bushes, flowerbeds, lamps, barrels, fountain). Building and prop art is generated pixel art matted to transparency.
- The glowing rune-circle **decal** on the plaza (a flat additive plane, not a billboard).
- Soft radial **contact-shadow** decals under every billboard so nothing floats.

**Removed:** the river/bridge/water were pulled out; anything floor-related is handled with 3D geometry + texture assets. (A future river should also be real 3D geometry, not a flat sprite.)

**Foreground occlusion:** near-camera buildings never collide. They use normal depth ordering and ease to 15% visibility when directly overlapping the tracked player, then return to full opacity after the camera passes. Buildings must never disappear completely.

## Shapes

Dialogue panels use softly rounded rectangles. Touch indicators and the talk action are circular. Pixel-world geometry remains hard-edged and integer-aligned.

## Components

- **No persistent HUD:** exploration shows only the location label; there is no standing dialogue panel and no talk button. The whole screen is the control surface.
- **Tap to talk:** a quick tap (small movement, short duration) that is not a joystick drag opens a conversation when the player is close enough to an NPC; a subtle rounded **hint** pill ("點一下說話") fades in only while within range.
- **Story panel:** large bottom caption with speaker name in gold and 20px body copy; tapping the story overlay advances it.
- **Dialogue portraits:** display complete full-body transparent illustrations: the protagonist is always anchored on the left and angled slightly right, while the active NPC stays on the right and angles slightly left. Only trim entirely empty outer alpha padding; never crop away body pixels or normalize the body into a half-body composition. The portrait stage extends behind the compact bottom dialogue box (about 98 px minimum height at the reference landscape frame); that higher-z-index panel, not the asset pipeline, hides the lower body. Source PNGs stay transparent without a white matte.

## Do's and Don'ts

- Do verify every visual change at 390 × 844.
- Do keep player movement responsive at 280 world pixels per second.
- Do use Babylon.js orthographic camera following, X/Z mesh collisions, and nearest-neighbor textures.
- Do account for Babylon's inverted V sheet coordinates: runtime player rows are `{down:3,left:2,right:1,up:3}`. The source sprite is left-facing; only an active rightward walk is horizontally mirrored, while idle and depth movement retain the original left-facing pose. The back-facing row is retired and must never appear.
- Do preserve the three-district road plan, eleven distinct HD-2D fantasy building types, layered foreground atmosphere, and transparent chibi pixel sprites.
- Do keep the guild, magic shop, alchemist, smithy, tavern, bakery, flower shop, chapel, home, clocktower, and market visually distinct.
- Do keep roads high contrast and unobstructed even when adding atmospheric effects or large buildings.
- Do compose every 390 × 844 camera view as a dense HD-2D town vignette: multiple buildings, layered trees, flowers, barrels or crates, bunting, foreground depth, and no large empty grass fields.
- Do validate density from both sides of all three districts with the portrait orthographic camera.
- Do preserve the cinematic focus hierarchy: sharp playable middle band, softly blurred top/bottom depth planes, warm upper-left sunlight, cool green shadows, contact occlusion, subtle additive lantern glow, saturation/contrast grade, and edge vignette.
- Do keep tilt-shift blur near 2.4 px so atmosphere is visible without obscuring navigation.
- Do use Babylon.js lighting, real shadow maps, low-depth-of-field, restrained bloom, ACES tone mapping, color grading, and vignette; keep the pipeline intentionally small for iPhone performance.
- Do render the street with a real CC0 medieval cobblestone PBR set (albedo, normal, roughness, and AO), shallow parallax occlusion, and grazing directional light so the side-on camera reads genuine stone relief. Stretch its world-Z texture scale enough to counter perspective foreshortening without making individual stones unnaturally long.
- The village is staged at golden dusk: a blue-violet-to-amber sky gradient, camera-visible layered warm/cool clouds, camera-side orange directional sunlight, nine restrained diagonal god-rays with deliberately uneven district counts, thicknesses, angles, intensities, and rear/street/foreground Z positions, three warm facade spotlights with modest specular highlights, and sparse drifting illuminated dust distributed across the full town. Rays and dust must remain world-space atmosphere and must never follow the player or camera. Keep all atmospheric layers inexpensive enough for iPhone.
- Load building and prop billboards within 24 world units, disable them beyond a 32-unit hysteresis boundary, and stop rendering loaded billboards outside the 18-unit camera budget. Cache and reuse one material per image/flip variant so repeated facades never trigger duplicate texture decoding or district-boundary upload thrashing.
- Cap gameplay at 60 FPS on ProMotion displays and disable PBR parallax occlusion on coarse-pointer/mobile devices; preserve normal, roughness, AO, lighting, and native resolution while avoiding thermal throttling during sustained walking.
- Preserve every tightly cropped billboard's native aspect ratio. Compute facade width from its rendered height and actual PNG width/height; collision footprints and contact shadows must follow that fitted width rather than a generic building box.
- Remain a static GitHub Pages experience; do not introduce a custom no-cache server. Use versioned asset query strings in `index.html`, and increment the affected version whenever deployed JavaScript or CSS changes so clients cannot remain on stale gameplay or presentation code.
- Preserve an authored `2796 × 1290` iPhone 14 Pro Max native landscape frame in every device orientation; portrait devices display the complete landscape composition with neutral letterboxing instead of cropping or switching to portrait framing.
- Keep FXAA disabled at the native Retina render size. Use only Babylon's Low depth-of-field tier: the near street and foreground remain legible while distant roofs and skyline soften progressively. Never blur UI, and do not raise the blur enough to erase pixel silhouettes.
- Prevent text selection throughout gameplay. A compact top-right debug toggle may expose two-finger orbit, six direction buttons, numeric X/Y/Z offsets, angle, orthographic view, and reset controls; normal players retain the locked authored camera.
- Diagonal aerial rays must visibly terminate as restrained additive light pools on the real cobblestone ground.
- Foreground billboards contain no houses: use only carts, covered wagons, flower wells, barrels, stalls, and similar street props in staggered rows at world Z `10.8` and `15.2`. Move all cottage and shop silhouettes into the rear frontage around Z `-8.2`, mixing the generated set with the main building set for maximum background variety.
- Do give the protagonist distinct down, left, right, and up animation rows with idle middle frames.
- Do keep character identity, palette, hair, outfit, and proportions identical between animation frames; only pose and pixel offsets may change.
- Do give every NPC a subtle three-frame idle loop, four dialogue lines, and a dedicated full-body CG.
- Do produce transparency with an anime-aware segmentation model such as ISNet Anime or BiRefNet, not hand-tuned color thresholds.
- Do keep the experience silent: no BGM, audio player, or music control.
- Do update this document whenever tokens or visual behavior change.
- Don't place opaque backgrounds behind character CGs.
- Don't add a fixed joystick; touch origin follows the player's thumb.
- Don't shrink map characters below the current 1.75 scale without mobile testing.
