// Spring at Thornfield — WS6: Crane's standing offer (M3), the four endings, their epilogues and what each one unlocks.
// Pure JS, no DOM: runs in the browser (window.Endings) and under node (tests/test-offer.js). Resolves Spring lazily.
// Design: SEASON-1-REDESIGN.md §2 (endings) and §3 M3. The offer is a Reigns-style binary choice with a ticking price
// (Reigns, Nerial 2016); each ending unlocks a journal page or letter that a later game can read, the Hades pattern
// (a loss still progresses something).
//
// THE OFFER PRICE (documented, tested in tests/test-offer.js):
//   price = max(150, round( 300 + max(0, opCash) / 2 - 10 * daysInGap ))
//   opCash    = Cash the farm's operations have cleared this spring so far (every Cash line except the opening chest, equipment, and loans in and out)
//   daysInGap = how many of the next 14 days the cash forecast shows Cash below zero (the "cash gap before Midwinter")
//   -> the price RISES with what the farm actually earns in Cash (the more it clears, the more Vane has to offer) and FALLS with desperation (every day the chest is forecast
//      empty costs 10), never below the 150 floor. It deliberately does not use book equity: equity is what the books say, not what the farm can earn.
//   MERCY: when Cash is below the coming pay-day (wages + interest), Crane comes back with a lower "mercy" offer:
//   mercy = max(100, round(price * 0.6)). He is bargaining from your weakness.
// THE SOLD-OUT EPILOGUE does not claim the offer was too low. It sets the offer beside what the farm EARNS (the Cash it cleared this spring, or its profit while that is still in grain and invoices) and beside book equity, because
// a business is worth the Cash it will keep earning, and the land (the millstream Vane wants) is not on the books at all. Tag: C0.01 time value, C1.01 equity.
(function (root) {
  const SP = () => root.Spring || require("./engine.js");
  const MIN_PRICE = 150, MERCY_FLOOR = 100, MERCY_SHARE = 0.6;

  function daysInGap(s) { // days in the next 14 where Cash is forecast below zero, doing nothing else
    const rows = SP().forecast(s, 14); return rows.filter(r => r.close < 0).length;
  }
  // Cash cleared by operations so far: every Cash line outside the opening chest, equipment, and loans in and out (the same split the cash-flow statement uses)
  const opCash = s => s.journal.filter(j => ["open", "equip", "borrow", "repay"].indexOf(j.type) < 0).reduce((a, j) => a + (j.lines.cash || 0), 0);
  function offer(s) {
    const S = SP(), b = S.balanceSheet(s.bal), gap = daysInGap(s), earned = opCash(s);
    const base = Math.max(MIN_PRICE, Math.round(300 + Math.max(0, earned) / 2 - 10 * gap));
    const mercy = s.bal.cash < S.weekBills(s), price = mercy ? Math.max(MERCY_FLOOR, Math.round(base * MERCY_SHARE)) : base;
    return { price, base, mercy, daysInGap: gap, equity: b.equity, earned, cash: s.bal.cash, wages: S.weekBills(s) };
  }
  // What the farm EARNS, honestly: Cash cleared by operations when that is positive; otherwise this spring's profit (Net income), which for most of a season is still sitting
  // in grain and invoices (a careful season's operating Cash is often below zero until the Duke pays). basis says which one the line is about.
  function soldOut(s, price) {
    const S = SP(), b = S.balanceSheet(s.bal), cash = opCash(s), profit = b.ni, basis = cash > 0 ? "cash" : profit > 0 ? "profit" : "none", amount = basis === "cash" ? cash : basis === "profit" ? profit : 0;
    return { price, earned: amount, basis, cash, profit, equity: b.equity, springs: amount > 0 ? Math.round(price / amount * 10) / 10 : null, day: s.day, tags: ["C0.01", "C1.01"] };
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
          so.basis === "cash" ? `The books list ${farm}'s equity at ${so.equity < 0 ? "-" : ""}${n(so.equity)}, but the farm cleared ${n(so.earned)} in Cash this spring alone. A farm that earns that is worth what it keeps earning, and the land isn't on the books at all.`
            : so.basis === "profit" ? `The books list ${farm}'s equity at ${so.equity < 0 ? "-" : ""}${n(so.equity)}, but the farm earned ${n(so.earned)} this spring, most of it still in grain and invoices. A farm that earns that is worth what it keeps earning, and the land isn't on the books at all.`
            : `The books list ${farm}'s equity at ${so.equity < 0 ? "-" : ""}${n(so.equity)}, and the farm had not yet earned a profit. But a farm is worth what it will go on earning, and the land (the millstream Vane wants) isn't on the books at all.`,
          so.springs != null ? `You took ${n(so.price)}: about ${so.springs} springs of this spring's ${so.basis === "cash" ? "Cash" : "profit"}, paid today. Whether that was fair depends on what the farm earns next, not on the books.` : `You took ${n(so.price)} today. Whether that was fair depends on what the farm earns next, not on the books.`,
          `Corvin Vane watches from the gate. A farm sold on day ${s.day} is a farm he did not have to wait for.`] }; },
      seized: () => ({ title: "Seized", lines: [
          s.outcome === "insolvent" ? `Day ${s.day}: ${s.why || "the chest ran dry"}` : `On day 28 ${farm} is ${n(f.gap)} short of the Crown's ${n(R.crownDebt)}.`,
          `The Crown's men change the lock. Profit was in the Ledger; the Cash was in other people's purses.`,
          `It is Edric's ending. Edric did not know it was Corvin's plan. You will.`] }),
      bridged: () => ({ title: "Bridged", lines: [
          `${farm} is ${n(f.gap)} short of the Crown's ${n(R.crownDebt)}. Ezra writes the gap into a new note: about ${n(f.bridge)} a week.`,
          `The farm survives, in his debt, and every week of that interest comes out of next year's profit.`,
          `Corvin Vane tips his hat. A farm in debt is a farm that can be bought next spring.`] }),
      free: () => ({ title: "Free", lines: [
          `The Crown is paid: ${n(f.net)} against ${n(R.crownDebt)}${f.gap > 0 ? ", with " + n(f.gap) + " to spare" : ""}. ${farm} is yours.`,
          `You watched the chest, not the Ledger. Edric's last page was right.`,
          `Corvin Vane's second seal is on the table. He will answer for the Duke's order.`,
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
  root.Endings = { MIN_PRICE, offer, opCash, daysInGap, soldOut, ending, epilogue, unlock, unlocked, UNLOCKS };
  if (typeof module !== "undefined") module.exports = root.Endings;
})(typeof window !== "undefined" ? window : globalThis);
