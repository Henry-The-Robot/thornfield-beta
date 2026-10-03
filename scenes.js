// Ledger & Crown — village scenes. Short, optional, one-time conversations that surface while you run the farm (days 9 to 28): a backstory told over a counter,
// a favour that is really a credit decision, a clue about who is buying up the valley's debts. Each belongs to one person; when a scene is waiting, that person
// shows a red "!" and walking up to them plays it. Choices matter a little now (trust, a flag, a real change to an invoice) and a lot later (the Steward's offer,
// the ending). They also carry lessons: the Hobb scene IS a credit decision; the Vane scene IS a callable-debt covenant. Nothing here is required to finish the
// season, and nothing here breaks the books: every money effect goes through Spring.post.
window.Scenes = (function () {
  const SC = [
    { id: "maud_abacus", who: "maud", from: 9, hint: "Maud has something to say that isn't about the books.",
      async run(c) {
        await c.lines("maud", ["Sit. You've been running from lesson to lesson like a hen after corn. Let me ask you something unrelated.", "Your uncle and I had a game. He'd name a number. I'd tell him whether it was a profit or a fact."]);
        const k = await c.ask("maud", "Which would you like to hear?", ["Which is the abacus?", "What number did he name?"]);
        if (k === 0) await c.lines("maud", ["The abacus is a fact. Beads don't have opinions.", "A Ledger is mostly opinion: depreciation, allowances, 'estimated' this and 'probable' that. Useful opinions. But opinions."]);
        else await c.lines("maud", ["Always the same number: what he'd earned this year. And I'd say, 'And how much can you spend on Friday?'", "He never had a number for that one."]);
        await c.lines("maud", ["Remember the difference. There will be an examination at the end of spring. You won't need to remember it. You'll feel it."]);
        c.trust("maud", 1);
      } },
    { id: "ashby_bram", who: "ashby", from: 11, hint: "Ashby wants a word before the wedding order.",
      async run(c) {
        await c.lines("ashby", ["Sit a minute, dear. The wedding order is a lot. Let me tell you why I ask for money first.", "Bram baked for forty families. 'Pay you Friday, Bram.' Every Friday there was another Friday.", "When he died, the Ledger said we'd earned two hundred. The cupboard had four loaves and a dog. That's the thing about being owed, dear. It feels like having."]);
        const k = await c.ask("ashby", "I'll tell you one more thing if you tell me one.", ["I'll always deliver on time.", "I'll never ask you for credit.", "Forty families? Who paid in the end?"]);
        if (k === 0) { await c.lines("ashby", ["That's a promise that costs sleep, dear. Make it anyway."]); c.flag("ashbyPromise", "deliver"); }
        else if (k === 1) { await c.lines("ashby", ["Good manners, and sensible. Cash is a kindness between friends."]); c.flag("ashbyPromise", "cash"); }
        else { await c.lines("ashby", ["Eleven. The rest are still 'meaning to'. I keep their names in the flour bin. For luck."]); c.flag("ashbyPromise", "ledger"); }
        c.flag("ashbyAsked", true); c.trust("ashby", 1);
      } },
    { id: "crane_offduty", who: "crane", from: 13, to: 17, at: [32, 10], card: ["A scratched second seal", "under the Crown's seal"], hint: "Crane is standing by the well without his ledger.",
      async run(c) {
        await c.lines("crane", ["Item: off duty. Item: my ledger is at home. Item: I feel exposed.", "Item: I am not here to collect. Item: I am here to say something I am not employed to say.", "Item: the writ you carry; I have read it eleven times. Item: it is longer than it should be. Item: a debt of this kind does not usually come with a second seal."]);
        const k = await c.ask("crane", "He waits, pen-less, which seems to hurt him.", ["A second seal?", "Why tell me?"]);
        if (k === 0) await c.lines("crane", ["Item: small, under the Crown's, scratched as if someone wished it were not there.", "Item: I cannot read it. Item: there is a word for what I am not, and I do not have it. Item: I dislike that."]);
        else await c.lines("crane", ["Item: I was a clerk in the Duke's counting-house once. Item: two columns did not agree. Item: no one asked, until you.", "Item: do not make me regret my sentences."]);
        await c.lines("crane", ["Item: keep your sacks counted, heir. Item: I shall go back to being unpleasant."]);
        c.flag("craneSeal", true); c.clue(); c.trust("crane", 2);
      } },
    { id: "tomas_contracts", who: "tomas", from: 13, card: ["A grey cloak buys seed contracts", "offered triple"], hint: "Tomas is whispering. Tomas never whispers.",
      async run(c) {
        await c.lines("tomas", ["My friend! Lean in. No further. Closer. I have something free and it isn't a sample.", "A man in a grey cloak came by. Very polite. Gloves on a warm day. Wanted every seed contract in the valley. Offered triple.", "I said 'not today'. 'Never' is an expensive word. And triple is what a man pays when he means to own the thing after you."]);
        const k = await c.ask("tomas", "He looks genuinely unsettled, which on Tomas is a new colour.", ["What did he want with seed?", "Whose contracts?"]);
        if (k === 0) await c.lines("tomas", ["Not seed, my friend. Leverage. If one man holds everyone's credit, he can call it in all at once and watch the valley fold like a bad hand.", "Concentration, the clever ones call it. The valley calls it Tuesday."]);
        else await c.lines("tomas", ["Yours. Ashby's. Hobb's. Pell's. Edric's too, I still hold his: he owed me thirty. Don't look at me like that, I forgave it. It's in a drawer marked 'forgiven, do not mention'."]);
        c.flag("vaneBuying", true); c.clue(); c.trust("tomas", 1);
      } },
    { id: "hobb_extension", who: "hobb", from: 14, need: s => s.invoices.some(v => v.who === "hobb" && v.due > s.day), hint: "Hobb has a favour to ask. It's costing him.",
      async run(c) {
        const inv = c.s.invoices.find(v => v.who === "hobb"), amt = inv.amount;
        await c.lines("hobb", ["I... have a thing to ask. I'd rather be hit with the wheel.", "The road washed out. Three weeks of flour stuck on the wrong side of a river. My customers can't pay me. So I can't pay you.", `I'm asking for seven more days on the ${amt} I owe you. I'll pay... eventually. I always have.`]);
        const k = await c.ask("hobb", "He has taken his hat off, which he does for funerals.", ["Of course. Seven more days.", "I can't afford to wait. The day it's due.", `Half now, half in a week (${Math.floor(amt / 2)} today).`]);
        if (k === 0) { inv.due += 7; c.flag("hobbExt", "gave"); c.trust("hobb", 2); await c.lines("hobb", ["...Thank you. You'll... not regret it. Probably."]); await c.maud("You just lent Hobb money: not coin, but time. A receivable is a loan you didn't price, so what did you charge him for the week?"); }
        else if (k === 1) { c.flag("hobbExt", "refused"); c.trust("hobb", -1); await c.lines("hobb", ["...Fair. A man pays what he owes. I'll find it."]); }
        else { const half = Math.floor(amt / 2); c.S.post(c.s, "collect", "Hobb paid half of his invoice early, asked for time on the rest", { cash: half, ar: -half }); inv.amount -= half; inv.due += 7; c.flag("hobbExt", "half"); c.trust("hobb", 1); await c.lines("hobb", ["Half... today. Half in a week. That's... better than I asked for. You're your uncle's heir and also not."]); }
      } },
    { id: "ezra_letter", who: "ezra", from: 18, hint: "Ezra has something in his drawer for you.",
      async run(c) {
        await c.lines("ezra", ["Sit. I've been waiting for a day you could read a balance sheet without flinching. Today is close enough.", "Edric left this in my keeping. He asked me to give it to you when you understood what a rate is."]);
        const k = await c.ask("ezra", "He sets the letter on the desk between you, squared to the edge.", ["Read it.", "Why didn't he give it to Maud?"]);
        if (k === 1) await c.lines("ezra", ["Because Maud would have argued with it. It is easier to argue with a friend than a letter."]);
        await c.letter(7);
        await c.lines("ezra", ["He's right that I never lied to him. It was the only kindness I knew how to do him.", "If you want the rest, bring me a forecast I can believe."]);
        c.trust("ezra", 2);
      } },
    { id: "mira_rumour", who: "mira", from: 17, card: ["Someone buys the valley's notes", "forty cents a coin"], hint: "Mira is dying to tell someone something.",
      async run(c) {
        await c.lines("mira", ["Between us and the cabbages: do you know who's buying paper?", "Grey cloak. Gloves. Every village from here to the river. Not grain, not seed: notes. Mortgages. A bakery guarantee, a mill loan, a sixty-coin promise from some widow's late husband."]);
        const k = await c.ask("mira", "She is whispering at the top of her voice.", ["Who sold him the paper?", "Why would he want it?"]);
        if (k === 0) await c.lines("mira", ["The Crown. Glad to be rid of it. Forty cents on the coin, I heard. A debt you can't collect is worth forty cents. A debt you can call in all at once is worth a farm."]);
        else await c.lines("mira", ["Because a man who holds all the notes can call them all in, at once, on a day of his choosing. Midwinter, say. Everyone's in the same boat then, and he owns the boat."]);
        c.flag("vaneBuying", true); c.clue(); c.trust("mira", 1);
      } },
    { id: "maud_confession", who: "maud", from: 19, hint: "Maud has been putting something off.",
      async run(c) {
        await c.lines("maud", ["Sit. I've been putting this off for a week, and I put things off about as well as I count them.", "The winter before Edric died, I was at the assizes. Six weeks. Reeve's business. When I came back, he'd signed something. He wouldn't say what.", "I asked. He said, 'Don't worry, Maud. It's only my name.' A man says that about a thing that isn't only his name."]);
        const k = await c.ask("maud", "She is looking at the abacus, which she has not touched.", ["It wasn't your fault.", "What do you think he signed?", "Then we find out."]);
        if (k === 0) await c.lines("maud", ["Kind. Not a fact. Facts are my department."]);
        else if (k === 1) await c.lines("maud", ["A guarantee. I think. He had a weakness for standing behind people. I don't know whose."]);
        else await c.lines("maud", ["Mm. Now you sound like him. Let's hope it ends better."]);
        c.flag("maudConfessed", true); c.trust("maud", 2);
      } },
    { id: "ashby_guarantee", who: "ashby", from: 21, card: ["Edric stood surety for Ashby", "“It's only my name.”"], hint: "Ashby has gone quiet over the dough.",
      async run(c) {
        await c.lines("ashby", ["Put the sack down, dear. I've been wondering how to say this since the day you walked in.", "When Bram died, the bakery was in debt. A sum I couldn't have paid in ten years. The Crown's collector came, polite as a hearse. Your uncle was in the shop that day.", "He didn't say a word. He walked to the collector's table and signed. 'Surety,' he called it. 'It's only my name, Ashby. It costs nothing.'", "It cost him everything, didn't it? I didn't know until the bailiff came for your farm. I've put an extra loaf in every order since, to try to balance it. You never noticed the loaves."]);
        const k = await c.ask("ashby", "Her ring is off its ribbon and in her fist.", ["It was his choice.", "How much was it?", "I'll find a way to pay it."]);
        if (k === 0) await c.lines("ashby", ["Kind, dear. Wrong. But kind."]);
        else if (k === 1) await c.lines("ashby", ["Most of what the Crown says you owe. I never knew the sum. He never told me. That was the worst of him: he never told anyone."]);
        else await c.lines("ashby", ["Don't you dare. If you carry that I'll have to carry you. Bake with me, dear. That's all I want."]);
        await c.letter(6);
        c.flag("guarantee", true); c.clue(); c.trust("ashby", 3);
      } },
    { id: "crane_seal", who: "crane", from: 23, at: [32, 10], card: ["Vane's mark on the seal", "Crown sold your debt"], need: s => s.flags && s.flags.craneSeal, hint: "Crane is by the well again. He has a paper.",
      async run(c) {
        await c.lines("crane", ["Item: I have a copy of the writ. Item: it is a copy I should not have made. Item: I made it.", "Item: the second seal. Item: a man in the counting-house once taught me to read the small ones. Item: it is a note-buyer's mark, and it means the Crown sold your debt, heir, to someone."]);
        const k = await c.ask("crane", "He holds the paper at arm's length, as if it might go off.", ["To whom?", "Can they do that?"]);
        if (k === 0) await c.lines("crane", ["Item: the mark is Corvin Vane's. Item: it is a small mark; Vane has never been a man for large ones."]);
        else await c.lines("crane", ["Item: they can. Item: a debt is a thing, like a sack, to be bought, sold and called in. Item: the part I find unpleasant is the discount."]);
        c.flag("craneVane", true); c.clue(); c.trust("crane", 2);
      } },
    { id: "vane_offer", who: "duke", from: 24, at: [36, 10], card: ["Vane's “partnership”", "a mortgage payable on demand"], hint: "The Steward is in the square. He has brought a pen.",
      async run(c) {
        await c.lines("duke", ["Heir. I'm told you've done the impossible: you've made a profit and kept the Cash. I'm delighted. Truly.", "I come with an offer. Nothing grand. I hold your note now, the Crown found it tedious. I should like to forgive it.", "All of it. The writ. Gone. In exchange for the millstream rights at the east boundary and a modest mortgage over the farm. A formality. We'd be partners."]);
        const k = await c.ask("duke", "He has uncapped the pen. He is a very patient man.", ["No.", "Tell me more.", "I'll think about it."]);
        if (k === 0) { await c.lines("duke", ["No. How decisive. Edric said no to me once. Very kindly. It ended much the same.", "The offer stands until Midwinter. Offers do. It is people who expire."]); c.flag("vane", "refused"); }
        else if (k === 1) { await c.lines("duke", ["The mortgage would be over the whole farm, you understand. Payable on demand.", "Demand being, of course, mine. A technicality. Partners trust one another."]); c.flag("vane", "asked"); await c.maud("'Payable on demand.' Read that twice: a loan he can call in whenever he chooses is not a partnership, it is a leash with a handshake."); }
        else { await c.lines("duke", ["Take the winter. I shall be... around."]); c.flag("vane", "waiting"); }
        c.clue();
      } },
    { id: "maud_eve", who: "maud", from: 27, hint: "Maud is waiting at the hall. It's nearly time.",
      async run(c) {
        await c.lines("maud", ["Tomorrow the books close. Then the Reeve's Court will ask you some questions. Short ones.", "You'll pass. That isn't why I'm worried.", "I'm worried because after the examination there's a letter, and I know what's in it, and I'd rather you'd had a longer spring."]);
        const k = await c.ask("maud", "She straightens the abacus, which does not need it.", ["I'm ready.", "What's in the letter?"]);
        if (k === 0) await c.lines("maud", ["Mm. That's not wrong. Sleep. Count nothing."]);
        else await c.lines("maud", ["Not yet. I gave Edric my word, and my word is the only thing I have never had to count.", "After the examination. Whatever you're told, come to me first."]);
        c.flag("examReady", true); c.trust("maud", 1);
      } },
  ];
  const BY = Object.fromEntries(SC.map(x => [x.id, x])), CLUES = 6; // how many scenes hold a clue about who is buying the valley's debts (the tests count them)
  function available(who, s) {
    s.scenes = s.scenes || {}; s.flags = s.flags || {};
    return SC.find(x => x.who === who && !s.scenes[x.id] && s.day >= x.from && (x.to == null || s.day <= x.to) && (!x.need || x.need(s))) || null;
  }
  function pending(s) { return SC.filter(x => available(x.who, s) === x).length; }
  return { SC, BY, CLUES, available, pending, done: (s, id) => !!(s.scenes && s.scenes[id]) };
})();
