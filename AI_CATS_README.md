# Cat City — Conversational AI cats & free voices

## User-visible features
- Four public AI lobbies per server start, with two friendly AI cats and up to two real players per lobby. Titles are randomized and show in Public Servers.
- AI cats visibly roam in their rooms. After the human accepts a quest, AI companions follow; they never start quests by themselves. They give advice, not automatic completion.
- Click **🤖 Talk to AI**, select Mochi, Nova, Poppy, Pip, Cosmo or Biscuit, and chat privately in solo or multiplayer. Online rooms only offer AI bots in the current room.
- Optional **🔊 Voices on** uses the device's Web Speech API `speechSynthesis` (free, no account or provider API key). Each cat has a different voice pitch and rate, selectable from available English device voices.
- Optional **🎙️ Speak** uses browser SpeechRecognition, where available. Transcript is displayed for review; only pressing Send submits words to the Cat City server. The browser may process recordings on its own provider's servers.
- Public human voice chat stays blocked. AI chat is private unless a signed-in player explicitly @mentions a bot in shared room text chat; then the reply is visible to other room participants. All bots are clearly labelled AI.

## AI quality and charges
Default chat uses a **free built-in guided dialogue engine** that remembers the last five exchanges in temporary server memory and responds to Cat City activities. It is intentionally NOT described as a generative language model.

A genuine model-backed conversation is available only when ALL the following protected Render env variables are configured:
- `CATCITY_LLM_ENABLED=1` — explicit opt-in to model usage charges
- `NEON_AI_GATEWAY_BASE_URL` — Neon branch gateway HTTPS base URL
- `NEON_AI_GATEWAY_TOKEN` — branch-scoped service credential with invoke permission
- `CATCITY_AI_MODEL` — optional model name (default `gpt-oss-120b`)

Neon AI Gateway uses paid, metered model tokens. The game does not set any of these values automatically. Never put tokens or the owner's password into GitHub. If the model call fails or exceeds the 8-second limit, the game safely falls back to built-in dialogue. Model calls are limited in output length and per session.

## Data safety and resets
- Neither Neon player account tables nor saved player progress are altered.
- Only short in-memory AI conversations are kept (not saved to Neon). Do not ask bots to share sensitive details.
- Render free instances can sleep/restart; seeded AI lobbies reappear with newly random names and codes.
- Browser TTS depends on installed voices; Safari/Chrome may require tapping Enable Voice and allowing microphone permissions.
- Speech recognition never automatically sends a transcript to the game server. Users must submit the text themselves.

## Test checklist
`python -m unittest discover -s tests -v`
`python -m py_compile ai_cats.py server.py social.py`
`node --check client/ai-cats.js`

After checks, playtest on actual iPhone Safari and Windows Chrome or Edge: open Public Servers, join AI room, send text, toggle voices, use mic if supported, start quest, verify AI follows and private human voice chat remains opt-in.
