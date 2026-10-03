// WS6: the story's balance with Corvin's escalating orders (day 12: half of R.duke.sacks, day 15: the full R.duke.sacks, both on R.duke.terms),
// bots through a STORY-shaped game (offers on, the story's own Duke orders injected the way story.js does), the timeline's "tied up" line,
// and (item 9) the seeded events. Run: node tests/test-spine.js
const S = require("../engine.js"), Bot = require("../bot.js"); let fail = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const D = S.R.duke, C = S.R.corvin, first = C[0].sacks, second = C[1].sacks;
// A story-shaped game: no sandbox Duke on day 10 (engine skips it for story games); Corvin's two orders arrive like story.js's arrive(1)/arrive(2).
function storyGame(seed) { const s = S.newGame({ story: true, seed }); s.quiet = false; return s; }
function run(botName, seed) {
  const s = storyGame(seed), bot = Bot[botName]; let n = 0;
  while (!s.over && n++ < 40) {
    if (s.day === C[0].day) S.addOffer(s, "duke", first, D.price, D.terms, C[0].dueIn, 4);
    if (s.day === C[1].day) S.addOffer(s, "duke", second, D.price, D.terms, C[1].dueIn, 4);
    bot.day(s); S.sleep(s);
  }
  return { s, end: s.outcome === "insolvent" ? "insolvent" : S.crownFund(s).verdict };
}
const lost = v => ["insolvent", "short", "bridge"].includes(v);
const res = {}; for (const k of ["careful", "overtrader", "reckless"]) res[k] = run(k).end;
ok(first * 2 === D.sacks && second === D.sacks && C[0].day === 12 && C[1].day === 15, `Corvin's orders: day ${C[0].day} ${first} sacks (half of ${D.sacks}), day ${C[1].day} ${second} sacks (double the first)`);
ok(res.careful === "paid", "careful still ends paid with the escalating orders: " + res.careful);
ok(lost(res.overtrader), "overtrader still loses with the escalating orders: " + res.overtrader);
ok(lost(res.reckless), "reckless still loses: " + res.reckless);
console.log(JSON.stringify(res));
// Item 9: seeded events. Same seed = same game; every day inside its window; never two events on one night; seed 0 is the canonical calendar.
{ const W = S.R.windows; let allIn = true, distinct = true, differ = new Set(); const ends = { careful: {}, overtrader: {} };
  for (let seed = 1; seed <= 40; seed++) { const ev = S.eventsFor(seed), days = Object.keys(ev).map(Number), kinds = Object.values(ev);
    if (days.length !== 4) distinct = false;
    for (const d of days) { const [lo, hi] = W[ev[d]]; if (d < lo || d > hi) allIn = false; }
    differ.add(JSON.stringify(ev));
    for (const k of ["careful", "overtrader"]) { const r = run(k, seed).end; ends[k][r] = (ends[k][r] || 0) + 1; } }
  ok(JSON.stringify(S.eventsFor(7)) === JSON.stringify(S.eventsFor(7)) && JSON.stringify(S.newGame({ seed: 7 }).events) === JSON.stringify(S.eventsFor(7)), "same seed, same event calendar (and it is stored in the game)");
  ok(allIn && distinct, "40 seeds: pigs 7-11, rats 14-18, warm 17-21, frost 21-25, four different nights each");
  ok(differ.size > 10, `different seeds give different games (${differ.size} distinct calendars in 40)`);
  ok(JSON.stringify(S.eventsFor(0)) === JSON.stringify(S.R.events) && JSON.stringify(S.newGame().events) === JSON.stringify(S.R.events), "seed 0 (default, bots, sandbox) is the canonical 9/16/19/23");
  console.log("careful over 40 seeds:", JSON.stringify(ends.careful), " overtrader:", JSON.stringify(ends.overtrader));
  ok((ends.careful.paid || 0) >= 25 && !ends.careful.insolvent && !ends.careful.short, `careful survives every seed and pays the Crown on most (${ends.careful.paid || 0}/40; the rest are bridged: the bot never buys the fence or the poison)`);
  ok((ends.overtrader.paid || 0) <= 4, `the overtrader loses on almost every seed (paid on ${ends.overtrader.paid || 0}/40)`); }
process.exit(fail ? 1 : 0);
