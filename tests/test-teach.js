// The teaching and stakes layer: books preview, emergency loan, post-mortem, notices, frost pile-up. Run: node tests/test-teach.js
const S = require("../engine.js"), B = require("../books.js"); let fail = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const upTo = (s, d) => { while (s.day < d && !s.over) S.sleep(s); };
// --- preview
{ const s = S.newGame(), j0 = s.journal.length, cash0 = s.bal.cash, p = S.preview(s, c => S.borrow(c, 50));
  ok(p.ok && p.entries.length === 1 && p.entries[0].type === "borrow" && p.cash[0] === cash0 && p.cash[1] === cash0 + 50 && p.dLiab === 50 && p.dNet === 0, "preview of a loan: Cash +50, Liabilities +50, Net income unchanged");
  ok(s.journal.length === j0 && s.bal.cash === cash0 && s.bal.loan === -100, "preview changes nothing in the real game");
  const q = S.preview(s, c => S.buyFence(c)); ok(q.ok && q.dNet === -S.R.fenceCost && q.dAssets === -S.R.fenceCost, "preview of a fence: an expense, Net income falls by its cost");
  const bad = S.preview(s, c => { c.bal.cash = 0; return S.buySprinkler(c); }); ok(!bad.ok && bad.msg, "a preview of something you can't do reports why"); }
// --- emergency loan
{ const s = S.newGame(); S.buySeeds(s, 16); upTo(s, 7); S.sleep(s);
  ok(!s.over && s.rescued && s.bal.loan < -100, "can't cover the first pay-day: Ezra lends once instead of ending the game");
  ok(S.terms(s).rateBp > 300, "and his rate is now higher (" + S.terms(s).rateBp + " bp)");
  { const t = S.newGame(); const before = t.trust.ezra; S.rescue(t, 10); ok(t.trust.ezra === before - 2, "the rescue costs Ezra's trust: " + before + " -> " + t.trust.ezra); }
  { const base = S.terms(s).rateBp; s.rateAdj = 75; ok(S.terms(s).rateBp === base - 75, "the story's forecast discount (rateAdj) does not erase the rescue penalty"); s.rateAdj = 0; }
  const st = B.close(s); ok(st.balanced && st.cf.reconciles, "statements still balance and reconcile");
  const t = S.newGame(); S.buySeeds(t, 16); t.rescued = true; upTo(t, 7); S.sleep(t); ok(t.over && t.outcome === "insolvent", "he won't do it twice: the second shortfall is insolvency"); }
// --- post-mortem
{ const s = S.newGame(); S.buySeeds(s, 16); s.rescued = true; upTo(s, 7); S.sleep(s); const pm = B.postmortem(s);
  ok(pm.lines.length >= 1 && pm.lines.some(l => /emergency loan/.test(l)) && typeof pm.advice === "string" && pm.advice.length > 10, "post-mortem names what happened and what to try"); }
// --- notices
{ const s = S.newGame(); upTo(s, 2); const n = S.notice(s); ok(n && n.id === "tinker" && n.options.length === 3, "day 2: the tinker's seed cart is on the board");
  const blind = JSON.parse(JSON.stringify(s)); ok(S.answerNotice(blind, 0).ok && blind.seeds === 4 && blind.bal.cash === s.bal.cash - 60 && blind.bal.losses === 24, "buying blind: 4 usable packets for 60 and a 24 write-off");
  const insp = JSON.parse(JSON.stringify(s)); ok(S.answerNotice(insp, 1).ok && insp.seeds === 4 && insp.bal.cash === s.bal.cash - 45, "inspecting first: the same 4 packets for 45 in all");
  for (const c of [blind, insp]) { const st = B.close(c), inv = c.sacks * 4 + c.seeds * 12 + c.plots.filter(p => p.crop).length * 12; ok(st.balanced && st.cf.reconciles && inv === c.bal.inv, "balanced, reconciled, and Inventory still matches sacks, seed and crops at cost"); }
  ok(S.notice(blind) === null, "each notice can only be answered once"); }
{ const s = S.newGame(); upTo(s, 6); s.sacks = 12; const n = S.notice(s); ok(n.id === "trader" && S.answerNotice(s, 0).ok && s.sacks === 3, "day 6: the trader buys up to 9 spare sacks"); }
{ const s = S.newGame(); upTo(s, 12); S.buySeeds(s, 1); s.plots.filter(p => p.tilled && !p.crop).slice(0, 2).forEach(p => p.crop = { age: 1, cost: 12 }); const before = s.plots.filter(p => p.crop).map(p => p.crop.age);
  s.bal.cash += 50; s.bal.capital -= 50; const growing = s.plots.filter(p => p.crop && p.crop.age < S.R.growDays); S.answerNotice(s, 0); S.sleep(s); ok(growing.length > 0 && growing.every(p => p.crop.age >= 2), "hired hands: every growing crop gains a day overnight"); }
{ const s = S.newGame(); const o = S.marketOutlook(s); ok(o.length === 3 && o[0].day === 2, "the board shows the next three days' prices"); }
// --- frost pile-up coaching
{ const s = S.newGame(), F = S.eventDay(s, "frost"); upTo(s, F - 3); const o = S.addOffer(s, "ashby", 18, 9, 0, 3, 3); S.accept(s, o.id); ok(new RegExp("Frost on day " + F).test(S.coach(s).text), "Maud warns when an order falls due around the frost (day " + F + ", read from the game)"); }
process.exit(fail ? 1 : 0);
