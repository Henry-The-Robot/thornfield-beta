# WS7 Market Day: test results (branch `ws7-market-day`, base `origin/master` v0.3.2-beta)

Run on 2026-10-02 (builder: Sonnet). Commands are the repo's own; nothing here is hand-typed from memory, it is the output of the runs.

## What was built
- `market.js`: pure model (villagers, reserves, Grisby, hour sim, bots, books posting) + the scene UI (overlay, canvas scene, set-up board, between-hours board, tally with demand-curve chart, Maud's bet).
- `market.css`: overlay styling (design tokens, 44px targets, 52px on touch).
- Hooks (kept small): `game.js` (stall tiles + prop, `interactTile` branch, hint text, goal-ribbon second line, `marketOpen()` guard on keys/tick, `Market.init`), `game.html` (css + script tag, own lines), `engine.js` (one word: exports `roll`), `transcript.js` (C4 `demand`, `competitor`; C8 `segments`). `story.js` and `bot.js` untouched.
- Model: 3 hours x 8 villagers. Same mix every hour (3 thrifty, 3 comfortable, 2 in a hurry) with reserves spread evenly inside each segment, so differences between hours come from the player's price. Thrifty reserve = going price - 1 (+-2), comfortable = +2 (+-1), in a hurry = +4. Reactions: bought / hesitated (price 1 over their reserve) / too dear (2+ over) / sold out. Grisby (day 14+): undercuts by 1 when you are above the going price, otherwise holds; thrifty villagers who see both buy the cheaper (ties stay with you); comfortable and hurried do not comparison-shop.

## `node tests/run-all.js` (all 13 files ok, including the new `test-market-day.js`)
Key lines from `node tests/test-market-day.js` (every check ok, final line "ALL MARKET DAY TESTS PASS"):
- same day + hour = same 8 villagers; two fairs at the same prices give identical hours (deterministic, nothing to save)
- 36 thrifty / 36 comfortable / 24 in a hurry over 12 hours; mean reserve vs going price: -1.0 / +2.0 / +4.0
- units sold never rise as price rises (no rival, 60 sacks): 33 sacks at 6 vs 9 at 11
- with stock to spare, 8 earns more takings than 10 (216 vs 150); with 12 sacks, 10 earns more than 8 (scarcity says charge more)
- Grisby: 9 -> he holds 8; 10 -> 9; 8 or below -> holds 8; absent on day 7, present from 14; thrifty switch to him only when he is cheaper (3 sacks at price 9, 0 at 8 or less); comfortable/hurried stay
- Maud's bet answer is computed by the same model: stock 12 at 8 -> "up", stock 60 at 8 -> "down"
- books: each fair posts Cash/Revenue and COGS/Inventory through `S.post`; Assets = Liabilities + Equity; Inventory ledger = sacks + seed + growing crops at cost; the cash-flow statement reconciles; barn falls by exactly the sacks sold
- **Smart pricer vs fixed price over a season** (both play the same careful farm; each fair they bring the same sacks; fixed = 8 every hour; smart reads only the faces: starts at going price + 1, raises if the hour sold faster than stock allows, lowers if slower):

| sacks brought per fair | smart gross profit (4 fairs) | fixed-8 | gain |
|---|---|---|---|
| 12 | 259 | 192 | +34.9% |
| 18 | 385 | 288 | +33.7% |
| 24 | 437 | 384 | +13.8% |

  Gate in the test: >= +15% at 12 and 18 sacks (passes). At 24 sacks the gain falls under 15% (reported, not gated): with plentiful stock the going price is already close to best, which is the lesson. Oracle (best single price per fair, 18 sacks) is 360, so the hour-by-hour pricer beats the best flat price (385) too.
- season Net income: 1750 (smart) vs 1653 (fixed); careful still closes the season with four fairs in it; careful closes and overtrader is insolvent with no fairs played (verdicts unchanged); statements tie out across all four fairs.

## Critic round 1 and what changed (all fixed or answered)
- Quit-and-reload mid-fair replayed the same villagers for extra takings: now every hour posts AND upserts the fair's record (`Market.commit` after each hour), so the stall is "had" from the first posted hour. Headless test: after one hour the fair is recorded, `available()` is false, the saved copy carries it.
- "Smart beats fixed-8" was weak: added the honest baseline, the best constant price in hindsight (9 -> 360 gross); smart 385 is 6.9% above it, gated at >= 5%.
- Chart mixed fairs with and without Grisby: the fit now uses only hours played under the same conditions, is drawn only across the prices tried, and the note says eight villagers an hour is a small sample.
- Grisby overstated: the tally and between-hours text now count only sales to villagers who would have paid YOUR price (`stolen`). New tests: at 9 with 60 sacks he costs real takings (189 vs 207 with no rival); at 11 he costs nothing. He still matters little at the going price by the spec's own rule (see limits).
- Transcript credit now needs an actual experiment (a second price; a price above the going price where Grisby answers), not just attending.
- Also: Fast toggles off in the pause; one animation loop only; legend not shown on set-up; board labels 6px; chart text larger; header clears the Menu button; chart labels moved beside the dots.

## Headless Chrome (`--virtual-time-budget`)
`tests/market-day.html` (desktop mouse 1280x800 and iPad touch 1194x834), plays a fair end to end through the real UI. Results identical on both:
- ribbon shows "To the stall" only on fair days (44px desktop, 46px touch); set-up steppers work; all buttons >= 44px on set-up, between-hours, bet and tally screens
- Fast ends an hour; sales post hour by hour (day 7: takings 158, 17 sacks, Cash +158, Revenue +158, barn 39 -> 22, Inventory ties); tally has 3 hour rows, the chart, Maud's "That's a demand curve. Yours."
- day 14: Grisby's stall on screen, Maud's bet offered (4 choices), stake 2 posted (Cash 262 -> 260), winning bet paid, tally shows the bet; transcript: demand + segments introduced on day 7, competitor on day 14
- tapping the stall again the same day: Maud says the fair is done; two fairs remembered after day 14; **JS errors: 0** in both modes
- `tests/smoke-story.html`: chapters 1-9 all stages, outcome closed day 28, **JS errors 0** (unchanged result)
- `tests/ipad.html`: 17 checks all true, errors []
- `tests/ws2-ui.html`: desktop, iPad landscape, iPad portrait: every check true, errors []

## Screenshots (`_build-shots/v0.4-market/`, 1194x834, produced by `tests/shot-market.html?scene=...`)
`00-map-stall.png` (stall on the square + ribbon), `01-setup.png`, `02-maud-bet.png`, `03-afternoon.png` (reactions, Grisby's rival board), `04-between-hours.png`, `05-tally.png` (table, segments, demand-curve chart, bet).

## Skipped / not done (stated plainly)
- Bread (Ashby hearts >= 3) and flax (WS9): no bread inventory or hearts mechanic exists in the engine; wheat only. The model takes one good, a second would be a new inventory line.
- "Past fairs" chart uses the player's own earlier fairs from `s.market.fairs` (saved in the normal save); the demand line is a plain least-squares fit and only draws when its slope is negative.
- The afternoon animation runs at 20 s an hour (about 60 s) real time; verified headless only through Fast and `Market.debug.seek`, plus screenshots mid-hour. Real-time pacing on a device is not measured.
- Weeks 21/28 are the same model as 14 (same mix; the going price is 8 on all four fair days in this engine's price table).
- `s.finaleDone` is the flag the fair checks for "day 28 only if no finale yet"; WS6 must set it (or the day-28 fair is simply offered).
