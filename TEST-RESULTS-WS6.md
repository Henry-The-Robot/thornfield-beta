# WS6 story spine: test results (branch ws6-story-spine, v0.4.0)

## Node tests (`node tests/run-all.js`): 14/14 ok
test-crown, test-deposits, test-depreciation, test-events (now 3 seeds), test-loans, test-market, **test-offer (new)**, test-pell, **test-spine (new)**, test-sprinkler-move, test-sprinkler-value, test-teach, test-transcript, test-walkoff.

## Bots (tests/test-spine.js, story-shaped game, Corvin's orders injected: day 12 = 66 sacks due day 24, day 15 = 132 sacks due day 24)
- careful: paid. overtrader: insolvent (sued for the 132 forfeit). reckless: insolvent.
- Before retune (second order dueIn 12) the overtrader ended PAID (703 over), so `R.corvin[1].dueIn` was set to 9 (due day 24, same day as the first order).
- 40 seeds: careful {paid 29, bridge 11}, never insolvent/short; overtrader insolvent 40/40. (Careful never buys the fence or poison, hence the bridges.)

## Crane's offer (tests/test-offer.js, 19 checks)
price = max(150, round(max(0, equity) + 300 - 10 x daysInGap)), daysInGap = days of the next 14 where forecast Cash < 0. Day 1: 300. Cash 0: 8 gap days, 220. Cash 10 (< wages 48): mercy 132. Sold-out epilogue: careful bot on a deep copy (original unchanged), worth on day 28 = 1368 (seed 0, verdict paid), re-run independently equal.
Note: the spec's variable "days_until_midwinter_cash_gap" is implemented as "days in the 14-day forecast with Cash below zero" (documented at the top of endings.js); the literal reading gave 150 on day 1, not the 300 the script names.

## Browser tests (headless Chrome)
- smoke-story (4-week flow, seed 3): stages intro -> ... -> sleep8 -> duke8 -> page8 -> sleep9 -> duke9 -> tomas9 -> run9 -> done; outcome closed day 28; weeks 1-4 cards shown; farm name overlay clicked once; 19 clues pinned (incl. offer, page5, duke2, tvm2, cashbook); mastery: tvm answered once (week 2 choice matched the cheaper option), 0 JS errors; all four `?ending=` hooks render (Sold out 4 lines + figures, Seized 3, Bridged 3, Free 4 with "The Audit (coming)").
- hud-ribbon (21 real goal texts, 3 viewports), ipad, ws2-ui, one-check, predict-spoiler: all green.

## Screenshots: `_build-shots/v0.4-story/` (regenerate: `node _build-shots/shoot-ws6.js`)
week1-4, offer (Crane's day-1 card), desk (the offer card at the Desk), corvin (midpoint, new sprite), tied (what-if timeline with the "tied up in sacks and invoices" line), page (Edric's page 6), tvm (Tomas vs Ezra's rate), cashbook, ending-sold/seized/bridged/free, case-board (real played-through state: 20 clues).

## Canon changes applied late (coordinator): villain is Corvin **Vane**; Crane is only Vane's reluctant messenger (numbers his sentences "Item:"); week-3 "Master Vale" line removed; village-scene hook (`Scenes.morning`) and finale slot (`Court.run`) left as guarded calls, nothing built.

## Not done / known gaps
- Item 4 *Free* is the current close + verdict + "The Audit (coming)"; the duel is WS8 (`Court.run` slot exists).
- Seeded events: Pell/Barnaby windows are derived from the pig/rat nights; in the story they only appear once chapter 5 is reached, so an early pig night can skip Pell.
- Tied-up line is on the Corvin what-if timelines only (not on the generic forecast board).
- Mercy visit (week 3, Cash < wages) is untested in the browser; its price is covered in test-offer.
