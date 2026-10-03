// Spring at Thornfield — the playable world. Two places (STORY-year-one.md, "The Desk and the Road"):
// the Road (walk, farm, deal face to face; the screen shows only Cash and the day) and the Desk (inside the house:
// ledger, cash-forecast board, statements, notebook, the week's plan; the full numbers live here). Every sale is a
// negotiation scene: open, counter, leverage, walk away (2-4 rounds). The story (story.js) drives chapters 1-9 on top.
// All accounting lives in engine.js/books.js. Game-feel exemplar: Stardew Valley.
(function () {
  const S = Spring, B = Books, TR = Transcript, A = Art, T = 16, MW = 50, MH = 26;
  let VW = 320, VH = 200; // the view in map pixels: fixed on a desktop, sized to the screen on an iPad (see fit)
  const $ = id => document.getElementById(id), cv = $("c"), ctx = cv.getContext("2d");
  const q = new URLSearchParams(location.search), SAVE = "lc_spring_save_v3";
  // iPad and other touch devices (iPadOS Safari reports itself as a Mac, so also test for touch points); ?touch=1 forces it for testing, ?touch=0 turns it off
  const TOUCH = q.get("touch") === "1" || (q.get("touch") !== "0" && (matchMedia("(pointer: coarse)").matches || (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1)));
  if (TOUCH) document.body.classList.add("touch");
  let s, calm = 0, frame = 0, closing = null, atDesk = false, storyOn = !q.has("sandbox"), fairDay = {}, fairSeen = {};
  A.build();
  // ---------- the map ----------
  const ground = [], solid = new Set(), props = [], key = (x, y) => x + "," + y;
  const BUILD = [
    { id: "house", x: 3, y: 2, w: 6, h: 5, roof: "#4f6fa8", roofD: "#3d5a8c", wall: "#ecd6a8", wallD: "#cdb07e", chimney: true },
    { id: "bakery", x: 24, y: 2, w: 5, h: 5, roof: "#c9674a", roofD: "#a44f36", wall: "#f3e2c0", wallD: "#d9c19a", sign: "bread", who: "ashby", chimney: true },
    { id: "mill", x: 31, y: 1, w: 6, h: 6, roof: "#8a6a4a", roofD: "#6d5238", wall: "#e9dcc3", wallD: "#cbbb9d", sign: "sack", who: "hobb" },
    { id: "seeds", x: 39, y: 2, w: 5, h: 5, roof: "#4f8a4a", roofD: "#3b6c37", wall: "#f0dfb5", wallD: "#d3bf92", sign: "seed", who: "tomas" },
    { id: "bank", x: 27, y: 13, w: 5, h: 5, roof: "#5d4a7a", roofD: "#473862", wall: "#e2d8c8", wallD: "#c4b8a4", sign: "coin", who: "ezra" },
    { id: "hall", x: 37, y: 13, w: 6, h: 5, roof: "#9b2335", roofD: "#7a1b2a", wall: "#efe3cc", wallD: "#d2c3a8", sign: "scroll", who: "maud", chimney: true },
  ];
  BUILD.forEach(b => { b.img = A.building(b.w, b.h, Object.assign({}, b, { sign: b.sign && A.SIGNS[b.sign] })); b.door = { x: b.x + Math.floor(b.w / 2), y: b.y + b.h - 1 }; });
  const NPC = {}; BUILD.filter(b => b.who).forEach(b => NPC[b.who] = { who: b.who, x: b.door.x + 1, y: b.door.y + 1, dir: "down" });
  NPC.duke = { who: "duke", x: 36, y: 10, dir: "left" };
  NPC.crane = { who: "crane", x: 7, y: 7, dir: "left" }; // WS3: the bailiff, only on screen during the cold open (Verbs.craneOn)
  NPC.pell = { who: "pell", x: 30, y: 8, dir: "right" }; NPC.pedlar = { who: "pedlar", x: 22, y: 12, dir: "right" }; // visitors who come and go (see npcHere)
  // the market fair: two stalls in the lower square (other buyers, other prices: first market research)
  // Stalls sit clear of every villager's spot (Ezra stands below the bank door at 30,18; the old 31,20 stall hid him).
  const FAIR = { mira: { x: 25, y: 20, sacks: 6, delta: -2, get walk() { return Math.max(S.R.unitCost + 1, S.marketPrice(s.day) + this.delta); }, terms: 0, color: "#d9a83a", line: "Six sacks, Cash, today. I buy cheap and I buy now." },
    abbey: { x: 43, y: 20, sacks: 9, delta: 0, get walk() { return Math.max(S.R.unitCost + 1, S.marketPrice(s.day) + this.delta); }, terms: 7, color: "#6a8fc4", line: "The Abbey pays well, a week after delivery. Nine sacks." } };
  Object.keys(FAIR).forEach(k => NPC[k] = { who: k, x: FAIR[k].x, y: FAIR[k].y, dir: "down" });
  const CRATE = { x: 9, y: 7 }, WELL = { x: 34, y: 9 }, POND = [16, 16, 19, 19], BOARD = { x: 18, y: 7 }; // beside the road (the path runs along y=8), not on it
  const CHEST = { x: 5, y: 7 }, SACKS = { x: 10, y: 7 }, FWELL = { x: 13, y: 7 }; // WS3 (see Story.ch1: the tag verb's targets and decoys)
  (function buildMap() {
    let r = 5; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) ground[y * MW + x] = rnd() < .05 ? "flower" + Math.floor(rnd() * 3) : "grass" + Math.floor(rnd() * 4);
    const set = (x0, y0, x1, y1, k) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) ground[y * MW + x] = k; };
    set(6, 7, 6, 8, "path"); set(6, 8, 23, 8, "path"); set(9, 8, 9, 9, "path"); set(22, 7, 47, 11, "cobble"); set(33, 12, 35, 17, "cobble"); set(24, 18, 45, 21, "cobble");
    set(POND[0], POND[1], POND[2], POND[3], "water");
    for (let y = POND[1]; y <= POND[3]; y++) for (let x = POND[0]; x <= POND[2]; x++) solid.add(key(x, y));
    for (let x = 4; x <= 14; x++) { if (x !== 9) fence(x, 9); fence(x, 14); } for (let y = 10; y <= 13; y++) { fence(4, y); fence(14, y); }
    function fence(x, y) { ground[y * MW + x] = "fence"; solid.add(key(x, y)); }
    BUILD.forEach(b => { for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) solid.add(key(x, y)); props.push({ y: b.y + b.h, draw: () => blit(b.img, b.x * T, b.y * T - 4) }); });
    const tree = (x, y, v) => { if (solid.has(key(x, y))) return; solid.add(key(x, y)); props.push({ y: y + 1, draw: () => blit(A.tree[v % 3], x * T - 8, y * T - 28) }); };
    for (let x = 0; x < MW; x += 2) { tree(x, 0, x); tree(x + 1, MH - 1, x + 1); } for (let y = 1; y < MH - 1; y += 2) { tree(0, y, y); tree(MW - 1, y + 1, y); }
    [[15, 3], [18, 4], [20, 2], [12, 3], [2, 12], [2, 17], [8, 19], [12, 21], [22, 16], [21, 22], [26, 23], [46, 16], [44, 23], [30, 23], [16, 11], [19, 13], [47, 6], [2, 22], [5, 23]].forEach(([x, y], i) => tree(x, y, i));
    [[10, 2], [21, 12], [23, 13], [36, 23], [40, 23], [15, 21], [45, 13], [11, 17], [29, 10]].forEach(([x, y]) => { solid.add(key(x, y)); props.push({ y: y + 1, draw: () => blit(A.bush, x * T, y * T) }); });
    solid.add(key(CRATE.x, CRATE.y)); props.push({ y: CRATE.y + 1, draw: () => blit(A.crate, CRATE.x * T, CRATE.y * T) });
    solid.add(key(WELL.x, WELL.y)); props.push({ y: WELL.y + 1, draw: () => drawWell(WELL) });
    // WS3: the cold-open scene: the cash chest, sacks stacked by the crate, and a farm well (a decoy for the tag verb)
    solid.add(key(CHEST.x, CHEST.y)); props.push({ y: CHEST.y + 1, draw: () => blit(A.chest, CHEST.x * T, CHEST.y * T) });
    solid.add(key(SACKS.x, SACKS.y)); props.push({ y: SACKS.y + 1, draw: () => { blit(A.sack, SACKS.x * T, SACKS.y * T); blit(A.sack, SACKS.x * T + 4, SACKS.y * T - 5); blit(A.sack, SACKS.x * T - 3, SACKS.y * T + 2); } });
    solid.add(key(FWELL.x, FWELL.y)); props.push({ y: FWELL.y + 1, draw: () => drawWell(FWELL) });
    solid.add(key(BOARD.x, BOARD.y)); props.push({ y: BOARD.y + 1, draw: drawBoard });
    Object.values(FAIR).forEach(f => { solid.add(key(f.x - 1, f.y - 1)); solid.add(key(f.x, f.y - 1)); solid.add(key(f.x + 1, f.y - 1)); props.push({ y: f.y, draw: () => drawStall(f) }); });
    if (window.Market) { Market.stallTiles().forEach(([x, y]) => solid.add(key(x, y))); props.push({ y: Market.STALL.y, draw: () => Market.drawStall(ctx, cam, s, frame) }); } // WS7: your own Market Day stall on the square
  })();
  const plotAt = (x, y) => s.plots.find(p => p.x === x && p.y === y);
  const npcAt = (x, y) => Object.values(NPC).find(n => n.x === x && n.y === y && npcHere(n));
  const visitorOk = () => !storyOn || (Story.state.ch >= 5 && !Story.busy); // visitors wait until the story's first lessons are done
  // village scenes (scenes.js) wait on certain people from certain days: the story's first lessons run first, so scenes start with chapter 5
  const sceneOk = () => !!s && (!storyOn || (Story.state.ch >= 5 && !Story.busy));
  const sceneFor = who => (window.Scenes && sceneOk()) ? Scenes.available(who, s) : null;
  const cranePos = () => { if (window.Verbs && Verbs.craneOn) return [7, 7]; const sc = sceneFor("crane"); return sc && sc.at ? sc.at : null; };
  const npcHere = n => n.who === "crane" ? (() => { const p = cranePos(); if (p) { n.x = p[0]; n.y = p[1]; } return !!p; })() : n.who === "pell" ? visitorOk() && !s.pell && s.day >= S.pellDays(s)[0] && s.day <= S.pellDays(s)[1] // WS6: the visitor windows follow this game's seeded pig and rat nights
    : n.who === "pedlar" ? visitorOk() && !s.poison && s.day >= S.pedlarDays(s)[0] && s.day <= S.pedlarDays(s)[1]
    : n.who !== "duke" || s.offers.some(o => o.who === "duke") || s.orders.some(o => o.who === "duke" && o.status === "open") || !!sceneFor("duke");
  const buildingAt = (x, y) => BUILD.find(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
  const blocked = (x, y) => x < 0 || y < 0 || x >= MW || y >= MH || solid.has(key(x, y)) || !!npcAt(x, y);
  // ---------- player & input ----------
  const pl = { x: 6 * T + 8, y: 8 * T + 12, dir: "down", step: 0, moving: false, target: null };
  const keys = {}; const DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
  const KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
  const panelOpen = () => $("panel").style.display !== "none";
  const marketOpen = () => !!(window.Market && Market.isOpen && Market.isOpen()); // WS7: Market Day (market.js)
  addEventListener("keydown", e => {
    // Esc: close the pause menu, or a reference panel (Ledger, notebook, transcript, plan); otherwise open the pause menu.
    // Task panels (forecast to fill, journal page, the close) aren't closed by Esc: closing them would strand the story.
    if (e.code === "Escape") { if ($("pause")) $("pause").remove(); else if (panelOpen() && panelKind && !panelKind.locked && CLOSABLE.has(panelKind.k)) hidePanel(); else pauseMenu(); e.preventDefault(); return; }
    if ($("pause")) return;
    if (panelOpen() || marketOpen()) return; // WS7: the Market Day overlay owns the keyboard while it is up
    if (dlgOpen()) { if (e.target.tagName === "INPUT") { if (e.key === "Enter") $("dlg").querySelector(".ch button").click(); return; }
      const n = +e.key; if (n >= 1 && n <= 9) { const b = $("dlg").querySelectorAll("button")[n - 1]; if (b && !b.disabled) b.click(); } e.preventDefault(); return; }
    if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; pl.target = null; e.preventDefault(); }
    if (e.code === "KeyE" || e.code === "Space") { interactTile(facing().x, facing().y); e.preventDefault(); }
    if (e.code === "KeyN") notebook(); if (e.code === "KeyT") transcript();
    if (e.code === "KeyL" || e.code === "KeyF") toast("Your books are on the desk at home (E at the house door).");
  });
  addEventListener("keyup", e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
  cv.addEventListener("click", e => { // click / tap to walk; clicking something walks up to it and uses it
    if (dlgOpen()) return; const r = cv.getBoundingClientRect(), sc = r.width / VW;
    const wx = (e.clientX - r.left) / sc + cam.x, wy = (e.clientY - r.top) / sc + cam.y;
    if (window.Verbs && Verbs.canvasTap(Math.floor(wx / T), Math.floor(wy / T))) return; // WS3: a tap that tags a world object isn't a walk
    pl.target = { tx: Math.floor(wx / T), ty: Math.floor(wy / T) };
  });
  function facing() { const [dx, dy] = DIRS[pl.dir]; return { x: Math.floor((pl.x + dx * 12) / T), y: Math.floor((pl.y - 4 + dy * 12) / T) }; }
  function hitFree(x, y) { return [[-5, -5], [4, -5], [-5, 0], [4, 0]].every(([a, b]) => !blocked(Math.floor((x + a) / T), Math.floor((y + b) / T))); }
  function move(dt) {
    let dx = 0, dy = 0;
    if (keys.left) dx--; if (keys.right) dx++; if (keys.up) dy--; if (keys.down) dy++;
    if (pl.target && !dx && !dy) {
      const t = pl.target, cx = t.tx * T + 8, cy = t.ty * T + 12, ddx = cx - pl.x, ddy = cy - pl.y, near = Math.abs(ddx) < T * 1.2 && Math.abs(ddy) < T * 1.2;
      if (blocked(t.tx, t.ty) || plotAt(t.tx, t.ty)) {
        if (near && (Math.abs(ddx) < 3 || Math.abs(ddy) < 3 || plotAt(t.tx, t.ty))) { pl.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? "right" : "left") : (ddy > 0 ? "down" : "up"); pl.target = null; interactTile(t.tx, t.ty); return; }
      } else if (Math.abs(ddx) < 2 && Math.abs(ddy) < 2) { pl.target = null; return; }
      if (Math.abs(ddx) > 1.5) dx = Math.sign(ddx); else if (Math.abs(ddy) > 1.5) dy = Math.sign(ddy);
    }
    pl.moving = !!(dx || dy); if (!pl.moving) return;
    pl.dir = dx ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    const sp = 72 * dt, nx = pl.x + dx * sp, ny = pl.y + dy * sp; let moved = false;
    if (dx && hitFree(nx, pl.y)) { pl.x = nx; moved = true; } if (dy && hitFree(pl.x, ny)) { pl.y = ny; moved = true; }
    if (!moved && pl.target) {
      const t = pl.target, ddy = t.ty * T + 12 - pl.y, ddx = t.tx * T + 8 - pl.x;
      if (dx && Math.abs(ddy) > 1 && hitFree(pl.x, pl.y + Math.sign(ddy) * sp)) pl.y += Math.sign(ddy) * sp;
      else if (dy && Math.abs(ddx) > 1 && hitFree(pl.x + Math.sign(ddx) * sp, pl.y)) pl.x += Math.sign(ddx) * sp; else pl.target = null;
    }
    pl.step += dt * 8;
  }
  // ---------- interaction ----------
  function interactTile(x, y) {
    if (s.over) return closeBooks();
    if (storyOn && Story.busy) return;
    const n = npcAt(x, y); if (n) { n.dir = ({ up: "down", down: "up", left: "right", right: "left" })[pl.dir]; return talk(n.who); }
    if (window.Market && Market.stallAt(x, y)) return Market.open(); // WS7: Market Day
    if (x === CRATE.x && y === CRATE.y) return crate();
    const b = buildingAt(x, y); if (b) return b.id === "house" ? desk() : talk(b.who);
    const p = plotAt(x, y);
    if (p) { const r = act(() => S.act(s, p.i));
      if (r.ok) { FX.sfx({ till: "till", plant: "plant", water: "water", harvest: "harvest", sprinkler: "sprinkler", pickup: "sprinkler" }[r.msg]); floatAt(x, y, { till: "Tilled", plant: "Planted", water: "Watered", harvest: "+3 sacks", sprinkler: "Sprinkler set", pickup: "Sprinkler picked up" }[r.msg] || "", r.msg === "harvest" ? "#7a5a10" : "#2a4a7a"); story("plant"); if (r.msg === "harvest") story("harvest"); }
      else if (r.msg) say(null, r.msg); return; }
    if (x === BOARD.x && y === BOARD.y) return noticeBoard();
    if (x === WELL.x && y === WELL.y) say(null, "The town well. Cold, clear water.");
  }
  function act(fn) { // run an engine action, then float the Cash change and feed the transcript
    const c0 = s.bal.cash, r = fn(); drainUses(); hud(); if (r && r.ok === false && r.msg) FX.sfx("error");
    if (s.bal.cash !== c0) { floatHud("cash", s.bal.cash - c0); FX.cash(s.bal.cash - c0, $("h-cash"), $("wrap")); }
    return r;
  }
  const story = (evt, info) => { if (storyOn) Story.after(evt, info); };
  let usePtr = 0;
  function drainUses() { while (usePtr < s.uses.length) { const u = s.uses[usePtr++], ch = TR.use(u.id, u.well, s.day); if (ch) { FX.sfx(ch === "mastered" ? "win" : "chime"); toast(ch === "mastered" ? `Mastered: ${TR.name(u.id)} ★` : `Transcript: ${TR.name(u.id)} (${ch})`); } } }
  // ---------- dialogue: one box, Promise-based; choices, a number field, highlights ----------
  const dlgOpen = () => $("dlg").style.display === "flex";
  function dlg(o) { // o: {who, text, choices:[label|{label,disabled}], input, spot} -> Promise<{i, v}>
    return new Promise(res => {
      const d = $("dlg"), who = o.who, nm = who ? S.NAMES[who] || who : "", ht = who && s.trust[who] != null ? hearts(s.trust[who]) : "";
      spot(o.spot); d.classList.remove("kb"); d.classList.toggle("hasin", !!o.input);
      d.innerHTML = `${who && A.people[who] ? "<canvas width=16 height=16></canvas>" : ""}<div class="dc${o.input ? " withpad" : ""}"><div><span class="nm">${cap(nm)}</span><span class="ht">${ht}</span></div><div class="tx">${o.text}</div>` +
        (o.input ? `<div class="in"><input id="num" type="text" inputmode="decimal" enterkeyhint="done" placeholder="${o.input}" autocomplete="off"></div>` : "") + `<div class="ch"></div></div>`;
      if (who && A.people[who]) d.querySelector("canvas").getContext("2d").drawImage(A.people[who].down[0], 0, 0);
      addSignButtons(d);
      (o.choices || ["Next"]).forEach((c, i) => { const b = document.createElement("button"), lab = c.label || c; b.innerHTML = `<kbd>${i + 1}</kbd>${lab}`; b.disabled = !!c.disabled;
        b.onclick = () => { const v = o.input ? parseFloat(($("num").value || "").replace(/[^0-9.\-]/g, "")) : null; d.style.display = "none"; d.classList.remove("kb", "hasin"); spot(null); res({ i, v }); };
        d.querySelector(".ch").appendChild(b); });
      if (o.input) numberPad(d, (o.choices || ["Next"])[0]); // the pad goes after the choice buttons, so button order (and the number keys) stay as they were
      d.style.display = "flex"; keys.up = keys.down = keys.left = keys.right = false;
      if (o.input && !TOUCH) setTimeout(() => $("num") && $("num").focus(), 30); // on touch the pad types; no keyboard to cover the dialog
      FX.sfx("open"); if (!fast && !q.has("auto")) FX.type(d.querySelector(".tx"), undefined, i => FX.blip(who, i));
    });
  }
  // On-screen number pad (0-9, minus, backspace, Check) for the ask and haggle boxes: mouse and touch alike (WS2).
  // On touch the input is inputmode=none, so the iOS keyboard never opens over the dialog. Pad keys sit after the choices in the DOM.
  function numberPad(d, first) {
    const inp = $("num"), np = document.createElement("div"); np.className = "np"; np.setAttribute("aria-label", "Number pad");
    if (TOUCH) inp.setAttribute("inputmode", "none");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "−", "0", "⌫"].forEach(k => { const b = document.createElement("button"); b.type = "button"; b.textContent = k; b.tabIndex = -1; b.dataset.k = k;
      b.setAttribute("aria-label", k === "−" ? "Minus sign" : k === "⌫" ? "Backspace" : k);
      b.addEventListener("pointerdown", e => e.preventDefault()); // keep focus where it is
      b.addEventListener("click", () => { const v = inp.value; inp.value = k === "⌫" ? v.slice(0, -1) : k === "−" ? (v.startsWith("-") ? v.slice(1) : "-" + v) : v + k; });
      np.appendChild(b); });
    const ok = document.createElement("button"); ok.type = "button"; ok.className = "ok"; ok.textContent = (first && (first.label || first)) || "Check"; ok.tabIndex = -1;
    ok.addEventListener("click", () => d.querySelector(".ch button").click()); np.appendChild(ok);
    d.querySelector(".dc").appendChild(np);
  }
  // Click anywhere on the dialog: first click finishes the typewriter, a second advances when there is a single "Next"-style choice.
  $("dlg").addEventListener("click", e => { const d = $("dlg"), tx = d.querySelector(".tx"); if (e.target.closest("button,input")) return;
    if (tx && tx._finish) return tx._finish();
    const bs = d.querySelectorAll(".ch button"); if (bs.length === 1 && !$("num") && !bs[0].disabled) bs[0].click(); });
  function say(who, text, choices) { // menu form for the sandbox: choices [[label, fn, disabled]]
    const cs = choices || [["Close", null]];
    dlg({ who, text, choices: cs.map(c => ({ label: c[0], disabled: c[2] })) }).then(r => cs[r.i][1] && cs[r.i][1]());
  }
  async function sayP(who, text, choices, sp) { return (await dlg({ who, text, choices, spot: sp })).i; }
  // The Try beat: type the number; a wrong answer gets a hint, never the answer or the formula.
  // docs: [{label, open}] buttons beside Check that open the player's own documents (forecast, ledger, notebook)
  // so they can find the numbers themselves (Kyle, 2026-10-02: guide me to where the numbers are; don't do the math).
  // Never stuck (Kyle, 2026-10-02): after 2 misses a "Walk me through it" button appears; Maud shows the full working
  // with your numbers, then you enter it yourself. A walked or skipped lesson isn't marked mastered (window.__walked).
  // The pause menu's "Report a problem" can also skip a question (askSkip), for real glitches; it's logged.
  let askSkip = null;
  // how: the method, taught on a different example, so the player still works out their own number (always available).
  async function ask(who, text, answer, hints, sp, tol, docs, work, how) {
    let tries = 0, extra = "", walked = false; window.__want = answer; docs = (docs || []).slice();
    // Every question can open your books. A question that brings its own forecast (e.g. a what-if) keeps it;
    // the default hides Closing Cash so it never gives the answer away.
    if (!docs.some(d => /Ledger/.test(d.label))) docs.push({ label: "Open the Ledger", open: ledger });
    if (!docs.some(d => /forecast/i.test(d.label))) docs.push({ label: "Open the cash forecast", open: () => board({ title: "Cash forecast, next two weeks (In and Out)", n: 14, noClose: true, fill: [] }) });
    let skipped = false; askSkip = () => { skipped = true; $("dlg").style.display = "none"; spot(null); resume && resume({ i: -1 }); };
    let resume = null;
    for (;;) {
      const acts = [["check"], ...docs.map(d => ["doc", d]), ...(how ? [["how"]] : []), ...(tries >= 2 && !walked ? [["walk"]] : [])];
      const labels = acts.map(a => a[0] === "check" ? "Check" : a[0] === "doc" ? a[1].label : a[0] === "how" ? "Explain how" : "Walk me through it");
      const r = await new Promise(res => { resume = res; dlg({ who, text: text + extra, input: "type a number", choices: labels, spot: sp }).then(res); });
      if (skipped) { window.__want = undefined; window.__walked = true; askSkip = null; return answer; }
      const a = acts[r.i] || ["check"];
      if (a[0] === "how") { extra = `<br><span class="hintline"><b>How to work it out:</b> ${how}</span>`; continue; }
      if (a[0] === "walk") { walked = true; window.__walked = true; extra = `<br><span class="hintline"><b>Here's my working:</b> ${work || hints.join(" ") + ` That gives ${answer}.`}<br>Now you enter it.</span>`; continue; }
      if (a[0] === "doc") { await openDoc(a[1].open); continue; }
      if (r.v != null && !isNaN(r.v) && Math.abs(r.v - answer) <= (tol || 0)) { window.__want = undefined; askSkip = null; toast(walked ? "Right. We'll come back to this one." : "Right."); return r.v; }
      tries++; if (!walked) extra = `<br><i class="hintline">${isNaN(r.v) || r.v == null ? "Type a number." : `Not ${r.v}. `}${hints[Math.min(tries - 1, hints.length - 1)]}</i>`;
    }
  }
  // ---------- feedback: no email address in the game; copy a text block the player pastes into their own email ----------
  function feedbackText() {
    let reports = [];
    try { reports = JSON.parse(localStorage.getItem("lc_bug_reports") || "[]").slice(-5); } catch (e) {}
    const lines = [
      "Spring at Thornfield — feedback",
      `Day: ${s ? s.day : "?"}`,
      `Chapter/stage: ${storyOn && typeof Story !== "undefined" ? Story.state.stage : "sandbox"}`,
      `Recent problem reports (${reports.length}):`,
      ...(reports.length ? reports.map(r => `  - ${r.at} · day ${r.day} · ${r.stage} · "${(r.question || "").slice(0, 80)}" (expected ${r.expected})`) : ["  (none)"]),
      `Browser: ${navigator.userAgent}`,
      "",
      "Paste this into your email to Kyle.",
    ];
    return lines.join("\n");
  }
  function copyFeedback() {
    const text = feedbackText();
    const done = ok => toast(ok ? "Feedback details copied." : "Couldn't copy — select and copy the text shown.");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => done(true), () => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    try {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); done(ok);
    } catch (e) { done(false); }
  }
  // ---------- pause menu: always reachable (☰ button or Esc), so a glitch never traps the player ----------
  function pauseMenu() {
    if ($("pause")) return $("pause").remove();
    const p = document.createElement("div"); p.id = "pause"; p.className = "overlay"; p.style.cssText = "display:flex;z-index:200";
    p.innerHTML = `<div class="modal" style="max-width:420px"><h1>Paused</h1>
      <p><button class="btn gold" id="pz-resume" style="width:100%">Resume</button></p>
      <p><button class="btn alt" id="pz-restart" style="width:100%">Restart today (from this morning's save)</button></p>
      <p><button class="btn alt" id="pz-map" style="width:100%">Save and quit</button></p>
      <p><button class="btn alt" id="pz-music" style="width:100%"></button></p>
      <p><button class="btn alt" id="pz-sound" style="width:100%"></button></p>
      <p><button class="btn alt" id="pz-feedback" style="width:100%">Copy feedback details</button></p>
      ${askSkip ? `<p><button class="btn alt" id="pz-skip" style="width:100%">Report a problem and skip this question</button></p><p class="hint">Use this only if the game seems broken. The lesson won't count as mastered, and Maud will bring it up again later. Copies feedback details too, so you can paste them to Kyle.</p>` : ""}
      <p class="hint">Today's progress since the morning save is lost if you restart or leave.</p></div>`;
    document.body.appendChild(p);
    p.onclick = e => { if (e.target === p) p.remove(); };
    $("pz-resume").onclick = () => p.remove();
    $("pz-restart").onclick = () => location.reload();
    $("pz-map").onclick = () => { save(); location.href = "index.html"; };
    $("pz-feedback").onclick = () => copyFeedback();
    const snd = () => { $("pz-sound").textContent = FX.sfxOn ? "🔔 Sound effects: on (tap to mute)" : "🔕 Sound effects: off (tap to turn on)"; $("pz-music").textContent = FX.musicOn ? "🎵 Music: on (tap to mute)" : "🎵 Music: off (tap to turn on)"; }; snd();
    $("pz-sound").onclick = () => { FX.setSfx(!FX.sfxOn); snd(); };
    $("pz-music").onclick = () => { FX.setMusic(!FX.musicOn); snd(); };
    if ($("pz-skip")) $("pz-skip").onclick = () => {
      try { const log = JSON.parse(localStorage.getItem("lc_bug_reports") || "[]"); log.push({ at: new Date().toISOString(), day: s.day, stage: storyOn ? Story.state.stage : "sandbox", question: ($("dlg").querySelector(".tx") || {}).textContent, expected: window.__want }); localStorage.setItem("lc_bug_reports", JSON.stringify(log)); } catch (e) {}
      copyFeedback();
      p.remove(); const f = askSkip; f && f(); toast("Reported and copied. Skipped this question.");
    };
  }
  // Stall detector: the story is waiting but nothing is on screen for 4 s -> point the player to the menu.
  setInterval(() => {
    const idle = storyOn && Story.busy && !dlgOpen() && !panelOpen() && !$("pause");
    stall.t = idle ? (stall.t || 0) + 1 : 0; if (stall.t === 4) toast("Something seems stuck. Open the menu (☰, top right) to restart the day.");
  }, 1000);
  const stall = {};
  (function () { const pb = document.createElement("button"); pb.id = "menubtn"; pb.className = "btn alt"; pb.textContent = "☰ Menu";
    pb.style.cssText = "position:fixed;top:8px;right:8px;z-index:150"; pb.onclick = pauseMenu; document.body.appendChild(pb); })();
  function spot(ids) { document.querySelectorAll(".spot").forEach(e => e.classList.remove("spot")); curSpot = ids || []; curSpot.forEach(id => { const e = $(id); if (e) e.classList.add("spot"); }); booksOpen(); }
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const hearts = t => "♥".repeat(Math.round(t / 2)) + "♡".repeat(5 - Math.round(t / 2));
  // ---------- negotiation: open, counter, leverage, walk away (2-4 rounds) ----------
  // Each buyer has a hidden walk-away price; good history (hearts) raises it a little. Asking far above it sours the mood.
  function floorTrack(fl, offer, top) { // a price track: red below your floor, a marker for their offer
    const lo = Math.max(0, Math.min(fl, offer) - 2), hi = Math.max(top, offer, fl) + 2, pos = v => ((v - lo) / (hi - lo) * 100).toFixed(1);
    return `<div class="vtrack" style="--fl:${pos(fl)}%"><i class="fl" style="left:${pos(fl)}%"><span>Cost floor ${fl}</span></i><i class="of" style="left:${pos(offer)}%"><span>Offer ${offer}</span></i></div>`;
  }
  async function haggle(o, cfg) {
    let theirs = cfg.open, walk = cfg.walk + (s.trust[o.who] >= 7 ? 1 : 0), used = {}, line = (o.say || cfg.line) + (o.deposit ? ` <i>(${Math.round(o.deposit * 100)}% paid up front.)</i>` : ""), round = 0;
    const fl = cfg.floor != null ? cfg.floor : S.R.unitCost; // WS3: the floor is the walk-away line, drawn on the price track
    const fairBest = Math.max(0, ...Object.keys(fairSeen).filter(k => k !== o.who).map(k => fairSeen[k]));
    while (round < 4) {
      const lev = [];
      if (fairBest > theirs && !used.fair) lev.push("fair"); if (s.trust[o.who] >= 6 && !used.rec) lev.push("rec");
      const labels = ["Ask my price", `Accept ${theirs} a sack`].concat(lev.map(l => l === "fair" ? `"The fair pays ${fairBest}"` : `"I always deliver on time"`), ["Walk away"]);
      const r = await dlg({ who: o.who, text: `${line}${storyOn ? floorTrack(fl, theirs, walk) : ""}<br><b>Their offer: ${theirs} a sack</b> × ${o.sacks} sacks${o.tag ? ` (${o.tag})` : ""}${o.terms ? `, paid ${o.terms} days after delivery` : ", Cash"}.`, input: "your price per sack", choices: labels });
      const pick = labels[r.i];
      if (pick === "Walk away") { toast("You walked away."); return null; }
      if (pick.startsWith("Accept")) return close(theirs);
      if (pick.startsWith('"The fair')) { used.fair = 1; walk = Math.max(walk, Math.min(fairBest, walk + 1)); theirs = Math.min(walk, Math.max(theirs, fairBest)); line = `Hm. The fair, is it. ${theirs}, then.`; continue; }
      if (pick.startsWith('"I always')) { used.rec = 1; walk += 1; line = "True enough. You've never let me down."; continue; }
      const p = r.v; round++;
      if (p == null || isNaN(p) || p <= 0) { line = "Say a number, dear."; continue; }
      if (p < fl && storyOn) { const k = await sayP("maud", `${p} is under your cost floor: each sack cost you ${fl}. Sure? Your margin would be ${Math.round((p - fl) / p * 100)}%.`, ["Think again", "Yes, sell below cost"]); if (k === 0) continue; }
      if (p <= theirs) return close(theirs);
      if (p <= walk) { line = "Done."; return close(p); }
      if (p > walk + 2) { s.trust[o.who] = Math.max(0, s.trust[o.who] - 1); line = `${p}? That's an insult. ${theirs} is my offer.`; continue; }
      theirs = Math.min(walk, Math.ceil((theirs + p) / 2)); line = round >= 3 ? `My last word: ${theirs}.` : `Too dear. Meet me at ${theirs}.`;
    }
    const k = await sayP(o.who, `${theirs}, take it or leave it.`, [`Accept ${theirs}`, "Walk away"]); return k === 0 ? close(theirs) : null;
    function close(price) { S.setPrice(s, o.id, price); act(() => S.accept(s, o.id)); if (o.deposit && o.paid) depositLesson(o); floatAt(pl.x / T, pl.y / T - 1, price < fl ? `Deal: ${price} a sack (margin ${Math.round((price - fl) / price * 100)}%)` : `Deal: ${price} a sack`, price < fl ? "#9b2335" : "#2a5a2a"); return { price }; }
  }
  // ---------- villagers ----------
  async function talk(who) {
    if (storyOn && Story.onTalk(who)) return;
    { const sc = sceneFor(who); if (sc) return runScene(sc); }
    if (FAIR[who]) return fairDeal(who);
    if (who === "pell") return pellTalk(); if (who === "pedlar") return pedlarTalk();
    if (who === "maud") return maud(); if (who === "ezra") return ezra(); if (who === "tomas") return tomas();
    const mine = s.offers.filter(x => x.who === who).sort((a, b) => (b.deposit ? 1 : 0) - (a.deposit ? 1 : 0)), open = S.openOrders(s).find(x => x.who === who);
    let o = mine[0];
    if (mine.length > 1) { // two live orders from one buyer (e.g. Ashby's deposit order and her regular one on day 11): the player picks, neither is hidden
      const k = await sayP(who, "I have more than one order for you.", mine.map(x => `${x.sacks} sacks at ${x.price}${x.deposit ? `, ${Math.round(x.deposit * 100)}% paid up front` : x.terms ? `, paid in ${x.terms} days` : ", Cash on delivery"}`).concat(["Not now"]));
      if (k >= mine.length) return; o = mine[k];
    }
    if (o) { await haggle(o, { open: o.price - 1, walk: o.reserve != null ? o.reserve : o.price, line: who === "duke" ? "His Grace makes one offer." : who === "ashby" ? "I need grain for the ovens, dear." : "Grain for the wheel. Name your price." }); return; }
    if (open) return say(who, `Still waiting on ${open.sacks} sacks, due day ${open.due}${open.late ? " (late!)" : ""}.<br>Put them in your shipping crate on the farm.`);
    return chat(who);
  }
  // ---------- visitors: Pell the pig farmer (grain he can't pay for) and Barnaby the pedlar (rat poison) ----------
  function depositLesson(o) { // Cash rose, Revenue didn't: the deposit is a promise of grain, so it's a liability (WS6: named unearned revenue, C1.01/C1.03)
    if (storyOn) Story.noteDeposit(o);
    say("maud", `Look at Cash: it just rose by ${o.paid}. But Revenue didn't move. You haven't earned that money yet: you owe ${S.NAMES[o.who]} ${o.sacks} sacks, so the deposit sits on the balance sheet as a liability, <b>Customer deposits</b>. Accountants call it <b>unearned revenue</b>: money received for work not yet done. Spend it on seed if you must, but if the grain doesn't arrive by day ${o.due + S.R.lateGrace}, you refund it and pay a forfeit.<br>The Cash is real. The profit isn't, until you deliver.`, [["Open the Ledger", ledger], ["Close", null]]);
  }
  async function pellTalk() {
    if (s.pell) return say("pell", s.pell === "deal" ? "Twelve sacks, and my pigs stay home. You're a good neighbour." : "Nothing more to say to you.");
    const asks = `Neighbour, I'm short. Twelve sacks of grain for my pigs, and I can't pay what it's worth until the pigs go to market at Midwinter. I can give you ${S.R.unitCost} a sack, 14 days on. Or, if you'd rather, grain at 3 a sack, 21 days on, and a quarter of what the pigs fetch at Midwinter. I'd be grateful.`;
    const pick = await sayP("pell", asks, ["Haggle for a better price (paid in 14 days)", `Grain at 3 a sack, paid in 21 days, plus a quarter of what the pigs fetch at Midwinter`, "Turn him away", "Not yet"]);
    if (pick === 0) { const o = S.addOffer(s, "pell", S.R.pellSacks, S.R.unitCost, 14, 4, 2), deal = await haggle(o, { open: S.R.unitCost, walk: S.R.unitCost + 1, line: "Four a sack. It's all I have, neighbour." });
      if (!deal) S.decline(s, o.id); else await sayP("pell", "Twelve sacks by day " + (s.day + 4) + ". I'll keep the pigs in.", ["Close"]); }
    else if (pick === 1) { const o = S.addOffer(s, "pell", S.R.pellSacks, 3, 21, 4, 2); o.share = true; const r = act(() => S.accept(s, o.id));
      if (r.ok) say("maud", `At 3 a sack you're selling under your cost of ${S.R.unitCost}, so this sale's Gross profit is −${S.R.pellSacks}. The quarter of the pig money, about ${S.R.pellShare}, is a promise. It isn't Cash, a bill or Revenue until Pell pays it at Midwinter, so the Ledger lists it as a note and nowhere else.<br>Is it worth it? Maybe. But look at what your books say today.`, [["Open the Ledger", ledger], ["Close", null]]); }
    else if (pick === 2) { act(() => S.refusePell(s)); say("pell", "I'll remember this. So will my pigs."); }
  }
  async function pedlarTalk() {
    if (s.poison) return say("pedlar", "Your barn's baited. The rats'll curse your name.");
    const price = S.R.poisonCost, loss = S.ratLoss(s), buy = p => () => commit(c => S.buyPoison(c, p), r => say(r.ok ? "maud" : "pedlar", r.ok ? `Poison costs Cash now and is an operating expense: it goes in the Ledger as upkeep. The rats might never have come, or might have cost you ${loss}. That's what insurance is: a certain cost against an uncertain loss.` : r.msg));
    const pick = await sayP("pedlar", `Rat poison, friend. ${price} Cash, and not a penny less. Rats are coming to every barn on this road.<br><i>(Rats in your barn right now would spoil about ${loss} of grain.)</i>`, [`Buy at ${price}`, "Offer 25", "Not today"]);
    if (pick === 0) buy(price)();
    else if (pick === 1) { const k = await sayP("pedlar", "Twenty-five? Thirty, and that's my last word.", ["Buy at 30", "Walk away"]); if (k === 0) buy(30)(); }
  }
  async function fairDeal(who) { // the market fair: a different buyer, a different price; once a day each
    const f = FAIR[who]; fairSeen[who] = f.walk;
    if (fairDay[who] === s.day) return chat(who);
    const n = Math.min(f.sacks, s.sacks); if (n < 3) return say(who, `${f.line}<br>Come back with grain. (I pay up to ${f.walk} a sack.)`);
    const o = S.addOffer(s, who, n, f.walk - 1, f.terms, 0, 1);
    const deal = await haggle(o, { open: f.walk - 1, walk: f.walk, line: f.line });
    if (!deal) { S.decline(s, o.id); return; }
    fairDay[who] = s.day; act(() => S.deliver(s, o.id)); story("deliver", o);
  }
  // ---------- the notice board: market outlook and a small decision on some days ----------
  function noticeBoard() {
    const o = S.marketOutlook(s), now = S.marketPrice(s.day), n = S.notice(s), top = o.slice().sort((a, b) => b.price - a.price)[0];
    const arrow = p => p > now ? " ▲" : p < now ? " ▼" : "";
    const tip = !top ? "" : top.price > now ? `Prices are heading up: ${top.price} by day ${top.day}. Grain you don't have to ship before then could fetch more.` : top.price < now ? "Prices are slipping. Better to ship what you've promised and not hold surplus." : "Prices hold steady.";
    const text = `<b>Village notices</b><br>Going price today: <b>${now}</b> a sack.<br>${o.length ? o.map(x => `Day ${x.day}: ${x.price}${arrow(x.price)}`).join(" · ") : "The season is nearly over."}<br><i>${tip}</i>${n ? `<br><br><b>${n.title}</b><br>${n.text}` : ""}`;
    const opts = n ? n.options.map((label, i) => [label, () => { const f0 = n.id === "frost" ? frostRead() : null, r = act(() => S.answerNotice(s, i)); if (r.ok && f0) { if (f0.ruin === (r.msg === "covered")) TR.master("ev", s.day); say("maud", frostLesson(f0, r.msg)); } else say(r.ok ? "maud" : null, r.ok ? noticeLesson(n.id, r.msg) : r.msg); }]) : [];
    say(null, text, opts.concat([["Close", null]]));
  }
  // The frost almanac (expected value vs ruin): the numbers read BEFORE the choice, the lesson revealed after it. Ruin = losing the crops would worsen the Crown verdict.
  const verdictRank = (f, net) => { const gap = net - f.crown; return gap >= 0 ? 3 : gap + f.hoped >= 0 ? 2 : gap >= -S.R.bridgeMax ? 1 : 0; };
  function frostRead() { const f = S.frostFacts(s), cf = S.crownFund(s); return Object.assign({}, f, { net: cf.net, crown: cf.crown, ruin: verdictRank(cf, cf.net - f.atRisk) < verdictRank(cf, cf.net) }); }
  function frostLesson(f, msg) {
    const avg = `${f.atRisk} at 1 in 3 is ${f.ev} on average, against the straw's ${f.cover}`;
    return msg === "covered" ? `Straw was ${f.cover} for certain; risking it was ${f.ev} on average. ${f.ruin ? "But losing the crops would have cost you your Crown verdict, so certainty was worth the difference." : "On average that was dearer, but you bought certainty."}`
      : `${avg}, so on average the gamble is cheaper. ${f.ruin ? `But losing the crops would leave the Crown fund at ${f.net - f.atRisk} against ${f.crown}, and an average doesn't save you on the bad night.` : "A loss would hurt, not sink you, so taking the cheaper average is defensible."}`;
  }
  function noticeLesson(id, msg) { // revealed after the choice, never before: the lesson lands because the player committed first
    return ({ tinker: { blind: "Two of the six were mouldy. You paid 60 for four good packets: 15 each, dearer than Tomas. A bargain you can't inspect isn't a bargain. The write-off is in the Ledger as a loss, and the 12 you saved shows up against Cost of goods sold.", inspected: "Smart: you paid 5 to learn two were mouldy, then bought only the four good ones for 40. The fee is an operating expense; the inspection made the cheap seed cheaper than Tomas's." , pass: "Fine. Tomas's seed costs more but you can trust it." },
      trader: { sold: "Cash today, at a slightly better price than the market cart. But those sacks can't fill tomorrow's order, so check what you've promised first.", pass: "Holding your grain is a bet that a better order comes. Check the notice board for where the price is going." },
      hands: { hired: "25 is an operating expense now for crops that ripen a day sooner. Worth it only if a day earlier means a sale or a deadline you'd otherwise miss.", pass: "Fair. Not every cost buys enough." } }[id] || {})[msg] || "Done.";
  }
  // ---------- the Ledger tour: how to read it, in the player's own books ----------
  async function ledgerTour() {
    const j0 = s.journal[0], debits = Object.values(j0.lines).filter(v => v > 0).reduce((a, v) => a + v, 0), b = S.balanceSheet(s.bal), docs = [{ label: "Open the Ledger", open: ledger }];
    await sayP("maud", "The Ledger is a list of every posting, newest first. Each posting touches at least two accounts. <b>Debits</b> and <b>credits</b> are the two columns, and in every posting they add up to the same number. That's why Assets always equal Liabilities plus Owner's equity.", ["Show me"]);
    await ask("maud", `Your farm's very first posting was: <b>${dr(j0)}</b>.<br>Add up just the <b>Dr</b> (debit) amounts. What do they total?`, debits, ["Debits are the lines that start with Dr. Add only those.", "Everything the farm had at the start went on the debit side. Cash and Inventory are two of them."], null, 0, docs, `Dr amounts: ${Object.entries(j0.lines).filter(([, v]) => v > 0).map(([k, v]) => `${S.ACCTS[k][0]} ${v}`).join(" + ")} = ${debits}. The Cr side must match: that's the rule.`, "Add the Dr lines.");
    await ask("maud", `Now today's balance sheet. Your <b>Total assets</b> are ${b.assets}. If the books balance, what must <b>Liabilities + Owner's equity</b> add up to?`, b.assets, ["The balance sheet always balances: both sides are the same number.", "Assets = Liabilities + Owner's equity."], null, 0, docs, `Assets ${b.assets} = Liabilities ${b.liab} + Owner's equity ${b.equity}. Every posting keeps this true.`, "The two sides always match.");
    await sayP("maud", "Three habits that make the Ledger useful:<br>1. Before a big choice, read what it will post. The game shows you the entry first.<br>2. After something odd happens (a loss, a deposit), find its line in the journal.<br>3. Click any number at the top of the screen and I'll tell you what it is and where it came from.", ["Got it"]);
    s.tour = true;
  }
  // ---------- click a number: what it is, how it's made, and the latest entries behind it ----------
  const WHY = { cash: ["Cash", ["cash"], "Money in hand. It pays wages, seed and bills. Revenue isn't Cash until customers actually pay."],
    ni: ["Net income", ["revenue", "cogs", "upkeep", "depreciation", "fines", "losses", "interest", "factoring"], "Revenue minus every expense so far. It's profit on paper, not Cash: a sale on credit raises it before a coin arrives."],
    ar: ["Accounts receivable", ["ar"], "Grain you've delivered that customers haven't paid for yet. It's an asset: earned, but not in your hand."],
    inv: ["Inventory", ["inv"], "Sacks, seed and growing crops, all at cost. It turns into an expense (Cost of goods sold) only when the grain is sold."],
    ap: ["Accounts payable", ["ap"], "What you owe Tomas for seed on account. It's a liability, and paying it early can earn a 2% discount."],
    loan: ["Loan payable", ["loan"], "What you owe Ezra. It costs interest every pay-day, and repaying early before day 21 costs a fee."],
    crown: ["Crown debt, Midwinter", ["crown"], "What the Crown is owed at Midwinter. It's a liability that doesn't cost interest, but it's due all at once."],
    fund: ["Toward the Crown", ["cash", "ar", "inv", "ap", "loan", "deposits"], "If Midwinter were tomorrow: Cash + Receivables + Inventory, minus what you owe. It shows whether you could pay the Crown."],
    due: ["Due by pay-day", ["upkeep", "interest", "ap"], "Wages, interest and Tomas's bills due by the next pay-day. If Cash is lower than this, you'll need to borrow or collect first."],
    mkt: ["Market price", [], "What a sack goes for today. It moves with the season, so a buyer's offer is worth more or less depending on the day."], day: ["Spring", [], "The day of the season. Wages and interest fall due every 7th day."] };
  function explain(id) {
    const w = WHY[id]; if (!w) return;
    const b = S.balanceSheet(s.bal), v = { cash: b.cash, ni: b.ni, ar: b.ar, inv: b.inv, ap: b.ap, loan: b.loan, crown: b.crown, fund: S.crownFund(s).net }[id];
    const rows = s.journal.filter(j => w[1].some(k => k in j.lines)).slice(-4).reverse().map(j => `<tr><td>${j.day}</td><td>${j.memo}<div class="hint">${dr(j)}</div></td></tr>`).join("");
    showPanel("explain", `<h1>${w[0]}${v != null ? `: ${v}` : ""}</h1><p>${w[2]}</p>${rows ? `<h3>The latest postings behind it</h3><table class="stm">${rows}</table>` : ""}<p class="hint">Click Close, or press Esc.</p>`);
  }
  // ---------- see the books before you commit: what an action will record, in the player's own numbers ----------
  const LESSON = { seed: "Seed is Inventory, an asset. It only becomes an expense (Cost of goods sold) when the grain is sold.", equip: "Equipment is an asset: it sits on the balance sheet and wears out as Depreciation, instead of hitting profit all at once.",
    borrow: "A loan raises Cash and a liability by the same amount. Your equity doesn't change; the cost shows up later as interest.", repay: "Repaying shrinks Cash and the liability together. It's not an expense unless there's a fee.",
    interest: "Interest is an expense: it lowers Net income and Cash.", upkeep: "Wages, fences and poison are Operating expenses: they lower Net income now.", deposit: "Cash goes up but not Revenue: you owe grain, so the deposit is a liability.",
    factor: "Selling an invoice swaps a Receivable for less Cash. The difference is a Factoring fee, an expense.", payap: "Paying a bill shrinks Cash and Accounts payable together.", sale: "Revenue is recorded when the grain is delivered, not when the money arrives.", cogs: "Cost of goods sold moves the grain's cost out of Inventory into expenses." };
  const dr = e => Object.entries(e.lines).map(([k, v]) => `${v > 0 ? "Dr" : "Cr"} ${S.ACCTS[k][0]} ${Math.abs(v)}`).join(" · ");
  function commit(fn, after) { // fn(state) runs an engine action on the state it is given; first on a copy to show the entry, then for real
    s.seen = s.seen || {}; const p = S.preview(s, fn);
    if (!p.ok) { const r = act(() => fn(s)); if (after) after(r); else say(null, r.msg); return; }
    const types = [...new Set(p.entries.map(e => e.type))], n = Math.min(...types.map(t => s.seen[t] || 0)), big = p.moved > .4 * Math.max(1, s.bal.cash);
    const run = () => { const r = act(() => fn(s)); if (after) after(r); else if (!r.ok) say(null, r.msg); };
    if (storyOn && Story.busy) return run(); // never interrupt a scripted story chapter with a confirm
    if (n >= 2 && !big) return run();
    types.forEach(t => s.seen[t] = (s.seen[t] || 0) + 1);
    const lesson = types.map(t => LESSON[t]).filter(Boolean)[0], nums = [`Cash ${p.cash[0]} → ${p.cash[1]}`, p.dNet ? `Net income ${p.dNet > 0 ? "+" : ""}${p.dNet}` : "Net income unchanged", `Liabilities ${p.dLiab > 0 ? "+" : ""}${p.dLiab}`];
    dlg({ who: "maud", text: `<b>Before you do it, here's what the books will record:</b><br>${p.entries.map(e => `<div class="hint">${e.memo}<br><b>${dr(e)}</b></div>`).join("")}<div>${nums.join(" · ")}</div>${lesson ? `<div class="hint"><i>${lesson}</i></div>` : ""}`, choices: ["Do it", "Not now"] })
      .then(r => { if (r.i === 0) run(); });
  }
  function tomas() {
    const t = S.terms(s), owed = -s.bal.ap, b0 = s.bills[0];
    const buy = (n, acct) => () => commit(c => S.buySeeds(c, n, acct), r => r.ok ? tomas() : say("tomas", r.msg));
    say("tomas", `Seed is 12 a packet; a plot gives 3 sacks. ${t.apDays ? `On account: 14 days, or 2% off within 7.` : "Cash only for you now."}${owed ? `<br>You owe me ${owed}${b0 ? `, due day ${b0.due}` : ""}.` : ""}`, [
      ["Buy 3 for Cash (36)", buy(3, false), s.bal.cash < 36], ["Buy 9 for Cash (108)", buy(9, false), s.bal.cash < 108],
      [`Buy 9 on account`, buy(9, true), !t.apDays || owed + 108 > t.apLimit],
      ["Sprinkler: 80 Cash", () => commit(c => S.buySprinkler(c), r => say("tomas", r.ok ? "Waters the 8 plots around it every morning, and seed planted there starts a day ahead. While it's in the field the hands save 20 a week hauling water. Set it on an empty tilled plot with plenty of neighbours: one on the edge waters fewer." : r.msg)), s.bal.cash < 80],
      ["Is a sprinkler worth it?", sprinklerAdvice],
      ...(!s.fenced && s.day <= S.eventDay(s, "pigs") ? [[`Fence the field: ${S.R.fenceCost} Cash`, () => commit(c => S.buyFence(c), r => say("tomas", r.ok ? "There. My pigs won't get through that. It's a cost of running the farm, so it goes in the Ledger as upkeep, not as something you own." : r.msg)), s.bal.cash < S.R.fenceCost]] : []),
      ["Ask Tomas about…", () => chat("tomas")],
      [`Pay what I owe${s.bills.some(b => S.discNow(s, b)) ? " (2% off now)" : ""}`, () => commit(c => S.payBills(c), r => say("tomas", r.ok ? "Paid. I remember who pays on time." : r.msg)), !owed], ["Leave", null]]);
  }
  function ezra() {
    const t = S.terms(s), owed = -s.bal.loan, room = t.loanLimit - owed, inv = s.invoices.slice().sort((a, b) => b.amount - a.amount)[0];
    const go = fn => () => commit(fn, r => r.ok ? ezra() : say("ezra", r.msg));
    const opts = [["Borrow 50", go(c => S.borrow(c, 50)), room < 50], ["Borrow 100", go(c => S.borrow(c, 100)), room < 100], ["Repay 50", go(c => S.repay(c, 50)), !owed || s.bal.cash < Math.min(50, owed) + S.loanFacts(s, 50).fee]];
    if (owed) opts.push(["Should I repay early?", () => repayAdvice(owed)]);
    if (inv && (!storyOn || Story.state.ch >= 8)) opts.push([`Sell ${S.NAMES[inv.who]}'s invoice (${inv.amount}) for ${Math.round(inv.amount * .85)} today`, go(c => S.factor(c, inv.id))]);
    opts.push(["Ask Ezra about…", () => chat("ezra")]); opts.push(["Leave", null]);
    const wk = Math.round(owed * t.rateBp / 10000);
    say("ezra", `Your credit: ${hearts(s.trust.ezra)}. I lend up to ${t.loanLimit} at ${t.rateBp / 100}% a week. You owe me ${owed}${owed ? `: that's ${wk} of interest every pay-day until it's repaid. Repay before day ${S.R.prepayBefore} and I charge one week's interest on what you repay.` : "."}`, opts);
  }
  function repayAdvice(owed) { // the trade-off in the player's own numbers: interest saved vs the fee vs how thin Cash gets
    const half = Math.min(owed, 50), all = owed, fa = S.loanFacts(s, all), fh = S.loanFacts(s, half), thin = f => f.low < 0 ? ` <b>Careful: Cash would go to ${f.low} within two weeks.</b>` : f.low < 40 ? ` Cash would dip to ${f.low}, which is thin.` : ` Your lowest Cash over the next two weeks stays at ${f.low}.`;
    const line = (n, f) => `<b>Repay ${n}:</b> stops ${f.weekly} a week; ${f.paydays} pay-day${f.paydays === 1 ? "" : "s"} left this season saves ${f.saved}${f.fee ? `, minus the ${f.fee} early fee = ${f.net} better off` : ", and there's no fee after day " + S.R.prepayBefore}.${thin(f)}`;
    say("ezra", `${line(half, fh)}<br>${half === all ? "" : line(all, fa) + "<br>"}<i>Reasons to repay early: interest is a certain cost and Cash sitting idle earns nothing. Reasons to wait: the fee, and Cash is what pays wages and seed. A loan repaid today can only be borrowed again up to your limit and at today's rate.</i>`,
      [["Back", ezra], ["Open the Ledger", ledger]]);
  }
  function sprinklerAdvice() { // the buy decision in numbers: it costs Cash now, saves wages later, and wears out
    const f = S.sprinklerFacts(s), c = S.R.sprinklerCost, late = f.cash < 0;
    say("tomas", `<b>A sprinkler: ${c} Cash now.</b> While it's in the field it saves the hands ${S.R.sprinklerSaving} a week, and seed planted beside it starts a day ahead. It wears out over ${f.life} weeks, a ${S.R.depPerWeek} Depreciation expense each week.<br>` +
      `<b>With ${f.weeks} pay-day${f.weeks === 1 ? "" : "s"} left this season:</b> saves ${f.saved}, Depreciation ${f.dep}, so it adds ${f.profit} to profit. But the ${c} left your Cash on day one: after the season your Cash is ${f.cash < 0 ? -f.cash + " short" : f.cash + " better"}. It pays for itself in Cash after ${f.paybackWeeks} weeks.<br>` +
      `<i>${late ? "Bought this late, it's a good machine in a bad month: profit says yes, Cash says wait. " : ""}A machine is worth it when the savings over its life beat its price and your Cash can wait for them. Profit and Cash can disagree. That's the Ledger's lesson.</i>`,
      [["Back", tomas], ["Open the Ledger", ledger]]);
  }
  function maud() { const c = S.coach(s), has = !!Practice.available(s, TR.state); const opts = [[has ? "Maud's problem for today" : "Ask about something else", has ? problem : () => chat("maud")]]; if (has) opts.push(["Ask about something else", () => chat("maud")]); opts.push(["Close", null]);
    say("maud", c ? c.text : Cast.greet("maud", s), opts); }
  // ---------- practice: one small problem a day on your own numbers (practice.js). A right answer on your own is evidence in the transcript; a walk-through is not. ----------
  async function problem() {
    if (s.practice && s.practice.done[s.day]) return say("maud", "That's today's. Come back tomorrow; the numbers will have moved.");
    const cmp = s.day >= 3 && s.offers.length >= 2 && (s.day % 3 === 0) ? Practice.compare(s) : null, p = cmp || Practice.available(s, TR.state);
    if (!p) return say("maud", "Nothing worth asking today. Your books are quiet.");
    window.__walked = false; let right = true;
    if (cmp) { const r = (await dlg({ who: "maud", text: p.text, choices: ["A", "B", "The same"] })).i; right = r === p.answer; if (!right) { await sayP("maud", `Not quite. ${p.work}`, ["I see"]); } }
    else { await ask("maud", p.text, p.answer, p.hints, null, p.tol, (p.docs || []).map(d => d === "ledger" ? { label: "Open the Ledger", open: ledger } : { label: "Open the cash forecast", open: () => board({ title: "Cash forecast, next two weeks", show: 14, fill: [] }) }), p.work); right = !window.__walked; }
    const q = Practice.record(s, p, right, !right);
    if (right) { TR.master(p.concept, s.day); FX.sfx("good"); if (s.trust.maud != null && q.favour % 2 === 0 && s.trust.maud < 10) s.trust.maud++; toast(q.streak > 1 ? `${q.streak} days running ★` : "Maud nods."); }
    else toast("We'll come back to this one.");
    hud(); save(); drainUses();
  }
  // ---------- people: a line from them, then "Ask about..." (some answers are locked until they trust you) ----------
  async function chat(who) {
    s.heard = s.heard || {}; const tp = Cast.topics(who, s), locked = Cast.locked(who, s);
    const k = await sayP(who, Cast.greet(who, s), tp.map(t => t.label + (t.heard ? " (again)" : "")).concat(["Leave"]));
    if (k >= tp.length) return; const t = tp[k], key = who + ":" + t.id;
    for (const ln of t.lines) await sayP(who, ln, ["Next"]);
    if (!s.heard[key]) { s.heard[key] = s.day; if (s.trust[who] != null && s.trust[who] < 10) { s.trust[who]++; toast(`${Cast.name(who).split(",")[0]} trusts you a little more ♥`); FX.sfx("good"); } }
    if (locked && !tp.some(x => !x.heard) ) toast("There's more they'd say, with time."); return chat(who);
  }
  async function runScene(sc) { // an optional village scene: marked done first (a reload mid-scene never replays it), then played
    s.scenes[sc.id] = s.day; s.flags = s.flags || {};
    const c = { s, S, lines: async (who, arr) => { for (const t of arr) await sayP(who, t, ["Next"]); }, ask: (who, text, labels) => sayP(who, text, labels),
      maud: text => sayP("maud", text, ["Mm."]), flag: (k, v) => { s.flags[k] = v; }, clue: () => { s.clues = (s.clues || 0) + 1; // WS6: a scene that reveals a clue also pins a card on the case board (scenes.js: sc.card = [term, number-or-quote])
        if (storyOn && sc.card) Story.pin("scene_" + sc.id, sc.card[0], sc.card[1], `Day ${s.day} · ${Cast.name(sc.who).split(",")[0]}`, "scene"); else toast(`A clue: ${s.clues} of ${Scenes.CLUES}`); },
      trust: (who, d) => { if (s.trust[who] != null) s.trust[who] = Math.max(0, Math.min(10, s.trust[who] + d)); if (d > 0) toast(`${Cast.name(who).split(",")[0]} trusts you more ♥`); },
      letter: async i => { if (storyOn) await Story.letter(i); else await page(Story.PAGES[i], Story.LETTERS[i]); } };
    try { await sc.run(c); } finally { hud(); save(); }
  }
  function crate() {
    const opts = S.openOrders(s).sort((a, b) => a.due - b.due).map(o => [`Ship ${o.sacks} to ${S.NAMES[o.who]} (due day ${o.due})`,
      () => { const r = act(() => S.deliver(s, o.id)); if (r.ok) { FX.sfx("ship"); floatAt(CRATE.x, CRATE.y - 1, `Sold: ${o.value}`, "#2a5a2a"); story("deliver", o); } else say(null, r.msg); }, s.sacks < o.sacks]);
    opts.push(["Close", null]);
    say(null, `The shipping crate: the carter takes it today. Barn: ${s.sacks} sacks. Open orders need ${S.committed(s)}.${opts.length === 1 ? "<br>No orders yet: agree one in town first." : ""}`, opts);
  }
  // ---------- the Desk (inside the house) ----------
  function desk() {
    atDesk = true; hud();
    const c = S.coach(s);
    const ex = storyOn ? Story.deskItems() : []; // WS6: Crane's offer and the case board join the Desk menu (before "Back to the road")
    dlg({ who: null, text: `Your desk: Edric's ledger, the forecast board, Maud's notebook.${storyOn ? Story.deskNote() : ""}${c && c.danger ? `<br><b>Maud's note:</b> ${c.text}` : ""}`,
      choices: [`Sleep (end day ${s.day})`, "Ledger", "Ledger tour: how to read it", Practice.available(s, TR.state) ? "Maud's problem (new)" : "Maud's problem (done today)", "Cash forecast", "The week's plan", "Notebook (N)", "Transcript (T)", `Edric's letters${storyOn && Story.state.pages.length ? ` (${Story.state.pages.length})` : ""}`, ...ex.map(x => x.label), "Back to the road"] })
      .then(r => { const f = [sleepNow, ledger, ledgerTour, problem, () => board({ title: "Cash forecast, next two weeks", show: 14, fill: [] }), plan, notebook, transcript, letters, ...ex.map(x => x.fn), () => { atDesk = false; hud(); }][r.i]; f && f(); });
  }
  function letters() { // every letter of Edric's you've found, newest first, to read again
    const st = storyOn ? Story.state : { pages: [] }, ids = st.pages.slice().sort((a, b) => b - a);
    showPanel("letters", `<h1>Edric's letters <span class="hint">${ids.length} of ${Story.LETTERS.length} found</span></h1>` + (ids.map(i => `<div class="journal small"><b>${Story.LETTERS[i]}</b><p>${Story.PAGES[i]}</p><p class="sig">— E.</p></div>`).join("") || "<p class='hint'>None yet. Edric left them where the lessons are.</p>"));
  }
  function plan() {
    const o = S.openOrders(s), need = S.committed(s) - s.sacks - S.sacksComing(s);
    showPanel("plan", `<h1>The week's plan <span class="hint">day ${s.day}</span></h1><ul>` +
      (o.map(x => `<li>Deliver ${x.sacks} sacks to ${S.NAMES[x.who]} by day ${x.due}: ${x.value}${x.terms ? `, paid ${x.terms} days later` : " Cash"}</li>`).join("") || "<li>No orders open. Visit town.</li>") +
      `<li>Sacks: ${s.sacks} in the barn, ${S.sacksComing(s)} growing. ${need > 0 ? `<b>Short ${need}: plant ${Math.ceil(need / 3)} more plots.</b>` : "Enough for every order."}</li>` +
      s.bills.map(b => `<li>Pay Tomas ${b.amount} by day ${b.due}${S.discNow(s, b) ? ` (or ${b.amount - b.disc} by day ${b.discBy})` : ""}</li>`).join("") +
      s.invoices.map(v => `<li>${S.NAMES[v.who]} pays you ${v.amount} on day ${v.due}</li>`).join("") +
      `<li>Wages and interest, day ${S.nextWeekEnd(s)}: ${S.weekBills(s)}</li></ul><button class="btn alt" id="pclose">Back</button>`);
    $("pclose").onclick = hidePanel;
  }
  // ---------- the forecast board (chapter 5 on): a two-week calendar of Cash ----------
  function board(o) { // o: {title, show (rows pre-filled), fill [row indexes the player types], maud, extra} -> Promise<{firstTry,total}>
    return new Promise(res => {
      // o.noClose: show only today's opening Cash plus the In and Out columns, so the player does the arithmetic.
      const rows = S.forecast(s, o.n || 14, o.extra), fill = new Set(o.fill || []), shown = o.noClose ? 1 : o.show == null ? 14 : o.show;
      const cell = (r, i) => o.noClose ? "" : fill.has(i) ? `<input class="fc" data-i="${i}" data-day="${r.day}" data-ans="${r.close}" data-prev="${r.open}" data-delta="${r.close - r.open}" inputmode="decimal">` : i < shown || !fill.size ? `<b class="${r.close < 0 ? "neg" : ""}">${r.close}</b>` : "";
      showPanel("board", `<h1>${o.title}</h1>${o.maud ? `<div class="maudline"><b>Maud:</b> ${o.maud}</div>` : ""}<table class="stm fcast"><tr><th>Day</th><th>Cash at start</th><th>In</th><th>Out</th><th>${o.noClose ? "" : "Closing Cash"}</th></tr>` +
        rows.map((r, i) => `<tr class="${r.cout || r.cin ? "ev" : ""}"><td>${r.day}${r.day % 7 === 0 ? " · wages" : ""}</td><td class="num">${i < shown && !fill.has(i) || i === 0 ? r.open : ""}</td><td class="num">${r.cin ? "+" + r.cin + (s.invoices.some(v => v.due === r.day) ? " " + s.invoices.filter(v => v.due === r.day).map(v => S.NAMES[v.who].split(" ")[0]).join(", ") : "") : ""}</td>` +
          `<td class="num">${r.cout ? "−" + r.cout + " " + [r.wages ? "wages+interest" : "", r.bills ? "Tomas" : "", r.fines ? "forfeit" : ""].filter(Boolean).join(", ") : ""}</td><td class="num">${cell(r, i)}</td></tr>`).join("") +
        `</table><div id="bfb" class="hint"></div><button class="btn gold" id="bok">${fill.size ? "Check" : "Done"}</button>`);
      let first = null;
      $("bok").onclick = () => {
        // Each cell is checked against the player's own previous closing Cash, so one slip is marked once, not on every later row.
        const ins = [...document.querySelectorAll("#panelBody input.fc")]; let right = 0, exact = 0, prevTyped = null, prevI = -9, firstBad = null;
        ins.forEach(x => { const i = +x.dataset.i, v = x.value === "" ? NaN : +x.value, base = prevI === i - 1 && !isNaN(prevTyped) ? prevTyped : +x.dataset.prev;
          const ok = v === base + +x.dataset.delta; x.classList.toggle("bad", !ok); x.classList.toggle("good", ok); if (ok) right++; if (v === +x.dataset.ans) exact++;
          if (!ok && !firstBad) firstBad = { day: x.dataset.day, base }; prevTyped = v; prevI = i; });
        if (first === null) first = right;
        if (exact === ins.length) { hidePanel(); res({ firstTry: first, total: ins.length }); }
        else if (firstBad) $("bfb").innerHTML = `<b>Maud:</b> Look at day ${firstBad.day}: start from ${firstBad.base}, the Cash above it, then add In and take off Out.`;
        else $("bfb").innerHTML = "<b>Maud:</b> Close. Check each day against the Cash above it.";
      };
    });
  }
  // ---------- Edric's journal pages and Maud's notebook ----------
  function page(text, title) { return new Promise(res => { FX.sfx("chime"); showPanel("page", `<div class="journal"><div class="hint">${title ? `Edric's letter: ${title}` : "A page from Uncle Edric's journal"}</div><p>${text}</p><p class="sig">— E.</p></div><button class="btn gold" id="pgok">Keep it</button>`); $("pgok").onclick = () => { hidePanel(); res(); }; }); }
  function notebook() {
    if (panelKind && panelKind.k === "notebook") return hidePanel(); const st = storyOn ? Story.state : { notebook: [], pages: [] };
    showPanel("notebook", `<h1>Maud's notebook <span class="hint">click Close, or press N or Esc</span></h1>` + (st.notebook.map(n => `<div class="nb"><b>${n.term}</b><div>${n.line}</div><div class="hint">Your example: ${n.example}</div></div>`).join("") || "<p class='hint'>Empty for now. Maud writes in it as you learn.</p>") +
      (st.pages.length ? `<h3>Edric's letters</h3>` + st.pages.slice().sort().map(i => `<p class="journal small"><b>${Story.LETTERS[i]}.</b> ${Story.PAGES[i]}</p>`).join("") : ""));
  }
  function transcript() { if (panelKind && panelKind.k === "transcript") return hidePanel(); showPanel("transcript", TR.html() + `<p class="hint">Click Close, or press T or Esc.</p>`); }
  // ---------- the night ----------
  let fast = q.has("auto") || q.has("fast");
  let guess = null; // a prediction the player made before sleeping, revealed with the morning's real number
  async function sleepNow() {
    const f = S.forecast(s, 1)[0];
    if (f && (f.cin || f.cout) && !fast && (!storyOn || Story.state.ch >= 9)) { atDesk = false;
      const bits = [f.cin ? `${f.cin} comes in (invoices due)` : "", f.wages ? `${f.wages} of wages and interest goes out` : "", f.bills ? `${f.bills} of Tomas's bills goes out` : "", f.fines ? `${f.fines} of forfeits goes out` : ""].filter(Boolean).join("; ");
      const r = await dlg({ who: "maud", text: `Before you sleep: tonight ${bits}. Cash is ${s.bal.cash} now. <b>What will Cash be when you wake?</b>`, input: "Cash tomorrow", choices: ["Check my guess", "Just sleep"] });
      guess = r.i === 0 && r.v != null && !isNaN(r.v) ? { v: r.v, f, before: s.bal.cash } : null; }
    doSleep();
  }
  function revealPrediction() {
    if (!guess) return; const g = guess, right = g.v === s.bal.cash; guess = null;
    TR.use("wc", right, s.day - 1);
    say("maud", right ? `Right: ${s.bal.cash}. You read the night correctly.` : `You said ${g.v}; Cash is ${s.bal.cash}.<br>${g.before} + ${g.f.cin} collected − ${g.f.wages} wages and interest − ${g.f.bills} bills${g.f.fines ? ` − ${g.f.fines} forfeits` : ""} = ${g.f.close}${g.f.close !== s.bal.cash ? ", plus whatever else happened overnight" : ""}. Start from today's Cash, add what comes in, take away what goes out.`);
  }
  function doSleep() {
    atDesk = false; const n0 = s.log.length, c0 = s.bal.cash, day0 = s.day; FX.sfx("sleep"); act(() => S.sleep(s));
    const notes = s.log.slice(0, s.log.length - n0).reverse().map(l => l.t).slice(0, 4);
    // the day-end card: what Cash did, who still owes you, what was lost
    const owed = {}; s.invoices.forEach(v => owed[v.who] = (owed[v.who] || 0) + v.amount);
    const info = { day: day0, d: s.bal.cash - c0, owes: Object.entries(owed).map(([w, a]) => `${S.NAMES[w] || w} owes you <b>${a}</b>`), losses: s.journal.filter(j => j.type === "loss" && j.day === s.day - 1).map(j => j.memo) };
    if (s.over) return fast ? closeBooks() : night("The end of spring", notes, closeBooks, info);
    pl.x = 6 * T + 8; pl.y = 7 * T + 12; pl.dir = "down"; save();
    const morning = () => { FX.sfx("morning"); morningBark(); story("morning"); lossLesson(); revealPrediction(); };
    if (fast) return morning();
    night(`Day ${s.day} · ${S.rain(s.day) ? "Rain" : "Sunny"}`, notes, morning, info);
  }
  function lossLesson() { // a loss shows up in the Ledger as an expense with no Cash leaving: walk the player to the exact lines
    const j = s.journal.find(x => x.type === "loss" && x.day === s.day - 1); if (!j || (storyOn && Story.busy)) return;
    const n = Object.values(j.lines)[0] ? j.lines.losses : 0; FX.thud(); FX.shake($("wrap"));
    say("maud", `Open the Ledger and find the journal line "${j.memo}".<br>Debit Crop & stock losses ${n}, credit Inventory ${n}. Cash didn't move, but Net income fell by ${n} and so did Inventory: value you paid for is gone. That's why losses hit profit.`,
      [["Open the Ledger", ledger], ["Later", null]]);
  }
  function night(title, notes, then, info) { // info: the day-end card (Cash change, who owes you, losses); tap to dismiss early
    const n = $("night"), rows = info ? [`Day ${info.day} ended. Cash <span class="${info.d < 0 ? "neg" : "pos"}">${info.d < 0 ? "−" : "+"}${Math.abs(info.d)}</span> (now ${s.bal.cash})`, ...info.owes, ...info.losses.map(m => `Lost: ${m}`)] : [];
    n.innerHTML = info ? `<div class="card"><h2>${title}</h2>${rows.concat(notes).map(t => `<p>${t}</p>`).join("")}<p class="tap">Tap to continue</p></div>` : `<h2>${title}</h2>` + notes.map(t => `<p>${t}</p>`).join("");
    n.classList.add("on"); let done = false;
    const end = () => { if (done) return; done = true; n.onclick = null; n.classList.remove("on"); then && then(); };
    n.onclick = () => end();
    setTimeout(end, 1500 + notes.length * 500 + rows.length * 400);
  }
  function morningBark() { // coaching fades: only real danger once the player is past chapter 5
    const c = S.coach(s); if (!c) { calm++; return; }
    const quiet = storyOn ? Story.state.ch >= 6 || Story.state.ch <= 4 : calm >= 4;
    if (!c.danger && quiet) return; calm = c.danger ? 0 : calm + 1;
    $("bark").innerHTML = `<b>Maud:</b> ${c.text}`; $("bark").style.display = "block"; clearTimeout(morningBark.t); morningBark.t = setTimeout(() => $("bark").style.display = "none", 9000);
  }
  // ---------- HUD: the Road shows Cash and the day; the Desk shows everything ----------
  function hud() {
    const b = S.balanceSheet(s.bal), wk = S.nextWeekEnd(s), due = S.weekBills(s) + S.billsDue(s, wk), wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][(s.day - 1) % 7];
    document.body.classList.toggle("desk", atDesk);
    const box = (id, k, v, warn, deskOnly) => `<span class="wood${warn ? " warn" : ""}${deskOnly ? " deskonly" : ""}" id="h-${id}"><span class="k">${k}</span><b class="v">${v}</b></span>`;
    if (!hud.wired) { hud.wired = 1; hudInit(); $("hud").addEventListener("click", e => { const el = e.target.closest(".wood"); if (el && el.id && !dlgOpen() && !panelOpen()) explain(el.id.replace(/^h-/, "")); }); }
    // Row 1: Day, Cash, Crown fund meter, goal, Travel, Books. The balance-sheet boxes live in the Books strip (opens at the desk, on tap, or when a lesson spotlights one).
    const fund = S.crownFund(s).net, pct = Math.max(0, Math.min(100, Math.round(fund / S.R.crownDebt * 100)));
    $("hudmain").innerHTML = box("day", "Spring", `${s.day} · ${wd}${S.rain(s.day) ? `<span class="rainw"> · rain</span><span class="rainic"> ☔</span>` : ""}`) + box("cash", "Cash", b.cash, b.cash < due) +
      `<span class="wood" id="h-fund"><span class="k"><span class="kl">Toward the </span>Crown</span><span class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${S.R.crownDebt}" aria-valuenow="${fund}"><i style="width:${pct}%"></i></span><b class="v">${fund} / ${S.R.crownDebt}</b></span>`;
    $("books").innerHTML = box("mkt", "Market, a sack", S.marketPrice(s.day) + (s.day > 1 ? (S.marketPrice(s.day) > S.marketPrice(s.day - 1) ? " ▲" : S.marketPrice(s.day) < S.marketPrice(s.day - 1) ? " ▼" : "") : ""), false, 1) +
      box("ni", "Net income (Ledger)", b.ni, false, 1) + box("ar", "Accounts receivable", b.ar, false, 1) + box("inv", "Inventory", b.inv, false, 1) + box("ap", "Accounts payable", b.ap, false, 1) +
      box("loan", "Loan payable", b.loan, false, 1) + box("crown", "Crown debt, Midwinter", b.crown, false, 1) + box("due", "Due by day " + wk, due, b.cash < due, 1) +
      `<div class="wood deskonly" id="coin">${coinBar(b)}</div>` + (storyOn ? `<button type="button" class="wood" id="casebtn">Case board (${Story.state.clues.length})</button>` : ""); // WS6: the case board button
    const cbtn = $("casebtn"); if (cbtn) cbtn.onclick = e => { e.stopPropagation(); if (!dlgOpen() && !panelOpen() && !Story.busy) Story.caseBoard(); };
    spot(curSpot); // hud() rebuilds the boxes, so put the lesson's spotlight (and the Books strip it needs) back
    $("bar").innerHTML = `<div class="slot"><i>sacks</i><canvas width=16 height=16 data-i="sack"></canvas><b>${s.sacks}</b></div><div class="slot"><i>seed</i><canvas width=16 height=16 data-i="seed"></canvas><b>${s.seeds}</b></div>` +
      `<div class="slot"><i>sprinkler</i><canvas width=16 height=16 data-i="sprinkler"></canvas><b>${s.sprinklersHeld}</b></div><div class="slot keys"><button class="btn alt" style="font-size:11px;padding:2px 6px" onclick="G.notebook()">Notebook</button> <button class="btn alt" style="font-size:11px;padding:2px 6px" onclick="G.transcript()">Transcript</button><br>Desk at home: ledger, forecast</div>`;
    $("bar").querySelectorAll("canvas").forEach(c => c.getContext("2d").drawImage(c.dataset.i === "seed" ? A.crops[1] : A[c.dataset.i], 0, 0));
    paintGoal();
  }
  // The top bar is built once: [Day, Cash, Crown meter] [goal] [Travel] [Books], then the Books strip underneath.
  let booksPin = false, curSpot = [];
  function hudInit() {
    $("hud").innerHTML = `<div id="hudrow"><span id="hudmain"></span></div><div id="books"></div>`;
    const row = $("hudrow"); $("hud").insertBefore($("goal"), $("books")); // the chapter goal is its own ribbon under the one-row HUD, so it never gets squeezed or pushes Travel and Books down
    [["travelbtn", "Travel ➜", openTravel], ["booksbtn", "Books ▾", () => { booksPin = !booksPin; booksOpen(); }]].forEach(([id, label, fn]) => {
      const b = document.createElement("button"); b.id = id; b.type = "button"; b.className = "wood hbtn"; b.textContent = label; b.onclick = e => { e.stopPropagation(); fn(); }; row.appendChild(b); });
  }
  function booksOpen() { const bk = $("books"); if (!bk) return; const open = atDesk || booksPin || !!bk.querySelector(".spot"); bk.classList.toggle("open", open);
    const bb = $("booksbtn"); if (bb) { bb.classList.toggle("on", open); bb.textContent = open ? "Books ▴" : "Books ▾"; } }
  // ---------- fast travel: a small map of the six doors; a 0.5 s fade, then the player stands at that door ----------
  const STOPS = [["Farm", "🌾", 9, 8], ["Bakery", "🥖", BUILD[1].door.x, BUILD[1].door.y + 1], ["Mill", "⚙", BUILD[2].door.x, BUILD[2].door.y + 1],
    ["Seed shop", "🌱", BUILD[3].door.x, BUILD[3].door.y + 1], ["Counting house", "💰", BUILD[4].door.x, BUILD[4].door.y + 1], ["Fair", "🎪", 34, 19]];
  function openTravel() {
    if (dlgOpen() || panelOpen()) return; if (storyOn && Story.busy) return toast("Finish what Maud is saying first.");
    const t = $("travel"); t.innerHTML = `<div class="wood card"><h2>Where to?</h2><div class="tgrid">${STOPS.map(([n, ic], i) => `<button type="button" data-i="${i}">${ic}<br>${n}</button>`).join("")}</div><button type="button" class="x">Stay here</button></div>`;
    t.classList.add("on"); t.onclick = e => { if (e.target === t) t.classList.remove("on"); };
    t.querySelector(".x").onclick = () => t.classList.remove("on");
    t.querySelectorAll("[data-i]").forEach(b => b.onclick = () => travelTo(+b.dataset.i));
  }
  function travelTo(i) { const st = STOPS[i]; $("travel").classList.remove("on"); if (!st) return;
    FX.fade($("wrap"), () => { pl.x = st[2] * T + 8; pl.y = st[3] * T + 12; pl.dir = "up"; pl.target = null; keys.up = keys.down = keys.left = keys.right = false; }); }
  function coinBar(b) { // "where your coin is": Cash -> Inventory -> Accounts receivable (from poc/1-harvest-ledger.html)
    const segs = [["Cash", b.cash, "#2f6f62"], ["Inventory", b.inv, "#b8862b"], ["Accounts receivable", b.ar, "#5b7fc4"]], tot = Math.max(1, segs.reduce((a, x) => a + Math.max(0, x[1]), 0));
    return `<span class="k">Where your coin is</span><div class="coinmap">${segs.map(([n, v, c]) => `<div style="width:${Math.max(0, v) / tot * 100}%;background:${c}" title="${n}: ${v}">${v / tot > .18 ? `${n} ${v}` : ""}</div>`).join("")}</div>`;
  }
  // WS7: on a Market Day the ribbon gains a second line with a "To the stall" button (market.js builds it); paintGoal() re-runs from hud() so it appears and goes with the day
  // WS6: the ribbon's small header is "Week N · <title>" when the story passes one (hdr), else the old "Chapter N of 9"
  let goalNow = { text: "", ch: 0, hdr: "" };
  function goal(text, ch, hdr) { goalNow = { text, ch, hdr }; paintGoal(); }
  function paintGoal() {
    const m = window.Market && s ? Market.goalLine(s, storyOn && Story.busy) : "", html = (goalNow.text ? `<span class="k">${goalNow.hdr || `Chapter ${goalNow.ch} of 9`}</span> ${goalNow.text.replace(/^Chapter \d+ · /, "")}` : "") + m, g = $("goal");
    if (g.dataset.h !== html) { g.dataset.h = html; g.innerHTML = html; } g.style.display = html ? "block" : "none";
  }
  function floatHud(id, v) { const el = $("h-" + id); if (!el) return; const r = el.getBoundingClientRect(), w = $("wrap").getBoundingClientRect();
    flo(`${v > 0 ? "+" : "−"}${Math.abs(v)}`, r.left - w.left + 10, r.bottom - w.top + 4, v > 0 ? "#2f6f3a" : "#9b2335"); }
  function floatAt(tx, ty, text, col) { if (!text) return; const sc = cv.getBoundingClientRect().width / VW; flo(text, (tx * T - cam.x) * sc, (ty * T - cam.y) * sc, col); }
  function flo(text, x, y, col) { const d = document.createElement("div"); d.className = "fl"; d.textContent = text; d.style.left = x + "px"; d.style.top = y + "px"; d.style.color = col; $("wrap").appendChild(d); setTimeout(() => d.remove(), 1700); }
  function toast(t) { flo(t, 12, 110 + (toast.n = ((toast.n || 0) + 1) % 4) * 22, "#7a4a10"); }
  // ---------- panels: ledger, statements ----------
  let panelKind = null;
  // Mouse-only play: every panel you can leave gets a clickable Close at the top and bottom, and a click on
  // the dark backdrop closes it. Task panels (forecast with cells to fill, journal pages, the close) keep
  // their own buttons, because they finish a step of the story.
  const CLOSABLE = new Set(["plan", "ledger", "notebook", "transcript", "explain", "letters", "casebd"]); // WS6: casebd = the case board
  function showPanel(k, html, locked) {
    panelKind = { k, locked }; FX.sfx("page");
    const x = CLOSABLE.has(k) && !locked;
    $("panelBody").innerHTML = (x ? `<button class="btn alt pclose" style="float:right;margin:0 0 6px 10px">✕ Close</button>` : "") + html +
      (x ? `<div style="text-align:right;margin-top:10px"><button class="btn gold pclose">Done</button></div>` : "");
    if (x) document.querySelectorAll("#panelBody .pclose").forEach(b => b.onclick = hidePanel);
    $("panel").onclick = e => { if (x && e.target === $("panel")) hidePanel(); };
    $("panel").style.display = "flex"; addSignButtons($("panelBody"));
  }
  let hideWaiters = [];
  function hidePanel() { if ($("panel").style.display !== "none") FX.sfx("close"); $("panel").style.display = "none"; panelKind = null; const w = hideWaiters.splice(0); if (w.length) return w.forEach(f => f()); if (atDesk) desk(); }
  // Open a document from inside a question and wait until the player closes it, then the question comes back.
  function openDoc(fn) { return new Promise(res => { hideWaiters.push(res); fn(); }); }
  let pre = "";
  const tr = (label, v, cls, line) => `<tr class="${cls || ""}" data-line="${line ? pre + ":" + line : ""}"><td>${label}</td><td class="num">${fmt(v)}</td></tr>`;
  const fmt = v => typeof v === "number" ? (v < 0 ? `(${-v})` : String(v)) : v;
  function bsTable(b, title, p) {
    pre = p || "bs1"; return `<table class="stm"><tr><th>${title}</th><th></th></tr>` + tr("Cash", b.cash, "sub", "cash") + tr("Accounts receivable", b.ar, "sub", "ar") + tr("Inventory", b.inv, "sub", "inv") +
      tr("Equipment, net", b.equipNet, "sub", "equip") + tr("Total assets", b.assets, "total", "assets") + tr("Accounts payable", b.ap, "sub", "ap") + (b.deposits ? tr("Customer deposits = unearned revenue (grain owed)", b.deposits, "sub", "deposits") : "") + tr("Loan payable (due within the year)", b.loan, "sub", "loan") +
      tr("Crown debt (due at Midwinter)", b.crown, "sub", "crown") + tr("Owner's equity", b.equity, "sub", "equity") + tr("Liabilities + Owner's equity", b.liab + b.equity, "total") +
      `</table><div class="ok">${b.assets === b.liab + b.equity ? "Assets = Liabilities + Owner's equity ✓" : "OUT OF BALANCE"}</div>`;
  }
  function isTable(st) {
    const i = st.is; pre = "is"; return `<table class="stm"><tr><th>Income statement</th><th></th></tr>` + tr("Revenue", i.revenue, "", "revenue") + tr("Cost of goods sold", -i.cogs, "sub", "cogs") + tr("Gross profit", i.gross, "total", "gross") +
      tr("Wages & upkeep", -i.upkeep, "sub", "opex") + (i.dep ? tr("Depreciation", -i.dep, "sub", "opex") : "") + (i.fines ? tr("Contract forfeits", -i.fines, "sub", "opex") : "") + (i.losses ? tr("Crop & stock losses", -i.losses, "sub", "opex") : "") +
      tr("Operating expenses", -i.opex, "", "opex") + tr("Operating income", i.operating, "total", "operating") + tr("Interest expense", -i.interest, "sub", "interest") +
      (i.factoring ? tr("Factoring fees", -i.factoring, "sub", "interest") : "") + tr("Net income", i.net, "total", "net") + `</table>`;
  }
  function cfTable(st) {
    const c = st.cf; pre = "cf"; return `<table class="stm" id="cft"><tr><th>Cash-flow statement (indirect)</th><th></th></tr>` + tr("Net income", c.net, "", "net") + tr("+ Depreciation", c.dep, "sub", "dep") +
      tr("(Increase) decrease in Accounts receivable", -c.dAR, "sub", "ar") + tr("(Increase) decrease in Inventory", -c.dInv, "sub", "inv") + tr("Increase (decrease) in Accounts payable", c.dAP, "sub", "ap") + (c.dDep ? tr("Increase (decrease) in Customer deposits", c.dDep, "sub", "dep") : "") +
      tr("Cash from operations", c.cfo, "total", "cfo") + tr("Equipment bought", c.capex, "sub", "capex") + tr("Cash from investing", c.cfi, "total", "cfi") +
      tr("Borrowed", c.borrowed, "sub", "cff") + tr("Repaid", c.repaid, "sub", "cff") + tr("Cash from financing", c.cff, "total", "cff") +
      tr("Change in Cash", c.change, "total", "change") + `</table><div class="ok">${c.reconciles ? `Cash ${c.cashStart} → ${c.cashEnd}: reconciles ✓` : "DOES NOT RECONCILE"}</div>`;
  }
  function ledger() {
    const st = B.close(s), b = st.end;
    const jr = s.journal.slice(-9).reverse().map(j => `<tr><td>${j.day}</td><td>${j.memo}<div class="hint">${Object.entries(j.lines).map(([k, v]) => `${v > 0 ? "Dr" : "Cr"} ${S.ACCTS[k][0]} ${Math.abs(v)}`).join(" · ")}</div></td></tr>`).join("");
    showPanel("ledger", `<h1>The Ledger <span class="hint">day ${s.day} · click Close or press Esc</span></h1><div class="grid g3">${bsTable(b, "Balance sheet today")}${isTable(st)}
      <div><h3>Inventory at cost</h3><div class="hint">${s.sacks} sacks × 4 + ${s.seeds} seed × 12 + ${s.plots.filter(p => p.crop).length} plots growing × 12 = ${b.inv}</div></div></div>
      ${!s.tour ? `<p><button class="btn alt" id="tourbtn">New to the Ledger? Take the 2-minute tour</button></p>` : ""}${s.promises && s.promises.length ? `<h3 style="margin-top:10px">Promised, not booked</h3><table class="stm">${s.promises.map(p => `<tr><td>${p.text}</td><td class="num">${p.amount}</td></tr>`).join("")}</table><div class="hint">A promise of future money isn't an asset until it's paid, so it isn't on the balance sheet. Accountants disclose it in a note.</div>` : ""}
      <h3 style="margin-top:10px">Journal (latest postings)</h3><table class="stm">${jr}</table>`);
    const tb = $("tourbtn"); if (tb) tb.onclick = () => { hidePanel(); ledgerTour(); };
  }
  // ---------- closing the books: guided (chapter 9), then Ezra's loan review ----------
  function midwinter() { // the stakes: could this farm pay the Crown if Midwinter were tomorrow?
    const f = S.crownFund(s), row = (l, v, neg) => `<tr><td>${l}</td><td class="num">${neg ? "−" : ""}${v}</td></tr>`, big = { paid: ["The farm is yours.", "ok"], bridge: ["Ezra will bridge the gap.", "warn"], promise: ["Only a promise saves you.", "warn"], short: ["The Crown takes the farm.", "banner"] }[f.verdict];
    const lines = { paid: `You'd clear the Crown's ${f.crown} with ${f.gap} to spare. But every customer has to pay, and Edric's invoices were good too.`,
      bridge: `You're ${-f.gap} short of the Crown. Ezra will lend the gap at the current rate (about ${f.bridge} a week in interest) to be repaid from next year's harvest. The farm survives, in debt, and every week of that interest comes out of next year's profit.`,
      promise: `You're ${-f.gap} short of the Crown. Pell's pig money (${f.hoped}) would cover it, but a promise isn't Cash until he pays.`, short: `You're ${-f.gap} short of the Crown's ${f.crown}. Look at what ate your profit: losses, interest, forfeits and Receivables you haven't collected.` }[f.verdict];
    return `<div class="${big[1]}" style="margin:6px 0"><b>If Midwinter were tomorrow: ${big[0]}</b><div class="hint">${lines}</div><table class="stm">${f.have.map(r => row(r[0], r[1])).join("")}${f.owe.filter(r => r[1]).map(r => row(r[0], r[1], 1)).join("")}${row("The Crown's debt", f.crown, 1)}<tr class="total"><td>${f.gap >= 0 ? "Left over" : "Short by"}</td><td class="num">${Math.abs(f.gap)}</td></tr></table></div>`;
  }
  async function closeBooks() {
    if (closing) return; const st = B.close(s), h = B.highlight(st, s); closing = { st, h }; atDesk = true; hud();
    ["statements", "cfs"].forEach(i => { const c = TR.use(i, true, s.day); if (c) toast(`Transcript: ${TR.name(i)} (${c})`); });
    const pm = s.outcome === "insolvent" ? B.postmortem(s) : null;
    const banner = s.outcome === "insolvent" ? `<div class="banner">Insolvent on day ${s.day}. ${s.why}<br><b>What happened:</b><ul>${pm.lines.map(l => `<li>${l}</li>`).join("")}</ul><b>Next time:</b> ${pm.advice}</div>` : "";
    const guided = storyOn && Story.state.stage !== "done";
    showPanel("close", `<h1>Closing the books: Spring, year one</h1>${banner}<div class="grid g3" id="stmts"><div id="sec-is">${isTable(st)}</div><div id="sec-bs0">${bsTable(st.start, "Balance sheet, start of spring", "bs0")}</div><div id="sec-bs1">${bsTable(st.end, s.outcome === "insolvent" ? "Balance sheet, day " + s.day : "Balance sheet, end of spring")}<div class="hint">Owner's equity ${st.end.equity} = ${st.start.equity} at the start + Net income ${st.is.net}</div></div></div>
      <div class="grid g2" style="margin-top:8px"><div id="sec-cf">${cfTable(st)}</div><div><div class="maudline" id="mline"><b>Maud:</b> ${guided ? "Let's close the books together." : h.text}</div><div id="ez"></div></div></div>`, true);
    if (guided) { ["is", "bs0", "bs1", "cf"].forEach(k => $("sec-" + k).classList.add("veil")); await Story.close(st, h); $("mline").innerHTML = `<b>Maud:</b> ${h.text}`; }
    h.lines.forEach(l => document.querySelectorAll(`#panelBody tr[data-line="${l}"]`).forEach(r => r.classList.add("hl")));
    const ez = $("ez");
    const mw = s.outcome === "insolvent" ? "" : midwinter();
    if (s.outcome === "insolvent") ez.innerHTML = `<p>Ezra won't lend to an estate that couldn't pay its wages. The farm goes to auction.</p><button class="btn gold" id="again">Try spring again</button>`;
    else ez.innerHTML = mw + `<p>Before summer, Ezra reads your books. Explain them well and he lends more, cheaper.</p><button class="btn gold" id="goEzra">Take the books to Ezra</button>`;
    ez.insertAdjacentHTML("beforeend", endBtn());
    wire(); save();
    // WS6 finale slot: if the Ledger Duel (court.js, another builder) is loaded it runs now; otherwise the close + verdict above stand, with "The Audit (coming)"
    if (storyOn && window.Court && Court.run && s.outcome !== "insolvent") await Court.run({ G: window.G, s, Story, Endings, st: closing.st, verdict: S.crownFund(s).verdict, ending: Endings.ending(s) });
  }
  function reveal(k, text) { return new Promise(res => { (k === "bs" ? ["bs0", "bs1"] : [k]).forEach(x => $("sec-" + x) && $("sec-" + x).classList.remove("veil"));
    $("mline").innerHTML = `<b>Maud:</b> ${text}`; $("ez").innerHTML = `<button class="btn gold" id="rnext">Next</button>`; $("rnext").onclick = () => { $("ez").innerHTML = ""; res(); }; }); }
  function pickLine(text, target, hints) { return new Promise(res => { let tries = 0; window.__pick = target;
    $("mline").innerHTML = `<b>Maud:</b> ${text}`; const rows = document.querySelectorAll("#cft tr[data-line]");
    rows.forEach(r => { if (!r.dataset.line) return; r.classList.add("pick"); r.onclick = () => {
      if (r.dataset.line === target) { rows.forEach(x => { x.onclick = null; x.classList.remove("pick"); }); window.__pick = undefined; res(tries); } // resolves with the number of wrong taps first
      else { tries++; $("mline").innerHTML = `<b>Maud:</b> ${text}<br><i class="hintline">Not that one. ${hints[Math.min(tries - 1, hints.length - 1)]}</i>`; } }; }); }); }
  // WS6: the ending (Sold out / Seized / Bridged / Free) after the books close; "The Audit (coming)" stands in for the WS8 finale
  const endBtn = () => storyOn ? `${window.Court ? "" : `<p class="hint">The Audit (coming): Corvin Vane before the magistrate.</p>`}<p><button class="btn alt" id="goEnd">How it ends</button></p>` : "";
  function wire() { const a = $("again"), g = $("goEzra"), e = $("goEnd"); if (a) a.onclick = restart; if (g) g.onclick = review; if (e) e.onclick = () => Story.showEnding(Endings.ending(s)); }
  function review() {
    const qs = B.review(closing.st), before = S.terms(s); let i = 0, right = 0; const ez = $("ez");
    function next() {
      document.querySelectorAll("#panelBody tr.ask").forEach(r => r.classList.remove("ask"));
      if (i >= qs.length) { const after = B.reviewResult(s, right, qs.length); localStorage.removeItem(SAVE);
        ez.innerHTML = `<div class="ezq"><b>Ezra:</b> ${right === qs.length ? "You know your own books. Good." : right ? "You know some of your books." : "You don't know your own books. That costs you."}<br>
          Summer terms: lend up to <b>${after.loanLimit}</b> at <b>${after.rateBp / 100}% a week</b> (spring: ${before.loanLimit} at ${before.rateBp / 100}%).</div>
          <button class="btn gold" id="again">Play spring again</button> <button class="btn alt" onclick="G.transcript()">Transcript</button>${endBtn()}`; return wire(); }
      const qq = qs[i]; qq.lines.forEach(l => document.querySelectorAll(`#panelBody tr[data-line="${l}"]`).forEach(r => r.classList.add("ask")));
      ez.innerHTML = `<div class="ezq"><b>Ezra</b> <span class="hint">(${i + 1} of ${qs.length}; each answer moves your summer rate)</span><br>${qq.q} ${qq.ask}</div>` +
        qq.options.slice().sort(() => Math.random() - .5).map(o => `<button class="btn alt choice" data-o="${o}">${o}</button>`).join("");
      ez.querySelectorAll(".choice").forEach(b => b.onclick = () => { const ok = b.dataset.o === qq.answer; if (ok) { right++; [qq.id].concat(qq.also || []).forEach(id => { const c = TR.master(id, s.day); if (c) toast(c === "mastered" ? `Mastered: ${TR.name(id)} ★` : `Transcript: ${TR.name(id)} (${c})`); }); }
        ez.innerHTML = `<div class="ezq"><b>Ezra:</b> ${ok ? "Just so." : `No. ${qq.answer}.`}</div><button class="btn gold" id="nx">Next</button>`; $("nx").onclick = () => { i++; next(); }; });
    }
    next();
  }
  function restart() { localStorage.removeItem(SAVE); location.search = ""; }
  // ---------- save (every morning and at each chapter step) ----------
  function save() { if (!storyOn || fast && !q.has("savetest")) return; try { localStorage.setItem(SAVE, JSON.stringify({ s, story: Story.state, calm, usePtr, fairSeen })); } catch (e) {} }
  // ---------- drawing ----------
  const cam = { x: 0, y: 0 };
  function blit(img, x, y) { ctx.drawImage(img, Math.round(x - cam.x), Math.round(y - cam.y)); }
  function drawBoard() { const x = BOARD.x * T - cam.x, y = BOARD.y * T - cam.y; ctx.fillStyle = "#6b4526"; ctx.fillRect(x + 2, y + 2, 2, 14); ctx.fillRect(x + 12, y + 2, 2, 14); ctx.fillStyle = "#cf9f62"; ctx.fillRect(x, y - 6, 16, 11); ctx.fillStyle = "#f4ead0"; ctx.fillRect(x + 2, y - 4, 5, 6); ctx.fillRect(x + 9, y - 3, 5, 5); ctx.fillStyle = S.notice(s) ? "#c43a1a" : "#946b3c"; ctx.fillRect(x + 4, y - 5, 1, 1); ctx.fillRect(x + 11, y - 4, 1, 1); }
  function drawWell(W) { const x = W.x * T - cam.x, y = W.y * T - cam.y; ctx.fillStyle = "#8d949b"; ctx.fillRect(x + 1, y + 4, 14, 11); ctx.fillStyle = "#6f757b"; ctx.fillRect(x + 1, y + 12, 14, 3);
    ctx.fillStyle = "#2d5f9a"; ctx.fillRect(x + 3, y + 5, 10, 5); ctx.fillStyle = "#6b4526"; ctx.fillRect(x + 1, y - 6, 2, 11); ctx.fillRect(x + 13, y - 6, 2, 11); ctx.fillStyle = "#9b2335"; ctx.fillRect(x - 1, y - 9, 18, 4); }
  function drawStall(f) { const x = (f.x - 1) * T - cam.x, y = (f.y - 1) * T - cam.y;
    ctx.fillStyle = "#6b4526"; ctx.fillRect(x + 2, y - 10, 2, 24); ctx.fillRect(x + 44, y - 10, 2, 24); ctx.fillStyle = "#cf9f62"; ctx.fillRect(x, y + 4, 48, 10); ctx.fillStyle = "#946b3c"; ctx.fillRect(x, y + 12, 48, 2);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? "#f4ead0" : f.color; ctx.fillRect(x + i * 8, y - 14, 8, 8); } ctx.fillStyle = "#3b2a1e"; ctx.fillRect(x, y - 6, 48, 1);
    ctx.drawImage(A.sack, Math.round(x + 6), Math.round(y - 4)); ctx.drawImage(A.sack, Math.round(x + 28), Math.round(y - 4)); }
  function drawGround() {
    const x0 = Math.floor(cam.x / T), y0 = Math.floor(cam.y / T), TL = A.TILES, wet = S.rain(s.day);
    for (let y = y0; y <= y0 + VH / T + 1; y++) for (let x = x0; x <= x0 + VW / T + 1; x++) {
      if (x < 0 || y < 0 || x >= MW || y >= MH) continue; const k = ground[y * MW + x]; let img;
      if (k.startsWith("grass")) img = TL.grass[+k[5]]; else if (k.startsWith("flower")) img = TL.flower[+k[6]]; else if (k === "path") img = TL.path[(x + y) % 2];
      else if (k === "cobble") img = TL.cobble[(x * 3 + y) % 2]; else if (k === "water") img = TL.water[(Math.floor(frame / 40) + x) % 2]; else img = TL.grass[0];
      blit(img, x * T, y * T); if (k === "fence") blit(TL.fence, x * T, y * T);
    }
    s.plots.forEach(p => { if (!p.tilled) return; blit(p.watered || wet || S.sprinkled(s, p) ? TL.wet : TL.soil, p.x * T, p.y * T);
      if (p.crop) blit(A.crops[S.stage(s, p)], p.x * T, p.y * T - (S.stage(s, p) === 4 ? 1 + Math.round(Math.sin(frame / 30 + p.i)) : 0)); if (p.sprinkler) blit(A.sprinkler, p.x * T, p.y * T); });
  }
  function drawPerson(who, x, y, dir, moving, stepv) { const f = A.people[who][dir], i = moving ? 1 + (Math.floor(stepv) % 2) : 0;
    ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fillRect(Math.round(x - 5 - cam.x), Math.round(y - 1 - cam.y), 10, 3); blit(f[i], x - 8, y - 16); }
  const wants = who => !!sceneFor(who) || (storyOn ? ({ tomas: ["tomas2", "tomas6", "tomas9"], ashby: ["ashby3"], hobb: ["hobb4"], ezra: ["ezra7"], duke: ["duke8", "duke9"] }[who] || []).indexOf(Story.state.stage) >= 0 : s.offers.some(o => o.who === who));
  function draw() {
    cam.x = Math.max(0, Math.min(MW * T - VW, pl.x - VW / 2)); cam.y = Math.max(0, Math.min(MH * T - VH, pl.y - VH / 2));
    ctx.fillStyle = "#79b851"; ctx.fillRect(0, 0, VW, VH); drawGround();
    const list = props.slice();
    Object.values(NPC).filter(npcHere).forEach(n => list.push({ y: n.y + .95, draw: () => { drawPerson(n.who, n.x * T + 8, n.y * T + 14, n.dir, false, 0);
      if (wants(n.who)) { const bx = n.x * T + 5 - cam.x, by = n.y * T - 12 - cam.y + Math.sin(frame / 8) * 1.5; ctx.fillStyle = "#fff"; ctx.fillRect(bx, by, 7, 9); ctx.fillStyle = "#c43a1a"; ctx.fillRect(bx + 3, by + 1, 1, 5); ctx.fillRect(bx + 3, by + 7, 1, 1); } } }));
    list.push({ y: pl.y / T, draw: () => drawPerson("player", pl.x, pl.y, pl.dir, pl.moving, pl.step) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.draw());
    const mill = BUILD[2], mx = mill.x * T + 48 - cam.x, my = mill.y * T + 20 - cam.y, ang = frame / 60;
    ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { const a = ang + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a) * 20, my + Math.sin(a) * 20); ctx.stroke(); }
    ctx.fillStyle = "#f2efe6"; for (let k = 0; k < 4; k++) { const a = ang + k * Math.PI / 2; ctx.fillRect(Math.round(mx + Math.cos(a) * 13) - 2, Math.round(my + Math.sin(a) * 13) - 2, 5, 5); }
    [BUILD[0], BUILD[1], BUILD[5]].forEach((b, k) => { for (let j = 0; j < 3; j++) { const t = (frame / 90 + j / 3 + k * .3) % 1; ctx.fillStyle = `rgba(235,235,235,${.6 * (1 - t)})`; ctx.fillRect(Math.round((b.x + b.w) * T - 18 - cam.x + Math.sin(t * 6) * 2), Math.round(b.y * T - 4 - t * 18 - cam.y), 3 + t * 3, 3 + t * 3); } });
    if (S.rain(s.day)) { ctx.fillStyle = "rgba(40,60,110,.18)"; ctx.fillRect(0, 0, VW, VH); ctx.fillStyle = "rgba(200,220,255,.55)"; for (let k = 0; k < 70; k++) { const rx = (k * 53 + frame * 3) % VW, ry = (k * 97 + frame * 6) % VH; ctx.fillRect(rx, ry, 1, 4); } }
    if (window.Verbs) Verbs.draw(ctx, cam, frame); // WS3: frames round tagged things
    const f = facing(), p = plotAt(f.x, f.y), n = npcAt(f.x, f.y), b = buildingAt(f.x, f.y);
    if (p) { ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1; ctx.strokeRect(f.x * T - cam.x + .5, f.y * T - cam.y + .5, 15, 15); }
    const hintText = dlgOpen() ? "" : n ? `E: talk to ${S.NAMES[n.who]}` : (window.Market && Market.stallAt(f.x, f.y)) ? "E: your Market Day stall" : (f.x === CRATE.x && f.y === CRATE.y) ? "E: shipping crate" : (f.x === BOARD.x && f.y === BOARD.y) ? "E: notice board" : b ? (b.id === "house" ? "E: sit at your desk" : `E: ${S.NAMES[b.who]}`) :
      p ? "E: " + (!p.tilled ? "till" : p.sprinkler ? "pick up sprinkler" : !p.crop ? (s.sprinklersHeld ? "place sprinkler" : s.seeds ? "plant seed" : "no seed: buy from Tomas") : S.stage(s, p) === 4 ? "harvest" : p.watered || S.rain(s.day) ? "watered" : "water") : "";
    $("hint").textContent = TOUCH ? "" : hintText; // the "E: ..." hint is for a keyboard; on an iPad you just tap
    const act = TOUCH && $("act"); if (act) { const lab = hintText.replace(/^E: /, "") || "Act"; if (act.dataset.l !== lab) { act.dataset.l = lab; act.textContent = lab.charAt(0).toUpperCase() + lab.slice(1); } }
  }
  let last = 0;
  let stepAcc = .2;
  function tick(dt) { frame++; const modal = dlgOpen() || panelOpen() || marketOpen(); if (pl.moving && !modal) { stepAcc += dt; if (stepAcc > .27) { stepAcc = 0; FX.sfx("step"); } } else stepAcc = .2; if (TOUCH) { document.body.classList.toggle("inmodal", modal); if (modal) for (const k in keys) keys[k] = false; } if (!modal) move(dt); draw(); }
  function loop(t) { const dt = Math.min(.05, (t - last) / 1000 || 0); last = t; tick(dt); requestAnimationFrame(loop); }
  // A desktop shows a fixed 320x200 view in whole-pixel steps. An iPad scales in half steps and then shows as much MAP as the screen holds, so the game
  // fills the whole screen in either orientation instead of floating in a letterbox.
  function fit() {
    const base = Math.min(innerWidth / 320, innerHeight / 200), sc = Math.max(2, TOUCH ? Math.floor(base * 2) / 2 : Math.floor(base));
    VW = TOUCH ? Math.min(MW * T, Math.max(320, Math.floor(innerWidth / sc))) : 320; VH = TOUCH ? Math.min(MH * T, Math.max(200, Math.floor(innerHeight / sc))) : 200;
    if (cv.width !== VW) cv.width = VW; if (cv.height !== VH) cv.height = VH;
    cv.style.width = VW * sc + "px"; cv.style.height = VH * sc + "px"; $("wrap").style.width = VW * sc + "px";
  }
  addEventListener("resize", fit); addEventListener("orientationchange", () => setTimeout(fit, 150));
  // ---------- touch: on-screen pad and Act button, minus-sign helper, and keeping the typing box above the iPad keyboard ----------
  function initTouch() {
    // Taps do everything (walk, talk, farm, open doors), so there is no on-screen pad or Act button by default. ?pad=1 adds them back for anyone who wants them.
    if (q.get("pad") === "1") {
      const tc = document.createElement("div"); tc.id = "tc";
      tc.innerHTML = `<div id="dpad">${[["up", "▲"], ["left", "◀"], ["right", "▶"], ["down", "▼"]].map(([d, g]) => `<button type="button" data-d="${d}" aria-label="Walk ${d}">${g}</button>`).join("")}</div><button type="button" id="act" aria-label="Act">Act</button>`;
      document.body.appendChild(tc);
      tc.querySelectorAll("#dpad button").forEach(b => { const d = b.dataset.d;
        b.addEventListener("pointerdown", e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} keys[d] = true; pl.target = null; b.classList.add("down"); });
        ["pointerup", "pointercancel", "lostpointercapture"].forEach(t => b.addEventListener(t, () => { keys[d] = false; b.classList.remove("down"); })); });
      $("act").addEventListener("pointerdown", e => { e.preventDefault(); if (!dlgOpen() && !panelOpen()) { const f = facing(); interactTile(f.x, f.y); } });
    }
    document.addEventListener("focusin", e => { if (e.target.tagName === "INPUT" && $("dlg").contains(e.target)) $("dlg").classList.add("kb"); });
    document.addEventListener("contextmenu", e => e.preventDefault());
  }
  function addSignButtons(root) { // the iPad number pad has no minus key, and a forecast can go negative
    if (!TOUCH) return; root.querySelectorAll('input[inputmode="decimal"]').forEach(inp => { if (inp.dataset.sign || inp.id === "num") return; inp.dataset.sign = 1; // (dialog boxes have the on-screen number pad, which has its own minus key)
      const b = document.createElement("button"); b.type = "button"; b.className = "sgn"; b.textContent = "±"; b.setAttribute("aria-label", "Make negative or positive"); b.tabIndex = -1;
      b.addEventListener("pointerdown", e => e.preventDefault()); // don't steal focus from the box, so the keyboard stays up
      b.addEventListener("click", () => { inp.value = inp.value.startsWith("-") ? inp.value.slice(1) : "-" + inp.value; inp.focus(); }); inp.after(b); });
  }
  if (TOUCH) initTouch();
  // ---------- the API the story uses (and tests) ----------
  window.G = { get s() { return s; }, say: sayP, ask, haggle, board, page, reveal, pickLine, goal, toast, hud, save, act: fn => act(fn),
    dlg, showPanel, cam, T, spot, floatAt, openDoc, world: { CHEST, CRATE, SACKS, FWELL, BOARD, WELL }, // WS3: verbs.js and story.js build on these
    restart, travel: travelTo, openTravel, night, interactTile, talk, crate, desk, sleepNow, ledgerTour, explain, noticeBoard, commit, ledger, notebook, transcript, closeBooks, review, closeDlg: () => { $("dlg").style.display = "none"; $("dlg").classList.remove("kb"); }, hidePanel,
    set fast(v) { fast = v; }, pl, keys, step: dt => move(dt), tick,
    play(policy, days) { storyOn = false; for (let d = 0; d < days && !s.over; d++) { Bot[policy].day(s); drainUses(); S.sleep(s); drainUses(); } hud(); if (s.over) closeBooks(); } };
  function start() {
    const saved = (() => { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } })();
    const begin = (sv) => {
      if (sv) { s = sv.s; calm = sv.calm || 0; usePtr = sv.usePtr || 0; fairSeen = sv.fairSeen || {}; }
      // WS6 item 9: a story game draws its event days from a seed saved in the game (?seed=N forces one; no seed = the canonical calendar for sandbox and bots)
      else s = S.newGame({ story: storyOn, bonus: Math.min(100, (window.Codex ? Codex.prestige() : 0) * 10), seed: q.has("seed") ? +q.get("seed") : storyOn ? 1 + Math.floor(Math.random() * 2147483646) : 0 });
      if (window.Verbs) Verbs.init(G);
      if (storyOn) Story.init(G, sv && sv.story); else goal("");
      hud(); if (storyOn) Story.start();
    };
    if (saved && storyOn && !saved.s.over && !q.has("new")) { s = saved.s; hud(); dlg({ who: "maud", text: `Welcome back. Day ${saved.s.day}, chapter ${saved.story.ch}.`, choices: ["Continue", "Start a new game"] }).then(r => begin(r.i === 0 ? saved : null)); }
    else begin(null);
  }
  // ---------- sound: a tap on any button, and the score follows what's happening ----------
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("button"); if (b && !b.disabled && !b.closest("#pause")) FX.sfx(b.closest(".np") ? "pad" : "tap"); }, true);
  function moodNow() { // which piece of the score fits the moment
    if (!s) return "farm"; if (document.getElementById("night") && $("night").classList.contains("on")) return "night";
    if (storyOn && window.Verbs && Verbs.craneOn) return "crane";
    const wk = S.nextWeekEnd(s), due = S.weekBills(s) + S.billsDue(s, wk); if (!s.over && wk - s.day <= 2 && s.bal.cash < due) return "tense";
    if (s.offers.some(o => o.who === "duke") || s.orders.some(o => o.who === "duke" && o.status === "open")) return (pl.x / T > 22) ? "tense" : "farm";
    if (S.rain(s.day)) return "rain"; return pl.x / T > 22 ? "town" : "farm";
  }
  setInterval(() => { try { if (!window.Music || !s) return; Music.setMood(moodNow()); if (FX.sfxOn) FX.rain(S.rain(s.day) && !s.over); } catch (e) {} }, 900);
  if (window.Market) Market.init(G); // WS7
  fit(); start();
  if (q.has("auto")) { const a = q.get("auto"); G.play(q.get("bot") || "careful", /^\d+$/.test(a) ? +a : 99); if (a === "ezra") review(); }
  if (q.has("at")) { const [x, y] = q.get("at").split(",").map(Number); pl.x = x * T + 8; pl.y = y * T + 12; }
  if (q.has("desk")) { atDesk = true; hud(); }
  if (q.has("ending") && storyOn) setTimeout(() => { G.closeDlg(); Story.testEnding(q.get("ending")); }, 300); // WS6 test hook: ?ending=sold|seized|bridged|free shows that epilogue
  requestAnimationFrame(loop);
})();
