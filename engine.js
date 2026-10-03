// Spring at Thornfield — season engine. Pure JS, no DOM: runs in the browser and under node (test-engine.js).
// Built from poc/harvest-engine.js (every action posts; every view derives from the postings), re-parameterized
// to days and upgraded to a true general journal: each posting is a set of debit (+) / credit (-) lines that must
// sum to zero, so Assets = Liabilities + Owner's equity holds after every transaction (curriculum C1.01; the
// double-entry method as in OpenStax *Principles of Accounting* Vol. 1, ch. 3). Subledgers (open invoices, open
// bills, sacks/seed/crops at cost) are kept separately and tested against the ledger accounts every day.
(function (root) {
  const R = {
    days: 28, seedCost: 12, sacksPerPlot: 3, unitCost: 4, growDays: 4, // a plot: 12 of seed -> 3 sacks at 4 each
    upkeep: 45,                 // weekly farmhand wages + upkeep (Operating expense), paid in Cash
    sprinklerSaving: 20, wageFloor: 20, // each placed sprinkler saves the hands 20 a week of hauling water (wages never fall below the floor)
    spotDelta: -2, traderDelta: -1, // the market cart buys surplus for Cash at the going price - 2, the road trader at the going price - 1 (never below cost)
    sprinklerHead: 1,           // a crop planted in sprinkled soil starts this many days along (a shorter cycle, so more harvests)
    sprinklerCost: 80, depPerWeek: 5, // Equipment: 16-week life, straight-line, no salvage (C1.05)
    lateGrace: 3, breachPct: 0.1, // an order more than 3 days late is cancelled, with a forfeit of 10% of its value
    apDefault: 5,               // a bill 5 days overdue: Tomas takes you to the reeve's court
    apDays: 14, discDays: 7, discPct: 0.02, // Tomas's terms: "2/7, net 14" (2% off if paid within 7 days)
    prepayBefore: 21,           // Ezra charges one week's interest on any amount repaid before day 21: the interest he was counting on
    factorRate: 0.85,           // Ezra buys an invoice for 85% of its value today
    // The Duke's one big order (sandbox and story use the same numbers). 132 sacks is more than a careful player can grow and carry unless they borrow and
    // decline other orders; a player who says yes to everything runs out of Cash on a pay-day and is finished. Tuned with the bots in tests/test-crown.js.
    duke: { sacks: 132, price: 10, terms: 28, dueIn: 12 },
    crownDebt: 1250,            // owed to the Crown at Midwinter (the story's goal); a careful season ends close to it, so the last weeks matter
    bridgeMax: 250, rescueRateBp: 200, // Ezra will bridge a small gap at Midwinter; his one emergency loan costs 2 points a week more
    rain: [5, 12, 13, 20, 26],
    // the going price per sack by day (index = day - 1): steady at first, then a glut around days 10-13, a Duke-fuelled rise by day 17, a dip, a late rally
    market: [8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 6, 6, 7, 8, 9, 9, 10, 10, 9, 9, 8, 8, 9, 10, 10, 9, 9, 8],
    premium: { ashby: 0, hobb: 1 }, // what each buyer pays over the going price on a standard offer (the Duke's order is a fixed 10, see OFFERS)
    // overnight events (the night after the day): pigs eat a quarter of the crop in the ground unless the field is fenced, rats
    // take a fifth of the barn, a warm day speeds the crop, a frost stops it. Warned a day ahead (see warning()).
    // customers who pay part up front: [day offered, buyer, sacks, price, days to deliver, deposit share, what they say]
    deposits: [[11, "ashby", 27, 9, 8, 0.5, "My niece is marrying at the end of the week. A feast's worth of bread: 27 sacks. Half now to hold your place, the rest on delivery."],
      [18, "hobb", 24, 10, 8, 0.3, "I'm adding a second wheel. 24 sacks, and a third paid today so you can buy seed. I'll want them on time."]],
    pellDays: [5, 8], pedlarDays: [13, 16], poisonCost: 35, pellSacks: 12, pellShare: 80, // the pig farmer, the rat-poison pedlar, and what Pell's pig sale would give you
    events: { 9: "pigs", 16: "rats", 19: "warm", 23: "frost" }, fenceCost: 20, pigShare: 0.25, ratShare: 0.2,
    field: { x0: 5, y0: 10, w: 9, h: 4 },
  };
  R.pigDay = +Object.keys(R.events).find(d => R.events[d] === "pigs"); // the fence is only worth offering up to the night the pigs come
  const ACCTS = {
    cash: ["Cash", "A"], ar: ["Accounts receivable", "A"], inv: ["Inventory", "A"], equip: ["Equipment", "A"],
    accdep: ["Accumulated depreciation", "A"], ap: ["Accounts payable", "L"], loan: ["Loan payable", "L"], crown: ["Crown debt", "L"],
    capital: ["Owner's equity", "E"], revenue: ["Revenue", "R"], cogs: ["Cost of goods sold", "X"],
    upkeep: ["Wages & upkeep", "X"], depreciation: ["Depreciation", "X"], fines: ["Contract forfeits", "X"], losses: ["Crop & stock losses", "X"], interest: ["Interest expense", "X"],
    factoring: ["Factoring fees", "X"], deposits: ["Customer deposits", "L"],
  };
  const NAMES = { maud: "Maud the reeve", ezra: "Ezra the moneylender", ashby: "Widow Ashby", hobb: "Hobb the Miller", tomas: "Tomas the seed merchant", duke: "Steward Vane",
    crane: "Bailiff Crane", mira: "Mira, a travelling baker", abbey: "Brother Anselm of the Abbey", pell: "Pell the pig farmer", pedlar: "Barnaby the pedlar" };
  // [day offered, buyer, sacks, price per sack, days to pay after delivery, days to deliver]
  // NOTE: the price column is used ONLY for the Duke (a fixed 10, matching the story). Every other buyer's price is R.market + R.premium (see makeOffers); their column value is unused.
  const OFFERS = [
    [1, "ashby", 6, 8, 0, 4], [2, "hobb", 18, 9, 14, 6], [4, "ashby", 9, 8, 0, 4], [6, "hobb", 24, 9, 14, 6],
    [8, "ashby", 9, 8, 0, 4], [10, "duke", R.duke.sacks, R.duke.price, R.duke.terms, R.duke.dueIn], [11, "ashby", 12, 8, 0, 4], [13, "hobb", 27, 9, 14, 6],
    [15, "ashby", 12, 8, 0, 4], [18, "hobb", 30, 9, 14, 6], [19, "ashby", 12, 8, 0, 4], [22, "ashby", 12, 8, 0, 4],
    [23, "hobb", 24, 9, 14, 5], [25, "ashby", 9, 8, 0, 3],
  ];

  const marketPrice = d => R.market[clamp(d, 1, R.days) - 1];
  const spotPrice = d => Math.max(R.unitCost, marketPrice(d) + R.spotDelta), traderPrice = d => Math.max(R.unitCost, marketPrice(d) + R.traderDelta);
  function roll(d, who, salt) { // a stateless 0..1 roll from (day, buyer, salt): same game, same offers, nothing to save
    let h = 2166136261; for (const c of who + ":" + d + ":" + salt) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return (h >>> 0) % 1000 / 1000;
  }

  function newGame(opt) {
    opt = opt || {};
    const s = { day: 1, over: false, outcome: null, nextId: 1, journal: [], bal: {}, log: [], uses: [], story: !!opt.story, rateAdj: 0, rescueAdj: 0,
      trust: { maud: 2, ezra: opt.ezraTrust != null ? opt.ezraTrust : 4, ashby: 4, hobb: 4, tomas: 4, duke: 4, mira: 4, abbey: 4, pell: 4, pedlar: 4 }, pell: null, poison: false, promises: [], quiet: !!opt.story,
      sacks: 15, seeds: 0, fenced: false, rescued: false, seen: {}, notices: {}, flags: {}, scenes: {}, said: {}, heard: {}, clues: 0, sprinklersHeld: 0, plots: [], offers: [], orders: [], invoices: [], bills: [], week: newWeek() };
    Object.keys(ACCTS).forEach(k => s.bal[k] = 0);
    const f = R.field;
    for (let i = 0; i < f.w * f.h; i++) s.plots.push({ i, x: f.x0 + i % f.w, y: f.y0 + Math.floor(i / f.w), tilled: i < f.w, watered: false, crop: null, sprinkler: false });
    [0, 1, 2].forEach(i => s.plots[i].crop = { age: R.growDays, cost: R.seedCost }); // WS3: three plots start ripe, so the player harvests in minute 2
    const cash = 200 + (opt.bonus || 0), inv = s.sacks * R.unitCost + 3 * R.seedCost, loan = 100;
    const crown = R.crownDebt;
    post(s, "open", "Opening balances: the estate as Uncle Edric left it", { cash, inv, loan: -loan, crown: -crown, capital: -(cash + inv - loan - crown) });
    s.opening = Object.assign({}, s.bal);
    makeOffers(s);
    note(s, "Spring, day 1. Cash " + cash + ", 15 sacks in the barn, Edric's 100 loan from Ezra, and " + R.crownDebt.toLocaleString("en-US") + " owed to the Crown at Midwinter.");
    return s;
  }
  // WS3: a wager with Maud. The stake is real Cash, posted as an Operating expense (so the books still tie); a win pays the stake back twice over.
  function wager(s, stake, memo) { if (!(stake > 0)) return ok(); if (s.bal.cash < stake) return err("Not enough Cash for that stake."); post(s, "wager", `${memo}: stake ${stake} (Operating expense)`, { upkeep: stake, cash: -stake }); return ok(); }
  function wagerWin(s, stake, memo) { if (!(stake > 0)) return ok(); post(s, "wager", `${memo}: won, stake ${stake} back plus ${stake}`, { cash: 2 * stake, upkeep: -2 * stake }); return ok(); }
  function newWeek() { return { revenue: 0, cogs: 0, sacksSold: 0 }; }

  // ---------- the journal ----------
  function post(s, type, memo, lines) {
    let sum = 0; for (const k in lines) { if (!(k in ACCTS)) throw new Error("no account " + k); if (lines[k] !== Math.round(lines[k])) throw new Error("non-integer posting"); sum += lines[k]; }
    if (sum !== 0) throw new Error("unbalanced posting: " + memo);
    for (const k in lines) s.bal[k] += lines[k];
    s.journal.push({ n: s.journal.length + 1, day: s.day, type, memo, lines });
  }
  const note = (s, t) => s.log.unshift({ day: s.day, t });
  const use = (s, id, well) => s.uses.push({ id, day: s.day, well: well !== false });
  const sum = a => a.reduce((x, y) => x + y, 0);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const bump = (s, who, d) => { s.trust[who] = clamp((s.trust[who] == null ? 4 : s.trust[who]) + d, 0, 10); };
  const ok = m => ({ ok: true, msg: m }), err = m => ({ ok: false, msg: m });

  // ---------- derived views ----------
  function balanceSheet(b) { // b = a balance map (s.bal or s.opening)
    const ni = -(b.revenue) - b.cogs - b.upkeep - b.depreciation - b.fines - b.losses - b.interest - b.factoring;
    const assets = b.cash + b.ar + b.inv + b.equip + b.accdep, liab = -b.ap - b.loan - b.crown - b.deposits, equity = -b.capital + ni;
    return { cash: b.cash, ar: b.ar, inv: b.inv, equipNet: b.equip + b.accdep, assets, ap: -b.ap, loan: -b.loan, crown: -b.crown, deposits: -b.deposits, liab, equity, ni,
      currentAssets: b.cash + b.ar + b.inv, currentLiab: -b.ap - b.loan - b.crown - b.deposits };
  }
  function terms(s) { // what Ezra and Tomas offer, from their trust (and, for Ezra, from the forecast you showed him)
    const e = s.trust.ezra, t = s.trust.tomas;
    return { loanLimit: 100 + 50 * e, rateBp: Math.max(50, 350 - 25 * e - (s.rateAdj || 0) + (s.rescueAdj || 0)), apDays: t >= 3 ? R.apDays : 0, apLimit: 60 + 30 * t };
  }
  // Cash forecast: the same night order as sleep() (collections, then week-end wages + interest, then bills due),
  // assuming you do nothing else. extraOut: cash you plan to spend today (e.g. seed for a big order).
  function forecast(s, n, extraOut) {
    const t = terms(s), rows = []; let cash = s.bal.cash - (extraOut || 0);
    for (let d = s.day; d < s.day + n && d <= R.days; d++) {
      const open = cash, cin = sum(s.invoices.filter(v => v.due === d || (d === s.day && v.due < d)).map(v => v.amount));
      const wk = d % 7 === 0 ? wages(s) + Math.round(-s.bal.loan * t.rateBp / 10000) : 0, bills = sum(s.bills.filter(b => b.due === d || (d === s.day && b.due < d)).map(b => b.amount));
      const fines = sum(openOrders(s).filter(o => Math.max(s.day, o.due + R.lateGrace + 1) === d).map(o => Math.round(o.value * R.breachPct))); // undelivered orders forfeit
      cash = open + cin - wk - bills - fines; rows.push({ day: d, open, cin, wages: wk, bills, fines, cout: wk + bills + fines, close: cash });
    }
    return rows;
  }
  const wages = s => Math.max(R.wageFloor, R.upkeep - R.sprinklerSaving * s.plots.filter(p => p.sprinkler).length); // a sprinkler only saves labour once it's in the field
  const rain = d => R.rain.indexOf(d) >= 0;
  const inGround = s => s.plots.filter(p => p.crop);
  const sacksComing = s => inGround(s).length * R.sacksPerPlot;
  const openOrders = s => s.orders.filter(o => o.status === "open");
  const committed = s => sum(openOrders(s).map(o => o.sacks));
  const billsDue = (s, byDay) => sum(s.bills.filter(b => b.due <= byDay).map(b => b.amount));
  function weekBills(s) { const t = terms(s); return wages(s) + Math.round(-s.bal.loan * t.rateBp / 10000); }
  const nextWeekEnd = s => Math.ceil(s.day / 7) * 7;
  function neighbours(s, p) { return s.plots.filter(q => q !== p && Math.abs(q.x - p.x) <= 1 && Math.abs(q.y - p.y) <= 1); }
  const sprinkled = (s, p) => neighbours(s, p).some(q => q.sprinkler);
  function stage(s, p) { if (!p.crop) return -1; return p.crop.age >= R.growDays ? 4 : p.crop.age; }

  // ---------- farm actions ----------
  function act(s, i) { // the E key on a field tile: till -> plant -> water -> harvest
    const p = s.plots[i]; if (!p || s.over) return err("");
    if (p.sprinkler) { p.sprinkler = false; s.sprinklersHeld++; return ok("pickup"); } // moving it is free: pick up, then place on another empty tilled plot
    if (!p.tilled) { p.tilled = true; return ok("till"); }
    if (!p.crop) {
      if (s.sprinklersHeld > 0) return placeSprinkler(s, i);
      if (s.seeds <= 0) return err("No seed. Tomas sells it in town.");
      s.seeds--; p.crop = { age: sprinkled(s, p) ? R.sprinklerHead : 0, cost: R.seedCost }; p.watered = rain(s.day) || p.watered; return ok("plant");
    }
    if (stage(s, p) === 4) { s.sacks += R.sacksPerPlot; p.crop = null; p.watered = false; use(s, "inventory"); return ok("harvest"); }
    if (!p.watered && !rain(s.day)) { p.watered = true; return ok("water"); }
    return err(rain(s.day) ? "The rain is watering it." : "Watered. It grows overnight.");
  }
  function placeSprinkler(s, i) { const p = s.plots[i]; if (p.crop || p.sprinkler || s.sprinklersHeld <= 0) return err("Can't place it there."); p.sprinkler = true; s.sprinklersHeld--; return ok("sprinkler"); }

  // ---------- town actions ----------
  function accept(s, id) {
    const k = s.offers.findIndex(o => o.id === id); if (k < 0) return err("That offer is gone.");
    const o = s.offers.splice(k, 1)[0]; s.orders.push(Object.assign(o, { status: "open", late: false }));
    if (o.who === "pell") { s.pell = "deal"; if (o.share) s.promises.push({ who: "pell", amount: R.pellShare, text: `A quarter of Pell's pig sale at Midwinter, about ${R.pellShare}`, day: s.day }); }
    if (o.who === "duke") { use(s, "wc", false); use(s, "overtrading", false); } // felt: growth that must be funded now and paid later
    if (o.deposit) { o.paid = Math.round(o.value * o.deposit); post(s, "deposit", `${NAMES[o.who]} paid a ${o.paid} deposit on ${o.sacks} sacks (not Revenue yet: we still owe the grain)`, { cash: o.paid, deposits: -o.paid }); use(s, "accrual"); }
    note(s, `Agreed: ${o.sacks} sacks to ${NAMES[o.who]} at ${o.price}, due day ${o.due}, ${o.terms ? "paid " + o.terms + " days after delivery" : "Cash on delivery"}.`);
    return ok();
  }
  function decline(s, id) { s.offers = s.offers.filter(o => o.id !== id); return ok(); }
  function addOffer(s, who, sacks, price, tdays, dueIn, expiresIn) { // the story places its own offers
    const o = { id: s.nextId++, who, sacks, price, terms: tdays, due: Math.min(R.days, s.day + dueIn), expires: s.day + (expiresIn || 2), value: sacks * price };
    s.offers.push(o); return o;
  }
  function setPrice(s, id, price) { const o = s.offers.find(x => x.id === id); if (!o) return err("That offer is gone."); o.price = price; o.value = o.sacks * price; return ok(); }
  function factor(s, id) { // sell an invoice to Ezra: 85% in Cash today, the rest is a Factoring fee
    const v = s.invoices.find(x => x.id === id); if (!v) return err("No such invoice.");
    const got = Math.round(v.amount * R.factorRate), fee = v.amount - got;
    post(s, "factor", `Sold ${NAMES[v.who]}'s invoice of ${v.amount} to Ezra for ${got}`, { cash: got, factoring: fee, ar: -v.amount });
    s.invoices = s.invoices.filter(x => x !== v); note(s, `Factored ${NAMES[v.who]}'s invoice: ${got} today, ${fee} fee.`); return ok();
  }
  function deliver(s, id) {
    const o = s.orders.find(x => x.id === id && x.status === "open"); if (!o) return err("No such order.");
    if (s.sacks < o.sacks) return err(`Need ${o.sacks} sacks; the barn has ${s.sacks}.`);
    const v = o.sacks * o.price, c = o.sacks * R.unitCost;
    s.sacks -= o.sacks; o.status = "delivered"; o.deliveredDay = s.day;
    const dep = o.paid || 0; // a deposit already taken is a liability; delivering the grain turns it into Revenue
    if (o.terms) { const inv = { id: s.nextId++, who: o.who, amount: v - dep, due: s.day + o.terms }; s.invoices.push(inv);
      post(s, "sale", `Sold ${o.sacks} sacks to ${NAMES[o.who]} on ${o.terms}-day terms (invoice due day ${inv.due})${dep ? `, ${dep} already paid as a deposit` : ""}`, { ar: v - dep, deposits: dep, revenue: -v }); use(s, "accrual"); }
    else post(s, "sale", `Sold ${o.sacks} sacks to ${NAMES[o.who]}${dep ? ` for the ${v - dep} still owed (${dep} was paid as a deposit)` : " for Cash"}`, { cash: v - dep, deposits: dep, revenue: -v });
    post(s, "cogs", `Cost of the ${o.sacks} sacks sold`, { cogs: c, inv: -c });
    s.week.revenue += v; s.week.cogs += c; s.week.sacksSold += o.sacks;
    const onTime = s.day <= o.due;
    bump(s, o.who, onTime ? 1 : 0); use(s, "gross"); use(s, "margin");
    note(s, `Delivered ${o.sacks} sacks to ${NAMES[o.who]}${onTime ? "" : " (late)"}: Revenue ${v}, Cost of goods sold ${c}.`);
    return ok();
  }
  function sellSpot(s, n, price) {
    n = Math.min(n, s.sacks); if (n <= 0) return err("Nothing to sell.");
    const v = n * (price || spotPrice(s.day)), c = n * R.unitCost; s.sacks -= n;
    post(s, "sale", `Sold ${n} surplus sacks to the market cart for Cash`, { cash: v, revenue: -v });
    post(s, "cogs", `Cost of the ${n} sacks sold`, { cogs: c, inv: -c });
    s.week.revenue += v; s.week.cogs += c; s.week.sacksSold += n; return ok();
  }
  function buySeeds(s, n, onAccount) {
    const cost = n * R.seedCost, t = terms(s);
    if (onAccount) {
      if (!t.apDays) return err("Tomas wants Cash now: you've paid him late.");
      const owed = -s.bal.ap; if (owed + cost > t.apLimit) return err(`Tomas's limit is ${t.apLimit}; you owe him ${owed}.`);
      const b = { id: s.nextId++, amount: cost, due: s.day + t.apDays, discBy: s.day + R.discDays, disc: Math.round(cost * R.discPct), late: false }; s.bills.push(b);
      post(s, "seed", `Bought ${n} seed packets from Tomas on account (bill due day ${b.due}; 2% off if paid by day ${b.discBy})`, { inv: cost, ap: -cost }); use(s, "equation");
    } else {
      if (s.bal.cash < cost) return err(`That's ${cost}; Cash is ${s.bal.cash}.`);
      post(s, "seed", `Bought ${n} seed packets from Tomas for Cash`, { inv: cost, cash: -cost });
    }
    s.seeds += n; return ok();
  }
  const discNow = (s, b) => (!b.late && b.discBy != null && s.day <= b.discBy) ? b.disc : 0;
  function payBills(s) { // paying Tomas yourself: inside the 7-day window you get the 2% discount
    const open = s.bills.slice(); if (!open.length) return err("You owe Tomas nothing.");
    const amt = sum(open.map(b => b.amount - discNow(s, b))); if (s.bal.cash < amt) return err(`You owe ${amt}; Cash is ${s.bal.cash}.`);
    open.forEach(b => payBill(s, b, true)); return ok();
  }
  function payBill(s, b, early) {
    const d = early ? discNow(s, b) : 0; // a purchase discount: booked against Cost of goods sold (inventory stays at standard cost)
    if (d) post(s, "payap", `Paid Tomas's bill of ${b.amount} early: ${d} discount`, { ap: b.amount, cash: -(b.amount - d), cogs: -d });
    else post(s, "payap", `Paid Tomas's bill of ${b.amount}`, { ap: b.amount, cash: -b.amount });
    s.bills = s.bills.filter(x => x !== b);
    if (!b.late) { bump(s, "tomas", 1); use(s, "ap"); }
  }
  function buySprinkler(s) {
    if (s.bal.cash < R.sprinklerCost) return err(`A sprinkler costs ${R.sprinklerCost}; Cash is ${s.bal.cash}.`);
    post(s, "equip", "Bought a sprinkler (Equipment, 16-week life)", { equip: R.sprinklerCost, cash: -R.sprinklerCost });
    s.sprinklersHeld++; note(s, "Bought a sprinkler. Place it on an empty tilled plot; click it again to move it."); return ok();
  }
  // Is a sprinkler worth it? The same weighing a business makes for any machine: money now, savings later, wear in between.
  function sprinklerFacts(s) {
    const weeks = Math.floor(R.days / 7) - Math.floor((s.day - 1) / 7), saved = R.sprinklerSaving * weeks, dep = R.depPerWeek * weeks;
    return { weeks, saved, dep, profit: saved - dep, cash: saved - R.sprinklerCost, paybackWeeks: Math.ceil(R.sprinklerCost / R.sprinklerSaving), life: R.sprinklerCost / R.depPerWeek };
  }
  // The Crown's 1,000 is due at Midwinter, long after this spring. "If Midwinter were tomorrow": what you could pay it with, and
  // what you'd be counting on. Promises (Pell's pig share) are shown apart: they are hoped for, not owned.
  function crownFund(s) {
    const b = balanceSheet(s.bal), hoped = sum((s.promises || []).map(p => p.amount));
    const have = [["Cash", b.cash], ["Accounts receivable (if every customer pays)", b.ar], ["Inventory (at cost)", b.inv]], owe = [["Accounts payable", b.ap], ["Loan payable", b.loan], ["Customer deposits (grain still owed)", b.deposits]];
    const net = sum(have.map(r => r[1])) - sum(owe.map(r => r[1])), gap = net - R.crownDebt;
    return { have, owe, net, hoped, crown: R.crownDebt, gap, verdict: gap >= 0 ? "paid" : gap + hoped >= 0 ? "promise" : gap >= -R.bridgeMax ? "bridge" : "short", bridge: gap < 0 ? Math.round(-gap * terms(s).rateBp / 10000) : 0 };
  }
  function borrow(s, amt) {
    const t = terms(s), room = t.loanLimit + s.bal.loan; // bal.loan is negative
    if (amt > room) return err(`Ezra's limit is ${t.loanLimit}; you owe ${-s.bal.loan}.`);
    post(s, "borrow", `Borrowed ${amt} from Ezra at ${t.rateBp / 100}% a week`, { cash: amt, loan: -amt }); use(s, "equation"); note(s, `Borrowed ${amt}: that is ${Math.round(amt * t.rateBp / 10000)} more interest every pay-day until you repay it.`); return ok();
  }
  // The weighing behind every repayment: interest you'd stop paying, the early-repayment fee, and how thin Cash gets afterwards.
  function loanFacts(s, amt) {
    amt = Math.min(amt, -s.bal.loan); const t = terms(s), weekly = Math.round(amt * t.rateBp / 10000), paydays = Math.floor(R.days / 7) - Math.floor((s.day - 1) / 7);
    const fee = s.day < R.prepayBefore ? weekly : 0, saved = weekly * paydays, rows = forecast(s, 14, amt + fee);
    return { amt, rateBp: t.rateBp, weekly, paydays, fee, saved, net: saved - fee, low: rows.length ? Math.min(...rows.map(r => r.close)) : s.bal.cash - amt - fee };
  }
  function repay(s, amt) {
    amt = Math.min(amt, -s.bal.loan); if (amt <= 0) return err("You owe Ezra nothing.");
    const f = loanFacts(s, amt); if (s.bal.cash < amt + f.fee) return err(`Cash is ${s.bal.cash}${f.fee ? `; repaying ${amt} early also costs a ${f.fee} fee` : ""}.`);
    post(s, "repay", `Repaid ${amt} of the loan to Ezra`, { loan: amt, cash: -amt });
    if (f.fee) { post(s, "interest", `Early-repayment fee: one week's interest on the ${amt} repaid before day ${R.prepayBefore}`, { interest: f.fee, cash: -f.fee }); note(s, `Ezra took a ${f.fee} fee for repaying ${amt} early.`); }
    use(s, "tvm"); return ok();
  }

  // ---------- the night: sleeping ends the day ----------
  function sleep(s) {
    if (s.over) return err("The season is closed.");
    const d = s.day;
    const ev = R.events[d];
    if (s.boost === d) s.plots.forEach(p => { if (p.crop && p.crop.age < R.growDays) p.crop.age++; });
    const grown = []; s.plots.forEach(p => { if (p.crop && ev !== "frost" && (p.watered || rain(d) || sprinkled(s, p)) && p.crop.age < R.growDays) { p.crop.age++; grown.push(p); } p.watered = false; });
    if (ev) overnight(s, ev);
    s.invoices.filter(v => v.due <= d).forEach(v => { post(s, "collect", `${NAMES[v.who]} paid invoice of ${v.amount}`, { cash: v.amount, ar: -v.amount }); use(s, "ar"); note(s, `${NAMES[v.who]} paid ${v.amount}.`); });
    s.invoices = s.invoices.filter(v => v.due > d);
    if (d % 7 === 0) {
      const t = terms(s), interest = Math.round(-s.bal.loan * t.rateBp / 10000);
      // WS3 (story games): the first wages day Cash cannot cover, the farmhand walks off for the week instead of Ezra rescuing you: no wages are owed,
      // but crops that grew by hand-watering tonight lose that day, and Maud trusts you a little less. Skipped when Cash cannot even cover the interest.
      const walkOff = s.story && !s.walkedOff && s.bal.cash < wages(s) + interest && s.bal.cash >= interest;
      if (walkOff) { s.walkedOff = d; s.walkedWages = wages(s); grown.filter(p => !sprinkled(s, p) && !rain(d)).forEach(p => p.crop.age--); bump(s, "maud", -1); note(s, `Cash ${s.bal.cash} couldn't cover ${wages(s)} in wages. Jory walked off for the week, and the crops weren't watered tonight.`); }
      else {
        if (s.bal.cash < wages(s) + interest) rescue(s, wages(s) + interest - s.bal.cash);
        if (s.bal.cash < wages(s) + interest) return insolvent(s, `Cash ${s.bal.cash} can't cover ${wages(s) + interest} of wages and interest. The hands walk off.`);
        post(s, "upkeep", `Week ${d / 7} wages & upkeep`, { upkeep: wages(s), cash: -wages(s) });
      }
      if (interest) { post(s, "interest", `Week ${d / 7} interest on Ezra's loan`, { interest, cash: -interest }); use(s, "tvm"); }
      if (s.bal.equip + s.bal.accdep > 0) { const dep = Math.min(R.depPerWeek * Math.round(s.bal.equip / R.sprinklerCost), s.bal.equip + s.bal.accdep); post(s, "dep", "Depreciation on the sprinkler", { depreciation: dep, accdep: -dep }); use(s, "depreciation"); }
      const gp = s.week.revenue - s.week.cogs;
      if (gp >= wages(s)) use(s, "breakeven"); if (gp - wages(s) - interest > 0) use(s, "operating");
      if (s.bal.ar > 0) use(s, "wc");
      if (s.bal.ar > s.bal.cash) use(s, "overtrading"); // used well: got through a pay-day with more tied up in receivables than in Cash
      s.week = newWeek();
    }
    for (const b of s.bills.filter(b => b.due <= d)) {
      if (s.bal.cash >= b.amount) payBill(s, b);
      else {
        if (!b.late) { b.late = true; bump(s, "tomas", -2); bump(s, "ezra", -1); note(s, `Couldn't pay Tomas's bill of ${b.amount}. He's telling people.`); }
        if (d - b.due >= R.apDefault) return insolvent(s, `Tomas's bill of ${b.amount} is ${d - b.due} days overdue. He takes you to the reeve's court.`);
      }
    }
    for (const o of openOrders(s)) {
      if (d > o.due + R.lateGrace) { // breach of contract: cancelled, trust lost, a forfeit of 10% of the order (C2.09's overtrading trap)
        o.status = "cancelled"; bump(s, o.who, -2); if (o.who === "duke") bump(s, "ezra", -1);
        const fine = Math.round(o.value * R.breachPct);
        if (s.bal.cash < fine) rescue(s, fine - s.bal.cash);
        if (s.bal.cash < fine) return insolvent(s, `${NAMES[o.who]} sues for the ${fine} forfeit on the broken order, and Cash is ${s.bal.cash}.`);
        const refund = o.paid || 0; if (s.bal.cash < fine + refund) rescue(s, fine + refund - s.bal.cash);
        if (s.bal.cash < fine + refund) return insolvent(s, `${NAMES[o.who]} wants the ${refund} deposit back plus a ${fine} forfeit, and Cash is ${s.bal.cash}.`);
        if (refund) post(s, "refund", `Refunded ${NAMES[o.who]}'s ${refund} deposit: the grain never came`, { deposits: refund, cash: -refund });
        post(s, "fine", `Forfeit to ${NAMES[o.who]}: order cancelled, ${o.sacks} sacks never came`, { fines: fine, cash: -fine });
        note(s, `${NAMES[o.who]} cancelled the order and took a ${fine} forfeit.`);
      } else if (d >= o.due && !o.late) { o.late = true; bump(s, o.who, -1); note(s, `${NAMES[o.who]}'s order is due today and not delivered: late from tomorrow.`); }
    }
    s.offers = s.offers.filter(o => o.expires > d);
    if (d >= R.days) { s.over = true; s.outcome = "closed"; note(s, "The last night of spring. Time to close the books."); return ok(); }
    s.day++; makeOffers(s); specialOffers(s);
    return ok();
  }
  // a loss is written off the books the night it happens: Inventory down, Crop & stock losses up (an expense that cuts net income)
  function writeOff(s, what, cost) { post(s, "loss", what, { losses: cost, inv: -cost }); use(s, "inventory"); }
  function overnight(s, ev) {
    if (ev === "pigs") {
      const crops = s.plots.filter(p => p.crop).sort((a, b) => b.crop.age - a.crop.age || a.i - b.i), n = Math.ceil(crops.length * R.pigShare);
      const kept = s.orders.some(o => o.who === "pell" && o.status !== "cancelled");
      if (s.fenced) note(s, "Pigs rooted at the fence all night and went home hungry. The fence paid for itself.");
      else if (kept) note(s, "Pell's pigs stayed in their pen. He remembers who helped him when he was short.");
      else if (n > 0) { const lost = crops.slice(0, n); const cost = sum(lost.map(p => p.crop.cost)); lost.forEach(p => p.crop = null);
        writeOff(s, `Pigs ate ${n} of ${crops.length} plots in the ground (written off at cost)`, cost); if (s.pell === "refused") bump(s, "pell", -2); note(s, `${s.pell === "refused" ? "Pell's pigs, the ones you wouldn't feed: " : ""}Pigs got in and ate ${n} of your ${crops.length} growing plots: ${cost} of Inventory written off as a loss.`); }
    } else if (ev === "rats") {
      const k = Math.min(s.sacks, Math.max(1, Math.floor(s.sacks * R.ratShare)));
      if (s.poison) note(s, "The rats took the poisoned bait and the barn stayed clean. Barnaby's price stung, but the sacks are safe.");
      else if (s.sacks > 0) { s.sacks -= k; writeOff(s, `Rats spoiled ${k} sacks in the barn (written off at cost)`, k * R.unitCost); note(s, `Rats got into the barn: ${k} sacks spoiled, ${k * R.unitCost} of Inventory written off. Sacks you ship don't rot.`); }
    } else if (ev === "warm") {
      s.plots.forEach(p => { if (p.crop && p.crop.age < R.growDays) p.crop.age++; }); note(s, "A warm, bright day: everything in the ground grew an extra day.");
    } else if (ev === "frost") note(s, "A hard frost last night: nothing grew. Deliveries that counted on tomorrow's crop slip a day.");
  }
  // what Maud can see coming: the day before and the day of, so a prepared player can act
  function warning(s) {
    const ev = R.events[s.day] || R.events[s.day + 1], when = R.events[s.day] ? "tonight" : "tomorrow night";
    if (s.day >= R.pellDays[0] && s.day <= R.pellDays[1] && !s.pell) return "Pell the pig farmer is waiting by the mill with a favour to ask. What a farmer says yes to, and what he says no to, comes back around.";
    if (s.day >= R.pedlarDays[0] && s.day <= R.pedlarDays[1] && !s.poison) return `Barnaby the pedlar is on the road with rat poison. Rats are due soon; weigh what he charges against what a quarter of your barn is worth.`;
    const spared = s.fenced || s.orders.some(o => o.who === "pell" && o.status !== "cancelled");
    if (ev === "pigs" && !spared) return `Pell's pigs have broken loose and are heading for the fields ${when}. A fence from Tomas costs ${R.fenceCost}; pigs would eat about a quarter of what's growing.`;
    if (ev === "rats" && !s.poison) return `Rats are in the village ${when}. Stock in the barn is Inventory you can lose; sacks you've shipped are safe.`;
    if (ev === "frost") return `A frost is coming ${when}: nothing will grow that night. Check your delivery dates.`;
    return null;
  }
  function refusePell(s) { s.pell = "refused"; bump(s, "pell", -1); note(s, "You turned Pell away. He walked off muttering about his pigs."); return ok(); }
  // Barnaby's rat poison: expensive, but compare it with what the rats would take from the barn as it stands today
  const ratLoss = s => Math.min(s.sacks, Math.max(1, Math.floor(s.sacks * R.ratShare))) * R.unitCost;
  function buyPoison(s, price) {
    if (s.poison) return err("The barn is already baited."); if (s.bal.cash < price) return err(`The poison is ${price}; Cash is ${s.bal.cash}.`);
    post(s, "poison", `Rat poison from Barnaby (Operating expense: wages & upkeep)`, { upkeep: price, cash: -price }); s.poison = true;
    note(s, `Bought rat poison for ${price}. If the rats come, they'll eat it instead of your grain.`); return ok();
  }
  function buyFence(s) {
    if (s.fenced) return err("The field is already fenced."); if (s.bal.cash < R.fenceCost) return err(`A fence costs ${R.fenceCost}; Cash is ${s.bal.cash}.`);
    post(s, "fence", `Fence for the field (Operating expense: wages & upkeep)`, { upkeep: R.fenceCost, cash: -R.fenceCost }); s.fenced = true;
    note(s, "Tomas's men fenced the field."); return ok();
  }
  // Ezra's emergency loan: once per season, just enough Cash to get through a payday you can't cover, at a rate that teaches what desperation costs.
  function rescue(s, need) {
    if (s.rescued) return false; const amt = Math.ceil(need / 10) * 10 + 10;
    s.rescued = true; s.rescueAdj = R.rescueRateBp; // separate from rateAdj, which the story's forecast lesson overwrites
    bump(s, "ezra", -2);
    post(s, "borrow", `Ezra's emergency loan of ${amt}: you couldn't cover a payment (his rate is now ${terms(s).rateBp / 100}% a week)`, { cash: amt, loan: -amt });
    use(s, "insolvency", false); note(s, `Cash ran out. Ezra lent ${amt} on the spot, but he now charges ${terms(s).rateBp / 100}% a week, and he won't do it twice.`); return true;
  }
  // What the books WOULD record, without recording it: run the action on a copy and diff. Teaching tool: see the entry before you commit.
  function preview(s, fn) {
    const c = JSON.parse(JSON.stringify(s)), n0 = c.journal.length, b0 = balanceSheet(c.bal), r = fn(c), b1 = balanceSheet(c.bal), entries = c.journal.slice(n0);
    return { ok: !!(r && r.ok), msg: r && r.msg, entries, cash: [b0.cash, b1.cash], dNet: b1.ni - b0.ni, dAssets: b1.assets - b0.assets, dLiab: b1.liab - b0.liab, dEquity: b1.equity - b0.equity,
      moved: sum(entries.map(e => Math.abs(e.lines.cash || 0))) };
  }
  // The village notice board: the going price for the next few days, plus one small decision on some days.
  const NOTICE_DAYS = { 2: "tinker", 6: "trader", 12: "hands" };
  function marketOutlook(s) { return [1, 2, 3].filter(k => s.day + k <= R.days).map(k => ({ day: s.day + k, price: marketPrice(s.day + k) })); }
  function notice(s) {
    const id = NOTICE_DAYS[s.day]; if (!id || s.notices[s.day] != null) return null;
    return { id, ...{
      tinker: { title: "A tinker's cart of seed", text: "A tinker is selling 6 packets of seed for 60: ten a packet, cheaper than Tomas. He won't let you open them first, though. Or he'll let you inspect them for a fee of 5.", options: ["Buy all 6 unseen (60)", "Pay 5 to inspect first", "Walk past"] },
      trader: { title: "A grain trader on the road", text: `A trader will buy up to 9 spare sacks today for ${traderPrice(s.day)} each, Cash (the going price is ${marketPrice(s.day)}). Sacks you sell now can't fill tomorrow's orders.`, options: ["Sell what I can spare (up to 9)", "Keep my grain"] },
      hands: { title: "Hands for hire", text: "Day-labourers will weed and water every crop in the ground tonight for 25 Cash: everything growing gains a day.", options: ["Hire them (25)", "No, thanks"] } }[id] };
  }
  function answerNotice(s, i) {
    const n = notice(s); if (!n) return err("Nothing to answer."); s.notices[s.day] = i;
    if (n.id === "tinker") {
      if (i === 0) { if (s.bal.cash < 60) { s.notices[s.day] = null; return err(`That's 60; Cash is ${s.bal.cash}.`); } post(s, "seed", "Bought 6 packets of seed from a tinker for Cash (60 for 72 of standard cost: the 12 saved is a purchase discount)", { inv: 72, cash: -60, cogs: -12 }); s.seeds += 6;
        const bad = 2; s.seeds -= bad; writeOff(s, `${bad} of the tinker's 6 packets were mouldy (written off at their standard cost of 12)`, 24); note(s, "Two of the tinker's six packets were mouldy. You paid 60 for 4 good ones: 15 a packet, more than Tomas charges."); return ok("blind"); }
      if (i === 1) { if (s.bal.cash < 45) { s.notices[s.day] = null; return err(`Inspection (5) plus the 4 good packets (40) is 45; Cash is ${s.bal.cash}.`); } post(s, "upkeep", "Paid the tinker 5 to inspect his seed (Operating expense)", { upkeep: 5, cash: -5 });
        post(s, "seed", "Bought the 4 good packets of seed from the tinker for Cash (40 for 48 of standard cost)", { inv: 48, cash: -40, cogs: -8 }); s.seeds += 4; note(s, "Inspected: two packets were mouldy. You bought the 4 good ones for 40, 11.25 a packet including the fee."); return ok("inspected"); }
      return ok("pass");
    }
    if (n.id === "trader") { if (i !== 0) return ok("pass"); const k = Math.min(9, s.sacks); if (k <= 0) { s.notices[s.day] = null; return err("The barn is empty."); } sellSpot(s, k, traderPrice(s.day)); note(s, `Sold ${k} sacks to the trader at ${traderPrice(s.day)}.`); return ok("sold"); }
    if (n.id === "hands") { if (i !== 0) return ok("pass"); if (s.bal.cash < 25) { s.notices[s.day] = null; return err(`That's 25; Cash is ${s.bal.cash}.`); } post(s, "upkeep", "Day-labourers weeded and watered every crop (Operating expense)", { upkeep: 25, cash: -25 }); s.boost = s.day; note(s, "The labourers will be at the crops tonight."); return ok("hired"); }
    return err("");
  }
  function insolvent(s, why) { s.over = true; s.outcome = "insolvent"; s.why = why; use(s, "insolvency", false); use(s, "overtrading", false); note(s, why); return ok(); }
  function specialOffers(s) { // the deposit customers: cash now, grain later
    if (s.quiet) return;
    R.deposits.filter(r => r[0] === s.day).forEach(([d, who, sacks, price, dueIn, share, say]) =>
      s.offers.push({ id: s.nextId++, who, sacks, price, terms: 0, due: Math.min(R.days, d + dueIn), expires: d + 3, value: sacks * price, deposit: share, say, reserve: price + 1 }));
  }
  function makeOffers(s) {
    if (s.quiet) return; // the story's first lessons run without stray orders
    OFFERS.filter(o => o[0] === s.day && !(s.story && o[1] === "duke")).forEach(([d, who, base, fixed, tdays, dueIn]) => {
      let sacks = who === "duke" ? base : Math.max(3, Math.round(base * (0.6 + s.trust[who] / 10) / 3) * 3);
      let price = who === "duke" ? fixed : marketPrice(d) + (R.premium[who] || 0), due = dueIn, /* the Duke's one big order is a fixed 10, as the story tells it; everyone else follows the market */ terms = tdays, tag = "";
      if (who !== "duke") { // buyers differ day to day: a rush, a bigger order on longer terms, a small one on short terms
        const r = roll(d, who, 1), rescale = k => Math.max(3, Math.round(sacks * k / 3) * 3);
        if (who === "ashby") { if (r >= .8 && d <= 20) { terms = 7; price += 1; tag = "pays in a week"; } else if (r >= .55) { sacks = rescale(.75); due = 2; price += 1; tag = "rush"; } }
        else if (r >= .75) { sacks = rescale(.75); terms = 7; price -= 1; tag = "small, pays in a week"; } else if (r >= .5 && d >= 6) { sacks = rescale(1.25); price += 1; tag = "big order"; }
      }
      const offer = { id: s.nextId++, who, sacks, price, terms, due: Math.min(R.days, d + due), expires: d + 2, value: sacks * price, tag };
      if (who !== "duke") offer.reserve = price + 1 + (roll(d, who, 2) >= .5 ? 1 : 0); // the most they'll really pay: 1-2 over the first price
      s.offers.push(offer);
    });
  }

  // ---------- Maud: one line, real terms; quiet after calm stretches unless there's real danger ----------
  function coach(s) {
    const cash = s.bal.cash, wk = nextWeekEnd(s), due = weekBills(s) + billsDue(s, wk);
    const collect = sum(s.invoices.filter(v => v.due <= wk).map(v => v.amount));
    const short = committed(s) - s.sacks - sacksComing(s);
    if (cash + collect < due) return { danger: true, text: `Cash ${cash}, and ${due} of wages, interest and Accounts payable fall due by day ${wk}. Ezra lends; the market cart buys surplus.` };
    const late = s.bills.find(b => b.late); if (late) return { danger: true, text: `Tomas's bill of ${late.amount} is overdue. Five days and he goes to the court.` };
    const w = warning(s); if (w) return { danger: true, text: w }; // danger: true so the story's quiet stretches still show it
    const frost = Object.keys(R.events).map(Number).find(d => R.events[d] === "frost" && d >= s.day && d <= s.day + 4);
    if (frost && short + 3 > 0 && openOrders(s).some(o => o.due >= frost && o.due <= frost + 2)) return { danger: true, text: `Frost on day ${frost}: nothing grows that night, and an order is due day ${openOrders(s).find(o => o.due >= frost && o.due <= frost + 2).due}. Be sure the sacks are in the barn before the frost, not in the field.` };
    if (short > 0) return { danger: short > 20, text: `Open orders need ${committed(s)} sacks; Inventory plus the field makes ${s.sacks + sacksComing(s)}. Plant ${Math.ceil(short / 3)} more plots.` };
    if (s.offers.some(o => o.who === "duke")) return { danger: false, text: `The Duke pays ${R.duke.terms} days after delivery. Seed and wages are paid now: can Cash wait that long?` };
    if (s.bal.ar > 2 * cash && cash < 150) return { danger: false, text: `Accounts receivable ${s.bal.ar}, Cash ${cash}. Revenue isn't Cash until the invoice is paid.` };
    if (s.day === 1) return { danger: false, text: `E to till, plant and water. Ashby pays Cash on delivery; Hobb pays 14 days after.` };
    return null;
  }

  root.Spring = { R, marketPrice, spotPrice, traderPrice, ACCTS, NAMES, OFFERS, newGame, post, balanceSheet, terms, rain, stage, sprinkled, committed, sacksComing, openOrders,
    weekBills, billsDue, nextWeekEnd, forecast, discNow, addOffer, setPrice, factor, act, accept, decline, deliver, sellSpot, buySeeds, payBills, buySprinkler, wager, wagerWin, sprinklerFacts, buyFence, crownFund, preview, notice, answerNotice, marketOutlook, rescue, refusePell, buyPoison, ratLoss, warning, borrow, repay, loanFacts, sleep, coach };
  if (typeof module !== "undefined") module.exports = root.Spring;
})(typeof window !== "undefined" ? window : globalThis);
