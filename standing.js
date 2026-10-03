// Ledger & Crown — standing orders. The notice board posts one or two repeatable contracts a day from the village's regular buyers. They are practice you can play: each can be
// CHECKED first (margin on the price, what the best alternative sale pays, whether Cash can carry the seed, when the money arrives), then taken or passed. A good order, taken
// after the check, is real evidence in the transcript; a thin one (below the best alternative sale), a slow one (the Cash arrives too late) and one your Cash can't carry are
// the traps, and the verdict names which. Nothing here posts to the books: taking one creates an ordinary offer (Spring.addOffer) that is haggled and shipped like any other.
// Pure and deterministic (a hash of the day), so nothing extra needs saving beyond which ones you have already seen. The engine, bots and season tuning never see these.
window.Standing = (function () {
  const S = typeof Spring !== "undefined" ? Spring : window.Spring;
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0; return h; };
  const BUYERS = ["ashby", "hobb", "mira"];
  const KINDS = ["good", "good", "thin", "slow", "good"]; // 60% good, 20% thin, 20% slow
  const MIN_DAY = 3, MAX_DAY = 26;
  const state = s => (s.standing = s.standing || { seen: {}, well: 0, off: 0, log: [] });
  // the day's contracts (those you have already taken or passed are left out)
  function today(s, opts) {
    const day = s.day; if (day < MIN_DAY || day > MAX_DAY) return []; const st = state(s), mp = S.marketPrice(day), out = [], n = 1 + (hash(day + ":n") % 3 === 0 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const h = hash(day + ":" + k), who = BUYERS[h % BUYERS.length], kind = KINDS[(h >> 3) % KINDS.length], sid = "so" + day + "-" + k;
      let sacks = 6 + 3 * ((h >> 6) % 4), price, terms, dueIn = 5 + ((h >> 9) % 4);
      if (kind === "good") { price = mp; terms = 0; }
      else if (kind === "thin") { price = Math.max(S.R.unitCost + 1, mp - 2); terms = 0; sacks = Math.min(sacks, 12); }
      else { price = mp + 1; terms = 14; sacks = 15 + 3 * ((h >> 6) % 3); dueIn = Math.max(dueIn, 7); }
      if (st.seen[sid]) continue;
      out.push({ sid, who, kind, sacks, price, terms, dueIn, due: Math.min(S.R.days, day + dueIn), value: sacks * price });
    }
    return out;
  }
  // the numbers the check puts on the table, all from the player's own state
  function facts(s, o) {
    const R = S.R, cost = R.unitCost, floor = S.traderPrice(s.day), have = s.sacks + S.sacksComing(s), short = Math.max(0, S.committed(s) + o.sacks - have), packets = Math.ceil(short / R.sacksPerPlot), seed = packets * R.seedCost;
    const arrive = o.due + (o.terms || 0), cashAfter = s.bal.cash - seed, week = S.weekBills(s);
    return { cost, price: o.price, margin: Math.round((o.price - cost) / o.price * 100), floor, packets, seed, cashAfter, week, arrive, late: arrive > R.days, terms: o.terms || 0, sacks: o.sacks };
  }
  // did taking it make sense? thin = no better than the best alternative sale; slow = the Cash arrives after the season or the next pay-day finds the chest short; cant = the chest can't carry the seed
  function judge(s, o, f) {
    f = f || facts(s, o); const thin = o.price <= f.floor, cant = f.cashAfter < 0, slow = o.terms > 0 && (f.late || f.cashAfter < f.week);
    const why = [], tell = [];
    if (thin) { why.push("thin"); tell.push(`${o.price} is no better than the ${f.floor} the road trader pays for the same sack, so it gains you nothing over the sale you'd give up`); }
    if (cant) { why.push("cant"); tell.push(`the seed costs ${f.seed} and Cash is ${s.bal.cash}`); }
    if (slow) { why.push("slow"); tell.push(f.late ? `the Cash arrives on day ${f.arrive}, after the season ends` : `the Cash arrives on day ${f.arrive} and the next pay-day finds the chest at ${f.cashAfter} against ${f.week} of wages`); }
    return { well: !why.length, why, line: why.length ? `Not a good take: ${tell.join("; ")}.` : `A good take: ${f.margin}% margin, ${o.price} against the trader's ${f.floor}, and the chest carries it${o.terms ? `, with the Cash due day ${f.arrive}` : ""}.` };
  }
  function mark(s, sid, how) { const st = state(s); st.seen[sid] = how; st.log.push({ day: s.day, sid, how }); if (how === "well") st.well++; if (how === "off") st.off++; }
  return { today, facts, judge, mark, state, MIN_DAY, MAX_DAY, KINDS, BUYERS };
})();
