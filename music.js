// Ledger & Crown — the score. A small generative composer: every mood is a key, a four-bar chord loop and a few instruments (soft pad, plucked lute, bell, reedy
// saw, frame drum) synthesized with WebAudio, so there are no audio files and it works offline. Notes are chosen by a seeded generator (mood + bar number), so a given
// bar always sounds the same and the tests can render and compare it. Plays through the same shared context and buses as the sound effects in fx.js.
//   farm   calm morning work (C pentatonic)          town   a waltz at the shops (G)         rain   Dorian, sparse bells, with a rain bed (see FX.rain)
//   night  music-box lullaby for sleeping            tense  low drone and a heartbeat when the chest is nearly empty         crane  the bailiff's march
window.Music = (function () {
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const rng = seed => { let a = (seed >>> 0) || 1; return () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const SC = { maj: [0, 2, 4, 7, 9], min: [0, 3, 5, 7, 10], dor: [0, 2, 3, 7, 9] }, CH = { M: [0, 4, 7], m: [0, 3, 7] };
  const MOODS = {
    farm:  { bpm: 76,  beats: 4, root: 60, scale: SC.maj, chords: [[0, "M"], [9, "m"], [5, "M"], [7, "M"]], pad: .05,  bass: "root",  mel: { p: .42, oct: 1, inst: "pluck", range: [0, 9] }, bell: .25 },
    town:  { bpm: 104, beats: 3, root: 67, scale: SC.maj, chords: [[0, "M"], [5, "M"], [7, "M"], [0, "M"]], pad: .03,  bass: "waltz", mel: { p: .5,  oct: 1, inst: "pluck", range: [0, 9] }, arp: true, perc: "shaker", bell: .3 },
    rain:  { bpm: 64,  beats: 4, root: 57, scale: SC.dor, chords: [[0, "m"], [5, "M"], [3, "M"], [7, "m"]], pad: .06,  bass: "root",  mel: { p: .25, oct: 1, inst: "bell",  range: [0, 9] } },
    night: { bpm: 52,  beats: 4, root: 62, scale: SC.maj, chords: [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], pad: .04,  bass: null,    mel: { p: .3,  oct: 1, inst: "bell",  range: [0, 9] } },
    tense: { bpm: 92,  beats: 4, root: 57, scale: SC.min, chords: [[0, "m"], [0, "m"], [8, "M"], [7, "M"]], pad: .045, bass: "pulse", mel: { p: .28, oct: 0, inst: "saw",   range: [0, 4] }, perc: "drum" },
    crane: { bpm: 84,  beats: 4, root: 50, scale: SC.min, chords: [[0, "m"], [5, "m"], [3, "M"], [7, "M"]], pad: .03,  bass: "march", mel: { p: .55, oct: 0, inst: "saw",   range: [0, 5] }, perc: "drum" },
  };
  const barSeconds = m => 60 / m.bpm * m.beats;

  // ---- instruments: each takes (context, bus, ...) and creates a few short-lived nodes ----
  const noiseFor = new WeakMap();
  function noiseBuf(ac) { let b = noiseFor.get(ac); if (!b) { b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = b.getChannelData(0); let r = 4242; for (let i = 0; i < d.length; i++) { r = (r * 16807) % 2147483647; d[i] = r / 1073741823 - 1; } noiseFor.set(ac, b); } return b; }
  function env(g, t, a, peak, dur) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur); }
  function pluck(ac, bus, f, t, dur, vol) { const o1 = ac.createOscillator(), o2 = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = "triangle"; o2.type = "sawtooth"; o1.frequency.value = f; o2.frequency.value = f * 1.004; lp.type = "lowpass"; lp.frequency.setValueAtTime(Math.min(8000, f * 7), t); lp.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.4), t + dur * .7);
    env(g, t, .006, vol, dur); o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(bus); o1.start(t); o2.start(t); o1.stop(t + dur + .05); o2.stop(t + dur + .05); return 6; }
  function pad(ac, bus, f, t, dur, vol) { const o1 = ac.createOscillator(), o2 = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = "sine"; o2.type = "triangle"; o1.frequency.value = f; o2.frequency.value = f * 1.005; lp.type = "lowpass"; lp.frequency.value = 1100;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.7, dur * .35)); g.gain.setValueAtTime(vol, t + dur * .65); g.gain.linearRampToValueAtTime(.0001, t + dur);
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(bus); o1.start(t); o2.start(t); o1.stop(t + dur + .05); o2.stop(t + dur + .05); return 5; }
  function bell(ac, bus, f, t, vol) { const c = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
    c.type = "sine"; m.type = "sine"; c.frequency.value = f; m.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(f * .05, t + 1.6);
    env(g, t, .004, vol, 2.2); m.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(bus); c.start(t); m.start(t); c.stop(t + 2.3); m.stop(t + 2.3); return 5; }
  function saw(ac, bus, f, t, dur, vol) { const o = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(380, t + dur); lp.Q.value = 2;
    env(g, t, .03, vol, dur); o.connect(lp); lp.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + .05); return 4; }
  function thump(ac, bus, t, vol) { const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + .22); env(g, t, .004, vol, .3); o.connect(g); g.connect(bus); o.start(t); o.stop(t + .32); return 3; }
  function shake(ac, bus, t, vol) { const s = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf(ac); hp.type = "highpass"; hp.frequency.value = 6000; env(g, t, .004, vol, .06); s.connect(hp); hp.connect(g); g.connect(bus); s.start(t); s.stop(t + .08); return 4; }

  // ---- one bar of a mood, scheduled into any AudioContext (live or offline); returns how many nodes it made ----
  function scheduleBar(ac, bus, name, bar, t0) {
    const m = MOODS[name]; if (!m) return 0; const r = rng(hash(name) + bar * 7919), steps = m.beats * 2, sd = 60 / m.bpm / 2, ch = m.chords[bar % m.chords.length], tones = CH[ch[1]], cr = m.root - 12 + ch[0];
    let n = 0;
    tones.forEach(x => { n += pad(ac, bus, mtof(cr + x), t0, barSeconds(m) * 1.02, m.pad); }); // the pad holds the chord for the bar
    const bassN = (semi, t, d, v) => { n += pluck(ac, bus, mtof(cr - 12 + semi), t, d, v); };
    if (m.bass === "root") { bassN(0, t0, sd * 4, .16); bassN(0, t0 + sd * m.beats, sd * 3, .12); }
    else if (m.bass === "waltz") { bassN(0, t0, sd * 2.5, .17); [2, 4].forEach(s => tones.forEach(x => { n += pluck(ac, bus, mtof(cr + x + 12), t0 + s * sd, sd * 1.4, .035); })); }
    else if (m.bass === "pulse") { for (let s = 0; s < steps; s++) bassN(s % 4 === 3 ? 7 : 0, t0 + s * sd, sd * .9, s % 2 ? .06 : .1); }
    else if (m.bass === "march") { [0, 4].forEach(s => bassN(s ? 7 : 0, t0 + s * sd, sd * 1.7, .16)); bassN(0, t0 + 6 * sd, sd, .1); }
    if (m.arp) for (let s = 0; s < steps; s++) { const x = tones[(s + bar) % 3]; n += pluck(ac, bus, mtof(cr + x + 24), t0 + s * sd, sd * 1.2, .028); }
    // melody: a gentle random walk on the scale, with rests, and a longer rest at the end of every fourth bar so the loop breathes
    const [lo, hi] = m.mel.range; let idx = Math.floor((lo + hi) / 2) + (bar % 3);
    for (let s = 0; s < steps; s++) {
      if (bar % 4 === 3 && s >= steps - 3) continue; if (r() > m.mel.p * (s % 2 ? .6 : 1.1)) continue;
      idx = Math.max(lo, Math.min(hi, idx + [-2, -1, -1, 0, 1, 1, 2][Math.floor(r() * 7)]));
      const f = mtof(m.root + 12 * m.mel.oct + m.scale[idx % 5] + 12 * Math.floor(idx / 5)), d = sd * (1.5 + Math.floor(r() * 3));
      n += m.mel.inst === "bell" ? bell(ac, bus, f, t0 + s * sd, .05) : m.mel.inst === "saw" ? saw(ac, bus, f, t0 + s * sd, d, .05) : pluck(ac, bus, f, t0 + s * sd, d, .09);
    }
    if (m.bell && r() < m.bell) n += bell(ac, bus, mtof(cr + 24), t0, .05);
    if (m.perc === "shaker") for (let s = 1; s < steps; s += 2) n += shake(ac, bus, t0 + s * sd, .02);
    if (m.perc === "drum") { n += thump(ac, bus, t0, .09); n += thump(ac, bus, t0 + sd * m.beats, .06); }
    return n;
  }
  // renders `seconds` of a mood into any context (tests use an OfflineAudioContext); returns { bars, nodes, maxNodesPerBar }
  function render(ac, bus, name, seconds) { const m = MOODS[name]; let t = 0, bar = 0, nodes = 0, mx = 0; while (t < seconds) { const k = scheduleBar(ac, bus, name, bar++, t); nodes += k; mx = Math.max(mx, k); t += barSeconds(m); } return { bars: bar, nodes, maxNodesPerBar: mx }; }

  // ---- the live player: a lookahead scheduler, one bar at a time ----
  let timer = null, mood = "farm", pending = null, nextT = 0, bar = 0;
  function tick() {
    const ac = window.FX && FX.ctx(); if (!ac || ac.state !== "running" || !FX.musicOn) return; const bus = FX.musBus; if (!bus) return;
    if (nextT < ac.currentTime) nextT = ac.currentTime + .08;
    while (nextT < ac.currentTime + .6) {
      if (pending) { mood = pending; pending = null; bar = 0; try { bus.gain.cancelScheduledValues(ac.currentTime); bus.gain.setTargetAtTime(.5, nextT, .25); } catch (e) {} }
      scheduleBar(ac, bus, mood, bar++, nextT); nextT += barSeconds(MOODS[mood]);
    }
  }
  function start() { if (timer || !(window.FX && FX.musicOn)) return; timer = setInterval(tick, 120); tick(); }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  function setMood(m) { if (!MOODS[m] || m === (pending || mood)) return; pending = m;
    try { const ac = FX.ctx(), bus = FX.musBus; if (ac && bus) { bus.gain.cancelScheduledValues(ac.currentTime); bus.gain.setTargetAtTime(.12, ac.currentTime, .15); } } catch (e) {} } // dip while the old bar finishes
  window.addEventListener("pagehide", stop); document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
  return { MOODS, moods: Object.keys(MOODS), scheduleBar, render, start, stop, setMood, barSeconds, get mood() { return pending || mood; }, get running() { return !!timer; } };
})();
