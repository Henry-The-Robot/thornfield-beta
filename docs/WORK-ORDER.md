# Work order for the next builder (cloud or local) — v0.4 → release (2026-10-03, creative lead)

**Branch:** work on `integrate-s1` (the v0.4 candidate, PR #32). One feature branch per item off `integrate-s1`, PR **into
`integrate-s1`** (not master). Never merge to master; the creative lead promotes after the quality gate.
**Binding docs (read first, in this order):** `docs/TASKS-season1.md` (canon decisions, creative calls, task table, QUALITY
GATE) · `docs/STORY-BIBLE.md` (cast, scenes, letters) · `docs/SEASON-1-REDESIGN.md` (weeks, mechanics) ·
`docs/curriculum-foundation-2026-10-03.md` (what each lesson must teach correctly).
**Rules:** every number from game state; Maud ≤ 2 sentences a box; Crane speaks in "Item:" sentences; 44 px touch targets,
mouse + touch; tests green (`node tests/run-all.js`, headless `tests/*.html`); commit + push after each step.

## Do in this order
1. **T4 — The Reeve's Court** (the exam AND the finale, day 28). `court.js` + `court.css`; `Court.run({statements, clues, flags,
   trust, seed}) → Promise<{passed, score, mistakes, certificate}>`; story.js already calls it if present. Ace Attorney format:
   Vane's advocate makes ~8 claims built from the player's own books; PRESS or PRESENT a statement line / clue card; pass = refute
   6 of 8; fail → retake with fresh numbers (never game over here). Claims to cover: net income ⇒ can pay today (→ Cash / the CFS
   line where profit went); receivables as good as cash; the farm owns nothing; Edric was unprofitable; the Duke's order was
   generous (pay terms vs wages); a guarantee is no debt (Ashby's guarantee); payable-on-demand is a gift (callable debt); one
   margin-vs-markup claim. Crane testifies once if his trust ≥ 3 (a free correct present). One Maud line after each refuted claim
   (claim → number → reason). Certificate (farm name, score) → letter "The thing I signed" (last) → end-of-spring scene → Summer
   teaser reading saved flags. Tests: `tests/court.html` (pass path, fail→retake path, answers derive from statements, 0 errors);
   `game.html?court=1` standalone hook.
2. **T3b — story critic fixes** (full list in `docs/TASKS-season1.md` row T3b). Most important: the Sold-out epilogue compares
   Vane's 300 with what the farm *earns* (cash it cleared this spring, many seasons ahead; the land isn't even on the books),
   never with book equity.
3. **Creative calls** 1–5 in `docs/TASKS-season1.md` (Maud silent as teacher in week 4, Ezra's wagers; letters ordered by day;
   clue-card wording; Market Day 7/14/21 only; Crane's one voice).
4. **T5 — practice as play:** Maud's daily problem becomes an optional coin bet / favour wager (never a gate); add **standing
   orders** (repeatable haggled contracts on the notice board between chapters, 1–2 a day, each needing a margin/cash check to
   take well); problem types for the foundation fixes (opportunity-cost floor, time-value flip, the scaling gap, EV vs ruin).
5. **T6 + T6b:** frost bet (EV vs ruin), opportunity-cost floor bet after Market Day 1, break-even cell in the tally, Grisby
   matters (undercuts harder above market; runs low in week 3); Market Day critic fixes (row T6b).
6. **Editor pass (all player-facing text):** cut every Maud box to ≤ 2 sentences; no run of > 4 dialogue boxes without a choice
   (measure with a script over a smoke run and report the longest run per day); check every teaching line against
   `docs/curriculum-foundation-2026-10-03.md`; list any line you think teaches something wrong.
7. **Day-loop report** (`tests/day-loop.html`): every day 2–28 has ≥ 1 choice and ≥ 1 surprise or set piece; fix gaps by
   scheduling existing content.
8. Bump `?v=` in game.html/index.html; CHANGELOG.

Report each finished item in its PR body: what changed, tests, screenshots at 1194×834, anything that needs a creative call.
