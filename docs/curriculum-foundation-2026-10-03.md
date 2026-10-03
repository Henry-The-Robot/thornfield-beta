---
title: "Curriculum foundations vs Spring: what every later course builds on, and what Spring teaches, teaches weakly, or gets wrong"
created: 2026-10-03
author: researcher (local-only, no web)
tags: [mba-game, curriculum, spring, foundations, review]
use-when: deciding what to add or fix in Spring (Season 1) so a player has the base for C3-C16
---

**Evidence level:** nearly all of it is read in files [Certain], with paths. Where I infer, it says [Likely]. No web used.
Builds on `reviews/curriculum-coverage-2026-10-02.md` (not repeated). Spring code read: `poc/5-spring/story.js`, `books.js`, `engine.js`.

**Headline:** Spring is strong on the curriculum's *accounting* spine (accrual vs cash, the three statements, the cash gap) and has
nothing on its *finance and decision* spine (time value, opportunity cost, expected value and ruin, cost behaviour). It also has three
teaching errors: the "tvm" mastery tag, the trade-credit line in chapter 6, and the floor price = unit cost rule.

---

> verified (creative lead, 2026-10-03): C2.07 min price = variable cost + opportunity cost (lines 26-40) ✓; working-capital
> gap "scales with revenue" (`frameworks/working-capital-overtrading.md` lines 20-22) ✓; `tvm` mastery awarded for Ezra's forecast
> and C1.06 tag on chapter 6 still present in the live code ✓. Note: this review read the frozen `poc/5-spring/`; the live game is
> the `thornfield-beta` repo (deposits and write-offs exist there).

## 1. What changed in `knowledge/mba` since 2026-10-02 12:00 [Certain: `git log`]

| Commit | Files |
|---|---|
| b28d3a62 (15:45) | C8 marketing: `sessions/01-jobs-to-be-done`, `02-segmentation-targeting`, `03-positioning` and `answers/01-03` |
| 8032c7fb (18:45), f36bc321 (19:45) | `knowledge/mba/HANDOVER.md` only (teacher directive: depth over breadth; "C7, C8, C9, C10 are yours", C12-C16 cloud builder; a run exited at the 5-hour 60% gate) |
| 364b5943, f26ee62c, 0b30de6b | `lectures/BACKLOG-LOG.md` only (log lines) |

- No new frameworks (9 on disk, all older), no READMEs, no `LEARNER.md`, `CORE-COURSE.md` or `CURRICULUM.md` changes in the window. [Certain]
- `LEARNER.md` (unchanged, last edited 09-28) matters for design: Kyle's recorded gaps are overtrading (missed twice, label does not stick),
  the cash lens (defines accrual terms as cash moving), margin vs markup (both as price ÷ cost), deferred revenue called "accounts owed",
  investing vs financing inverted, and working-capital signs. Rule: for new vocabulary, show a worked example first, one check question per chunk
  (`LEARNER.md` lines 54-66, 36). Spring's Show/Try/Use/Keep already fits that.

---

## 2. The curriculum's own statements about foundations and sequencing

The curriculum never uses the words "threshold concept" or "first principles" (grep, whole `knowledge/mba`: no matches). It states foundations
in four other ways.

**A. "Reduces to one idea" statements in sessions:**
- Time value of money: "Every valuation, every loan ... reduces to one question: what is money at a different point in time worth right now?
  ... every finance module for the rest of the core is just this formula wearing a different name" (`modules/C0-readiness/sessions/01-time-value-of-money.md` lines 11-18).
  Repeated in C5: "Get this session solid and the other nine are mechanics, not new ideas" (`C5-finance-i/sessions/01-time-value-of-money.md` line 11-12);
  "the two inputs every valuation argument eventually reduces to: the growth rate and the discount rate" (`C5/sessions/03-stocks-and-ddm.md` lines 11-12).
- Expected value: "Every business decision under uncertainty reduces to weighing outcomes by how likely they are", with the one blind spot (ruin, variance)
  (`C0/sessions/06-probability-expected-value.md` lines 11-14, 61-65).
- Cash vs claims: "Every finance concept answers one of two questions, where did cash go, or who has a claim on it ... this is the spine the rest of the
  finance track hangs off (profit vs. cash, working capital, EV vs. equity value, the waterfall, the peg, leverage all collapse into 'where cash went' or
  'who has a claim')" (`frameworks/three-statements-one-story.md` lines 10-22). `C1/README.md` line 16 calls C1 "the spine the rest of the finance curriculum" hangs on.
  C1.08 is "the module's signature skill" (`C1/sessions/08-cash-flow-statement.md` line 11).
- Working capital: "This is the module's most important session" (`C2/sessions/09-working-capital-cash-overtrading.md` line 10).
  C2 README line 31: "incentives -> cash, in that order, is the shared spine".

**B. Prerequisite graph (README frontmatter) [Certain]:** C1 is a listed prerequisite of 12 of the other 16 modules (C2, C3, C5, C6, C7, C8, C9, C10, C12, C14, C15, C16);
C0 of 11 (C3, C5, C6, C7, C8, C9, C10, C12, C13, C14, C15). C5 feeds C6, C14, C15. C2 feeds C9, C14. C4 feeds C10, C11, C12. C16 requires everything.
So the order of weight is **C0 (time value, percentages, break-even algebra, expected value) -> C1 (accrual, statements) -> C2 / C5 / C4**.

**C. Gates:** C6 session 4 (EV vs equity, the waterfall) is a hard gate: "≥8/10 quiz before sessions 5+" (`C6-finance-ii/README.md` lines 58, 67). C0 has a placement test (≥12/15 skips) (`C0/README.md` lines 73-76).

**D. Sequencing rule:** "accounting before finance, statistics before decision models, micro before strategy and pricing" (`CORE-COURSE.md` lines 52-54); build order C0 -> C1 -> C3 -> C5 -> C2 -> C6 (`CORE-COURSE.md` lines 135, 155).
The README's own reason for C0 first: it is "assumed background in week 1 of the graded core, not taught there" (`C0/README.md` lines 29-31).

---

## 3. (a) What the curriculum treats as THE foundation

Ranked by how often later modules depend on them (see 2B) and how explicitly the files say so.

| # | Idea | Where it is called foundational | Later courses that need it |
|---|---|---|---|
| 1 | **Accrual vs cash; the three statements as one story** (profit is a claim, cash is a fact; the gap sits in receivables, inventory, payables) | `three-statements-one-story.md`; C1.02, C1.08; C2.09 | C2, C5 (free cash flow), C6 (leverage vs cash volatility, waterfall), C9, C14, C16 |
| 2 | **Time value of money / discounting; opportunity cost of capital** | C0.01 lines 11-18; C5.01 lines 11-12, 28 ("your opportunity cost of capital") | C5 all, C6, C14 (payback), C11 (real vs nominal rate, Fisher), C16 |
| 3 | **Working capital and the cash conversion cycle** (the gap scales with revenue) | C2.09 line 10; `frameworks/working-capital-overtrading.md` | C9 (inventory), C14, C16 (Duke replay) |
| 4 | **Expected value and ruin** (EV is not the decision when you cannot repeat the bet) | C0.06 lines 11, 61-65; previews C3 | C3 (decision trees, Monte Carlo), C5 (risk and return), C6, C14 |
| 5 | **Cost behaviour: fixed vs variable, contribution margin, break-even** | C2.01-03; C0.03 break-even algebra; C4.03 scale | C4 (pricing, MES), C8 (pricing), C9, C14 (unit economics), C16 |
| 6 | **Opportunity cost / marginal and incremental thinking** | stated inside sessions, not as a headline: C2.07 "minimum price = variable cost + opportunity cost of the capacity used" (lines 25-26, 29-42); C4.01 marginal cost (line 54); C4.03 incremental analysis (`answers/03.md` lines 33-38); C5.01 | C4, C10, C12.05 (pay the raise if replacing costs more), C14 |
| 7 | **Incentives** | module topics, not foundations: C2.08, C7.02, C12.05 | C7, C12, C14 |
| 8 | **Unit economics** | `frameworks/unit-economics.md`; C14 README | C14, C8 (CLV) |

[Likely] Items 6 and 7 are the foundations the curriculum *uses more than it names*. Only item 6 recurs across four modules; no session
states it as a headline idea. A game can name it, which the sessions do not.

---

## 4. (b) Spring against those foundations

Spring tags: C1.01, C1.04, C0.02, C1.02, C2.09, C1.06, C5.01, C1.08 (`story.js` line 6).

| Foundation | Spring | Verdict | Evidence |
|---|---|---|---|
| 1 Accrual vs cash, three statements | ch4 (receivable, "two books"), ch5, ch9 (all three statements, player clicks the line where cash went) | **Taught well.** It hits Kyle's recorded cash-lens gap directly. | `story.js` 113-134, 197-210; `books.js` highlight picks AR / inventory / AP / capex / loan repayment, the same five mechanisms as `frameworks/profitable-but-broke.md` and C2.09 |
| 3 Working capital / overtrading | ch5 forecast, ch8 Duke | **Taught, but half.** It is a one-order liquidity test. It misses the curriculum's core claim: the gap *scales with revenue* and only reverses when growth stops; no days measures (DSO, DIO, DPO, CCC). | `story.js` 175-195; compare C2.09 lines 41-89 and `working-capital-overtrading.md` lines 19-30 |
| 2 Time value / opportunity cost of capital | ch7 "Interest" only | **Missing.** Interest is shown (rate x loan per week); nothing is ever discounted or compared across time. The "tvm" tag is awarded for something else (see 5.1). | `story.js` 161-174 |
| 4 Expected value and ruin | none | **Missing.** The Duke order is a ruin scene (Crown due 1,000 by Midwinter) but is framed as a cash-forecast question. | C0.06; `story.js` 56 |
| 5 Fixed vs variable, break-even | weekly wages and interest are fixed, seed per plot is variable, sprinkler depreciation (`engine.js` line 12). None is named. Floor price is "unit cost" only. | **Missing.** C2.01-02 are planned for Summer (`STORY-year-one.md` lines 90-97 per coverage survey). | `story.js` 82-102 |
| 6 Opportunity cost / marginal thinking | haggle, rival buyers at the fair, Ashby's offers | **Weak and partly wrong.** The floor price is "what a sack cost you". That ignores the best alternative sale and that seed already bought is sunk. See 5.3. | `story.js` line 93; C2.07 |
| 7 Incentives | none (wages are a weekly bill) | Missing. Right to defer to C7 / C2.08 later. | coverage survey section 3 |
| 8 Unit economics | gross margin per sack only | Partial (fine for Spring) | `story.js` 85-93 |
| Deposits / unearned revenue (C1.01 uses it, lines 39-62; Kyle's 09-26 "accounts owed" slip) | **Not found** in `poc/5-spring/` (grep: deposit, unearned, write-off: no matches). The brief says they are in the live build. [Likely] they are in a newer file I did not read. | Check they carry a tag. | `LEARNER.md` line 62 |

---

## 5. (c) Where Spring conflicts with the curriculum's definitions or numbers

### 5.1 The "tvm" mastery tag does not match C5.01 (wrong credit) [Certain]
`story.js` line 168 marks `mastered("tvm")` when the player fills Ezra's forecast; line 172 files the notebook entry "Interest" under id `tvm`.
C5.01 defines TVM as PV = FV / (1+r)^t, with r the opportunity cost of capital (`C5/sessions/01-time-value-of-money.md` lines 25-37).
Spring never discounts. The transcript would show "time value mastered" for filling a forecast correctly. Fix the tag (call it `interest` / `lender-reads-forecast`) and
earn `tvm` only from a discounting choice (rec. 1).

### 5.2 Chapter 6 trade credit: wrong length of time, and the comparison flips later [Certain from code]
- Maud says "Ezra charges more than 2% for two weeks of coin; Tomas's credit is cheaper" (`story.js` line 156). The terms are 2% off if paid by day 7, due day 14
  (`engine.js` line 15: `apDays 14, discDays 7, discPct 0.02`). Skipping the discount buys **7 days**, not two weeks.
- Cost of giving up the discount: 2 / 98 = 2.04% for 7 days (about 106% a year, simple). Ezra's rate is `max(50, 350 − 25e − rateAdj)` basis points a week
  (`engine.js` line 80), with trust e starting at 4 (`engine.js` line 41) = 2.5% a week at chapter 6. So at chapter 6 "keep Tomas's credit" is cheaper (2.5% > 2.04%), barely.
  Chapter 7 then drops the rate to 1.5% (4 right cells = −100 bp), and later trust pushes it toward 0.5%. At that point **borrowing from Ezra to take the discount wins**,
  and the notebook rule from chapter 6 tells the player the opposite.
- The curriculum has no trade-credit / "2/10 net 30" session (grep: no "trade credit" in modules). The tag **C1.06 is wrong**: C1.06 is bond interest expense vs coupon and leases
  (`C1/sessions/06-liabilities-and-leases.md` objective, line 5). The honest sources are C1.01 (payable as a liability) and C0.01 / C5.01 (cost of money over time).
  This is the best place to teach foundation 2 (see rec. 1).

### 5.3 Floor price = unit cost conflicts with C2.07 and C2.02 [Certain]
- `story.js` line 93 and 87: "the lowest you'd take before a sack loses money" = the cost per sack (4); "Never go below the floor (your cost)."
- C2.07: minimum price = variable cost + **opportunity cost** (the best sale you give up); with a rival paying more, the floor is that rival's price (`C2/sessions/07-transfer-pricing.md` lines 25-42).
  The market fair has two rival buyers at different prices (coverage survey section 2). Selling Ashby at 5 (above the 4 "floor") is a loss against selling at the fair for 8.
- C2.02: break-even needs contribution margin to cover fixed costs (`C2/sessions/02-cvp-breakeven.md` lines 27-30). Spring's weekly wages and interest are the fixed costs. A sack at 4.50 "above the floor"
  still does not pay wages.
- Fix: call 4 the **cost** or **cost floor** and add the opportunity-cost floor once the fair exists. Not a number error, a definition that becomes false the moment a second buyer appears.

### 5.4 Overtrading definition is thinner than the curriculum's [Certain]
- Spring's notebook (`story.js` line 193): "Taking more orders than your Cash can carry: profit on paper, broke in fact. Forecast before you say yes."
- Curriculum: the cash gap is one that "**scales with revenue**" (not a one-time delay), "double the sales of a distributor and it needs roughly double the receivables and inventory", and "it only comes back
  when growth stops" (`working-capital-overtrading.md` lines 19-30; C2.09 lines 83-89). Its measure is working capital = receivables + inventory − payables and the CCC, in days.
- Spring's version is a point-in-time liquidity check. It is not wrong, but Kyle has missed overtrading twice and `LEARNER.md` line 80 says the next try must use "his actual cash cycle, with numbers".
  The scaling claim is the part that lets the label stick, and it is what C9, C14 and C16 build on.
- Small bug: `story.js` lines 189-192 award `mastered("overtrading")` if cash stays ≥ 0 *or* the player took less than all 90, and the "half / decline" line says "Growth you can't fund isn't growth"
  even when the player's own board showed the cash was fine. [Certain from code; low severity.]

### 5.5 What already matches (no change needed) [Certain]
- Gross margin = gross profit ÷ revenue: matches C1.09 (`C1/sessions/09-ratio-analysis.md` line 44). Chapter 3 arithmetic checks: 3/7 = 43%, 2/6 = 33%, 3/4 = 75%, 2/4 = 50%.
- Markup is defined nowhere in `knowledge/mba/modules` (grep). The only definitions are the game's and the E0 diagnostic in `LEARNER.md` lines 66, 76. The `C0.02` tag on margin/markup is loose:
  C0.02 is percentage points vs percent change, CAGR, and margin as an example (`C0/sessions/02-percentages-growth-margins.md`). Not a conflict, but there is no curriculum session to point Kyle back to for markup.
  [Likely] Worth a skill PR / request to add 3 lines on markup vs margin to C0.02.
- Receivable: revenue on delivery, cash on payment, the gap in AR (`story.js` 113-134) matches C1.02 lines 36-43.
- Indirect cash flow: `books.js` line 17 `cfo = net + dep − dAR − dInv + dAP` matches C1.08 (asset increase subtracts, liability increase adds, depreciation added back; C1.08 lines 56-61), and line 22 cross-checks it with the direct method (`cfoDirect`), which is better than the session.
  Capex in investing, borrowing and repayment in financing (`books.js` 18-20) matches C1.08's three sections and helps Kyle's investing/financing inversion (`LEARNER.md` line 77).
- Cash forecast: day-by-day cash in / out is the **direct method**. The curriculum teaches no such forecast (C2.05 is static vs flexible budgeting; C2.09 works from yearly balance-sheet deltas and days). So the C2.09 tag on ch5 is
  loose but not contradictory; the forecast is game-native and bridges C1.08 (indirect) and C2.09. [Likely]
- Depreciation: 80 over 16 weeks = 5 a week (`engine.js` line 12), straight line, added back in CFO. Consistent with C1.05 and `frameworks/capex-vs-depreciation.md`. Not yet taught as a scene.

---

## 6. (d) Recommended additions and changes to Spring (priority order)

Order logic: fix the two things that give wrong credit first, then add the foundation with the most dependants that Spring lacks, then deepen the strongest existing scene.

### 1. Time value and the cost of waiting: rebuild chapter 6 around it (C0.01 + C5.01)
- **Source:** `C0/sessions/01-time-value-of-money.md` (derive: "100 now or 120 in 3 years at 8%", lines 20-44); `C5/sessions/01-time-value-of-money.md` lines 25-37 (opportunity cost of capital).
- **Change:** Tomas's "2% in 7 days" becomes "what does waiting a week cost me?" Player computes 2.04% a week, compares it with Ezra's rate on the board, and decides. The comparison flips with the rate, so the choice is real. Rename the notebook entry; give `tvm` mastery only here.
- **Farm scene:** Tomas offers 2% off for paying in 7 days; Ezra's rate this week is 1.5%. Borrow 100 from Ezra to pay Tomas early and keep 2? Next week Ezra's rate rises to 2.5%: same offer, opposite answer.
- Fixes 5.1 and 5.2 together. No new engine rule needed (`discNow`, `terms` already exist).

### 2. Opportunity cost and the cost floor: finish chapter 3 (C2.07 + C2.02)
- **Source:** `C2/sessions/07-transfer-pricing.md` lines 25-42 (variable cost + opportunity cost); `C2/sessions/02-cvp-breakeven.md` lines 27-30.
- **Change:** after the first haggle, once the fair shows a rival buyer, ask "Ashby offers 5. Your cost is 4. Why is 5 a bad deal?" The notebook splits "cost" (4) from "what the next-best buyer pays" (the real floor). Add the fixed weekly bill: "how many sacks at this margin to cover wages?" as a one-cell question (a tiny CVP).
- **Farm scene:** Ashby offers 5 a sack; the fair across the road pays 8 for the same sack. Selling to Ashby "makes" 1 a sack and costs 3.
- Fixes 5.3 and lays C2.01-02 for Summer.

### 3. Overtrading as a gap that scales: extend chapter 8 into a repeat order (C2.09 + `working-capital-overtrading.md`)
- **Source:** C2.09 lines 41-89 (working capital tied up = AR + inventory − AP; the gap doubles when sales double); `working-capital-overtrading.md` lines 19-30.
- **Change:** after the Duke's order, a **second** Duke order the next fortnight, bigger. A one-line board shows "tied up in sacks and invoices" (AR + inventory − AP) beside Cash, and doubling the order doubles the line. Replace the notebook sentence with the scaling claim. Ask: "When does this cash come back?" (answer: only when orders stop growing). Rename the transcript tag if needed. Add a plain "days" number only after the idea lands (Kyle's label-binding gap: label after mechanism, tied to his own farm, `LEARNER.md` lines 56-60).
- **Farm scene:** the Duke wants 90 sacks this fortnight, 180 the next. The "tied up" line on the board goes from 300 to 600 while profit climbs. Where is the cash?
- Fixes 5.4 and prepares C9 (inventory) and C16 (Duke replay).

### 4. Expected value and ruin: one bet-the-farm scene (C0.06)
- **Source:** `C0/sessions/06-probability-expected-value.md` lines 43-70 (EV; most likely outcome vs positive EV; a loss that ends the company).
- **Change:** one choice with two or three outcomes and probabilities, where the highest-EV option can ruin the player because of the Crown's 1,000 deadline. The player computes EV, then sees why not to take it.
- **Farm scene:** a caravan carries your grain to the coast: 70% it sells for double, 30% bandits take it all. EV is positive (+40%), but the Crown wants 1,000 by Midwinter and a 30% loss of the whole store loses the farm. Stake a third instead?
- Gives C3 (decision trees, Monte Carlo) and C6 (leverage) their base. Optional for Spring if length is a problem; it is the cheapest of the four to move to Summer.

### 5. Tag and make visible the deposit (unearned revenue) scene (C1.01 / C1.03)
- **Source:** `C1/sessions/01-accounting-equation.md` lines 39-62 (unearned revenue as a liability, settled in service not cash); `C1/answers/03.md` lines 10-13 ($24,000 − $6,000 = $18,000 unearned).
- **Change:** confirm the deposit scene carries the `unearned revenue` label and that the notebook says "cash in, nothing earned yet, so it is a liability". [Likely] it exists in the live build but I could not find it in `poc/5-spring/`. Kyle called deferred revenue "accounts owed" (`LEARNER.md` line 62); the label must be tied to the scene.
- **Farm scene:** Hobb pays 30 coin now for a delivery in two weeks. The chest is fuller, the Ledger shows no revenue, and the balance sheet shows 30 owed in sacks.

### Not recommended for Spring
- **Incentives:** wait for C7 / C2.08 (hiring and wages, Summer onward). [Likely]
- **Unit economics (CAC / LTV):** wait for C14.
- **Marginal thinking:** it is half-covered by rec. 2; the full version is C4.03 (Summer).
- **Depreciation as its own scene:** low-risk, low-value; rec. 1 and the closing statements already show it.

### Cheap tag fixes (no new scenes)
- Chapter 6: change the tag C1.06 -> C1.01 / C5.01. Chapter 3: say "cost floor". Chapter 7: rename the `tvm` entry. Ch3 header: C1.04 is FIFO/LIFO; the idea taught is C1.01 (cost into inventory).
- The coverage survey and `CURRICULUM-MAP.md` coverage table were already flagged stale; this survey found none of the foundation courses (C0, C1, C2, C5) changed since 09-24.

---

## 7. Confidence and gaps
- [Certain] for every file path, line and quote above; counts in 2B come from the `prerequisites:` frontmatter lines (grep).
- [Likely] for the ranking in section 3 (my read of the dependency graph, not stated by the curriculum), the claim that items 6 and 7 are "used more than named", and the live-build deposit scene.
- I did not read C3, C4, C7, C8, C12 sessions in full; for those I used grep and the 10-02 survey. I did not run the game.
- Strongest counter-evidence to rec. 1: Spring already has 9 chapters and Kyle gets overwhelmed by new vocabulary (`LEARNER.md` line 36). Mitigation: rec. 1 and 2 *replace* a line in existing chapters rather than add a chapter; recs. 3-5 each ride on a scene that already exists.
