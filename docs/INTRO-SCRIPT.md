# The opening: script, sound and voiceover

A new story game opens with a 74-second animated prologue (`intro.js`, `intro.css`) before the first lesson. It tells the setup in six shots, scored with the game's own music and effects, with every spoken line on screen as a subtitle. The script is data, so a voice can be added without touching the animation.

## What the player sees
| Shot | Time | Picture | Score | Effects |
|---|---|---|---|---|
| 1. The valley at dusk | 0:00 | Slow push-in on the farmhouse, a lit window, smoke, a crow | night | bell, wind-whoosh, a knock |
| 2. The ledger and the chest | 0:13 | The ledger's profit line climbs while the chest's coins fall out and Cash counts down to EMPTY | night | page turns, coins, a thud |
| 3. The writ | 0:26 | Crane walks in with the writ; it unrolls: 1,250 by Midwinter; the Crown's seal, then the small scratched second seal | tense | knocks, steps, stamps |
| 4. The grey cloak | 0:39 | A hooded figure with a smile; paper stacks up; the valley's houses are stamped SOLD one by one | crane | whoosh, stamps, a chime |
| 5. The heir arrives | 0:51 | Dawn; you walk up the road; Maud waits at the gate with her abacus | farm | morning birds, steps |
| 6. Title | 1:06 | LEDGER & CROWN, Spring at Thornfield, a spinning coin | town | a rising chime |

Controls: a "Begin" gate first (the tap that unlocks sound on iPad), then **Skip** (44px button, or Escape) at any time. It plays on a brand-new story game only (Continue, the sandbox and test URLs go straight in). `?intro=1` forces it; "Watch the opening" in the pause menu replays it. Sound follows the game's Music and Effects switches.

## The script
Source of truth: `Intro.SCRIPT` in `intro.js`. Print it for a voice service with `node tools/intro-script.js json|csv|txt`.

| id | Speaker | Line |
|---|---|---|
| i01 | Narrator | Thornfield Valley, in the spring of a hard year. |
| i02 | Narrator | Edric Thornfield farmed here for thirty years, and he made a profit every one of them. |
| i03 | Narrator | Every night, his ledger said he was richer. |
| i04 | Narrator | Every payday, his chest said something else. |
| i05 | Narrator | He died in winter. The farm was left to you. |
| i06 | Narrator | And the Crown came with a writ: twelve hundred and fifty coins by Midwinter, or the land is theirs. |
| i07 | Narrator | Someone in the valley has been buying up paper: mortgages, promises, other people's debts. |
| i08 | Narrator | A man in a grey cloak, who smiles a great deal. |
| i09 | Narrator | You have one spring to learn why a farm that earns a profit runs out of coin. |
| i10 | Narrator | Maud Fenwick, the reeve, is waiting. She will not say 'good' unless you earn it. |
| i11 | Maud | Profit is an opinion. Cash is a fact. |

Each line also carries a delivery note (for example "flat, quiet, the turn" for i04) and the longest the clip may run so it fits its picture.

## Adding the voiceover later
1. Run `node tools/intro-script.js json` and send each `text` (with its `direction`) to your voice API. Use one narrator voice and, for i11 only, Maud's (dry, exact, kind underneath).
2. Save each result as `<id>.mp3` (for example `i01.mp3`) in one folder, for example `assets/voice/intro/`. Keep each clip at or under its `maxSeconds` so it ends before the next line starts. If a clip must be longer, change that line's `at`/`dur` in `Intro.SCRIPT` and the shot lengths in `Intro.SHOTS`.
3. Turn it on with `Intro.setVoice("assets/voice/intro")` (a one-line call, for example at the end of `intro.js` or in `game.js` before `Intro.play`). Each line's file starts playing when its subtitle appears. Subtitles stay on screen either way.
4. Missing files are ignored (the subtitle still shows), so voices can be added line by line.
5. Mix: the narration is not ducked under the score yet; if the voice sits under the music, lower the music bus (`FX.musBus.gain`) while `Intro.active`.

## Tests
`node tests/test-intro.js` (script and timeline rules: unique ids, two sentences, reading speed, no overlaps, cues inside shots) and `tests/intro.html` (in the real game: opens on a first visit, six distinct pictures, every line shown in order, sound cues and the score's moods, a voice file requested per line, Escape and Skip, pause-menu replay, hand-over to Crane). `intro.html` needs a real-time browser: `node tests/run-html.js tests/intro.html 120000`.
Screenshots: `docs/intro-shots/`.
