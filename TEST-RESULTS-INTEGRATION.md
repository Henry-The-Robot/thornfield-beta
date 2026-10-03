# v0.4.0 candidate: integration test results (branch `integrate-s1`)

Merged in order onto `origin/master` (7fdee94): #27 audio, #28 cast/scenes/letters, #29 practice, #30 WS7 Market Day, #31 WS6 story spine. Each merge was committed and pushed on its own.

## Conflicts and how they were resolved
- #27, #28, #29: no conflicts. fx.js keeps #27's rewrite with the single shared AudioContext and first-tap unlock (`tests/audio-unlock.html` passes).
- #30 (WS7): `game.html` script order (market.js before fx.js, no FX dependency) and `game.js` (`tick` modal now `dlgOpen() || panelOpen() || marketOpen()` with #27's footstep sound kept; `Market.init(G)` kept beside the #27 sound block).
- #31 (WS6): `engine.js` (Spring export is the union, `roll` kept for Market Day; `NAMES.duke` = "Corvin Vane, the Duke's steward"), `game.html` (all scripts and stylesheets, `?v=0.4.0`), `game.js` (npcHere: #28's scene hooks + WS6's seeded Pell/Pedlar windows; Tomas menu: WS6 pig day + #28's "Ask Tomas about..."; Desk menu: practice, letters and WS6's Crane offer / case board; ribbon: WS7 paintGoal + WS6 "Week N" header; CLOSABLE: letters + casebd; `wants`: scenes + WS6 stages), `story.js` (9 hunks: WEEKS + LETTERS; pages 0-8 are #28's, WS6's midpoint page is index 9; ch1 = #28's Crane/Maud words + WS6's farm name, Crane's offer, "Profit is an opinion" + letter 5; Hobb line = #28 voice + WS6 "cost floor"; Corvin's orders = WS6 mechanics + #28's opening/closing lines; morning chain = WS6's with #28's description of Vane).
- Canon applied: Corvin Vane everywhere (cast.js, endings.js, game.js, story.js, bible, scenes.js), Crane as instructed messenger, scene days shifted +1 where they met a story beat (Crane off-duty 12 to 13; Crane seal 22 to 23), clue pins from scenes (`sc.card` in scenes.js to `Story.pin`).
- Bug found by the integration and fixed: `Story.onTalk` answered Maud with "Next: ..." for every chapter below 9, so her village scenes (days 9-14) and the daily practice problem could not be reached in the story. Now the story stands aside when a scene or the day's problem is waiting (chapter 5 on).

## Results (this machine, headless Chrome and node)
- `node tests/run-all.js`: 17 of 17 ok (test-cast, crown, deposits, depreciation, events, loans, market-day, market, offer, pell, practice, spine, sprinkler-move, sprinkler-value, teach, transcript, walkoff). test-cast.js updated for the shifted days and 10 letters.
- Headless: `smoke-story.html` (full 4-week story, through the real UI): reaches `done`, outcome closed day 28, 20 clues pinned, 4 endings render, **0 JS errors**. `story-ui.html`, `practice-ui.html`, `audio-unlock.html`, `ipad.html`, `market-day.html` (desktop and iPad, 0 errors), `ws2-ui.html` (3 viewports): all true.
- `tests/audio.html` needs Playwright (`node tests/run-html.js`): **skipped**, not run.
- Bots, story-shaped game, 40 seeds (same method as test-spine): careful paid 29 / bridge 11; overtrader insolvent 40/40; reckless insolvent 40/40.
- Village scene to case board, through the UI: Tomas's day-13 scene played, card "A grey cloak buys seed contracts" pinned (`int-shots.html?shot=casebd`).
- Screenshots 1194x834 in `_build-shots/v0.4-int/` (`node _build-shots/shoot-int.js`): day-1 offer, week card, village scene, Market Day, practice problem, case board, pause menu with Music and Sound toggles.

## Not verified / open
- Sound and music by ear (K1), and `audio.html`.
- Market Day fires on 7, 14, 21 and also on day 28 (WS7's `FAIR_DAYS` has four fairs).
- Week 4 "Maud is silent" now gives way to her menu when a scene or practice problem is waiting (creative call).
