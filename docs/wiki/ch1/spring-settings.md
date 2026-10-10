---
title: Spring settings (the R constants)
type: data
pack: ch1
season: spring
files: [core/engine.js, chapters/ch1/spring/season.js]
symbols: [R, eventsFor, pricesFor, marketModel, events, windows, corvin, duke, market, deposits, premium, crownDebt, bridgeMax, factorRate, frostOdds, upkeep]
concepts: []
sessions: [C1.05, C1.01]
tests: [tests/test-crown.js, tests/test-spine.js, tests/test-market.js, tests/test-offer.js, tests/test-deposits.js, tests/test-court.js, tests/test-dayloop.js]
links: [ch1/court, ch1/lessons-weeks3-4, ch1/endings]
updated: 2026-10-05
---

## What it does
`R` is the one object that holds every number of Season 1: prices, wages, loan terms, the Duke's orders, the calendar of
events and the Crown's debt. The engine, the story, the bots and the tests all read the same `R`. Nothing here changes during play.
Which season `R` holds is set by the season registry in `core/engine.js` (SM1): `Spring.Season.register(id, settings)`, `Season.use(id)`, `Season.current`. Spring is `ch1/spring` and active at load. `Season.use` copies a season's settings into the one `R` object. The `OFFERS` calendar is still Spring's (SM2 and later move it into season data). Test: `tests/test-season-registry.js`.

## Where
`core/engine.js` · `R` (~8–47). Also `R.pigDay` (derived, right after `R`) and `eventsFor(seed)` (~50).

| Group (keys) | What it means |
|---|---|
| `days`, `seedCost`, `sacksPerPlot`, `unitCost`, `growDays` | 28 days. A plot costs 12 of seed. It gives 3 sacks at 4 each. |
| `upkeep`, `sprinklerSaving`, `wageFloor` | Weekly wages 45. Each sprinkler saves 20 of wages, never below 20. |
| `spotDelta`, `traderDelta` | Cart pays going price - 2. Road trader pays going price - 1. Never below cost. |
| `sprinklerHead`, `sprinklerCost`, `depPerWeek` | Sprinkler: 80, 16-week life, 5 a week depreciation (C1.05). |
| `lateGrace`, `breachPct` | An order 3+ days late is cancelled. The forfeit is 10% of its value. |
| `apDefault`, `apDays`, `discDays`, `discPct` | Tomas: "2/7, net 14". A bill 5 days overdue goes to court. |
| `prepayBefore`, `factorRate` | Ezra charges one week's interest on early repayment (before day 21). He buys an invoice at 85%. |
| `duke` | The sandbox order: 132 sacks at 10, paid 28 days after delivery, due in 12 days. |
| `corvin` | The story's orders: day 12, 66 sacks (due in 12); day 15, 132 sacks (due in 9). Both fall due day 24. |
| `crownDebt`, `bridgeMax`, `rescueRateBp` | The Crown is owed 1,250 at Midwinter. Ezra bridges up to 250 at +2 points a week. |
| `rain`, `market`, `premium` | Rain days. Going price per sack by day (index = day - 1). Buyer premium: Ashby 0, Hobb +1. |
| `deposits` | Two deposit orders: day 11 Ashby (27 sacks at 9, half up front); day 18 Hobb (24 at 10, 30% up front). |
| `pellDays`, `pedlarDays`, `poisonCost`, `pellSacks`, `pellShare` | Visitors Pell and Barnaby, and what their deals give. |
| `events`, `windows`, `fenceCost`, `pigShare`, `ratShare` | Night events: pigs 9, rats 16, warm 19, frost 23. A seed moves each inside its window. |
| `frostCover`, `frostOdds` | Straw costs 5 a plot. A hard frost has odds 1 in 3 (T6 frost almanac). |
| `field` | The field rectangle on the map. |

## Data and state
Read-only. A new game stores `s.events` (from `eventsFor(seed)`); old saves without it use `R.events`. Seed 0 is the
canonical calendar. Bots, sandbox and tests all use seed 0.

## Invariants
- Careful bot pays the Crown; overtrader and reckless lose (`test-crown.js`, `test-spine.js`). The Duke's size is tuned to this.
- `market` has one price per day, all 6–11 (`test-market.js`). Sandbox Duke equals `R.duke` (`test-market.js`).
- Offer price and bridge use `crownDebt` and `bridgeMax` (`test-offer.js`, `test-crown.js`).
- Every day 2–28 has a choice and a surprise (`test-dayloop.js`, which reads `events`).

## How to change it safely
- Change a number here, then run `node tests/run-all.js`. The bot tests catch a broken balance.
- Never copy a number into text. Take it from `R` (the Court once used a wrong constant: see `ch1/court`).
- A new event day must sit inside its `windows` entry and never share a night with another event.
- The Corvin orders and the Court claims read `corvin` and `duke`. Change them together.

## Known issues
None recorded.

## History
- WS6: `corvin`, seeded `events`/`windows`, `bridgeMax` and `rescueRateBp` added.
- T6: `frostCover` and `frostOdds`.
- WS7 (`ch1/LOG`): the fair uses `unitCost` and the going price from `market`.
