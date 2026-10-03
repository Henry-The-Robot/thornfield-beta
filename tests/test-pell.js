// Pell the pig farmer and Barnaby's rat poison: the counters to the pigs and the rats. Run: node tests/test-pell.js
const S = require("../engine.js"), B = require("../books.js"); let fail = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const upTo = (s, d) => { while (s.day < d && !s.over) S.sleep(s); };
const plant = (s, n) => { s.plots.filter(p => p.tilled && !p.crop).slice(0, n).forEach(p => p.crop = { age: 1, cost: 12 }); s.bal.inv += n * 12; s.bal.cash -= n * 12; };
// WS6: the pig and rat nights are seeded per game; Pell and Barnaby's windows follow them. Days are read from the game (default seed 0 = the canonical 9 and 16).
const PIG = S.eventDay(S.newGame(), "pigs"), RAT = S.eventDay(S.newGame(), "rats"), PELL = S.pellDays(S.newGame())[0], PED = S.pedlarDays(S.newGame())[0];
const pigNight = (setup) => { const s = S.newGame(); s.bal.cash = 500; upTo(s, PELL); if (setup) setup(s); upTo(s, PIG); plant(s, 8); S.sleep(s); return s; };
{ const s = S.newGame(); upTo(s, PELL); ok(/Pell/.test(S.coach(s).text), "Maud points to Pell while he's waiting"); }
{ const a = S.newGame({ seed: 7 }), b = S.newGame({ seed: 7 }), c = S.newGame({ seed: 8 }); ok(JSON.stringify(a.events) === JSON.stringify(b.events) && S.pellDays(a)[1] === S.eventDay(a, "pigs") - 1 && S.pedlarDays(a)[1] === S.eventDay(a, "rats"), "Pell and Barnaby follow the seeded pig and rat nights (same seed, same game)"); }
{ const s = pigNight(); ok(s.bal.losses > 0, "ignore Pell: the pigs come"); }
{ const s = pigNight(s => S.refusePell(s)); ok(s.pell === "refused" && s.bal.losses > 0 && s.trust.pell < 4 + 1, "refuse Pell: the pigs come and he's sour"); }
{ const s = pigNight(s => { const o = S.addOffer(s, "pell", 12, 4, 14, 4, 2); S.accept(s, o.id); });
  ok(s.pell === "deal" && s.bal.losses === 0 && /stayed in their pen/.test(s.log[0].t + s.log.map(l => l.t).join()), "help Pell: his pigs stay home, no loss"); }
{ const s = pigNight(s => { const o = S.addOffer(s, "pell", 12, 4, 14, 4, 2); S.accept(s, o.id); s.orders[0].status = "cancelled"; }); ok(s.bal.losses > 0, "break the deal (order cancelled): the pigs come anyway"); }
{ const s = S.newGame(); upTo(s, PELL); const o = S.addOffer(s, "pell", 12, 3, 21, 4, 2); o.share = true; S.accept(s, o.id); S.deliver(s, o.id);
  ok(s.promises.length === 1 && s.promises[0].amount === S.R.pellShare, "share deal records a promise");
  const st = B.close(s); ok(st.is.gross === -12 && st.balanced && st.cf.reconciles, "the promise is NOT booked: the sale shows Gross profit -12, books balance and reconcile");
  ok(st.end.ar === 36 && st.end.assets === st.end.cash + st.end.ar + st.end.inv + st.end.equipNet, "the only receivable is the 36 actually invoiced; the 80 promise is not an asset"); }
{ const s = S.newGame(); s.bal.cash = 300; upTo(s, PED); const u0 = s.bal.upkeep, loss = S.ratLoss(s); ok(/Barnaby/.test(S.coach(s).text), "Maud points to Barnaby"); ok(S.buyPoison(s, 35).ok && s.bal.upkeep === u0 + 35 && s.poison, "poison is an operating expense");
  const l0 = s.bal.losses; upTo(s, RAT + 1); ok(s.bal.losses === l0 && loss > 0, "poisoned barn: rats do no damage"); ok(!S.buyPoison(s, 35).ok, "can't buy it twice"); }
{ const s = S.newGame(); upTo(s, RAT); const l0 = s.bal.losses; S.sleep(s); ok(s.bal.losses > l0, "no poison: rats spoil stock"); }
{ const s = S.newGame(); s.bal.cash = 10; ok(!S.buyPoison(s, 35).ok && !s.poison, "can't buy poison without the Cash"); }
process.exit(fail ? 1 : 0);
