// SM1: the engine reads the active season from a registry (Spring.Season), not from Spring's file at load.
// By hand: a season with days 7 ends when the player sleeps through day 7 (core/engine.js: sleep, d >= R.days); Spring stays 28.
// Run: node tests/test-season-registry.js
global.window = global; const S = require("../core/engine.js"), Season = S.Season;
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const spring = Object.assign({}, S.R);
ok(Season.current === "ch1/spring" && S.R.days === 28 && Season.list().includes("ch1/spring"), "Spring is registered as ch1/spring and active at load (28 days)");
Season.register("test/short", Object.assign({}, spring, { days: 7, market: [8, 8, 8, 8, 8, 8, 8] }));
Season.use("test/short");
ok(Season.current === "test/short" && S.R.days === 7, "Season.use switches the active season; S.R.days is 7");
{ const s = S.newGame({}); let n = 0; while (!s.over && n < 40) { S.sleep(s); n++; }
  ok(s.over === true && s.day === 7, `the engine ends the season on day 7 (day ${s.day}, ${n} nights slept)`); }
ok(S.marketOutlook(Object.assign(S.newGame({}), { day: 6 })).length === 1, "the market outlook stops at the season's last day (day 6 of 7 sees day 7 only)");
Season.use("ch1/spring");
ok(S.R.days === 28 && S.R.seedCost === 12 && S.R.pigDay === 9, "switching back restores Spring's settings (28 days, seed 12, pig night 9)");
{ const s = S.newGame({}); let n = 0; while (!s.over && n < 60) { S.sleep(s); n++; } ok(s.over === true && s.day === 28, `Spring still ends on day 28 (day ${s.day})`); }
let threw = false; try { Season.use("nope/none"); } catch (e) { threw = true; } ok(threw && Season.current === "ch1/spring", "an unknown season id throws and leaves the active season alone");
process.exit(fail ? 1 : 0);
