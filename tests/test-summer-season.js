// SM2: Summer's settings are data. Checks are hand calculations, not the file's own formulas re-derived.
// By hand: tally 120 x 10 = 1200 face; 6 weeks x 3% = 18% off -> 984. Water bill 60 x (1.08^2 - 1) = 9.984. Unit cost before (500 + 10 x 50) / 50 = 20; after (700 + 8 x 100) / 100 = 15.
// Demand q(8) = 92 - 48 = 44; elasticity = 6 x 8 / 44 = 1.0909; revenue peak price = 92 / 12 = 7.67.
// Run: node tests/test-summer-season.js
global.window = global; const S = require("../core/engine.js"), Season = S.Season, Su = require("../chapters/ch1/summer/season.js");
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const near = (a, b, e) => Math.abs(a - b) <= e;
ok(Season.list().includes("ch1/summer") && Season.current === "ch1/spring", "Summer is registered as ch1/summer; Spring stays active at load");
Season.use("ch1/summer"); ok(Season.current === "ch1/summer" && S.R.days === 28 && S.R.king.sacks === 120, "Season.use('ch1/summer') makes Summer active (28 days, King's order 120 sacks)");
{ const k = Su.king, face = k.sacks * k.price, weeks = k.tallyDays / 7; ok(face === 1200 && weeks === 6 && near(face * (1 - weeks * k.tallyDiscount), 984, 1e-9), "tally: face 1200, 42 days = 6 weeks, sold at 984"); }
{ const w = Su.waterBill; ok(near(w.principal * (Math.pow(1 + w.interestRate, w.yearsUnpaid) - 1), 9.984, 1e-9), "water bill interest is 9.984 on 60 for 2 years at 8%"); }
{ const m = Su.millWing, uc = x => (x.fixed + x.varCost * x.volume) / x.volume; ok(uc(m.before) === 20 && uc(m.after) === 15, "mill wing: unit cost 20 before, 15 after (C4.03)"); }
{ const d = Su.demand, q = d.a - d.b * d.refPrice, e = d.b * d.refPrice / q; ok(q === 44 && near(e, 1.09, 0.005) && d.elasticity === -1.09, "demand: 44 sold at 8, elasticity -1.09 (C4.01 corrected)");
  ok(d.a / (2 * d.b) < d.refPrice, "revenue peaks below the reference price, so a price rise loses revenue"); }
ok(Su.testPlot.goodOdds > 0 && Su.testPlot.goodOdds < 1 && Su.buyerTerms.days === 14, "test-plot odds are a probability; buyers ask 14 days");
Season.use("ch1/spring"); ok(S.R.days === 28 && S.R.seedCost === 12 && !S.R.king, "switching back restores Spring (no King's order in R)");
process.exit(fail ? 1 : 0);
