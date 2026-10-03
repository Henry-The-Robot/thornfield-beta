# Season 1 task list — merged plan (v1.0, 2026-10-03, creative lead)

**What this is:** one ordered list of work for Spring, merging `SEASON-1-REDESIGN.md` (creative lead) with the cloud agent's
playtest response (Google Doc "Playtest Response and PR Review Guide": PRs #27 audio, #28 cast/scenes/letters, #29 practice,
`docs/STORY-BIBLE.md` on branch `claude/story-cast`). Revert points: `v1.0`, `v2.0`.

## Kyle's goal for Spring (from his playtest, via the cloud doc)
By the end of Spring the player **passes a short, not-hard exam**, enjoyed playing, feels they learned something, and **wants
to play on**. His notes: not enough *practice playing*; story not pulling him in; add **sound and music**.

## Canon decisions (creative lead, binding on every builder)
1. **Story bible = `docs/STORY-BIBLE.md` (cloud, PR #28)**, amended by these decisions. It wins over SEASON-1-REDESIGN §2 where they differ.
2. **The villain is Steward Corvin Vane** (one name: cloud's "Vane" + WS6's "Corvin"). He buys up the valley's notes; the Duke's
   order was the cash gap he needed. WS6's "Corvin Vale" is renamed everywhere.
3. **Crane is NOT Vane's man.** He's the honest ex-clerk who finds the scratched second seal (bible). WS6's week-3 line
   "Master Vale sends his regards" is cut. Crane *delivers* the day-1 buy-out offer as Vane's instructed messenger, reluctantly
   ("Item: I am instructed to convey an offer. Item: I do not recommend it.").
4. **Two offers, one arc:** day 1 the buy-out (WS6, time value: 300 now vs the farm later); day 24 Vane's "partnership"
   mortgage payable on demand (bible: callable debt). Both refusable; both feed the endings.
5. **Week structure (WS6) + village scenes (PR #28) coexist:** weeks give the rhythm (cards, Market Day, Maud's fade);
   scenes are the optional texture between chapters. Midpoint stays day 12 (Vane's order + Edric's page).
6. **The finale is one thing: the Reeve's Court.** Ledger Duel format (Press/Present against claims built from your own books)
   *is* the exam: ~8 claims, pass = refute 6; retake with fresh numbers; certificate. Crane testifies for you if his trust ≥ 3
   (one free correct Present): relationships with teeth. Then letter 9, the end-of-spring scene, the Summer teaser.
7. **Practice (PR #29) is the "practice playing" answer**, plus Market Day as the repeatable skill loop. Practice adds the
   foundation fixes as problem types (opportunity-cost floor, the time-value flip, the scaling gap, EV vs ruin).
8. **Sound ON by default** (cloud) is accepted; Kyle judges the music by ear on the iPad (`sound.html`). If grating → composed loops.

## Tasks (ordered; owner; depends on)
| # | Task | Owner | Depends | Status |
|---|---|---|---|---|
| T1 | Integrate cloud stack #27 → #28 → #29 onto master as `next` | local Sonnet "integrator" | — | queued |
| T2 | Merge WS7 Market Day into `next` | integrator | T1, WS7 PR | WS7 finishing |
| T3 | Merge WS6 story spine into `next`, applying canon 2–5 (rename, Crane's role, scenes + weeks) | integrator | T1, T2, WS6 PR | WS6 finishing |
| T3b | **WS6 critic fixes (PR #31 review, NOT SHIP until done):** (1) Sold-out epilogue — creative call: Vane's 300 buys the farm *and* takes on its debts; compare it with what the farm *earns*, not its book equity: "a farm that cleared N in cash this spring is worth many seasons of N; the books don't even list the land (the millstream Vane wants)". Lesson = book value ≠ what a business is worth (future cash), no "always lower" claim. (2) tvm verdict uses the engine's rounded discount; one number per line. (3) Offer price: rises with the season's operating cash, falls with desperation (document + test both directions). (4) Maud ≤ 2 sentences per box (story.js 252, 307, 335). (5) Crane's "Item:" voice on all his lines. (6) wording: "delighted with the first" only if accepted; "You must be the heir"; Edric's page says "the same kind of order". (7) Ending overlay counts as a panel for the stall detector; Sold has a Close. (8) Desk offer card verified in a screenshot. (9) Cash-book table: dedupe days, short header, label the gap honestly (stock + receivables − payables). (10/11) stale ribbons, stray caption; no "(coming)" text to players. Fragile: `?ending=` must not write real unlocks; run the mercy visit and the week-3 flip in a browser; restore the second order's design due day and rebalance via price/terms instead | local Sonnet | T3 | queued |
| T4 | **The Reeve's Court** finale (canon 6) + letter 9 + end-of-spring scene + Summer teaser reading saved flags | **cloud agent** | builds standalone in `court.js` now; wires in after T3 | sent |
| T5 | Practice: reframe Maud's daily problem as a **coin bet / favour wager** (optional, stakes, never a gate); add problem types for the 4 foundation fixes; weekly tally after Market Day uses practice.js; add **standing orders** (repeatable haggled contracts between chapters) as the main practice loop | local Sonnet | T3 | queued |
| T6 | Frost bet (EV vs ruin) + opportunity-cost floor bet after Market Day 1 + break-even cell + **make Grisby matter** (PR #30 known issue: at the going price he barely bites; he should undercut harder when you're above market and run out of stock in week 3) | local Sonnet (with T5) | T3 | queued |
| T6b | Market Day critic round 2 fixes (PR #30): commit each hour as played + settle/refund Maud's bet on a mid-fair quit (test it); cap Grisby's "took" by remaining stock; mark/omit the other-condition faded dots and hollow sold-out hours; stricter transcript credit (needs a price change that raised takings) + negative test; fix "takings would up"; legible Grisby board | local Sonnet (with T6) | T3 | queued |
| T7 | Crops (wheat + flax), restoration board, hearts that unlock terms, Jory | local Sonnet | T3 | queued |
| T8 | Release v0.4-beta to master after creative-lead review; bump `?v=` | creative lead | T1–T4 | — |
| K1 | Listen to `sound.html` + first day on the iPad: music good / grating? | **Kyle** | T1 live on a preview | — |
| K2 | Read `docs/STORY-BIBLE.md` cast table (1 page): tone OK? | **Kyle** | — | — |

## Creative calls on the v0.4 candidate (PR #32 "Needs a creative call", 2026-10-03)
1. **Maud in week 4:** silent as a *teacher* (no shows, hints or Explain-how from her); her story scenes (confession, the eve) still play. Week-4 practice wagers come from **Ezra** ("patience has a price; I merely publish it").
2. **Letters:** order by the day found; Edric's midpoint page joins the sequence by day; "The thing I signed" is always last (after the Court).
3. **Clue-card wording:** each card = a short title + the player's number + where found (≤ 12 words). Editor pass owns it.
4. **Market Day:** days 7, 14, 21 only. Day 28 is the Court.
5. **Crane:** one voice everywhere, "Item:" numbered sentences.
State: **v0.4 candidate = PR #32, branch `integrate-s1`** (run-all 17/17, smoke 0 errors, bots over 40 seeds: careful paid 29 / bridged 11; overtrader and reckless lose 40/40).

## Quality gate before Kyle plays another season (creative lead, 2026-10-03)
Kyle: keep working unless confident the changes will impress him and fix what he raised. Nothing goes to him until ALL hold:
| Kyle's problem | Gate (measured, not assumed) |
|---|---|
| A short exam at the end of Spring | The Reeve's Court exists, is passable by a careful player, retakeable with fresh numbers, certificate (T4). |
| "Not enough practice playing" | ≥ 3 repeatable *decision* loops each week that use the ideas with stakes (Market Day, haggled orders/contracts, Maud's coin bets). **Practice problems must be game moves (bet coin, earn favour), optional, never a gate** — a quiz loop is the failure GAME-DESIGN §1a bans. |
| Story not pulling in | Each week ends on a hook; the midpoint twist (day 12) and the seal reveal land in a scripted run; no run of > 4 dialogue boxes without a choice; every Maud box ≤ 2 sentences (editor pass over ALL story text). |
| Doesn't teach as you go | Every Spring concept has predict → play → reveal; a curriculum check of every teaching line finds 0 wrong lessons (the Sold-out flaw class). |
| Dull stretches | Day-loop report: every day 2–28 has ≥ 1 choice and ≥ 1 surprise or set piece. |
| Sound/music | On by default with a mute; Kyle's ear test (K1) or composed fallback. |
| Stability | Full scripted season 0 JS errors; save/restore mid-week, mid-fair, mid-court; iPad checks green. |
| Felt quality | **Creative lead plays week 1 and week 4 personally at iPad size** in the merged build and writes what was dull, confusing or great, then fixes before release. |

## Answers to the cloud doc's §8 decisions
1. PR #17 (iPad) is merged and live (with #26, v0.3.2-beta). Close #18–#25 (done).
2. Music by ear: Kyle (K1). Story tone: creative lead + Kyle (K2).
3. Merge order/target: #27 → #28 → #29 rebased onto master via `next` (T1); future PRs base `next`.
