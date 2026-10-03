// WS6: Crane's offer price formula, the mercy offer, the sold-out epilogue numbers, ending classification, unlocks. Run: node tests/test-offer.js
const S = require("../engine.js"), E = require("../endings.js"), Bot = require("../bot.js"); let fail = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const give = (s, n) => { s.bal.cash += n; s.bal.capital -= n; };
const formula = (equity, gap) => Math.max(150, Math.round(Math.max(0, equity) + 300 - 10 * gap));

// 1. the formula, on a fresh story game
{ const s = S.newGame({ story: true }), b = S.balanceSheet(s.bal), o = E.offer(s);
  ok(b.equity < 0 && o.daysInGap === 0 && o.price === 300 && !o.mercy, `day 1: equity ${b.equity} adds nothing, no cash gap: Crane offers ${o.price}`); }
// 2. it rises a little as you prosper (equity above zero adds to it)
{ const s = S.newGame({ story: true }); give(s, 1054 + 80 + 1000); const b = S.balanceSheet(s.bal), o = E.offer(s);
  ok(b.equity > 0 && o.price === formula(b.equity, o.daysInGap) && o.price > 300, `equity ${b.equity}: offer ${o.price} = 300 + equity`); }
// 3. it falls as the cash gap deepens, never below the 150 floor
{ const s = S.newGame({ story: true }); s.bal.cash = 0; s.bal.capital += 200; const o = E.offer(s);
  ok(o.daysInGap > 0 && o.price === (o.mercy ? Math.max(100, Math.round(formula(o.equity, o.daysInGap) * .6)) : formula(o.equity, o.daysInGap)) && o.base < 300, `Cash 0: ${o.daysInGap} days in the gap, base ${o.base}`);
  const t = S.newGame({ story: true }); t.bal.cash = -400; t.bal.capital += 600; ok(E.offer(t).base >= E.MIN_PRICE, `a deep gap never takes the base offer below ${E.MIN_PRICE}: ${E.offer(t).base}`); }
// 4. mercy: Cash below the coming pay-day -> a lower offer than the base
{ const s = S.newGame({ story: true }); s.bal.cash = 10; s.bal.capital += 190; const o = E.offer(s), wk = S.weekBills(s);
  ok(o.mercy && o.price < o.base && o.price >= 100 && o.price === Math.max(100, Math.round(o.base * .6)), `Cash 10 < wages ${wk}: mercy offer ${o.price} (base ${o.base})`);
  const h = S.newGame({ story: true }); ok(!E.offer(h).mercy, "healthy Cash: no mercy offer"); }
// 5. the sold-out epilogue: the careful bot on a deep copy, original untouched, numbers in the text
{ const s = S.newGame({ story: true }), before = JSON.stringify(s), p = E.offer(s).price, so = E.soldOut(s, p);
  ok(JSON.stringify(s) === before, "running the careful bot on a deep copy leaves the real game unchanged");
  const c = JSON.parse(before); c.quiet = false; c.story = false; let n = 0; while (!c.over && n++ < 40) { Bot.careful.day(c); S.sleep(c); }
  ok(so.careful && so.worth === S.crownFund(c).net && so.careful.verdict === S.crownFund(c).verdict, `worth on day 28 if careful: ${so.worth} (independent re-run: ${S.crownFund(c).net}), verdict ${so.careful.verdict}`);
  const ep = E.epilogue("sold", { s, farm: "Hollowfield", sold: so }), txt = ep.lines.join(" ");
  ok(ep.lines.length >= 3 && ep.lines.length <= 4, `Sold out has 3-4 lines (${ep.lines.length})`);
  ok(txt.includes(String(p)) && txt.includes(so.worth.toLocaleString("en-US")) && txt.includes("Hollowfield") && ep.title === "Sold out", "epilogue names the price taken, the careful worth and the farm");
  ok(so.tags.includes("C0.01") && so.tags.includes("C1.01"), "tagged C0.01 (time value) and C1.01 (equity)"); }
// 6. endings classify; each has 3-4 lines and an unlock
{ const mk = () => S.newGame({ story: true });
  const sold = mk(); sold.sold = { price: 300 }; const seized = mk(); seized.over = true; seized.outcome = "insolvent"; seized.why = "Cash ran out.";
  const short = mk(); short.over = true; short.outcome = "closed"; const free = mk(); free.over = true; free.outcome = "closed"; give(free, 2000);
  const bridged = mk(); bridged.over = true; bridged.outcome = "closed"; give(bridged, S.R.crownDebt - 196 - 100);
  ok(E.ending(sold) === "sold" && E.ending(seized) === "seized" && E.ending(short) === "seized" && E.ending(free) === "free" && E.ending(bridged) === "bridged", `classified: ${[sold, seized, short, free, bridged].map(E.ending).join(", ")}`);
  for (const [k, g] of [["sold", sold], ["seized", seized], ["bridged", bridged], ["free", free]]) { const ep = E.epilogue(k, { s: g, farm: "Thornfield", sold: k === "sold" ? E.soldOut(g, 300) : null });
    ok(ep.lines.length >= 3 && ep.lines.length <= 4 && ep.unlock && ep.unlock.text.length > 10, `${k}: ${ep.lines.length} lines, unlock "${ep.unlock.term}"`); }
  ok(/The Audit \(coming\)/.test(E.epilogue("free", { s: free }).lines.join(" ")), "Free ends on 'The Audit (coming)' until WS8 lands"); }
// 7. unlocks persist and don't duplicate
{ const a = E.unlock("seized"), b2 = E.unlock("seized"); ok(a.fresh && !b2.fresh && E.unlocked().some(u => u.id === "page-lastspring"), "an ending's unlock is stored once"); }
// 8. real bots still end as designed in this engine (the offer changes no balances)
{ const g = S.newGame(); let n = 0; while (!g.over && n++ < 40) { Bot.careful.day(g); S.sleep(g); } ok(S.crownFund(g).verdict === "paid", "careful still pays the Crown: " + S.crownFund(g).verdict); }
process.exit(fail ? 1 : 0);
