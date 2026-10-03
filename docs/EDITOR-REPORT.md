# Editor pass and day-loop report (work order items 6-8)

Measured on `claude/s1-candidate` = `integrate-s1` + PRs #33 (Court), #34 (T3b), #35 (creative calls), #36 (T5), #37 (T6). Reproduce with `node tests/test-editor.js --list`, `node tests/test-dayloop.js --table`, `tests/smoke-story.html` (the "dialogue runs" line), `tests/day-loop.html`.

## 1. Maud: at most two sentences a box
`tests/test-editor.js` scans every call that makes Maud speak (`tell`, `say`/`sayP`/`G.say("maud", ...)`, `ask`, `dlg({who:"maud"})`, scene `c.maud`), her character sheet, and the engine's coach lines. Before: 14 boxes in source, 9 in her character sheet, 1 coach line over two sentences. After: 0.
Where a box taught too much it was split into two boxes instead of cut (the deposit lesson, the Pell sale lesson, the Ledger tour intro and its three habits, the bet reveal, the Ledger-lesson boxes). Nothing was dropped except filler words.

## 2. No run of more than four boxes without a choice
A choice = two or more buttons, or a typed number. The run resets when the game day changes or the player acts in the world.
- Live story smoke run (`smoke-story.html`, seed 3): longest run per day `d1:4 d8:2 d12:3 d13:2 d15:2 d16:4 d22:2 d28:3`, overall **4**.
- Before the fixes the same run showed a 5-box run on days 16 and 28 (the bet reveal and the guided close).
- Scenes and conversations (`test-editor.js`, every branch of the 12 scenes): longest scene run is 4 (`ashby_guarantee`); no character topic is longer than 4 boxes.
Limit of the measurement: it covers the guided story and the optional scenes, not every combination of village conversations a player can chain by hand.

## 3. Teaching lines checked against `docs/curriculum-foundation-2026-10-03.md`
Matches the foundation (no change): equation and equity can be negative; inventory at cost; gross margin = profit / price (markup shown separately); receivables; the cash forecast and "profit doesn't pay wages"; trade credit and time value (after T3b: whole-coin discount vs interest, the answer flips with the rate); interest; overtrading with the scaling claim; the three statements; unearned revenue; Hobb's extension as an unpriced loan; callable debt; the opportunity-cost floor (T6 bet, T5 problem and standing orders); EV vs ruin (frost almanac, T5 problems).

Lines I thought were wrong or loose, and what I did:
| Line | Problem | Action |
|---|---|---|
| Crane, ch1: "is this farm worth more than nothing, or less?" | Conflates book equity with worth; the T3b epilogue now teaches that book value is not worth | Changed to "do you own more than you owe, or less?" |
| Market Day tally: "a price rise wins when the sacks you lose are fewer than the extra coin on each sack that stays" | Mixes units (sacks vs coin) | Rewritten: coin gained on sacks that still sell vs coin lost on sacks that no longer sell |
| Court: "a guarantee ... is a liability" | A guarantee is a contingent liability (disclosed, booked only when a loss is probable) | Court press line now says contingent liability; Maud's explanation already did |
| Standing orders: a price equal to the trader's "gives up that sale for nothing" | At an equal price you lose nothing, you gain nothing | "gains you nothing over the sale you'd give up" |
| Sold-out epilogue compared with a bot run | Not what a business is worth | Replaced in T3b (earnings and book equity, land off the books) |

Left for the creative lead (judgement calls, not bugs):
1. The haggle UI still frames the floor as "your cost floor"; the opportunity-cost floor appears only through the first-fair bet and the T5 standing orders. The foundation doc (5.3) also asks the notebook to split "cost" from "the real floor".
2. The "scaling gap" practice problem says doubling sales doubles the tied-up Cash. That is the curriculum's claim, simplified.
3. The current-ratio practice problem counts the Crown debt and the loan as current liabilities. Defensible (due within a year) but worth one look.
4. Court claim 3 ("the farm owns nothing of worth") accepts Inventory or Equipment as the refutation; Total assets is the cleaner answer.
5. Maud's "Profit is an opinion. Cash is a fact." is a slogan: it is true for the farm, not for accounting in general.

## 4. Day loop (item 7)
Every day 2-28 must offer at least one choice and at least one surprise or set piece, over 40 seeds (`node tests/test-dayloop.js`). Before: no gaps in choices (standing orders cover days 3-26) but surprises were missing on days 3, 4, 5, 10, 16, 20, 25 and 26 depending on the seed. Fixes use only existing content:
- The notice board's three notices now recur (`NOTICE_DAYS` in `engine.js`): tinker 2; trader 3, 6, 10, 25; hands 4, 12, 16.
- Rain days count as a surprise (the weather changes the work).
- The notice board draws a red "!" when it has a notice or standing orders.
- A scene is a choice from its first day for its window (three days when it has no end day).
After: no gaps (`tests/day-loop.html` prints the per-day table). The metric is generous about what counts as a surprise (a notice, rain); whether those days *feel* eventful is for the lead's week-1 and week-4 playthrough.

## 5. Version
`?v=` bumped 0.4.0 -> 0.4.1 in `game.html`.
