# Season 1 redesign — "The Uncle's Ledger" rebuilt (v1.0, 2026-10-03, creative lead)

**What this file is:** the new story structure and new gameplay for Spring (Season 1). Supersedes the chapter table in
`STORY-year-one.md` for Spring. Inputs: Kyle's playtests, `reviews/critical-pass-v0.3-2026-10-02.md`,
`research/player-critic-gaps-2026-10-03.md` (§6), `reviews/curriculum-foundation-2026-10-03.md` (§7).
**Revert point before this work:** tag `v2.0` / branch `release/v2`.

---

## 1. What's wrong with the story today (as a story)
- **No antagonist with a motive.** Crane appears once and leaves. The Crown is a number, not a person. Nothing pushes back.
- **The mystery is told, not solved.** "Profit isn't cash" is stated by Maud in chapter 4 and confirmed at the close. The
  player never *assembles* the answer, so there's no "aha" and no reason to keep reading the journal.
- **Flat middle.** Chapters 5–8 are a list of lessons. No midpoint turn, no "all is lost", no rising pressure. The Duke's
  order arrives as one more customer.
- **No B story.** Every relationship is transactional. Players stay in Stardew for the people as much as the farm.
- **The ending is a spreadsheet.** Closing the books is the climax; it's correct and quiet. A season needs a showdown.
- **Linear quest arrow.** One thing to do at a time; no weekly rhythm to look forward to.

## 2. The structure: a 4-week season as a 3-act story
Built on Blake Snyder's beat sheet (*Save the Cat*, 2005), the mystery convention of planting every clue before the
reveal (the "fair play" rule of detective fiction), and Nintendo's kishōtenketsu for each week (introduce, develop,
twist, conclude). One week of game days ≈ one act beat cluster ≈ 12–15 minutes of play.

**The secret (the spine, revealed at the midpoint):** Edric didn't just overtrade by accident. The Duke's steward,
**Corvin Vale**, offered him a huge order on long terms every spring, knowing the cash gap would sink him, so the estate
would be seized and sold cheap to the Duke. **Bailiff Crane works for Corvin.** The business lesson (a big customer on
slow terms can kill a profitable firm) becomes the villain's weapon. Players who forecast see through it; players who
don't, repeat Edric's fate. The mystery's answer *is* the MBA's first lesson, and the player proves it themselves.

| Week (days) | Act / beats | What happens | Concepts | Weekly set piece |
|---|---|---|---|---|
| 1 (1–7) "The writ" | Opening image · theme stated · catalyst · debate · break into Act 2 | Rain, the gate, Crane tagging the estate (negative equity). Maud states the theme: *"Profit is an opinion. Cash is a fact."* **Crane's offer:** "The Duke will take this farm off your hands today for 300." Take it (an early, honest bad ending with the numbers of why) or refuse. First harvest, Ashby, Tomas, Hobb on terms. | A = L + E, margin & floor, inventory at cost, receivables vs cash, **time value (300 now vs the farm later)** | **Market Day** (day 7) |
| 2 (8–14) "Promises" | Fun and games · B story · midpoint | Hire **Jory** (farmhand, B story: a young hand who idolised Edric). Wages day bites. Ezra wants a forecast. The fair has a rival stall (**Grisby**). **Midpoint, day 12:** Corvin arrives with the dream order (132 sacks). That night Maud finds the journal page in Edric's hand: *the same order, every spring*. False victory flips to dread. | Cash forecast, payables, interest, opportunity cost (which crop), segments at the fair | **Market Day** (day 14) |
| 3 (15–21) "The squeeze" | Bad guys close in · all is lost | Pigs, rats, frost (already built) now arrive as Corvin's pressure: Crane "visits" when Cash is low and raises his offer if you're desperate. Ashby offers a deposit; Pell offers a deal. **All is lost (a payday you can't meet)** unless the player planned: Ezra's one rescue, factoring the Duke's invoice, or selling the sprinkler. Jory's loyalty is tested (do you pay him late?). | Overtrading, factoring, deposits (unearned revenue), write-offs, expected value (the frost bet) | **Market Day** (day 21) |
| 4 (22–28) "The reckoning" | Dark night · break into Act 3 · finale · final image | Maud gives you **Edric's cash book**, the second ledger he kept and ignored: the clue that solves the mystery. Day 28: **The Audit**, Crane and Corvin before the Crown's magistrate: an *Ace Attorney*-style **Ledger Duel** where you defend the estate with your own statements. Final image: the chest, full or empty; the hook for Summer (Corvin: "Summer is long, heir. Your busiest month is coming."). | The three statements, the cash-flow statement as evidence, claim → number → reason | **The Audit** |

**Endings (replayable, all teach):** *Sold out* (took Crane's 300 on day 1: the epilogue shows what the farm was worth
by Midwinter) · *Seized* (insolvent: Edric's fate, with the post-mortem) · *Bridged* (Ezra carries you: you survive in
his debt) · *Free* (paid the Crown, Corvin exposed at the Audit). Hades-style: each ending unlocks a journal page or a
Traveller's letter, so a loss still progresses something.

## 3. New gameplay (fun first; each mechanic also teaches)
Ranked by fun × teaching ÷ build cost. Exemplars named; each must pass GAME-DESIGN §1a (the idea is the mechanic).

| # | Mechanic | How it plays | Fun because | Teaches | Exemplar |
|---|---|---|---|---|---|
| M1 | **Market Day** (weekly fair) | Every 7th day you run a stall for one in-game afternoon (≈90 s real time). Set prices on 2–3 goods on a chalk board; villagers of 3 types (thrifty, comfortable, in-a-hurry) walk past and buy or don't, with visible reactions. A tally shows sales at each price. Grisby's stall across the lane undercuts you from week 2. | A short, replayable, skill-based loop with immediate feedback; beat last week's takings | Demand and price (C4.01), segments (C8.02), competitor response (C4.02), revenue vs units | *Recettear* (shop haggling), *Moonlighter* (price-reaction faces) |
| M2 | **The Ledger Duel** (season finale) | Crane makes claims ("Your farm made 1,113 profit, so you can pay the Crown today"). You **Press** (ask for detail) or **Present** a line from your own statements that contradicts him. 3 lives (the magistrate's patience). Win = Corvin's scheme exposed. | A boss fight made of the season's knowledge; dramatic; replayable | Reading the three statements; profit vs cash; claim → number → reason (C0.08, C1.08) | *Ace Attorney* |
| M3 | **Crane's offer** (a standing buy-out) | Crane offers to buy the farm; the price moves with your equity and your desperation. Accepting ends the season with a reveal of what you gave up. Shown on a card in the Desk. | A temptation with a ticking price; agency over the ending | Equity value, time value (money now vs later), bargaining from weakness | *Reigns* (a binary choice with consequences) |
| M4 | **Two crops + plot planning** | Wheat (4-day, low margin, the staple) and **flax** (7-day, high margin, sells only at the fair to the weaver). Plan the field on a grid. | Stardew's core joy: choosing what to grow | Contribution per plot-day (C2.03), opportunity cost | *Stardew Valley* crop planning |
| M5 | **Thornfield restoration board** | A board in the barn with 5 repairs (fence, cellar, second sprinkler, barn roof, mill share). Each shows cost, what it saves or earns per week, and payback. Restoring changes the farm visibly. | A visible collection goal and progression | Payback and capital decisions (C1.05 depreciation, C5 intro) | *Stardew* Community Center bundles |
| M6 | **Hearts that pay** | Trust becomes visible hearts per villager (exists in data). 3+ hearts unlock: Ashby's deposits, Hobb pays in 7 days, Tomas's credit limit. Small favours (deliver early, a gift of flour) raise hearts. | Stardew's relationship loop; NPCs matter | Relationships as business assets: credit terms, customer lifetime value (C8 intro) | *Stardew* friendship |
| M7 | **Jory, the farmhand** | Hire him in week 2. Choose wage vs "you'll run the east field" (autonomy) vs "I'll teach you the books" (mastery). His mood shows in what he does; paying him late costs loyalty. | A person whose fate you shape | Motivation beyond money (C7.02) | *Stardew* NPC arcs |
| M8 | **The frost almanac bet** | Day before the frost: 1 in 3. Pay for straw cover or risk it. Maud keeps a running score of your bets across the season. | A gamble with readable odds | Expected value vs ruin (C0.06) | *Slay the Spire* risk choices |

Already built and kept: haggle with floor line, Maud's bets, timeline, tag, deposits, pigs/rats/frost, Pell and Barnaby,
notice board, emergency loan, sprinklers, Crown fund meter.

## 4. Teaching changes inside the story
- **Clues, not lectures.** Every lesson leaves a clue: a journal page, a ledger line, a villager's line. The **case board**
  in the farmhouse (a corkboard of pinned clues) fills up through the season. At the Duel, clues become your evidence.
  The player assembles "profit isn't cash" from their own pins.
- **Maud fades on a schedule the player can see:** week 1 she shows, week 2 she asks, week 3 she bets, week 4 she's
  silent (you're on your own at the Audit).
- **Weekly interleaving:** each Market Day ends with Maud's two-question "tally" mixing that week's ideas with earlier
  ones (margin vs markup; revenue vs receipt), as bets with coin.

## 6. Gaps from comparable games (`research/player-critic-gaps-2026-10-03.md`, directional only)
| Pattern players love | Spring today | Answer in this redesign |
|---|---|---|
| Collection / completion goal | none | Restoration board (M5) + case board of clues (§4) |
| Relationships with mechanical teeth | trust exists, invisible | Hearts that pay (M6), Jory (M7) |
| Surprise events that force choices | 4 events on fixed days | Keep; **seed the event days per game** (same seed = same game) so replays differ; Crane's "mercy" visits when Cash is low |
| Daily/weekly rhythm with short goals | one quest arrow | Weekly arc + Market Day every 7th day + weekly tally |
| Visible mastery | transcript only | Market Day takings record per week; Maud's season bet score |
| Ownership / customisation | none | Name your farm and paint the stall sign at the first Market Day (cheap; appears on the Crown's writ and the epilogue) |
| Life after the goal | season ends | Endings unlock journal pages / letters; Corvin's Summer hook |
Failure modes to avoid (same file): early-game slowness, opaque systems, spreadsheet feel, grind without story purpose.

## 7. Curriculum foundation fixes (`reviews/curriculum-foundation-2026-10-03.md`, 3 claims verified against source files)
The curriculum's foundations for everything after Spring: accrual vs cash · time value / opportunity cost of capital ·
working capital that **scales with revenue** · expected value and ruin · fixed vs variable cost · opportunity cost. Spring
teaches the first well and misses or bends the rest. Changes, folded into the weeks above:
1. **Time value, honestly.** Crane's offer (300 today vs the farm at Midwinter) and Tomas's discount become the time-value
   scenes. Week 2: "2% off for paying 7 days early" vs Ezra's weekly rate; the right answer **flips** when Ezra's rate
   changes the next week (C0.01, C5.01). `tvm` mastery is earned only here; Ezra's forecast scene is retagged `interest`.
   Fix Maud's "two weeks" line (the discount window buys 7 days).
2. **The floor is cost + the best sale you give up** (C2.07). After the first Market Day, Ashby offers 5 while the fair paid
   8: Maud's bet "why is 5 a bad deal at a cost of 4?". Notebook splits *cost floor* from *real floor*. At each tally, one
   cell: "how many sacks at this margin cover this week's wages?" (a tiny break-even, C2.02).
3. **Overtrading scales** (C2.09, `frameworks/working-capital-overtrading.md`). Corvin escalates: a first order in week 2,
   a double order in week 3. The timeline gains a "tied up in sacks and invoices" line (AR + inventory − AP) beside Cash;
   doubling the order doubles it. Notebook: "the gap grows with sales and only comes back when growth stops". Mastery
   only if the player's choice matched their own board.
4. **Expected value and ruin** (C0.06): the frost bet (M8) states odds and costs; the highest-EV choice can be wrong when a
   loss would sink the Crown fund. (A caravan version is saved for Summer.)
5. **Labels:** deposits are named *unearned revenue* in the scene and notebook (C1.01/C1.03); tag fixes: ch6 → C1.01/C5.01
   (not C1.06), "cost floor" wording, C1.01 for cost-into-inventory.

## 5. Build plan (Sonnet builders, PRs into `next`, creative lead reviews; max 2 at once)
| WS | Scope | Depends on |
|---|---|---|
| 6 | **Story spine:** Corvin + Crane arc, week structure, midpoint journal page, Crane's offer (M3), endings + epilogues, case board, Maud's fade schedule. Rewrites `story.js` chapter flow to 4 weeks. | — |
| 7 | **Market Day** (M1) with the 3 villager types, price board, tally, Grisby from week 2. New file `market.js`. | — (hook on days 7/14/21) |
| 8 | **The Ledger Duel** (M2): Press/Present engine, 5–7 claims built from the player's actual statements, magistrate's patience. New `duel.js`. | 6 (for the finale slot) |
| 9 | **Crops + restoration + hearts + Jory** (M4–M7). | 6 |
| 10 | **Frost bet + weekly tally** (M8, §4). | 6 |
Order: WS6 + WS7 in parallel (different files) → WS8 + WS9 → WS10. Each ships with bot balance checks (careful pays,
overtrader loses, a "fair-skilled" bot does better at Market Day than a fixed-price bot).
