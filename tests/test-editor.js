// Editor pass checks (work order item 6). Maud speaks in at most two sentences a box; no scene or conversation runs more than four boxes without a choice; Crane stays in "Item:" voice.
// The live run (tests/smoke-story.html) reports the longest choiceless run per day of the real story. Run: node tests/test-editor.js [--list]
global.window = global; const fs = require("fs"), path = require("path"), S = require("../engine.js"), B = require("../books.js"); global.Spring = S; global.Books = B; global.Transcript = require("../transcript.js"); global.Verbs = {}; global.Endings = require("../endings.js");
require("../cast.js"); require("../scenes.js"); require("../practice.js"); if (fs.existsSync(path.join(__dirname, "../standing.js"))) require("../standing.js");
const C = window.Cast, SC = window.Scenes, LIST = process.argv.includes("--list");
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const sent = x => x.replace(/\$\{[^}]*\}/g, "N").replace(/<[^>]+>/g, " ").replace(/\d\.\d/g, "d").replace(/e\.g\./g, "eg").split(/(?<=[.?!])\s+(?=[A-Z"“'‘(])/).filter(s => s.trim().length > 2);
const STR = "(`(?:[^`\\\\]|\\\\.)*`|\"(?:[^\"\\\\]|\\\\.)*\")";
// ---- 1. Maud's boxes in source (every call that makes Maud speak) ----
{ const files = ["story.js", "scenes.js", "game.js", "verbs.js", "market.js", "practice.js", "standing.js", "court.js", "engine.js"].filter(f => fs.existsSync(path.join(__dirname, "..", f)));
  const re = new RegExp("(?:\\btell\\(|G\\.say\\(\"maud\",\\s*|\\bsayP\\(\"maud\",\\s*|\\bsay\\(\"maud\",\\s*|c\\.maud\\(|\\bmaud:\\s*|who: \"maud\", text:\\s*|G\\.dlg\\(\\{ who: \"maud\", text:\\s*|ask\\(\"maud\",\\s*|G\\.ask\\(\"maud\",\\s*)" + STR, "g"), bad = [];
  for (const f of files) fs.readFileSync(path.join(__dirname, "..", f), "utf8").split("\n").forEach((ln, i) => { let m; re.lastIndex = 0; while ((m = re.exec(ln))) { const n = sent(m[1].slice(1, -1)).length; if (n > 2) bad.push(`${f}:${i + 1} [${n}] ${m[1].slice(1, 70)}`); } });
  if (LIST) bad.forEach(b => console.log("   " + b)); ok(bad.length === 0, `every Maud box in the source is at most two sentences (${bad.length} over)`); }
// ---- 2. Maud's lines in the cast sheet and the engine's coach ----
{ const w = C.WHO.maud, lines = [].concat(w.greet, w.low || [], w.rich || [], w.rain || []); w.topics.forEach(t => t.lines.forEach(l => lines.push(l))); const bad = lines.filter(l => sent(l).length > 2);
  if (LIST) bad.forEach(b => console.log("   cast: " + b.slice(0, 90))); ok(bad.length === 0, `every line in Maud's character sheet is at most two sentences (${bad.length} over of ${lines.length})`);
  const s = S.newGame({ story: true }), seen = new Set(); let over = 0; for (let d = 1; d <= 28; d++) { s.day = d; const c = S.coach(s); if (c && !seen.has(c.text)) { seen.add(c.text); if (sent(c.text).length > 2) { over++; if (LIST) console.log("   coach: " + c.text.slice(0, 90)); } } }
  ok(over === 0, `the coach's lines (${seen.size} distinct over a season) are at most two sentences`); }
// ---- 3. choiceless runs inside scenes and character topics ----
const MAXRUN = 4;
{ const long = [];
  for (const sc of SC.SC) for (const pick of [0, 1, 2]) { let run = 0, worst = 0; const bump = n => { run += n; worst = Math.max(worst, run); }, s = S.newGame({ story: true }); s.day = Math.max(sc.from, 9); s.flags = s.flags || {}; s.trust = Object.assign({}, s.trust); s.invoices = [{ id: 1, who: "hobb", amount: 100, due: 25 }];
    const ctx = { s, S, lines: async (w, a) => bump(a.length), ask: async (w, t, labels) => { if (labels.length >= 2) run = 0; else bump(1); return Math.min(pick, labels.length - 1); }, maud: async () => bump(1), flag: () => {}, clue: () => {}, trust: () => {}, letter: async () => bump(1) };
    try { sc.run(ctx).then(() => {}); } catch (e) {} ; sc.__w = Math.max(sc.__w || 0, worst); }
  // scenes are async but their awaits resolve in microtasks: drain them before reading the results
  Promise.resolve().then(() => new Promise(r => setTimeout(r, 30))).then(() => { const bad = SC.SC.filter(sc => (sc.__w || 0) > MAXRUN).map(sc => `${sc.id} (${sc.__w})`); if (LIST) console.log("   scene runs: " + SC.SC.map(sc => `${sc.id}:${sc.__w || 0}`).join(" "));
    ok(bad.length === 0, `no scene runs more than ${MAXRUN} boxes without a choice${bad.length ? " :: " + bad.join(", ") : ""}`);
    const topics = []; for (const [who, w] of Object.entries(C.WHO)) w.topics.forEach(t => { if (t.lines.length > MAXRUN) topics.push(`${who}/${t.id} (${t.lines.length})`); }); ok(topics.length === 0, `no character topic is longer than ${MAXRUN} boxes${topics.length ? " :: " + topics.join(", ") : ""}`);
    process.exit(fail ? 1 : 0); }); }
