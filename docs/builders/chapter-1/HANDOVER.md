# HANDOVER — Chapter 1 builder — updated 2026-10-10 by game-builder (Sonnet)

## Latest (2026-10-10)
SM2 done: `chapters/ch1/summer/season.js` (registered `ch1/summer`; wiki `ch1/summer-settings`; `tests/test-summer-season.js`). SM3 done: `newGame({carry})` and `Save.startFrom(prev)` (`tests/test-summer-start.js`). Both CI green. Next card: `python infra/plan_cards.py next mba-game`. Summer numbers are [Guessing] until bot runs tune them; Summer inherits Spring's engine keys.

## State in one paragraph (older, 2026-10-09)
Spring is live as v0.4.6. Summer is docs-only until Kyle approves a design. Card U0a is done (`chapters/ch1/summer/CURRICULUM-NOTES.md`). Card U0b is built: `chapters/ch1/summer/DESIGN-DRAFT.md` follows the season design template, with 8 core ideas, week by week, opening, 5 cutscenes, Tender finale, cast, numbers sketch, platform needs, previews and risks.

## Live / branch state
master = v0.4.6. Local work is on `local/work`; `infra/git_sync_game.py` pushes it. No open PR from this builder.

## Next 3 actions
1. Lead reviews `DESIGN-DRAFT.md`; Kyle approves; the Lead renames it `DESIGN.md`.
2. Next ready card from `python infra/plan_cards.py next mba-game`.
3. File platform requests for the negotiation scene, contract object, price-test tool, three-scale sort UI and pass-line lock (draft section 8).

## Failure lesson
The first `claim` call was denied once, then passed on retry. Retry a denied claim once before building.

## Blocked on the creative lead / Kyle
- C12.11 (contract law) NOT WRITTEN. Summer's contract half of SU8 and the guarantee thread wait for it.
- C4.01 to C4.03 errors (see CURRICULUM-NOTES.md) block SU5.
- Master plan SU1 cites C2.09 and C5.01; the coverage file homes them in Spring. Lead picks the source of truth (draft section 10, item 3).
- Names for the purveyor and the clerk.

## Decisions made and why
- 2026-10-09: used master-plan ids SU1 to SU8 in the draft; mapped U0a sessions onto them.
- 2026-10-09: all numbers in the numbers sketch are marked [Guessing]; no literal player-facing numbers.
- 2026-10-04: idea 8 (legal, ethical, smart) is first to demote. Kyle's venture names must not reach player text.

## Dead ends (do not repeat)
- `tests/run-html.js` needs Playwright, not installed locally.
- Printing session files with python `print` fails on Windows (cp1252). Use the Read tool.

## Files that matter
- `chapters/ch1/summer/DESIGN-DRAFT.md`, `chapters/ch1/summer/CURRICULUM-NOTES.md`
- `docs/builders/SEASON-DESIGN-TEMPLATE.md`, `docs/MASTER-PLAN.html` §4, §13
