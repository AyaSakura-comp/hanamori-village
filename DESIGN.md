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

## Shapes

Dialogue panels use softly rounded rectangles. Touch indicators and the talk action are circular. Pixel-world geometry remains hard-edged and integer-aligned.

## Components

- **Talk button:** bottom-right, thumb reachable, coral with a cream ring.
- **Exploration dialogue:** compact translucent navy panel at the bottom.
- **Story panel:** large bottom caption with speaker name in gold and 20px body copy.
- **Character CG:** transparent PNG, full body, contained above the story panel without a white matte.

## Do's and Don'ts

- Do verify every visual change at 390 × 844.
- Do keep player movement responsive at 280 world pixels per second.
- Do use Phaser camera following, Arcade Physics, and integer rendering.
- Do preserve the three-district road plan, eleven distinct HD-2D fantasy building types, layered foreground atmosphere, and transparent chibi pixel sprites.
- Do keep the guild, magic shop, alchemist, smithy, tavern, bakery, flower shop, chapel, home, clocktower, and market visually distinct.
- Do keep roads high contrast and unobstructed even when adding atmospheric effects or large buildings.
- Do compose every 390 × 844 camera view as a dense HD-2D town vignette: multiple buildings, layered trees, flowers, barrels or crates, bunting, foreground depth, and no large empty grass fields.
- Do validate density from both left and right corners of all three districts at camera zoom 0.7.
- Do give the protagonist distinct down, left, right, and up animation rows with idle middle frames.
- Do keep character identity, palette, hair, outfit, and proportions identical between animation frames; only pose and pixel offsets may change.
- Do give every NPC a subtle three-frame idle loop, four dialogue lines, and a dedicated full-body CG.
- Do produce transparency with an anime-aware segmentation model such as ISNet Anime or BiRefNet, not hand-tuned color thresholds.
- Do keep the experience silent: no BGM, audio player, or music control.
- Do update this document whenever tokens or visual behavior change.
- Don't place opaque backgrounds behind character CGs.
- Don't add a fixed joystick; touch origin follows the player's thumb.
- Don't shrink map characters below the current 1.75 scale without mobile testing.
