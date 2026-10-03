// Spring at Thornfield — the story: "The Uncle's Ledger" as a FOUR-WEEK season (WS6; projects/mba-game/SEASON-1-REDESIGN.md §2, §4, §7).
// Structure: Blake Snyder's beat sheet (Save the Cat, 2005) across four weeks, the detective-fiction "fair play" rule (every clue is
// planted before the reveal: the case board pins one per lesson), and kishotenketsu inside each week. Calendar weeks drive the
// title cards and the goal ribbon (day 1/8/15/22); the lesson stages below are the existing chapters, mapped into the weeks:
//   Week 1 "The writ"        (days 1-7)   Crane's stamp, Crane's offer, harvest, Ashby, Tomas, Hobb
//   Week 2 "Promises"        (days 8-14)  wages day, Tomas's terms (time value), Ezra's forecast, MIDPOINT day 12: Corvin Vane's first order, Edric's page
//   Week 3 "The squeeze"     (days 15-21) Corvin's double order, events, Tomas offers again (the answer can flip), Crane's "mercy" visits
//   Week 4 "The reckoning"   (days 22-28) Edric's cash book, close the books, the verdict + ending (the Audit duel is WS8)
// Every concept runs Show -> Try -> Use -> Keep: Maud does it once with the player's real numbers (UI highlighted),
// the player types the next number and Maud checks it (a hint when wrong, never the answer), a later situation uses
// it unprompted, and it lands in Maud's notebook (N) AND on the case board. Coaching fades on a schedule the player can see:
// week 1 Maud shows, week 2 she asks, week 3 she bets, week 4 she is silent but for danger. Method: worked examples that fade
// into problems (Atkinson, Renkl & Merrill 2003; Renkl 2014).
// Curriculum: C1.01, C1.04, C0.02, C1.02, C2.09, C0.01/C5.01 (time value, ch6), C1.01/C1.03 (unearned revenue), C1.08. Runs on the game's G API (game.js).
window.Story = (function () {
  const S = Spring, B = Books, TR = Transcript;
  let G, st = fresh();
  const TITLES = ["", "The bailiff", "Harvest and the bakery", "First seed", "Hobb pays later", "Wages day", "Tomas's terms", "Ezra", "The Duke's steward", "Closing the books"];
  // Edric's letters (#28): his voice is warm, rueful and a little funny; each one answers a question the player has just started to ask, and the last turns it into a mystery.
  // Index 9 is WS6's midpoint page (found the night Corvin Vane brings his order); the scenes call letter(6), letter(7), letter(8) by index, so #28's order is kept.
  const LETTERS = ["The first page", "Hobb's best customer", "Maud's calendars", "The Duke's grain", "The last page", "On the bailiff", "Bram's oven", "On patience", "The thing I signed", "The same kind of order"];
  const WEEKS = [null,
    { title: "The writ", line: "Rain, a gate, and a stranger with a ledger.", maud: "This week I'll show you. Watch the numbers." },
    { title: "Promises", line: "Wages fall due, and the Duke's steward is coming.", maud: "This week I'll ask, not tell." },
    { title: "The squeeze", line: "Everyone you promised now wants something.", maud: "This week I'll bet with you, not coach you." },
    { title: "The reckoning", line: "Edric's last book, and the Crown's collector.", maud: "This week I'm silent unless the farm is in danger." },
  ];
  const weekOf = d => Math.min(4, Math.max(1, Math.ceil(d / 7)));
  const farmName = () => (st && st.farm) || "Thornfield";
  const PAGES = [
    "Spring. Best harvest in ten years. Sold every sack. So why is the chest always empty?",
    "Hobb's my best customer. Pays like clockwork, fourteen days after. I'll be fine till then.",
    "Maud keeps drawing me calendars of coin. I keep telling her: the Ledger shows a profit. She keeps looking at me the way you look at a man standing on a frozen pond, saying the ice is fine.",
    "The Duke wants grain, more than I've ever grown. Ezra will lend me the seed money. It's the making of us. The steward says growth is the only safe harbour. He smiles a great deal. I should have counted his teeth.",
    "Profit every year. Never once enough coin on wages day. If someone reads this: watch the chest, not the Ledger.",
    "If you are reading this, Crane has found you first. Be civil. He is the only man in the Duke's employ who counts everything twice, and that is a rarer virtue than honesty. He will frighten you. He is frightened of nearly everything, which is why he is so careful.",
    "Ashby would not take my money. Not a coin. So I gave her my name instead. A name is cheaper than money, I thought. I have since learned what it costs.",
    "Ezra never lied to me. That was the trouble. His rate was always exactly what I deserved. Ask him about patience, and then ask yourself who you were being patient with.",
    "I signed a paper I ought to have shown Maud. It is in the drawer with the seal I could not read. Ask Crane to read it. Ask Ezra whose name stands beneath mine. And please, whatever you do, do not let Ashby thank you for it.",
    // WS6 (index 9): the midpoint page, found the night Corvin Vane brings his order. Numbers are the game's own constants (S.R.duke).
    `Corvin Vane was here again with the Duke's order: ${S.R.duke.sacks} sacks at ${S.R.duke.price}, paid ${S.R.duke.terms} days after delivery. The same kind of order as last spring, and as the spring before. I sign, I borrow for seed, and by Midwinter I'm begging Ezra. I begin to think he counts on it.`,
  ];
  function fresh() { return { ch: 1, stage: "intro", notebook: [], pages: [], pageDays: {}, clues: [], weeks: [], farm: "Thornfield" }; }
  function init(g, saved) { G = g; st = Object.assign(fresh(), saved || {}); goal(); }
  // Objective text per stage ("Title: what to do"); the ribbon adds "Week N · <title>" in front (see goal()).
  const GOALS = {
    "intro": "The bailiff: walk with Crane and tap what the farm owns",
    "harvest2": "Harvest: the three ripe plots are in the field (E, or tap Act)",
    "tomas2": "First seed: buy seed from Tomas (east along the path, the green roof)",
    "plant2": "First seed: plant your seed (E on tilled soil, then E again to water)",
    "ashby3": "The bakery: agree a price with Widow Ashby (red roof)",
    "ship3": "The bakery: ship Ashby's sacks from your shipping crate (by the house)",
    "hobb4": "Hobb pays later: see Hobb at the mill",
    "ship4": "Hobb pays later: ship Hobb's sacks from the crate",
    "sleep5": "Wages day: sleep, and Maud will meet you in the morning",
    "tomas6": "Tomas's terms: buy your next seed from Tomas on account",
    "ezra7": "Ezra: ask the moneylender about a loan (purple roof)",
    "sleep8": "The steward: run the farm and sleep; Corvin Vane comes to the well on day 12",
    "duke8": "The steward: Corvin Vane is waiting by the well",
    "page8": "The page: sleep, and Maud will show you what she found",
    "sleep9": "The squeeze: run the farm and sleep; Corvin Vane returns on day 15",
    "duke9": "The squeeze: Corvin Vane is back at the well",
    "tomas9": "Tomas offers again: Ezra's rate has moved; see Tomas on account",
    "run9": "Run the farm to the end of spring (day 28), close the books, then face the Reeve's Court",
    "done": "Spring is closed. Your notebook (N) and case board have everything you learned.",
  };
  GOALS.sleep8now = "The steward: sleep; Corvin Vane comes to the well in the morning"; GOALS.sleep9now = "The squeeze: sleep; Corvin Vane returns to the well in the morning";
  const goalText = () => { const d = G && G.s ? G.s.day : 1; return (st.stage === "sleep8" && d >= 12 ? GOALS.sleep8now : st.stage === "sleep9" && d >= 15 ? GOALS.sleep9now : GOALS[st.stage]) || ""; };
  function goal() { const w = weekOf(G.s.day); G.goal(goalText(), st.ch, `${w === 0 ? "" : "Week " + w} · ${WEEKS[w].title}`); }
  function to(ch, stage) { if (window.Verbs) Verbs.parchClose(); /* a lesson page never outlives its stage */ st.ch = ch; st.stage = stage; G.s.quiet = ch <= 4; goal(); G.save(); }
  // ---------- the case board (item 5): every lesson and journal page pins a clue; WS8's Ledger Duel reads Story.state.clues ----------
  // clue = { id, term, num (the player's own number, as text), from (where it came from), day, kind: "lesson" | "page" | "book" }
  // Creative call 3: a clue card is a short title + the player's number + where it was found, 12 words at most in all (title <= 6, number <= 5, source <= 4, then trimmed to fit).
  const toks = x => String(x == null ? "" : x).trim().split(/\s+/).filter(Boolean), words = x => toks(x).filter(w => /[A-Za-z0-9]/.test(w)), clip = (x, n) => { const all = toks(x), out = []; let k = 0; for (const w of all) { if (/[A-Za-z0-9]/.test(w)) { if (k === n) return out.join(" ").replace(/[,;:.\-–·\s]+$/, "") + "…"; k++; } out.push(w); } return out.join(" "); };
  function tidyClue(term, num, from) {
    let t = clip(String(term).replace(/\s*\([^)]*\)/g, ""), 6), n = clip(num, 5), f = clip(from, 4);
    while (words(t).length + words(n).length + words(f).length > 12) { if (words(n).length > 3) n = clip(n, words(n).length - 1); else if (words(f).length > 2) f = clip(f, words(f).length - 1); else t = clip(t, words(t).length - 1); }
    return { term: t, num: n, from: f };
  }
  function pin(id, term, num, from, kind) {
    if (st.clues.some(c => c.id === id)) return;
    const c = tidyClue(term, num, from || `Day ${G.s.day}`); term = c.term; num = c.num; from = c.from;
    st.clues.push({ id, term, num, from, day: G.s.day, kind: kind || "lesson" });
    G.toast(`Pinned to the case board: ${term}`);
  }
  async function page(i) { if (st.pages.indexOf(i) < 0) { st.pages.push(i); (st.pageDays = st.pageDays || {})[i] = G.s.day; } await G.page(PAGES[i], LETTERS[i]); pin("page" + i, LETTERS[i], "Edric's letter", `Day ${G.s.day} · journal`, "page"); }
  // ---------- week title cards: one line, tap to dismiss (never blocks the story; fades by itself) ----------
  function weekCard(w, hold) {
    document.querySelectorAll(".wkcard").forEach(e => e.remove());
    const e = document.createElement("div"); e.className = "wkcard"; e.setAttribute("role", "status");
    e.innerHTML = `<div class="wk-farm">${farmName()}</div><div class="wk-n">Week ${w} of 4</div><div class="wk-t">${WEEKS[w].title}</div><div class="wk-l">${WEEKS[w].line}</div><div class="wk-m"><b>Maud:</b> ${WEEKS[w].maud}</div><div class="wk-tap">Tap to dismiss</div>`;
    e.onclick = () => e.remove(); document.getElementById("wrap").appendChild(e);
    if (!hold) setTimeout(() => e.remove(), 7000); else e.style.animation = "none"; // hold = screenshots: no entrance animation to catch half-faded
    return e;
  }
  const dueCard = () => { const d = G.s.day, w = weekOf(d); if (d === 1 + 7 * (w - 1) && st.weeks.indexOf(w) < 0) { st.weeks.push(w); return w; } return 0; };
  function addEx(id, more) { const n = st.notebook.find(x => x.id === id); if (n) n.example += " " + more; }
  // keep: the notebook entry, plus (WS6) a clue card on the case board: num = the player's own number as text, from = where it came from.
  function keep(id, term, line, example, num, from) {
    if (!st.notebook.some(n => n.id === id)) st.notebook.push({ id, term, line, example }); G.toast(`Maud's notebook: ${term} (N)`);
    pin(id, term, num || example.split(".")[0], from);
  }
  const tell = (t, spot) => G.say("maud", t, null, spot);
  const ask = (t, answer, hints, spot, tol, docs, work, how) => G.ask("maud", t, answer, hints, spot, tol, docs, work, how);
  // Only answers the player got on their own count as evidence: a walk-through or a reported skip adds nothing.
  const mastered = id => { if (!window.__walked) TR.master(id, G.s.day); }; // evidence of skill, not instant mastery (transcript.js)
  // Document buttons for Try beats: the player finds the numbers in their own books (hints say where, never the sum).
  const DOC = {
    ledger: { label: "Open the Ledger", open: () => G.ledger() },
    notebook: { label: "Open Maud's notebook", open: () => G.notebook() },
    forecast: (n, title) => ({ label: "Open the cash forecast", open: () => G.board({ title, n, noClose: true, fill: [] }) }),
  };

  // ---------- chapter 1: the bailiff (C1.01) — WS3 cold open: the `tag` verb builds the balance sheet, then one More/Less choice ----------
  // Replaces the two typed sums (liabilities, equity). Every number comes from the opening balances (Spring.balanceSheet), never a literal.
  async function ch1() {
    const V = Verbs, W = G.world, b = S.balanceSheet(G.s.bal), s0 = G.s, cost = S.R.unitCost;
    V.parchReset(); V.craneOn = true;
    await G.say("crane", "Item: Edric's heir. Item: Bailiff Crane, of the Crown, with forty-one things to list before Midwinter. Item: I shall be thorough. Item: walk with me.", ["Walk with you"]);
    const sackVal = s0.sacks * cost, cropPlots = () => s0.plots.filter(p => p.crop), cropVal = cropPlots().reduce((a, p) => a + p.crop.cost, 0);
    G.toast("Crane taps the chest: Cash.");
    const tagging = V.tag({
      show: 1, hintAfter: window.__hintAfter,
      targets: [
        { id: "chest", tiles: [[W.CHEST.x, W.CHEST.y]], line: "Cash (the chest)", value: b.cash },
        { id: "sacks", tiles: [[W.SACKS.x, W.SACKS.y], [W.CRATE.x, W.CRATE.y]], line: `Sacks: ${s0.sacks} at ${cost}`, value: sackVal },
        { id: "crops", tiles: () => cropPlots().map(p => [p.x, p.y]), line: `Crops in the ground (${cropPlots().length} plots, at cost)`, value: cropVal },
      ],
      decoys: [
        { tiles: [[W.FWELL.x, W.FWELL.y]], says: "That's the village's well. Not yours." },
        { tiles: [[12, 3], [12, 2], [15, 3], [15, 2], [18, 4], [18, 3]], says: "The trees are the Duke's." },
        { tiles: [[W.BOARD.x, W.BOARD.y], [W.BOARD.x, W.BOARD.y - 1]], says: "The notice board belongs to the village." },
      ],
    });
    V.remark(`Cash, ${b.cash}.`); await V.wait(window.__fastVerbs ? 0 : 1600);
    V.remark("Find the rest. Everything this farm owns.");
    await tagging;
    await V.countTotal("aTot", s0.bal.cash + sackVal + cropVal);
    await G.say("crane", "Item: the other column, the one people prefer not to read. Item: I brought the papers myself.", ["Show me"]);
    V.pinRow("liab", "Ezra's note (the loan)", b.loan); await V.wait(window.__fastVerbs ? 0 : 700);
    V.pinRow("liab", "The Crown's writ, due at Midwinter", b.crown); await V.wait(window.__fastVerbs ? 0 : 500);
    await V.countTotal("lTot", b.liab);
    const c = await G.say("crane", "Item: before I stamp it, heir, do you own more than you owe, or less?", ["More", "Less"]);
    V.P.eq = b.equity; V.parch();
    await V.stamp(`Owner's equity ${V.fmt(b.equity)}`, `${b.assets.toLocaleString("en-US")} owned − ${b.liab.toLocaleString("en-US")} owed`);
    const right = (c === 1) === (b.equity < 0);
    await G.say("crane", right ? "Item: you have a head for it. Item: that is not a compliment, heir; it is a diagnosis." : "Item: less. Item: much less, and I am required to say it plainly.", ["Next"]); // #28's voice
    document.querySelectorAll(".vstamp").forEach(x => x.remove());
    // WS6: the writ needs a name (item 10), and Crane makes his standing offer (M3, item 3), both while he's still standing in the yard
    await G.say("crane", "Item: the writ requires a name for the land. Item: what shall I write?", ["Give it a name"]);
    await nameFarm(); V.P.title = farmName(); V.parch();
    await G.say("crane", `Item: ${farmName()}. Item: entered on the writ.`, ["Next"]);
    await craneOffer({ first: true });
    if (G.s.over) return; // sold on day 1: the ending has been shown
    V.craneOn = false;
    await tell("That was Crane. Don't mind him: he counts everything twice because he's frightened of nearly everything.");
    await tell(`What you own minus what you owe is yours, and yours is ${b.equity < 0 ? "below zero" : "thin"}. That's why we work.`);
    await tell("Profit is an opinion. Cash is a fact."); // WS6: the theme, stated once, early
    await page(5); // #28: Edric's letter "On the bailiff"
    await tell("The far field's ripe. Harvest it (walk up, press E or tap Act) and Ashby the baker will buy.");
    if (right) mastered("equation");
    keep("equation", "Assets = Liabilities + Owner's equity", "What you own, minus what you owe, is yours. It can be below zero.", `Day 1: ${b.assets} = ${b.liab} + (${b.equity}).${right ? "" : " You guessed more; the page says less."}`);
    V.parchClose(); to(1, "harvest2");
  }
  // ---------- chapter 3: first seed (C1.04: cost becomes inventory, not an expense yet) — WS3: no typed question; Maud says one line ----------
  async function ch2() {
    const sc = S.R.seedCost, per = S.R.sacksPerPlot;
    await G.say("tomas", `My friend! Edric's heir! Sit, sit, no, don't sit, buy! Seed is ${sc} a packet. One packet plants one plot; a plot gives ${per} sacks of wheat. I wouldn't say that if it weren't true, and I would say it if it were, which is a rare quality in a salesman.`);
    await tell("Let me buy the first three, so you can see where the coin goes.");
    G.act(() => S.buySeeds(G.s, 3, false));
    await tell(`Cash went down ${3 * sc} and Inventory went up ${3 * sc}: changed shape, not spent.<br>Seed only becomes a cost when the grain is sold.`, ["h-cash", "h-inv"]);
    const inv0 = G.s.bal.inv;
    await G.say("tomas", "Six more?", [`Buy 6 packets for Cash (${6 * sc})`]);
    G.act(() => S.buySeeds(G.s, 6, false));
    keep("inventory", "Inventory", "Buying seed isn't spending: Cash becomes Inventory, at cost, until it's sold.", `Day ${G.s.day}: 6 packets, Cash −${6 * sc}, Inventory +${6 * sc} (${inv0} → ${G.s.bal.inv}).`);
    st.planted0 = G.s.plots.filter(p => p.crop).length; to(3, "plant2");
  }
  // ---------- chapter 2: the bakery (C1.04, C0.02: revenue, COGS, gross profit, margin) — WS3: the typed floor becomes the walk-away line ----------
  async function ch3() {
    const cost = S.R.unitCost, pct = p => Math.round((p - cost) / p * 100);
    const o = G.s.offers.find(x => x.who === "ashby") || S.addOffer(G.s, "ashby", 6, 7, 0, 4, 4); S.setPrice(G.s, o.id, 7);
    await G.say("ashby", "So you're Edric's heir. You've his chin and none of his luck, dear. I need six sacks for the ovens. Seven a sack, Cash on the nail.");
    await tell(`Each sack cost you ${cost}: ${S.R.seedCost} of seed for ${S.R.sacksPerPlot} sacks, so at 7 you keep ${7 - cost} a sack. That's gross profit: ${7 - cost} out of every 7 is ${pct(7)}%, your margin.`, ["h-inv"]);
    // The worked example goes in the notebook as it's shown, so the Try that follows can point to it.
    keep("margin", "Gross profit & margin", "Price minus cost per sack is gross profit. Divide by the price: margin. Your cost floor is your cost per sack: below it you lose money (a sale you give up can raise the real floor later).",`Maud at 7: 7 − ${cost} = ${7 - cost} profit a sack; ${7 - cost} ÷ 7 = ${pct(7)}% margin.`);
    // The floor is asked first, and it is used: it becomes the red walk-away line on the price track in the haggle.
    await ask("Before you name a price: what's your cost floor? The lowest you'd take for a sack before it loses money.", cost, ["What did each sack cost you? Seed for a plot, divided by the sacks it gives."], null, 0, null, `A packet of seed is ${S.R.seedCost} and gives ${S.R.sacksPerPlot} sacks, so each sack cost ${cost}. Sell below ${cost} and you lose money.`, `Your cost floor is what one item cost you. If 10 of seed grows 5 sacks, each sack cost 10 ÷ 5 = 2. Below 2, you lose money.`);
    await G.say("ashby", "Times are hard, dear. Would you take 6?");
    await ask("Work it out before you answer. Your margin at 6, in %?", pct(6), ["Look at how I worked it at 7 in my notebook, then do the same at 6.", "Margin compares the profit on one sack with the price the buyer pays."], null, 1, [DOC.notebook], `At 6 you keep 6 − ${cost} = ${6 - cost} a sack. ${6 - cost} ÷ 6 = 0.33, so ${pct(6)}%.`, "Margin = profit on one item ÷ the price you sell it for, × 100. Sell for 10 what cost 6: profit 4, and 4 ÷ 10 × 100 = 40%.");
    mastered("gross"); mastered("margin");
    await tell(`Your cost floor, ${cost}, is the red line on the price track: sell below it and the sack costs you more than it earns. Name your price and she'll counter; you can always walk away.`);
    const deal = await G.haggle(o, { open: 6, walk: 7, floor: cost, line: "Well, dear? 6 sacks. What do you want for them?" });
    if (!deal) { await G.say("ashby", "Come back when you've thought it over."); return; }
    const price = deal.price;
    await G.say("ashby", `${price} it is. Ship them from your crate and I'll pay on the spot.`);
    addEx("margin", `Your deal: Ashby, 6 sacks at ${price}: ${price - cost} a sack, ${pct(price)}% margin.`);
    to(2, "ship3");
  }
  // ---------- chapter 4: Hobb pays later (C1.02: accounts receivable, accrual vs cash) ----------
  async function ch4() {
    const o = G.s.offers.find(x => x.who === "hobb") || S.addOffer(G.s, "hobb", 9, 9, 14, 5, 4); S.setPrice(G.s, o.id, 9);
    await tell("Before you go in: know your cost floor. And listen for when he pays.");
    await G.say("hobb", `...Edric's heir. Hm. Nine sacks. I pay... fourteen days after delivery. Same as always. Same as your uncle.`);
    await tell("Your uncle loved Hobb, and Hobb always paid. Eventually.");
    const deal = await G.haggle(o, { open: 8, walk: 9, floor: S.R.unitCost, line: "Nine sacks. Name your price; I'm not a charity." });
    if (!deal) { await G.say("hobb", "Suit yourself. The offer stands till tomorrow."); return; }
    to(4, "ship4");
  }
  // WS3: the four typed sums become one bet with a delayed reveal. The player predicts the chest from the timeline (cards, no Cash line),
  // stakes real coin, and is told the answer on the morning after Hobb pays: predicted vs actual, each difference named (Verbs.revealBet).
  async function ch4b(order) {
    const V = Verbs, v = order.value, inv = G.s.invoices.find(x => x.who === "hobb");
    await tell(`The Ledger says you earned ${v} today: Revenue. Look at the chest: it didn't move.`, ["h-ni", "h-cash"]);
    const arNow = S.balanceSheet(G.s.bal).ar;
    await tell(arNow > v
      ? `Hobb's ${v} joins your Accounts receivable: everything people owe you, ${arNow} in all. Hobb's part is due day ${inv.due}. Two books, and Edric only read one.`
      : `The ${v} is your Accounts receivable now: Hobb owes it, due day ${inv.due}. Two books, and Edric only read one.`, ["h-ar", "coin"]);
    const n = inv.due - G.s.day + 1, last = () => { const r = S.forecast(G.s, n); return r[r.length - 1]; };
    const tl = { label: "Open the timeline", open: () => V.timeline({ mode: "show", n, hideLine: true, title: `Cash events, today to day ${inv.due}`, maud: "Every coin coming in and going out. I've hidden the Cash line: that's your job." }) };
    const r = await V.bet({ prompt: `Five coin says you can't tell me what's in the chest the morning after Hobb pays (day ${inv.due + 1}), if you buy nothing more.`, docs: [tl, DOC.ledger],
      how: "Cash now, plus every coin that comes in, minus every coin that goes out, up to that day. The timeline shows each one.", stake: { min: 0, max: 5 }, tol: 0, answer: () => last().close, reveal: { day: inv.due + 1 }, kind: "hobb",
      explain: () => "Revenue counted the day you delivered; the coin came today. Two books." });
    keep("ar", "Accounts receivable", "Revenue counts when you deliver; the Cash comes when they pay. In between, it's a receivable.", `Hobb: ${v} of Revenue on day ${G.s.day}, Cash on day ${inv.due}. You said ${r.guess}${r.stake ? ` and staked ${r.stake}` : ""}.`);
    await page(1); to(5, "sleep5");
  }
  // the bet's morning: runs whenever the story is free on or after the reveal day
  async function revealIfDue() { if (!G.s.bet || G.s.day < G.s.bet.revealDay) return; const r = await Verbs.revealBet(); if (r && r.win) { mastered("accrual"); mastered("ar"); } }
  // ---------- chapter 5: wages day (C2.09: working capital, the cash forecast) ----------
  // WS3: no warning beforehand (Kapur: struggle first). The engine decides at the day-7 sleep: if Cash can't cover wages a farmhand walks off.
  async function ch5() {
    const V = Verbs, walked = !!G.s.walkedOff;
    await tell(walked ? `Jory walked off last night: ${G.s.walkedWages} in wages and the chest couldn't find them. The crops went unwatered. The Ledger said profit. The chest said no.`
      : "Wages went out last night. Closer than the Ledger makes it look.", ["h-cash"]);
    const f = S.forecast(G.s, 14), low = f.reduce((a, x) => x.close < a.close ? x : a);
    await V.timeline({ mode: "show", n: 14, title: "Your next two weeks", maud: `Every coin coming and going, with Cash under it. The low point is day ${low.day}, Cash ${low.close}. ${low.close < 60 ? "That's where Edric lived." : "Watch that dip."}` });
    // (the timeline above is something to read, not an answer, so it earns no mastery; the forecast Ezra asks for in chapter 7 does)
    await G.say("tomas", "I only mark up my seed 50%. Honest trade.");
    const m = Math.round(50 / 150 * 100);
    const r = await V.bet({ prompt: "Two coin says you can't tell me Tomas's margin on his seed. He marks it up 50%.", docs: [DOC.notebook], how: "Markup divides the profit by what the seed cost him. Margin divides the same profit by the price he sells at. If it cost him 100 and he sells at 150, the profit is 50.", stake: { min: 0, max: 2 }, tol: 1, answer: () => m, reveal: "now", kind: "markup",
      explain: () => "Markup is profit ÷ cost, 50%. Margin is profit ÷ price, 50 ÷ 150 = 33%. Same sale, two numbers." });
    if (r.win) mastered("margin");
    keep("forecast", "Cash forecast", "Cash at the start + cash in − cash out, day by day. Profit doesn't pay wages; Cash does.", `Day ${G.s.day}: lowest Cash in two weeks ${low.close}, on day ${low.day}.${walked ? " Jory walked off on wages day." : ""} Markup 50% = margin ${m}%.`);
    await page(2); to(6, "tomas6");
  }
  // ---------- chapter 6: Tomas's terms (week 2). Time value (C0.01, C5.01) beside payables (C1.01) — SEASON-1-REDESIGN.md §7 item 1 ----------
  // Tomas: "2% off if you pay within 7 days". A discount for paying early is an interest rate: paying a week early costs the Cash you would
  // otherwise hold for that week, and Ezra's weekly rate prices that Cash. Early is cheaper iff 2% > 98% x rate, i.e. rate < 204 bp.
  // The rate comes from terms() THAT WEEK. Ezra's forecast scene lowers it, so in week 3 Tomas offers again and the answer can flip.
  // `tvm` mastery is earned only here, and only when the player's choice matched the cheaper option.
  // one set of whole coins, the same the engine books: the discount Tomas actually gives (bill.disc) and a week of Ezra's interest on the Cash you'd keep
  const tvmFacts = bill => { const rate = S.terms(G.s).rateBp, discX = bill.disc, carryX = Math.round(bill.amount * (1 - S.R.discPct) * rate / 10000);
    return { rate, discX, carryX, cheaper: discX > carryX ? "early" : discX < carryX ? "wait" : "even" }; };
  async function tvmScene(again) {
    const V = Verbs, t = S.terms(G.s), sc = S.R.seedCost, rate = t.rateBp / 100, left = Math.floor((t.apLimit + G.s.bal.ap) / sc), disc = Math.round(S.R.discPct * 100);
    if (!t.apDays || left < 3) { await G.say("tomas", "I can't put more on your account while you owe me this much. Pay what I'm owed first.", ["Next"]); return false; }
    if (again) await G.say("tomas", `Seed again? Same terms: the full bill in ${S.R.apDays} days, or ${disc}% off if you pay within ${S.R.discDays}.`, ["Next"]);
    else await G.say("tomas", `On account: the full bill in ${S.R.apDays} days, or ${disc}% off if you pay within ${S.R.discDays}.`, ["Next"]);
    await tell(again ? `Ezra's rate was ${st.tvmRate}% a week when you last bought. Today it is ${rate}%. Same discount, different Cash. I won't say whether that changes the answer.`
      : `A discount for paying early is an interest rate in disguise. Ezra charges ${rate}% a week for Cash. I won't say which is cheaper: buy, then move the bill and see.`, ["h-ap"]);
    const small = Math.min(6, left), big = Math.min(9, left);
    const c = await G.say("tomas", "How many on account?", [`${small} packets (${small * sc})`, { label: `${big} packets (${big * sc})`, disabled: big <= small }]);
    const r = G.act(() => S.buySeeds(G.s, c ? big : small, true));
    if (!r.ok) { await G.say("tomas", r.msg); return false; }
    const bill = G.s.bills[G.s.bills.length - 1], day0 = G.s.day;
    const note = day => day <= bill.discBy ? `Paying by day ${bill.discBy}: Tomas takes <b>${disc}% off</b> (${bill.disc}) for the Cash you hand over ${bill.due - day} days early. <b>Ezra's rate: ${rate}% a week.</b>` : `Paying on day ${day}: no discount, and the Cash stays with you. <b>Ezra's rate: ${rate}% a week.</b>`;
    const r2 = await V.timeline({ mode: "play", bill, n: Math.max(14, bill.due - G.s.day + 1), title: "When do you pay Tomas?", footNote: note,
      maud: `Pay your Tomas bill (${bill.amount}) by day ${bill.discBy} and he takes ${disc}% off, a week early; Ezra sells a week of Cash for ${rate}%. Which is cheaper, given the Cash has to be there on day ${bill.due} either way?` });
    const F = tvmFacts(bill), took = r2.day <= bill.discBy, right = F.cheaper === "even" || took === (F.cheaper === "early");
    if (r2.paidNow) G.act(() => S.payBills(G.s)); else if (r2.day < bill.due) G.s.payPlan = { day: r2.day };
    await tell(`${took ? `You took ${F.discX} off.` : "You kept the Cash."} A week of that Cash from Ezra at ${rate}% would cost ${F.carryX}, so ${F.cheaper === "early" ? "paying early was cheaper" : F.cheaper === "wait" ? "waiting was cheaper" : "it was a dead heat"}.`, ["h-ap"]);
    if (!again) await tell("The rate is not fixed. Watch what it does.");
    if (right) mastered("tvm"); // earned only here, only when the choice matched the cheaper option
    const ex = `Day ${day0}: Tomas's ${disc}% (${F.discX}) vs Ezra's ${rate}% a week (${F.carryX}): ${F.cheaper === "early" ? "paying early" : F.cheaper === "wait" ? "waiting" : "neither"} was cheaper. You ${took ? "paid early" : "waited"}.`;
    if (!again) {
      keep("ap", "Accounts payable & trade credit", "What you owe a supplier. Free credit until the due day; paying early can buy a discount.", `Day ${day0}: seed bill ${bill.amount}, ${disc}% off by day ${bill.discBy} = ${bill.disc}; you ${took ? "paid early" : "kept the Cash"}.`, `owed ${bill.amount}, due day ${bill.due}`);
      keep("tvm", "Money now vs money later (time value)", "A discount for paying early is an interest rate. Compare it with what the Cash would cost you, Ezra's weekly rate. Whichever is cheaper this week wins, and the answer can flip when the rate moves.", ex, `${disc}% vs ${rate}% a week`, `Day ${day0} · Tomas's terms`);
      st.tvmRate = rate;
    } else { addEx("tvm", ex); pin("tvm2", "Tomas offers again", `${disc}% vs ${rate}% a week`, `Day ${day0} · it ${st.tvmRate !== rate ? "flipped" : "held"}`); }
    return true;
  }
  async function ch6() { if (await tvmScene(false)) to(7, "ezra7"); }
  // ---------- chapter 7: Ezra (week 2; C1.06, C5.01: debt, interest, what lenders read) — the forecast scene is tagged `interest` ----------
  async function ch7() {
    const t0 = S.terms(G.s);
    await G.say("ezra", `Come in. Sit. You want coin; everyone does, eventually. My rate is ${t0.rateBp / 100}% a week. It is not a judgement, only a price. Show me your forecast first, and I shall see how much I believe it.`);
    const r = await Verbs.timeline({ mode: "predict", n: 14, tol: 5, title: "Your forecast, for Ezra", maud: "Ezra: tell me your lowest coin in the next two weeks, and the day. Get both right (the coin within 5) and I will shave my rate." });
    G.s.rateAdj = Math.min(100, 50 * ((r.okLow ? 1 : 0) + (r.okDay ? 1 : 0))); const t = S.terms(G.s);
    if (r.okLow && r.okDay) { mastered("interest"); mastered("wc"); } // right = the lowest coin (within 5) and the day (time value is earned in Tomas's scene, not here)
    const c = await G.say("ezra", `The line says ${r.low} on day ${r.lowDay}. ${r.okLow && r.okDay ? "You know your coin." : r.okLow || r.okDay ? "Half right." : "Sloppy."} Your rate: ${t.rateBp / 100}% a week (was ${t0.rateBp / 100}%). How much?`,
      ["Borrow 100", "Borrow 200", "Nothing today"]);
    if (c < 2) G.act(() => S.borrow(G.s, c ? 200 : 100));
    keep("interest", "Interest", "The price of Cash now: the rate times the loan, every week. A forecast a lender can trust buys a lower rate.", `Ezra's rate went from ${t0.rateBp / 100}% to ${t.rateBp / 100}% a week after your forecast.${c < 2 ? ` You borrowed ${c ? 200 : 100}: ${Math.round((c ? 200 : 100) * t.rateBp / 10000)} interest a week.` : ""}`, `${t0.rateBp / 100}% → ${t.rateBp / 100}% a week`, `Day ${G.s.day} · Ezra's forecast`);
    to(8, "sleep8");
  }
  // ---------- chapters 8 and 8b: Corvin Vane, the Duke's steward (week 2 midpoint, week 3 squeeze). C2.09 overtrading; case W.T. Grant. Maud asks, then bets; she doesn't show. ----------
  // Escalation (SEASON-1-REDESIGN.md §7 item 3): day 12 a first order (half of R.duke.sacks), day 15 a double order (R.duke.sacks). The timeline's second line
  // (tied up in sacks and invoices) shows what each order does to the working capital. Mastery only if the choice matched the player's OWN board.
  function arrive(n) { // Corvin's order n comes to the well (sizes and due dates: S.R.corvin)
    const c = S.R.corvin[n - 1];
    if (!G.s.offers.some(o => o.who === "duke")) S.addOffer(G.s, "duke", c.sacks, S.R.duke.price, S.R.duke.terms, c.dueIn, 4);
    to(8, n === 1 ? "duke8" : "duke9");
  }
  async function dukeScene(n) {
    const V = Verbs, o = G.s.offers.find(x => x.who === "duke"); if (!o) { to(8, n === 1 ? "page8" : "tomas9"); return; }
    const D = S.R.duke, sacks = o.sacks, half = Math.round(sacks / 6) * 3, value = sacks * o.price;
    await G.say("duke", n === 1 ? `You must be the heir! Corvin Vane, steward to His Grace, at the Duke's service, and yours. I bring the kind of opportunity that does not knock twice. His Grace wants ${sacks} sacks at ${o.price}: ${money(value)} of Revenue, delivered by day ${o.due}. He pays ${D.terms} days after delivery. Think what it could do for Thornfield.`
      : `Corvin Vane again, heir. ${G.s.orders.some(x => x.who === "duke") ? "His Grace was delighted with the first." : "His Grace remembers the first, and that it went unanswered."} Now ${sacks} sacks, double: ${money(value)}, delivered by day ${o.due}, paid ${D.terms} days after.`);
    if (n === 1) { await page(3); await tell("This is the order that killed your uncle; the steward calls it an opportunity. I call it a loan you make him, at no interest, in your own seed."); await tell("I won't tell you what to do. I'll ask."); }
    const need = Math.max(0, Math.ceil((sacks + S.committed(G.s) - G.s.sacks - S.sacksComing(G.s)) / 3) - G.s.seeds), extra = need * S.R.seedCost;
    const f = S.forecast(G.s, 14, extra), low = f.reduce((a, x) => x.close < a.close ? x : a), ord = { sacks, price: o.price, due: o.due };
    const base = V.rows({ n: 14, tied: true }), withO = V.rows({ n: 14, tied: true, extra, order: ord });
    const delta = withO[withO.length - 1].tied - base[base.length - 1].tied; // what this order ties up by the end of the window
    const title = `What if: you take it and buy ${need} packets of seed today (${extra})`;
    await V.timeline({ mode: "show", n: 14, extra, tied: true, order: ord, title, maud: n === 1 ? "Read your own board: Cash on top, and under it what is tied up in sacks and invoices." : `Last time ${money(st.tied1 || 0)} was tied up by this order. This time: ${money(delta)}.` });
    let ans;
    if (n === 1) ans = await ask("If you take it and buy the seed today, what's the lowest Cash in the next two weeks?", low.close, ["Look down the Cash line for the smallest number.", "A minus sign means the chest is empty before then."], null, 0,
      [{ label: "Open the what-if timeline", open: () => V.timeline({ mode: "show", n: 14, extra, tied: true, order: ord, title }) }], `Reading the Cash line, the smallest number is ${low.close}, on day ${low.day}.`, "Open the timeline and read the Cash number under each day. The smallest is your lowest point; a minus number is smaller than any plus.");
    else ans = await V.bet({ prompt: `Three coin says you can't tell me your lowest Cash in the next two weeks if you take all ${sacks} and buy the seed today.`, docs: [{ label: "Open the what-if timeline", open: () => V.timeline({ mode: "show", n: 14, extra, tied: true, order: ord, title }) }],
      how: "Read the Cash number under each day of the what-if timeline. The smallest is the lowest point; a minus is below zero.", stake: { min: 0, max: 3 }, tol: 0, answer: () => low.close, reveal: "now", kind: "duke2", explain: () => `Cash bottoms at ${low.close} on day ${low.day}. The order ties up ${money(delta)} in sacks and invoices.` });
    const c = await G.say("duke", n === 1 ? "Well? Opportunities are like bread, heir. Best taken warm." : "Well? His Grace doesn't wait.", [`Take all ${sacks}`, `Offer ${half} (half)`, "Decline"]);
    if (c === 1) { S.addOffer(G.s, "duke", half, o.price, D.terms, D.dueIn, 4); S.decline(G.s, o.id); G.act(() => S.accept(G.s, G.s.offers.find(x => x.who === "duke").id)); }
    else if (c === 0) G.act(() => S.accept(G.s, o.id)); else S.decline(G.s, o.id);
    const wise = low.close >= 0 ? c === 0 : c > 0; // matched the player's own board: Cash stays >= 0 -> taking it is right; below 0 -> half, decline (or factoring) is right
    if (wise) mastered("overtrading");
    if (n === 1) st.tied1 = delta;
    await tell(c === 0 && low.close < 0 ? `Your own board says Cash goes to ${low.close}. Edric did the same. Borrow, or sell the invoice to Ezra for 85% (factoring), or it ends the same way.`
      : c === 0 ? "Your board says you can carry it. Then carry it." : c === 1 ? `Half: ${half} sacks, and about ${money(Math.round(delta / 2))} less tied up. Growth you can't fund isn't growth.` : "Growth you can't fund isn't growth. Edric never learned that.");
    const choice = [`all ${sacks}`, "half", "to decline"][c];
    if (n === 1) keep("overtrading", "Overtrading", "Taking more orders than your Cash can carry: profit on paper, broke in fact. The gap grows with sales and only comes back when growth stops. Forecast before you say yes.", `Corvin's first order, ${sacks} sacks: lowest Cash ${low.close} on day ${low.day} if taken, ${money(delta)} tied up. You chose: ${choice}.`, `Cash low ${low.close}, ${money(delta)} tied up`, `Day ${G.s.day} · Corvin's first order`);
    else { addEx("overtrading", `The double order, ${sacks} sacks: lowest Cash ${low.close}, ${money(delta)} tied up (the first tied up ${money(st.tied1 || 0)}). You chose: ${choice}.`); pin("duke2", "Corvin's double order", `${money(delta)} tied up (was ${money(st.tied1 || 0)})`, `Day ${G.s.day} · second order`); }
    if (n === 1) to(8, "page8"); else to(8, "tomas9");
  }
  async function ch9t() { await tvmScene(true); to(9, "run9"); } // week 3: Tomas offers again; Ezra's rate has moved, and the answer can flip
  const ch8 = () => dukeScene(1), ch8b = () => dukeScene(2);
  // That night: Maud finds Edric's page (the midpoint turn): the same order every spring.
  async function chPage() {
    await tell("I couldn't sleep. I went through Edric's desk, and there was a page under the lining.");
    await page(9);
    await tell("The same kind of order, every spring, from the same man. Edric didn't miscount: someone made sure the coin ran out.");
    to(8, "sleep9");
  }
  // (Canon: Crane is NOT Vane's man. He carries Vane's offer as an instructed messenger, reluctantly; see craneOffer.)
  // ---------- week 4 (item 6): Maud's last scene. Edric's cash book, the second ledger he kept and never read beside the first. ----------
  // Rows are rebuilt from the player's own journal at the end of each week (days 7, 14, 21 and today, once each): cumulative Net income (the Ledger), the Cash the farm's
  // operations cleared (the chest: not the opening chest, equipment or loans), and what is tied up in grain and unpaid invoices (Inventory + Receivables - Payables - Deposits).
  function cashBookRows(s) {
    const PL = ["revenue", "cogs", "upkeep", "depreciation", "fines", "losses", "interest", "factoring"], OFF = ["open", "equip", "borrow", "repay"], rows = [], seen = new Set();
    for (const day of [7, 14, 21, s.day]) { if (day > s.day || seen.has(day)) continue; seen.add(day); let cash = 0, ni = 0; const b = { inv: 0, ar: 0, ap: 0, deposits: 0 };
      s.journal.filter(j => j.day <= day).forEach(j => { if (OFF.indexOf(j.type) < 0) cash += j.lines.cash || 0; PL.forEach(k => { ni -= j.lines[k] || 0; }); for (const k in b) b[k] += j.lines[k] || 0; });
      rows.push({ day, cash, ni, tied: b.inv + b.ar + b.ap + b.deposits }); }
    return rows;
  }
  async function cashBook() {
    const V = Verbs, s = G.s, rows = cashBookRows(s), last = rows[rows.length - 1];
    await tell("Edric kept a second book, a cash book of what the chest held week by week, and I never gave it to you until you could read it. He never read it beside the Ledger.");
    await new Promise(res => {
      G.showPanel("page", `<div class="journal"><div class="hint">Edric's cash book, the second ledger</div><table class="stm" style="font-style:normal"><tr><th>End of</th><th>Ledger: profit</th><th>Chest: Cash cleared</th><th>Tied up in grain and unpaid invoices</th></tr>` +
        rows.map(r => `<tr><td>day ${r.day}</td><td class="num">${V.fmt(r.ni)}</td><td class="num">${V.fmt(r.cash)}</td><td class="num">${V.fmt(r.tied)}</td></tr>`).join("") +
        `</table><p>Every spring the Ledger climbs and the chest does not. The difference sits in sacks and invoices nobody has paid for yet: Inventory plus Receivables, less what you still owe.</p><p class="sig">— E.</p></div><button class="btn gold" id="pgok">Keep it</button>`);
      document.getElementById("pgok").onclick = () => { G.hidePanel(); res(); };
    });
    pin("cashbook", "Edric's cash book", `profit ${V.fmt(last.ni)}, Cash ${V.fmt(last.cash)}`, `Day ${s.day} · second ledger`, "book");
    st.book = true;
    await tell("From here I'm quiet; if the farm is in danger, you'll hear it from me. Otherwise it's your books and your argument.");
  }
  // ---------- chapter 9: closing the books (C1.08), guided ----------
  async function close(stm, h) { // the game shows the statements one at a time; the player finds where the cash went
    await G.reveal("is", `Your income statement: Revenue, minus the cost of what you sold, minus running costs. Net income ${stm.is.net}. Edric's always looked like this.`);
    await G.reveal("bs", `Your balance sheet, start and end: what you own and what you owe. Owner's equity moved by exactly your net income.`);
    await G.reveal("cf", `And the cash-flow statement: net income, then every place the Cash actually went. It ends at the change in Cash: ${stm.cf.change}.`);
    const target = (h.lines.find(l => l.startsWith("cf:")) || "cf:cfo");
    const misses = await G.pickLine("Net income " + stm.is.net + ", Cash " + (stm.cf.change >= 0 ? "+" : "") + stm.cf.change + ". Click the line in the cash-flow statement where most of the difference went.", target,
      ["Look at the brackets: they're Cash that left, or never came.", "The biggest bracketed number between Net income and Cash from operations."]);
    if (misses === 0) { mastered("cfs"); mastered("statements"); } // right on the first tap
    await G.reveal("none", `${h.text}<br>That's what killed Edric: profit in the Ledger, the coin in other people's purses.`);
    if (st.pages.indexOf(4) < 0) { st.pages.push(4); (st.pageDays = st.pageDays || {})[4] = G.s.day; }
    await G.reveal("none", `<span class="journal small">Edric's last page: “${PAGES[4]}”</span>`);
    keep("statements", "The three statements", "Income statement: did you make a profit? Balance sheet: what you own and owe. Cash-flow statement: where the Cash went.", `Spring: net income ${stm.is.net}, Cash ${stm.cf.change >= 0 ? "up" : "down"} ${Math.abs(stm.cf.change)}. ${h.text.split(": ").pop()}`);
    to(9, "done");
  }

  // Deposits are named unearned revenue (C1.01/C1.03) in the scene (game.js depositLesson) and in the notebook.
  function noteDeposit(o) {
    keep("unearned", "Unearned revenue (customer deposits)", "Cash received for work not yet done. It's a liability, not Revenue, until you deliver; fail to deliver and you refund it.",
      `Day ${G.s.day}: ${S.NAMES[o.who]} paid ${o.paid} up front for ${o.sacks} sacks. Cash +${o.paid}, Revenue +0, Customer deposits +${o.paid}; grain due day ${o.due}.`, `${o.paid} received, ${o.sacks} sacks owed`, `Day ${G.s.day} · ${S.NAMES[o.who].split(" ").slice(-1)[0]}'s deposit`);
  }
  // ---------- name your farm (item 10): the name appears on the writ, the week cards and the epilogue ----------
  function nameFarm() {
    return new Promise(res => {
      document.querySelectorAll("#namefarm").forEach(e => e.remove());
      const ov = document.createElement("div"); ov.className = "s6ov"; ov.id = "namefarm";
      ov.innerHTML = `<div class="s6card"><div class="s6sub">The writ</div><h2>Name your farm</h2><p>Crane's pen is waiting. What does the writ call this land?</p>` +
        `<input type="text" id="nfin" maxlength="18" value="Thornfield" aria-label="Farm name" autocomplete="off"><br><button class="gold" id="nfok">Write it down</button><button id="nfdef">Keep “Thornfield”</button></div>`;
      document.getElementById("wrap").appendChild(ov);
      const done = keepDefault => { const v = keepDefault ? "" : ov.querySelector("#nfin").value.replace(/[<>&"'`]/g, "").trim().slice(0, 18); st.farm = v || "Thornfield"; ov.remove(); G.save(); res(st.farm); };
      ov.querySelector("#nfok").onclick = () => done(false); ov.querySelector("#nfdef").onclick = () => done(true);
      ov.querySelector("#nfin").addEventListener("keydown", e => { if (e.key === "Enter") done(false); e.stopPropagation(); }); // typing never walks the player
      if (!window.matchMedia("(pointer: coarse)").matches) setTimeout(() => { const i = ov.querySelector("#nfin"); i && i.select(); }, 30);
    });
  }
  // ---------- the case board (item 5): a corkboard of pinned clues, opened from the Books strip or the Desk ----------
  function caseBoard() {
    const prev = Endings.unlocked();
    const cards = st.clues.map(c => `<div class="clue ${c.kind}"><div class="ct">${c.term}</div><div class="cn">${c.num}</div><div class="cf">${c.from}</div></div>`).join("");
    return G.openDoc(() => G.showPanel("casebd", `<h1>The case board <span class="hint">${farmName()} · ${st.clues.length} clue${st.clues.length === 1 ? "" : "s"} · day ${G.s.day}</span></h1>` +
      `<p class="hint">Edric made a profit every year and still lost the farm. Who gains when a profitable farm runs out of coin? Every lesson pins a clue.</p>` +
      `<div class="corkboard">${cards || `<div class="cbempty">Nothing pinned yet. Every lesson pins a clue here.</div>`}</div>` +
      (prev.length ? `<h3 style="margin-top:10px">From earlier seasons</h3>${prev.map(u => `<div class="clue ${u.kind === "page" ? "page" : "book"}" style="margin:8px 0;transform:none"><div class="ct">${u.term}</div><div class="cn" style="font-family:var(--serif)">“${u.text}”</div></div>`).join("")}` : "")));
  }
  function deskItems() { // extra Desk-menu entries (game.js desk() adds them before "Back to the road")
    if (!G || G.s.over || busy) return [];
    const o = Endings.offer(G.s);
    return [{ label: `Crane's offer: ${money(o.price)}${o.mercy ? " (mercy)" : ""}`, fn: () => run(() => craneOffer()) }, { label: `Case board (${st.clues.length})`, fn: () => caseBoard() }];
  }
  function deskNote() { // the offer as a card on the Desk
    if (!G || G.s.over || st.stage === "intro") return "";
    const o = Endings.offer(G.s);
    return `<div class="offercard">Crane's standing offer for ${farmName()}: <b>${money(o.price)}</b> today${o.mercy ? ` (the mercy price: Cash ${money(o.cash)} is below ${money(o.wages)} of wages)` : ""}. Accepting ends the season.</div>`;
  }
  // ---------- Crane's offer (M3): a standing buy-out. Price formula and its tests: endings.js, tests/test-offer.js ----------
  const money = v => Number(v).toLocaleString("en-US");
  async function craneOffer(opts) { // opts.first: the day-1 scene; opts.mercy: Crane's visit when you are short for wages
    opts = opts || {}; const E = Endings, o = E.offer(G.s), farm = farmName();
    // Crane's voice: he numbers his sentences ("Item:"), and he delivers Corvin Vane's offer reluctantly, as an instructed messenger.
    const intro = opts.first ? `Item: I am instructed to convey an offer from Corvin Vane for ${farm}. Item: ${money(o.price)}, in coin, today. Item: I do not recommend it.`
      : o.mercy ? `Item: Cash is ${money(o.cash)}, and ${money(o.wages)} of wages fall due. Item: I am instructed to repeat the offer for ${farm} at a reduced ${money(o.price)}. Item: I still do not recommend it.`
      : `Item: Corvin Vane's offer for ${farm} stands at ${money(o.price)}. Item: I am obliged to say so.`;
    const c = await G.say("crane", intro, ["No. The farm stays.", `Sell ${farm} for ${money(o.price)}`]);
    if (c === 0) { pin("offer", "Crane's offer", `${money(o.price)} now`, `Day ${G.s.day} · money now, farm later`); return false; }
    const sure = await G.say("maud", `That is ${money(o.price)} now, and the season ends here. Is it a fair price for ${farm}, or is it the price of being frightened?`, ["Keep the farm", "Sell. It's done."]);
    if (sure === 0) return false;
    await sell(o); return true;
  }
  async function sell(o) {
    const s = G.s; s.sold = { price: o.price, day: s.day, mercy: o.mercy }; s.sold.so = Endings.soldOut(s, o.price);
    TR.use("tvm", false, s.day); TR.use("equation", false, s.day); // introduced, not credited: selling is not evidence of skill
    pin("offer", "Crane's offer", `took ${money(o.price)} on day ${s.day}`, `Day ${s.day} · you sold`);
    s.over = true; s.outcome = "sold"; G.save(); G.hud(); await showEnding("sold");
  }
  // ---------- endings (item 4): an epilogue card with 3-4 lines and what it unlocks for the next game ----------
  // opts.preview (the ?ending= test hook): show the epilogue for the game in opts.s without saving an unlock
  function showEnding(kind, opts) {
    opts = opts || {};
    return new Promise(res => {
      document.querySelectorAll(".s6ov").forEach(e => e.remove());
      const s = opts.s || G.s, ep = Endings.epilogue(kind, { s, farm: farmName(), sold: s.sold && s.sold.so }), u = opts.preview ? { u: ep.unlock, fresh: false, preview: true } : Endings.unlock(kind);
      const ov = document.createElement("div"); ov.className = "s6ov"; ov.id = "ending";
      ov.innerHTML = `<div class="s6card s6end-${kind}"><div class="s6sub">${farmName()} · Spring · the ending</div><h2>${ep.title}</h2>${ep.lines.map(l => `<p>${l}</p>`).join("")}` +
        (kind === "sold" ? `<div class="s6cmp"><div>You took<b>${money(s.sold.price)}</b></div>${s.sold.so && s.sold.so.earned > 0 ? `<div>${s.sold.so.basis === "cash" ? "Cash cleared this spring" : "Earned this spring"}<b>${money(s.sold.so.earned)}</b></div>` : ""}${s.sold.so ? `<div>Book equity<b>${money(s.sold.so.equity)}</b></div>` : ""}</div><p class="hint">C0.01 time value · C1.01 equity</p>` : "") +
        `<div class="s6unlock">${u && u.preview ? "Preview (not saved)" : u && u.fresh ? "Unlocked" : "Unlocked earlier"}: <b>${ep.unlock.term}</b><br>“${ep.unlock.text}”</div>` +
        `<button class="gold" id="endagain">Play again</button><button id="endcase">Case board</button><button id="endback">${kind === "sold" ? "Close" : "Back to the books"}</button></div>`;
      document.getElementById("wrap").appendChild(ov);
      ov.querySelector("#endagain").onclick = () => G.restart();
      ov.querySelector("#endcase").onclick = () => { ov.style.display = "none"; caseBoard().then(() => { ov.style.display = "flex"; }); };
      const bk = ov.querySelector("#endback"); if (bk) bk.onclick = () => { ov.remove(); res(); };
    });
  }
  // test hook (?ending=sold|seized|bridged|free): show that ending's epilogue on the current game, whatever its state
  async function testEnding(kind) {
    const s = JSON.parse(JSON.stringify(G.s)); // a copy: the preview never touches the real game or the saved unlocks
    if (kind === "sold") { const o = Endings.offer(s); s.sold = { price: o.price, day: s.day, so: Endings.soldOut(s, o.price) }; }
    if (kind === "seized") { s.over = true; s.outcome = "insolvent"; s.why = s.why || "Cash 12 can't cover 48 of wages and interest. The hands walk off."; }
    if (kind === "free") { s.bal.cash += 1500; s.bal.capital -= 1500; }
    if (kind === "bridged") { const need = S.R.crownDebt - S.crownFund(s).net - 150; s.bal.cash += need; s.bal.capital -= need; }
    return showEnding(kind, { s, preview: true });
  }

  // screenshots and tests only (_build-shots/ws6-shots.html): force-start one scene on the current game, whatever the story was doing
  function testScene(kind) {
    busy = false; document.querySelectorAll(".s6ov,.wkcard").forEach(e => e.remove()); G.closeDlg(); G.hidePanel(); const s = G.s;
    if (kind === "corvin" || kind === "tied") { s.day = Math.max(s.day, 12); st.ch = 8; arrive(1); G.hud(); run(() => dukeScene(1)); }
    else if (kind === "page") { st.ch = 8; run(() => page(9)); }
    else if (kind === "cashbook") { s.day = Math.max(s.day, 22); to(9, "run9"); run(cashBook); }
    else if (kind === "offer") run(() => craneOffer({ first: true }));
    else if (kind === "tvm") { st.ch = 6; st.stage = "tomas6"; run(() => tvmScene(false)); }
  }
  // ---------- hooks from the game ----------
  let busy = false;
  async function run(fn, ...a) { if (busy) return; busy = true; window.__walked = false; try { await fn(...a); } finally { busy = false; G.hud(); } }
  function start() { goal(); if (st.stage === "intro") { const w = dueCard(); if (w) weekCard(w); run(ch1); } }
  function onTalk(who) { // returns true when the story takes the conversation
    if (busy) return true;
    const m = { tomas: { tomas2: ch2, tomas6: ch6, tomas9: ch9t }, ashby: { ashby3: ch3 }, hobb: { hobb4: ch4 }, ezra: { ezra7: ch7 }, duke: { duke8: ch8, duke9: ch8b } }[who];
    if (m && m[st.stage]) { run(m[st.stage]); return true; }
    // Integration: from chapter 5 on, a waiting village scene (#28) or the day's practice problem (#29) must reach the player, so Maud's hint/silence lines below stand aside and game.js shows her menu
    if (who === "maud" && st.ch >= 5 && ((window.Scenes && Scenes.available("maud", G.s)) || (weekOf(G.s.day) !== 4 && window.Practice && Practice.available(G.s, TR.state)))) return false; // (week 4: no problem from Maud, see game.js)
    if (who === "maud" && weekOf(G.s.day) === 4) { run(async () => { const c = S.coach(G.s); await tell(c && c.danger ? c.text : "Maud only nods toward the door. This week she speaks only when the farm is in danger."); }); return true; } // week 4: silent but for danger
    if (who === "maud" && st.ch < 9 && st.stage !== "done") { run(() => tell(`Next: ${goalText().split(": ").slice(1).join(": ")}`)); return true; }
    return false;
  }
  function after(evt, info) {
    if (evt === "morning" && G.s.payPlan && G.s.day >= G.s.payPlan.day) { G.s.payPlan = null; G.act(() => S.payBills(G.s)); G.toast("You paid Tomas, as planned."); }
    if (evt === "morning") { const w = dueCard(); if (w) weekCard(w); goal(); } // WS6: a new week's title card on day 8, 15, 22; the ribbon follows the calendar
    if (busy) return;
    if (evt === "plant" && st.stage === "plant2" && (G.s.seeds === 0 || G.s.plots.filter(p => p.crop).length - (st.planted0 || 0) >= 6))
      run(async () => { await tell("Good: water them every day and in four nights it's grain. Now, Hobb at the mill wants grain too."); to(4, "hobb4"); });
    if (evt === "harvest" && st.stage === "harvest2" && !G.s.plots.some(p => p.crop && S.stage(G.s, p) === 4))
      run(async () => { await tell(`${G.s.sacks} sacks in the barn now. Ashby at the bakery (red roof) is waiting.`); await page(0); to(2, "ashby3"); });
    if (evt === "deliver" && st.stage === "ship3" && info.who === "ashby")
      run(async () => { const cg = info.sacks * S.R.unitCost; await tell(`Revenue ${info.value}, Cost of goods sold ${cg}: gross profit ${info.value - cg}, and it came in as Cash today.<br>Now seed: Tomas has the next packets (east along the path, green roof).`, ["h-cash", "h-ni"]); to(3, "tomas2"); });
    if (evt === "deliver" && st.stage === "ship4" && info.who === "hobb") run(ch4b, info);
    if (evt === "morning") run(async () => { // one ordered chain per morning, so two scenes never race for the same dialog
      const d = G.s.day;
      if (window.Scenes && Scenes.morning) await Scenes.morning({ G, st, S, day: d }); // HOOK: village scenes from another PR (cast.js / scenes.js); nothing is built here
      if (st.stage === "sleep5" && d >= 8) await ch5();
      if (G.s.bet && d >= G.s.bet.revealDay) await revealIfDue();
      if (st.stage === "sleep8" && d >= 12) { arrive(1); await tell("Corvin Vane is in the square, in a grey cloak and gloves on a warm day, asking for you by name. Mind his smile: it is paid for by someone."); } // the midpoint: day 12 (#28's description of Vane)
      else if (st.stage === "page8") await chPage();
      else if (st.stage === "sleep9" && d >= 15) { arrive(2); await tell("The steward is back at the well, with a thicker roll of paper."); }
      else if (weekOf(d) === 3 && st.ch >= 8 && st.mercy !== 3 && G.s.bal.cash < S.weekBills(G.s)) { st.mercy = 3; await craneOffer({ mercy: true }); } // Crane visits when Cash can't cover the pay-day
      else if (st.stage === "run9" && d >= 22 && !st.book) await cashBook(); // week 4: the cash book, Maud's last word
    });
  }
  const quietOffers = () => st && st.ch <= 4; // no stray orders while the first lessons run
  // Edric's letters in the order you found them (earliest day first); "The thing I signed" is always last, after the Court
  const letterOrder = () => { const d = (st && st.pageDays) || {}, last = LETTERS.indexOf("The thing I signed"); return (st ? st.pages : []).slice().sort((a, b) => (a === last) - (b === last) || (d[a] == null ? 99 : d[a]) - (d[b] == null ? 99 : d[b]) || a - b); };
  return { init, start, onTalk, letterOrder, after, close, quietOffers, letter: page, LETTERS, goalTexts: () => GOALS, get state() { return st; }, get busy() { return busy; }, TITLES, WEEKS, PAGES, fresh, weekCard, weekOf, pin, farmName,
    testScene, noteDeposit, tidyClue, craneOffer, caseBoard, deskItems, deskNote, showEnding, testEnding, nameFarm, tvmFacts, cashBookRows }; // WS6 hooks used by game.js and the tests; letter/LETTERS are #28's
})();
