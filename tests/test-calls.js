// Creative calls 1-5 (docs/TASKS-season1.md): letter order, clue-card length, Market Day days. Run: node tests/test-calls.js
global.window = global; const S = require("../engine.js"), B = require("../books.js"); global.Spring = S; global.Books = B; global.Transcript = require("../transcript.js"); global.Verbs = {}; global.Endings = require("../endings.js");
require("../cast.js"); require("../scenes.js"); const M = require("../market.js"); require("../story.js"); const Story = window.Story, SC = window.Scenes, C = window.Cast;
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const wc = x => String(x).trim().split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w)).length;
// 4. Market Day: 7, 14, 21 only
ok([7, 14, 21].every(d => M.isDay(d, {})) && ![8, 22, 27, 28].some(d => M.isDay(d, {})) && !M.isDay(28, { finaleDone: false }), "Market Day is on days 7, 14 and 21 only; day 28 is the Court");
// 3. clue cards: title + number + source, 12 words at most
{ const long = [["A very long title about something quite important indeed", "Net income 1,254 after wages and interest and depreciation and so on", "Day 14 · Steward Corvin Vane in the square at dawn"], ["Money now vs money later (time value)", "2% vs 3.5% a week", "Day 9 · Tomas's terms"]];
  ok(long.every(l => { const c = Story.tidyClue(...l); return wc(c.term) + wc(c.num) + wc(c.from) <= 12 && c.term; }), "any clue card is trimmed to 12 words in all, keeping the title and the number");
  const cards = SC.SC.filter(x => x.card).map(x => { const from = `Day ${x.from} · ${C.short(x.who)}`, t = Story.tidyClue(x.card[0], x.card[1], from); return { id: x.id, t, from, same: t.term === x.card[0] && t.num === x.card[1] }; });
  ok(cards.length >= 6 && cards.every(c => c.same && wc(c.t.term) + wc(c.t.num) + wc(c.from) <= 12), `all ${cards.length} scene clue cards are authored to fit (title + number + source <= 12 words)`); }
// 2. letters: in the order you found them (by day); "The thing I signed" always last
{ const s = S.newGame({ story: true }); Story.init({ s, goal() {}, save() {} }, { pages: [8, 3, 5, 9, 6], pageDays: { 3: 12, 5: 1, 6: 20, 9: 12, 8: 28 }, clues: [], notebook: [], weeks: [] });
  const o = Story.letterOrder(); ok(o.join() === "5,3,9,6,8", `letters by day found, the last always last: ${o} (days 1, 12, 12, 20, then the Court)`); }
process.exit(fail ? 1 : 0);
