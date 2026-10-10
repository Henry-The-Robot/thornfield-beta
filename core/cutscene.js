// Ledger & Crown — the cutscene engine (P7). A cutscene is DATA: a list of shots (how long, which score mood, which sound cues), a list of subtitle lines, and for each shot
// either a draw function (the opening's hand-drawn art) or a list of layers (plain data, see `layers` below). This file plays it: timeline, subtitles, music mood, sound cues,
// skip (Escape or the Skip button), an optional voice file per line, and a journal of the cutscenes the player has seen so any of them can be replayed.
//   def = { id, w, h, shots: [{ name, dur, mood, cues: [[t, sfx], ...], draw?: (t, d) => void, layers?: [layer, ...] }],
//           lines: [{ id, shot, at, dur, who, dir, text }], gate?: html, seenKey?: string, setup?: ctx => void }
//   layer = { op: "rect"|"oval"|"text"|"sprite", ..., at?: [t0, t1], fadeIn?: s, slide?: { dx, dy, over: [t0, t1] } }   t in seconds into the shot
//     rect { x, y, w, h, c }  oval { x, y, rx, ry, c }  text { s, x, y, size, c, align? }  sprite { name (a path in Art, e.g. "chest" or "people.crane.down.0"), x, y, k }
//   Cutscene.register(def) · play(idOrDef, opts) -> Promise({ how, said, fired }) · replay(id, opts) · journal() · timeline(def) · cuesUpTo(def, t) · validate(def) · manifest(def)
(function () {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1), ease = k => k * k * (3 - 2 * k);
  const REG = {}, JOURNAL_KEY = "lc_cutscenes_v1";
  // ---------- pure: the timeline ----------
  function timeline(def) { const starts = []; let t = 0; for (const s of def.shots) { starts.push(t); t += s.dur; } return { starts, total: t }; }
  const shotAt = (tl, t) => { let i = tl.starts.length - 1; while (i > 0 && t < tl.starts[i]) i--; return i; };
  const lineAt = (def, t) => def.lines.find(l => t >= l.at && t < l.at + l.dur) || null;
  function cuesUpTo(def, t) { // every sound cue that has fired by time t, in order: [shot, name]
    const tl = timeline(def), out = []; def.shots.forEach((s, i) => s.cues.forEach(([ct, n]) => { if (tl.starts[i] + ct <= t) out.push([i, n]); })); return out;
  }
  const manifest = (def, ext) => def.lines.map(l => ({ id: l.id, speaker: l.who, text: l.text, direction: l.dir, start: l.at, maxSeconds: l.dur, file: l.id + "." + (ext || "mp3") }));
  function validate(def) { // the problems in a cutscene's data; an empty list means it can play
    const bad = [], tl = timeline(def), ids = new Set();
    if (!def.id || !def.w || !def.h) bad.push("needs id, w, h");
    def.shots.forEach((s, i) => { if (!(s.dur > 0) || !s.mood || !s.name) bad.push(`shot ${i}: needs name, dur, mood`); if (!s.draw && !s.layers) bad.push(`shot ${i}: needs draw or layers`);
      s.cues.forEach(([t, n]) => { if (!(t >= 0 && t <= s.dur) || typeof n !== "string") bad.push(`shot ${i}: cue ${n} outside the shot`); });
      (s.layers || []).forEach((l, j) => { if (["rect", "oval", "text", "sprite"].indexOf(l.op) < 0) bad.push(`shot ${i} layer ${j}: unknown op ${l.op}`); if (l.at && !(l.at[0] < l.at[1])) bad.push(`shot ${i} layer ${j}: bad time window`); }); });
    def.lines.forEach((l, i) => { if (ids.has(l.id)) bad.push("duplicate line id " + l.id); ids.add(l.id); if (!l.text || !l.who || !(l.dur > 0)) bad.push("line " + l.id + ": needs text, who, dur"); if (!def.shots[l.shot]) bad.push("line " + l.id + ": no such shot"); else if (l.at < tl.starts[l.shot] || l.at + l.dur > tl.starts[l.shot] + def.shots[l.shot].dur + .3) bad.push("line " + l.id + " is outside its shot"); if (i && def.lines[i - 1].at + def.lines[i - 1].dur > l.at + .001) bad.push("line " + l.id + " overlaps the one before"); });
    return bad;
  }
  // ---------- drawing ----------
  let ctx = null;
  function layer(l, t) { // one data layer at time t (seconds into the shot)
    if (l.at && (t < l.at[0] || t >= l.at[1])) return;
    let x = l.x, y = l.y; if (l.slide) { const k = ease(prog(t, l.slide.over[0], l.slide.over[1])); x += l.slide.dx * k; y += (l.slide.dy || 0) * k; }
    ctx.globalAlpha = l.fadeIn ? ease(prog(t, l.at ? l.at[0] : 0, (l.at ? l.at[0] : 0) + l.fadeIn)) : 1;
    if (l.op === "rect") { ctx.fillStyle = l.c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(l.w), Math.round(l.h)); }
    else if (l.op === "oval") { ctx.fillStyle = l.c; ctx.beginPath(); ctx.ellipse(x, y, l.rx, l.ry, 0, 0, 7); ctx.fill(); }
    else if (l.op === "text") { ctx.font = `bold ${l.size}px monospace`; ctx.fillStyle = l.c; ctx.textAlign = l.align || "left"; ctx.fillText(l.s, Math.round(x), Math.round(y)); ctx.textAlign = "left"; }
    else if (l.op === "sprite") { const spr = l.name.split(".").reduce((o, k) => o && o[k], window.Art); if (spr && spr.width) ctx.drawImage(spr, Math.round(x), Math.round(y), Math.round(spr.width * l.k), Math.round(spr.height * l.k)); }
    ctx.globalAlpha = 1;
  }
  function frame(def, t) { // draw the whole cutscene at time t (also used by tests and screenshots)
    if (!ctx) return; const tl = timeline(def), i = shotAt(tl, t), local = t - tl.starts[i], s = def.shots[i], last = def.shots.length - 1; ctx.imageSmoothingEnabled = false; ctx.save();
    if (s.draw) s.draw(local, s.dur); else s.layers.forEach(l => layer(l, local));
    const fi = Math.min(.8, 1 - prog(local, 0, .6)), fo = prog(local, s.dur - .5, s.dur), dark = i === last ? fi : Math.max(fi, i < last ? fo : 0); if (dark > 0) { ctx.fillStyle = `rgba(0,0,0,${dark})`; ctx.fillRect(0, 0, def.w, def.h); } ctx.restore();
  }
  // ---------- the journal: which cutscenes the player has seen ----------
  function journal() { try { return JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]"); } catch (e) { return []; } }
  function note(id) { try { const j = journal(); if (j.indexOf(id) < 0) { j.push(id); localStorage.setItem(JOURNAL_KEY, JSON.stringify(j)); } } catch (e) {} }
  // ---------- playback ----------
  let st = null, voiceBase = null, voiceExt = "mp3", active = false;
  const sound = name => { try { if (window.FX && FX.sfx) FX.sfx(name); } catch (e) {} };
  // ---------- voice and sound files (?vo=1) ----------
  // iPad Safari only plays sound a tap started. A file started seconds later by the timeline is blocked when it is an <audio> element, so files play
  // through the ONE shared WebAudio context that the first tap unlocks (core/fx.js), decoded in advance. No context (old browser, tests): an <audio> element.
  const bufs = {};
  const wac = () => { try { return window.FX && FX.ctx ? FX.ctx() : null; } catch (e) { return null; } };
  function load(src) { const a = wac(); if (!a || !window.fetch) return null;
    if (!bufs[src]) bufs[src] = fetch(src).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => new Promise((res, rej) => a.decodeAudioData(b, res, rej))).catch(() => null);
    return bufs[src]; }
  function preload(def) { if (!voiceBase) return; (def.lines || []).forEach(l => load(`${voiceBase}/${l.id}.${voiceExt}`)); (def.sfxFiles || []).forEach(f => load(f.src)); }
  function clip(src, vol, loop) { // {play, stop, vol(v), after(fn), ended, kind}
    const a = wac(), c = { ended: false, playing: false, stopped: false, wait: [], src };
    const fin = () => { if (c.ended) return; c.ended = true; c.playing = false; c.wait.splice(0).forEach(f => f()); };
    if (a && load(src)) {
      c.kind = "webaudio"; const g = a.createGain(); g.gain.value = vol; g.connect(a.destination); let node = null;
      c.play = () => { load(src).then(buf => { if (c.stopped) return; if (!buf) return fin(); try { if (a.state !== "running") a.resume(); } catch (e) {}
        node = a.createBufferSource(); node.buffer = buf; node.loop = !!loop; node.connect(g); node.onended = fin; node.start(0); c.playing = true; }); };
      c.stop = () => { c.stopped = true; try { if (node) node.stop(); } catch (e) {} fin(); };
      c.vol = v => { try { g.gain.value = v; } catch (e) {} };
    } else {
      c.kind = "element"; const el = new Audio(src); el.volume = vol; el.loop = !!loop; c.el = el; el.addEventListener("ended", fin);
      c.play = () => { c.playing = true; const p = el.play(); if (p && p.catch) p.catch(fin); };
      c.stop = () => { c.stopped = true; try { el.pause(); } catch (e) {} fin(); };
      c.vol = v => { el.volume = v; };
    }
    c.after = f => { if (c.ended) f(); else c.wait.push(f); };
    return c;
  }
  function say(l) { // a line starts: subtitle, and the voice file if one is set
    if (!st) return; const el = st.sub; el.innerHTML = `<span class="in-who">${l.who}</span><span class="in-txt">${l.text}</span>`; el.classList.add("on"); st.line = l.id; st.said.push(l.id);
    if (voiceBase) try { const c = clip(`${voiceBase}/${l.id}.${voiceExt}`, 1, false), prev = st.audio; st.audio = c; st.audios.push(c); // a line waits for the one before it to finish (i08 follows i07)
      let fired = false; const go = () => { if (fired || !st || st.audios.indexOf(c) < 0) return; fired = true; c.play(); };
      if (prev && !prev.ended) { prev.after(go); setTimeout(go, 2500); } else go(); } catch (e) {} // never wait more than 2.5 s behind a line that is stuck

  }
  // files that replace synth cues in voice mode: def.sfxFiles = [{ src, at, vol, loop, until, mute: { shotIndex: [cueIndex, ...] } }] (at/until are seconds from the start)
  function sfxFiles(t) {
    if (!voiceBase || !st.def.sfxFiles) return;
    st.def.sfxFiles.forEach((f, i) => {
      let r = st.sfx[i], v = f.vol == null ? 1 : f.vol;
      if (!r && t >= f.at && (f.until == null || t < f.until)) { try { const c = clip(f.src, v, f.loop); st.audios.push(c); c.play(); r = st.sfx[i] = { a: c }; } catch (e) { r = st.sfx[i] = {}; } }
      if (r && r.a && !r.a.stopped && f.until != null) { if (t >= f.until) r.a.stop(); else if (t > f.until - 1) r.a.vol(Math.max(0, v * (f.until - t))); }
    });
  }
  const sfxMuted = (si, ci) => !!(voiceBase && st.def.sfxFiles && st.def.sfxFiles.some(f => f.mute && f.mute[si] && f.mute[si].indexOf(ci) >= 0));
  function stopAudio(s) { try { (s.audios || []).forEach(a => a.stop()); } catch (e) {} }
  function step(now) {
    if (!st) return; const def = st.def, tl = st.tl; const dt = Math.min(.1, (now - (st.last || now)) / 1000); st.last = now; if (!st.hold) st.t += dt * st.speed;
    const t = st.t; if (t >= tl.total) return end("done");
    frame(def, t);
    const si = shotAt(tl, t); if (si !== st.shot) { st.shot = si; st.cueI = 0; try { if (window.Music) { Music.start(); Music.setMood(def.shots[si].mood); } } catch (e) {} }
    const cues = def.shots[si].cues, local = t - tl.starts[si]; while (st.cueI < cues.length && cues[st.cueI][0] <= local) { if (!sfxMuted(si, st.cueI)) sound(cues[st.cueI][1]); st.fired.push(cues[st.cueI][1]); st.cueI++; }
    sfxFiles(t);
    const l = lineAt(def, t); if (l && st.line !== l.id) say(l); else if (!l && st.line) { st.line = null; st.sub.classList.remove("on"); }
    const bar = st.root.querySelector("#in-bar i"); if (bar) bar.style.width = (t / tl.total * 100).toFixed(1) + "%";
    st.raf = requestAnimationFrame(step);
  }
  function end(how) {
    if (!st) return; const s = st; st = null; active = false; cancelAnimationFrame(s.raf); document.removeEventListener("keydown", s.key, true); stopAudio(s);
    s.root.classList.add("out"); setTimeout(() => s.root.remove(), 380); document.body.classList.remove("in-intro"); try { if (s.def.seenKey) localStorage.setItem(s.def.seenKey, "1"); } catch (e) {} note(s.def.id);
    s.done({ how, said: s.said, fired: s.fired });
  }
  // opts.speed: playback rate (tests); opts.hold: do not advance until released (screenshots); opts.autostart: skip the "tap to begin" gate
  function play(what, opts) {
    const def = typeof what === "string" ? REG[what] : what; if (!def) throw new Error("cutscene: unknown " + what); opts = opts || {}; if (st) return st.promise; let done; const promise = new Promise(r => { done = r; });
    const root = document.createElement("div"); root.id = "intro"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", def.label || "Cutscene");
    root.innerHTML = `<div class="in-stage"><canvas id="in-cv" width="${def.w}" height="${def.h}"></canvas><div class="in-sub" id="in-sub" aria-live="polite"></div>${def.gate ? `<div class="in-gate" id="in-gate">${def.gate}<button type="button" id="in-go">Begin</button><small>Sound on. Tap, or press Enter.</small></div>` : ""}</div><div class="in-top"><span id="in-bar"><i></i></span><button type="button" id="in-skip">Skip</button></div>`;
    document.body.appendChild(root); document.body.classList.add("in-intro"); active = true; ctx = root.querySelector("#in-cv").getContext("2d"); if (def.setup) def.setup(ctx); const go = root.querySelector("#in-go");
    const start = () => { if (!st) return; if (go && !go.isConnected) return; try { if (window.FX) FX.unlock(); } catch (e) {} const g = root.querySelector("#in-gate"); if (g) g.remove(); st.last = performance.now(); st.raf = requestAnimationFrame(step); };
    const key = e => { if (e.key === "Escape") { e.stopPropagation(); end("skipped"); } else if ((e.key === "Enter" || e.key === " ") && go && go.isConnected) { e.preventDefault(); e.stopPropagation(); start(); } else e.stopPropagation(); }; // (the game underneath hears no keys while a cutscene is up)
    st = { def, tl: timeline(def), t: 0, last: 0, speed: opts.speed || 1, hold: !!opts.hold, root, sub: root.querySelector("#in-sub"), shot: -1, cueI: 0, line: null, said: [], fired: [], audios: [], sfx: [], key, done, raf: 0, promise };
    preload(def); // voice mode: fetch and decode every file now, so each plays on time once the first tap has unlocked the shared context
    document.addEventListener("keydown", key, true); root.querySelector("#in-skip").onclick = () => end("skipped");
    frame(def, 0); if (go) go.onclick = start; if (opts.autostart || !go) start(); if (go) setTimeout(() => go.isConnected && go.focus({ preventScroll: true }), 30);
    return promise;
  }
  // a story cutscene plays unless this is a test or sandbox run (?fast, ?sandbox, ?savetest, ?intro=0) or ?cuts=0; the opening has its own rule (Intro.wanted)
  const wanted = q => { q = q || new URLSearchParams(location.search); return !(q.has("fast") || q.has("sandbox") || q.has("savetest") || q.get("intro") === "0" || q.get("cuts") === "0"); };
  // play a registered cutscene if one exists and is wanted: returns its Promise, or null when nothing plays (so a caller can carry on at once). A missing cutscene never blocks the story.
  const maybe = (id, opts) => { try { return REG[id] && typeof document !== "undefined" && document.body && wanted() ? play(id, Object.assign({ autostart: true }, opts)) : null; } catch (e) { return null; } };
  const api = {
    wanted, maybe, register: def => { REG[def.id] = def; return def; }, get: id => REG[id], play, replay: (id, opts) => play(id, opts), journal, timeline, cuesUpTo, validate, manifest, frame: (def, t) => frame(def, t),
    setVoice: (base, ext) => { voiceBase = base || null; if (ext) voiceExt = ext; }, end: how => end(how || "skipped"), get active() { return active; }, get state() { return st; }, ease, prog,
  };
  if (typeof window !== "undefined") window.Cutscene = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
