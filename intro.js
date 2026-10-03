// Ledger & Crown: the opening. A short animated prologue (about 75 seconds) that sets up the story before the first lesson: a valley, a farmer who made a profit every year and died with an empty
// chest, the Crown's writ, a man in a grey cloak buying paper, and the heir (you) arriving at dawn. It is drawn with the game's own sprites on a canvas, scored with the game's own music
// and effects, and every spoken line is on screen as a subtitle. The script is DATA (Intro.SCRIPT): each line has an id, a speaker, the words and a delivery note, so a text-to-speech voice
// can be added later without touching the animation: Intro.setVoice("assets/voice/intro") plays <base>/<id>.mp3 as each line starts (see docs/INTRO-SCRIPT.md and tools/intro-script.js).
//   Intro.play(opts) -> Promise (resolves when the opening ends or is skipped). Intro.wanted(query) decides whether a new game should open with it.
window.Intro = (function () {
  "use strict";
  const W = 320, H = 180;
  // ---------- the script: the words are the subtitles now and the voiceover later ----------
  // at/dur are seconds from the start of the whole opening. Keep each line to one or two short sentences so a voice can say it without rushing.
  const SCRIPT = [
    { id: "i01", shot: 0, at: 1.2, dur: 4.6, who: "Narrator", dir: "warm, unhurried, a storyteller at dusk", text: "Thornfield Valley, in the spring of a hard year." },
    { id: "i02", shot: 0, at: 6.2, dur: 6.0, who: "Narrator", dir: "gentle, with a little irony on 'every one'", text: "Edric Thornfield farmed here for thirty years, and he made a profit every one of them." },
    { id: "i03", shot: 1, at: 13.4, dur: 4.4, who: "Narrator", dir: "bright, then a beat of silence", text: "Every night, his ledger said he was richer." },
    { id: "i04", shot: 1, at: 18.6, dur: 5.0, who: "Narrator", dir: "flat, quiet, the turn", text: "Every payday, his chest said something else." },
    { id: "i05", shot: 2, at: 26.6, dur: 4.6, who: "Narrator", dir: "low, plain", text: "He died in winter. The farm was left to you." },
    { id: "i06", shot: 2, at: 31.8, dur: 7.0, who: "Narrator", dir: "formal, like reading a notice; slow on the number", text: "And the Crown came with a writ: twelve hundred and fifty coins by Midwinter, or the land is theirs." },
    { id: "i07", shot: 3, at: 40.4, dur: 6.2, who: "Narrator", dir: "curious, lowering", text: "Someone in the valley has been buying up paper: mortgages, promises, other people's debts." },
    { id: "i08", shot: 3, at: 47.0, dur: 4.2, who: "Narrator", dir: "dry; a small smile in the voice", text: "A man in a grey cloak, who smiles a great deal." },
    { id: "i09", shot: 4, at: 54.0, dur: 6.4, who: "Narrator", dir: "warming, hopeful but honest", text: "You have one spring to learn why a farm that earns a profit runs out of coin." },
    { id: "i10", shot: 4, at: 60.8, dur: 4.8, who: "Narrator", dir: "affectionate, amused", text: "Maud Fenwick, the reeve, is waiting. She will not say 'good' unless you earn it." },
    { id: "i11", shot: 5, at: 69.0, dur: 4.6, who: "Maud", dir: "dry, exact, kind underneath", text: "Profit is an opinion. Cash is a fact." },
  ];
  // the shots: how long each runs, and which piece of the score and which sound effects go with it (t is seconds into the shot)
  const SHOTS = [
    { name: "The valley at dusk", dur: 12.6, mood: "night", cues: [[0.2, "bell"], [4.5, "whoosh"], [9.0, "knock"]] },
    { name: "The ledger and the chest", dur: 13.6, mood: "night", cues: [[0.4, "page"], [3.2, "page"], [5.5, "coin"], [6.4, "coin"], [7.3, "coin"], [8.2, "coin"], [9.1, "coin"], [11.5, "thud"]] },
    { name: "The writ", dur: 13.0, mood: "tense", cues: [[0.5, "knock"], [2.2, "step"], [3.0, "step"], [4.2, "step"], [7.4, "page"], [9.0, "stamp"], [10.6, "stamp"]] },
    { name: "The grey cloak", dur: 12.2, mood: "crane", cues: [[1.0, "whoosh"], [3.4, "step"], [4.2, "step"], [5.0, "stamp"], [6.2, "stamp"], [7.4, "stamp"], [9.0, "chime"]] },
    { name: "The heir arrives", dur: 14.4, mood: "farm", cues: [[0.2, "morning"], [2.0, "step"], [2.7, "step"], [3.4, "step"], [4.1, "step"], [4.8, "step"], [11.0, "chime"]] },
    { name: "Title", dur: 8.6, mood: "town", cues: [[0.6, "win"], [4.0, "coin"]] },
  ];
  const STARTS = SHOTS.reduce((a, s) => (a.push((a.length ? a[a.length - 1] + SHOTS[a.length - 1].dur : 0)), a), []);
  const TOTAL = STARTS[STARTS.length - 1] + SHOTS[SHOTS.length - 1].dur;
  // ---------- small helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * clamp(k, 0, 1), ease = k => k * k * (3 - 2 * k), prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const hash = n => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const mix = (c1, c2, k) => { const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), a = p(c1), b = p(c2); return "#" + a.map((v, i) => Math.round(lerp(v, b[i], k)).toString(16).padStart(2, "0")).join(""); };
  let ctx = null;
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const O = (x, y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); };
  const P = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
  const T = (s, x, y, size, c, align, font) => { ctx.font = `bold ${size}px ${font || "monospace"}`; ctx.fillStyle = c; ctx.textAlign = align || "left"; ctx.fillText(s, Math.round(x), Math.round(y)); ctx.textAlign = "left"; };
  const SPR = (spr, x, y, k) => { if (spr) ctx.drawImage(spr, Math.round(x), Math.round(y), Math.round(spr.width * k), Math.round(spr.height * k)); };
  const bands = (stops, y0, y1) => { const n = 18; for (let i = 0; i < n; i++) { const k = i / (n - 1), seg = k * (stops.length - 1), j = Math.min(stops.length - 2, Math.floor(seg)); R(0, y0 + (y1 - y0) * i / n, W, (y1 - y0) / n + 1, mix(stops[j], stops[j + 1], seg - j)); } };
  const people = () => (window.Art && Art.people) || {};
  const vignette = k => { const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
  const hills = (base, amp, col, seed, freq) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 4) ctx.lineTo(x, base + Math.sin(x * freq + seed) * amp + Math.sin(x * freq * 2.3 + seed * 2) * amp * .4); ctx.lineTo(W, H); ctx.fill(); };
  function house(x, y, k, lit) { R(x, y - 16 * k, 30 * k, 16 * k, "#3a2a22"); P([[x - 3 * k, y - 16 * k], [x + 15 * k, y - 28 * k], [x + 33 * k, y - 16 * k]], "#5a2a2a"); R(x + 22 * k, y - 32 * k, 4 * k, 9 * k, "#2a1d18"); R(x + 5 * k, y - 11 * k, 6 * k, 6 * k, lit ? "#f4d35e" : "#241a14"); R(x + 18 * k, y - 11 * k, 6 * k, 11 * k, "#241a14"); }

  // ---------- the six shots: each draws one whole frame from t (seconds into the shot) ----------
  const DRAW = [
    function dusk(t, d) { // 1: the valley at dusk, a slow push-in, a lit window, smoke, a crow
      ctx.save(); const z = lerp(1, 1.07, t / d); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2 + lerp(0, -4, t / d));
      bands(["#141c3a", "#2c3a66", "#8a5a6a", "#e8a058"], 0, 110);
      for (let i = 0; i < 46; i++) { const x = hash(i) * W, y = hash(i + 50) * 70, a = .35 + .55 * Math.abs(Math.sin(t * 1.3 + i)); ctx.globalAlpha = a * (1 - y / 90); R(x, y, 1, 1, "#f4ead0"); } ctx.globalAlpha = 1;
      O(252, 30, 9, 9, "#f4ead0"); O(255, 28, 8, 8, "#d9d0b0"); // moon
      hills(104, 8, "#3a3a5a", 1, .02); hills(118, 6, "#26323f", 4, .028); hills(136, 4, "#1c2a24", 9, .035);
      for (let i = 0; i < 9; i++) { R(0, 142 + i * 4.4, W, 1, i % 2 ? "#1a2a1a" : "#223022"); } // furrows
      house(190, 140, 1.6, Math.sin(t * 9) > -.7); // the farmhouse, window flickering
      for (let i = 0; i < 12; i++) { const k = ((t * .35 + i / 12) % 1), x = 190 + 1.6 * 24 + Math.sin(k * 6 + i) * 4 * k, y = 140 - 1.6 * 32 - k * 36; ctx.globalAlpha = .5 * (1 - k); O(x, y, 2 + k * 4, 2 + k * 3, "#9aa0b4"); } ctx.globalAlpha = 1;
      for (let i = 0; i < 3; i++) { R(30 + i * 16, 128 - i * 2, 2, 20, "#2a1d12"); } R(24, 134, 54, 1, "#2a1d12"); R(24, 140, 54, 1, "#2a1d12"); // fence
      const k = prog(t, 3.5, 9.5); if (k > 0 && k < 1) { const x = -10 + k * 340, y = 40 + Math.sin(k * 9) * 5 + k * 18, fl = Math.sin(t * 22) > 0; P([[x, y], [x - 4, y + (fl ? -3 : 2)], [x - 8, y]], "#0a0a10"); P([[x, y], [x + 4, y + (fl ? -3 : 2)], [x + 8, y]], "#0a0a10"); } // a crow
      ctx.restore(); vignette(.55);
    },
    function ledger(t, d) { // 2: the ledger climbs, the chest empties
      R(0, 0, W, H, "#241810"); for (let y = 0; y < H; y += 12) R(0, y, W, 1, "#2e2014"); const g = ctx.createRadialGradient(W / 2, 70, 10, W / 2, 80, 190); g.addColorStop(0, "rgba(255,200,110,.34)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const lk = ease(prog(t, 0, 1.2)); ctx.globalAlpha = lk; // the ledger, left
      R(14, 30, 142, 102, "#5a3a22"); R(18, 34, 66, 94, "#f1e3bf"); R(86, 34, 66, 94, "#efdfb6"); R(84, 34, 2, 94, "#c9b183");
      for (let i = 0; i < 9; i++) { R(22, 44 + i * 9, 56, 1, "#c9b183"); R(90, 44 + i * 9, 56, 1, "#c9b183"); }
      T("THE LEDGER", 85, 27, 8, "#f1e3bf", "center"); T("Profit", 52, 42, 7, "#7a4a22", "center"); const gk = prog(t, 1.5, 9.5), profit = Math.round(lerp(0, 1254, ease(gk)));
      ctx.strokeStyle = "#2f6f62"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 20; i++) { const kk = i / 20 * gk, x = 22 + i / 20 * 56, y = 120 - Math.pow(kk, 1.4) * 64; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
      T("+" + profit, 118, 88, 15, "#2f6f62", "center"); T("a good year", 118, 102, 7, "#7a4a22", "center"); ctx.globalAlpha = 1;
      const ck = prog(t, 3.8, 11); // the chest, right: coins fall out one by one
      T("THE CHEST", 232, 27, 8, "#f1e3bf", "center"); SPR(window.Art && Art.chest, 202, 50, 4); const left = Math.max(0, Math.round(lerp(60, 0, ease(ck))));
      for (let i = 0; i < 5; i++) { const kk = prog(t, 5.2 + i * .9, 6.4 + i * .9); if (kk > 0 && kk < 1) { O(214 + i * 10 + Math.sin(kk * 6) * 6, 78 + kk * 56, 4, 4, "#f4d35e"); O(214 + i * 10 + Math.sin(kk * 6) * 6, 78 + kk * 56, 2, 2, "#d9a83a"); } }
      T("Cash " + left, 232, 128, 12, left > 20 ? "#f4d35e" : "#e0583a", "center"); if (left === 0 && t > 11) { ctx.globalAlpha = .6 + .4 * Math.sin(t * 8); T("EMPTY", 232, 142, 10, "#e0583a", "center"); ctx.globalAlpha = 1; }
      vignette(.5);
    },
    function writ(t, d) { // 3: Crane brings the writ
      bands(["#14161c", "#242a36"], 0, H); R(0, 128, W, 52, "#1a1612"); for (let x = 0; x < W; x += 20) R(x, 128, 1, 52, "#221c16"); // dark room
      R(210, 24, 62, 76, "#0e1018"); R(212, 26, 58, 72, mix("#1d2540", "#3a4a78", .5 + .3 * Math.sin(t))); R(240, 26, 2, 72, "#0e1018"); R(212, 60, 58, 2, "#0e1018"); // window
      const cr = (people().crane || {}), ck = ease(prog(t, 0.6, 5.2)), x = lerp(-30, 96, ck), fr = Math.floor(t * 5) % 2 ? 1 : 2; SPR(ck < 1 ? cr.right && cr.right[fr] : cr.down && cr.down[0], x, 70, 4);
      const wk = prog(t, 5.8, 8.4); if (wk > 0) { const h = lerp(8, 82, ease(wk)); R(168, 30, 70, h + 4, "#9a7a4a"); R(170, 32, 66, h, "#f1e3bf"); // the writ unrolls
        for (let i = 0; i < Math.floor(h / 9) - 1; i++) R(176, 42 + i * 9, 54 - (i % 3) * 8, 1, "#b8a070"); if (wk > .9) { T("1,250", 203, 62, 16, "#9b2335", "center"); T("by Midwinter", 203, 74, 7, "#5a4a38", "center"); } }
      const sk = prog(t, 8.8, 9.2); if (sk > 0) { O(190, 106, 9, 9, "#9b2335"); O(190, 106, 6, 6, "#c43a4a"); T("C", 190, 109, 8, "#f1e3bf", "center"); }
      const s2 = prog(t, 10.4, 10.8); if (s2 > 0) { O(218, 108, 5, 5, "#7a1a2a"); ctx.strokeStyle = "#241018"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(214, 104); ctx.lineTo(222, 112); ctx.moveTo(222, 104); ctx.lineTo(214, 112); ctx.stroke(); if (t > 11) { ctx.globalAlpha = .5 + .5 * Math.sin(t * 6); ctx.strokeStyle = "#f4d35e"; ctx.strokeRect(209, 99, 18, 18); ctx.globalAlpha = 1; } } // the second, scratched seal
      for (let i = 0; i < 16; i++) { const px = (hash(i) * W + t * 6) % W, py = (hash(i + 30) * H + t * 4) % H; ctx.globalAlpha = .12; R(px, py, 1, 1, "#f4ead0"); } ctx.globalAlpha = 1; vignette(.6);
    },
    function cloak(t, d) { // 4: the man in the grey cloak buys the valley's paper
      bands(["#2a2440", "#a05a58", "#e8a058"], 0, 100); hills(96, 5, "#2c2a44", 3, .03); R(0, 100, W, 80, "#1b1a22"); for (let y = 104; y < H; y += 8) R(0, y, W, 1, "#222030");
      for (let i = 0; i < 5; i++) { const hx = 20 + i * 62, k = prog(t, 3.2 + i * 1.1, 3.8 + i * 1.1); house(hx, 96, .8, i % 2 === 0); if (k > 0) { ctx.globalAlpha = Math.min(1, k * 1.4); R(hx + 4, 62 - 4 * (k < 1 ? 1 - k : 0), 12, 9, "#9b2335"); T("SOLD", hx + 10, 70, 5, "#f1e3bf", "center"); ctx.globalAlpha = 1; } }
      const k = ease(prog(t, 0.6, 5.5)), x = lerp(330, 150, k), bob = Math.sin(t * 6) * (k < 1 ? 1.2 : 0); // the figure
      P([[x, 78 + bob], [x + 22, 78 + bob], [x + 30, 150], [x - 8, 150]], "#5a5a66"); P([[x, 78 + bob], [x + 22, 78 + bob], [x + 11, 56 + bob]], "#6a6a76"); O(x + 11, 72 + bob, 6, 7, "#3a3040"); // cloak, hood, shadowed face
      ctx.strokeStyle = "#f4ead0"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + 11, 73 + bob, 3.5, .15, Math.PI - .15); ctx.stroke(); // the smile
      R(x - 2, 96 + bob, 4, 4, "#1c1c22"); R(x + 24, 96 + bob, 4, 4, "#1c1c22"); // gloves
      const pk = prog(t, 5.6, 11); for (let i = 0; i < Math.floor(pk * 9); i++) { R(x + 34 + (i % 3) * 8, 148 - Math.floor(i / 3) * 5, 14, 4, i % 2 ? "#f1e3bf" : "#e6d6a8"); R(x + 44 + (i % 3) * 8, 149 - Math.floor(i / 3) * 5, 2, 2, "#9b2335"); } // paper stacks up
      vignette(.5);
    },
    function arrive(t, d) { // 5: dawn, the heir walks up the road, Maud waits at the gate
      const up = ease(prog(t, 0, 9)); bands([mix("#2c3a66", "#6aa0d8", up), mix("#8a5a6a", "#f4c880", up), mix("#e8a058", "#fbe8b0", up)], 0, 104);
      O(lerp(70, 90, up), lerp(104, 44, up), 13, 13, "#fbe8b0"); O(lerp(70, 90, up), lerp(104, 44, up), 9, 9, "#fff6d0");
      hills(100, 6, mix("#3a3a5a", "#6a8a7a", up), 1, .02); hills(116, 5, mix("#26323f", "#4a7a4a", up), 4, .03);
      R(0, 124, W, 56, mix("#1c2a24", "#5a8a4a", up)); R(0, 138, W, 22, mix("#2a2218", "#a68a5a", up)); for (let x = 0; x < W; x += 14) R(x + (t * 3 % 14), 148, 6, 1, mix("#2a2218", "#8a6a3a", up)); // the road
      R(236, 98, 3, 40, "#5a3a22"); R(268, 98, 3, 40, "#5a3a22"); R(232, 104, 44, 3, "#6b4526"); R(232, 118, 44, 3, "#6b4526"); house(250, 98, 1, true);
      for (let i = 0; i < 4; i++) { const bx = (t * 22 + i * 90) % 360 - 20, by = 40 + i * 9 + Math.sin(t * 3 + i) * 3; if (up > .5) { R(bx, by, 3, 1, "#1c1c22"); R(bx + 3, by - 1, 3, 1, "#1c1c22"); } } // birds
      const pl = people(), hk = ease(prog(t, 1, 8.4)), hx = lerp(-24, 128, hk), fr = 1 + Math.floor(t * 6) % 2; SPR(hk < 1 ? pl.player && pl.player.right[fr] : pl.player && pl.player.right[0], hx, 96, 3); // you
      SPR(pl.maud && pl.maud.left[0], 196, 94, 3); const ab = prog(t, 8.8, 10); if (ab > 0) { R(180, 124, 16, 2, "#6b4526"); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) R(181 + c * 4, 118 + r * 2, 2, 1, "#f4d35e"); }
      vignette(.3);
    },
    function title(t, d) { // 6: the title card
      const a = ease(prog(t, 0, 2)); R(0, 0, W, H, "#120c08"); const g = ctx.createRadialGradient(W / 2, 78, 6, W / 2, 80, 150); g.addColorStop(0, `rgba(244,211,94,${.26 * a})`); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = a; for (const [dx, c] of [[1, "#5a3a10"], [0, "#f4d35e"]]) { T("LEDGER", 160 + dx, 52 + dx, 30, c, "center", "Georgia, serif"); T("& CROWN", 160 + dx, 84 + dx, 30, c, "center", "Georgia, serif"); }
      R(70, 94, 180, 1, "#b8862b"); T("Spring at Thornfield", 160, 112, 11, "#f1e3bf", "center", "Georgia, serif"); ctx.globalAlpha = 1;
      const w = Math.cos(t * 3), cx = 160, cy = 138; ctx.globalAlpha = a; O(cx, cy, Math.max(.5, Math.abs(w) * 7), 7, "#d9a83a"); O(cx, cy, Math.max(.3, Math.abs(w) * 5), 5, "#f4d35e"); ctx.globalAlpha = 1; // a spinning coin
      const f = prog(t, d - 1.4, d); if (f > 0) { ctx.globalAlpha = f; R(0, 0, W, H, "#000"); ctx.globalAlpha = 1; }
    },
  ];

  // ---------- playback ----------
  let st = null, voiceBase = null, voiceExt = "mp3", active = false;
  const shotAt = t => { let i = STARTS.length - 1; while (i > 0 && t < STARTS[i]) i--; return i; };
  const lineAt = t => SCRIPT.find(l => t >= l.at && t < l.at + l.dur) || null;
  function frame(t) { // draw the whole opening at time t (also used by tests and screenshots)
    if (!ctx) return; ctx.imageSmoothingEnabled = false; const i = shotAt(t), local = t - STARTS[i]; ctx.save(); DRAW[i](local, SHOTS[i].dur);
    const fi = Math.min(.8, 1 - prog(local, 0, .6)), fo = prog(local, SHOTS[i].dur - .5, SHOTS[i].dur); const dark = i === SHOTS.length - 1 ? fi : Math.max(fi, i < SHOTS.length - 1 ? fo : 0); if (dark > 0) { ctx.fillStyle = `rgba(0,0,0,${dark})`; ctx.fillRect(0, 0, W, H); } ctx.restore();
  }
  function setVoice(base, ext) { voiceBase = base || null; if (ext) voiceExt = ext; }
  const manifest = () => SCRIPT.map(l => ({ id: l.id, speaker: l.who, text: l.text, direction: l.dir, start: l.at, maxSeconds: l.dur, file: l.id + "." + voiceExt }));
  function sound(name) { try { if (window.FX && FX.sfx) FX.sfx(name); } catch (e) {} }
  function say(l) { // a line starts: subtitle, and the voice file if one is set
    if (!st) return; const el = st.sub; el.innerHTML = `<span class="in-who">${l.who}</span><span class="in-txt">${l.text}</span>`; el.classList.add("on"); st.line = l.id; st.said.push(l.id);
    if (voiceBase) try { const a = new Audio(`${voiceBase}/${l.id}.${voiceExt}`); a.volume = 1; st.audio = a; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  }
  function step(now) {
    if (!st) return; const dt = Math.min(.1, (now - (st.last || now)) / 1000); st.last = now; if (!st.hold) st.t += dt * st.speed;
    const t = st.t; if (t >= TOTAL) return end("done");
    frame(t);
    const si = shotAt(t); if (si !== st.shot) { st.shot = si; st.cueI = 0; try { if (window.Music) { Music.start(); Music.setMood(SHOTS[si].mood); } } catch (e) {} }
    const local = t - STARTS[si]; while (st.cueI < SHOTS[si].cues.length && SHOTS[si].cues[st.cueI][0] <= local) { sound(SHOTS[si].cues[st.cueI][1]); st.fired.push(SHOTS[si].cues[st.cueI][1]); st.cueI++; }
    const l = lineAt(t); if (l && st.line !== l.id) say(l); else if (!l && st.line) { st.line = null; st.sub.classList.remove("on"); }
    const bar = st.root.querySelector("#in-bar i"); if (bar) bar.style.width = (t / TOTAL * 100).toFixed(1) + "%";
    st.raf = requestAnimationFrame(step);
  }
  function end(how) {
    if (!st) return; const s = st; st = null; active = false; cancelAnimationFrame(s.raf); document.removeEventListener("keydown", s.key, true); try { if (s.audio) s.audio.pause(); } catch (e) {}
    s.root.classList.add("out"); setTimeout(() => s.root.remove(), 380); document.body.classList.remove("in-intro"); try { localStorage.setItem("lc_intro_seen", "1"); } catch (e) {} s.done({ how, said: s.said, fired: s.fired });
  }
  // opts.speed: playback rate (tests); opts.hold: do not advance until released (screenshots); opts.autostart: skip the "tap to begin" gate
  function play(opts) {
    opts = opts || {}; if (st) return st.promise; let done; const promise = new Promise(r => { done = r; });
    const root = document.createElement("div"); root.id = "intro"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "The opening");
    root.innerHTML = `<div class="in-stage"><canvas id="in-cv" width="${W}" height="${H}"></canvas><div class="in-sub" id="in-sub" aria-live="polite"></div><div class="in-gate" id="in-gate"><b>Ledger &amp; Crown</b><span>Spring at Thornfield</span><button type="button" id="in-go">Begin</button><small>Sound on. Tap, or press Enter.</small></div></div><div class="in-top"><span id="in-bar"><i></i></span><button type="button" id="in-skip">Skip</button></div>`;
    document.body.appendChild(root); document.body.classList.add("in-intro"); active = true; ctx = root.querySelector("#in-cv").getContext("2d"); const go = root.querySelector("#in-go");
    const start = () => { if (!st || !go.isConnected) return; try { if (window.FX) FX.unlock(); } catch (e) {} root.querySelector("#in-gate").remove(); st.last = performance.now(); st.raf = requestAnimationFrame(step); };
    const key = e => { if (e.key === "Escape") { e.stopPropagation(); end("skipped"); } else if ((e.key === "Enter" || e.key === " ") && go.isConnected) { e.preventDefault(); e.stopPropagation(); start(); } else e.stopPropagation(); }; // (the game underneath hears no keys while the opening is up)
    st = { t: 0, last: 0, speed: opts.speed || 1, hold: !!opts.hold, root, sub: root.querySelector("#in-sub"), shot: -1, cueI: 0, line: null, said: [], fired: [], key, done, raf: 0, promise };
    document.addEventListener("keydown", key, true); root.querySelector("#in-skip").onclick = () => end("skipped");
    frame(0); go.onclick = start; if (opts.autostart) start(); setTimeout(() => go.isConnected && go.focus({ preventScroll: true }), 30);
    return promise;
  }
  // a new story game opens with it (sandbox, fast test runs and ?intro=0 don't); ?intro=1 forces it
  const wanted = q => { q = q || new URLSearchParams(location.search); if (q.get("intro") === "1") return true; if (q.get("intro") === "0" || q.has("fast") || q.has("sandbox") || q.has("new")) return false; return true; };
  const debug = { get st() { return st; }, frame, seek(t) { if (st) { st.t = t; st.hold = true; frame(t); } }, release() { if (st) st.hold = false; }, canvas: () => document.getElementById("in-cv") };
  return { SCRIPT, SHOTS, STARTS, TOTAL, play, end: how => end(how || "skipped"), wanted, setVoice, manifest, frame, debug, get active() { return active; } };
})();
