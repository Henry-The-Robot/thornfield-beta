// Overnight events: pigs, rats, a warm day, a frost. Each posts balanced entries and keeps the statements reconciling.
// WS6: the event days are drawn per game from the seed saved in the game, so every scenario reads its day from the game (S.eventDay) and runs under
// the canonical calendar (seed 0) and two drawn seeds. Run: node tests/test-events.js
const S = require("../engine.js"), B = require("../books.js"); let fail = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const upTo = (s, d) => { while (s.day < d && !s.over) S.sleep(s); };
const plant = (s, n) => { s.plots.filter(p => p.tilled && !p.crop).slice(0, n).forEach(p => p.crop = { age: 1, cost: 12 }); s.bal.inv += n * 12; s.bal.cash -= n * 12; };
for (const seed of [0, 7, 1234]) {
  const g = () => S.newGame({ seed }), D = k => S.eventDay(g(), k), tag = seed ? ` [seed ${seed}]` : "";
  { const s = g(); s.bal.cash = 400; upTo(s, D("pigs")); plant(s, 5); const n0 = s.plots.filter(p => p.crop).length, inv0 = s.bal.inv, ni0 = S.balanceSheet(s.bal).ni;
    ok(/Pell's pigs/.test(S.coach(s).text), "Maud warns about the pigs on the day" + tag);
    S.sleep(s); const n1 = s.plots.filter(p => p.crop).length, lost = n0 - n1;
    ok(lost === Math.ceil(n0 / 4), `pigs eat a quarter of the plots (${lost} of ${n0})` + tag);
    ok(s.bal.losses === lost * 12 && s.bal.inv === inv0 - lost * 12, "loss is written off at cost: Inventory down, Crop & stock losses up" + tag);
    ok(S.balanceSheet(s.bal).ni < ni0 && B.close(s).is.losses === lost * 12, "the loss reaches net income and the income statement" + tag); }
  { const s = g(); s.bal.cash = 400; upTo(s, D("pigs") - 1); const u0 = s.bal.upkeep; ok(S.buyFence(s).ok && s.bal.upkeep === u0 + 20, "a fence is an operating expense (upkeep)" + tag); upTo(s, D("pigs")); plant(s, 5); const n0 = s.plots.filter(p => p.crop).length; S.sleep(s);
    ok(s.plots.filter(p => p.crop).length === n0 && s.bal.losses === 0, "a fenced field loses nothing" + tag); }
  { const s = g(); upTo(s, D("rats")); const k0 = s.sacks, l0 = s.bal.losses; S.sleep(s); ok(s.sacks === k0 - Math.floor(k0 * .2) && s.bal.losses - l0 === (k0 - s.sacks) * 4, "rats spoil a fifth of the barn, written off at cost" + tag); }
  { const s = g(); upTo(s, D("warm")); s.bal.cash = 500; plant(s, 3); s.plots.filter(p => p.crop).forEach(p => p.crop.age = 1); S.sleep(s); ok(s.plots.filter(p => p.crop).every(p => p.crop.age === 2 || p.crop.age === 3), "warm day gives crops an extra day of growth" + tag); }
  { const s = g(); upTo(s, D("frost")); plant(s, 3); s.plots.filter(p => p.crop).forEach(p => { p.crop.age = 1; p.watered = true; }); S.sleep(s); ok(s.plots.filter(p => p.crop).every(p => p.crop.age === 1), "frost stops all growth for the night" + tag); }
}
for (const k of ["careful", "reckless", "overtrader", "noDuke", "sprinkler"]) { const Bot = require("../bot.js"), s = S.newGame(); let g = 0; while (!s.over && g++ < 40) { Bot[k].day(s); S.sleep(s); }
  const st = B.close(s); ok(st.balanced && st.cf.reconciles, `${k}: ${s.outcome}, statements balance and reconcile (losses ${s.bal.losses})`); }
process.exit(fail ? 1 : 0);
