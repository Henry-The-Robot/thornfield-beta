// Maud's daily problems: every problem's answer must be computed from the same books the player sees. Run: node tests/test-practice.js
global.window = global; const S = require("../engine.js"), B = require("../books.js"); global.Spring = S; global.Books = B; global.Transcript = require("../transcript.js");
const Bot = require("../bot.js"); require("../practice.js"); const P = window.Practice;
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const seen = new Set(), bad = []; let n = 0, cmps = 0;
for (const bot of [Bot.careful, Bot.reckless, Bot.sprinkler, Bot.overtrader]) {
  const s = S.newGame(); s.story = false;
  for (let d = 1; d <= 28 && !s.outcome; d++) {
    const c = P.compare(s); if (c) { cmps++; if (![0, 1, 2].includes(c.answer) || /undefined|NaN/.test(c.text + c.work)) bad.push(`compare d${s.day}`); }
    try { bot.day(s); } catch (e) {}
    for (const b of P.BANK) { let q = null; try { q = b.make(s); } catch (e) { bad.push(`${b.id} d${s.day} threw ${e.message}`); } if (!q) continue; n++; seen.add(b.id);
      if (typeof q.answer !== "number" || !isFinite(q.answer) || /undefined|NaN|\[object/.test(q.text + q.work) || !q.hints.length) bad.push(`${b.id} d${s.day}: ${q.answer} | ${q.text.slice(0, 90)}`); }
    S.sleep(s);
  }
}
ok(bad.length === 0, `${n} problems across 4 bots: every answer is a number, no undefined text` + (bad.length ? " :: " + bad.slice(0, 4).join(" || ") : ""));
ok(P.BANK.every(b => seen.has(b.id)), "every problem type came up in play" + (P.BANK.filter(b => !seen.has(b.id)).length ? " (missing: " + P.BANK.filter(b => !seen.has(b.id)).map(b => b.id).join(",") + ")" : ""));
ok(cmps > 0, "the two-offer comparison is built when offers are on the table");
// the engine agrees with a worked example
{ const s = S.newGame(); s.bal.cash = 100; const q = P.BANK.find(b => b.id === "equation").make(s), bs = S.balanceSheet(s.bal); ok(q.answer === bs.equity, "equity problem answer equals the engine's"); }
// variety, determinism, one a day, streaks
{ const s = S.newGame(); const days = []; for (let d = 4; d <= 14; d++) { s.day = d; const p = P.pick(s, () => "introduced"); if (p) { days.push(p.id); P.record(s, p, true, false); } }
  ok(new Set(days).size >= 5 && days.every((x, i) => !i || x !== days[i - 1]), "different problems on different days, never the same one twice running: " + days.join(" "));
  ok(s.practice.streak >= 8 && s.practice.favour === days.length, "right answers on consecutive days build a streak and earn favours");
  s.day = 20; ok(P.available(s, () => "introduced"), "a new day has a new problem"); const p2 = P.pick(s, () => "introduced"); P.record(s, p2, true, true); ok(P.available(s, () => "introduced") === null, "one problem a day");
  ok(s.practice.favour === days.length, "a walked-through answer earns no favour"); }
process.exit(fail ? 1 : 0);
