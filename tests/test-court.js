// The Reeve's Court: every claim is built from the player's own statements, and a right card always exists. Run: node tests/test-court.js
global.window = global; global.location = { search: "" }; global.document = { readyState: "complete", addEventListener() {} };
const S = require("../engine.js"), B = require("../books.js"); global.Spring = S; global.Books = B; const Bot = require("../bot.js"); require("../court.js"); const C = window.Court;
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const flags = { guarantee: true, hobbExt: true, vane: "asked", craneVane: true }, clues = [{ id: "g", term: "Guarantee for Ashby's bakery", number: null, source: "Ashby" }, { id: "d", term: "Mortgage payable on demand", number: null, source: "Vane" }];
let books = 0, bad = [], unreachable = [], fresh = 0;
for (const bot of [Bot.careful, Bot.reckless, Bot.sprinkler, Bot.overtrader, Bot.noDuke]) {
  const s = S.newGame({ story: false }); for (let d = 1; d <= 28 && !s.outcome; d++) { bot.day(s); S.sleep(s); } const st = B.close(s); books++;
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const r = C.build({ statements: st, clues, flags, trust: { crane: 4 }, seed, facts: { ratePct: 3.5, market: 8 } });
    if (r.claims.length !== 8) bad.push(`${bot.name} seed ${seed}: ${r.claims.length} claims`);
    const ids = r.claims.map(c => c.id); if (new Set(ids).size !== ids.length) bad.push("duplicate claim");
    for (const c of r.claims) {
      if (/undefined|NaN|\[object|\$\{/.test(c.text + c.maud + c.crane + c.press.map(p => p.t).join())) bad.push(`${c.id}: bad text`);
      const pool = r.cards.concat(c.reveal ? [c.reveal] : []).concat([{ id: "found:rate", tab: "found", label: "Ezra's rate" }]), right = pool.filter(k => c.right(k));
      if (!right.length) unreachable.push(`${bot.name}/${c.id}`);
      // a wrong answer exists too (the claim isn't refuted by everything)
      if (right.length === pool.length) bad.push(`${c.id}: every card refutes it`);
    }
    // the numbers quoted in the claim come from the books
    const q = r.claims.find(c => c.id === "profitCash"); if (!q || !q.text.includes(String(st.is.net))) bad.push(`${bot.name} seed ${seed}: the profit claim doesn't quote the player's own net income ${st.is.net}`);
    if (seed === 1) { const o = C.build({ statements: st, clues, flags, trust: {}, seed: 99 }); fresh += o.claims.map(c => c.id).join() !== r.claims.map(c => c.id).join() ? 1 : 0; }
  }
}
ok(bad.length === 0, "5 bot seasons x 6 seeds: 8 distinct claims each, no undefined text, no card that refutes everything" + (bad.length ? " :: " + bad.slice(0, 4).join(" | ") : ""));
ok(unreachable.length === 0, "every claim has at least one card that refutes it (from the statements, clues, a press reveal or Ezra)" + (unreachable.length ? " :: " + unreachable.slice(0, 4).join(", ") : ""));
ok(fresh > 0, "a retake (different seed) brings a different set or order of claims");
{ const s = S.newGame({ story: false }); for (let d = 1; d <= 28 && !s.outcome; d++) { Bot.careful.day(s); S.sleep(s); } const st = B.close(s);
  const none = C.build({ statements: st, clues: [], flags: {}, trust: {}, seed: 1 }); ok(none.claims.length === 8, "with no clues and no flags there are still 8 claims (the story flags only add)");
  const mg = none.claims.find(c => c.id === "margin"); if (mg) { const gm = Math.round(st.is.gross / st.is.revenue * 100); ok(mg.right(none.cards.find(k => k.id === "is:gm")) && !mg.right(none.cards.find(k => k.id === "is:net")) && none.cards.find(k => k.id === "is:gm").raw === gm, `margin claim: the right card is Gross margin (${gm}%), computed from the Income statement`); }
  const pc = none.claims.find(c => c.id === "profitCash"); if (pc) ok(pc.right(none.cards.find(k => k.id === "cf:change")) && !pc.right(none.cards.find(k => k.id === "is:net")), "profit-is-not-cash: the Cash-flow lines refute it, the Income-statement line doesn't"); }
// Maud speaks in at most two sentences a box; Crane in "Item:" sentences
{ const sent = x => x.replace(/<[^>]+>/g, "").split(/(?<=[.?!])\s+/).filter(Boolean).length, long = [], nocr = [];
  for (const bot of [Bot.careful, Bot.reckless]) { const s = S.newGame({ story: false }); for (let d = 1; d <= 28 && !s.outcome; d++) { bot.day(s); S.sleep(s); } const st = B.close(s);
    for (let seed = 1; seed <= 4; seed++) for (const c of C.build({ statements: st, clues, flags, trust: {}, seed }).claims) { if (sent(c.maud) > 2) long.push(c.id + ":maud(" + sent(c.maud) + ")"); c.press.filter(p => p.w === "maud").forEach(p => { if (sent(p.t) > 2) long.push(c.id + ":press"); }); if (!/^Item:/.test(c.crane)) nocr.push(c.id); } }
  ok(long.length === 0, "every Maud box is at most two sentences" + (long.length ? " :: " + [...new Set(long)].join(", ") : "")); ok(nocr.length === 0, "Crane's testimony starts with 'Item:'" + (nocr.length ? " :: " + [...new Set(nocr)].join(", ") : "")); }
process.exit(fail ? 1 : 0);
