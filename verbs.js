// Ledger & Crown — WS3 verbs: things the player DOES instead of typing sums (projects/mba-game/specs/WS3-first-15-minutes.md).
//   tag      tap world objects; each correct tap writes a line on a parchment that builds a statement (the balance sheet).
//   bet      Maud's wager: name a number, stake real Cash (posted so the books tie), the answer is revealed now or on a later morning.
//   timeline a 14-day strip of cash events with a Cash line under it (show / play / predict).
// Method: generation effect and predict-then-reveal (Slamecka & Graf 1978; Kornell, Hays & Bjork 2009: errors before feedback help
// learning), productive failure (Kapur 2008) for the wages-day miss. Numbers are always functions of game state, never literals.
// Mouse and touch use the same click/pointer events; nothing is hover-only. UI styles live in verbs.css (--panel --ink --gold ... with fallbacks).
window.Verbs = (function () {
  const $ = id => document.getElementById(id), T = 16;
  let G, S, tagSt = null, craneOn = false;
  const fmt = n => (n < 0 ? "−" : "") + Math.abs(n).toLocaleString("en-US");
  const el = (cls, html, parent) => { const e = document.createElement("div"); e.className = cls; e.innerHTML = html || ""; (parent || $("wrap")).appendChild(e); return e; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  function init(g) { G = g; S = Spring; }

  // ---------- shared bits: a remark that fades, the stamp, a thud ----------
  function remark(text) { document.querySelectorAll(".vsay").forEach(e => e.remove()); const e = el("vsay", text); setTimeout(() => e.remove(), 3300); }
  function thud() { if (window.FX) FX.thud(); } // the one shared, iOS-unlocked audio context in fx.js (and it respects the sound switch; this used to open a new context on every stamp and ignore it)
  async function stamp(text, sub) { const e = el("vstamp", `${text}${sub ? `<small>${sub}</small>` : ""}`); thud(); await wait(window.__fastVerbs ? 30 : 1300); return e; }

  // ---------- the parchment ----------
  const P = { assets: [], liab: [], aTot: null, lTot: null, eq: null, hint: "", on: false }; // on: the parchment is part of a lesson right now; nothing may re-create it once it is closed
  function parchHtml() {
    const rows = a => a.map(r => `<div class="vp-row"><span>${r.line}</span><b>${fmt(r.value)}</b></div>`).join("");
    return `${tagSt ? "" : `<button type="button" class="vp-x" aria-label="Close this page">✕</button>`}<h4>${P.title || "Thornfield"}, as the Crown sees it</h4><div class="vp-sec">Assets <span style="font-weight:normal;font-size:13px">(what the farm owns)</span></div>${rows(P.assets)}${P.aTot != null ? `<div class="vp-tot"><span>Total assets</span><b>${fmt(P.aTot)}</b></div>` : ""}` +
      (P.liab.length ? `<div class="vp-sec">Liabilities <span style="font-weight:normal;font-size:13px">(what it owes)</span></div>${rows(P.liab)}${P.lTot != null ? `<div class="vp-tot"><span>Total liabilities</span><b>${fmt(P.lTot)}</b></div>` : ""}` : "") +
      (P.eq != null ? `<div class="vp-tot"><span>Owner's equity</span><b class="${P.eq < 0 ? "vp-neg" : ""}">${fmt(P.eq)}</b></div>` : "") + (P.hint ? `<div class="vp-hint">${P.hint}</div>` : "") +
      (P.where ? `<button type="button" class="vp-where">Where else?</button>` : "");
  }
  // the card needs an id: without one getElementById never found it, so every update made a NEW card and none could ever be closed
  function parch(show) { let e = $("vparch"); if (!e && show !== false && P.on) { e = el("vparch"); e.id = "vparch"; } if (e) { e.innerHTML = parchHtml(); const w = e.querySelector(".vp-where"); if (w) w.onclick = () => whereElse(); const x = e.querySelector(".vp-x"); if (x) x.onclick = ev => { ev.stopPropagation(); parchClose(); }; e.onclick = () => { if (!tagSt) parchClose(); }; } return e; }
  function parchReset() { Object.assign(P, { assets: [], liab: [], aTot: null, lTot: null, eq: null, hint: "", where: false, on: true }); const e = $("vparch"); if (e) e.remove(); }
  function parchClose() { P.on = false; const e = $("vparch"); if (e) e.remove(); document.querySelectorAll(".vstamp").forEach(x => x.remove()); }
  async function countTotal(key, to) { // the totals add themselves with a counting animation
    const steps = window.__fastVerbs ? 1 : 14; for (let i = 1; i <= steps; i++) { P[key] = Math.round(to * i / steps); parch(); await wait(window.__fastVerbs ? 0 : 45); } P[key] = to; parch();
  }
  const pinRow = (side, line, value) => { P[side].push({ line, value }); parch(); };

  // ---------- tag ----------
  // cfg: { targets:[{id, tiles:[[x,y]...] | ()=>tiles, line, value, side:"assets", say?}], decoys:[{tiles, says}], show:n (NPC tags the first n), hintAfter:ms }
  // Resolves when every target is tagged. The canvas tap arrives through canvasTap() (game.js calls it before it turns a tap into a walk).
  function tag(cfg) {
    return new Promise(res => {
      tagSt = { cfg, done: new Set(), res, pulse: null, pulseUntil: 0, timer: null }; P.on = true;
      P.where = false; P.hint = "Tap what the farm owns."; parch();
      (cfg.targets.slice(0, cfg.show || 0)).forEach(t => tagged(t, true));
      tagSt.timer = setTimeout(() => { if (tagSt) { P.where = true; parch(); } }, cfg.hintAfter != null ? cfg.hintAfter : 20000);
    });
  }
  const tilesOf = o => typeof o.tiles === "function" ? o.tiles() : o.tiles;
  const hit = (o, tx, ty) => tilesOf(o).some(([x, y]) => x === tx && y === ty);
  function tagged(t, byNpc) {
    if (!tagSt || tagSt.done.has(t.id)) return;
    tagSt.done.add(t.id); pinRow(t.side || "assets", t.line, typeof t.value === "function" ? t.value() : t.value);
    if (tagSt.cfg.onTag) tagSt.cfg.onTag(t, !!byNpc);
    if (tagSt.done.size === tagSt.cfg.targets.length) {
      const st = tagSt; tagSt = null; clearTimeout(st.timer); P.where = false; P.hint = ""; parch(); st.res([...st.done]);
    }
  }
  function canvasTap(tx, ty) { // true when the tap was a tag (or a rebuke), so the game doesn't also walk there
    if (!tagSt) return false;
    const t = tagSt.cfg.targets.find(o => !tagSt.done.has(o.id) && hit(o, tx, ty));
    if (t) { tagged(t); return true; }
    const done = tagSt.cfg.targets.find(o => tagSt.done.has(o.id) && hit(o, tx, ty)); if (done) { remark("Already on the list."); return true; }
    const d = tagSt.cfg.decoys.find(o => hit(o, tx, ty)); if (d) { remark(d.says); return true; }
    return false;
  }
  function whereElse() { if (!tagSt) return; window.__walked = true; // asking "Where else?" is a hint: no mastery credit for this tag
 const left = tagSt.cfg.targets.filter(o => !tagSt.done.has(o.id)); if (!left.length) return;
    const pl = G.pl, px = pl.x / T, py = pl.y / T, d = o => Math.min(...tilesOf(o).map(([x, y]) => Math.hypot(x - px, y - py)));
    left.sort((a, b) => d(a) - d(b)); tagSt.pulse = left[0].id; tagSt.pulseUntil = Date.now() + 5000; }
  // test helper: tap the first untagged target through the real hit-test; returns false when nothing is left
  function tapNext() { if (!tagSt) return false; const t = tagSt.cfg.targets.find(o => !tagSt.done.has(o.id)); if (!t) return false; const [x, y] = tilesOf(t)[0]; return canvasTap(x, y); }
  function tapDecoy() { if (!tagSt) return false; const d = tagSt.cfg.decoys[0]; if (!d) return false; const [x, y] = tilesOf(d)[0]; return canvasTap(x, y); }
  // drawn by game.js at the end of its draw(): gold frames round tagged things, a pulsing frame on the hinted one
  function draw(ctx, cam, frame) {
    if (!tagSt) return;
    const frame1 = (o, col, w) => { const ts = tilesOf(o), x0 = Math.min(...ts.map(t => t[0])), y0 = Math.min(...ts.map(t => t[1])), x1 = Math.max(...ts.map(t => t[0])), y1 = Math.max(...ts.map(t => t[1]));
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.strokeRect(x0 * T - cam.x - 1, y0 * T - cam.y - 1, (x1 - x0 + 1) * T + 2, (y1 - y0 + 1) * T + 2); };
    tagSt.cfg.targets.forEach(o => { if (tagSt.done.has(o.id)) frame1(o, "#f0b429", 2); });
    if (tagSt.pulse && Date.now() < tagSt.pulseUntil) { const o = tagSt.cfg.targets.find(x => x.id === tagSt.pulse); if (o && !tagSt.done.has(o.id)) frame1(o, Math.floor(frame / 8) % 2 ? "#ffffff" : "#e0412f", 3); }
  }

  // ---------- bet ----------
  // cfg: { prompt, docs:[{label, open}], how, stake:{min,max}, tol, answer: ()=>number (what is right, given what the player has now),
  //        reveal: "now" | { day }, kind, explain: ()=>html (shown after the reveal), key }
  // The wager is real Cash, posted so the books tie (Spring.wager). "now" reveals at once; {day} leaves a card in the HUD
  // (G.s.bet, saved with the game) and Verbs.revealBet() is called on that morning: predicted vs actual, and each difference named.
  async function bet(cfg) {
    const mx = cfg.stake ? cfg.stake.max : 5, mn = cfg.stake ? cfg.stake.min : 0; let extra = "", guess = null; window.__want = cfg.answer(); // __want: the test harness types it, like ask()
    for (;;) {
      const docs = cfg.docs || [], labels = ["Place my bet"].concat(docs.map(d => d.label), cfg.how ? ["Explain how"] : []);
      const r = await G.dlg({ who: "maud", text: cfg.prompt + extra, input: "your number", choices: labels });
      const lab = labels[r.i];
      if (lab === "Explain how") { extra = `<br><span class="hintline"><b>How:</b> ${cfg.how}</span>`; window.__walked = true; continue; } // taking the hint means the lesson was walked: no mastery credit
      if (r.i > 0 && lab !== "Place my bet") { await G.openDoc(docs[r.i - 1].open); continue; }
      if (r.v == null || isNaN(r.v)) { extra = `<br><i class="hintline">Type a number first.</i>`; continue; }
      guess = r.v; break;
    }
    window.__want = undefined;
    const cash = G.s.bal.cash, opts = []; for (let k = mn; k <= Math.min(mx, cash); k++) opts.push(k);
    const pick = await G.dlg({ who: "maud", text: `You say <b>${guess}</b>. Stake some real coin on it? Right, and I pay you the stake again. Wrong, I keep it.`, choices: opts.map(k => k ? `Stake ${k}` : "No stake") });
    const stake = opts[pick.i] || 0;
    if (stake) G.act(() => Spring.wager(G.s, stake, "Bet with Maud"));
    const b = { guess, stake, kind: cfg.kind || "bet", tol: cfg.tol || 0, base: G.s.journal.length, day: G.s.day };
    if (cfg.reveal === "now") { b.answer = cfg.answer(); return finish(b, cfg); }
    b.revealDay = cfg.reveal.day; b.predicted = cfg.answer(); b.explain = cfg.explain ? cfg.explain() : ""; G.s.bet = b; cardTick(); G.save();
    return { guess, stake, pending: true };
  }
  async function finish(b, cfg) { // immediate reveal
    const win = Math.abs(b.guess - b.answer) <= b.tol; if (win) G.act(() => Spring.wagerWin(G.s, b.stake, "Bet with Maud"));
    const pay = b.stake ? (win ? ` You win ${b.stake}: it comes back with ${b.stake} more.` : ` I keep your ${b.stake}.`) : "";
    await G.dlg({ who: "maud", text: `${win ? "Right." : `Not quite. It's ${b.answer}.`} You said ${b.guess}.${pay}${cfg && cfg.explain ? `<br><i>${cfg.explain()}</i>` : ""}`, choices: ["Next"] });
    return { win, guess: b.guess, stake: b.stake, answer: b.answer };
  }
  // Called on the morning a delayed bet is due. Shows predicted vs actual and names the difference: the unplanned postings since the bet.
  const PLANNED = new Set(["collect", "upkeep", "interest", "dep", "wager"]);
  async function revealBet() {
    const b = G.s.bet; if (!b || G.s.day < b.revealDay) return null;
    const actual = G.s.bal.cash, extras = G.s.journal.filter(j => j.n > b.base && !PLANNED.has(j.type) && j.lines.cash), delta = extras.reduce((a, j) => a + j.lines.cash, 0), adj = actual - delta + b.stake; // the stake already left the chest when the bet was placed
    const win = Math.abs(b.guess - adj) <= b.tol; if (win) G.act(() => Spring.wagerWin(G.s, b.stake, "Bet with Maud"));
    const why = extras.length ? `<br>The difference is yours: ${extras.map(j => `${j.memo.replace(/ \(.*$/, "")}: ${j.lines.cash > 0 ? "+" : "−"}${Math.abs(j.lines.cash)}`).join("; ")}. Without ${delta > 0 ? "them" : "them"} the chest would hold ${adj}.` : "";
    const pay = b.stake ? (win ? ` You win ${b.stake}.` : ` I keep your ${b.stake}.`) : "";
    G.s.bet = null; cardTick();
    await G.dlg({ who: "maud", text: `<b>The bet.</b> You said ${b.guess} (day ${b.day}). The chest holds <b>${actual}</b>.${why}<br>${win ? "You read the books right." : `The books said ${adj}; you said ${b.guess}.`}${pay}${b.explain ? `<br><i>${b.explain}</i>` : ""}`, choices: ["Next"] });
    return { win, guess: b.guess, actual, adj, stake: b.stake };
  }
  function cardTick() { // a small card in the HUD for a pending bet (drawn from G.s.bet; no hover needed)
    let c = $("vbetcard"); const b = G && G.s && G.s.bet;
    if (!b) { if (c) c.remove(); return; }
    if (!c) { c = el("vcard"); c.id = "vbetcard"; }
    c.innerHTML = `<b>Maud's bet:</b> you said ${b.guess}${b.stake ? ` · stake ${b.stake}` : ""} · day ${b.revealDay}`;
  }
  setInterval(() => { try { cardTick(); } catch (e) {} }, 700);

  // ---------- timeline ----------
  // cfg: { mode: "show"|"play"|"predict", n, title, maud, hideLine, bill }
  //   show     the strip with its cards; hideLine hides the Cash line (the player works it out)
  //   play     one Tomas bill is a purple card the player moves (drag, or tap a day): inside the discount window it shrinks; the line redraws live. Resolves {day, paidNow}
  //   predict  line hidden; the player names the lowest Cash and the day; the line draws in and their guess is marked. Resolves {okLow, okDay, low, lowDay, guess, guessDay}
  function rowsFor(cfg, moved) { // the forecast, with the movable bill moved
    const s = G.s, rows = S_.forecast(s, cfg.n || 14, cfg.extra).map(r => Object.assign({}, r)), b = cfg.bill;
    if (b && moved != null) { const home = rows.find(r => r.day === Math.max(s.day, b.due)); if (home) { home.bills -= b.amount; home.cout -= b.amount; }
      const to = rows.find(r => r.day === moved), amt = moved <= b.discBy ? b.amount - b.disc : b.amount; if (to) { to.bills += amt; to.cout += amt; to.mine = amt; } }
    let cash = rows.length ? rows[0].open : 0; rows.forEach(r => { r.open = cash; cash = cash + r.cin - r.cout; r.close = cash; });
    // WS6: cfg.tied adds a second line beside Cash: what is tied up in sacks and invoices (receivables + inventory - payables).
    // Seed bought today (cfg.extra) becomes inventory; an invoice paid lowers it; a bill paid raises it (payables fall);
    // cfg.order = {sacks, price, due}: delivering a big order on terms turns its sacks (at cost) into a receivable at the price.
    if (cfg.tied) { const bs = Spring.balanceSheet(s.bal), o = cfg.order; let tied = bs.ar + bs.inv - bs.ap + (cfg.extra || 0);
      rows.forEach(r => { tied += r.bills - r.cin; if (o && r.day === o.due) tied += o.sacks * (o.price - Spring.R.unitCost); r.tied = tied; }); }
    return rows;
  }
  const S_ = { forecast: (s, n, x) => Spring.forecast(s, n, x) };
  function tlHtml(cfg, rows, st) {
    const n = rows.length, lo = Math.min(0, ...rows.map(r => r.close)), hi = Math.max(1, ...rows.map(r => r.close)), H = 130, Y = v => 8 + (hi - v) / (hi - lo) * (H - 16), X = i => (i + .5) * 100;
    let svg = `<svg class="vtl-line" viewBox="0 0 ${n * 100} ${H}" preserveAspectRatio="none"><line x1="0" x2="${n * 100}" y1="${Y(0)}" y2="${Y(0)}" stroke="#7a5a3a" stroke-dasharray="6 6"/>`;
    if (!st.hide) { for (let i = 1; i < n; i++) { const a = rows[i - 1].close, b = rows[i].close, neg = Math.min(a, b) < 0; svg += `<line x1="${X(i - 1)}" y1="${Y(a)}" x2="${X(i)}" y2="${Y(b)}" stroke="${neg ? "#9b2335" : "#2f6f3a"}" stroke-width="4"/>`; }
      rows.forEach((r, i) => svg += `<circle cx="${X(i)}" cy="${Y(r.close)}" r="6" fill="${r.close < 0 ? "#9b2335" : "#2f6f3a"}"/>`); }
    if (st.mark) { const i = rows.findIndex(r => r.day === st.mark.day); if (i >= 0) svg += `<circle cx="${X(i)}" cy="${Y(st.mark.v)}" r="11" fill="none" stroke="#3b6fd0" stroke-width="4"/>`; }
    svg += `</svg>`;
    const cols = rows.map((r, i) => {
      const cards = []; if (r.cin) cards.push(`<div class="vtl-card in">+${r.cin} ${G.s.invoices.filter(v => v.due === r.day).map(v => Spring.NAMES[v.who].split(" ")[0]).join(", ") || "paid"}</div>`);
      if (r.wages) cards.push(`<div class="vtl-card out">−${r.wages} wages</div>`);
      if (r.bills && !(r.mine)) cards.push(`<div class="vtl-card out">−${r.bills} Tomas</div>`);
      if (r.fines) cards.push(`<div class="vtl-card out">−${r.fines} forfeit</div>`);
      if (r.mine) cards.push(`<div class="vtl-card move" data-move="1">Tomas −${r.mine}${r.mine < cfg.bill.amount ? ` (saves ${cfg.bill.amount - r.mine})` : ""}</div>`);
      return `<div class="vtl-day${r.day === G.s.day ? " today" : ""}${st.sel === r.day ? " sel" : ""}" data-day="${r.day}"><span class="d">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][(r.day - 1) % 7]} ${r.day}</span>${cards.join("")}${st.hide ? "" : `<div class="vtl-cash${r.close < 0 ? " neg" : ""}">${r.close}</div>`}${cfg.tied && !st.hide ? `<div class="vtl-tied" title="tied up in sacks and invoices">${r.tied}</div>` : ""}</div>`; }).join("");
    const legend = cfg.tied && !st.hide ? `<div class="vtl-legend"><b>Top number:</b> Cash. <b class="t">Small number:</b> tied up in sacks and invoices (receivables + inventory − payables). It grows with sales and only comes back when growth stops.</div>` : "";
    return `<div class="vtl"><h1>${cfg.title || "Your next two weeks"}</h1>${cfg.maud ? `<div class="maudline"><b>Maud:</b> ${cfg.maud}</div>` : ""}${legend}${svg}<div class="vtl-grid" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${cols}</div><div class="vtl-sum" id="vtlsum">${st.sum || ""}</div>${st.foot || ""}</div>`;
  }
  function timeline(cfg) {
    return new Promise(res => {
      cfg = Object.assign({ n: 14, mode: "show" }, cfg); const st = { hide: !!cfg.hideLine || cfg.mode === "predict", sel: null, sum: "", foot: "", mark: null };
      let moved = cfg.mode === "play" ? Math.max(G.s.day, cfg.bill.due) : null, done = false;
      const rowsNow = () => rowsFor(cfg, moved);
      function sumFor(day) { const r = rowsNow().find(x => x.day === day); if (!r) return ""; const parts = [r.cin ? `+${r.cin} comes in` : "", r.cout ? `−${r.cout} goes out` : ""].filter(Boolean).join(", ") || "nothing happens";
        return st.hide ? `Day ${day}: ${parts}.` : `Day ${day}: ${parts}. Cash ends the day at <b>${r.close}</b>.`; }
      function paint() {
        const rows = rowsNow(); G.showPanel("timeline", tlHtml(cfg, rows, st) + `<div id="tlfoot"></div>`, true); const root = $("panelBody");
        root.querySelectorAll(".vtl-day").forEach(d => d.onclick = () => { const day = +d.dataset.day; if (cfg.mode === "play" && day >= G.s.day && day <= Math.max(G.s.day, cfg.bill.due) && !drag) { moved = day; st.sel = day; st.sum = playSum(day); paint(); } else { st.sel = day; st.sum = sumFor(day); $("vtlsum").innerHTML = st.sum; root.querySelectorAll(".vtl-day").forEach(x => x.classList.toggle("sel", x === d)); } });
        footer(rows);
      }
      const playSum = day => { const b = cfg.bill, inWin = day <= b.discBy; return `Pay Tomas on day ${day}: ${inWin ? `<b>${b.amount - b.disc}</b>, saving ${b.disc}` : `${b.amount}, no discount`}.`; };
      let drag = false;
      function footer(rows) {
        const f = $("tlfoot"); if (!f) return;
        if (cfg.mode === "show") { f.innerHTML = `<button class="btn gold" id="tlok">Got it</button>`; $("tlok").onclick = () => { G.hidePanel(); res({}); }; }
        else if (cfg.mode === "play") {
          const low = rows.reduce((a, r) => r.close < a.close ? r : a, rows[0]);
          f.innerHTML = `<div class="vtl-sum">Lowest Cash on this plan: <b class="${low.close < 0 ? "neg" : ""}">${low.close}</b> on day ${low.day}. Drag the purple card, or tap a day.</div>${cfg.footNote ? `<div class="vtl-rate">${cfg.footNote(moved)}</div>` : ""}<button class="btn gold" id="tlok">Pay Tomas on day ${moved}</button>`; // WS6: footNote = Ezra's rate beside the discount
          $("tlok").onclick = () => { G.hidePanel(); res({ day: moved, paidNow: moved === G.s.day, saved: moved <= cfg.bill.discBy ? cfg.bill.disc : 0, low: low.close }); };
          const card = document.querySelector("#panelBody .vtl-card.move"); if (card) card.onpointerdown = e => { e.preventDefault(); drag = true; try { card.setPointerCapture(e.pointerId); } catch (x) {}
            const over = ev => { const t = document.elementFromPoint(ev.clientX, ev.clientY), d = t && t.closest ? t.closest(".vtl-day") : null; document.querySelectorAll(".vtl-day.drop").forEach(x => x.classList.remove("drop")); if (d) d.classList.add("drop"); return d; };
            card.onpointermove = over; card.onpointerup = ev => { const d = over(ev); drag = false; if (d) { const day = +d.dataset.day; if (day >= G.s.day && day <= Math.max(G.s.day, cfg.bill.due)) { moved = day; st.sel = day; st.sum = playSum(day); } } paint(); }; };
        } else if (cfg.mode === "predict") {
          if (!done) { const al = Spring.forecast(G.s, cfg.n, cfg.extra), lw = al.reduce((a, r) => r.close < a.close ? r : a, al[0]); if (window.__fastVerbs) window.__tl = { low: lw.close, day: lw.day }; /* test hook only: in play the answer is never parked on window */ f.innerHTML = `<div class="vtl-pick"><label>Lowest Cash <input id="tlLow" type="text" inputmode="decimal" placeholder="coin"></label><label>on day <input id="tlDay" type="text" inputmode="numeric" placeholder="day"></label><button class="btn gold" id="tlok">Lock in my guess</button></div>`;
            if (G.addSigns) G.addSigns(f);
            $("tlok").onclick = () => { const low = parseFloat($("tlLow").value), day = parseInt($("tlDay").value, 10); if (isNaN(low) || isNaN(day)) { $("tlLow").style.outline = "3px solid #9b2335"; return; }
              const all = Spring.forecast(G.s, cfg.n, cfg.extra), act = all.reduce((a, r) => r.close < a.close ? r : a, all[0]); done = true; st.hide = false; st.mark = { day, v: low };
              const okLow = Math.abs(low - act.close) <= (cfg.tol || 0), okDay = day === act.day; st.sum = `You said <b>${low}</b> on day ${day}. The line says <b>${act.close}</b> on day ${act.day}: ${okLow && okDay ? "both right." : okLow ? "the coin is right, the day isn't." : okDay ? "the day is right, the coin isn't." : "both off."}`;
              paint(); const f2 = $("tlfoot"); f2.innerHTML = `<button class="btn gold" id="tlok2">Continue</button>`; $("tlok2").onclick = () => { G.hidePanel(); res({ okLow, okDay, low: act.close, lowDay: act.day, guess: low, guessDay: day }); }; }; }
        }
      }
      paint();
    });
  }

  return { init, remark, stamp, thud, parch, parchReset, parchClose, pinRow, countTotal, P, tag, canvasTap, draw, bet, revealBet, timeline, rows: cfg => rowsFor(Object.assign({ n: 14 }, cfg)), tapNext, tapDecoy, wait,
    get tagging() { return !!tagSt; }, get craneOn() { return craneOn; }, set craneOn(v) { craneOn = v; }, fmt, el };
})();
