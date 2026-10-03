// The cast, the village scenes and Edric's letters. Run: node tests/test-cast.js
global.window = global; const S = require("../engine.js"), B = require("../books.js"); global.Spring = S; global.Books = B; global.Transcript = require("../transcript.js");
require("../cast.js"); require("../scenes.js"); const C = window.Cast, SC = window.Scenes;
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const story = (() => { global.Verbs = {}; try { require("../story.js"); return window.Story; } catch (e) { console.log("story load: " + e.message); return null; } })();
const ids = Object.keys(C.WHO);
// ---- the cast
ok(["maud", "crane", "ashby", "hobb", "tomas", "ezra", "duke", "pell", "pedlar", "mira", "abbey"].every(w => C.WHO[w]), "everyone in the valley has a character sheet");
ok(ids.every(w => C.WHO[w].habit && C.WHO[w].mantra && C.WHO[w].look && C.WHO[w].voice), "each has a look, a verbal habit, a mantra and a voice");
ok(ids.every(w => C.WHO[w].greet.length >= 3 && C.WHO[w].topics.length >= 1), "each has at least 3 greetings and a topic to ask about");
const strings = []; ids.forEach(w => { const c = C.WHO[w]; [].concat(c.greet, c.low || [], c.rich || [], c.rain || []).forEach(t => strings.push([w + " greeting", t, 190])); c.topics.forEach(t => t.lines.forEach(l => strings.push([`${w}/${t.id}`, l, 290]))); });
ok(strings.every(([, t]) => typeof t === "string" && t.length > 0 && !/undefined|\[object|\$\{/.test(t)), "no empty, undefined or unfilled lines");
const long = strings.filter(([, t, m]) => t.length > m); ok(long.length === 0, "every line fits a dialogue box (greetings <= 190 chars, topic lines <= 290)" + (long.length ? ": " + long.map(l => l[0]).join(", ") : ""));
// ---- greetings vary and respond to the moment
{ const s = S.newGame(); for (const w of ids) { const seen = []; for (let d = 1; d <= 14; d++) { s.day = d; seen.push(C.greet(w, s)); } ok(new Set(seen).size >= 3 && seen.every((l, i) => !i || l !== seen[i - 1]), `${w}: varied greetings over two weeks, never the same line twice running`); } }
{ const s = S.newGame(); s.bal.cash = 20; const low = new Set(); for (let d = 1; d <= 30; d++) { s.day = d; s.said = {}; low.add(C.greet("maud", s)); } ok([...low].some(l => C.WHO.maud.low.includes(l)), "a thin chest changes what Maud says"); }
// ---- topics are earned
{ const s = S.newGame(); s.trust.maud = 2; const a = C.topics("maud", s).length; s.trust.maud = 5; const b = C.topics("maud", s).length; ok(b > a && C.locked("maud", { ...s, trust: { ...s.trust, maud: 2 } }) > 0, `trust unlocks more to ask Maud (${a} at 2 hearts, ${b} at 5)`);
  s.trust.ashby = 8; ok(!C.topics("ashby", s).some(t => t.id === "edric"), "Ashby's deepest answer also needs the story to have reached it (a flag), not just hearts"); s.flags.ashbyAsked = true; ok(C.topics("ashby", s).some(t => t.id === "edric"), "...and then it opens"); }
// ---- scenes
ok(SC.SC.every(x => C.WHO[x.who] && typeof x.run === "function" && x.hint && x.from >= 9 && x.from <= 28), "every scene belongs to someone in the cast, has a hint and runs between day 9 and 28");
ok(new Set(SC.SC.map(x => x.id)).size === SC.SC.length, "scene ids are unique");
{ const s = S.newGame(); s.day = 8; ok(!SC.SC.some(x => SC.available(x.who, s)), "no scene before day 9 (the story's first lessons run first)"); s.day = 9; ok(SC.available("maud", s) && SC.available("maud", s).id === "maud_abacus", "day 9: Maud's first scene waits for you");
  s.scenes.maud_abacus = 9; ok(!SC.available("maud", s), "a scene played once is not offered again");
  s.day = 12; ok(!SC.available("crane", s), "day 12 is Corvin Vane's first order at the well, so Crane's off-duty scene waits (integration: shifted +1 day)");
  s.day = 13; ok(SC.available("crane", s) && SC.available("crane", s).id === "crane_offduty", "Crane stands by the well from day 13"); s.day = 18; ok(!SC.available("crane", s), "...and goes back to being unpleasant after day 17 if you missed him");
  s.day = 23; ok(!SC.available("crane", s), "his second scene needs the first (no flag, no scene)"); s.flags.craneSeal = true; ok(SC.available("crane", s) && SC.available("crane", s).id === "crane_seal", "with the first clue found, day 23 brings the seal (day 22 is the week-4 card)");
  s.day = 14; ok(!SC.available("hobb", s), "Hobb's favour needs an invoice of his to be open"); s.invoices.push({ id: 1, who: "hobb", amount: 100, due: 20 }); ok(SC.available("hobb", s), "...and appears when one is"); }
// every branch of every scene runs, and any money it moves keeps the books whole
const mkctx = (s, pick, rec) => ({ s, S, lines: async (who, arr) => { rec.lines += arr.length; arr.forEach(t => { if (typeof t !== "string" || /undefined/.test(t)) rec.bad++; }); }, ask: async (who, text, labels) => { rec.asks++; return Math.min(pick, labels.length - 1); },
  maud: async t => { rec.maud++; }, flag: (k, v) => { s.flags[k] = v; rec.flags.push(k); }, clue: () => { s.clues++; rec.clues++; }, trust: (w, d) => { s.trust[w] = Math.max(0, Math.min(10, s.trust[w] + d)); rec.trust.push([w, d]); }, letter: async i => { rec.letters.push(i); } });
(async () => {
  let totalClues = 0, sceneFails = 0; const letters = new Set();
  for (const sc of SC.SC) for (let pick = 0; pick < 3; pick++) {
    const s = S.newGame(); s.day = sc.from; s.invoices.push({ id: 9, who: "hobb", amount: 90, due: s.day + 5 }); s.bal.ar += 90; s.bal.revenue -= 90; s.flags.craneSeal = true;
    const rec = { lines: 0, bad: 0, asks: 0, maud: 0, flags: [], clues: 0, trust: [], letters: [] }, ctx = mkctx(s, pick, rec); let err = null; try { await sc.run(ctx); } catch (e) { err = e; }
    const st = B.close(s); const good = !err && rec.bad === 0 && rec.lines >= 3 && rec.asks >= 1 && st.balanced && st.cf.reconciles && rec.trust.every(([, d]) => Math.abs(d) <= 3);
    if (!good) sceneFails++, ok(false, `scene ${sc.id}, choice ${pick}: ${err ? err.message : "bad (" + JSON.stringify({ lines: rec.lines, bad: rec.bad, asks: rec.asks, balanced: st.balanced, recon: st.cf.reconciles }) + ")"}`);
    if (pick === 0) { totalClues += rec.clues; rec.letters.forEach(l => letters.add(l)); }
  }
  ok(sceneFails === 0, `all ${SC.SC.length} scenes play through every choice without errors, with 3+ lines and a real choice, and the books still balance and reconcile`);
  ok(totalClues === SC.CLUES, `the clue count the player sees ("of ${SC.CLUES}") matches the scenes that hold one (${totalClues})`);
  { const s = S.newGame(); s.day = 14; s.invoices.push({ id: 1, who: "hobb", amount: 100, due: 20 }); s.bal.ar += 100; s.bal.revenue -= 100; const rec = { lines: 0, bad: 0, asks: 0, maud: 0, flags: [], clues: 0, trust: [], letters: [] };
    await SC.BY.hobb_extension.run(mkctx(s, 0, rec)); ok(s.invoices[0].due === 27 && s.flags.hobbExt === "gave" && rec.maud === 1, "Hobb: 'of course' extends his invoice by a week, and Maud points out you just made a loan");
    const t = S.newGame(); t.day = 14; t.invoices.push({ id: 1, who: "hobb", amount: 100, due: 20 }); t.bal.ar += 100; t.bal.revenue -= 100; const c0 = t.bal.cash; await SC.BY.hobb_extension.run(mkctx(t, 2, { lines: 0, bad: 0, asks: 0, maud: 0, flags: [], clues: 0, trust: [], letters: [] }));
    ok(t.bal.cash === c0 + 50 && t.invoices[0].amount === 50 && t.invoices[0].due === 27, "Hobb: 'half now' moves 50 of Cash in and leaves a 50 invoice a week later"); }
  // ---- Edric's letters
  if (story) { ok(story.PAGES.length === story.LETTERS.length && story.PAGES.length === 10, "ten letters (nine from the cast PR plus WS6's midpoint page), each with a title"); ok(story.PAGES.every(p => p.length > 60 && p.length < 520 && !/undefined/.test(p)), "each letter is a real paragraph that fits one page");
    ok([...letters].every(i => i >= 0 && i < story.PAGES.length), "the scenes only unlock letters that exist (" + [...letters].join(",") + ")"); ok(/seal/.test(story.PAGES[8]) && /Crane/.test(story.PAGES[8]) && /Ezra/.test(story.PAGES[8]), "the last letter sends you to Crane, Ezra and the seal: it turns the season into a mystery"); }
  process.exit(fail ? 1 : 0);
})();
