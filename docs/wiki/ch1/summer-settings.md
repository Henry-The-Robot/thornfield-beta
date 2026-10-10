---
title: Summer settings (the Summer season data)
type: data
pack: ch1
season: summer
files: [chapters/ch1/summer/season.js, core/engine.js]
symbols: [king, buyerTerms, waterBill, millWing, demand, testPlot, scarce, gift, banner]
concepts: []
sessions: [C2.09, C5.01, C16.11, C1.06, C4.01, C4.03, C3.09]
tests: [tests/test-summer-season.js]
links: [ch1/spring-settings]
updated: 2026-10-10
---

## What it does
Summer's numbers as data, in the shape of Spring's `season.js`. It starts from Spring's engine keys and adds Summer's. `core/engine.js` registers it as `ch1/summer`; `Season.use("ch1/summer")` makes it active. Spring stays active at load.

## Where
`chapters/ch1/summer/season.js`. Each line cites its session.

| Key | Meaning |
|---|---|
| `king` | 120 sacks at 10, paid by tally in 42 days. Ezra buys the tally at 3% a week off (SU1). |
| `buyerTerms` | Buyers ask 14 days. A week of credit is worth 2%; a swap cuts 3% for a shorter term (SU2). |
| `waterBill` | Principal 60, 2 years unpaid, 8% interest. Interest owed = 9.984 (SU3). |
| `millWing` | Unit cost 20 before, 15 after (C4.03 corrected). |
| `demand` | q = 92 - 6p. At price 8 the elasticity is -1.09 (C4.01 corrected). |
| `testPlot` | One plot, 30% good odds, pass line locked first (SU7). |
| `scarce`, `gift`, `banner` | Cart slots (SU4); the clerk's gift and Ashby's penalty clause (SU8). |

## Invariants
Hand checks in `tests/test-summer-season.js`: tally 984, interest 9.984, unit costs 20 and 15, elasticity 1.09.

## How to change it safely
All numbers are [Guessing] until the Summer bot runs tune them. Change a number, then run `node tests/run-all.js`. Never copy a number into player text.

## Known issues
Summer inherits Spring's engine keys (market, duke, corvin). Later cards replace what Summer does not use.
