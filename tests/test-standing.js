// Standing orders: deterministic, 1-2 a day, a mix of good and trap orders, the verdict names what is wrong, and taking the good ones keeps the books whole. Run: node tests/test-standing.js
global.window = global; const S = require("../engine.js"), B = require("../books.js"); global.Spring = S; global.Books = B; const Bot = require("../bot.js"); require("../standing.js"); const St = window.Standing;
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
// deterministic, 1-2 a day on days 3-26 only
{ const s = S.newGame({ story: false }), days = {}; let bad = 0; for (let d = 1; d <= 28; d++) { s.day = d; const a = St.today(s), b = St.today(s); days[d] = a; if (JSON.stringify(a) !== JSON.stringify(b)) bad++; }
  ok(bad === 0, "the same day always posts the same orders (nothing to save)");
  ok([1, 2, 27, 28].every(d => d > 2 ? days[d].length === 0 : days[d].length === 0) && Object.keys(days).filter(d => d >= 3 && d <= 26).every(d => days[d].length >= 1 && days[d].length <= 2), "none before day 3 or after day 26; one or two every day between");
  const kinds = new Set(); Object.values(days).flat().forEach(o => kinds.add(o.kind)); ok(kinds.has("good") && kinds.has("thin") && kinds.has("slow"), `a mix of good, thin and slow contracts over a season (${[...kinds]})`);
  const all = Object.values(days).flat(); ok(all.every(o => ["ashby", "hobb", "mira"].includes(o.who) && o.sacks >= 6 && o.sacks <= 24 && o.price >= S.R.unitCost + 1 && o.due <= 28 && o.value === o.sacks * o.price && /^so\d+-\d$/.test(o.sid)), "every order is a plausible contract from a regular buyer");
  const ids = all.map(o => o.sid); ok(new Set(ids).size === ids.length, "ids are unique across the season"); }
// the verdict: thin, slow, can't-carry, good
{ const s = S.newGame({ story: false }); s.day = 12; const mp = S.marketPrice(12), tp = S.traderPrice(12);
  const base = { sid: "x", who: "ashby", sacks: 9, terms: 0, dueIn: 6, due: 18 };
  const good = Object.assign({}, base, { price: tp + 2, kind: "good" }), thin = Object.assign({}, base, { price: tp, kind: "thin" }), slow = Object.assign({}, base, { price: tp + 2, kind: "slow", terms: 14, due: 22 }), big = Object.assign({}, base, { price: tp + 2, sacks: 60 });
  s.bal.cash = 300; ok(St.judge(s, good).well, `a price of ${good.price} against the trader's ${tp}, Cash 300: a good take`);
  ok(St.judge(s, thin).why.includes("thin") && /no better than the/.test(St.judge(s, thin).line), `a price of ${thin.price} is no better than the trader's ${tp}: thin, and the line says why`);
  ok(St.judge(s, slow).why.includes("slow"), "terms of 14 days landing after the season ends: slow");
  s.bal.cash = 10; ok(St.judge(s, big).why.includes("cant"), "60 sacks with Cash 10: the chest can't carry the seed");
  const f = St.facts(s, good); ok(f.margin === Math.round((good.price - S.R.unitCost) / good.price * 100) && f.floor === tp && f.cost === S.R.unitCost, "the facts come from the engine: margin, the trader's price, the cost"); }
// seen orders drop off the board
{ const s = S.newGame({ story: false }); s.day = 8; const a = St.today(s); St.mark(s, a[0].sid, "passed"); ok(St.today(s).length === a.length - 1 && St.state(s).log.length === 1, "an order you've dealt with isn't offered again"); }
// taking the good ones through the engine keeps the books whole, and does not break the season
{ const run = take => { const s = S.newGame({ story: false }); let n = 0; for (let d = 1; d <= 28 && !s.outcome; d++) { if (take) for (const o of St.today(s)) { if (St.judge(s, o).well) { const off = S.addOffer(s, o.who, o.sacks, o.price, o.terms, o.dueIn, 1); S.accept(s, off.id); n++; St.mark(s, o.sid, "well"); } } Bot.careful.day(s); S.sleep(s); } const st = B.close(s); return { s, st, n, verdict: S.crownFund(s).verdict }; };
  const base = run(false), withSo = run(true);
  ok(withSo.st.balanced && withSo.st.cf.reconciles && !withSo.s.outcome === !base.s.outcome, `books balance and the cash-flow statement reconciles with ${withSo.n} standing orders taken`);
  ok(withSo.n > 0 && withSo.s.outcome !== "insolvent", `a careful player taking only the good ones isn't ruined (Crown fund verdict ${withSo.verdict}, baseline ${base.verdict}; net income ${withSo.st.is.net} vs ${base.st.is.net})`); }
process.exit(fail ? 1 : 0);
