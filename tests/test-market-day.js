// WS7 Market Day: the villager model, Grisby's rule, the books, and a pricing bot that must beat a fixed price. Run: node tests/test-market-day.js
const S = require("../engine.js"), M = require("../market.js"), B = require("../books.js"), Bot = require("../bot.js"), Tr = require("../transcript.js");
let fail = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const game = (day, sacks) => { const s = S.newGame(); s.day = day; s.sacks = sacks; return s; };
// the test harness tops the barn up by buying wholesale at cost, as a real posting, so Inventory ties to the sacks in the barn
const stockUp = (s, n) => { S.post(s, "seed", `Bought ${n} sacks wholesale for the fair (test harness)`, { inv: n * S.R.unitCost, cash: -n * S.R.unitCost }); s.sacks += n; };
const growing = s => s.plots.filter(p => p.crop).length;
const invTies = s => s.bal.inv === s.sacks * S.R.unitCost + s.seeds * S.R.seedCost + growing(s) * S.R.seedCost;

// ---- the calendar ----
ok([7, 14, 21].every(d => M.isDay(d, {})) && !M.isDay(8, {}) && !M.isDay(28, {}) && !M.isDay(28, { finaleDone: true }) && M.FAIR_DAYS.join() === "7,14,21", "fair on days 7, 14 and 21 only: day 28 is the Court (creative call 4)");

// ---- determinism: same game, same villagers ----
{ const a = M.villagers(14, 1), b = M.villagers(14, 1); ok(JSON.stringify(a) === JSON.stringify(b), "the same day and hour always bring the same 8 villagers");
  ok(JSON.stringify(M.villagers(14, 1)) !== JSON.stringify(M.villagers(14, 2)), "different hours bring different villagers");
  const f1 = M.newFair(game(7, 24)), f2 = M.newFair(game(7, 24)); [9, 10, 8].forEach(p => { M.playHour(f1, p); M.playHour(f2, p); });
  ok(JSON.stringify(f1.hours) === JSON.stringify(f2.hours), "two fairs at the same prices give identical hours (nothing random, nothing to save)"); }

// ---- the three segments ----
{ const all = []; for (const d of [7, 14, 21, 28]) for (let h = 0; h < 3; h++) all.push(...M.villagers(d, h).map(v => Object.assign({ d }, v)));
  const n = seg => all.filter(v => v.seg === seg).length, share = seg => n(seg) / all.length;
  ok(["thrifty", "comfortable", "hurry"].every(sg => n(sg) > 0), `all three segments walk by (${n("thrifty")} thrifty, ${n("comfortable")} comfortable, ${n("hurry")} in a hurry of ${all.length})`);
  ok(share("thrifty") === .375 && share("comfortable") === .375 && share("hurry") === .25, "every hour brings 3 thrifty, 3 comfortable and 2 in a hurry");
  { const hrs = [0, 1, 2].map(h => M.villagers(7, h)); ok(hrs.every(v => v.length === 8) && hrs.every(v => v.filter(x => x.seg === "hurry").length === 2), "8 villagers an hour"); }
  const mean = (seg) => { const v = all.filter(x => x.seg === seg); return v.reduce((a, x) => a + x.reserve - S.marketPrice(x.d), 0) / v.length; };
  ok(mean("thrifty") < 0 && mean("comfortable") > 1 && mean("hurry") > mean("comfortable"), `thrifty pay under the going price (${mean("thrifty").toFixed(1)}), comfortable over it (+${mean("comfortable").toFixed(1)}), the hurried most (+${mean("hurry").toFixed(1)})`);
  const hurry = all.find(v => v.seg === "hurry"), thrifty = all.find(v => v.seg === "thrifty");
  ok(M.decide(hurry, hurry.reserve, null, 50).qty === 1 && M.decide(hurry, hurry.reserve, null, 50).react === "bought", "a villager in a hurry buys exactly 1, up to a high price");
  const r = thrifty.reserve;
  ok(M.decide(thrifty, r, null, 5).react === "bought" && M.decide(thrifty, r + 1, null, 5).react === "hesitated" && M.decide(thrifty, r + 2, null, 5).react === "dear", "buys at their reserve, hesitates 1 over it, calls it too dear 2+ over");
  ok(M.decide(thrifty, r, null, 0).react === "soldout" && M.decide(thrifty, r, null, 0).qty === 0, "with no stock the villager sees a sold-out stall");
  ok(M.decide(thrifty, r - 3, null, 1).qty === 1, "a buyer never takes more sacks than you have left"); }

// ---- the demand curve slopes down (no rival; plenty of stock) ----
{ const s = game(7, 60); let prev = Infinity, mono = true; for (let p = 4; p <= 14; p++) { const u = M.flat(s, p, 60).units; if (u > prev) mono = false; prev = u; }
  ok(mono, "units sold never rise as the price rises (a downward-sloping demand curve)");
  const lo = M.flat(s, 6, 60).units, hi = M.flat(s, 11, 60).units; ok(lo > hi * 2, `a low price sells many more sacks than a high one (${lo} at 6 vs ${hi} at 11)`);
  const r8 = M.flat(s, 8, 60), r10 = M.flat(s, 10, 60); ok(r8.revenue > r10.revenue, `with stock to spare, 8 earns more takings than 10 (${r8.revenue} vs ${r10.revenue})`);
  const sc = game(7, 12); ok(M.flat(sc, 10, 12).revenue > M.flat(sc, 8, 12).revenue, "with only 12 sacks, 10 earns more than 8: scarcity says charge more"); }

// ---- Grisby's rule ----
{ ok(M.grisbyPrice(8, 9) === 7 && M.grisbyPrice(8, 10) === 8 && M.grisbyPrice(8, 14) === 12 && M.grisbyPrice(5, 6) === 5, "Grisby undercuts by 2 when you are above the going price (never below cost + 1)");
  ok(M.grisbyPrice(8, 8) === 8 && M.grisbyPrice(8, 7) === 8 && M.grisbyPrice(8, 4) === 8, "Grisby holds at the going price when you are at it or below it");
  ok(!M.grisbyIn(7) && M.grisbyIn(14) && M.grisbyIn(21) && M.grisbyIn(28), "Grisby sets up a stall from week 2 (day 14), not on day 7");
  const f7 = M.newFair(game(7, 30)), f14 = M.newFair(game(14, 30)); ok(f7.grisby === false && f14.grisby === true, "the fair on day 7 has no rival; day 14 has");
  const th = { seg: "thrifty", reserve: 9 }, co = { seg: "comfortable", reserve: 11 }, hu = { seg: "hurry", reserve: 12 };
  ok(M.decide(th, 10, 9, 5).to === "grisby" && M.decide(th, 10, 9, 5).react === "bought", "a thrifty villager who sees both buys from the cheaper stall (Grisby)");
  ok(M.decide(th, 9, 9, 5).to === "me", "a tie stays with you");
  ok(M.decide(co, 10, 9, 5).to === "me" && M.decide(hu, 10, 9, 5).to === "me", "comfortable and hurried villagers don't comparison-shop: they stay with you");
  const s = game(14, 30), f = M.newFair(s), h = M.playHour(f, 10); ok(h.grisbyPrice === 8 && h.toGrisby >= 0, "the hour record carries Grisby's price after seeing yours");
  const noRival = M.flat(game(7, 60), 9, 60), rival = M.flat(game(14, 60), 9, 60); ok(rival.toGrisby > 0, `at 9 (1 over the going price) Grisby takes thrifty sales from you (${rival.toGrisby} sacks)`); ok(noRival.toGrisby === 0, "with no rival nothing goes to Grisby");
  ok(rival.stolen > 0 && rival.stolen <= rival.toGrisby, `'stolen' counts only villagers who'd have paid your price (${rival.stolen} of ${rival.toGrisby} sacks he sold)`);
  { const w = M.flat(game(7, 60), 9, 60), g = M.flat(game(14, 60), 9, 60); ok(g.revenue < w.revenue, `at 9 with 60 sacks Grisby costs you real takings (${g.revenue} vs ${w.revenue} with no rival)`);
    const hi = M.flat(game(14, 60), 11, 60), hi0 = M.flat(game(7, 60), 11, 60); ok(hi.revenue === hi0.revenue, "at 11 nobody thrifty would have paid you anyway, so he costs you nothing: a higher price escapes him"); }
  const at = p => M.flat(game(14, 60), p, 60).toGrisby; ok(at(8) === 0 && at(6) === 0, "at or under the going price Grisby holds and takes nothing (ties stay with you)"); }

// ---- T6: Grisby has a limited stock, and in week 3 he runs out ----
{ const f14 = M.newFair(game(14, 60)), f21 = M.newFair(game(21, 60)); ok(f14.gStock0 === 24 && f21.gStock0 === 5 && M.newFair(game(7, 60)).gStock0 === 0, "Grisby brings 24 sacks on day 14, only 5 on day 21, and nothing on day 7");
  const f = M.newFair(game(21, 60)); const hs = [0, 1, 2].map(() => M.playHour(f, 9)); const took = hs.reduce((a, h) => a + h.toGrisby, 0);
  ok(took <= 5 && took === 5 - f.gStock, `Grisby's sales never exceed his stock (sold ${took} of 5)`);
  ok(hs.some(h => h.grisbyOut) && hs[0].grisbyOut === false, `he sells out part-way through the afternoon (hours out: ${hs.map(h => h.grisbyOut ? "out" : "open").join(", ")})`);
  const out = hs.find(h => h.grisbyOut), noRival = M.playHour(M.newFair(game(7, 60), {}), 10); void noRival; ok(out.toGrisby === 0 && out.grisbyPrice === null, "once he is out nothing goes to him and his board shows no price");
  const a = M.flat(game(21, 60), 9, 60), b = M.flat(game(14, 60), 9, 60); ok(a.toGrisby <= 5 && b.toGrisby > a.toGrisby, `week 2's Grisby sells ${b.toGrisby} sacks at 9, week 3's runs dry after ${a.toGrisby}`); }
// ---- T6b: only a price change that RAISED takings counts as an experiment ----
{ const s = game(7, 60), mk = prices => { const f = M.newFair(s); prices.forEach(p => M.playHour(f, p)); return f; };
  const f1 = mk([8, 8, 8]), f2 = mk([8, 10, 9]); let raised = null; for (const trio of [[8, 9, 10], [10, 9, 8], [6, 8, 10], [10, 8, 6], [9, 10, 11], [12, 10, 8]]) { const f = mk(trio); if (M.experiment(f)) { raised = trio; break; } }
  ok(!M.experiment(f1), "the same price all afternoon is not an experiment");
  const worse = (() => { for (const a of [5, 6, 7, 11, 12, 13]) for (const b of [5, 6, 7, 8, 9, 10, 11, 12, 13]) { if (a === b) continue; const f = mk([a, b, b]); if (f.hours[1].revenue <= f.hours[0].revenue) return f; } return null; })();
  ok(worse && !M.experiment(worse), `a changed price that did NOT raise takings is not an experiment either (${worse && worse.hours.map(h => h.price + "->" + h.revenue).join(", ")})`);
  ok(raised && M.experiment(mk(raised)), `a change that raised takings counts (${raised})`); void f2; }
// ---- T6b: Maud's bet is settled on every path ----
{ const mkb = (guess, answer) => { const s = game(14, 18); s.market = { fairs: [], named: false, bet: { day: 14, guess, answer, now: 5, then: 6, price: 9, stake: 2 } }; S.wager(s, 2, "Maud's bet on your fair price"); return s; };
  let s = mkb("up", "up"); ok(M.settleBet(s) === null, "before the fair is played the bet is left alone");
  const full = s2 => { s2.market.fairs.push({ day: 14, points: [{}, {}, {}] }); return s2; };
  s = full(mkb("up", "up")); const c0 = s.bal.cash; ok(M.settleBet(s) === "won" && s.bal.cash === c0 + 4 && s.market.bet.settled === "won", "a finished fair with the right guess pays the stake back twice over");
  s = full(mkb("up", "down")); const c1 = s.bal.cash; ok(M.settleBet(s) === "lost" && s.bal.cash === c1, "a wrong guess keeps the stake");
  s = mkb("up", "up"); s.market.fairs.push({ day: 14, points: [{}] }); s.day = 15; const c2 = s.bal.cash; ok(M.settleBet(s) === "refunded" && s.bal.cash === c2 + 2, "quitting mid-fair refunds the stake (the next morning, or on reload)");
  s = mkb("up", "up"); s.day = 15; const c3 = s.bal.cash; ok(M.settleBet(s) === "refunded" && s.bal.cash === c3 + 2, "a bet placed and the fair never started is refunded too");
  const b = S.balanceSheet(s.bal); ok(b.assets === b.liab + b.equity && M.settleBet(s) === null, "the refund keeps the books balanced and settling twice does nothing"); }
// ---- Maud's bet is computed from the same model ----
{ const s = game(14, 18); const b = M.betAnswer(s, 9, 18); ok(b.answer === (b.then > b.now ? "up" : b.then < b.now ? "down" : "same") && b.now === M.flat(s, 9, 18).revenue && b.then === M.flat(s, 10, 18).revenue, `the bet answer comes from the model (9 -> ${b.now}, 10 -> ${b.then}: takings ${b.answer})`);
  const s2 = game(14, 60); ok(M.betAnswer(s2, 8, 60).answer === "down" && M.betAnswer(game(14, 12), 8, 12).answer === "up", "the right answer changes with how much stock you brought (up with 12 sacks at 8, down with 60)"); }

// ---- the books tie out ----
{ const s = S.newGame(); s.day = 7; stockUp(s, 24); const c0 = s.bal.cash, rev0 = -s.bal.revenue, cogs0 = s.bal.cogs, inv0 = s.bal.inv, n0 = s.journal.length;
  const f = M.auto(s, M.bots.smart(), 39), t = M.totals(f), bs = B.close(s);
  ok(t.units > 0 && s.journal.length > n0, `a fair posts to the journal (${s.journal.length - n0} postings, ${t.units} sacks)`);
  ok(s.bal.cash - c0 === t.revenue && -s.bal.revenue - rev0 === t.revenue && s.bal.cogs - cogs0 === t.units * S.R.unitCost && inv0 - s.bal.inv === t.units * S.R.unitCost, "Cash and Revenue rose by the takings; Cost of goods sold and Inventory moved by the cost of the sacks sold");
  const b = S.balanceSheet(s.bal); ok(b.assets === b.liab + b.equity, "Assets = Liabilities + Owner's equity after the fair");
  ok(s.sacks === 15 + 24 - t.units && s.sacks >= 0, "the barn lost exactly the sacks sold, and never goes negative"); ok(s.journal.slice(n0).every(e => Object.values(e.lines).reduce((a, v) => a + v, 0) === 0), "every posting balances");
  ok(invTies(s), "Inventory in the ledger equals sacks + seed + growing crops at cost");
  ok(bs.cf.reconciles, "the cash-flow statement still reconciles to the change in Cash");
  ok(M.history(s).length === 1 && M.history(s)[0].units === t.units && M.history(s)[0].points.length === 3, "the fair is remembered for the demand curve (3 hour-points)");
  ok(f.stock === s.sacks && f.stock + t.units === f.stock0, "unsold sacks stay in the barn (stock0 = sold + unsold)"); }

// ---- a smart pricer beats a fixed price over a season (both play the same careful farm; each fair they bring the same 18 sacks) ----
function season(botFor, stock) {
  const s = S.newGame(), res = { fairs: [] };
  while (!s.over) {
    if (M.isDay(s.day, s)) { stockUp(s, stock); const before = s.bal.cash; const f = M.auto(s, botFor(), stock); const t = M.totals(f); res.fairs.push({ day: s.day, gross: t.gross, units: t.units, prices: f.hours.map(h => h.price) }); void before; }
    Bot.careful.day(s); S.sleep(s);
  }
  res.s = s; res.gross = res.fairs.reduce((a, x) => a + x.gross, 0); return res;
}
for (const stock of [12, 18, 24]) {
  const fixed = season(() => M.bots.fixed(8), stock), smart = season(() => M.bots.smart(), stock), gain = smart.gross / fixed.gross - 1;
  console.log(`     stock ${stock}: smart ${smart.gross} gross profit over 4 fairs (${smart.fairs.map(x => x.prices.join("/")).join(" | ")}) vs fixed-8 ${fixed.gross} = ${gain >= 0 ? "+" : ""}${(gain * 100).toFixed(1)}%`);
  if (stock <= 18) ok(gain >= .15, `stock ${stock}: the smart pricer earns at least 15% more than a fixed price over the season (${(gain * 100).toFixed(1)}%)`);
}
{ const fixed = season(() => M.bots.fixed(8), 18), smart = season(() => M.bots.smart(), 18), ni = x => S.balanceSheet(x.s.bal).ni;
  ok(ni(smart) > ni(fixed), `season Net income is higher with the smart pricer (${ni(smart)} vs ${ni(fixed)}; the fairs' extra gross profit is ${smart.gross - fixed.gross}, the rest is the bot borrowing less)`);
  ok(smart.s.outcome === "closed" && fixed.s.outcome === "closed", "the careful farmer still closes the season with fairs in it (verdict unchanged)");
  const b = S.balanceSheet(smart.s.bal); ok(b.assets === b.liab + b.equity && B.close(smart.s).cf.reconciles, "the season's statements tie out with four fairs in it");
  // the honest baseline: the best constant price a player could have found by hindsight (same price every hour of every fair)
  let bestFixed = null; for (let p = 5; p <= 12; p++) { const r = season(() => M.bots.fixed(p), 18); if (!bestFixed || r.gross > bestFixed.gross) bestFixed = { p, gross: r.gross }; }
  console.log(`     best constant price in hindsight: ${bestFixed.p} -> ${bestFixed.gross}; smart ${smart.gross} (${((smart.gross / bestFixed.gross - 1) * 100).toFixed(1)}% more)`);
  ok(smart.gross >= bestFixed.gross * 1.05, "the smart pricer also beats the BEST constant price by at least 5% (changing the price between hours pays, not just 'charge more')");
  const bestFlat18 = [7, 14, 21, 28].map(d => M.bestFlat((() => { const s = game(d, 18); return s; })(), 18).t.gross).reduce((a, x) => a + x, 0);
  console.log(`     oracle (best single price per fair, 18 sacks): ${bestFlat18}; smart ${smart.gross}; fixed-8 ${fixed.gross}`); }

// ---- the careful and overtrader verdicts are what they were (no fairs played) ----
{ const run = bot => { const s = S.newGame(); while (!s.over) { Bot[bot].day(s); S.sleep(s); } return s.outcome; };
  ok(run("careful") === "closed" && run("overtrader") === "insolvent", "careful still closes the season and the overtrader is still insolvent"); }

// ---- the transcript knows the new ideas ----
ok(Tr.CONCEPTS.C4 && Tr.CONCEPTS.C4.some(c => c[0] === "demand") && Tr.CONCEPTS.C4.some(c => c[0] === "competitor") && Tr.CONCEPTS.C8 && Tr.CONCEPTS.C8.some(c => c[0] === "segments"), "the transcript lists demand and competitor under C4 and segments under C8");
{ const fit = M.demandFit([{ price: 6, units: 8 }, { price: 8, units: 6 }, { price: 10, units: 4 }]); ok(fit && Math.abs(fit.slope + 1) < 1e-9, "the demand line through (6,8) (8,6) (10,4) has slope -1"); ok(M.demandFit([{ price: 8, units: 5 }, { price: 8, units: 6 }]) === null, "one price makes a dot, not a curve (no line)"); }
console.log(fail ? `${fail} FAILED` : "ALL MARKET DAY TESTS PASS"); process.exit(fail ? 1 : 0);
