// T3b story critic fixes: Maud's boxes <= 2 sentences, Crane speaks only in "Item:" sentences, the time-value verdict uses whole coins the engine books, no "(coming)" text,
// the cash-book rows are one per day and add up. Run: node tests/test-t3b.js
global.window = global; const fs = require("fs"), S = require("../engine.js"), B = require("../books.js"); global.Spring = S; global.Books = B; global.Transcript = require("../transcript.js"); global.Verbs = {}; global.Endings = require("../endings.js");
require("../cast.js"); require("../scenes.js"); require("../story.js"); const Story = window.Story, Bot = require("../bot.js");
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const sent = x => x.replace(/\$\{[^}]*\}/g, "N").replace(/<[^>]+>/g, "").replace(/\d\.\d/g, "d").split(/(?<=[.?!])\s+(?=[A-Z"“'‘(])/).filter(s => s.trim().length > 2);
const grab = (file, re) => { const out = []; fs.readFileSync(file, "utf8").split("\n").forEach((ln, i) => { let m; re.lastIndex = 0; while ((m = re.exec(ln))) out.push([`${file}:${i + 1}`, m[1].slice(1, -1)]); }); return out; };
const STR = "(`(?:[^`\\\\]|\\\\.)*`|\"(?:[^\"\\\\]|\\\\.)*\")";
// Maud: at most two sentences a box
{ const re = new RegExp("(?:\\btell\\(|G\\.say\\(\"maud\",\\s*|sayP\\(\"maud\",\\s*|c\\.maud\\(|maud:\\s*|say\\(\"maud\",\\s*)" + STR, "g"), long = [];
  for (const f of ["../story.js", "../scenes.js"]) grab(__dirname + "/" + f, re).forEach(([w, t]) => { if (sent(t).length > 2) long.push(w + " " + sent(t).length); });
  ok(long.length === 0, "every Maud box in story.js and scenes.js is at most two sentences" + (long.length ? " :: " + long.join(", ") : "")); }
// Crane: every sentence he says starts with "Item:"
{ const bad = [], re1 = new RegExp("G\\.say\\(\"crane\",\\s*" + STR, "g"), pieces = [];
  grab(__dirname + "/../story.js", re1).forEach(x => pieces.push(x)); const sc = fs.readFileSync(__dirname + "/../scenes.js", "utf8").split("\n");
  sc.forEach((ln, i) => { const m = /c\.lines\("crane",\s*\[(.*)\]\)/.exec(ln); if (m) (m[1].match(/"(?:[^"\\]|\\.)*"/g) || []).forEach(t => pieces.push([`scenes.js:${i + 1}`, t.slice(1, -1)])); });
  const C = window.Cast.WHO.crane; [].concat(C.greet, C.low, C.rich, C.rain || []).forEach(t => pieces.push(["cast greet", t])); C.topics.forEach(tp => tp.lines.forEach(t => pieces.push(["cast " + tp.id, t])));
  pieces.forEach(([w, t]) => { if (/\$\{/.test(t) && !/^`?Item/.test(t) && /intro/.test(t)) return; const ss = sent(t); if (ss.some(x => !/^Item:/.test(x.trim()))) bad.push(w + " " + t.slice(0, 40)); });
  ok(bad.length === 0, `all ${pieces.length} of Crane's lines are in "Item:" sentences` + (bad.length ? " :: " + bad.slice(0, 5).join(" | ") : "")); }
// no "(coming)" in anything a player reads
{ const bad = ["../story.js", "../game.js", "../endings.js", "../scenes.js", "../cast.js", "../court.js"].filter(f => fs.existsSync(__dirname + "/" + f)).filter(f => /\(coming\)/.test(fs.readFileSync(__dirname + "/" + f, "utf8").replace(/\/\/.*$/gm, ""))); ok(bad.length === 0, "no '(coming)' text in player-facing strings" + (bad.length ? " :: " + bad : "")); }
// the time-value verdict: whole coins, the discount is the one the engine books, and it can flip when the rate moves
{ const mk = trustE => { const s = S.newGame({ story: true }); s.trust.ezra = trustE; s.trust.tomas = 6; S.buySeeds(s, 9, true); return s; };
  const res = []; for (const e of [0, 4, 8, 10]) { const s = mk(e); Story.init({ s, goal() {}, save() {} }, null); const bill = s.bills[s.bills.length - 1], F = Story.tvmFacts(bill); res.push([e, S.terms(s).rateBp, F.discX, F.carryX, F.cheaper]);
    if (!(Number.isInteger(F.discX) && Number.isInteger(F.carryX) && F.discX === bill.disc)) ok(false, `trust ${e}: discount ${F.discX} vs booked ${bill.disc}, carry ${F.carryX}`); }
  ok(res.every(r => Number.isInteger(r[2]) && Number.isInteger(r[3])), "discount and the carry cost are whole coins (the same rounding the engine books)");
  ok(new Set(res.map(r => r[4])).size > 1, "the cheaper way flips as Ezra's rate moves: " + res.map(r => `rate ${r[1] / 100}% -> ${r[4]}`).join(", ")); }
// the cash book: one row per day, Net income and Cash cleared match the books, tied up = Inventory + Receivables - Payables - Deposits
{ const s = S.newGame({ story: false }); for (let d = 1; d <= 22; d++) { Bot.careful.day(s); S.sleep(s); } const rows = Story.cashBookRows(s), days = rows.map(r => r.day), st = B.close(s), b = S.balanceSheet(s.bal), last = rows[rows.length - 1];
  ok(new Set(days).size === days.length && days.join() === [7, 14, 21, s.day].filter((d, i, a) => a.indexOf(d) === i).join(), `one row per day: ${days}`);
  ok(last.ni === st.is.net && last.tied === b.inv + b.ar - b.ap - b.deposits, `last row: profit ${last.ni} = Net income ${st.is.net}, tied up ${last.tied} = Inventory ${b.inv} + Receivables ${b.ar} - Payables ${b.ap} - Deposits ${b.deposits}`); }
process.exit(fail ? 1 : 0);
