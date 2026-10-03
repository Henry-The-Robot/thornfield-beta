// The frost almanac (T6, expected value vs ruin). Run: node tests/test-frost.js
const S = require("../engine.js"), B = require("../books.js"), Bot = require("../bot.js");
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
// a careful farm up to the evening before the frost, with the frost moved to `night`
const setup = night => { const s = S.newGame({ story: false }); s.events = { [night]: "frost" }; for (let d = 1; d < night - 1; d++) { Bot.careful.day(s); S.sleep(s); } Bot.careful.day(s); return s; };
const balanced = s => { const b = S.balanceSheet(s.bal); return b.assets === b.liab + b.equity && B.close(s).cf.reconciles; };
// the notice: only the evening before, with the odds and the price of straw in it
{ const s = setup(24); ok(s.day === 23 && S.notice(s) && S.notice(s).id === "frost", "the almanac is on the board the evening before the frost");
  const n = S.notice(s), f = S.frostFacts(s); ok(/1 in 3/.test(n.text) && n.text.includes(String(f.cover)) && n.text.includes(String(f.atRisk)) && n.options.length === 2, `it states the odds, the straw price (${f.cover} for ${f.n} plots) and what is at risk (${f.atRisk})`);
  ok(f.ev === Math.round(f.atRisk / 3) && f.ev < f.cover, `on average risking it (${f.ev}) is cheaper than straw (${f.cover}): the trap for anyone who stops at the average`);
  const t = S.newGame({ story: false }); t.events = { 24: "frost" }; t.day = 22; ok(!S.notice(t), "no almanac on other days"); const u = setup(24); u.plots.forEach(p => { p.crop = null; }); ok(!S.notice(u), "and none when nothing is growing"); }
// the frost falls on the NIGHT after the evening notice: sleep through tonight, then through the frost night itself (no farm work in between, so crop counts are comparable)
const through = s => { S.sleep(s); S.sleep(s); };
// covered: certain cost, crops safe even in a hard frost
{ const s = setup(24), f = S.frostFacts(s), c0 = s.bal.cash, u0 = s.bal.upkeep; ok(S.answerNotice(s, 0).msg === "covered" && c0 - s.bal.cash === f.cover && s.bal.upkeep - u0 === f.cover, `straw costs ${f.cover} in Cash, booked as an operating expense`);
  const crops = s.plots.filter(p => p.crop).length, l0 = s.bal.losses; through(s); ok(S.roll(24, "hardfrost", 1) < 1 / 3, "(day 24 is a hard frost)");
  ok(crops > 0 && s.plots.filter(p => p.crop).length === crops && s.bal.losses === l0 && s.log.some(l => /straw saved/.test(l.t)), "a hard frost, and the covered crops all live"); ok(balanced(s), "the books balance"); }
// risked + hard: the crops die, written off at cost
{ const s = setup(24), f = S.frostFacts(s), inv0 = s.bal.inv, l0 = s.bal.losses, cash0 = s.bal.cash; ok(S.answerNotice(s, 1).msg === "risk" && s.bal.cash === cash0, "risking it costs nothing today");
  through(s); ok(f.n > 0 && s.plots.filter(p => p.crop).length === 0, `the hard frost killed all ${f.n} uncovered plots`); ok(s.bal.losses - l0 === f.atRisk && inv0 - s.bal.inv >= f.atRisk && s.log.some(l => /1 in 3/.test(l.t)), `${f.atRisk} written off as a loss and out of Inventory`); ok(balanced(s), "the books balance"); }
// risked + a light frost (day 25): nothing lost
{ const s = setup(25); ok(S.roll(25, "hardfrost", 1) >= 1 / 3, "(day 25 is a light frost)"); S.answerNotice(s, 1); const l0 = s.bal.losses, n0 = s.plots.filter(p => p.crop).length; through(s); ok(n0 > 0 && s.bal.losses === l0 && s.plots.filter(p => p.crop).length === n0 && s.log.some(l => /won the 1 in 3/.test(l.t)), "a light frost after a risk costs nothing: you won the 1 in 3"); }
// unattended play is unchanged: a bot that never answers is not exposed to the hard frost
{ const s = S.newGame({ story: false }); s.events = { 22: "frost" }; while (!s.over) { Bot.careful.day(s); S.sleep(s); } ok(s.outcome === "closed" && !s.journal.some(j => /hard frost killed/.test(j.memo)), `a bot that never answers is untouched by the hard frost on day 22 (${s.outcome}, no frost loss in the books)`); }
// the frost-eve warning points at the board
{ const s = setup(24); ok(/almanac/.test(S.warning(s) || ""), "Maud's warning points the player to the almanac"); }
process.exit(fail ? 1 : 0);
