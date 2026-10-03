# Changelog

## T6 + T6b: the frost almanac, the real floor, break-even, Grisby with teeth
- **Frost almanac (expected value vs ruin).** The evening before the frost the notice board gives the odds of a HARD frost (1 in 3) and the price of straw (5 a plot). Cover (certain cost, crops safe) or risk it (on average cheaper, but a hard frost kills every uncovered crop, written off at cost). After the choice Maud sets the average against the certain price and says whether losing the crops would have cost you your Crown verdict. Only a player who answers is exposed, so unattended play (bots, sandbox tuning) is unchanged. Transcript: "Expected value & ruin".
- **Opportunity-cost floor bet** after the first Market Day: Ashby offers 5, above the sack's cost; what is the lowest price worth taking? (The fair paid more.) Optional stake through Maud's usual bet. Transcript: "Opportunity cost".
- **Break-even cell** in every tally: "you kept N a sack; the week's wages and interest are W; how many sacks cover it?" Two tries, evidence only for a first-try answer.
- **Grisby matters:** above the going price he undercuts by 2 (was 1); he brings a limited stock (24 in week 2, only 5 in week 3), so he sells out part-way through the week-3 afternoon. His board shows what he asked, his stock left and what he took (and how much of it was really yours).
- **Market Day critic fixes (T6b):** Maud's bet is settled on every path (a fair quit part-way refunds the stake); Grisby's sales are capped by his stock; the demand chart leaves off earlier fairs played under the other rival condition and earlier sold-out hours; Transcript credit for demand/segments needs a price change that RAISED takings; "takings would up" reads rise/fall/stay the same.
- Tests: `test-frost.js`, `test-market-day.js` (Grisby stock, experiment, bet settlement), `market-t6.html`.

All notable changes to Spring at Thornfield. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [v0.4.0-beta (candidate)]

Integrates PRs #27 (sound and music), #28 (cast, scenes, letters), #29 (practice), #30 (WS7 Market Day) and #31 (WS6 story spine) on `integrate-s1`. Do not release before creative-lead review. Cache-bust stamp `?v=0.4.0`.

### Integration decisions (canon, `projects/mba-game/TASKS-season1.md`)
- WS6's structure and mechanics (four weeks and title cards, Crane's buy-out offer, endings, case board, timeline scenes, escalating orders, time-value scene, seeded events, farm name) with #28's words and characters (cast voices, scenes, letters, flags).
- The villain is **Corvin Vane** everywhere ("Steward Vane" renamed). Crane is the honest ex-clerk, not Vane's man: he delivers the day-1 offer as an instructed messenger ("Item: I do not recommend it").
- Village scenes keep their days except two that landed on a story beat and moved +1: Crane's off-duty scene 12 to 13 (day 12 is Vane's first order), Crane's seal scene 22 to 23 (day 22 is the week-4 card).
- A village scene that reveals a clue also pins a card on the case board. Practice problems pin nothing.
- Edric's letters: #28's nine keep their numbers; WS6's midpoint page is letter 10, "The same order" (found the night Vane brings his order).
- Maud no longer answers with only a "Next:" hint when a village scene or the day's practice problem is waiting (it was unreachable during the story, days 9-14); game.js shows her menu instead.
- `Music` and `Sound effects` switches in the pause menu; the single shared audio context and first-tap unlock from #17/#25 are kept.

### Added: Market Day (WS7, #30)
- Days 7, 14 and 21: a stall on the square. Set a price per hour, watch who buys (thrifty, comfortable, in a hurry), a demand chart in the tally, Maud's bet on day 14, Grisby's rival stall from day 14. Every sale goes through the books (Cash, Revenue, Inventory) and the cash-flow statement still reconciles. Details: `TEST-RESULTS-WS7.md`.

### Added: the four-week story spine (WS6, #31)
- Four weeks with title cards (day 1, 8, 15, 22) and a goal ribbon "Week N · title"; Crane's standing buy-out offer (day 1 and from the Desk; a mercy price when you cannot cover wages); four endings (sold out, seized, bridged, free) with epilogues and what they unlock; the case board (every lesson, letter and village scene pins a clue); the time-value scene at Tomas; Corvin Vane's escalating orders (day 12 half, day 15 whole); Edric's cash book in week 4; seeded event nights; name your farm. Details: `TEST-RESULTS-WS6.md`.

### Added: Maud's problem (practice, #29)
- A new problem every day, set by Maud on your own live numbers (gross margin on your last sale, the equation, inventory, receivables, interest, Cash at the next pay-day, the discount, break-even, current ratio, operating income, deposits, the Crown fund). Desk menu or talk to Maud.
- Every third day, with two offers on the table, she asks which puts more Cash in the chest by day 28.
- Right on your own = transcript evidence (mastery needs several days), a streak, and favour (Maud trusts you more). Hinted or walked-through = no credit.
- Tests: `test-practice.js` (1100+ generated problems checked against the engine), `practice-ui.html`.

### Added: story, cast and letters
- **A cast with a spine** (`cast.js`, `docs/STORY-BIBLE.md`): every villager has a look, a verbal habit, a mantra, a want and a secret, and a greeting pool that responds to the weather and the chest. Walk up to anyone with no business and they speak, then offer "Ask about..." topics, some locked until you have earned their trust (hearts) or the story has reached them.
- **The mystery**: why a profitable farm went broke, and who wanted it to. Edric stood surety for Ashby's bakery (a guarantee the Ledger never showed), the Crown sold the note to **Steward Vane**, and Vane is buying up every note in the valley to call them in at Midwinter. The Duke's order is his gambit.
- **12 village scenes** (`scenes.js`, days 9-28): optional, one-time, marked by a red "!" on the speaker. A scene IS a lesson: Hobb's request for seven more days is a real credit decision (it changes his invoice); Vane's "partnership" is a payable-on-demand covenant. Six clues, flags saved for Summer.
- **Edric's nine letters** (from five): found where the lessons are, reread from the desk ("Edric's letters"); the last turns the season into a mystery.
- Chapter dialogue rewritten in each character's voice (Crane's forty-one items, Tomas's patter, Ashby's "none of his luck", Hobb's pauses, Ezra's price-not-judgement, Vane's opportunity). "The Duke's steward" is now **Steward Vane**.
- `tests/test-cast.js` (every line fits a dialogue box and has no placeholders, greetings vary and respond, topics are earned, every scene plays through every choice keeping the books balanced, the clue count matches), `tests/story-ui.html`.

### Added: sound and music
- **Score** (`music.js`): a small generative composer in six moods (farm, town waltz, rain, night lullaby, tense, the bailiff's march), all synthesized with WebAudio, so no audio files and it works offline. The score follows the game: the bailiff's march in chapter 1, night music while you sleep, rain on rainy days, the town waltz east of the village square, a heartbeat when the chest can't cover the next pay-day or the Duke's order is open.
- **24 sound effects** (`fx.js`): footsteps, tilling, planting, watering, harvest, shipping, page turns, button taps, error buzz, stamp, sleep and morning, mastery chime, rain, and more. Each character has their own typewriter voice (pitch and timbre).
- **On by default** (after the first tap, which iOS requires), with two switches in the menu: Music and Sound effects. The old one-switch setting is honoured if it was explicitly off. iOS ringer-switch workaround (a "playback" audio session).
- `sound.html`: a sound check page (every mood, effect and voice on a button) so the music can be judged by ear.
- `tests/audio.html` (run with `node tests/run-html.js`): renders every mood offline and checks the signal (non-silent, no clipping, deterministic, each different, node budget), runs all effects and the live scheduler against a fake context, and checks the preferences.

### Creative lead's list (v0.3.2 candidates, one PR each into `next`)
- 1 Overtrading loses: one `R.duke` order (132 sacks, 28-day terms) shared by story and sandbox; `test-crown` asserts careful pays, overtrader and reckless lose.
- 2 Mastery: only right answers from the verbs count; hints, walk-throughs and passive screens don't; `Transcript.evidence`.
- 3 HUD is one row at 1194x834 and 834x1194; the chapter goal is its own ribbon.
- 4 Predict timeline: regression test that it never shows the lowest Cash before you commit; the answer is no longer parked on `window`.
- 5 One Check per ask: the pad's on touch, the inline one on desktop.
- 6 Optional on-screen pad (`?pad=1`) is smaller and see-through.
- 7 `Bot.spender` triggers the wages-day walk-off; careful doesn't.
- 8 iOS audio: the first tap creates and resumes one shared AudioContext and plays a silent buffer; later taps re-resume it; the stamp's thud uses it and obeys the sound switch.
- Cache-bust stamp bumped to `?v=0.3.2`.

### Fixed (iPad feedback, 2026-10-03)
- **"Thornfield, as the Crown sees it" never went away.** The card was created without an id, so `getElementById` never found it: every update made a new card and nothing could close it. It now has an id, it can't be re-created once its lesson ends, a lesson stage change closes it, it has a cross, and tapping it closes it once you are done collecting. On an iPad it sits below the HUD rows instead of over the Travel button.
- **The notice board sat on the road.** Moved one tile north (18,7), beside the road.
- **Scaling on an iPad.** The map used to be a fixed 16:10 box with light bars round it. On touch it now scales in half steps and shows as much map as the screen holds (wider in landscape, taller in portrait), and the page behind it is dark.

### Changed
- No on-screen arrows or Act button on an iPad: taps do everything. `?pad=1` brings them back. The "E: ..." hint is hidden on touch.
- Dialog number boxes use the on-screen number pad only (it has its own minus key), so the extra ± button is gone from them; forecast boxes keep theirs.

### Added (WS2: UI kit, iPad-first)
- Design tokens in `style.css` (`--bg --panel --panel-edge --ink --muted --gold --green --red --font-body --font-num --sp1..5 --radius --shadow --tap`); game UI in new `ui.css`.
- One-row HUD (Day, Cash, Crown fund meter, goal, Travel, Books); balance-sheet boxes moved to a collapsible Books strip that opens when a lesson spotlights one. HUD numbers 20px, dialog text 18px, 96px portrait with name plate.
- On-screen number pad (0-9, minus, backspace, Check) in every ask/haggle box; on touch the box is `inputmode="none"` so the iPad keyboard never covers the dialog.
- `fx.js`: coin burst on every Cash change, WebAudio clink/thud (muted by default; toggle in the menu), typewriter text (click finishes it; click a single-button box to advance), day-end card (Cash change, who owes you, losses; tap to dismiss).
- Fast travel: Travel button opens a map of six doors; 0.5 s fade.
- `tests/ws2-ui.html`; `teach-ui.html` waits longer after sleeping because the day-end card stays up a little longer.

## [v0.2-beta]

Integrates PRs #1-#10 (via `claude/integrated-all` for #1-#9, then `claude/teach-and-thrill` for #10) plus review fixes.
Saves from v0.1-beta are not carried over (new save key): everyone starts a fresh game.

### Added
- #1 Sprinklers can be picked up and moved (hint text "pick up sprinkler").
- #3 A moving market price (6-10 a sack, shown in the HUD with arrows), buyers who differ day to day (rush orders, bigger orders on longer terms), and real room to haggle (each ordinary buyer has a reserve price above the first offer).
- #4 Overnight events: pigs (day 9), rats (16), a warm day (19), a frost (23), each warned a day ahead; write-offs post to a new "Crop & stock losses" account; a fence from Tomas.
- #5 Early loan repayment costs one week's interest before day 21, with "Should I repay early?" advice in the player's own numbers.
- #6 Placed sprinklers save 20 a week in wages (down to a floor of 20) and start seeds a day ahead; "Is a sprinkler worth it?" advice at Tomas.
- #7 Pell the pig farmer and Barnaby the rat-poison pedlar, with a "Promised, not booked" block in the Ledger.
- #8 Customer deposits (days 11 and 18): Cash now, a liability until the grain ships; refund plus forfeit if undelivered.
- #9 A "Toward the Crown" meter in the HUD and an "If Midwinter were tomorrow" settlement on the season-close screen.
- #10 Stakes and teaching layer: Crown debt 1,250, a fourth verdict ("Ezra will bridge the gap"), a one-time emergency loan in place of instant insolvency, an insolvency post-mortem, a village notice board (price outlook plus small decisions on days 2, 6, 12), a books preview before purchases, a Ledger tour, a predict-then-reveal Cash prompt before sleeping, click-any-HUD-number explanations, frost pile-up coaching.
- `CHANGELOG.md`; `_build-shots/shots.html`, a screenshot driver for headless Chrome.

### Changed
- #2 Depreciation is 5 a week per sprinkler owned (it was 5 total however many you had).
- Save key is now `lc_spring_save_v3` (old saves lack the new accounts and fields and would show NaN balances).
- The fence is offered up to the night the pigs come, read from the events table (no literal 9).
- Pell's opening line and options agree: 14 days for the haggle option, 21 days (plus a quarter of the pig money) for the share option.
- When one buyer has two live orders (Ashby on day 11) the player picks which to discuss; neither is hidden.
- Ezra's emergency-loan rate penalty lives in its own field (`rescueAdj`), so the story's forecast discount cannot erase it.
- The books preview never fires while a story chapter is running.
- The road trader pays the going price - 1, the market cart the going price - 2 (never below the cost of 4).
- The sandbox Duke order is 90 sacks at the story's 10 a sack (the moving market had dropped it to 9). The `OFFERS` price column is now used only for the Duke.

## [v0.1-beta]

Spring beta as first shared with testers (git tag `v0.1-beta`, the `master` commit before this release): the nine-chapter
story (keys, first seed, the bakery, Hobb pays later, wages day, Tomas's terms, Ezra, the Duke's steward, closing the
books), the sandbox, the Ledger with income statement, balance sheet and cash-flow statement, Ezra's review, and the
Transcript of accounting concepts.
