// Spring at Thornfield — the transcript (T key). All 17 core courses are visible from the first minute; only C0-C2
// are active in Spring, the rest are locked behind the act that unlocks them. Earned by playing only.
// Honest mastery (Kyle, 2026-10-02: "That's not mastery, that's an introduction to the concept"):
//   introduced  — you met it once (Maud taught it, or you did it once)
//   practiced   — correct on your own on at least 2 different game days
//   mastered    — correct on your own on at least 3 different game days, at least once by explaining it (a typed
//                 answer without a walk-through), spread over at least 2 real calendar days. Spacing over real time
//                 is what makes memory last (Cepeda et al. 2006), so one sitting can't master anything.
// Persists in localStorage; concept ids that exist in poc/codex.js are mirrored there so the hub's Almanac fills too.
(function (root) {
  const KEY = "lc_transcript_v2"; // v1 marked one right answer as mastery; its records aren't carried over
  const COURSES = [
    ["C0", "Quantitative Readiness", 0], ["C1", "Financial Accounting", 0], ["C2", "Managerial Accounting", 0],
    ["C3", "Data, Statistics & Decisions", 2], ["C4", "Microeconomics & Pricing", 2], ["C5", "Finance I: Valuation", 3],
    ["C6", "Finance II: Corporate Finance", 3], ["C7", "Leading People & Teams", 3], ["C8", "Marketing", 2], ["C9", "Operations", 2],
    ["C10", "Strategy", 4], ["C11", "Macroeconomics", 4], ["C12", "Ethics & Non-market Strategy", 3], ["C13", "Communication & Negotiation", 4],
    ["C14", "The Entrepreneurial Manager", 4], ["C15", "AI & Data for Leaders", 4], ["C16", "The General Manager (capstone)", 5],
  ];
  const ACTS = { 2: "Act II: The Trading House", 3: "Act III: The Barony", 4: "Act IV: The Kingdom", 5: "Act V: The Grand Audit" };
  const CONCEPTS = {
    C0: [["margin", "Margin vs markup"], ["tvm", "Interest & the time value of money"], ["pct", "Ratios & percentages"]],
    C1: [["equation", "Assets = Liabilities + Owner's equity"], ["accrual", "Accrual vs cash"], ["ar", "Accounts receivable"], ["ap", "Accounts payable"],
      ["inventory", "Inventory & Cost of goods sold"], ["gross", "Gross profit"], ["depreciation", "Depreciation"], ["statements", "The three statements"],
      ["cfs", "Cash-flow statement (indirect method)"], ["ratios", "Current ratio"], ["interest", "Interest (the price of a loan)"], ["unearned", "Unearned revenue (customer deposits)"]],
    C2: [["operating", "Operating income"], ["breakeven", "Break-even"], ["wc", "Working capital"], ["overtrading", "Overtrading"], ["insolvency", "Profitable but broke"]],
    // WS7 (Market Day): these course rows stay locked until Year One, but the ideas are earned now at the weekly fair (C4.01, C4.02, C8.02)
    C4: [["demand", "Demand & the price you set"], ["competitor", "Pricing against a rival"]],
    C8: [["segments", "Customer segments"]],
  };
  const CODEX_IDS = ["accrual", "ar", "ap", "inventory", "gross", "operating", "wc", "overtrading", "insolvency", "breakeven", "margin", "tvm", "statements"];
  let mem = {};
  const store = root.localStorage ? { get: () => { try { return JSON.parse(root.localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }, set: d => { try { root.localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} } }
    : { get: () => mem, set: d => { mem = d; } };
  const codex = (id, st) => { if (root.Codex && CODEX_IDS.indexOf(id) >= 0) try { root.Codex.mark(id, st); } catch (e) {} };
  const today = () => new Date().toISOString().slice(0, 10);

  function level(c) {
    if (!c) return "unseen";
    const days = new Set(c.ev.map(e => e.day)).size, real = new Set(c.ev.map(e => e.real)).size, explained = c.ev.some(e => e.kind === "answer");
    if (days >= 3 && explained && real >= 2) return "mastered";
    if (days >= 2) return "practiced";
    return "introduced";
  }
  // One piece of evidence per concept per game day and kind (doing it ten times on one day still counts once).
  function record(id, kind, day) {
    const d = store.get(), c = d[id] || (d[id] = { ev: [] }), before = d[id].ev.length ? level(c) : "unseen", r = today(), dd = day == null ? -1 : day;
    if (!c.ev.some(e => e.day === dd && e.kind === kind)) c.ev.push({ day: dd, kind, real: r });
    const after = level(c); store.set(d);
    codex(id, "felt"); if (after === "mastered") codex(id, "named");
    return after !== before ? after : null;
  }
  // use: did it in play (well === false means it went badly: it still introduces the idea, but isn't evidence of skill)
  function use(id, well, day) { if (well === false) { const d = store.get(); if (!d[id]) { d[id] = { ev: [] }; store.set(d); codex(id, "felt"); return "introduced"; } return null; } return record(id, "use", day); }
  // master (kept for the story's calls): explained it correctly in a lesson, on your own. Evidence, not mastery.
  function master(id, day) { return record(id, "answer", day); }
  const state = id => level(store.get()[id]);
  const evidence = id => ((store.get()[id] || { ev: [] }).ev || []).slice(); // the recorded events (kind, game day, real date): for tests and the transcript
  const name = id => { for (const k in CONCEPTS) for (const [i, n] of CONCEPTS[k]) if (i === id) return n; return id; };
  const W = { unseen: 0, introduced: .2, practiced: .55, mastered: 1 };
  function progress(code) { const cs = CONCEPTS[code] || []; if (!cs.length) return 0; return cs.reduce((a, [i]) => a + W[state(i)], 0) / cs.length; }
  function reset() { store.set({}); }
  const LABEL = { unseen: "unseen", introduced: "introduced", practiced: "practiced", mastered: "mastered &#9733;" };
  function html() {
    const row = ([code, title, act]) => { const p = Math.round(progress(code) * 100), locked = act > 0;
      return `<div class="course${locked ? " locked" : ""}"><div class="ch"><b>${code}</b> ${title}<span>${locked ? "&#128274; " + ACTS[act] : p + "%"}</span></div>` +
        (locked ? "" : `<div class="bar"><i style="width:${p}%"></i></div>` + CONCEPTS[code].map(([i, n]) => { const st = state(i);
          return `<div class="cx ${st === "mastered" ? "mastered" : st === "unseen" ? "unseen" : "used"}"><span>${st === "unseen" ? "? ? ?" : n}</span><span>${LABEL[st]}</span></div>`; }).join("")) + "</div>"; };
    return `<h2>Transcript <span class="hint">Thornfield School of the Vale · MBA core</span></h2>` +
      `<p class="hint">Introduced: you've met it. Practiced: right on your own on 2 different days. Mastered: right on your own on 3 different days, at least once by explaining it, across at least 2 real days. Ideas come back in later seasons so you can master them.</p>` +
      `<div class="courses">${COURSES.map(row).join("")}</div><div class="diploma">&#128274; Diploma: sealed until the Grand Audit</div>`;
  }
  root.Transcript = { COURSES, CONCEPTS, use, master, evidence, state, name, progress, reset, html, level };
  if (typeof module !== "undefined") module.exports = root.Transcript;
})(typeof window !== "undefined" ? window : globalThis);
