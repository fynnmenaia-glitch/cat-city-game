# Cat City — Terraria-Style Inventory & Adventure Update (3 November 2026)

This release replaces earlier four-slot inventory and click-through tutorial notes.

## Implemented
- Terraria-style 10×4 inventory: 40 item slots, 10 hotbar slots numbered 1–0, four Coins slots, four Ammo slots, confirmation trash, sorting, swapping, drag/drop on desktop, equipping and durability repairs. Existing saved gear is migrated, with overflow preserved.
- Shop Bow becomes usable equipment. Craft arrows with wood and stone and use arrows for longer-range Bow attacks in Birman boss fights.
- Visible original pixel-art trees (forest, cherry and marsh) at exactly the same coordinates used by player and AI harvesting, with three-hit chops, wood chips, fallen stumps and eight-minute regrowth for player-mined trees. Existing AI worker behavior is otherwise unchanged.
- A playable training island requires movement, ground-item collection, opening the real inventory, equipping, three-hit chopping, mining, opening a chest, crafting arrows, reading a quest and finishing before new players can join multiplayer. Legacy completed saves retain access; replay is possible.
- Less cluttered mobile HUD: compact player/status display, explicit next-objective button, repositioned Shop/Quests/Map/Pause/Online/Chat/Backpack controls, non-overlapping 10-slot hotbar and joystick. Save and extra utilities live inside Pause.
- Returning to the title clears stuck shop and transient menus. No unnecessary pickup prompt away from floor loot. Mobile canvas region banners no longer overlap the HUD.
- Global event vote lives behind a compact chip. Eight AI workers from four AI public lobbies cast one **simulated** vote each at staggered times with recognizable theme preferences. Human votes and simulated AI votes are displayed and counted separately. No paid generative model or voice chat is involved.
- Treasure Rain and Starfall add biome-appropriate floor gear. Treasure Rain provides one extra chest equipment drop. Owner luck multipliers, global votes, unique items and other existing admin powers remain.
- Active event badge shows the event and luck; Objectives displays remaining duration and progress.

## Verification
- Server-side Python and JavaScript tests cover five-player rooms, worker resources, protected admin actions, four AI lobbies, clearly labeled simulated voting, resource scripts and no AI speech endpoints.
- Mobile Chromium test completes the playable tutorial, checks all 40 slots, equipment, tree pixels, mobile non-overlap, Bow inventory, event drops, compact poll UI, title/shop closure and save reload.
- Existing Neon account/cloud-save database schema is unchanged. No new passwords or owner credentials are stored in source.
- Physical iPhone Safari and Windows Chrome real-device checks remain worthwhile after deployment.

## Existing features kept intact
The autonomous AI workers still follow their prior task-planning behavior; this update adds visible resource trees and simulated votes, not a rewritten AI model. Player quests remain optional after training.
