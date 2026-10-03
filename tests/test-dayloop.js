// Day-loop: every day 2-28 has at least one choice and at least one surprise or set piece, over many seeds. Run: node tests/test-dayloop.js [--table]
global.window = global; const S = require("../engine.js"); global.Spring = S; global.Books = require("../books.js"); global.Transcript = require("../transcript.js"); global.Verbs = {};
require("../cast.js"); require("../scenes.js"); const M = require("../market.js"); require("../standing.js"); const { dayLoop } = require("./day-loop.js");
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const extra = { Scenes: window.Scenes, Market: M, Standing: window.Standing }, gaps = { choice: {}, surprise: {} };
for (let seed = 1; seed <= 40; seed++) dayLoop(S, extra, seed).forEach(r => { if (r.day >= 2) { if (!r.choices.length) (gaps.choice[r.day] = gaps.choice[r.day] || []).push(seed); if (!r.surprises.length) (gaps.surprise[r.day] = gaps.surprise[r.day] || []).push(seed); } });
const gc = Object.keys(gaps.choice), gs = Object.keys(gaps.surprise);
ok(gc.length === 0, "every day 2-28 has at least one choice, over 40 seeds" + (gc.length ? " :: no choice on days " + gc.join(",") : ""));
ok(gs.length === 0, "every day 2-28 has at least one surprise or set piece, over 40 seeds" + (gs.length ? " :: nothing unexpected on days " + gs.map(d => d + " (" + gaps.surprise[d].length + "/40 seeds)").join(", ") : ""));
if (process.argv.includes("--table")) dayLoop(S, extra, 3).forEach(r => console.log(`   day ${String(r.day).padStart(2)}  choices: ${r.choices.join("; ") || "-"}  | surprises: ${r.surprises.join("; ") || "-"}`));
process.exit(fail ? 1 : 0);
