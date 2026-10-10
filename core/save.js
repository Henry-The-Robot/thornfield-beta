// Ledger & Crown: saves (platform P4b). One versioned blob, `lc_save_v4`; design: docs/design/save-and-carry.md.
// profile = never deleted. slot = the open season. closed = one frozen record per finished season, kept forever.
// Every storage call is in try/catch: a blocked store leaves the game playable and unsaved.
(function (root) {
  const KEY = "lc_save_v4", PREV = "lc_save_v4_prev", V3 = "lc_spring_save_v3", MIGRATED = "lc_save_v3_migrated", MAX_CODE = 1048576;
  const mem = {}; // fallback store when localStorage is missing or blocked (tests pass their own)
  let store = root.localStorage || null, clock = () => new Date().toISOString(), heirData = null;
  const get = k => { try { return store ? store.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return null; } };
  const put = (k, v) => { try { if (store) store.setItem(k, v); else mem[k] = v; return true; } catch (e) { return false; } };
  const jparse = (k) => { try { return JSON.parse(get(k)); } catch (e) { return null; } };
  const isObj = o => !!o && typeof o === "object" && !Array.isArray(o);

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const seedFrom = (rngSeed, games) => 1 + Math.floor(mulberry32(rngSeed + games)() * 2147483646);
  function randomInt() { try { const a = new Uint32Array(1); root.crypto.getRandomValues(a); return 1 + a[0] % 2147483646; } catch (e) { return 1 + Math.floor(Math.random() * 2147483646); } }
  function randomId() { let s = ""; const c = "abcdefghijklmnopqrstuvwxyz0123456789"; for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }

  function emptyProfile() {
    return { id: randomId(), created: clock(), rngSeed: randomInt(), games: 0, level: "apprentice", prestige: 0,
      settings: { sfx: true, music: true, introSeen: false }, transcript: {}, codex: {}, unlocks: {}, carry: {} };
  }
  const emptyBlob = () => ({ v: 4, profile: emptyProfile(), slot: null, closed: {}, bugReports: [] });

  // The record a season hands on: same field shapes as the chapter carry record (the schema validates both).
  function carryFrom(s, season, ctx) {
    ctx = ctx || {}; const S = ctx.Spring || root.Spring || require("./engine.js"), B = ctx.Books || root.Books || require("./books.js");
    const t = S.terms(s), bal = s.bal, tr = s.trust || {}, rel = {};
    for (const n of ["maud", "crane", "ezra", "ashby", "hobb", "jory", "tomas"]) rel[n] = tr[n] != null ? tr[n] : 4;
    const debts = []; if (bal.loan < 0) debts.push({ to: "ezra", amount: -bal.loan, rateBp: t.rateBp, callable: false });
    if (bal.crown < 0) debts.push({ to: "crown", amount: -bal.crown, rateBp: 0, callable: false });
    const flags = {}; for (const k in (s.flags || {})) flags[k] = s.flags[k];
    flags.examPassed = flags.courtPassed !== undefined ? !!flags.courtPassed : !!ctx.examPassed; // the Court decides; ctx is only for a v3 migration that has no Court flags
    return { v: 1, season, ending: ctx.ending || s.outcome || "closed", cash: Math.round(bal.cash), debts, stakes: { mill: 0, bakery: 0 }, relations: rel, flags,
      transcript: ctx.transcript || {}, statements: B.close(s), seed: s.seed | 0, closedAt: ctx.closedAt || clock() };
  }

  // v3 -> v4. Old keys are never deleted here: a later release removes them.
  function migrate() {
    const raw = jparse(V3), b = emptyBlob(), p = b.profile;
    if (!isObj(raw) || !isObj(raw.s)) return b;
    p.games = 1;
    const tr = jparse("lc_transcript_v2"), cx = jparse("lc_codex_v1"), un = jparse("lc_unlocks_v1");
    if (isObj(tr)) p.transcript = tr; if (isObj(cx)) p.codex = cx; if (isObj(un)) p.unlocks = un;
    const lv = get("lc_level_v1"); if (lv) p.level = lv.replace(/^"|"$/g, "");
    const pr = +get("lc_prestige_v1"); p.prestige = isFinite(pr) ? pr : 0;
    const sfx = get("lc_sfx") != null ? get("lc_sfx") : get("lc_sound"), mus = get("lc_music") != null ? get("lc_music") : get("lc_sound");
    if (sfx != null) p.settings.sfx = sfx === "1"; if (mus != null) p.settings.music = mus === "1";
    p.settings.introSeen = get("lc_intro_seen") === "1";
    const br = jparse("lc_bug_reports"); if (Array.isArray(br)) b.bugReports = br.slice(-20);
    if (!raw.s.over) b.slot = { season: "ch1/spring", savedAt: clock(), s: raw.s, story: raw.story || null, calm: raw.calm || 0, usePtr: raw.usePtr || 0, fairSeen: raw.fairSeen || {} };
    else {
      const next = carryFrom(raw.s, "ch1/spring", { transcript: p.transcript, examPassed: !!(raw.s.flags && raw.s.flags.examPassed) });
      b.closed["ch1/spring"] = { closedAt: next.closedAt, outcome: raw.s.outcome || "closed", seed: raw.s.seed | 0, statements: next.statements, exam: { passed: next.flags.examPassed }, next };
    }
    return b;
  }

  // The small stores (transcript, codex, unlocks, level, prestige, switches) still live in their own keys; they are the live copy.
  // snapshot() folds them into profile before a freeze or an export; restoreStores() writes them back after an import.
  const LIVE = { transcript: ["lc_transcript_v2", "j"], codex: ["lc_codex_v1", "j"], unlocks: ["lc_unlocks_v1", "j"], level: ["lc_level_v1", "s"], prestige: ["lc_prestige_v1", "n"] };
  function snapshot(p) {
    for (const f in LIVE) { const [k, t] = LIVE[f], raw = get(k); if (raw == null) continue;
      if (t === "j") { const o = jparse(k); if (isObj(o)) p[f] = o; } else if (t === "n") p[f] = isFinite(+raw) ? +raw : 0; else p[f] = raw.replace(/^"|"$/g, ""); }
    const sfx = get("lc_sfx"), mus = get("lc_music"), intro = get("lc_intro_seen");
    if (sfx != null) p.settings.sfx = sfx === "1"; if (mus != null) p.settings.music = mus === "1"; if (intro != null) p.settings.introSeen = intro === "1";
    return p;
  }
  function restoreStores(p) {
    for (const f in LIVE) { const [k, t] = LIVE[f]; if (p[f] == null) continue; put(k, t === "j" ? JSON.stringify(p[f]) : String(p[f])); }
    const st = p.settings || {}; put("lc_sfx", st.sfx === false ? "0" : "1"); put("lc_music", st.music === false ? "0" : "1"); if (st.introSeen) put("lc_intro_seen", "1");
  }

  let cache = null;
  function load() {
    if (cache) return cache;
    const cur = jparse(KEY);
    if (isObj(cur) && cur.v === 4 && isObj(cur.profile)) return (cache = cur);
    if (get(KEY) != null) { const prev = jparse(PREV); if (isObj(prev) && prev.v === 4 && isObj(prev.profile)) return (cache = prev); } // a corrupt blob: the one-step rollback beats a fresh migrate
    const b = migrate(), text = JSON.stringify(b);
    if (put(KEY, text) && get(KEY) === text) { if (isObj(jparse(V3))) put(MIGRATED, "1"); }
    return (cache = b);
  }
  // write(patch): merge top-level keys (profile and closed merge one level), stamp, keep the previous blob for one-step rollback.
  function write(patch) {
    const b = load(), before = JSON.stringify(b);
    for (const k in (patch || {})) {
      if ((k === "profile" || k === "closed") && isObj(patch[k])) b[k] = Object.assign(b[k] || {}, patch[k]); else b[k] = patch[k];
    }
    if (b.slot) b.slot.savedAt = clock();
    b.v = 4; const text = JSON.stringify(b);
    if (get(KEY) != null) put(PREV, get(KEY)); else put(PREV, before);
    return put(KEY, text);
  }
  const profile = () => load().profile;
  const slot = () => load().slot;
  function saveSlot(season, st) { return write({ slot: Object.assign({ season }, st) }); }
  // The season is over: freeze it into closed[season]. The profile is untouched. The slot clears only when the player leaves (clearSlot).
  function closeSeason(season, s, ctx) {
    ctx = Object.assign({}, ctx); snapshot(load().profile); ctx.transcript = ctx.transcript || load().profile.transcript;
    const next = carryFrom(s, season, ctx);
    const fl = s.flags || {}, court = fl.courtPassed !== undefined; // the exam is the Court's result (s.flags.court*), never Ezra's review
    const rec = { closedAt: next.closedAt, outcome: s.outcome || "closed", seed: s.seed | 0, statements: next.statements, exam: court ? { passed: !!fl.courtPassed, score: fl.courtScore, attempts: fl.courtAttempts } : { passed: next.flags.examPassed, score: ctx.score, attempts: ctx.attempts }, next };
    write({ closed: { [season]: rec } }); return rec;
  }
  // Ezra's review (or the Court) updates only the exam fields of a season that is already frozen.
  function markExam(season, exam) {
    const cur = load().closed[season]; if (!cur) return null;
    const rec = Object.assign({}, cur, { exam: Object.assign({}, cur.exam, exam) });
    if (exam.passed !== undefined && rec.next && rec.next.flags) rec.next = Object.assign({}, rec.next, { flags: Object.assign({}, rec.next.flags, { examPassed: !!exam.passed }) });
    write({ closed: { [season]: rec } }); return rec;
  }
  function clearSlot() { return write({ slot: null }); }
  function newSeed(forced) { // ?seed=N wins; else a seed from the profile, then games + 1
    const b = load(); if (forced != null && isFinite(forced)) return +forced;
    const sd = seedFrom(b.profile.rngSeed, b.profile.games); write({ profile: { games: b.profile.games + 1 } }); return sd;
  }
  function shuffleSeeded(arr, seed, index) { // Fisher-Yates keyed on the season seed and the question index: same order after a reload
    const a = arr.slice(), r = mulberry32((seed | 0) * 131 + (index | 0) + 7);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Export / import. Code = "LC4U." + base64url(JSON) (works everywhere); "LC4." + base64url(deflate-raw) when CompressionStream exists.
  const b64 = bytes => { let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return (typeof btoa === "function" ? btoa(s) : Buffer.from(s, "binary").toString("base64")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64 = t => { const s = t.replace(/-/g, "+").replace(/_/g, "/"); const bin = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary"); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; };
  const utf8 = str => typeof TextEncoder !== "undefined" ? new TextEncoder().encode(str) : Uint8Array.from(Buffer.from(str, "utf8"));
  const unutf8 = bytes => typeof TextDecoder !== "undefined" ? new TextDecoder().decode(bytes) : Buffer.from(bytes).toString("utf8");
  function exportCode() { const b = Object.assign({}, load()); snapshot(b.profile); delete b.bugReports; return "LC4U." + b64(utf8(JSON.stringify(b))); }
  async function pipe(bytes, stream) { const r = new Response(new Blob([bytes]).stream().pipeThrough(stream)); return new Uint8Array(await r.arrayBuffer()); }
  async function exportCompressed() {
    if (typeof CompressionStream === "undefined") return exportCode();
    const b = Object.assign({}, load()); snapshot(b.profile); delete b.bugReports;
    return "LC4." + b64(await pipe(utf8(JSON.stringify(b)), new CompressionStream("deflate-raw")));
  }
  const fileName = () => `ledger-and-crown-${profile().id}-${clock().slice(0, 10).replace(/-/g, "")}.lcsave`;
  // parseCode: returns {ok, blob} or {ok:false, why}. Does not write. Compressed codes need the async path.
  async function parseCode(code) {
    code = String(code || "").replace(/\s+/g, "");
    if (code.length > MAX_CODE) return { ok: false, why: "That save is too big." };
    let json;
    try {
      if (code.startsWith("LC4U.")) json = unutf8(unb64(code.slice(5)));
      else if (code.startsWith("LC4.")) { if (typeof DecompressionStream === "undefined") return { ok: false, why: "This browser cannot read that save." }; json = unutf8(await pipe(unb64(code.slice(4)), new DecompressionStream("deflate-raw"))); }
      else { try { const o = JSON.parse(code); if (isObj(o) && isObj(o.s)) { return { ok: true, v3: o }; } } catch (e) {} return { ok: false, why: "That is not a Ledger & Crown save." }; }
    } catch (e) { return { ok: false, why: "That save could not be read." }; }
    let o; try { o = JSON.parse(json); } catch (e) { return { ok: false, why: "That save could not be read." }; }
    if (!isObj(o) || o.v !== 4) return { ok: false, why: "That save is from a different version." };
    if (!isObj(o.profile)) return { ok: false, why: "That save has no profile." };
    if (o.slot != null && !(isObj(o.slot) && isObj(o.slot.s) && o.slot.s.day != null)) return { ok: false, why: "That save has a broken open game." };
    return { ok: true, blob: o };
  }
  // importCode: after the player confirms. A v3-shaped object is migrated by writing it to the v3 key and running the migration.
  async function importCode(code) {
    const r = await parseCode(code); if (!r.ok) return r;
    const old = get(KEY); if (old != null) put(PREV, old);
    if (r.v3) { put(V3, JSON.stringify(r.v3)); put(KEY, "null"); cache = null; load(); return { ok: true }; }
    const b = r.blob; if (!Array.isArray(b.bugReports)) b.bugReports = []; if (!isObj(b.closed)) b.closed = {};
    if (!put(KEY, JSON.stringify(b))) return { ok: false, why: "Your browser would not store that save." };
    restoreStores(b.profile); cache = null; return { ok: true };
  }
  async function persist() {
    const p = profile(); let ok = false;
    try { if (root.navigator && root.navigator.storage && root.navigator.storage.persist) ok = !!(await root.navigator.storage.persist()); } catch (e) {}
    const hint = !ok && !p.settings.hintShown; write({ profile: { settings: Object.assign(p.settings, { persisted: ok, hintShown: p.settings.hintShown || hint }) } });
    return { persisted: ok, hint: hint ? "On iPad: tap Share, then Add to Home Screen, so your game is kept." : null };
  }

  // The canonical heir: the careful bot's season at seed 0, frozen by tools/freeze-heir.js into tests/golden/heir-ch1-spring.json.
  function setHeir(o) { heirData = o; }
  function heir() {
    if (heirData) return JSON.parse(JSON.stringify(heirData));
    if (typeof require === "function") { try { return JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "..", "tests", "golden", "heir-ch1-spring.json"), "utf8")); } catch (e) {} }
    return null;
  }

  // SM3: the record a season starts from: closed[prev].next, else the canonical heir (a player who lost, skipped or never played the season before).
  function startFrom(prev) { const c = load().closed[prev]; return c && c.next ? JSON.parse(JSON.stringify(c.next)) : heir(); }

  // Test hooks
  function _use(o) { if (o.store !== undefined) store = o.store; if (o.clock) clock = o.clock; cache = null; }
  root.Save = { KEY, load, write, profile, slot, saveSlot, closeSeason, markExam, clearSlot, newSeed, seedFrom, shuffleSeeded, carryFrom, migrate,
    export: exportCode, exportCompressed, fileName, parseCode, import: importCode, persist, heir, setHeir, startFrom, _use };
  if (typeof module !== "undefined") module.exports = root.Save;
})(typeof window !== "undefined" ? window : globalThis);
