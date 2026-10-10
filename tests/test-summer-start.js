// SM3: Summer day 1 starts from Spring's closing record (closed["ch1/spring"].next), or from the canonical heir when there is none.
// By hand: the heir owes Ezra 100 and the Crown 1250 and holds 8 cash (tests/golden/heir-ch1-spring.json); a careful Spring run's Summer day 1 shows that run's own cash and debts.
// Run: node tests/test-summer-start.js
global.window = global; const S = require("../core/engine.js"), Bot = require("../core/bot.js"); require("../core/books.js");
const Save = require("../core/save.js"); let fail = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
function fakeStore(init) { const m = Object.assign({}, init); return { m, getItem: k => k in m ? m[k] : null, setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; }
Save._use({ store: fakeStore(), clock: () => "2026-10-10T10:00:00.000Z" });
const owe = (s, k) => -s.bal[k];
{ const h = Save.startFrom("ch1/spring"), s = S.newGame({ carry: h });
  ok(h.ending === "heir" && s.bal.cash === 8 && owe(s, "loan") === 100 && owe(s, "crown") === 1250, "no Spring record: Summer day 1 takes the heir (cash 8, Ezra 100, Crown 1250)");
  ok(s.trust.maud === 2 && s.trust.ashby === 4 && s.carried === "ch1/spring", "the heir's relations carry over (Maud 2, Ashby 4)"); }
{ const g = S.newGame({ story: true, seed: 3 }); let n = 0; while (!g.over && n++ < 40) { Bot.careful.day(g); S.sleep(g); }
  Save.closeSeason("ch1/spring", g, { examPassed: false, score: 0, attempts: 0 });
  const rec = Save.startFrom("ch1/spring"), s = S.newGame({ carry: rec });
  ok(rec.ending !== "heir" && s.bal.cash === Math.round(g.bal.cash), `careful run: Summer day 1 cash ${s.bal.cash} equals Spring's closing cash ${Math.round(g.bal.cash)}`);
  ok(owe(s, "loan") === -g.bal.loan && owe(s, "crown") === -g.bal.crown, "careful run: Summer day 1 debts equal Spring's closing debts (Ezra, Crown)");
  ok(Object.keys(rec.flags).every(k => s.flags[k] === rec.flags[k]), "flags carry over");
  const sum = Object.values(s.bal).reduce((a, b) => a + b, 0); ok(Math.abs(sum) < 1e-9, "the opening books still balance"); }
process.exit(fail ? 1 : 0);
