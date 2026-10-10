# HANDOVER — mba-game (Ledger & Crown) — updated 2026-10-05 05:10 UTC by the local Lead (Opus, `lead:mba-game`)

> **This is the Project Lead's handover, and this file is the only copy.** The Lead runs as a local Opus session in
> `C:\Users\Kylev\Agent System` and edits the game in `projects/mba-game/repo` (branch `local/work`).
> `infra/git_sync_game.py` commits and pushes every 30 minutes and keeps one PR open. Never git commit or push by hand.

## State in one paragraph
Master = v0.4.6 plus the **platform stack, merged by the Lead 2026-10-05 ~05:01 UTC**: P1 CI (check `tests`), P2 one
version stamp, W1 wiki lint, W2 wiki seed (13 ch1 + 13 platform pages, coverage strict), P3 golden runs + the move into
`core/` and `chapters/ch1/spring/` (goldens byte-identical). Local/work is rebased onto it; `python infra/game_test.py`
passes. The Builder is now the local Sonnet task `game-builder` (hourly 07:35–22:35); it pulls **cards** from
`projects/mba-game/PLAN.json` (`python infra/plan_cards.py show mba-game`). Seven cards are ready, in order: G1 save +
carry-record design (docs), U0a Summer curriculum notes, U0b Summer design draft, T1 drift fixes, P4b saves build, P5
season data + market model, P6a scene player. Open PR: #54 (local/work). #53 closed as its duplicate.

## Roles
- **Project Lead** = this local Opus session: plan, cards, reviews, canon merges; ≤ 3 Haiku subagents (research only).
- **Project Builder** = Sonnet task `game-builder`; kickoff `projects/mba-game/KICKOFF-BUILDER.md`.
- **Daily PR reviewer** = task `curiosity` (Sonnet, 09:40): merges clean Normal PRs, **max 2 PRs a run, oldest first**;
  never merges canon (README, CHARTER, WORK-ORDER beyond a status tick, DESIGN.md, OUTLINE.md, master plan).

## START HERE (2026-10-05 ~12:10 PT): fresh Lead session
0. `python infra/help.py list --to lead:mba-game --open` FIRST, every session, and again before stopping (missed 8
   asks for 2.7 h on 10-05). Self Review: `reflections/2026-10-05/lead-mba-game.md` (honesty 14/14).
1. **Full-game decomposition** (Kyle via coordinator 093910 + 094455, manager 114426): the end state first, then
   100+ cards, chapters 1-3 in full, `skills/plan-doc.md` (now Roadmap), with `overlap_ok_when` for 2 Builders. Each card:
   one verb, <= 3 files, 20-50 min, check = `projects/mba-game/tools/check.py` (pushed + CI green + a file/text
   condition). 42 cards exist (29 new small ones, R0 first).
2. DONE 2026-10-06: Lead reviewed and merged #55 (527b39f, tag `v0.4.9-beta`). **v0.4.9 is live** (iPad fill,
   five cutscenes, saves v4 + export/import, cash-cycle days, who-is-paid-first). CI green, so the P6a/P6b goldens are
   proven. Follow-up card B2 (two literals, scope_ref path). Still to do: screenshots at 1194×834 and 834×1194 from
   the live site.

## Next 3 actions (Lead, older)
1. Review the Builder's output: G1 is DONE and reviewed (Lead section in `docs/design/save-and-carry.md`: season
   record vs chapter carry, heir = careful@seed0 frozen, stakes numeric); check P4b follows it. U0a notes (done, not yet
   reviewed); U0b
   `chapters/ch1/summer/DESIGN-DRAFT.md` (then send it to Kyle for approval via the manager). Merge #54 when it holds
   canon (the reviewer will not). Write the next cards (P6b… story.js chapters) when P6a lands.
2. Spring deep dive (PLAN item L4): Haiku agents read the 15 Spring sessions + answers; compare with the teaching
   lines in `chapters/ch1/spring/` (story, scenes, practice, court) and `core/market.js`; write
   `projects/mba-game/reviews/spring-deep-dive-2026-10-0X.md`; turn findings into cards.
3. Check the help ask to the coordinator (`python infra/help.py list --from lead:mba-game`): reviewer ran on 10-05,
   and the `tests` check made required. Check master CI went green after the merges (`gh run list --branch master`).

## Failure lesson
- What cost most (10-05, local): the plan had no `cards`, so the hourly Builder would have idled; and the pack
  WORK-ORDER on local/work still showed P1 as GO (the stack was unmerged), so a Builder following it would redo P1.
- Rule: at the start of a Lead session run `python infra/plan_cards.py next mba-game`; if it prints `none` while work is
  open, write cards first. Keep ≥ 3 ready cards ahead of the Builder.
- Followed last lesson: yes — reached the coordinator by `infra/help.py`, not by send_message.

## Blockers (2026-10-05 07:30 PT) and how each is being resolved
- Builder idles on 2-hour card leases (ledger 06:57). Stopgap: KICKOFF-BUILDER "Release before you exit". Fix asked:
  coordinator help 20261005-072058 (shorter lease or a release command).
- Summer design (U0b) waits on curriculum fixes (C4.01-03, C7.01, C8; C12.11 contract law). Routed to lead:mba;
  C4 had no MBA card yet (asked in 20261005-072058).
- Lead has no scheduled run: asked the manager for a daily Opus game-lead run (help 20261005-072618).
- `tests` required check: coordinator help 20261004-215943 (open).
- Spring deep dive L4 in flight: two Haiku researchers write `projects/mba-game/reviews/spring-deep-dive-{A,B}-2026-10-05.md`.
  Next session: read both, check 2–3 claims, merge into one `spring-deep-dive-2026-10-05.md` (that satisfies PLAN L4),
  turn WRONG items into cards ahead of S7.
- New card S2 (what Summer needs, built into Spring) is last in the queue, after S5.
- **L4 DONE (2026-10-05):** verdict `projects/mba-game/reviews/spring-deep-dive-2026-10-05.md`. No wrong teaching;
  all gaps are scope. Spring keeps 8 core ideas. Card T2 adds two cheap lines and retags. Coverage map now has
  `spring_scope`/`rest_home`: C1.04 LIFO → Ch2, C1.08 build → Ch1 Winter, C0.02 pp → Summer, CAGR → Winter,
  C16.01 → Ch4. Part B was wrong about C1.08 (books.js:17 is the indirect method).
- **P4b REVIEWED (2026-10-05 ~11:55 PT):** the core is sound, with three MAJOR integration gaps → card P4c (see
  `docs/design/save-and-carry.md`, "Lead review of P4b").
- **RED CI:** the local/work PR (#55) has been red since 09:45. First a stale wiki symbol; now 3 browser pages:
  court.html crash, golden-story mismatch, lessons-s1 praise/evidence. The Builder ran cards through S5 on red (local
  tests skip the browser pages). Card R0 is first; speed_note rule 6 says no card is done on red CI.
  Coordinator asked (help 20261005-115424) to allowlist `gh run view --log-failed` and gate `done` on CI.
- NEXT LEAD SESSION: confirm #55 is green, then read the full diff of the P6-S5 work. The checks were weak, so check
  the cutscenes against the story bible and S7 at 1194×834. Then merge #55 (it holds canon: the T2 coverage copy). That
  ships v0.4.7 to Kyle's iPad.
- Superseded draft notes (kept for history): deep dive results (both done, not yet spot-checked). A: 5 sessions correct, C0.02 a loose tag (no pp-vs-% or CAGR),
  C0.03 algebra and the speaking session missing. B: C2.01, C2.02, C5.01 correct; gaps: C1.04 (no FIFO/LIFO/reserve),
  C1.08 (no indirect-method cash flow), C2.09 (no DSO/DIO/DPO/CCC; card S2 already adds this). Lead's draft call, to
  confirm next session: Spring keeps <= 8 core ideas (S1). LIFO reserve and indirect cash flow become previews, or move
  their home to a later season in `curriculum-coverage.json` (comparing firms fits Chapter 2). Do not cram them into
  Spring. Retag C0.02 as preview, or add one pp-vs-% beat.

## Blocked on Kyle
- Nothing now. Summer design (U0b draft) will need Kyle's approval when it exists.

## Push to Spring + Summer playable (Kyle 2026-10-09: "get the first and second season playable. After that we'll pause")
- ElevenLabs MCP works (connector id 94648465…). Flow XOFEZioDAK1mj34PHBB4: 11 opening lines (voice "Daniel – The Gruff
  Old British Wizard", eleven_v3) + 4 sfx (eleven_text_to_sound_v2); ~1,070 credits total. Files are on local/work:
  assets/voice/intro/i01-i11.mp3 (the engine's setVoice naming), assets/sfx/intro/{rain,gate,coins,seal}.mp3. The rain
  is only 2 s (requested 10 s): loop it, or regenerate with a set duration if Kyle likes the test. Card V1 wires it
  behind ?vo=1. Test link once V1 merges: https://henry-the-robot.github.io/Ledger_and_Crown/game.html?vo=1
- Repo renamed to Henry-The-Robot/Ledger_and_Crown (old name redirects for gh and git). Live site moved to
  https://henry-the-robot.github.io/Ledger_and_Crown/ (the old URL is a 404).
- Summer DESIGN.md approved to build (Lead review = section 0). 24 cards SM1-SM5, SU-*, then SU-R1 = v0.5.0.
- Merging: the reviewer task `curiosity` is disabled, so only a Lead session merges the local/work PR. Each Kyle ping:
  check CI, read the diff, merge.

## Decisions made and why (newest first)
- 2026-10-10 (Kyle, after listening on iPad): the narrator voice is great; the ElevenLabs sfx are worse than the built-in
  synth sounds (the 2 s rain loop is choppy), so the opening keeps its synth cues (sfxFiles removed from core/intro.js;
  assets/sfx/intro unused). Only a few lines played on iPad in v0.4.10: an <audio> element started by the timeline is
  blocked there. v0.4.11 (merged by the Lead, PR #57) plays voice files as decoded WebAudio buffers through the shared
  context the first tap unlocks; a line never waits more than 2.5 s behind a stuck one. The Lead built this fix itself
  because Kyle was waiting in game; CI green incl. the new WebAudio check in tests/voice-opening.html.
- 2026-10-06 (Kyle): test ElevenLabs voiceover + sound on the opening only; Kyle reviews, then decides for the whole
  game. Card V1 (Builder) adds audio-file playback behind `?vo=1` (the live game is unchanged). The Lead generates the
  11 opening lines (695 characters) + a few sound effects, once ElevenLabs is reachable from a Lead session. On 10-06
  it was not: no connector, MCP tool or env key was visible.
- 2026-10-06 (Kyle, via coordinator): the Lead runs no cron and no scheduled run. It acts only when Kyle writes or a
  blocking help request is waiting: review PRs, adjust the plan, unblock Builders. My ask for a daily Lead run is withdrawn.
- 2026-10-05: Kyle: "proceed as planned but push the builder to deliver more faster". Cards now run T1 → P4b → P5 →
  P6a → P6b → P7 → P8 → S7 (iPad fill + v0.4.7, first visible change) → S5; PLAN.json `speed_note` (loop to budget,
  one critic round, tests+goldens+lint gate); P6 story port is one card; U0b waits on curriculum fixes (C4.01-03,
  C7.01, C8) routed via the coordinator, who was also asked for a 30-min Builder cadence.
- 2026-10-05: the Lead merged the platform stack itself (merge commits, bottom-up). Why: all six reviewed, CI green,
  the ch1 WORK-ORDER says the creative lead merges, and the reviewer's 2-PR cap would have idled the Builder 3 days.
- 2026-10-05: season designs are drafted as `DESIGN-DRAFT.md` (not canon; reviewer may merge); the Lead renames to
  `DESIGN.md` after Kyle approves. Why: one local/work PR carries all local work; a canon file in it holds up code.
- 2026-10-05: `market.js` stays in `core/` (Market Day recurs every season; P5 moves its prices to season data).
- 2026-10-05: keep `Scenes.morning` (guarded hook for P6) and the unused Codex functions (P10); ch7 tag C1.06 →
  C0.01 + C5.01. P4 split into G1 (design) and P4b (build). U0 split into U0a (notes) and U0b (draft); U0 runs now as
  docs-only because Kyle wants Chapter 1 fully designed first.
- 2026-10-05: `CREATIVE-PLAN.md`, `CURRICULUM-MAP.md` marked superseded by the master plan + coverage map.
- 2026-10-05: the Lead acts without asking inside the plan and its limits (Kyle; `help/AUTONOMY-CONTRACT.md`).
- 2026-10-04: daily Sonnet PR reviewer; one builder role + per-chapter packs + code wiki; platform before Spring polish;
  Court 9 claims / pass 6.

## Dead ends (do not repeat)
- `send_message` from a cloud session to a local session: it never arrives. Locally use `infra/help.py`.
- `git_sync_game.py` skips the rebase when the tree is dirty: run it twice (commit, then rebase) to pull in master now.
- Drive `create_file` rejected a ~17 KB HTML upload with a 37-row table; a shorter table worked.

## Files that matter
- Agent System: `projects/mba-game/PLAN.json` (items + cards) · `MASTER-PLAN.html` · `REVIEW-QUEUE.md` ·
  `curriculum-coverage.json` · `KICKOFF-BUILDER.md` · `infra/git_sync_game.py` · `infra/game_test.py`.
- Game repo: `docs/builders/` (README, packs) · `docs/wiki/` · `docs/MASTER-PLAN.html` · `docs/TASKS-season1.md`.
- Revert points: tags `v0.4.6-beta`, `v0.3.2-beta`, `v1.0`, `v2.0`; pre-stack master = merge base of PR #45.

Older notes (2026-09-29 → 2026-10-03): `docs/builders/lead/HANDOVER-HISTORY.md`.
