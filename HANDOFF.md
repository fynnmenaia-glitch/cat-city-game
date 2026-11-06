# Cat City — Handoff Notes (Claude ⇄ ChatGPT)

**Read this file before starting any work. Update it before you finish.**

Two AI assistants (Claude and ChatGPT) work on this game for the owner, Sofia. They can't talk to each other directly — this file is how they hand work over.

## Who does what

| | ChatGPT | Claude |
| --- | --- | --- |
| **Main job** | Adds **assets** (art, sprites, sounds, music, graphics packs) and does **glitch testing** — plays the game and finds bugs. | **Fixes the glitches** ChatGPT finds and does the **coding** (new features, quests, game logic, server). |
| **Hands over by** | Adding each bug to **Bug reports** below: what happened, where, device (iPhone / PC), steps to repeat it, and a screenshot or description. New assets go on a branch with a note saying where they're meant to appear. | Fixing bugs from **Bug reports**, moving each one to **Fixed** with the PR number, and wiring new assets into the game. |

If ChatGPT finds a bug, it should report it rather than fix it, unless it's a problem with its own asset files.

---

## Rules for working together

1. **Never commit straight to `main`.** Make a branch (`feature/<thing>-YYYY-MM-DD` or `fix/<thing>-YYYY-MM-DD`) and open a pull request into `main`.
   Either assistant may merge its own pull request into `main` without waiting for Sofia to approve it. Merging to `main` publishes the change to the live game (Render auto-deploys), so make sure GitHub's automatic tests pass first.
2. **One task per assistant at a time.** Check "Currently in progress" below. If someone is already working on a file area, pick something else or wait.
3. **Be careful with `client/index.html`** (~260 KB, the core game). Prefer adding new features as a new `client/<feature>.js` add-on (see "How add-ons work"). If you must edit `index.html`, say so under "Currently in progress".
4. **Keep the tests passing.** Before opening a PR run:
   ```
   python -m py_compile server.py accounts.py social.py tag_house.py ai_cats.py bot_adventure.py
   for f in client/*.js; do node --check "$f"; done
   CATCITY_LLM_ENABLED=0 python -m unittest discover -s tests -v
   ```
   GitHub Actions also runs these plus the browser smoke tests on every PR.
5. **Never put passwords, tokens or secrets in the repo.** They live in Render environment variables only.
6. **When you finish, add an entry to the Work log** (newest at the top): what changed, which branch/PR, anything half-done, what should happen next.

---

## What the game is

Cat City is a browser game for phone and PC (iPhone Safari and Windows Chrome are the main targets). You play as one of six cats — **Astro, Galaxy, Baby, Harley, Skyler, Pumpkin** — through a **20-quest story** with Birman boss fights (Quests 8, 12, 16 and the **Quest 20 Double Birman Showdown**), plus online rooms for up to 6 players. Hosted on **Render free plan** (`render.yaml`, start command `python server.py`, health check `/health`).

## Code map

### Server (Python, aiohttp)
| File | What it does |
| --- | --- |
| `server.py` | Serves the game files, runs online rooms over WebSocket (`/ws`), 6-letter room codes, max 16 rooms, tracks shared boss HP (`BOSS_STATS`, `tick_bosses`). Every client `.js` file needs a route in `make_app()`. |
| `accounts.py` | Logins and cloud saves. Needs `DATABASE_URL` (Postgres/Neon); without it, accounts return 503 and saves stay in the browser. Owner set by `OWNER_USERNAME` / `OWNER_PASSWORD_HASH` / `AUTH_SIGNING_SECRET`. |
| `social.py` | Room chat with filter, NPC dialogue (built-in, not generative AI), owner admin controls, announcements, events. |
| `ai_cats.py` | Creates the public AI lobbies. |
| `bot_adventure.py` | AI worker cats that gather wood/stone and drop loot. |
| `tag_house.py` | Tag House mini-game (Pause → Play Tag House). |

### Client (`client/`)
- **`index.html`** — the core game: map, cats, shop, saves, cutscenes, boss fights and the story.
  - Story quests: `questNames`, `questGoals`, `EXTRA_PICKUPS`, `EXTRA_STORY`, `questReady(i)`; `QUEST_TOTAL=20`. Quests are numbered from 0 in code (Quest 20 = index 19).
  - Browser save key: `localStorage['catcity_v1']`.
- **Add-ons** (loaded with `defer` at the bottom of `index.html`, in this order): `tag-house`, `world-overhaul`, `storybook-garden`, `public-lobbies`, `social-accounts`, `cave-voice`, `admin-stage`, `adventure-update`, `resource-trees`, `adventure-mining`, `bot-adventure`, `pc-house`, `terraria-inventory`, `tutorial-island`, `ui-layout-polish`, `squishem-art`, `squishems`, `squishem-places`, `event-decorations`, `squishem-museum`, `live-event-adventures`, `adventure-quest-board`, `aurora-atelier`, `hud-layout-fix` (HUD spacing — put new HUD position fixes here), `birman-art` (Birman boss sprites, see `client/assets/BIRMAN-ART.md`; covers brief item 4 for the three Birman bosses only).
- `client/assets/aurora-atlas.svg` — Aurora Atelier sprite atlas (see `client/assets/AURORA-ATELIER.md`).

### How add-ons work
Each add-on is a self-contained `(()=>{ ... })()` that grabs the core engine:
```js
const core = window.__catCityEngine; if (!core) return;
const s = core.state; // the live save/game state
```
To add a new feature: create `client/my-feature.js`, add a route for it in `server.py` `make_app()`, and add `<script src="/my-feature.js" defer></script>` at the end of `index.html`.

### Tests
- `tests/test_ai_cats.py` — server/unit tests (rooms, workers, admin, lobbies).
- `tests/browser_smoke.py`, `squishems_browser.py`, `ui_scroll_event_decor.py`, `museum_events_quests_browser.py` — Playwright mobile Chromium tests (need the server running on port 8765).
- Workflows: `.github/workflows/cat-city-ai.yml` and `adventure-browser-smoke.yml`.

### Other docs
`GREAT_ADVENTURE_ROADMAP.md` (latest release notes, 3 Nov 2026), `AI_CATS_README.md`, `ACCOUNT_AND_CHAT_SETUP.md`.

---

## Status as of 4 November 2026

**`main`** — latest commit 4 Nov 2026: "Document Aurora Atelier art pack…". 20 quests, Aurora Atelier graphics, six-player lobbies.

### Open branches not fully on `main` (need sorting out)
Each has commits not on `main`. Some of the work may already be on `main` in a different form — check the diff before merging, don't merge blindly.

| Branch | Last commit |
| --- | --- |
| `cat-city-accounts-chat-owner-20261102` | 2 Nov — Document durable account database prerequisite and safe owner/chat controls |
| `feature/cat-city-adventure-loot-2026` | 3 Nov — Add automated Python and JavaScript syntax checks |
| `feature/conversational-ai-cats-2026-11-03` | 3 Nov — Release AI lobby host when the last disconnected player expires |
| `feature/full-adventure-bot-update-2026-11-03` | 3 Nov — Fix saved village companion setting for five cats instead of three |
| `feature/great-adventure-update-2026-11-03` | 3 Nov — Add Python, JavaScript and API route smoke checks |
| `feature/squishem-museum-live-event-questboard-2026-11-04` | 4 Nov — Correct expected Adventure Quest Board claim count |
| `feature/squishems-plush-event-worlds-2026-11-03` | 3 Nov — Place Squishem button below Chat and event timer below poll controls |
| `feature/terraria-inventory-world-polish-2026-11-03` | 3 Nov — Correct Python assertion in Bow and ammo browser test |
| `fix/ai-conversation-handsfree-2026-11-03` | 3 Nov — Stop one-shot microphone on close |
| `fix/mobile-stamina-below-hotbar-2026-11-03` | 3 Nov — Mobile stamina-vs-hotbar layout fix |
| `fix/scroll-squishem-guides-event-decor-2026-11-03` | 3 Nov — Safari-supported card scrolling for Squishem directions |
| `fix/six-cats-harley-skyler-pumpkin-boss-toast-2026-11-03` | 3 Nov — Fix iPhone Skyler/Pumpkin tap obstruction |
| `fix/six-player-lobbies-inline-vote-2026-11-04` | 4 Nov — Six-player online and inline-vote browser tests |

### Known issues
- **Talk-to-AI-cats feature is missing from `main`.** `client/ai-cats.js` only exists on `feature/conversational-ai-cats-2026-11-03`, although `AI_CATS_README.md` describes it.
- `client/adventure-quest-board.js` header comment still says "16 Biscuit story quests" — there are now 20.
- iPhone music fix (PR #17) still needs a check on a real iPhone with the silent switch on.
- `README.md` is just "My game" — could use a proper description.
- Chat reports are kept in server memory only and are lost on restart.

---

## Pixel art concept handoff — 4 Nov 2026 (ChatGPT → Claude)

**Owner requested these references be uploaded for Claude to improve. The artwork is DRAFT CONCEPT ART, NOT PRODUCTION-READY SPRITES. Do not wire it into the live game until corrected and approved.** Five full-resolution-in-pixels WebP concept boards are committed under [`client/assets/concepts/`](client/assets/concepts/). See [their README](client/assets/concepts/README.md) for the filenames and limitations.

### Claude: requested corrections and implementation
1. **All six original playable cats:** match approved real-cat appearances, not the invented replacements in some concept sheets. Astro = entirely ginger/orange tabby; Galaxy = ginger with white belly/chest and white paws; Baby = brown/grey tabby, white chest/belly, distinct serious expression; Harley = black-and-white with a pink nose; Skylar = black-and-white with a distinctive **black** nose; Pumpkin = calico with ginger and brown/dark tabby streaks. In code the fifth cat is currently named **Skyler**: owner calls this cat **Skylar**, so confirm and safely update the display name without breaking any existing saved character index. **No private source photos are uploaded.**
2. **Real per-cat animation sheets**, not tiny repeated portraits: each of the six gets full-body front/back/side sprites where needed, plus correctly aligned idle, walk, run, jump, attack, hurt, interact, sit and sleep frames. Consistent size, pivots, frame counts, transparent backgrounds and nearest-neighbour rendering. Avoid mechanically cropping the overview concept pages as if they were tile atlases.
3. **Create Your Own Cat:** add a seventh choice in the *character selection UI* (not a seventh multiplayer participant slot): choose name, coat colours, patterns, ears, tail, eyes and accessories; preview, save and re-edit; render the custom cat with the same animations and equipped gear. Keep six-player multiplayer capacity, existing six character IDs, saved games and boss/quest functionality intact.
4. **Every NPC and quest/boss character needs a full body** and appropriate animation frames, not just a portrait: Marmalade, Pebble, Luna, Biscuit, Forge, **SlayCat (must wear a visible rainbow Pride flag)**, Poppy, Clover, Mochi, Toffee, Pip, Willow, Wranglers, Yarn Ball Birman, Birman Junior and Armoured Birman. Keep each distinct.
5. **Special and ordinary equipment:** include both **Eli-Geode** and **Admin** armour sets and weapons, with readable inventory icons **AND matching equipped-on-cat sprite overlays**. Design all existing weapons uniquely (Wooden Paw Sword, Oak Sword, Blossom Blade, Lily Spear, Crystal Sabre, Venom Fang, plus special/Admin variants); not generic coloured rectangles. Preserve weapon damage and armour mechanics.
6. **Resources and farming:** separate wood item icons for regular/oak, cherry blossom and applicable additional tree varieties, with corresponding logs, planks, inventory display, saplings and three clear world growth appearances: **sprout → young tree → mature tree**. Claude implements planting, timing, harvesting, persistence and multiplayer consistency; ChatGPT supplies artwork.
7. **More decor and all biomes:** additional unique buildings, furniture, lanterns, garden decorations, plants, paths, water, magical props, tiles and effects, each as individually exportable assets instead of miniature contact-sheet thumbnails.
8. **HUD:** sprint/stamina and other UI elements pictured on concept boards are visual references only. Hook the proper sprint bar to the actual stamina value and game controls; art alone does not implement gameplay.
9. **Higher-fidelity output:** owner likes this moderately pixelated style but asked Claude to improve art detail and resolution and correct inaccuracies. Rebuild into aligned transparent sprite sheets / individual images. Test legibility at actual iPhone and desktop game scales; do not merely upscale a low-res composite. Use the concept images for direction, not as the finished shipping atlas.

### Responsibilities and status
- **ChatGPT (completed):** uploaded five illustrative concept sheets plus design/correction instructions; no game source files or deployment changed.
- **Claude (next):** redraw/refine assets, build character customizer and plantable saplings, integrate equipment appearance + NPC/boss sprites, wire sprint UI, and test save/multiplayer compatibility. Coordinate on art changes in this file and the work log.
- **Not approved for release:** these sheets include inaccuracies, repeated/implied animation frames, and small drawings. Keep the existing game sprites until an owner-reviewed replacement is ready.

---

## Player glitch reports (hourly check)
- Players use **🐞 Report a glitch** (Settings and Pause menu, `client/glitch-report.js`): what happened + how it happened (or "I don't know"); game details are attached automatically. Server: `glitch_reports.py` (`POST /api/glitch-report`, owner list `GET /api/glitch-reports`, admin panel "🐞 View Glitch Reports").
- If Render has `GITHUB_REPORT_TOKEN` (fine-grained token, this repo, Issues read/write), every report also becomes a GitHub issue labelled **glitch-report**.
- **Claude checks every hour** (scheduled task): open `glitch-report` issues plus the "Bug reports" section below. Fixes go on a `fix/...` branch → PR → merged after CI passes; the issue gets a comment saying what was fixed and is closed. Reports that can't be reproduced get a comment asking for more detail (the issue stays open).

## Bug reports
_(ChatGPT adds bugs here. Claude moves them to Fixed when done.)_

### Pending: five in-game submissions needing owner report details (5 Nov 2026)
**Source:** Render service `cat-city-online` access logs, five successful `POST /api/glitch-report` calls (HTTP 200). These are **submissions**, not five independently confirmed game bugs. Server logs record timestamps and client type but **not** the players' "What happened?" / "How?" fields. GitHub currently has **zero** issues labelled `glitch-report`; do not invent bug descriptions.

| Time (GMT) | Device | Evidence | Action |
| --- | --- | --- | --- |
| 08:36:16 | iPhone Safari | HTTP 200 report submission | Look for report in owner viewer; may have been lost after the 08:41 redeploy |
| 12:50:14 | Windows Chrome | HTTP 200 report submission | Retrieve actual description from owner viewer; triage |
| 12:51:47 | Windows Chrome | HTTP 200 report submission | Retrieve actual description from owner viewer; triage |
| 12:57:46 | Windows Chrome | HTTP 200 report submission | Retrieve actual description from owner viewer; triage |
| 13:09:05 | Windows Chrome | HTTP 200 report submission | Retrieve actual description from owner viewer; triage |

**Claude action:** Obtain the actual text and automatic context for each report using the **owner-authorized** in-game Admin panel → **🐞 View Glitch Reports** (authenticated `GET /api/glitch-reports`), then replace these placeholders with one specific reproducible report per issue, including device, affected area, actions and symptoms. Mark duplicates/confirmed fixes rather than assuming each submission is unique. The 08:36 report is from **before** the 08:41:20 live redeploy, and report storage is a Python process-local `deque(maxlen=200)`; it may not survive a process restart. If unavailable, ask the owner to supply the text or screenshot.

**Report-pipeline problem to address:** `glitch_reports.py` stores reports only in memory, so a restart/redeploy can erase unmirrored reports. Add secure persistent storage and/or verify the optional GitHub issue mirroring is configured and working before relying on hourly issue checks. Do **not** publish reporter identities, IPs, raw account information or auth tokens in this public file. No corresponding `glitch-report` issues were found during this check.

### Fixed
- 6 Nov 2026 — Glitch reports #59–#71 (branch `fix/glitch-reports-59-71-2026-11-06`), see Work log.
- 4 Nov 2026 — Birman bosses looked generic ("meh"): new pixel-art Birman sprites for all bosses; keyboard help box covered Attack/Jump in boss fights (feature/birman-boss-art-2026-11-04).
- 4 Nov 2026 — HUD overlaps, wrong item count, title text (PR #15); 3 computer cats per room instead of 2 (PR #16); no music on iPhone with silent switch on (PR #17).

## Currently in progress
_(Nothing right now. Write your name, the branch, and which files you're touching. Remove the line when done.)_

## Ideas / next steps (owner to choose)
- Improvement idea: give the other bosses' attacks (yarn throws, shockwaves) matching pixel art to go with the new Birman sprites.
- Decide which open branches to merge, then delete the rest.
- More story after Quest 20.
- Real-device playtest on iPhone Safari and Windows Chrome after deploying.

---

## Work log (newest first)

### 2026-11-06 — Claude: Cat Tok parts 1–4 (staged, waiting for 🚀 Release)
Plan: project doc claude/cat-tok-plan.md. All staged in client/staged/ + manifest (ids cattok-1-phone … cattok-4-news):
- **cattok-1-phone.js:** 📱 button (auto-placed under the right-hand button column, T key), a phone that slides up (full screen on phones), a home screen with Cat Tok + Settings, notifications, swipe-up/home bar. While it's open the game doesn't get keys and you can't be hurt. The phone has class `cc-no-pixel` and its buttons get `data-no-pixel`, so the game's pixel skin and pixel emoji stay off it. API `window.CatPhone`.
- **cattok-2-app.js:** the TikTok-style app (layout from Sofia's recording): feed with snap swiping (arrows/J/K, L likes), LIVE · Cat City · Following · Friends · For You tabs, search, right rail, captions/#tags/sound marquee, double-tap hearts, comments sheet (preset quick comments), share sheet (copy / repost / save / send to online friends via chat), Inbox, Profile (videos/saved/liked grids, 📦 orders hook), 6 starter videos. Canvases are 180 px wide and match the screen's shape. State in localStorage `catcity_cattok_v1`. API `window.CatTok` (addItem, pageHooks.shop/create/orders/profileExtra, inbox(), avatar(), rng(), screenH()).
- **cattok-3-lives.js:** the live engine: `CatTok.addLive({...draw})`, the live room (host pill + follow, viewers, ranking chip, comment stream, joins, floating hearts, comment picker, gift hook `CatTok.gift`, share), scene helpers `CatTok.live.cat/bubble/ticker/studioLight`. `live.inRoom` tells a scene it's open full-screen.
- **cattok-4-news.js:** 📰 Cat City News LIVE (@catcitynews, pinned): anchor Pebble at the CC NEWS desk + reporter Luna's field reports. Stories come from the real game (knockouts, Wrangler defeats, harvests, cooking, releases, admin events incl. raids, boss fights, Mission 3/4, the Village Castle) saved in `catcity_cattok_news`, mixed with everyday stories. Breaking-news banner + ticker.

### 2026-11-06 — Claude: Cat Tok trailer voice lines
- Sofia recorded the 7 trailer lines for Cat Tok part 19 (see the project doc claude/cat-tok-plan.md): `client/assets/voice/k01–k07.m4a` (silence trimmed, loudness evened out). k01 "Cat City… has a new app." · k02 "Scroll. Like. Follow." · k03 "Breaking news from Cat City!" · k04 "Flash sale — only three left! Buy now!" · k05 "Your parcel has arrived!" · k06 "Get sponsored. Get verified. Go LIVE." · k07 "Cat Tok. Out now… only in Cat City!". server.py VOICE_FILE now allows `k`. They're unused until part 19 is built.

### 2026-11-06 — Claude: pixel scenery in every graphics pack
- Sofia's screenshot: Aurora Atelier's hedges/trees/lanterns were smooth vector art. aurora-atelier.js now redraws the SVG atlas once as 34×34 pixel cells (hard alpha, flat colour steps, dark outline) and draws them at whole-number scales; the sparkles are pixel crosses. Storybook Pixel Gardens (storybook-garden.js) does the same with its painted sprites (38×39 cells). Both still use the smooth originals when Settings → Art style is "Classic smooth".

### 2026-11-06 — Claude: the demo website (branch `feat/demo-site`)
- A second Render web service from this repo serves a **demo** version: env `CATCITY_DEMO=1`, build command `pip install -r requirements.txt && python tools/build_demo.py`, start `python server.py`. It rebuilds from main on every deploy.
- `tools/build_demo.py` copies client/ → demo/ (git-ignored): strips all comments (tools/jsstrip.py), changes the biome rule so there are only 4 biomes (Cherry, Marsh, Moonstone/Flower Terrace, Poison; no wild land), adds "DEMO" to the title and HUD, ships an empty staged manifest, and **fails the build** if anything still mentions AI/Claude/ChatGPT or the main site's address. The server in demo mode serves demo/, has no 🚀 Release update, uses the same 4-biome rule for bot drops (bot_adventure.py), and titles glitch issues "🐞 Glitch report: [demo] …".
- Everywhere (main too): AI wording players can see is now "helper cats" / "bot" (e.g. "Bot Crew" rooms, "bot votes"); JSON keys aiRoom/aiBots/aiBotRoles/aiTotal/aiVotes → crewRoom/crewBots/crewBotRoles/botTotal/botVotes. Bot players stay labelled as bots on purpose.
- When you add new client text, don't write "AI" in anything shipped to players, or the demo build will stop.

### 2026-11-06 — Claude: update requests #63 and #67 (staged, waiting for 🚀 Release)
- **#63 The Village Castle** → `client/staged/u63-village-castle.js` (id `u63-village-castle`). 🛡️ Security (Village Tycoon, localStorage `catcity_tycoon_v1`) builds castle walls around the village, level 10 = top level (Sofia chose 10). Reaching 10: a dialog asks you to go to bed in a home, otherwise after 60 s you get sleepy and fall asleep. You wake up in the castle (`vc-hall`) with throne, banners and royal bed; stairs go to `vc-top`, where "🔭 See the view" opens a 3D first-person view over the village and biomes (drag / ◀ ▶ / arrows, "Stop watching"). The hall door leads out of the south gate; later the gate-tower door lets you back in. State: `s.villageCastle {done,pending}`.
- **#67 📸 screenshots in glitch reports** → server `glitch_screens.py` (live straight away, Sofia OK'd): `POST /api/glitch-screenshot` (JPEG ≤ 180 KB, only for your own report sent in the last 15 min), `GET /api/glitch-screenshots` + `/api/glitch-screenshot/{id}` (owner). Copies go to the `glitch-screenshots` branch (never main) and are linked on the report's issue. Client staged `client/staged/u67-report-screenshot.js`: 📸 button + preview in the report form, "📸 Screenshot + report a glitch" in Pause, thumbnails under 🐞 View Glitch Reports. Tests: tests/test_glitch_screens.py.
### 2026-11-06 — Claude: glitch reports #59–#71 (branch `fix/glitch-reports-59-71-2026-11-06`)
- Recent error `Cannot read properties of undefined (reading 'toLowerCase')` (in #68–#71): Chrome sends key events with no `key` (autofill). All key handlers now use `String(e.key||'')`.
- #60/#61 can't attack on computer: castle missions now show the ⚔️/🐾 buttons and a key hint on computers, and a left click attacks; Space now attacks camp Wranglers (world-overhaul.js) and infected kitties too; the help box says "Space: ⚔️ attack".
- #59 Admin Panel ticked but shut: the mission buttons' "close settings" helpers removed `.open` from `#cc-admin-tools`. They skip it now, and social-accounts.js re-opens it while the box is ticked.
- #62 Mission 4: the Admin now waits outside the Cosy Cat House for the whole mission (talk to him for shard progress) and is drawn at a proper size (he was ~10 px).
- #64 Biscuit missing: after Mission 2 he leaves on purpose (story); his spot now says "📜 Biscuit left a note". #69: the glowing pawprint trail only shows until you've ridden the No Return taxi; after that just the taxi + arrow.
- #68 walking through buildings: village buildings, the three homes and the Squishem Museum are solid now (village-interiors.js `SOLID`, `window.catCitySolidAt`). Doors still work.
- #70 caves: the Event Desk, quest board, Birman portals, Mission 4/raid things, side-quest markers and the coconut hint no longer show inside caves; the cave EXIT is pixel art.
- #65 Pixel/Classic switch: Classic smooth now also turns off the pixel UI skin (`cc-no-pixel-ui`), so it visibly changes.
- #71 owner report cooldown: the verified owner account can send 40 reports per 10 min (guests still 4). Tests in tests/test_glitch_reports.py.
- Left open: #66 (pixel versions of the other graphics packs = art job for Sofia to choose), #63 and #67 (update requests, see comments there).

### 2026-11-06 — Claude: global UPDATE! cutscene (branch `feat/update-cutscene`)
- When the owner presses 🚀 Release update, every player in the game sees `client/update-cutscene.js`: a 3D fly-over of the village with everyone standing still → a giant "UPDATE!" in the sky → it explodes into "NEW MISSION ADDED!" / "NEW EVENT!" / "NEW UPDATE!" plus the titles. It waits if the player is in a boss fight or a mission. Players who join later don't see it, they just have the update.
- Staged manifest entries now have `"kind": "mission" | "event" | "feature"` (picks the words).
- **Events/missions should break straight out of the cutscene:** the staged script registers `window.catCityOnRelease = window.catCityOnRelease || {}; window.catCityOnRelease['<id>'] = () => { /* start the event's own cutscene / show the mission */ };`, which runs right after the UPDATE! cutscene ends (only on the release, not for later joiners).
- Release checks are now every 10 s. The owner's card has "🎬 Preview the update cutscene (only me)".

### 2026-11-06 — Claude: staged updates + 🚀 Release update button (branch `feat/release-button`)
- **Rule from now on for the owner's in-game update requests:** don't put them straight into the live game. Build each one as a *staged* add-on script `client/staged/<id>.js` (id like `u57-purple-hat`: lowercase, digits and dashes) and add it to `client/staged/manifest.json` → `{"id","title","issue","files":["<id>.js"]}`. It only loads once the owner presses **🚀 Release update** in the admin panel. Then it loads for everyone within 20 s, without moving or reloading anyone, and stays for good.
- If a change really must edit existing files, guard it with `window.catCityReleased('<id>')` and switch it on live on the `catcity:release` event (`detail.ids`). Server-side changes can't be staged: say so on the issue.
- `releases.py`: `GET /api/release` (released ids; the owner also gets staged + history), `POST /api/release` (owner only, releases everything in the manifest that's not released yet), `GET /staged/{file}`. The released list is stored in a GitHub issue "🚀 Cat City releases" (marker `cat-city-releases-store`, same GITHUB_REPORT_TOKEN) so it survives redeploys, with a local `release_state.json` fallback. Tests: tests/test_releases.py.
- `client/release-loader.js`: polls, loads released scripts, shows a "✨ New update" banner, and the owner's "🚀 Updates waiting" card (with "🧪 Try (only me)" and a double-tap Release button) under "Request an update".

### 2026-11-06 — Claude: tidier admin panel (branch `fix/admin-panel-layout`)
- cozy-update.js `adminLayout()` moves the story mission buttons (from taxi-escape.js `#cc-admin-castle` and `#cc-admin-cozy`) into a `#cc-admin-missions` card at the very bottom of the owner tools, grouped Mission 1 / Chapter 2 / 2 / 3 / 4 / Reset in a 2-column grid. Test tools (test raid, new daily jobs) go in a separate `#cc-admin-testing` card above the reports. The old boxes stay in the page hidden, so taxi-escape.js doesn't add them again. New mission buttons: add them to a group in adminLayout().

### 2026-11-06 — Claude: the cosy update (branch `feat/six-features`)
New `client/cozy-update.js` (route in server.py, script tag after playtest-features.js):
- 🍲 Cooking: harvests now go into `s.pantry` (3 per plot, +2 🐟). Cook at the pot below the Village Garden, the cauldron in homes or the Golden Villa kitchen (`window.catCityCook`). Snacks are kept in `s.snacks`, eaten with the 🍲 Snacks button. You can also sell crops. Seasonal crops (real calendar) live in playtest-features.js CROPS: strawberry/sunflower/mushroom/snowberry.
- 💾 Mission 4 "The Broken Panel" (`s.m4`): after Mission 3 a letter from the Admin arrives. There are 4 code shards (cherry/marsh/moonstone/poison chunks, `findChunk(b,1)`), each guarded by 2 glitch Wranglers. Hand them to the Admin outside the Cosy Cat House → pixel cutscene (Admin, panel reboots, the Boss alone in the empty castle holding the picture, Biscuit "He kept the picture…", Admin "Not today… one day, maybe"). Ends "To be continued". Admin panel buttons: letter / give shards / ending / reset.
- 🏡 Homes: 📒 catalogue (lectern) in every home: 6 furniture slots, 2 wall slots and one pet per home (`s.homeDecor`). village-interiors.js now calls `window.catCityHomeExtras` and exports `homeItems/floor/walls/roomId`. Visits: the client sends `{type:'set_home'}`; the server keeps only known ids (`clean_home`, tests/test_home_visits.py) and puts `home` in `Player.public()`. "Visit a friend's home" is in the catalogue and Pause.
- 📅 Daily jobs (`s.daily`): 3 a day picked from the date, +25 🐟/+20 XP each, streak bonus 40×streak (max 7). Shown in the HUD, panel in Pause. Wrangler defeats fire `catcity:wrangler-defeated` (world-overhaul camp guards + new enemies).
- 🧶 Wrangler Raid: the existing owner event `wrangler_raid` now has gameplay in the village: 3 waves (5/7/9), ⚔️ button or Space, +6 🐟 each, +120 🐟 +100 XP when all three waves are beaten (`s.raidsWon`). Admin "Test raid" is local only.
- 🔔 Sound effects (`window.catCitySfx`, Settings toggle) and new songs garden / home / raid via `window.catCityMusicHint` (soundtrack.js theme()).

### 2026-11-05 — Claude: playtest wishlist (branch `feat/playtest-wishlist`)
- New `client/playtest-features.js` (route in server.py, script tag in index.html):
  - ❤️ Always-on hearts (6, +1 per 3 armour points up to 9). Wranglers (camp tackle 1, village Wrangler catch 2) and infected-kitty bumps call `window.catCityHurt(n, why)`. Hearts regenerate (every 4 s at home, 12 s elsewhere, after 8 s unhurt). At 0 → knocked out, wake at home with full hearts, fires `catcity:knockout` with `{world:true}`. Shown in the HUD (`catCityHealthHud`) and the phone mini-HUD.
  - Clearer prompts: any "E / 🐾 · …" canvas label becomes a big yellow chip (desktop bottom, phone above the hotbar) and the 🐾 button glows. The engine's old dim "E · Talk to" box is hidden.
  - 🎨 Settings → Art style: Pixel (default) / Classic smooth (cat-art-wire falls back to the original cats; `window.catCityArtStyle()`).
  - 📘 How to play guide (7 pages), opens once after the tutorial, plus Settings and Pause buttons. `s.guideSeen`.
  - 🌱 Village Garden: 6 plots on the grass west of the Adventure Guild (world 42,726). Carrot/catnip/pumpkin; watering doubles growth for 2 min. `s.farm`.
  - ❕ Side quests: Marmalade (3 Rosy Petals), Pebble (3 lore spots), Luna (Coconut Flower), Forge (Wrangler loot), SlayCat (harvest 3 crops). `s.sideQuests`. Options include "💬 Just chat" to reach the normal NPC menu.
- world-overhaul.js: Wranglers now guard every Poison Wastes chunk (nearCamp radius 420, no camp-hash check).
- PC drag-and-drop in the backpack already worked (checked: drag slot 1 → slot 26 moves the item, the top row is the hotbar).
- Next: re-record the trailer shop-menu and Admin Birman shots without UI.

### 5 Nov 2026 — Claude — Mission 3 cutscenes (branch `feat/m3-cutscenes`)
- 3D cutscenes in taxi-escape.js: `m3leave` (Biscuit sneaks out at night, looks back, c04), `m3intro` (throne room: Biscuit stands up to the Boss, he rises), `m3admin` (phase 3: glitch, purple portal, the Admin steps out, c06, power), `m3welcome` (village NPCs run over and cheer, confetti). Skip works on all of them; a boss knockout restarts the fight without the intro.

### 5 Nov 2026 — Claude — lore, NPC story lines, Missions 2 and 3, Birman Biscuit companion (branch `feat/birman-missions-2-3-lore`)
- Lore spots (taxi-escape.js `LORE`): 8 things to find in the biomes (statue, carved cherry tree, paint pots, memorial bench, Wrangler orders, missing poster, wrecked taxi, the Admin's note). Saved in `s.loreFound`, +15 XP each.
- NPCs react to the story: index.html npcTalk now uses `window.catCityNpcLine(id)` (lines change after the castle mission, Mission 2 and Mission 3).
- Mission 2 "The Locket": 30% chance after a boss-fight knockout (index.html koTick fires `catcity:knockout`) once the castle mission is done. Boss Birman POV: scratches Biscuit's locket picture, you order 4 Wrangler squads, hijack the admin console, press SEND BISCUIT TO ME, your paw glitches, the Admin takes it back (c05). Rewards 150 fish, 100 XP.
- Mission 3 "No Return": Biscuit's note at his spot (c04) → glowing pawprints to a black No Return taxi in a poison chunk → 3D ride (c02) → broken fortress climb (falling bridges, jump pads, moving platforms, Wranglers) → 3-phase Boss Birman fight with Biscuit (zaps, c07), Wrangler waves (c01) and Admin power (c06, 3× damage) → 3D locket cutscene (picture snapped off, tears, everyone looks, he crushes it) → flight home (c08). Rewards 500 fish, 400 XP.
- Afterwards Biscuit follows you as a small Birman (`s.biscuitFollow`, Settings toggle); the village NPC sprite is hidden while he's away or following (`catCityArtAlias` can return `{hide:true}`, cat-art-wire.js).
- Owner tools in the admin panel: play Mission 2, Mission 3, Mission 3 boss; reset clears everything. Music: The Locket / No Return / Locket Breaker.

### 5 Nov 2026 — Claude — owner update requests (branch `feat/owner-update-requests`)
- New `update_requests.py`: `POST /api/update-request` (owner account only, via `accounts.require(admin=True)`; 6 per hour) turns Sofia's request into a GitHub issue titled "🛠️ Update request: …" with marker `cat-city-owner-update-request`, using GITHUB_REPORT_TOKEN. `GET /api/update-requests` lists recent ones (owner only). Tests: tests/test_update_requests.py.
- Admin panel (glitch-report.js): "🛠️ Request an update" box under the glitch reports.
- Claude's hourly scheduled task now builds open update-request issues (and finds glitch reports by title, because the token can't attach labels), merges after both checks pass, comments and closes the issue.
- Render auto-deploy from main isn't firing (deploys since this morning were started manually through Render). Sofia needs to check Render → cat-city-online → Settings → Build & Deploy (auto-deploy on commit, GitHub repo connected).

### 5 Nov 2026 — Claude — glitch reports #46 and #48 (branch `fix/glitch-reports-46-48`)
- #48 mission music kept stopping and starting: tv-glitch.js resets `catCitySoundtrackOverride` every 700 ms, which fought the mission setting it every frame. Missions now use their own `catCityMissionMusic` (checked first in soundtrack.js theme()).
- #46 companion cats glided without walking: wandering companions move at ~20–45 px/s, under the 32 px/s walk threshold in cat-art-wire.js. Threshold lowered to 14 (stop below 8).

### 5 Nov 2026 — Claude — castle mission feedback fixes (branch `fix/castle-feedback-2026-11-05`)
- Admin's head was cut off in the pause cutscene on phones: the window/board/door now fit the screen width, and his picture is scaled to fit inside the window.
- Everything in the mission is now pixelated: the mission canvas draws at ~400 px on the short side and is scaled up with hard pixels (taxi-escape.js `fit()`), Z fixed at 2.
- Start-up voice line ("You think you can catch me?"): voice-lines.js unlocked audio by playing w02 muted, which some phones played out loud. It now unlocks with a silent clip.
- Mission music (soundtrack.js): Castle of Whispers, Floating Isles, The Locket, No Return, Locket Breaker. taxi-escape.js sets `catCitySoundtrackOverride` per scene.
- Next: lore spots in the world, NPC story lines, Mission 2 (Boss Birman POV, 30% after a knockout once the castle mission is done), Mission 3 (Biscuit's note → No Return taxi → fortress climb → 3-phase Boss Birman fight → locket cutscene → Birman Biscuit companion, toggle in settings).

### 5 Nov 2026 — Claude — Castle mission Chapter 2 + voice lines (branch `feat/castle-chapter-2-2026-11-05`)
- Sofia's voice lines added as `client/assets/voice/c01–c08.m4a` (server VOICE_FILE now allows `c`): driver, "In ya go", Boss Birman "Well, well, well… what has the cat dragged in", Biscuit "I'm sorry" / "I've got ya" / "Hold on tight, we're going home", Admin "Not so fast" / "Nope, not today".
- Chapter 1 now runs straight into Chapter 2 (title card): abyss with Biscuit whispering → 3D wake-up whose camera copies Sofia's phone clip (no footage used; she asked for none of her room) → WHERE ARE YOU BISCUIT board → Boss Birman glitches, Admin pauses him through the window, breaks out, 1s and 0s → castle splits into floating islands → 7 islands with jump pads (Wranglers on islands 3 and 5) → island 6 crumbles → powered Birman Biscuit saves you and flies you home (3D) → Admin POV: panel breaks, returns, flies away over the biomes → end.
- Saves `s.castle.stage`/`island`; players who had finished the old Chapter 1 resume at Chapter 2. Rewards: Ch1 500 fish + 300 XP, Ch2 300 fish + 200 XP. After Ch2, village Biscuit is drawn as a small Birman (`window.catCityArtAlias` hook in cat-art-wire.js).
- The admin character is "he".

### 5 Nov 2026 — Claude — 🚕 Taxi stops + Birman Castle escape, Chapter 1 (branch `feat/taxi-castle-escape-2026-11-05`)
- New `client/taxi-escape.js` (route in server.py, script tag in index.html).
- Taxi stops in about half the wild chunks; E / 🐾 → ride home. 25% chance (until finished) starts the mission instead.
- Mission: 3D taxi POV cutscene (biomes → hundreds of Wrangler camps → hooded driver is a Wrangler, catnip club) → Birman Castle jail escape in 8 rooms (hairpin + lockpick, stealth patrols with view cones, armies of 5–15, kitchen lever, armoury trap, courtyard levers + gate guards, Family Tree Gallery → 3D Biscuit painting cutscene (paint drips off, Biscuit is a Birman, painting changes) → cameras turn → army) → 3D Great Hall cutscene based on Sofia's Dummy 13 photos (admin dragged in by purple + gold Wranglers, thrown, Boss Birman punches you, smashes the admin panel, ringing) → "To be continued".
- Saves per room in `s.castle`; Give up keeps the checkpoint. Rewards once: 500 fish, 300 XP, Wrangler Crook (+1 damage in the castle).
- Owner admin panel: jump to room, play from taxi cutscene, force next taxi = mission, reset.
- Next (Sofia's story, Chapter 2): ringing → realistic wake-up cutscene (Sofia will record a video), black abyss with Biscuit whispering "I'm sorry", room with "WHERE ARE YOU BISCUIT" written everywhere, Birman glitches and the admin pauses him through glass, 1s and 0s, castle breaks into islands, jump pads, island crumbles, powered-up Birman Biscuit saves you and flies you home, admin POV: panel breaks then returns and he flies away over the biomes; back in the village Biscuit is a small cute Birman. The admin character is "he".

### 5 Nov 2026 — Claude — glitch reports now survive restarts (branch `fix/glitch-reports-persist-2026-11-05`)
- ChatGPT found 5 report submissions in Render logs (08:36 iPhone; 12:50, 12:51, 12:57, 13:09 Windows) that never reached GitHub (no `GITHUB_REPORT_TOKEN`) and were only in server memory.
- `glitch_reports.py` now also saves every report to Postgres table `catcity_glitch_reports` (same DATABASE_URL as accounts) and the owner viewer reads from it, so redeploys no longer erase reports. The viewer says if the database or GitHub mirroring is off. Tests in `tests/test_glitch_reports.py`.
- Merge only after the owner has copied the current in-memory reports (a merge redeploys and wipes memory).

### 5 Nov 2026 — Claude — playtest fixes (Pocket playtest recording, branch `fix/playtest-feedback-2026-11-05`)
- "Woodwind" label in the Flower Terrace = the area banner still used old zone names ("North Woodland"); it now uses biome names (index.html `currentRegion`).
- Movement felt laggy when changing direction: the follower-cat smoothing (cat-art-wire.js) also delayed your own cat ~0.25 s; your cat now turns instantly, followers stay smooth.
- UI overlap on public servers (computer): the HUD grew (level line) over the stamina bar and the room badge. Desktop left column now stacks only when boxes really overlap (hud-layout-fix.js), smaller HUD text on 761–1100 px windows. Checked online-mode boxes at 800×600 to 1920×1080: no overlaps.
- Balance: Admin Birman God Mode 30→15 s, phase 3 one circle per wave, ban hammer every 13 s with 3 circles and longer warnings; infected kitties chase 88→60; Wranglers move smoothly at 115 px/s (were ~19 px/s in steps) and notice you from 320 px; Coconut Flower bigger with a light beam, label and "nearby" hint.
- Not done (features, for Sofia to choose): reward side quests, separate pixel/non-pixel graphics packs, tutorial covering attacks/story, permanent health bar in the main game, Wranglers in every poison area, PC drag-and-drop inventory, farming, "Taxi Biome" fast travel.

### 5 Nov 2026 — ChatGPT — new in-game glitch submissions audit
- Checked Render access logs for 4–5 Nov: five successful report submissions on 5 Nov, at 08:36 iPhone and 12:50, 12:51, 12:57, 13:09 Windows. Checked GitHub `glitch-report` label: no issues.
- Recorded five submissions as **pending triage** in Bug reports, with exact GMT times and owner-viewer steps. Request bodies are not present in logs, and the authenticated owner report viewer is not accessible via the connected Render/GitHub tools, so descriptions were **not fabricated**.
- Identified reliability issue: reports are stored solely in process memory and can disappear on redeploy; asked Claude to investigate persistence/GitHub mirroring. No gameplay code changed.

### 5 Nov 2026 — Claude — Birman voice lines not playing (branch `fix/birman-voice-lines-2026-11-05`)
- Cause: each Birman line made a new `<audio>` in the middle of a cutscene; phones (iPhone especially) block sound that doesn't start from a tap.
- Fix: `client/voice-lines.js` (`catCityVoice.play(id)`) decodes and plays w01–w05 through the game's Web Audio context (unlocked by the first tap, same as the music) and preloads them; falls back to one shared `<audio>` unlocked on the first tap. admin-birman.js and birman-takeover.js use it.

### 5 Nov 2026 — Claude — reload replaying the Birman message; Baby Squishem outside Admin Abuse (branch `fix/reload-birman-message-baby-2026-11-05`)
- Cause: the server keeps the last global announcement for offline players, so reloading replayed the Birman Family's glitch message; and Admin Abuse never ended by itself, so a forgotten Birman Takeover kept the stage "active" (Baby Squishem spawns while it's active).
- Fixes: announcements play once per device (`catcity_seen_announcements`) and never if older than 3 minutes (`freshAnnouncement` in social-accounts.js; scoped replays on join now carry id/at). Admin Abuse switches itself off after 3 hours (`SocialService.expire_stage`, checked on every world-state poll); ending it clears a Birman/owner-named announcement. New "👑 Admin Abuse is on" chip (admin-stage.js) so it's visible when it's running. Announce response now returns the id so the owner's own banner doesn't repeat. Tests in `tests/test_birman_takeover.py`.

### 5 Nov 2026 — Claude — levels, fair bosses, owner skip; announcement fixes (branch `feature/levels-boss-balance-2026-11-05`)
- **Levels** (`client/levels.js`): XP from mining 8, chopping 6, pickups 5, lucky blocks 10, crafting 6, healing kitties 25, main quest steps 40, boss wins 60–150 (not practice). Need `60·level^1.4` XP per level; level-up gives 10 fish × level. Shown in the HUD (`catCityLevelHud`). `s.level`, `s.xp`.
- **Fair bosses**: at boss start, HP (and attack rate) scale by `catCityLevels.balance(chapter)` = level part (expected level 7:3, 11:6, 15:9, 19:12, 99:8) × weapon part (expected sword damage 2.5/4/5/6/3), min 0.4, never above 1. Not applied to online co-op Birmans (server-shared HP); always applied to the Admin Birman. `bossConfig[ch].baseHp`/`baseInterval` keep the originals; `BOSS_JUNIOR_HP` is now `let`.
- **Owner tools**: admin panel boss list has 🎭 Admin Birman (server `boss_travel` accepts 99); "⭐ Set my level"; in practice fights the owner gets "⏭ Skip to end" (`BAPI.skipToEnd`; Admin Birman goes straight to the ending cutscene).
- **Announcements**: offline players polled world state every 17 s, so global messages arrived late — now 4 s, and the owner sees their own message straight away. Added a test that a "This Server" announcement reaches that room only (`tests/test_birman_takeover.py`).

### 5 Nov 2026 — Claude — Admin Birman made fairer (branch `fix/admin-birman-easier-2026-11-05`)
Sofia: the Admin Birman was far too hard. Main cause: red circles kept spawning during God Mode while it chased you into a corner, so they were impossible to dodge. Now: no circles during God Mode / its panel / the vacuum (`catCityBossMod.quiet()`); HP 260→180; 1 circle per wave (2 in phase 3), every 2 s, 1.6 s warning; 9 hearts; God Mode chase slower than you and stops before bumping, once per 35 s; ban hammer every 10 s with 4 circles; teleport arrival warning 1.6 s; AI helper cap 25%→35%. A scripted test player with a wood sword and simple dodging wins in ~100 s with 4/9 hearts. `BAPI.marks` exposed for tests.

### 5 Nov 2026 — Claude — sprint fix + glitch reports (branch `fix/sprint-glitch-reports-2026-11-05`)
- Sprint double speed: sprint now only stays on while the finger that pressed it is down; releases are caught anywhere on the page (iPhone could miss the button's own release, leaving sprint stuck on so a second press stacked). Quick taps no longer throw.
- 🐞 Glitch reports added (see "Player glitch reports" above). Tests: `tests/test_glitch_reports.py`.

### 5 Nov 2026 — ChatGPT — Render deployment verification for Giant Pixel Update #31
- Deployed GitHub `main` commit `c128714e97f300cc0923438f030abfda3217ea17` (PR #31) to Render service `cat-city-online`. Deployment `dep-dbm2tr49v7es738ndva0` reached **live** at **07:24:05 GMT**.
- Verification: GitHub's adventure/worker checks and PR browser smoke checks completed successfully. Parsed the new runtime JavaScript modules and all 15 nonempty inline HTML scripts without JavaScript syntax errors. Checked new asset JS routes exist in `server.py`.
- Render build succeeded, server started, homepage requests returned **HTTP 200**, and the post-deploy logs examined contained no tracebacks or reported HTTP errors.
- **Bug reports:** no **confirmed** new glitches discovered in these checks; no speculative entries added. Real iPhone Safari/Windows browser gameplay, account saves, events, boss mechanics, sound and multiplayer were **not manually playtested by ChatGPT**; issues found in those sessions should be added to **Bug reports** with reproducible steps for Claude.
- Documentation-only handoff; no game code, save data or asset modifications by ChatGPT.

### 5 Nov 2026 — Claude — GIANT PIXEL UPDATE released (PR #31, branch `update/giant-pixel-update-2026-11-04`)
Everything below went live together. Full test pass done on phone and desktop sizes; CI green.
- Pixel font "Cat City Pixel" (`client/assets/fonts/`, built by `build_font.py`) used for all page and canvas text.
- Pixel emoji (`client/pixel-emoji.js`): ~60 hand-drawn plus automatic pixelation for the rest, page and canvas.
- Pixel floors (`client/pixel-floors.js`): 12 floor kinds (town, wild, cherry, poison, marsh, moonstone, terrace, path, sand, cave, wood, arena), 4 variants each, used for every biome chunk and the village roads in `world-overhaul.js`. Cave, arena and indoor floors still need hooking up (wave 5).
- Pixel Squishems: `squishem-art.js` now builds every plush on a 32×37 pixel grid with pointy ears and an outline (world, museum, carry), plus `catCitySquishemArt.url(id)` portraits used for Squishems in the backpack and hotbar.
- Glitch fix: companion cats (Galaxy, Baby, Harley…) flipped left/right and swapped poses every frame. `cat-art-wire.js` now uses a slow-averaged velocity plus hysteresis (turn after 220 ms, pose change after 250 ms, stop after 150 ms).
- Floor loot (`adventure-update.js`) is drawn with its own pixel item icon instead of a generic emoji.
- Cat lucky blocks (`client/lucky-blocks.js`, wired in `adventure-mining.js`): winged pixel cubes with cat ears and whiskers; colour = rarity, fixed per spot. Common grey 50, Uncommon green 25, Rare blue 13, Epic purple 7, Legendary orange 3.2, Mythic red 1.3, Impossible black 0.08 (weights; event luck boosts non-common). Admin blocks only during Admin Abuse; Playtester blocks only when the owner ticks "🧪 Is this a playtester admin abuse?" (admin panel, sent as `playtester` → `SOCIAL.stage.playtester`). Rewards are tier gear matching the rarity; new Playtester tier hits for 15. TV Glitch block (between Uncommon and Rare): old TV with animated static, only spawns while the event named `tv_glitch` is active, gives Glitched gear (tier `glitched`, 5 damage — adjust when the TV Glitch event is built).
- Wave 5a: pixel biome decor (`pixel-decor.js` sprites + pixel trees) replaces the circles/blobs in `world-overhaul.js` `pixelBiome()`; positions and Wrangler camps unchanged.
- Wave 5b: pixel village buildings (`catCityDecor.drawBuilding`, per-building touches), pixel mining rocks/gems, whole village floored with town grass, biome decor kept off the village.
- Boss fixes (Sofia, 4 Nov): circles only hurt inside their drawn edge (was +11 px), bumping the Birman has its own message (it looked like an early circle hit). Pixel arena floor. `.pxe` forced inline (the boss box's `span{display:block}` stacked the emoji).
- Bow everywhere (`client/bow.js`): visible arrows in boss fights and the main game, Wranglers can be shot from 360 px, first bow comes with 10 arrows (`s.bowQuiverGiven`).
- Knockout scene (index.html `koAt`, `drawKnockout`): stars spin round your head, you sway, curl up asleep with Zzz, fade to black, wake in the village with a Retry box. Boss frozen and controls ignored during it.
- Boss intro cutscene (index.html `introAt`, `drawIntro`): every boss fight, practice mode too. 3.3 s Mode-7 style 3D: camera starts at your cat's paws, sweeps left and diagonally up to over-the-shoulder with the boss(es) behind, boss name, white flash into the fight. Bosses, circles and controls frozen until it ends; body class `cc-boss-intro` hides the page UI.
- Admin Abuse stage removed (Sofia: Admin Abuse = the owner running events). `admin-stage.js` now only syncs `catCityAdminStageState` (still used by lucky blocks, Baby's Squishem, the takeover). Server stage fields kept for compatibility.
- **Birman Takeover** (`client/birman-takeover.js`, `social.py` `_birman_takeover`, test `tests/test_birman_takeover.py`): owner ticks "🎭 Birman Takeover" and starts Admin Abuse. The owner's first 3 global announcements show as "<username>: text"; then the server sends "Here we go…" (cuts off), the box glitches and The Birman Family announce the takeover (`stage.takeover.phase='taken'`). Everyone gets a 3D cutscene (paws → armoured cat with sword; 2, 3, 4, then all six; they charge past the camera; camera turns to the portals). Four Birman portals open around the village; entering one starts a practice-rules Birman fight with the unplayed roster cats as AI helpers (`catCityArenaAllies`, offline only, 1 dmg every 3.5–6 s each, capped at 25% of the boss's health in total).
- **Admin Birman** (`client/admin-birman.js`, boss chapter 99, hooks `window.catCityBossMod` + `window.catCityBossAPI` in index.html): the Birman Takeover portal boss. P1: hit it → it jumps back, unrolls its admin panel on the floor like a carpet, presses "Temporary God Mode · 30s" (immune, chases faster). P1→2 point-of-view cutscene, it presses Teleport; P2 teleports every 6 s for 30 s then rests 30 s. P2→3 angry POV cutscene typing /knockout (knocks out the AI teammates only; with 6 real online players and no bots it presses "Vacuum to Village" instead: 12 s pull, sucked in = back to the village). P3: ban-hammer lines of circles every 7 s. End cutscene: the owner's catified PNGtuber drops in, reaches up as the energy races back, says "Well, I'll be taking that back." (`client/assets/voice/w01.m4a`, trimmed), leaves through a portal; a portal opens under the team, they look down ("!"), fall through and land in Cat Village. Fights are local (not server-synced); AI helpers also work online for chapter 99. Voice route now allows `[tvw]NN.m4a`.
- Wave 5c: pixel Squishem museum + Event Desk, pixel cave floor, pixel UI skin (`client/pixel-ui.js`: notched square corners, bevels and press-down buttons for every button and the main panels, made with box-shadows so nothing moves; opt out with `body.cc-no-pixel-ui`). Furniture in interiors was already pixel art.
- Wave 5 complete (buildings, decor, trees, floors, rocks, lucky blocks, Squishems, UI skin).
- Owner custom polls: admin panel "🗳️ Custom poll (owner)" → `custom_poll` (question + 2–4 choices, 90 s, AI cats vote randomly, result announced, no event starts). Same vote card (`bot-adventure.js`) shows the question and choices.
- No sword = 1 damage, plus sword/armour material tiers (`client/gear-tiers.js`): no sword 1, Wood 2, Stone 3, Iron 4, Steel 5, Titanium 6, Crystal 7, Emerald 8, Diamond 9, Amethyst 10, Eli-Geode 12, Admin 20. Forge recipes (Sword/Helmet/Chestplate/Boots for each material) sit in the backpack's Crafting section. Iron drops sometimes when mining stone. Boss HP rescaled to 70/120/180/240, junior 140 (index.html `bossConfig` + server.py `BOSS_STATS`). Online `boss_hit` sends `power`; the server clamps it to 1–28. Armour tiers add to the block chance. Each tier has its own icon colours in `item-pixel-art.js`.
- Original Terraria-style soundtrack (`client/soundtrack.js`): look-ahead synth (pulse lead, triangle bass, arps, pad, noise drums) using world-overhaul's audio context/switch/volume (`window.catCityAudio`). 11 original 8-bar songs: menu "Cat City Theme", town "Whisker Lane", explore "Over the Next Hill", cherry "Petal Breeze", marsh "Lily Pads", terrace "Blooming Steps", poison "Toxic Bog", cave "Crystal Echo", battle "Claws Out", finale "Showdown Waltz of Yarn" (128 BPM, no drums, the finale beat plays on top), takeover "Admin Abuse". `catCitySoundtrackOverride` forces a song (for the TV Glitch event); `catCitySoundtrack.render(name)` renders offline.
- TV Glitch event (`client/tv-glitch.js`, event name `tv_glitch` in social.py + admin/poll selects): 6 big pixel TVs (static screens, antennas, LIVE light) around the village and wild; E to jump inside (a TV-studio room added via `catCityInteriors.addRoom`), each TV's glitch chest gives a missing Glitched piece (tier `glitched`) + 15 fish, so 4 TVs = full set. TV Glitch lucky blocks spawn during it. Music: original "Static Showtime" (`static_event`, 132 BPM, game-show stings + static) during the event; after it, owning the full set plays the instrumental (`static_reward`) instead of normal music unless the Settings switch "📺 Play Static Showtime…" (`catcity_glitch_music`) is off.
- Infected kitties (`client/infected-kitties.js`): up to 2 per chunk, never within 50 tiles of the village rectangle; green tint, spots, coughing; chase and bump (−2 fish). 💚 Heal (uses a Coconut Flower: sparkle, "Thank you! I feel so much better!", +25 fish + gear or flowers, wanders off) or ⚔️ Fight (tier damage, bow from range; faints, +8 fish). E = heal if you have a Coconut Flower else fight; F = fight. Back after 25 min (`s.kittyState`).
- Moonstone Hills removed (Sofia, 4 Nov): that biome slot is now the **Flower Terrace** on screen (terrace floor, grass ledges, flower beds, blossom/magic trees, a few amethyst/crystal outcrops so forge tiers still work). The internal biome key is still `moonstone` everywhere (saves, mining, Squishems, bots) — don't rename it.
- Flower Terrace content (`client/flower-terrace.js`): Rosy Petal, Bluebell, Sunpetal, Lavender (12 per terrace chunk) and the rare Coconut Flower (40% of chunks), E to pick, regrow 6 min (`s.flowerPicks`). Luna's cauldron (inside Luna's Cottage) brews 💖 Heart (+2 boss hearts), 🍀 Lucky (5 min ×2 lucky-block luck) and 💪 Strength (3 min ×1.3 damage) potions. Backpack material list now shows every material.
- **Characters** (`client/skins.js`, server `clean_skin` + ws action `set_skin`, `Player.skin` in `public()`): "🐱 Characters" on the main menu. Pick one of the 6 cats, or "✨ Create your own" (needs an account; fur, pattern, white markings, eyes, nose, inner ears, accessory, name, live preview; you still play one of the six underneath). The owner skin (catified PNGtuber) only shows for, and the server only accepts from, the owner account / `Elidagoat`. The creator has no round head / closed eyes / :3 face, and other accounts can't name a cat "Eli the Goat". Custom cats show online for other players; cutscenes use the custom coat via `catCitySkins.artId()`.
- nothing yet


### 4 Nov 2026 (evening) — Claude: tutorial voice fixes + ghost guide
- **Voice cut-offs fixed:** the next step's line used to stop the current one, and the welcome step moved on after about 7s although the line is 8s. Now each line always plays to the end (`afterVoice()`), and the welcome waits for its line.
- **Re-trimmed all 16 lines from the originals:** speech is detected by energy (ignores the bed rustle at the start of t01), with 0.15s before the first word and about 0.4s after the last. Waveforms were checked.
- **Ghost cat guide:** 5s after a line ends, if you haven't reached the place, a see-through ghost of your cat floats there (👻 Follow me! / Over here!), waves, and repeats until you get there.

### 4 Nov 2026 (evening) — Claude: Training Village tutorial with Sofia's voice
- `client/tutorial-island.js` rewritten as the **Training Village**: a fenced-off mini Cat City (signpost, Biscuit, Pebble, Forge, Marmalade's walk-in shop, tree, rock, chest, crafting table, quest board, gate). 15 steps using the real backpack (equip, crafting) and the shop interior. Same API and hooks as before (`window.catCityTutorial`, `s.tutorialStep`, `s.tutorialCompleted`); `standNear()` and `act()` are test helpers.
- **Sofia voiced it:** 16 lines in `client/assets/voice/t01–t16.m4a`, served by the new `/voice/{name}` route in `server.py`, with subtitles and a 🔊 Voice on/off toggle (`localStorage catcity_voice`).
- **Spotlight:** while a step waits, everything dims except the target: the place to walk to, the 🐾 button once you're close (phones), or the exact button (backpack, sword slot, Equip, Make arrows, Use in the shop room, Buy Fish Snack, Sprint). It fades when the step completes.
- During the tutorial, Marmalade's counter opens a tutorial shop box (`window.catCityTutorialShop`) doing the real purchase (10 🐟 → Fish Snack), because the main shop menu sits under the title screen.
- `tests/browser_smoke.py` tutorial section rewritten for the new steps.

### 4 Nov 2026 (evening) — Claude: art wave 4 live
- New `client/nature-pixel-art.js`: 6 tree species × sprout/young/mature/stump, replacing `window.catCityTreeAsset` (same API) so all choppable and worker trees use them. Chopped trees now show sprout → young while the 8-minute regrow timer runs. ~45 material icons (logs, planks, saplings, ores, gems, plants, crafting bits) swapped into the Materials and Crafting lists. Sheet: `client/assets/nature-sheet.png`, notes: `NATURE-ART.md`.
- Next feature from ChatGPT's brief: planting saplings (art ready), the custom-cat creator and a working sprint bar. Wave 5 (buildings, furniture, decor, UI icons) is still to come.

### 4 Nov 2026 (evening) — Claude: art wave 3 live
- New `client/item-pixel-art.js`: unique pixel icons for all weapons and armour (named catalogue incl. Eli-Geode, Admin and event variants). Inventory and hotbar emoji are swapped for these. Sheet: `client/assets/items-sheet.png`, notes: `ITEMS-ART.md`.
- Fixed my wave-1 regression: equipped gear and Looks stopped showing on playable cats, because `cat-art-wire.js` skipped the older drawCat wrappers. Gear is now painted in pixel art (weapon in paw, head, body, boots) and Looks emoji sit at the new head and neck anchors.

### 4 Nov 2026 (evening) — Claude: art wave 2 live
- All NPCs, village neighbours (Poppy, Clover, Mochi, Toffee, Pip, Willow) and Wranglers now use the pixel-art cats with accessories in every view (sheet: `client/assets/npcs-sheet.png`). `cat-art-wire.js` matches any cat name that has a coat.
- iPhone bug fixed: the "Press E or 🐾 to enter…" hint (`#poi-hint`) covered the 🚪 Enter button and blocked taps. It now lets taps through.

### 4 Nov 2026 (evening) — Claude: walk-in interiors and visible homes
- **Bug fixed:** bought homes (Rose Cottage, Lavender Lodge, Golden Villa at y=33 tiles) were invisible because the graphics-pack scenery is drawn after them and its building list leaves them out. New `client/village-interiors.js` draws them in pixel-art style on top of the scenery (lit windows when owned, For Sale sign when not).
- **Walk-in rooms replace the old pop-up panel** for Marmalade's Shop, Moonbeam Library, Luna's Cottage, Adventure Guild, Cosy Cat House (computer inside, replaces the old PC house as the entry point) and the three owned homes. Each has pixel furniture with collisions, things to use with E / 🐾 (shop counter, books and clues, cauldron blessing once per visit, quest board, map table, bed saves, decorating with unlocked treasures, wardrobe, computer) and the NPC who lives there. Leave by walking out through the door or pressing Esc. World position is not changed.
- NPC coats with front-view accessories added to `cat-pixel-art.js` (Marmalade apron, Pebble glasses, Luna witch hat, Biscuit bandana, Forge goggles and apron, SlayCat bow and Pride flag). That's the start of art batch 2.

### 4 Nov 2026 (evening) — Claude: new cats in the game
- Owner approved batch 1. New `client/cat-art-wire.js` replaces `core.drawCat` for the six playable cats only (player, companions, AI teammates, online players). Pose comes from on-screen movement: side walk/run (flipped for left), walkBack/walkFront, idle with blinks, and sit after 9s still. NPCs and others keep the old sprite until batch 2. The Alien graphics pack keeps its own look.
- Display name **Skyler → Skylar** everywhere (server ROLES, Tag House, menus, Squishem display names, tests). Internal ids stay `skyler` and the saved index stays 4.

### 4 Nov 2026 (evening) — Claude: art redraw batch 1 of 5
- Redrawing **every** texture from ChatGPT's concept boards in the Birman pixel-art style, in 5 batches, each sent to Sofia as a sheet for approval before wiring in: (1) six playable cats ✅ sheet ready, (2) NPCs and quest characters, (3) weapons and armour icons + worn overlays, (4) materials, woods, tree growth stages, (5) buildings, decor, UI.
- Batch 1: new `client/cat-pixel-art.js` (shared parametric cat builder + per-cat coats) with 11 poses and effects. Sheet: `client/assets/cats-sheet.png`, notes: `client/assets/CATS-ART.md`. Approved and wired in (see next entry).

### 4 Nov 2026 (evening) — Claude: Birman art
- New `client/birman-art.js`: original pixel-art Birmans with real Birman markings, plus tail sway, blink, bob, hit flash and an angry state below half health. Variants: `king` (Quest 8), `junior` (Quest 12), `armour` (Quests 16/20), `finale` (Junior in Quest 20). Wired into `drawBoss()` in `index.html` with the old sprite as a fallback.
- Asset sheet and notes: `client/assets/birman-sheet.png`, `client/assets/BIRMAN-ART.md`. ChatGPT: if you redo Birman art, keep the markings and the four variant names.
- Fixed my own regression: the help box (moved bottom-right in PR #15) covered Attack/Jump in boss fights. It's now hidden during fights.

### 4 Nov 2026 — ChatGPT
- Prepared five pixel-art concept boards on branch `assets/cat-city-pixel-art-concepts-2026-11-04` and documented the owner's corrections, higher-detail artwork requirements, custom-cat feature, Eli-Geode/Admin equipment, wood/saplings and SlayCat Pride flag. These are **draft concept references only**; no gameplay code was altered. Claude to implement after review.

### 4 Nov 2026 (evening) — Claude
- Added **Who does what** (ChatGPT: assets + glitch testing; Claude: glitch fixes + coding), a **Bug reports** section, and removed the rule that Sofia must approve merges.

### 4 Nov 2026 (afternoon) — Claude
- **PR #15** — HUD layout fixes in new add-on `client/hud-layout-fix.js` (loaded last; uses `html body #id` selectors to win over older rules): compass clear of Change Cat/Shop/Settings/Pause, desktop left column spaced (stamina → objective → quest tracker → Squishems), help box bottom-right, phone Squishems button off the hotbar. HUD "items" count now includes backpack items. Title names all six cats.
- **PR #16** — Public AI lobbies back to **2 computer cats per room** (pairs of Baby/Harley/Skylar, different per room — `ai_cats.py`). Tests updated: vote panel now shows "N total votes" ("simulated AI votes" wording was removed on purpose); event enchantments are rare (~1 in 5) by design. **All tests pass.**
- **PR #17** — iPhone music fix in `client/world-overhaul.js`: Safari mutes Web Audio on the silent switch, so the music tap now sets `navigator.audioSession.type='playback'` / plays a silent loop on older iOS.
- Owner decisions: 2 computer cats per room.

### 4 Nov 2026 — Claude
- Explored the repo and wrote this `HANDOFF.md` (code map, branch status, known issues, rules).
- No game code changed.
- Next: Sofia to pick the first task.
