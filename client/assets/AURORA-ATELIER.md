# Aurora Atelier — original Cat City graphics pack

Aurora Atelier is a hand-drawn vector sprite atlas and a lightweight Canvas 2D renderer built specifically for Cat City. All eight illustrations are new artwork for this game; no third-party sprites, audio, or fonts are needed.

## What is included

The transparent atlas `aurora-atlas.svg` is **512 × 256**, arranged in **4 columns × 2 rows**, with **128 × 128** sprites:

| Index | Sprite | Where it appears |
| --- | --- | --- |
| 0 | Starlit pine | Wilderness and forest |
| 1 | Cotton-candy cherry tree | Cherry Grove and edge of village |
| 2 | Amethyst moonstone cluster | Moonstone biome |
| 3 | Twilight mushrooms | Poison Wastes |
| 4 | Moon lantern | Village streets |
| 5 | Lily pool | Marsh and village gardens |
| 6 | Enchanted flowering hedge | Village and forest |
| 7 | Cat City crest arch | Village near the boss arena |

The JavaScript renderer, `client/aurora-atelier.js`, draws the atlas over existing biome scenery with culling and a bounded number of decorations. It also provides animated star accents around the **Quest 20 Double Birman Showdown**. The original Cat City cats, hitboxes, quests, saved games and item spawning rules are unchanged.

## To select

From Cat City: **Settings → Graphics & Adventure → Graphics pack → 🌌 Aurora Atelier**. The pack is showcased on first load for players previously using the default Cozy style; anyone can switch back to the existing packs.

## Developer interface

`window.catCityAuroraArt` exposes the artwork metadata and the draw helper. For a standalone preview, open `/art/aurora-atlas.svg` on the game server. The atlas is same-origin and has no scripts or external references.

Copyright © Cat City project. Original graphics created specifically for this project.
