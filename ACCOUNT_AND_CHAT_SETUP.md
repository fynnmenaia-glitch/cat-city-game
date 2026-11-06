# Cat City — Accounts, Chat, NPCs and Owner Controls

This release adds the account screen to the main menu, safe room chat, talk-to-NPC dialogue, and server-authorised owner controls in Settings. Tag House is now accessed through **Pause → Play Tag House** only.

## Account security

The initial owner identity is configured using protected Render environment variables:
- `OWNER_USERNAME` — reserved owner username (never allow others to register it).
- `OWNER_PASSWORD_HASH` — a salted PBKDF2 hash; never store a readable password in GitHub.
- `AUTH_SIGNING_SECRET` — a random secret for signed, HttpOnly session cookies.

**Cloud accounts require a persistent PostgreSQL database.** Configure `DATABASE_URL` with an appropriately backed-up, durable database to enable other users to register and to enable cloud saves. When DATABASE_URL is absent, registrations and cloud saves deliberately return HTTP 503; browser-local saves continue to work. A temporary/expiring free database does **not** meet a permanent-save promise. Backups and ongoing hosting are required; no service can guarantee data forever.

All account-changing APIs check request origins. Only the verified owner can use admin APIs. The admin-panel switch in Settings merely shows/hides the owner controls; it does not grant permission.

Because a password was supplied in conversation, change it to a unique longer password before reusing this account elsewhere. Do not put passwords into the game chat.

## Multiplayer chat and NPC dialogue

- Chat is limited to people in the same room. Basic server-side profanity, bullying and personal-contact filters apply; guests in public rooms can use quick-chat phrases until logged in.
- Players can mute another cat locally and report inappropriate messages. Reports are currently held in server memory and are lost when the server restarts.
- NPCs provide context-sensitive, kid-friendly conversation about Cat City through a safe built-in dialogue engine. **These are not generative AI calls**; supporting an external model would require provider credentials, extra safeguarding and possible usage costs.
- Admin global announcements reach all connected multiplayer rooms; solo browsers also check for the latest announcement. Admin world-time and event changes are temporary server state.
- Client chat uses textContent for untrusted messages to avoid HTML/script injection.

## Setup & testing

Install `requirements.txt`; launch `python server.py`. Confirm `/health`, `/api/account/status`, `/api/world-state`, `/api/npc/chat` and the online room WebSocket.

Test suites: `python test_social_api.py` and `python test_social_browser.py` (test files are available in the release backup, not in this production branch). Existing quest, Tag House and cross-play features are preserved.
