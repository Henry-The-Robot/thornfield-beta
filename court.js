// Ledger & Crown: the Reeve's Court. The Spring exam and the finale in one scene.
// Steward Vane's advocate makes eight claims, each built from the player's OWN statements (no literals: every number below comes from `statements`). The player PRESSES a
// claim (for detail; sometimes it reveals evidence) or PRESENTS a card (a statement line, a clue from the case board, or something a press or a witness turned up) to refute it.
// Pass = refute 6 of 8. A failed hearing is never a game over: retake with a fresh set of claims (same books, new claims and wording). Whether the farm survives is the Crown
// verdict, which is separate.
//   Court.run({ statements, clues, flags, trust, seed, farm, facts, letter }) -> Promise<{ passed, score, mistakes, certificate, attempts, flags }>
//   Court.build(opts) -> { claims, cards }  (pure: used by the tests to prove every claim's answer derives from the statements)
// Transcript: a right present with no hint and no witness is answer evidence for the claim's concept; nothing else is.
window.Court = (function () {
  "use strict";
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0; return h; };
  const rng = seed => { let a = (typeof seed === "number" ? seed : hash(String(seed))) >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = x => Math.round(x * 100), pickOf = (r, a) => a[Math.floor(r() * a.length) % a.length];
  const sh = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const PASS = 6, TOTAL = 8;

  // ---------- the cards: every line of the three statements, the case-board clues, and whatever presses and witnesses add ----------
  function cardsFrom(st, clues) {
    const I = st.is, E = st.end, C = st.cf, mk = (id, tab, label, value, raw) => ({ id, tab, label, value, raw }), c = [];
    c.push(mk("is:revenue", "is", "Revenue", I.revenue, I.revenue), mk("is:cogs", "is", "Cost of goods sold", I.cogs, I.cogs), mk("is:gross", "is", "Gross profit", I.gross, I.gross),
      mk("is:gm", "is", "Gross margin", (I.revenue > 0 ? pct(I.gross / I.revenue) : 0) + "%", I.revenue > 0 ? pct(I.gross / I.revenue) : 0), mk("is:opex", "is", "Operating expenses", I.opex, I.opex),
      mk("is:operating", "is", "Operating income", I.operating, I.operating), mk("is:interest", "is", "Interest", I.interest, I.interest), mk("is:net", "is", "Net income", I.net, I.net));
    c.push(mk("bs:cash", "bs", "Cash", E.cash, E.cash), mk("bs:ar", "bs", "Accounts receivable", E.ar, E.ar), mk("bs:inv", "bs", "Inventory", E.inv, E.inv), mk("bs:equip", "bs", "Equipment (net)", E.equipNet, E.equipNet),
      mk("bs:assets", "bs", "Total assets", E.assets, E.assets), mk("bs:ap", "bs", "Accounts payable", E.ap, E.ap), mk("bs:loan", "bs", "Loan payable", E.loan, E.loan), mk("bs:crown", "bs", "Owed to the Crown", E.crown, E.crown),
      mk("bs:deposits", "bs", "Customer deposits", E.deposits, E.deposits), mk("bs:liab", "bs", "Total liabilities", E.liab, E.liab), mk("bs:equity", "bs", "Owner's equity", E.equity, E.equity));
    c.push(mk("cf:net", "cf", "Net income", C.net, C.net), mk("cf:dAR", "cf", "Change in receivables", -C.dAR, -C.dAR), mk("cf:dInv", "cf", "Change in inventory", -C.dInv, -C.dInv), mk("cf:dAP", "cf", "Change in payables", C.dAP, C.dAP),
      mk("cf:cfo", "cf", "Cash from operations", C.cfo, C.cfo), mk("cf:capex", "cf", "Equipment bought", C.capex, C.capex), mk("cf:cff", "cf", "Loans in and out", C.cff, C.cff), mk("cf:change", "cf", "Change in Cash", C.change, C.change));
    (clues || []).forEach(k => { const k2 = mk("clue:" + k.id, "clue", k.term, k.number == null ? "" : k.number, k.number); k2.src = k.source || ""; c.push(k2); });
    return c;
  }

  // ---------- the claims: each builder returns null when its premise doesn't apply to these books ----------
  // right(card): does this card refute the claim?  press: [{w, t}] (the first may reveal a card, the second is a nudge)  hint: Maud's whisper after a miss
  const cl = (re, card) => card.tab === "clue" && re.test(card.label + " " + (card.src || ""));
  const BUILDERS = [
    { id: "profitCash", must: true, build(x) { const { I, C, E, R, rnd } = x, gap = I.net - C.change; if (Math.abs(gap) < 10) return null;
        const drains = [["receivables", C.dAR], ["inventory", C.dInv], ["the loan", -C.cff], ["equipment", -C.capex]].sort((a, b) => b[1] - a[1]), top = drains[0][1] > 0 ? drains[0][0] : "timing";
        return { id: "profitCash", concept: "cfs", text: pickOf(rnd, [`Net income this spring was <b>${I.net}</b>. The chest must have grown by that much, so the Crown's ${x.crown} is a formality.`, `The farm earned <b>${I.net}</b>. A farm that earns that much has that much in the chest. Pay the Crown.`]),
          press: [{ w: "advocate", t: "Net income is the farm's gain. A gain is a gain. I will not be lectured on it by a child." }, { w: "maud", t: "Cash went from " + C.cashStart + " to " + C.cashEnd + ". Ask the statements where the difference went." }],
          hint: "The Cash-flow statement bridges profit to Cash.", right: c => c.tab === "cf", rightLabel: "the Cash-flow statement (Change in Cash)",
          maud: `Net income ${I.net}, but Cash moved only ${C.change}: ${Math.abs(gap)} of it sits in ${top}. Profit is an opinion; Cash is a fact.`, crane: `Item: net income ${I.net}. Item: Cash change ${C.change}. The two columns disagree, Your Honour. They always do.` }; } },
    { id: "arCash", concept: "ar", build(x) { const { E, flags, rnd } = x, f = x.facts.invoices || [], late = f.slice().sort((a, b) => b.due - a.due)[0];
        return { id: "arCash", concept: "ar", text: E.ar > 0 ? pickOf(rnd, [`Customers owe the farm <b>${E.ar}</b>. That is as good as Cash in the chest.`, `<b>${E.ar}</b> is owed to the farm by honest neighbours. A debt owed to you is money you already have.`]) : `Whatever the customers promise is as good as Cash in the chest. Nobody has ever lost money on a neighbour.`,
          press: [{ w: "advocate", t: "A promise from the miller is as good as a coin. Ask anyone in the valley." }, { w: "maud", t: "When is it due, and does the Crown wait for it? Look at what you were shown." }],
          reveal: { id: "found:ar", tab: "found", label: "Invoices still owed", value: E.ar, raw: E.ar, src: late ? `${late.who ? late.who + ": " : ""}due day ${late.due}` + (flags.hobbExt ? ". Hobb asked for seven more days." : "") : "Promised, not paid: nothing on them is Cash until the customer pays." },
          hint: "Compare the promise with what is in the chest.", right: c => c.id === "found:ar" || c.id === "bs:cash" || cl(/receiv|invoice|hobb|extension|due/i, c), rightLabel: "the invoices' due days, or the Cash actually in the chest",
          maud: `Receivables ${E.ar}, Cash ${E.cash}. ${flags.hobbExt ? "Hobb's extra days are a loan you never priced; a" : "A"} promise is not a coin.`, crane: `Item: receivables ${E.ar}. Item: Cash ${E.cash}. Item: a debtor can be late, Your Honour. I have a column for it.` }; } },
    { id: "ownsNothing", concept: "equation", build(x) { const { E } = x; if (E.assets <= 0) return null;
        return { id: "ownsNothing", concept: "equation", text: `The farm owns nothing of worth. Edric left a debt and a field, and the heir inherits both.`,
          press: [{ w: "advocate", t: "A field. A shed. Dust. Show me one thing of value in that barn." }, { w: "maud", t: "What does the farm own that the Crown could count? There is a line for it." }],
          hint: "Assets are what the farm owns. Total them.", right: c => ["bs:assets", "bs:inv", "bs:equip"].includes(c.id), rightLabel: "Total assets (or Inventory / Equipment) on the balance sheet",
          maud: `Total assets ${E.assets}: ${E.inv} of grain and seed, ${E.equipNet} of equipment, ${E.cash} in the chest, ${E.ar} owed to you. Against ${E.liab} owed, equity is ${E.equity}.`, crane: `Item: total assets ${E.assets}. I counted twice, Your Honour. The advocate's "nothing" is not a number.` }; } },
    { id: "unprofitable", concept: "gross", build(x) { const { I, flags } = x; if (I.gross <= 0) return null;
        return { id: "unprofitable", concept: "gross", text: `Edric was simply a bad farmer: unprofitable, year after year, and the heir follows him.`,
          press: [{ w: "advocate", t: "An empty chest is an empty chest. The man could not make money. Say otherwise." }, { w: "maud", t: "Edric's letters say otherwise, and so do your books. What did the grain earn?" }],
          hint: "Look at what the grain earned before wages.", right: c => ["is:gross", "is:gm"].includes(c.id) || (I.operating > 0 && c.id === "is:operating") || (I.net > 0 && c.id === "is:net") || cl(/edric|letter|profit/i, c), rightLabel: "Gross profit (or an Income-statement profit line, or Edric's letters)",
          maud: `Gross profit ${I.gross} on Revenue ${I.revenue}; Operating income ${I.operating}. Edric's page says profit every year: he wasn't unprofitable, he was out of Cash.`, crane: `Item: gross profit ${I.gross}. Item: Edric's page, "profit every year". A bad farmer does not write that. A clerk does.` }; } },
    { id: "dukeGenerous", concept: "wc", build(x) { const { R, rnd } = x, d = R.duke || { sacks: 132, price: 10, terms: 28 }, mp = x.facts.market || 8, pays = Math.floor(d.terms / 7);
        return { id: "dukeGenerous", concept: "wc", text: pickOf(rnd, [`Steward Vane's order paid <b>${d.price}</b> a sack when the market paid ${mp}. Generous, by any measure.`, `The Duke's order: <b>${d.sacks}</b> sacks at <b>${d.price}</b>, above the market's ${mp}. Edric was handed a gift.`]),
          press: [{ w: "advocate", t: "Ten against eight. Count the coins. Count them!" }, { w: "maud", t: "Counting is the right idea. But count the days too: when does the Duke pay, and when are the wages due?" }],
          reveal: { id: "found:duke", tab: "found", label: "The Duke's terms", value: d.terms, raw: d.terms, src: `Paid ${d.terms} days after delivery. Wages and seed are due every week.` },
          hint: "A price is only half a term. Look at when the money arrives.", right: c => c.id === "found:duke" || c.id === "cf:dAR" || cl(/duke|terms|wage|calendar|overtrad/i, c), rightLabel: "the Duke's payment terms (28 days) against weekly wages",
          maud: `${d.sacks} sacks at ${d.price} is ${d.sacks * d.price}, paid ${d.terms} days after delivery: ${pays} pay-days of wages and seed with nothing coming in. Generous price, ruinous terms.`, crane: `Item: ${d.terms} days to payment. Item: ${pays} pay-days before it. The Duke was generous only with the calendar, Your Honour.` }; } },
    { id: "guarantee", must: true, concept: "accrual", build(x) { const { E, flags } = x; if (!flags.guarantee) return null;
        return { id: "guarantee", concept: "accrual", text: `A name on a paper is not a debt. Edric's promise to Widow Ashby's creditor is nowhere in the Ledger, so it is nowhere owed.`,
          press: [{ w: "advocate", t: "If it is not in the Ledger it is not a liability. That is what a Ledger is for." }, { w: "maud", t: "A guarantee is a promise to pay if she cannot, and it is a liability whether or not anyone wrote it down. What did the village tell you?" }],
          reveal: { id: "found:guarantee", tab: "found", label: "Ashby's guarantee", value: "", raw: null, src: "Edric stood surety for her bakery's debt. Off the Ledger, on the farm." },
          hint: "Which clue is about Ashby's bakery?", right: c => c.id === "found:guarantee" || cl(/guarantee|ashby|surety|bakery/i, c), rightLabel: "the guarantee: Ashby's clue or the guarantee note",
          maud: `Total liabilities show ${E.liab} and the guarantee isn't in it. If Ashby can't pay, the farm must: a contingent liability, off the books, still real.`, crane: `Item: a signature beneath a bakery's debt. Item: no line for it in the Ledger. I noted the omission in the margin, Your Honour. Twice.` }; } },
    { id: "callable", must: true, concept: "overtrading", build(x) { const { E, flags, trust } = x;
        return { id: "callable", concept: "overtrading", text: `Payable on demand is a gift. The Steward's mortgage asks for no payment until the day it is wanted. Where is the harm?`,
          press: [{ w: "advocate", t: "No instalments. No interest due in the winter. I can hardly be accused of cruelty." }, { w: "maud", t: "Who chooses the day? Ezra publishes his price; ask yourself what the Steward publishes." }],
          reveal: { id: "found:demand", tab: "found", label: "'On demand' means his day", value: "", raw: null, src: "He may call the whole sum the day it suits him. Today. Midwinter. The day wages fall due." },
          hint: "Who gets to pick the day the debt is called?", right: c => c.id === "found:demand" || c.id === "found:rate" || cl(/demand|callable|mortgage|vane|millstream|note/i, c), rightLabel: "the 'on demand' note, a Vane clue, or Ezra's published rate",
          maud: `The loan on your books is ${E.loan}. On demand, he may call all of it and every other note he holds in one day: a debt with someone else's due date is a leash.`, crane: `Item: "payable on demand". Item: demand by whom? The Steward, Your Honour. I have carried his paper before.` }; } },
    { id: "margin", must: true, concept: "margin", build(x) { const { I, rnd } = x; if (I.revenue <= 0 || I.cogs <= 0) return null; const mk = Math.round((I.revenue - I.cogs) / I.cogs * 100), gm = pct(I.gross / I.revenue); if (mk === gm) return null;
        return { id: "margin", concept: "margin", text: pickOf(rnd, [`Revenue ${I.revenue}, cost of grain ${I.cogs}: a <b>${mk}%</b> margin. The farm keeps ${mk} coins in every hundred it takes.`, `Grain cost ${I.cogs}; it sold for ${I.revenue}. That is a <b>${mk}%</b> margin, on any reckoning.`]),
          press: [{ w: "advocate", t: "Profit over cost. It is how every merchant on the river does it." }, { w: "maud", t: "That's markup, and a fair number. But he called it margin: what is margin divided by?" }],
          hint: "Margin divides the profit by the price you sold at.", right: c => c.id === "is:gm", rightLabel: "Gross margin on the Income statement",
          maud: `Markup ${mk}% is profit over cost; margin is profit over price: ${I.gross} ÷ ${I.revenue} = ${gm}%. The farm keeps ${gm} coins in every hundred it takes, not ${mk}.`, crane: `Item: ${I.gross} over ${I.revenue}. The advocate divided by the wrong column, Your Honour. I did it again to be sure.` }; } },
    { id: "inventoryCash", concept: "inventory", build(x) { const { E } = x; if (E.inv <= 0) return null;
        return { id: "inventoryCash", concept: "inventory", text: `There are <b>${E.inv}</b> coins of grain and seed in the barn. The farm can pay the Crown out of that today.`,
          press: [{ w: "advocate", t: "Grain is grain. Weigh it out and lay it on the Reeve's table." }, { w: "maud", t: "The Crown takes coin. What would you have to do with that grain first, and has it been done?" }],
          reveal: { id: "found:inv", tab: "found", label: "Inventory is at cost, unsold", value: E.inv, raw: E.inv, src: "Grain and seed are carried at what they cost. Until a buyer pays, none of it is Cash." },
          hint: "Inventory is not Cash until it is sold and paid for.", right: c => c.id === "found:inv" || c.id === "cf:dInv" || c.id === "bs:cash", rightLabel: "Inventory 'at cost, unsold' or the Cash actually in the chest",
          maud: `Inventory ${E.inv} is at cost and unsold, and Cash is ${E.cash}. The Crown takes coin, not sacks: sell and collect first.`, crane: `Item: inventory ${E.inv} at cost. Item: not sold. I do not count unsold grain twice, Your Honour; I count it once, as grain.` }; } },
    { id: "equityBank", concept: "equation", build(x) { const { E } = x; if (E.cash === E.equity) return null;
        return { id: "equityBank", concept: "equation", text: `Owner's equity is <b>${E.equity}</b>. That is what Edric's heir has in the bank.`,
          press: [{ w: "advocate", t: "Equity is the owner's money. It says so in the name." }, { w: "maud", t: "What is equity made of? And where do you look for what is actually in the chest?" }],
          hint: "Equity is assets minus liabilities. Find the chest's own line.", right: c => ["bs:cash", "bs:assets", "bs:liab"].includes(c.id), rightLabel: "Cash, or Total assets minus Total liabilities, on the balance sheet",
          maud: `Equity ${E.equity} = assets ${E.assets} − liabilities ${E.liab}. It is a claim on the farm, not a coin in the chest: the chest holds ${E.cash}.`, crane: `Item: equity ${E.equity}. Item: Cash ${E.cash}. The advocate has confused a total with a drawer, Your Honour.` }; } },
  ];
  // first-order wrong answers get a specific word; everything else is a polite overrule
  function wrongLine(card, claim) {
    if (card.tab === "found" || card.tab === "clue") return `${esc(card.label)} is not the answer to that one. It's a fair thing to hold, but it doesn't contradict what he said.`;
    return `${esc(card.label)}${card.value !== "" ? " " + esc(card.value) : ""} is true, but it doesn't contradict him. Find the line that does.`;
  }

  // ---------- build: the eight claims for this hearing ----------
  function build(o) {
    const st = o.statements, R = (window.Spring && window.Spring.R) || {}, rnd = rng(o.seed == null ? 1 : o.seed), x = { I: st.is, E: st.end, C: st.cf, R, flags: o.flags || {}, trust: o.trust || {}, facts: o.facts || {}, crown: R.crownDebt || 1250, rnd };
    const cards = cardsFrom(st, o.clues), all = BUILDERS.map(b => ({ b, k: b.build(x) })).filter(y => y.k), must = all.filter(y => y.b.must), rest = sh(rnd, all.filter(y => !y.b.must));
    const pickd = must.concat(rest).slice(0, TOTAL).map(y => y.k), order = sh(rnd, pickd);
    order.forEach((k, i) => { k.n = i + 1; });
    return { claims: order, cards, pool: all.length };
  }

  // ---------- sound: through the game's FX buses when it has them, otherwise a small synth of our own ----------
  let _ac = null;
  function ctx() { try { if (window.FX && FX.ctx) return FX.ctx(); } catch (e) {} if (!_ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) try { _ac = new C(); } catch (e) {} } if (_ac && _ac.state === "suspended") try { _ac.resume(); } catch (e) {} return _ac; }
  function tone(a, f, t0, d, type, v, to) { const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0; o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v || .15, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02); }
  const SND = { gavel(a) { tone(a, 180, 0, .12, "triangle", .35, 60); tone(a, 1400, 0, .03, "square", .08); tone(a, 150, .22, .14, "triangle", .3, 55); tone(a, 1200, .22, .03, "square", .07); }, objection(a) { tone(a, 392, 0, .12, "sawtooth", .14); tone(a, 587, .1, .12, "sawtooth", .16); tone(a, 784, .2, .3, "sawtooth", .18, 740); }, wrong(a) { tone(a, 160, 0, .25, "sawtooth", .12, 90); }, win(a) { [523, 659, 784, 1047].forEach((f, i) => tone(a, f, i * .11, .35, "triangle", .14)); }, page(a) { tone(a, 900, 0, .05, "triangle", .05, 500); } };
  function sfx(name) { try { if (window.FX && (FX.sfxOn === false || FX.muted)) return; if (window.FX && FX.sfx && FX.names && FX.names.indexOf(name) >= 0) return FX.sfx(name); const a = ctx(); if (a && SND[name]) SND[name](a); } catch (e) {} }

  // ---------- the hearing ----------
  const WHO = { advocate: ["Vane's advocate", "#4a2c5a", "A"], maud: ["Reeve Maud", "#2f6f62", "M"], crane: ["Bailiff Crane", "#5a4a38", "C"], ezra: ["Ezra", "#2f4f7f", "E"], vane: ["Steward Vane", "#2a2038", "V"], narr: ["", "#7a4a22", ""] };
  const TABS = [["is", "Income"], ["bs", "Balance"], ["cf", "Cash flow"], ["clue", "Clues"], ["found", "Found"]];
  let root = null;
  const mount = () => { if (root) root.remove(); root = document.createElement("div"); root.id = "court"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "The Reeve's Court"); document.body.appendChild(root); document.body.classList.add("in-court"); return root; };
  const unmount = () => { if (root) root.remove(); root = null; document.body.classList.remove("in-court"); };
  const portrait = k => `<span class="ct-face" style="background:${WHO[k][1]}">${WHO[k][2]}</span>`;
  const hall = (inner, cls) => `<div class="ct-hall ${cls || ""}"><div class="ct-top"><span class="ct-title">The Reeve's Court</span><span class="ct-sub">Thornfield · Spring</span></div>${inner}</div>`;
  // one screen at a time; resolves with the id of the button tapped
  function screen(html, keys) { return new Promise(res => { root.innerHTML = html; root.querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => res(b.dataset.k))); const first = root.querySelector("[data-k]"); if (first) try { first.focus({ preventScroll: true }); } catch (e) {} }); }
  function say(who, text, label, extra) { sfx("page"); return screen(hall(`<div class="ct-stage plain"><div class="ct-bubble ${who}">${portrait(who)}<div class="ct-say"><b>${esc(WHO[who][0])}</b><p>${text}</p></div></div>${extra || ""}<div class="ct-actions"><button class="ct-btn gold" data-k="next">${esc(label || "Next")}</button></div></div>`)); }
  function choose(who, text, opts) { return screen(hall(`<div class="ct-stage plain"><div class="ct-bubble ${who}">${portrait(who)}<div class="ct-say"><b>${esc(WHO[who][0])}</b><p>${text}</p></div></div><div class="ct-actions col">${opts.map((o, i) => `<button class="ct-btn ${i === 0 ? "gold" : ""}" data-k="${i}">${esc(o)}</button>`).join("")}</div></div>`)).then(Number); }

  // one hearing: eight claims
  function hearing(o, attempt) {
    const B = build(Object.assign({}, o, { seed: (o.seed == null ? 1 : o.seed) + attempt * 7919 })), cards = B.cards.slice(), claims = B.claims, trust = o.trust || {};
    const S = { i: 0, results: [], mistakes: [], crane: trust.crane >= 3, ezra: trust.ezra >= 3, tab: "is", sel: null, press: 0, wrong: 0, hint: false, feed: null, over: false, evidenceMade: 0, newTab: {} };
    if (o.test) window.__courtTest = { claims, cards, S };
    return new Promise(done => {
      const cur = () => claims[S.i], pips = () => claims.map((c, i) => { const r = S.results[i]; return `<i class="${r ? (r.ok ? "ok" : "no") : i === S.i ? "now" : ""}"></i>`; }).join("");
      const tab = () => cards.filter(c => c.tab === S.tab);
      function render() {
        const c = cur(), r = S.results[S.i], resolved = !!r, tabs = TABS.map(([k, n]) => { const cnt = cards.filter(x => x.tab === k).length; return cnt || k === "found" ? `<button class="ct-tab ${S.tab === k ? "on" : ""} ${S.newTab[k] ? "new" : ""}" data-a="tab" data-v="${k}">${n}${k === "clue" || k === "found" ? ` (${cnt})` : ""}</button>` : ""; }).join("");
        const grid = tab().map(k => `<button class="ct-card ${S.sel === k.id ? "sel" : ""}" data-a="sel" data-v="${esc(k.id)}" ${resolved ? "disabled" : ""}><b>${esc(k.label)}</b>${k.value !== "" ? `<span class="n">${esc(k.value)}</span>` : ""}${k.src ? `<small>${esc(k.src)}</small>` : ""}</button>`).join("") || `<p class="ct-empty">Nothing here yet. Press a claim to see what turns up.</p>`;
        const feed = S.feed ? `<div class="ct-feed ${S.feed.cls || ""}">${portrait(S.feed.who)}<div class="ct-say"><b>${esc(WHO[S.feed.who][0])}</b><p>${S.feed.t}</p></div></div>` : "";
        const verdict = resolved ? `<div class="ct-verdict ${r.ok ? "ok" : "no"}">${r.ok ? "REFUTED" : "SUSTAINED"}</div>` : "";
        root.innerHTML = hall(`<div class="ct-bar"><span class="ct-count">Claim ${S.i + 1} of ${claims.length}</span><span class="ct-pips">${pips()}</span><span class="ct-need">Refute ${PASS} to pass</span><button class="ct-leave" data-a="leave">Leave</button></div>
          <div class="ct-stage"><div class="ct-bubble advocate">${portrait("advocate")}<div class="ct-say"><b>${esc(WHO.advocate[0])}</b><p class="ct-claim">${c.text}</p></div></div>${verdict}${feed}</div>
          <div class="ct-actions">${resolved ? `<button class="ct-btn gold" data-a="next">${S.i + 1 >= claims.length ? "Hear the verdict" : "Next claim"}</button>` : `<button class="ct-btn" data-a="press">Press${S.press ? ` (${S.press}/${c.press.length})` : ""}</button><button class="ct-btn gold" data-a="present" ${S.sel ? "" : "disabled"}>Present${S.sel ? "" : " (pick a card)"}</button>
            ${S.crane ? `<button class="ct-btn witness" data-a="crane">Call Crane</button>` : ""}${S.ezra && !cards.some(k => k.id === "found:rate") ? `<button class="ct-btn witness" data-a="ezra">Call Ezra</button>` : ""}`}</div>
          <div class="ct-tray"><div class="ct-tabs">${tabs}</div><div class="ct-grid">${grid}</div></div><div class="ct-flash" id="ctFlash"></div>`);
        root.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", () => act(b.dataset.a, b.dataset.v)));
      }
      function flash(txt) { const f = root.querySelector("#ctFlash"); if (!f) return; f.textContent = txt; f.className = "ct-flash on"; setTimeout(() => { f.className = "ct-flash"; }, 900); }
      function resolve(ok, how) { const c = cur(); S.results[S.i] = { id: c.id, ok, how, hinted: S.hint }; S.sel = null;
        if (ok) { sfx("objection"); setTimeout(() => sfx("gavel"), 380); S.feed = { who: how === "crane" ? "crane" : "maud", t: how === "crane" ? esc(c.crane) + "<br><i>" + c.maud + "</i>" : c.maud, cls: "good" }; if (how === "present" && !S.hint && window.Transcript) { try { Transcript.master(c.concept, 28); S.evidenceMade++; } catch (e) {} } }
        else { sfx("wrong"); S.feed = { who: "maud", t: `${c.maud}<div class="ct-note">He wins that one. The line to hold up was ${esc(c.rightLabel)}.</div>`, cls: "bad" }; }
        render(); if (ok) flash("OBJECTION!"); }
      function act(a, v) {
        const c = cur(); if (S.over) return;
        if (a === "tab") { S.tab = v; S.newTab[v] = false; return render(); }
        if (a === "sel") { S.sel = S.sel === v ? null : v; return render(); }
        if (a === "leave") { const b = root.querySelector(".ct-leave"); if (b.dataset.sure) { S.over = true; return done({ left: true, results: S.results, mistakes: S.mistakes }); } b.dataset.sure = 1; b.textContent = "Sure?"; setTimeout(() => { if (b) { b.textContent = "Leave"; delete b.dataset.sure; } }, 3000); return; }
        if (a === "next") { S.i++; S.press = 0; S.wrong = 0; S.hint = false; S.sel = null; S.feed = null; if (S.i >= claims.length) { S.over = true; return done({ results: S.results, mistakes: S.mistakes, evidence: S.evidenceMade }); } return render(); }
        if (a === "press") { if (S.press >= c.press.length) { S.feed = { who: "maud", t: "That's all the court will give on that claim. Look at your cards.", cls: "" }; return render(); }
          const p = c.press[S.press]; S.press++; sfx("page"); S.feed = { who: p.w, t: esc(p.t) }; if (S.press === 1 && c.reveal && !cards.some(k => k.id === c.reveal.id)) { cards.push(Object.assign({}, c.reveal)); S.newTab.found = true; S.feed.t += `<br><b class="ct-new">New evidence: ${esc(c.reveal.label)}</b>`; } if (S.press >= 2) S.hint = true; return render(); }
        if (a === "crane") { S.crane = false; S.hint = true; return resolve(true, "crane"); }
        if (a === "ezra") { S.ezra = false; const rate = (o.facts && o.facts.ratePct != null) ? o.facts.ratePct + "% a week" : "published, and the same for everyone who asks"; cards.push({ id: "found:rate", tab: "found", label: "Ezra's rate", value: "", raw: null, src: `Ezra confirms: ${rate}. He tells everyone before they borrow.` }); S.newTab.found = true; S.feed = { who: "ezra", t: `My rate is ${esc(rate)}. I publish it and I keep to it. Patience has a price; I merely say what it is.<br><b class="ct-new">New evidence: Ezra's rate</b>` }; return render(); }
        if (a === "present") { const k = cards.find(z => z.id === S.sel); if (!k) return; if (c.right(k)) return resolve(true, "present");
          S.wrong++; S.mistakes.push({ claim: c.id, card: k.id }); S.sel = null; sfx("wrong"); S.feed = { who: "maud", t: wrongLine(k, c), cls: "bad" }; if (S.wrong === 1 && !S.hint) { S.hint = true; S.feed.t += `<div class="ct-note">${esc(c.hint)}</div>`; } if (S.wrong >= 3) return resolve(false, "present"); render(); const hb = root.querySelector(".ct-stage"); if (hb && hb.animate) hb.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 220 }); return; }
      }
      render();
    });
  }

  // ---------- after the verdict ----------
  const LETTER9 = "I signed a paper I ought to have shown Maud. It is in the drawer with the seal I could not read. Ask Crane to read it. Ask Ezra whose name stands beneath mine. And please, whatever you do, do not let Ashby thank you for it.";
  async function letterPage(o) {
    if (typeof o.letter === "function") return o.letter();
    await screen(hall(`<div class="ct-stage plain"><div class="ct-letter"><small>Edric's ninth letter</small><h3>The thing I signed</h3><p>${esc(LETTER9)}</p><p class="sig">E.</p></div><div class="ct-actions"><button class="ct-btn gold" data-k="x">Fold the letter</button></div></div>`, "dim"));
  }
  async function endScene(o) {
    const f = o.flags || {}, t = o.trust || {}, vane = f.vane;
    await say("crane", `Item: the drawer. Item: the seal Edric could not read. Item: I can read it now. I have wanted to for a year.${f.craneVane ? " I told you at the well it was not my master's mark." : ""}`, "Go on");
    await say("crane", "It is a note-buyer's mark. Corvin Vane's. He bought the Crown's paper on this farm at forty on the coin, and held it since before Edric died. I carried his first offer to your door. I did not want to. I counted the coins in the envelope twice, and it was too many.", "Go on");
    await say("maud", "Under the seal is Edric's guarantee for Ashby, with Ezra's name beneath his as witness. Ezra is exact, not unkind; he has known since the day.", "Go on");
    if (f.maudConfessed) await say("maud", "I was at the assizes that winter. I have stopped forgiving myself for it, which is not the same as stopping.", "Go on");
    await say("vane", `Heir of Edric. Spring is over and offers do come due. ${vane === "refused" ? "You said no in the square. The offer stands until Midwinter, but I did hope an ordinary day in court might soften you." : vane === "asked" ? "You asked what 'on demand' meant. A court has now told you, rather better than I would have." : vane === "waiting" ? "You took the winter. It is nearly winter." : "I have brought the pen again."} The writ forgiven, the millstream mine, and a mortgage on the whole farm, payable on demand.`, "...");
    const k = await choose("vane", "Demand being, of course, mine. A technicality. Partners trust one another. Well?", ["No. Not on demand.", "Put your terms in writing, with a date.", "I'll take the winter."]);
    const ans = ["refuse", "ask", "wait"][k] || "wait";
    await say("vane", ans === "refuse" ? "How decisive. Edric said no to me once, very kindly. It ended much the same." : ans === "ask" ? "A date. How very Edric. I shall have my clerk draw one, and you shall find it elastic." : "Take the winter. I shall be... around.", "...");
    return ans;
  }
  async function teaser(o, vaneFinal) {
    const f = o.flags || {}, t = o.trust || {}, L = [];
    L.push(vaneFinal === "refuse" ? "You told Vane no to his face. He has stopped smiling at the edges." : vaneFinal === "ask" ? "You asked Vane for his terms in writing. He will send them. They will not be what you asked for." : "You took the winter. Vane will use every day of it.");
    if (t.crane >= 3 || f.craneVane) L.push("Crane is bringing his second ledger. It has been in a drawer since before the Duke's steward learned his name.");
    if (f.guarantee) L.push("Ashby's name and Edric's are on one paper. Summer asks what that paper is worth, and to whom.");
    if (f.hobbExt) L.push("Hobb is still carrying seven days and a favour. Mills turn slowly, but they do turn.");
    if (f.maudConfessed) L.push("Maud has stopped answering your questions with questions. It is more alarming than you expected.");
    if (t.ezra >= 3) L.push("Ezra has begun to write your rate on a card, in his own hand. He does that for people he expects to see again.");
    await screen(hall(`<div class="ct-stage plain"><div class="ct-teaser"><small>Summer · The Trading House</small><h3>To be continued</h3><p class="lede">The spring is closed. The books are good. Midwinter is a long way off, and the farm is not.</p><ul>${L.slice(0, 4).map(l => `<li>${esc(l)}</li>`).join("")}</ul></div><div class="ct-actions"><button class="ct-btn gold" data-k="x">On to Summer</button></div></div>`, "dim"));
  }

  // The game calls Court.run({ G, s, Story, Endings, st, ... }): derive everything the hearing needs from the saved game, and write the result back to it.
  function fromGame(o) {
    const s = o.s, S = window.Spring, st = o.Story && o.Story.state, inv = (s.invoices || []).map(v => ({ who: S.NAMES[v.who] ? S.NAMES[v.who].split(" ")[0] : "", amount: v.amount, due: v.due }));
    return Object.assign({}, o, { statements: o.st || window.Books.close(s), clues: ((st && st.clues) || []).map(c => ({ id: c.id, term: c.term, number: c.num == null || c.num === "" ? null : c.num, source: c.from })), flags: s.flags || {}, trust: s.trust || {}, farm: (st && st.farm) || "Thornfield",
      seed: o.seed != null ? o.seed : hash((st && st.farm || "") + ":" + s.day), facts: { invoices: inv, ratePct: S.terms(s).rateBp / 100, market: S.marketPrice(Math.min(s.day, 28)) },
      letter: o.letter || (st && o.Story.letter ? () => o.Story.letter(8) : null) });
  }
  async function run(o) {
    if (o && o.s && !o.statements) { const g = o, r = await run(fromGame(o)); if (r && g.s) { g.s.exam = { passed: r.passed, score: r.score, attempts: r.attempts, certificate: r.certificate || null }; if (r.flags) Object.assign(g.s.flags, { vaneFinal: r.flags.vaneFinal, examPassed: !!r.passed }); if (g.G && g.G.save) g.G.save(); } return r; }
    o = Object.assign({ flags: {}, trust: {}, farm: "Thornfield" }, o); if (!o.statements) throw new Error("Court.run needs statements (Books.close)");
    mount(); window.__courtCapture = e => e.stopPropagation(); document.addEventListener("keydown", keyGuard, true);
    const total = { mistakes: [], attempts: 0 }; let out = null;
    try {
      await say("maud", "The Crown's advocate will make eight claims about this farm. Press one for detail, present a line from your books or a clue to refute it, and six refuted will satisfy the court.", "Begin");
      for (let attempt = 0; ; attempt++) {
        total.attempts = attempt + 1; const r = await hearing(o, attempt); total.mistakes = total.mistakes.concat(r.mistakes || []);
        if (r.left) { out = { passed: false, left: true, score: r.results.filter(x => x && x.ok).length, mistakes: total.mistakes, attempts: total.attempts }; break; }
        const score = r.results.filter(x => x.ok).length, passed = score >= PASS;
        const rows = r.results.map((x, i) => `<li class="${x.ok ? "ok" : "no"}">${x.ok ? "✔" : "✘"} ${esc(x.id)}</li>`).join("");
        if (!passed) { sfx("gavel"); const k = await screen(hall(`<div class="ct-stage plain"><div class="ct-sum"><h3>The court is not satisfied</h3><p class="big">${score} of ${TOTAL} refuted. ${PASS} are needed.</p><p>Nothing is lost here: the farm's fate is the Crown's verdict, not this hearing. Another sitting means a fresh set of claims about the same books.</p></div><div class="ct-actions"><button class="ct-btn gold" data-k="retry">Another sitting</button><button class="ct-btn" data-k="leave">Leave the hall</button></div></div>`)); if (k === "leave") { out = { passed: false, score, mistakes: total.mistakes, attempts: total.attempts }; break; } continue; }
        sfx("win"); sfx("gavel");
        await screen(hall(`<div class="ct-stage plain"><div class="ct-sum"><h3>Case dismissed</h3><p class="big">${score} of ${TOTAL} refuted</p><ul class="ct-rows">${rows}</ul><p>The Reeve rises. “That is not wrong,” says Maud. It is the highest praise she has.</p></div><div class="ct-actions"><button class="ct-btn gold" data-k="x">Receive the certificate</button></div></div>`, "dim"));
        const cert = { farm: o.farm, title: "The Reeve's Examination, Spring", score, of: TOTAL, date: new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), by: "Maud Fenwick, Reeve" };
        await screen(hall(`<div class="ct-stage plain"><div class="ct-cert" id="ctCert"><small>By the Reeve of Thornfield</small><h3>${esc(cert.title)}</h3><p>This certifies that the keeper of</p><p class="farm">${esc(cert.farm)}</p><p>refuted ${score} of ${TOTAL} claims before the Reeve's Court, using nothing but the farm's own books.</p><p class="sig">${esc(cert.by)} · ${esc(cert.date)}</p></div><div class="ct-actions"><button class="ct-btn gold" data-k="x">Fold it away</button></div></div>`, "dim"));
        await letterPage(o); const vf = await endScene(o); await teaser(o, vf);
        out = { passed: true, score, mistakes: total.mistakes, certificate: cert, attempts: total.attempts, flags: Object.assign({}, o.flags, { vaneFinal: vf, examPassed: true }) }; break;
      }
    } finally { document.removeEventListener("keydown", keyGuard, true); unmount(); }
    return out;
  }
  // the hall is a modal: keep the game's own keys (N, T, E, Esc...) from reaching it
  function keyGuard(e) { if (root && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) { if (e.key !== "Tab" && e.key !== "Enter" && e.key !== " ") e.stopPropagation(); } }

  // ---------- standalone: game.html?court=1 plays a careful season to day 28 and holds the hearing on it ----------
  function demo(q) {
    const S = window.Spring, B = window.Books, Bot = window.Bot, s = S.newGame({ story: false }); for (let d = 1; d <= 28 && !s.outcome; d++) { Bot.careful.day(s); S.sleep(s); }
    const f = { guarantee: true, hobbExt: true, vane: "asked", craneVane: true, ashbyPromise: true, maudConfessed: true }; (q.get("noflags") ? Object.keys(f) : []).forEach(k => delete f[k]);
    const ratePct = S.terms(s).rateBp / 100, inv = s.invoices.map(v => ({ who: S.NAMES[v.who].split(" ")[0], amount: v.amount, due: v.due }));
    const clues = q.get("noclues") ? [] : [{ id: "seal", term: "Second seal on the writ", number: 1, source: "Crane, by the well" }, { id: "ashby", term: "Guarantee for Ashby's bakery", number: null, source: "Ashby, day 21" }, { id: "hobb", term: "Hobb's extension on his invoice", number: s.bal.ar, source: "Hobb, day 14" },
      { id: "vane", term: "Mortgage payable on demand", number: null, source: "Steward Vane, day 24" }, { id: "duke", term: "The Duke's terms: paid after 28 days", number: 28, source: "The Duke's order" }, { id: "edric", term: "Edric's letters: profit every year", number: null, source: "Edric" }];
    const trust = { crane: q.get("crane") != null ? +q.get("crane") : 4, ezra: q.get("ezra") != null ? +q.get("ezra") : 4 };
    return window.Court.run({ statements: B.close(s), clues, flags: f, trust, seed: +(q.get("seed") || 1), farm: q.get("farm") || "Thornfield", test: q.get("test") === "1", facts: { invoices: inv, ratePct, market: S.marketPrice(12) } }).then(r => { window.__courtResult = r; return r; });
  }
  const q0 = new URLSearchParams(location.search);
  if (q0.get("court") === "1") { const go = () => setTimeout(() => demo(q0), 0); if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go(); }
  return { run, build, demo, PASS, TOTAL, BUILDERS };
})();
