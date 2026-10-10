# Code wiki index (one line per page; grouped by pack). Schema: `docs/wiki/README.md`.

## platform
- [platform/art](platform/art.md) — system · Pixel art (core/art.js). `core/art.js` draws all the game's pixel art in code.
- [platform/books](platform/books.md) — system · Books (statements and closing review). `core/books.js` turns the season's journal into the three statements.
- [platform/bots](platform/bots.md) — system · Scripted bot players. `core/bot.js` has scripted players.
- [platform/codex](platform/codex.md) — system · The codex store. `core/codex.js` is a small shared store from an older design.
- [platform/engine](platform/engine.md) — system · The engine (double-entry journal). `core/engine.js` is the whole season as pure JS with no DOM.
- [platform/game-ui](platform/game-ui.md) — system · The game shell (core/game.js). `core/game.js` is the playable world: map, walking, dialogue, menus, the Desk, the day loop and the close of the books.
- [platform/opening](platform/opening.md) — system · The opening (core/intro.js). A 75-second animated prologue on a 320 by 180 canvas.
- [platform/save](platform/save.md) — system · Save and browser storage. The game keeps all player data in `localStorage`.
- [platform/map-props](platform/map-props.md) — system · Map prop layer (P8). Props as data, a sprite registry, `when` rules.
- [platform/cutscene](platform/cutscene.md) — system · Cutscene engine (P7). Shots, lines, cues, skip, journal; the opening is its first cutscene.
- [platform/scene-player](platform/scene-player.md) — system · Scene player and scene records. A scene is a data record; core/scene.js plays it.
- [platform/sound](platform/sound.md) — system · Sound (music and effects). All sound is made with WebAudio in code.
- [platform/tests-and-ci](platform/tests-and-ci.md) — system · Tests and CI. Every pull request and every push to `master` runs the node tests and every browser test page.
- [platform/transcript](platform/transcript.md) — system · The transcript (concepts and mastery). The transcript records what the player has done and explained, per concept.
- [platform/verbs](platform/verbs.md) — system · Mechanic verbs (tag, bet, timeline). `core/verbs.js` holds things the player does instead of typing a sum.
- [platform/version-stamp](platform/version-stamp.md) — system · The version stamp. One version number, `version.js`.
- [platform/wiki-lint](platform/wiki-lint.md) — system · The wiki lint. Checks every page of this wiki against the code.

## ch1 — The Farm
- [ch1/LOG](ch1/LOG.md) — decision · Chapter 1 build log.
- [ch1/bug-stuck-scene](ch1/bug-stuck-scene.md) — bug · Bug — a scene waits on nothing and the map freezes (days 22–23).
- [ch1/cast](ch1/cast.md) — system · The cast (voices, greetings, topics, chat menu). Eleven characters, each with a look, a verbal habit, a mantra and a voice.
- [ch1/court](ch1/court.md) — system · The Reeve's Court (Spring finale and exam). Day 28.
- [ch1/endings](ch1/endings.md) — system · Endings, Crane's offer and epilogues. Crane carries Corvin Vane's standing offer to buy the farm.
- [ch1/cutscenes](ch1/cutscenes.md) — system · Spring's eight data cutscenes (S5): ids, lengths, where each plays.
- [ch1/lessons-as-data](ch1/lessons-as-data.md) — system · The story's lessons as data (P6b). lessons.js holds the words; story.js holds formulas and verbs.
- [ch1/lessons-week1](ch1/lessons-week1.md) — lesson · Lessons, story chapters 1-3 (the writ, first seed, the bakery). The first three lessons of the story.
- [ch1/lessons-week2](ch1/lessons-week2.md) — lesson · Lessons, story chapters 4-5 (Hobb pays later, wages day). Hobb buys on credit: Revenue today, Cash in 14 days.
- [ch1/lessons-weeks3-4](ch1/lessons-weeks3-4.md) — lesson · Lessons, story chapters 6-9 (Tomas's terms to the close). The middle and end of the story.
- [ch1/market-day](ch1/market-day.md) — system · Market Day (days 7, 14, 21). Three times a spring (days 7, 14, 21) the village holds a fair.
- [ch1/practice](ch1/practice.md) — system · Practice (the daily problem). Once a day the teacher sets one small problem on the player's own books.
- [ch1/summer-settings](ch1/summer-settings.md) — data · Summer settings (the Summer season data). Summer's numbers as data: the King's order and tally, buyer terms, the water bill, the mill wing, the demand curve and the test plot.
- [ch1/spring-settings](ch1/spring-settings.md) — data · Spring settings (the R constants). `R` is the one object that holds every number of Season 1: prices, wages, loan terms, the Duke's orders, the calendar of events and the Crown's debt.
- [ch1/standing-orders](ch1/standing-orders.md) — system · Standing orders (the notice-board contracts). Each morning from day 3 to 26 the notice board posts one or two repeatable contracts from the regular buyers (Ashby, Hobb, Mira).
- [ch1/village-scenes](ch1/village-scenes.md) — system · Village scenes (days 9-28). Twelve short, optional, one-time conversations.

## ch2 · ch3 · ch4
- (none yet)
