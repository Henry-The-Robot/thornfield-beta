# Ledger & Crown: story bible, Spring (year one)

The pitch in one line: **Edric made a profit every year and died broke. Find out why before the Crown takes the farm. Then find out who wanted it to.**

Spring is the first of four seasons. The accounting is the plot: every lesson is something a character needs you to understand, and every character is hiding a reason the lesson matters to them.

## The spine

1. **The surface mystery (days 1-10, chapters 1-5):** why does a profitable farm have an empty chest? Answer: profit isn't cash; receivables and inventory eat it. (Equity, margin, receivables, wages day.)
2. **The credit mystery (days 6-12, chapters 6-8):** who lends, on what terms, and what does waiting cost? Ends at the Duke's order, which is what broke Edric. Corvin Vane arrives. (Payables, interest, overtrading.)
3. **The deeper mystery (days 9-28, village scenes):** the Crown's 1,250 isn't all Edric's own debt. He **stood surety** for Ashby's bakery after her husband died (a *guarantee*: a liability the Ledger never showed). The Crown then **sold the note** to Corvin Vane at a discount. Vane has been buying every note in the valley (Hobb's mill loan, Ashby's guarantee, Tomas's contracts) so that on a day of his choosing, Midwinter, he can call them all in at once and own the valley. The Duke's big order was never about grain: it was the gap in Edric's cash that Vane needed.
4. **The hook (end of spring):** Edric's last letter, after the examination: "I signed a paper I ought to have shown Maud first... Ask Crane to read it. Ask Ezra whose name stands beneath mine." The player now knows *who*, and that Vane's offer of "partnership" is a callable-debt leash. Summer (Act II, The Trading House) is about valuation and finance: the heir has to beat Vane at his own game, with Ezra, Crane, Maud and the valley behind them or not, depending on how the player treated them.

## The cast

| Who | One-line | Verbal habit | Wants | Secret | Teaches |
|---|---|---|---|---|---|
| **Maud Fenwick**, reeve | Edric's oldest friend and sparring partner; the mentor | answers a question with a question; never says "good", says "that's not wrong" | the heir not to repeat Edric | she was away at the assizes the winter he signed the guarantee, and has never forgiven herself | everything; "profit is an opinion, cash is a fact" |
| **Bailiff Crane** | the Crown's man; fearsome, frightened, precise | numbers his sentences; "Item:"; counts everything twice | an honest column of numbers | he was a clerk in the Duke's counting-house until he noticed two columns disagree | assets, liabilities, equity; auditing; the second seal |
| **Widow Ashby**, baker | warm, brisk, blade in the voice | baking metaphors; "dear"; Cash on the nail | to not owe anyone again | Edric guaranteed her bakery's debt; she has put an extra loaf in every order since | cash vs credit, margin and haggling, deposits |
| **Hobb**, miller | slow, deep, deadpan | long pauses; "eventually" | to keep the mill turning | he is trapped in the same chain of credit he puts you in | receivables, extending credit |
| **Tomas**, seed merchant | showman, breathless | superlatives; self-interrupting prices; "my friend" | a sale | his cousin lost a farm to a very polite man; Vane tried to buy his contracts | trade credit, 2/7 net 14, concentration risk |
| **Ezra**, moneylender | quiet, exact, honest to a fault | "patience has a price; I merely publish it" | to be believed | holds Edric's letters; loved his honesty about numbers | interest, rates, covenants, factoring |
| **Corvin Vane** | velvet, patient, faintly amused | "opportunity"; "we" for things only he will own | every note in the valley | he is the second seal | overtrading, callable debt, concentration |
| Pell, Barnaby, Mira, Brother Anselm | colour and clues | see `cast.js` | | Mira and Barnaby carry the rumour | contingent gains, insurance, market research, reconciliation |

## Edric's nine letters

Found where the lessons are; reread any time from the desk. Each answers a question the player has just started to ask; the last turns the season into a mystery.
1 The first page (after the harvest) · 2 Hobb's best customer · 3 Maud's calendars · 4 The Duke's grain · 5 The last page · 6 **On the bailiff** (after chapter 1) · 7 **Bram's oven** (Ashby's confession) · 8 **On patience** (from Ezra) · 9 **The thing I signed** (after the examination).

## Village scenes (days 9-28; the speaker shows a red "!")

Each is optional and once-only. A scene is marked played the moment it starts, so a reload never replays it.

| Day | Who | What happens | Lesson / flag |
|---|---|---|---|
| 9 | Maud | the abacus; "profit is an opinion" | cash vs profit; trust |
| 11 | Ashby | why Cash on the nail; Bram | AR from the other side; `ashbyPromise`, unlocks her deepest topic |
| 12-16 | Crane (by the well, off duty) | the writ has a second, scratched seal | clue 1; `craneSeal` |
| 13 | Tomas | a man in a grey cloak offered triple for every contract | concentration risk; clue 2 |
| 14 | Hobb | asks seven more days on his invoice: **a real credit decision** (extend / refuse / half now) | receivables are loans you didn't price; changes the invoice |
| 17 | Mira | the Crown sold the notes at forty cents on the coin | clue 3 |
| 18 | Ezra | hands over Edric's letter "On patience" | trust; letter 8 |
| 19 | Maud | confession: she was at the assizes | `maudConfessed`; trust |
| 21 | Ashby | the guarantee: "it's only my name" | a guarantee is an off-ledger liability; clue 4; letter 7 |
| 22+ | Crane | reads the seal: Vane's note-buyer's mark | clue 5; `craneVane` |
| 24 | Corvin Vane | offers to forgive the writ for the millstream and a mortgage "payable on demand" | clue 6; `vane` = refused / asked / waiting; **the callable-debt lesson** |
| 27 | Maud | the eve: the Reeve's Court, and a warning about the letter | `examReady` |

Flags set here (`vane`, `hobbExt`, `ashbyPromise`, `guarantee`, `maudConfessed`, `craneVane`, ...) are saved with the game so Summer can read them.

## How the lessons are woven in

Chapters 1-9 are unchanged in what they teach (equity, inventory, gross margin, receivables, the cash forecast, trade credit, interest, overtrading, the three statements). What changed is who says them and why it matters to them:
- Chapter 1: Crane's list of forty-one items, and Edric's first letter ("be civil to Crane").
- Chapters 3-4: Ashby and Hobb are people, not buyers (cash on the nail vs "eventually").
- Chapter 8: the Duke's order is **Corvin Vane's** gambit; Maud calls it "a loan you make him at no interest, in your own seed".
- Between chapters, the scenes make the same ideas show up as decisions with faces: the Hobb scene *is* a credit decision; the Vane scene *is* a covenant.

## Still to build (next PRs)

- **Practice**: a daily "Maud's problem" on live numbers (spaced across days, the only way to earn real mastery) and standing orders so there is more to play between chapters.
- **The Reeve's Court examination**: ~10 questions across the Spring concepts drawn from the player's own books; pass mark 6; retake freely with fresh numbers; a certificate; then letter 9 and the end-of-spring scene (Crane reads the seal; Vane's offer comes due).
- **Summer teaser** that reads the flags above.
