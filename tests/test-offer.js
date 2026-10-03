// WS6: Crane's offer price formula, the mercy offer, the sold-out epilogue numbers, ending classification, unlocks. Run: node tests/test-offer.js
const S = require("../engine.js"), E = require("../endings.js"), Bot = require("../bot.js"); let fail = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const give = (s, n) => { s.bal.cash += n; s.bal.capital -= n; };
const formula = (earned, gap) => Math.max(150, Math.round(300 + Math.max(0, earned) / 2 - 10 * gap));

// 1. the formula, on a fresh story game: nothing cleared yet, no gap -> 300
{ const s = S.newGame({ story: true }), o = E.offer(s);
  ok(E.opCash(s) === 0 && o.daysInGap === 0 && o.price === 300 && !o.mercy, `day 1: nothing cleared, no cash gap: Crane offers ${o.price}`); }
// 2. it RISES with the Cash the farm's operations have cleared (not with book equity)
{ const play = days => { const s = S.newGame({ story: false }); for (let d = 1; d <= days && !s.outcome; d++) { Bot.careful.day(s); S.sleep(s); } return s; };
  const a = play(8), b = play(20), oa = E.offer(a), ob = E.offer(b);
  ok(E.opCash(b) > E.opCash(a) && ob.price === formula(E.opCash(b), ob.daysInGap) && oa.price === formula(E.opCash(a), oa.daysInGap) && (ob.daysInGap > oa.daysInGap || ob.price > oa.price), `cleared ${E.opCash(a)} -> offer ${oa.price}; cleared ${E.opCash(b)} -> offer ${ob.price} (rises with operating Cash)`);
  const g = S.newGame({ story: true }); give(g, 3000); ok(E.offer(g).price === 300 && S.balanceSheet(g.bal).equity > 0, "a gift of book equity (no Cash earned) does not raise the offer: equity is what the books say, not what the farm earns"); }
// 3. it FALLS as the cash gap deepens (desperation), never below the 150 floor
{ const s = S.newGame({ story: true }); s.bal.cash = 0; s.bal.capital += 200; const o = E.offer(s);
  ok(o.daysInGap > 0 && o.price === (o.mercy ? Math.max(100, Math.round(formula(o.earned, o.daysInGap) * .6)) : formula(o.earned, o.daysInGap)) && o.base < 300, `Cash 0: ${o.daysInGap} days in the gap, base ${o.base} < 300`);
  const t = S.newGame({ story: true }); t.bal.cash = -400; t.bal.capital += 600; ok(E.offer(t).base >= E.MIN_PRICE, `a deep gap never takes the base offer below ${E.MIN_PRICE}: ${E.offer(t).base}`); }
// 4. mercy: Cash below the coming pay-day -> a lower offer than the base
{ const s = S.newGame({ story: true }); s.bal.cash = 10; s.bal.capital += 190; const o = E.offer(s), wk = S.weekBills(s);
  ok(o.mercy && o.price < o.base && o.price >= 100 && o.price === Math.max(100, Math.round(o.base * .6)), `Cash 10 < wages ${wk}: mercy offer ${o.price} (base ${o.base})`);
  const h = S.newGame({ story: true }); ok(!E.offer(h).mercy, "healthy Cash: no mercy offer"); }
// 5. the sold-out epilogue: sets the price beside what the farm EARNS and the book equity; never claims the offer was "always lower"
{ const s = S.newGame({ story: false }); for (let d = 1; d <= 27 && !s.outcome; d++) { Bot.careful.day(s); S.sleep(s); } const before = JSON.stringify(s), p = E.offer(s).price, so = E.soldOut(s, p);
  ok(JSON.stringify(s) === before && so.equity === S.balanceSheet(s.bal).equity && so.earned > 0, `the epilogue reads the game without changing it: earned ${so.earned} (${so.basis}), book equity ${so.equity}`);
  const ep = E.epilogue("sold", { s, farm: "Hollowfield", sold: so }), txt = ep.lines.join(" ");
  ok(ep.lines.length >= 3 && ep.lines.length <= 4 && ep.title === "Sold out", `Sold out has 3-4 lines (${ep.lines.length})`);
  ok(txt.includes(String(p)) && txt.includes(so.earned.toLocaleString("en-US")) && txt.includes("Hollowfield") && /on the books at all/.test(txt) && so.springs === Math.round(p / so.earned * 10) / 10 && txt.includes(String(so.springs)), "names the price, the Cash cleared this spring, the springs it equals and that the land isn't on the books");
  ok(!/always lower|careful|Carefully/i.test(txt), "no claim that the offer is always lower, and no comparison with a bot run");
  const z = S.newGame({ story: true }), zo = E.soldOut(z, 300), zt = E.epilogue("sold", { s: z, farm: "Thornfield", sold: zo }).lines.join(" "); ok(zo.springs === null && /not yet earned a profit/.test(zt), "before any profit the line says so instead of dividing by zero");
  const sp = JSON.parse(before); sp.bal.cash += 500; sp.bal.revenue -= 500; ok(E.soldOut(sp, 300).basis === "cash" || E.soldOut(sp, 300).basis === "profit", "basis is Cash when operations cleared Cash, otherwise profit");
  ok(so.tags.includes("C0.01") && so.tags.includes("C1.01"), "tagged C0.01 (time value) and C1.01 (equity)"); }
// 6. endings classify; each has 3-4 lines and an unlock
{ const mk = () => S.newGame({ story: true });
  const sold = mk(); sold.sold = { price: 300 }; const seized = mk(); seized.over = true; seized.outcome = "insolvent"; seized.why = "Cash ran out.";
  const short = mk(); short.over = true; short.outcome = "closed"; const free = mk(); free.over = true; free.outcome = "closed"; give(free, 2000);
  const bridged = mk(); bridged.over = true; bridged.outcome = "closed"; give(bridged, S.R.crownDebt - 196 - 100);
  ok(E.ending(sold) === "sold" && E.ending(seized) === "seized" && E.ending(short) === "seized" && E.ending(free) === "free" && E.ending(bridged) === "bridged", `classified: ${[sold, seized, short, free, bridged].map(E.ending).join(", ")}`);
  for (const [k, g] of [["sold", sold], ["seized", seized], ["bridged", bridged], ["free", free]]) { const ep = E.epilogue(k, { s: g, farm: "Thornfield", sold: k === "sold" ? E.soldOut(g, 300) : null });
    ok(ep.lines.length >= 3 && ep.lines.length <= 4 && ep.unlock && ep.unlock.text.length > 10, `${k}: ${ep.lines.length} lines, unlock "${ep.unlock.term}"`); }
  ok(!/\(coming\)/.test(["sold", "seized", "bridged", "free"].map(k => E.epilogue(k, { s: free, sold: E.soldOut(free, 300) }).lines.join(" ")).join(" ")), "no '(coming)' text reaches the player in any epilogue"); }
// 7. unlocks persist and don't duplicate
{ const a = E.unlock("seized"), b2 = E.unlock("seized"); ok(a.fresh && !b2.fresh && E.unlocked().some(u => u.id === "page-lastspring"), "an ending's unlock is stored once"); }
// 8. real bots still end as designed in this engine (the offer changes no balances)
{ const g = S.newGame(); let n = 0; while (!g.over && n++ < 40) { Bot.careful.day(g); S.sleep(g); } ok(S.crownFund(g).verdict === "paid", "careful still pays the Crown: " + S.crownFund(g).verdict); }
process.exit(fail ? 1 : 0);
