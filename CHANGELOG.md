# Changelog

**How to bump the version** (one command, never by hand): `node tools/stamp.js 0.4.7` writes the version into `version.js` and stamps every `?v=` in `game.html` and `index.html` (and the visible "v0.4.7" on the title page). `node tools/stamp.js --check` lists any tag that differs; `tests/test-version.js` and CI fail on a mismatch. Adding a script tag? Add it, then run `node tools/stamp.js`. The creative lead makes the release tag.

## v0.4.11: the opening's voice plays on iPad
- **Test voiceover (open the game with `?vo=1`):** the ElevenLabs narration and sound now play on iPad Safari. Each file is decoded in advance and plays through the sound channel your first tap unlocks; before, iPad blocked files the timeline started on its own.

## v0.4.10: test voiceover for the opening
- With `?vo=1` the opening plays an ElevenLabs narrator for all 11 lines, plus rain, gate, coins and seal sounds. Without it, nothing changes.

## v0.4.9: what Summer needs
- **Your cash conversion cycle, in days** (week 3, the day after the present-value lesson): receivable days, inventory days and payable days from your own books, then you work out the cycle.
- **Who is paid first** (week 4, Ezra): Crane's offer against what the farm owes. Debts come first, the owner last. Your answer is saved for Summer.
- Three short naming passes inside existing scenes: your walk-away point (best alternative, less its cost), sunk cost (the seed already bought), and legal / ethical / smart (Vane's "partnership").

## v0.4.8: Spring's cutscenes
- **Five short cutscenes** play at story beats, each skippable: Corvin Vane arrives (day 12), "It's only my name" (Ashby, day 21+), the night the pigs got in, Crane reads the seal (day 23+), and a Market Day opening that changes in weeks 1, 2 and 3. A short Spring opening is ready for the main menu (not wired yet).
- Every cutscene you have seen is kept in a journal on your device.

## v0.4.7: the iPad screen is full
- **The map fills the whole iPad screen**, landscape (1194 × 834) and portrait (834 × 1194). A band of 8 px round the map is gone, and portrait now scales up so the map is no longer 150 px short at the bottom.
- Under the hood (no change to play): the story's lessons are data (`lessons.js`), the opening runs on a cutscene engine, and the map's still props are data.

## v0.4.6: review fixes
- **The Reeve's Court has 9 claims now, and you pass with 6** (creative call 6). Each sitting asks one claim for each of the eight core ideas, plus the guarantee claim. If the guarantee flag is not set, the "on demand" claim stands in.
- **A retake is not a repeat.** Each idea has a pool of claims, and a retake draws a different one. The numbers in the break-even, floor-offer, waiting and caravan claims change every sitting.
- **Break-even in the Court uses your real weekly bill.** That is your wages after sprinklers, plus interest. It used to quote the plain wage of 45.
- **Repay Ezra or pay Tomas early** now compares one week of Ezra's interest with the 2% discount. It flips at about 2% a week, like the time-value problem. It used to count interest over every pay-day left.
- **Practice "Why?" questions fit the tier.** Break-even tier 1 asks why wages set the count. Expected value tier 3 asks about a losing average. Expected-value hints quote the tier's real odds (70/30, then 60/40).
- **The present-value lesson always plays once in week 3.** It uses the biggest invoice Ezra can fund. The Duke's 1,320 is too big for him, so it used to skip the lesson. If no invoice fits, Maud uses a small made-up one (100, due in two weeks).
- **iPad:** the page is pinned to the top only for the number pad. The farm-name box, the forecast cells and the break-even box can scroll above the keyboard.
- **Stuck-scene valve:** a scene dropped by the valve can no longer wake up later and race a new scene. Market Day and the intro now count as screens for the stall detector.
- Wording: Corvin's bet no longer says "buy the seed today" when you hold the seed. The break-even lesson no longer says Grisby undercuts on day 7. He has no stall until day 14.
- The v0.4.5 note on selling an invoice said "about 8% a week". Ezra keeps a flat 15%, so the weekly rate depends on the days left: 17.6% with one week to run, 8.5% with two, 5.6% with three.
- Tests: `test-court.js` (9 claims, pass 6, one per idea, retakes differ, real bill), `test-practice.js` (tiers 1 to 3 swept; repay checked by hand at 7 rates), `lessons-s1.html` (the Duke's invoice), `stale-scene.html` (new), `test-t3b.js` (Crane's "Item:" tic at most 15%).

## v0.4.5: the Season 1 core
From `docs/SEASON-1-CURRICULUM-AUDIT.md`: eight core ideas the season must prove, with the Court as the test.
- **Fixed vs variable cost (new lesson, wages day).** Maud names the two kinds of cost and contribution. A rival's price cut is a choice: how many sacks to break even now. The answer shows a small price cut roughly doubling break-even.
- **Present value (new lesson, week 3, on a real invoice).** Ezra's two prices for cash today: sell the invoice (a flat 15% fee, so the weekly rate depends on the days left: 17.6% with one week to run, 8.5% with two, 5.6% with three) or borrow against it (the loan rate). Then what the promise is worth today.
- **The Reeve's Court now has 10 claims (pass 7).** New claims test break-even, the opportunity-cost floor, the price of waiting, and expected value against ruin. All four are always asked. The close screen lists the eight core ideas and how far you took each.
- **Transcript:** `Transcript.CORE` marks the eight core ideas; everything else is a preview Summer teaches.
- **Practice ramps with mastery.** Break-even, expected value, opportunity cost, time value and the working-capital gap each have tiers 1 to 3, picked by how well you know the idea. Tier 3 adds a twist (a dearer seed, a bet whose average is a loss, a haul cost, a fee, slower customers).
- **"Why?" after a first-try right answer** on break-even, expected value, opportunity cost and time value: pick the reason. Right earns more evidence; wrong gets the reason.
- Tests: `lessons-s1.html`; `test-court.js`/`court.html` updated for 10 claims; `week4.html` handles decision problems.

## v0.4.4: playtest 2
- **iPad:** tapping the answer box no longer shoves the dialog up. On touch the box is read-only (the on-screen pad types into it), never takes focus, and the page is pinned back to the top if iOS scrolls it.
- **Stuck on day 22/23:** if a scene is waiting on nothing visible for ~7 s, the game now frees the map itself (it used to need a save-and-reset). Root cause not reproduced; this is the safety valve.
- **Reeve's Court:** Edric's letter showed behind the court overlay, so "Fold it away" could not be reached and the game seemed to hang; the hall now hides while the letter is open. "Press" is now "Press: ask for more detail", with a tooltip, and Maud's opening line explains Press then Present.
- **Tomas:** with two or more bills you can pay any one by itself (the earliest first, with its discount), or pay all.
- **Corvin's what-if:** no more "buy 0 packets"; if you already hold the seed it says so (and uses the real sacks-per-plot).
- **Practice:** pure add/subtract problems are gone (equity, inventory, receivables, operating income, Crown fund). New decisions: nine packets on account vs borrowed from Ezra, and repaying 100 to Ezra vs paying Tomas early for 2%. The nightly "what will Cash be?" is asked at most every third day and stops after two right or two skips.

## v0.4.3: playtest fixes
- **Crane** no longer starts every sentence with "Item:". He is formal and pedantic, and "Item:" is now an occasional list marker (about one sentence in ten, at most two to a box). Checked the other characters' verbal habits: none is overdone (Tomas's "my friend" is in 9% of his sentences, Ashby's "dear" 13%, Hobb's "eventually" 1%).
- **Ezra's loan on day 9.** The 100/200 loan in the chapter-7 scene ignored the engine's answer: if Ezra's limit (which counts what you already owe) was too low, the loan silently failed and no Cash arrived. Now he only offers what he will lend (greying out the rest and saying why), refusals are shown, and the notebook records what was actually borrowed.
- **Conversations.** A topic you've asked goes away (no more "(again)"); a buyer says when she isn't buying today; a buyer's standing deal is on her menu, so a conversation never blocks a deal.
- Hobb, Ashby and Mira share the same conversation menu; an open order is now a reminder shown above it instead of replacing it (so you can still ask and deal while one is open).
- The Play link carries `?v=` and the title page shows the version, so a cached page is easy to spot.
- Tests: `ezra-loan.html`, `chat.html`; the Crane rule in `test-t3b.js`/`test-court.js` now allows the tic but not the habit.

## Stability (quality gate)
- Coming back to a finished season (reload, new tab) no longer starts a silent new game: Maud offers Continue, which returns to the closing books, the Reeve's Court (unless already passed) and the ending, or a new game. A season ended by selling the farm returns to its ending.
- The notebook gains "The real floor" after the first Market Day's floor bet (cost vs the best sale you give up), with a clue card.
- Tests: `stability.html` (real-time runner).

## v0.4.1 candidate: editor pass and day loop (work order items 6-8)
- Every Maud box is at most two sentences (27 lines fixed or split); the longest choiceless run in the story is 4 boxes (was 5); `test-editor.js` keeps both true.
- Teaching-line audit against the curriculum foundation: Crane's equity question, the Market Day price-rise explanation, the guarantee as a contingent liability, the standing-order wording. See `docs/EDITOR-REPORT.md`.
- Day loop: every day 2-28 has a choice and a surprise or set piece over 40 seeds. Notices recur (trader 3/6/10/25, hands 4/12/16), rain counts, the notice board shows a red "!". `test-dayloop.js`, `day-loop.html`.
- `?v=` 0.4.1.

## T4: The Reeve's Court (the exam and the finale, day 28)
- `court.js` + `court.css`: Vane's advocate makes 8 claims built from the player's own statements (profit is not Cash, receivables, "owns nothing", "Edric was unprofitable", the Duke's terms vs wages, a guarantee is a liability, payable-on-demand, margin vs markup, inventory, equity). PRESS for detail (it can turn up evidence), PRESENT a statement line, a case-board clue or a found card. Refute 6 of 8 to pass; a failed hearing offers another sitting with a fresh set of claims, never a game over.
- Crane (trust 3+) testifies once (a free correct present); Ezra (trust 3+) confirms his rate. One Maud line per refuted claim (claim, number, reason); transcript evidence only for unhinted right presents.
- Pass: certificate (farm name, score, date) -> letter "The thing I signed" -> Crane reads the seal -> Vane's offer comes due (your answer is saved as `vaneFinal`) -> Summer teaser reading the saved flags.
- Called by `closeBooks()` with `{G, s, Story, Endings, st}`; standalone: `game.html?court=1` (careful-bot season). Tests: `test-court.js`, `court.html`. Screenshots in `docs/court-shots/`.
## T3b: story critic fixes
- Sold-out epilogue no longer compares the offer with a bot's "careful" run or claims it was too low. It sets the price beside what the farm EARNS (Cash cleared this spring, or profit while that is still in grain and invoices) and beside book equity, and says the land isn't on the books.
- Crane's offer now rises with the Cash the farm's operations have cleared and falls with the days the forecast shows the chest empty (documented in endings.js, tested both ways); book equity no longer moves it.
- The Tomas-vs-Ezra verdict uses the discount the engine books and whole coins, one number per sentence.
- Every Maud box is at most two sentences; every Crane line is in "Item:" sentences (story, scenes, cast).
- Wording: "You must be the heir"; the second order says "delighted with the first" only if you took it; Edric's page says "the same kind of order".
- The ending card, week card and Court count as screens for the stall detector; the Sold ending has a Close button; `?ending=` previews a copy and writes no unlock.
- Edric's cash book: one row per day, profit / Cash cleared / tied up in grain and unpaid invoices (Inventory + Receivables - Payables - Deposits).
- No "(coming)" text; the day-28 goal mentions the Reeve's Court. Tests: `test-t3b.js`, `test-offer.js` updated.
## Creative calls 1-5 (docs/TASKS-season1.md)
1. **Week 4:** Maud stops teaching (no daily problem, no menu of lessons; her story scenes and danger warnings still play). The daily problem comes from Ezra, with no Explain-how button; he earns trust for right answers.
2. **Letters** list in the order you found them (day found shown), and "The thing I signed" is always last.
3. **Clue cards:** title + your number + where found, at most 12 words in all (trimmed automatically; the six scene cards are authored to fit).
4. **Market Day** is on days 7, 14 and 21 only; day 28 belongs to the Court (story and sandbox).
5. **Crane's one voice** ("Item:" sentences) is in the T3b PR.
- Tests: `test-calls.js`, `week4.html`; `test-market-day.js` updated.
## T5: practice as play
- **Standing orders** (`standing.js`): one or two repeatable contracts a day (days 3-26) on the notice board from Ashby, Hobb and Mira. Check one first (margin, the road trader's price for the same sack, the seed it needs and what that leaves in Cash, when the money arrives), then take it (haggled and shipped like any order) or pass. Some are traps: **thin** (no better than the best alternative sale), **slow** (the Cash lands after the season, or the next pay-day finds the chest short) and orders the chest **can't carry**. The verdict names which; a good take after the check, or a trap checked and passed, is transcript evidence.
- **Maud's daily problem is now an optional wager:** stake 0-3 coin before seeing it; right on the first answer and it comes back doubled, anything else Maud keeps it. Real Cash, posted so the books tie. Never a gate.
- **Four new problem types** for the foundation fixes: opportunity-cost floor, the time-value flip (answer changes with Ezra's rate), the scaling gap (tied-up Cash doubles with sales) and expected value vs ruin (an EV number, then "is it safe?"). Transcript gains "Opportunity cost" and "Expected value & ruin".
- Tests: `test-standing.js`, `standing-ui.html`, `test-practice.js` extended.
## T6 + T6b: the frost almanac, the real floor, break-even, Grisby with teeth
- **Frost almanac (expected value vs ruin).** The evening before the frost the notice board gives the odds of a HARD frost (1 in 3) and the price of straw (5 a plot). Cover (certain cost, crops safe) or risk it (on average cheaper, but a hard frost kills every uncovered crop, written off at cost). After the choice Maud sets the average against the certain price and says whether losing the crops would have cost you your Crown verdict. Only a player who answers is exposed, so unattended play (bots, sandbox tuning) is unchanged. Transcript: "Expected value & ruin".
- **Opportunity-cost floor bet** after the first Market Day: Ashby offers 5, above the sack's cost; what is the lowest price worth taking? (The fair paid more.) Optional stake through Maud's usual bet. Transcript: "Opportunity cost".
- **Break-even cell** in every tally: "you kept N a sack; the week's wages and interest are W; how many sacks cover it?" Two tries, evidence only for a first-try answer.
- **Grisby matters:** above the going price he undercuts by 2 (was 1); he brings a limited stock (24 in week 2, only 5 in week 3), so he sells out part-way through the week-3 afternoon. His board shows what he asked, his stock left and what he took (and how much of it was really yours).
- **Market Day critic fixes (T6b):** Maud's bet is settled on every path (a fair quit part-way refunds the stake); Grisby's sales are capped by his stock; the demand chart leaves off earlier fairs played under the other rival condition and earlier sold-out hours; Transcript credit for demand/segments needs a price change that RAISED takings; "takings would up" reads rise/fall/stay the same.
- Tests: `test-frost.js`, `test-market-day.js` (Grisby stock, experiment, bet settlement), `market-t6.html`.
## The opening
- A 74-second animated prologue (`intro.js`, `intro.css`) opens every new story game: the valley at dusk, Edric's ledger rising while his chest empties, Crane and the Crown's writ with its scratched second seal, the man in the grey cloak buying the valley's paper, you arriving at dawn, then the title. Drawn with the game's own sprites, scored with its own music moods, with sound effects cued to the picture.
- Every spoken line is a subtitle and is also data (`Intro.SCRIPT`, `node tools/intro-script.js`): `Intro.setVoice("assets/voice/intro")` plays `<id>.mp3` per line when a voice is added. See `docs/INTRO-SCRIPT.md`.
- Skip (button or Escape) at any time; "Watch the opening" in the pause menu replays it; `?intro=0` / `?intro=1`.
- Tests: `test-intro.js`, `intro.html` (real-time runner).

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
