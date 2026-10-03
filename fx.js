// Ledger & Crown — juice and sound. Coin burst, screen shake, typewriter reveal, scene fade, and the whole sound-effects library, all synthesized with
// WebAudio (no audio files, so it works offline from a home-screen icon). music.js plays the score through the same context and buses.
// Sound is ON by default (the first tap unlocks it on iOS) with two switches in the menu, Music and Effects, remembered in localStorage (try/catch: private mode).
// Pattern source: Stardew Valley's "every action is answered" feedback loop; Vlambeer's "Art of Screenshake" for the shake size (small, 150 ms).
(function () {
  const reduce = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  const K = { sfx: "lc_sfx", mus: "lc_music", old: "lc_sound" };
  let sfxOn = true, musOn = true, ac = null, master = null, sfxBus = null, musBus = null, unlocked = false, noiseBuf = null;
  try { // v0.3 stored one switch (lc_sound, off unless "1"): an explicit "0" is still honoured, a missing value now means ON
    const a = localStorage.getItem(K.sfx), m = localStorage.getItem(K.mus), o = localStorage.getItem(K.old);
    sfxOn = a != null ? a === "1" : o !== "0"; musOn = m != null ? m === "1" : o !== "0";
  } catch (e) {}
  const save = () => { try { localStorage.setItem(K.sfx, sfxOn ? "1" : "0"); localStorage.setItem(K.mus, musOn ? "1" : "0"); } catch (e) {} };

  // iOS (Safari and every iPad browser) only lets audio start from inside a user gesture, and a context created later, for example when Cash changes overnight, stays
  // suspended for good. So the first tap, click or key press creates the ONE shared context, resumes it and plays a one-sample silent buffer (the standard unlock);
  // every later gesture re-resumes it if iOS suspended it (a backgrounded tab, a phone call). iOS also mutes WebAudio when the ringer switch is on silent unless the page
  // is in a "playback" audio session, so ask for one (and loop a silent <audio> as the fallback for older iOS).
  function make() {
    if (ac) return ac;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = .9;
      const comp = ac.createDynamicsCompressor ? ac.createDynamicsCompressor() : null; if (comp) { comp.threshold.value = -14; comp.ratio.value = 4; master.connect(comp); comp.connect(ac.destination); } else master.connect(ac.destination);
      sfxBus = ac.createGain(); sfxBus.gain.value = sfxOn ? 1 : 0; sfxBus.connect(master);
      musBus = ac.createGain(); musBus.gain.value = musOn ? .5 : 0; musBus.connect(master);
    } catch (e) { ac = null; }
    return ac;
  }
  function playbackSession() {
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    try { if (!document.getElementById("lc-silent")) { const a = document.createElement("audio"); a.id = "lc-silent"; a.loop = true; a.setAttribute("playsinline", ""); a.volume = .01;
      a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA="; document.body.appendChild(a); const p = a.play(); if (p && p.catch) p.catch(() => {}); } } catch (e) {}
  }
  function unlock() {
    const a = make(); if (!a) return; if (unlocked && a.state === "running") return;
    try { if (a.state !== "running") a.resume(); if (!unlocked) { const src = a.createBufferSource(); src.buffer = a.createBuffer(1, 1, 22050); src.connect(a.destination); src.start(0); unlocked = true; playbackSession(); if (window.Music) Music.start(); } } catch (e) {}
  }
  ["pointerdown", "touchend", "click", "keydown"].forEach(t => window.addEventListener(t, unlock, { capture: true, passive: true }));
  function ctx() { if (!sfxOn) return null; make(); try { if (ac && ac.state === "suspended") ac.resume(); } catch (e) {} return ac; }

  // ---- building blocks ----
  function noise() { if (noiseBuf || !ac) return noiseBuf; const n = ac.sampleRate, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); let r = 12345; for (let i = 0; i < n; i++) { r = (r * 16807) % 2147483647; d[i] = r / 1073741823 - 1; } return (noiseBuf = b); }
  function tone(freq, t0, dur, type, vol, slideTo, bus) { const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0; o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .12, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + .02); }
  // a burst of filtered noise: footsteps, soil, paper, water, rain
  function puff(t0, dur, o) { const a = ctx(); if (!a || !noise()) return; o = o || {};
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + t0; s.buffer = noiseBuf; s.loop = !!o.loop; f.type = o.type || "bandpass"; f.frequency.setValueAtTime(o.freq || 800, t); f.Q.value = o.q || 1;
    if (o.slideTo) f.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .1, t + (o.attack || .005)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.bus || sfxBus); s.start(t, Math.random() * .5); s.stop(t + dur + .02); }

  // ---- the effects library ----
  let stepFlip = 0;
  const SFX = {
    tap() { tone(880, 0, .05, "triangle", .07); },
    pad() { tone(660, 0, .04, "triangle", .05); },
    open() { tone(523, 0, .09, "triangle", .08); tone(784, .06, .12, "triangle", .07); },
    close() { tone(784, 0, .07, "triangle", .06); tone(523, .05, .1, "triangle", .06); },
    page() { puff(0, .16, { type: "highpass", freq: 2500, vol: .05, attack: .02 }); puff(.09, .12, { type: "highpass", freq: 3500, vol: .035, attack: .01 }); },
    step() { stepFlip ^= 1; puff(0, .07, { type: "lowpass", freq: stepFlip ? 420 : 340, vol: .07, attack: .004 }); tone(stepFlip ? 95 : 80, 0, .06, "sine", .05); },
    till() { puff(0, .16, { type: "lowpass", freq: 700, slideTo: 250, vol: .14 }); tone(90, 0, .14, "sine", .12, 50); },
    plant() { tone(330, 0, .08, "sine", .1, 520); puff(.02, .1, { type: "lowpass", freq: 600, vol: .06 }); },
    water() { for (let i = 0; i < 4; i++) tone(500 + Math.random() * 500, i * .05, .07, "sine", .05, 900); puff(0, .3, { type: "bandpass", freq: 1800, q: 2, vol: .05, attack: .03 }); },
    harvest() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .05, .16, "triangle", .09)); puff(0, .12, { type: "lowpass", freq: 900, vol: .08 }); },
    sprinkler() { tone(220, 0, .1, "triangle", .1, 330); puff(0, .2, { type: "bandpass", freq: 1500, q: 2, vol: .06 }); },
    ship() { tone(120, 0, .12, "triangle", .16, 70); tone(1568, .1, .12, "sine", .07); tone(2093, .16, .16, "sine", .06); },
    coin() { tone(1568, 0, .16, "sine", .12); tone(2093, .07, .22, "sine", .09); },
    loss() { tone(140, 0, .22, "triangle", .2, 50); },
    good() { [659, 784, 988].forEach((f, i) => tone(f, i * .08, .22, "triangle", .09)); },
    chime() { [784, 988, 1175, 1568].forEach((f, i) => { tone(f, i * .07, .5, "sine", .08); tone(f * 2.01, i * .07, .3, "sine", .02); }); },
    error() { tone(150, 0, .12, "square", .05); tone(120, .1, .16, "square", .05); },
    knock() { tone(180, 0, .05, "triangle", .14, 100); tone(180, .13, .05, "triangle", .14, 100); },
    bell() { [1, 2.76, 5.4].forEach((m, i) => tone(660 * m, 0, 1.6 / (i + 1), "sine", .08 / (i + 1))); },
    sleep() { [523, 440, 349, 262].forEach((f, i) => tone(f, i * .22, .6, "sine", .07)); },
    morning() { [392, 523, 659, 784].forEach((f, i) => tone(f, i * .12, .5, "triangle", .08)); SFX.bell(); },
    stamp() { tone(110, 0, .3, "sine", .25, 40); puff(0, .15, { type: "lowpass", freq: 900, vol: .18 }); },
    whoosh() { puff(0, .35, { type: "bandpass", freq: 300, slideTo: 2200, q: 1, vol: .09, attack: .1 }); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, i * .1, .5, "triangle", .1); tone(f / 2, i * .1, .5, "sine", .05); }); },
  };
  // a per-character voice for the typewriter: each speaker blips at their own pitch and timbre, so people sound like themselves
  const VOICE = { maud: [330, "triangle"], crane: [140, "square"], ashby: [520, "sine"], hobb: [185, "sawtooth"], tomas: [420, "sine"], ezra: [260, "triangle"], duke: [175, "square"],
    pell: [230, "sawtooth"], pedlar: [380, "triangle"], mira: [470, "sine"], abbey: [300, "sine"], player: [350, "triangle"] };
  const PENT = [0, 2, 4, 7, 9];
  function blip(who, i) { const v = VOICE[who] || VOICE.maud, f = v[0] * Math.pow(2, PENT[(i * 7 + (who ? who.length : 0)) % 5] / 12);
    tone(f, 0, .05, v[1], who === "crane" || who === "duke" ? .03 : .045); }
  let rainNode = null;
  const FX = {
    get muted() { return !sfxOn && !musOn; },
    get sfxOn() { return sfxOn; }, get musicOn() { return musOn; },
    setSound(v) { FX.setSfx(!!v); FX.setMusic(!!v); },
    setSfx(v) { sfxOn = !!v; save(); if (sfxBus) sfxBus.gain.value = sfxOn ? 1 : 0; if (!sfxOn) FX.rain(false); else SFX.coin(); },
    setMusic(v) { musOn = !!v; save(); if (musBus) musBus.gain.value = musOn ? .5 : 0; if (window.Music) { if (musOn) Music.start(); else Music.stop(); } },
    unlock, get audioState() { return ac ? ac.state : "none"; }, get unlocked() { return unlocked; },
    ctx: () => { make(); return ac; }, get musBus() { make(); return musBus; }, get sfxBus() { make(); return sfxBus; },
    sfx(name, arg) { try { if (SFX[name]) SFX[name](arg); } catch (e) {} },
    names: Object.keys(SFX),
    blip(who, i) { try { blip(who, i); } catch (e) {} },
    clink() { SFX.coin(); },
    thud() { SFX.loss(); },
    // rain on the roof: a quiet filtered-noise bed, on while it rains
    rain(on) { try { if (!on) { if (rainNode) { rainNode.stop(); rainNode = null; } return; } if (rainNode || !ctx() || !noise()) return;
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; s.loop = true; f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = .5; g.gain.value = .05;
      s.connect(f); f.connect(g); g.connect(sfxBus); s.start(); rainNode = { stop() { try { g.gain.setTargetAtTime(0, ac.currentTime, .3); s.stop(ac.currentTime + 1); } catch (e) {} } }; } catch (e) {} },
    // a handful of coins fly up from the element and fall; a thud-and-shake on a loss
    cash(delta, el, wrap) {
      if (!delta) return; if (delta > 0) FX.clink(); else FX.thud();
      if (!el || !wrap || reduce()) return;
      const r = el.getBoundingClientRect(), w = wrap.getBoundingClientRect(), n = Math.min(10, 3 + Math.floor(Math.abs(delta) / 10));
      for (let i = 0; i < n; i++) { const c = document.createElement("i"); c.className = "coin " + (delta < 0 ? "lose" : "gain");
        c.style.left = (r.left - w.left + r.width / 2) + "px"; c.style.top = (r.top - w.top + r.height / 2) + "px";
        const dx = (Math.random() - .5) * 120, dy = delta > 0 ? -(30 + Math.random() * 50) : (20 + Math.random() * 40);
        wrap.appendChild(c);
        if (c.animate) c.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.6)`, opacity: 0 }], { duration: 700 + Math.random() * 300, easing: "cubic-bezier(.2,.8,.4,1)" }).onfinish = () => c.remove();
        setTimeout(() => c.remove(), 1200); }
    },
    shake(el) { if (!el || reduce() || !el.animate) return; el.animate([{ transform: "translate(0,0)" }, { transform: "translate(-4px,2px)" }, { transform: "translate(4px,-2px)" }, { transform: "translate(-2px,1px)" }, { transform: "translate(0,0)" }], { duration: 150 }); },
    // typewriter: every letter becomes a hidden span (textContent stays complete, so tests and screen readers see all the text); reveal runs per frame; el._finish() completes it.
    // onChar(letterIndex) is called as letters appear (the speaker's voice blips on it).
    type(el, cps, onChar) {
      if (reduce()) return; const nodes = [], wk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); while (wk.nextNode()) nodes.push(wk.currentNode);
      const spans = []; nodes.forEach(n => { const f = document.createDocumentFragment(); for (const ch of n.nodeValue) { if (/\s/.test(ch)) f.appendChild(document.createTextNode(ch)); else { const s = document.createElement("span"); s.className = "tw"; s.textContent = ch; spans.push(s); f.appendChild(s); } } n.parentNode.replaceChild(f, n); });
      let i = 0, per = Math.max(1, Math.round((cps || 200) / 60)); el.classList.add("typing");
      const finish = () => { clearInterval(el._tw); el._tw = null; spans.forEach(s => s.classList.add("on")); el.classList.remove("typing"); el._finish = null; };
      el._finish = finish; el._tw = setInterval(() => { for (let k = 0; k < per && i < spans.length; k++) { spans[i++].classList.add("on"); if (onChar && i % 3 === 1) onChar(i); } if (i >= spans.length) finish(); }, 1000 / 60);
    },
    fade(wrap, mid) { // 0.5 s fade out/in; mid() runs when the screen is black
      SFX.whoosh();
      let f = document.getElementById("fade"); if (!f) { f = document.createElement("div"); f.id = "fade"; wrap.appendChild(f); }
      f.classList.add("on"); setTimeout(() => { mid && mid(); setTimeout(() => f.classList.remove("on"), 60); }, 260);
    },
  };
  window.FX = FX;
})();
