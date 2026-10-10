# HANDOVER — mba-game (Ledger & Crown) — updated 2026-10-10 14:10 PT by the local Lead (Opus, `lead:mba-game`)

> The Project Lead's only handover. The Lead is a persistent local Opus session in `C:\Users\Kylev\Agent System`; it edits
> the game in `projects/mba-game/repo` (branch `local/work`). `infra/git_sync_game.py` commits, pushes and keeps one PR
> open (every 30 min, or run it by hand). Never git commit or push by hand.

## START HERE (every session)
1. `python infra/help.py list --to lead:mba-game --open` first, and again before you stop.
2. `python infra/plan_cards.py show mba-game` and `gh pr list -R Henry-The-Robot/Ledger_and_Crown --state open`.
3. Kyle's rule (10-06): no cron, no scheduled Lead run. Act when Kyle writes or a blocking ask waits.

## State in one paragraph
**Live: v0.4.11** at https://henry-the-robot.github.io/Ledger_and_Crown/ (the repo was renamed from thornfield-beta;
the old URL is a 404; old-name gh/git calls still redirect). Spring is complete and playable: saves v4 + export/import,
five cutscenes, iPad fill, cash-cycle days, who-is-paid-first, the break-even lesson fix (B1). The **ElevenLabs
narrator** plays on the opening only with `?vo=1` (11 lines, voice "Daniel – The Gruff Old British Wizard"). It plays
through WebAudio so iPad works; Kyle liked the voice. The ElevenLabs sfx were dropped: Kyle prefers the built-in sounds.
**Summer** design is canon (`chapters/ch1/summer/DESIGN.md`, Lead review = section 0) and 24 cards are queued
(SM1-SM5, SU-*, SU-R1 = v0.5.0). Kyle's goal: "get the first and second season playable. After that we'll pause."

## Roles
- **Lead** = this session: plan, cards, reviews, merges (the reviewer task `curiosity` is disabled, so only a Lead merges).
- **Builder** = Sonnet task `game-builder` (hourly, loops cards; kickoff `projects/mba-game/KICKOFF-BUILDER.md`).
- Card checks: `projects/mba-game/tools/check.py` (pushed + CI green + a file/text condition).

## Next 3 actions
1. Ask Kyle whether every opening line plays on his iPad (v0.4.11) and whether the voice goes game-wide (then make it
   the default and voice the cutscenes; budget: ~60-100 credits a line).
2. Each Kyle ping: check the open PR's CI, read the diff, merge (the Builder's Summer work lands in PR #58 and later).
3. When SU-R1 lands: play-test Summer end to end (Spring close → Begin Summer → the Tender), review against
   DESIGN.md section 0, merge as v0.5.0, tell Kyle, then pause (Kyle's instruction).

## Blockers
- No merge without a Lead session (reviewer disabled). Offered Kyle: re-enable `curiosity`, or ping the Lead.
- No browser playback on this PC (the built-in pane runs hidden, so cutscene timers stall). CI's Chromium is the proof;
  Kyle's iPad is the final check for sound.

## Failure lesson (10-05 → 10-10)
- What cost most: card checks that only asked "does the file exist". 10 cards closed while CI was red for 2 h. Rule:
  every card check runs `tools/check.py` (pushed + CI green). Followed since 10-05: yes.
- New (10-10): a sound feature passed CI but failed on iPad (timer-started <audio> elements are blocked there). Rule:
  any audio work plays through `FX.ctx()` (the context the first tap unlocks), never a fresh `new Audio()` on a timer.

## Decisions made and why (newest first)
- 10-10 Kyle: narrator voice yes, ElevenLabs sfx no (choppy 2 s rain). Opening keeps the synth cues; assets/sfx/intro unused.
- 10-10 Lead built the iPad audio fix itself (Kyle was waiting in game); PR #57, CI green.
- 10-09 Summer approved to build on Kyle's order. Section 0: blockers cleared (all 18 Ch1 sessions pass), 60-90 min,
  no new scene types (Tender on the scene player), names Penhallow / Wendel / Goody Marsh, start from Spring's carry record.
- 10-06 No Lead cron; a Lead acts on Kyle's message or a blocking ask (Kyle via the coordinator).
- 10-06 Merged #55 (v0.4.9) after a full diff read; two pre-existing literals fixed later (B2).
- 10-05 Spring deep dive: no wrong teaching; gaps are scope. Spring keeps 8 core ideas; missing parts got later homes
  (`curriculum-coverage.json` `rest_home`). Verdict: `projects/mba-game/reviews/spring-deep-dive-2026-10-05.md`.
- 10-05 Season designs start as DESIGN-DRAFT.md; DESIGN.md is canon after Kyle approves.
- 10-05 The Lead merged the platform stack #45-#52 itself (the reviewer's 2-PR cap would have idled the Builder 3 days).

## Dead ends (do not repeat)
- `send_message` across sessions: it does not wake the other agent. Use `infra/help.py`.
- `git_sync_game.py` skips the rebase when the tree is dirty: run it twice to pull master in now.
- `gh pr checks <branch>` fails; use the PR number (check.py does this).
- ElevenLabs sfx `duration` is not settable from the prompt ("10 seconds" gave 2 s); signed download links expire in 2 h.
- `new Audio()` started by a timer on iPad Safari: silent. Use decoded WebAudio buffers.

## Files that matter
- Agent System: `projects/mba-game/PLAN.json` (cards; `speed_note`) · `KICKOFF-BUILDER.md` · `tools/check.py` ·
  `REVIEW-QUEUE.md` · `curriculum-coverage.json` · `reviews/` · `infra/git_sync_game.py` · `infra/game_test.py`.
- Game repo: `docs/builders/` (packs) · `chapters/ch1/summer/DESIGN.md` · `docs/design/save-and-carry.md` · `docs/wiki/` ·
  `core/cutscene.js` (voice playback) · `assets/voice/intro/`.
- ElevenLabs: connector `94648465…` (creative_* tools), flow XOFEZioDAK1mj34PHBB4 (all takes).
- Revert points: tags `v0.4.9-beta`, `v0.4.6-beta`. Older notes: `docs/builders/lead/HANDOVER-HISTORY.md`.
