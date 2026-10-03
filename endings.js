// Spring at Thornfield — WS6: Crane's standing offer (M3), the four endings, their epilogues and what each one unlocks.
// Pure JS, no DOM: runs in the browser (window.Endings) and under node (tests/test-offer.js). Resolves Spring/Bot lazily.
// Design: SEASON-1-REDESIGN.md §2 (endings) and §3 M3. The offer is a Reigns-style binary choice with a ticking price
// (Reigns, Nerial 2016); each ending unlocks a journal page or letter that a later game can read, the Hades pattern
// (a loss still progresses something).
//
// THE OFFER PRICE (documented, tested in tests/test-offer.js):
//   price = max(150, round( max(0, equity) + 300 - 10 * daysInGap ))
//   equity    = Owner's equity on the balance sheet today (negative for most of the season, so it adds 0 until you prosper)
//   daysInGap = how many of the next 14 days the cash forecast shows Cash below zero (the "cash gap before Midwinter")
//   -> a healthy farm is offered 300 (rising a little with equity); a farm that is about to run dry is offered less, down to the 150 floor.
//   MERCY: when Cash is below the coming pay-day (wages + interest), Crane comes back with a lower "mercy" offer:
//   mercy = max(100, round(price * 0.6)). He is bargaining from your weakness.
// THE SOLD-OUT EPILOGUE compares what you took with what the books say the farm would have been worth on day 28
// if played carefully: it runs the careful bot (bot.js) from today's state on a deep copy and reads the Crown fund
// (Spring.crownFund: Cash + receivables + inventory - payables - loan - deposits). Tag: C0.01 time value, C1.01 equity.
(function (root) {
  const SP = () => root.Spring || require("./engine.js"), BT = () => root.Bot || require("./bot.js");
  const MIN_PRICE = 150, MERCY_FLOOR = 100, MERCY_SHARE = 0.6;

  function daysInGap(s) { // days in the next 14 where Cash is forecast below zero, doing nothing else
    const rows = SP().forecast(s, 14); return rows.filter(r => r.close < 0).length;
  }
  function offer(s) {
    const S = SP(), b = S.balanceSheet(s.bal), gap = daysInGap(s), eq = Math.max(0, b.equity);
    const base = Math.max(MIN_PRICE, Math.round(eq + 300 - 10 * gap));
    const mercy = s.bal.cash < S.weekBills(s), price = mercy ? Math.max(MERCY_FLOOR, Math.round(base * MERCY_SHARE)) : base;
    return { price, base, mercy, daysInGap: gap, equity: b.equity, cash: s.bal.cash, wages: S.weekBills(s) };
  }
  // What the books say the farm is worth on day 28 if the rest of the season is played carefully, from this state.
  function carefulFrom(s) {
    const S = SP(), c = JSON.parse(JSON.stringify(s)); c.quiet = false; c.story = false; c.over = false; c.outcome = null; let n = 0;
    try { while (!c.over && n++ < 40) { BT().careful.day(c); S.sleep(c); } } catch (e) { return null; }
    const f = S.crownFund(c); return { net: f.net, gap: f.gap, verdict: c.outcome === "insolvent" ? "insolvent" : f.verdict, crown: f.crown, cash: c.bal.cash };
  }
  function soldOut(s, price) {
    const careful = carefulFrom(s), R = SP().R;
    return { price, careful, worth: careful ? careful.net : null, crown: R.crownDebt, day: s.day, tags: ["C0.01", "C1.01"] };
  }
  // Which ending a finished game earns: sold (took Crane's offer), seized (insolvent, or the Crown takes it), bridged (Ezra carries you), free (the Crown is paid).
  function ending(s) {
    if (s.sold) return "sold"; if (s.outcome === "insolvent") return "seized";
    const v = SP().crownFund(s).verdict; return v === "paid" ? "free" : v === "short" ? "seized" : "bridged";
  }
  const n = v => Math.abs(v).toLocaleString("en-US");
  // Each epilogue: 3-4 short lines, every number from game state (ctx = {s, farm, sold}); unlock = a journal page or a letter for the next game.
  function epilogue(kind, ctx) {
    const S = SP(), s = ctx.s, farm = ctx.farm || "Thornfield", f = S.crownFund(s), R = S.R;
    const T = {
      sold: () => { const so = ctx.sold || soldOut(s, offer(s).price);
        return { title: "Sold out", lines: [
          `Crane counts ${n(so.price)} onto the table and stamps the deed. ${farm} is the Duke's by supper.`,
          so.worth != null ? `Run carefully, the books say ${farm} would have held ${n(so.worth)} on day 28 against the Crown's ${n(so.crown)}${so.careful.gap >= 0 ? ", with " + n(so.careful.gap) + " to spare" : ", " + n(so.careful.gap) + " short"}.` : `Run carefully, ${farm} might have paid the Crown's ${n(so.crown)}.`,
          `You took ${n(so.price)} today. Money now against the farm later: the offer was always lower than the farm.`,
          `Steward Vane watches from the gate. A farm sold on day ${s.day} is a farm he did not have to wait for.`] }; },
      seized: () => ({ title: "Seized", lines: [
          s.outcome === "insolvent" ? `Day ${s.day}: ${s.why || "the chest ran dry"}` : `On day 28 ${farm} is ${n(f.gap)} short of the Crown's ${n(R.crownDebt)}.`,
          `The Crown's men change the lock. Profit was in the Ledger; the Cash was in other people's purses.`,
          `It is Edric's ending. Edric did not know it was Corvin's plan. You will.`] }),
      bridged: () => ({ title: "Bridged", lines: [
          `${farm} is ${n(f.gap)} short of the Crown's ${n(R.crownDebt)}. Ezra writes the gap into a new note: about ${n(f.bridge)} a week.`,
          `The farm survives, in his debt, and every week of that interest comes out of next year's profit.`,
          `Steward Vane tips his hat. A farm in debt is a farm that can be bought next spring.`] }),
      free: () => ({ title: "Free", lines: [
          `The Crown is paid: ${n(f.net)} against ${n(R.crownDebt)}${f.gap > 0 ? ", with " + n(f.gap) + " to spare" : ""}. ${farm} is yours.`,
          `You watched the chest, not the Ledger. Edric's last page was right.`,
          `Steward Vane will answer for the Duke's order before the magistrate: The Audit (coming).`,
          `"Summer is long, heir," says Corvin. "Your busiest month is coming."`] }),
    };
    const e = T[kind](); e.kind = kind; e.unlock = UNLOCKS[kind]; return e;
  }
  const UNLOCKS = {
    sold: { id: "letter-maud", kind: "letter", term: "A letter from Maud", text: "You can sell the roof and keep the lesson, heir. The price Crane names is the price of your fear. Next time, count before you decide. — Maud" },
    seized: { id: "page-lastspring", kind: "page", term: "Edric's page: the last spring", text: "I watched the Ledger every night and it said I was fine. I should have watched the chest. — E." },
    bridged: { id: "letter-ezra", kind: "letter", term: "A letter from Ezra", text: "A debt is a rope. It will hold you up, or it will hang you. I lend; I do not forgive. Read your forecast. — Ezra" },
    free: { id: "page-freespring", kind: "page", term: "Edric's page: if someone reads this", text: "If you are reading this you read the right book. The order came every spring, and every spring a Vane was behind it. — E." },
  };
  // unlocks persist across games in localStorage (a Map in memory under node)
  const KEY = "lc_unlocks_v1"; let mem = {};
  const store = { get: () => { try { return root.localStorage ? JSON.parse(root.localStorage.getItem(KEY)) || {} : mem; } catch (e) { return mem; } },
    set: d => { try { if (root.localStorage) root.localStorage.setItem(KEY, JSON.stringify(d)); else mem = d; } catch (e) { mem = d; } } };
  function unlock(kind) { const u = UNLOCKS[kind]; if (!u) return null; const d = store.get(); const fresh = !d[u.id]; d[u.id] = { kind: u.kind, term: u.term, text: u.text, ending: kind }; store.set(d); return { u, fresh }; }
  const unlocked = () => Object.entries(store.get()).map(([id, v]) => Object.assign({ id }, v));
  root.Endings = { MIN_PRICE, offer, daysInGap, soldOut, carefulFrom, ending, epilogue, unlock, unlocked, UNLOCKS };
  if (typeof module !== "undefined") module.exports = root.Endings;
})(typeof window !== "undefined" ? window : globalThis);
