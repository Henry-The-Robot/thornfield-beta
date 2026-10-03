// Spring at Thornfield — Market Day (WS7). A weekly fair where the player prices their own sacks and watches villagers react.
// Pure core (no DOM, runs under node: tests/test-market-day.js) + the scene UI at the bottom (browser only).
//
// Sources the numbers come from (knowledge/mba/modules): C4.01 demand, supply and elasticity (a demand curve is the price a buyer
// will pay, summed over buyers; revenue = price x units, so a price rise helps only if units fall by less); C4.02 pricing against a
// competitor; C8.02 segmentation (buyers differ in what they will pay, so one price is never right for everyone).
// Game exemplars: Recettear and Moonlighter (price a shop item, see each customer's face react).
//
// The model. Each afternoon is 3 hours of 8 villagers (24). Each villager has a segment and a hidden reserve price (the most
// they'll pay), fixed by roll(day, villager, salt), so the same game always meets the same villagers. Every hour has the same
// mix, with reserves spread evenly inside each segment, so differences between hours come from YOUR PRICE (a fair experiment):
//   thrifty      3 of 8  reserve = going price - 1, +-2   buys 1 (2 if the price is 2+ under their reserve)
//   comfortable  3 of 8  reserve = going price + 2, +-1   buys 2 (1 if the price is right at their limit)
//   in a hurry   2 of 8  reserve = going price + 4        buys 1
// A buyer who can't pay shows 'hesitated' when the price is 1 over their reserve (a coin less would have won them) and
// 'too dear' when it is 2+ over. Grisby (the rival, from day 14) sets his price after seeing yours at the start of each hour:
// he undercuts by 1 when you are above the going price, otherwise holds at it. Thrifty villagers who see both buy the
// cheaper (ties stay with you); comfortable and hurried villagers don't comparison-shop.
// Sales post to the books through the engine's own journal (Cash, Revenue, Cost of goods sold), so the statements tie out.
(function (root) {
  const S = root.Spring || require("./engine.js");
  const CFG = {
    hours: 3, perHour: 8, maxStock: 60, grisbyFrom: 14, maxPrice: 30,
    // Grisby's stock for the afternoon: plenty in week 2, and in week 3 he is running low (T6: he undercuts hard, then sells out and you win the thrifty crowd back)
    gStock: { 14: 24, 21: 5 },
    seg: { thrifty: { base: -1, spread: 5 }, comfortable: { base: 2, spread: 3 }, hurry: {} }, // reserve = going price + base, spread = how many whole-coin steps it ranges over
  };
  const FAIR_DAYS = [7, 14, 21]; // creative call 4: day 28 belongs to the Reeve's Court, in story and sandbox alike
  const SEG_NAMES = { thrifty: "Thrifty", comfortable: "Comfortable", hurry: "In a hurry" };
  const roll = S.roll; // the engine's own stateless roll (same game, same villagers; nothing to save)

  // the fair is on days 7, 14 and 21 only; day 28 is the Court
  const isDay = day => FAIR_DAYS.indexOf(day) >= 0;
  const grisbyIn = day => day >= CFG.grisbyFrom;
  // T6: above the going price he undercuts by 2 (never below cost + 1); at or below it he holds at the going price, so a tie stays with you
  const grisbyPrice = (market, mine) => mine > market ? Math.max(S.R.unitCost + 1, mine - 2) : market;
  const grisbyStock = day => CFG.gStock[day] != null ? CFG.gStock[day] : 24;

  // the 8 villagers who walk by in an hour (same game, same villagers). Every hour has the same mix (3 thrifty, 3 comfortable, 2 in a hurry)
  // and each segment's reserves are stratified (one from each band, with a roll inside the band), so an hour's demand depends on YOUR PRICE and
  // not on which hour it happens to be. That keeps the player's own demand curve (price vs sacks per hour) readable: a fair experiment, not noise.
  function villagers(day, hour) {
    const market = S.marketPrice(day), mix = { thrifty: 3, comfortable: 3, hurry: 2 }, slots = [];
    Object.keys(mix).forEach(seg => { for (let j = 0; j < mix[seg]; j++) slots.push({ seg, j, n: mix[seg], key: roll(day, "mk" + hour + seg + j, 5) }); });
    slots.sort((a, b) => a.key - b.key); // arrival order
    return slots.map((o, k) => {
      const id = "mk" + hour + "." + o.seg + o.j, c = CFG.seg[o.seg], off = o.seg === "hurry" ? 0 : Math.floor((o.j + roll(day, id, 2)) / o.n * c.spread) - Math.floor(c.spread / 2);
      return { id, k, hour, seg: o.seg, reserve: o.seg === "hurry" ? market + 4 : market + c.base + off, t: (k + roll(day, id, 3) * .7) / CFG.perHour, look: Math.floor(roll(day, id, 4) * 6) };
    });
  }
  // what one villager does when you ask `mine` and Grisby (or null) asks `g`; stock is what you have left
  function decide(v, mine, g, stock) {
    const want = (p) => v.seg === "thrifty" ? 1 + (p <= v.reserve - 2 ? 1 : 0) : v.seg === "comfortable" ? 1 + (p <= v.reserve - 1 ? 1 : 0) : 1;
    const toGrisby = g != null && v.seg === "thrifty" && g < mine, p = toGrisby ? g : mine;
    if (!toGrisby && stock <= 0) return { to: "me", react: "soldout", qty: 0, price: mine };
    if (p <= v.reserve) return { to: toGrisby ? "grisby" : "me", react: "bought", qty: toGrisby ? want(p) : Math.min(want(p), stock), price: p };
    return { to: toGrisby ? "grisby" : "me", react: p - v.reserve === 1 ? "hesitated" : "dear", qty: 0, price: p };
  }

  // ---------- a fair ----------
  function newFair(s, o) {
    o = o || {}; const day = s.day, stock = Math.max(0, Math.min(o.stock != null ? o.stock : s.sacks, s.sacks, CFG.maxStock));
    const g0 = grisbyIn(day) ? grisbyStock(day) : 0;
    return { day, market: S.marketPrice(day), grisby: grisbyIn(day), gStock0: g0, gStock: g0, stock0: stock, stock, hour: 0, hours: [], cost: S.R.unitCost };
  }
  function playHour(f, price) { // price: your price this hour; returns the hour record (events in arrival order)
    price = Math.max(1, Math.min(CFG.maxPrice, Math.round(price)));
    const g = f.grisby ? grisbyPrice(f.market, price) : null, stock0 = f.stock, gOut0 = f.grisby && f.gStock <= 0, ev = [], segSeen = {}, segBought = {};
    villagers(f.day, f.hour).forEach(v => {
      // Grisby sells only what he has: once his stock is gone the thrifty crowd comes back to you (a villager he can only half-serve takes what is left)
      const d = decide(v, price, f.grisby && f.gStock > 0 ? g : null, f.stock); if (d.to === "me") f.stock -= d.qty; else if (d.to === "grisby" && d.react === "bought") { d.qty = Math.min(d.qty, f.gStock); f.gStock -= d.qty; }
      segSeen[v.seg] = (segSeen[v.seg] || 0) + 1; if (d.react === "bought") segBought[v.seg] = (segBought[v.seg] || 0) + 1;
      ev.push(Object.assign({}, v, d));
    });
    const units = ev.reduce((a, e) => a + (e.to === "me" ? e.qty : 0), 0), lost = ev.filter(e => e.to === "grisby" && e.react === "bought").reduce((a, e) => a + e.qty, 0);
    // 'stolen' = sales Grisby made to villagers who would have paid YOUR price (reserve >= yours): the ones he really cost you.
    // The rest of 'toGrisby' bought from him only because he was cheaper than they would have paid you for, so you never had them.
    const stolen = ev.filter(e => e.to === "grisby" && e.react === "bought" && e.reserve >= price).reduce((a, e) => a + Math.min(e.qty, 1 + (price <= e.reserve - 2 ? 1 : 0)), 0);
    const rec = { hour: f.hour, price, grisbyPrice: gOut0 ? null : g, grisbyOut: gOut0, grisbyStockLeft: f.grisby ? f.gStock : null, stockStart: stock0, units, revenue: units * price, gross: units * (price - f.cost), soldOutAt: ev.find(e => e.react === "soldout") ? ev.findIndex(e => e.react === "soldout") : -1,
      toGrisby: lost, stolen, segSeen, segBought, events: ev, counts: ev.reduce((c, e) => (c[e.react] = (c[e.react] || 0) + 1, c), {}) };
    f.hours.push(rec); f.hour++; return rec;
  }
  const totals = f => ({ units: f.hours.reduce((a, h) => a + h.units, 0), revenue: f.hours.reduce((a, h) => a + h.revenue, 0), gross: f.hours.reduce((a, h) => a + h.gross, 0), unsold: f.stock, toGrisby: f.hours.reduce((a, h) => a + h.toGrisby, 0), stolen: f.hours.reduce((a, h) => a + h.stolen, 0) });
  // What the afternoon would earn if you kept ONE price all afternoon (the model's own answer: used for Maud's bet and for the oracle in the tests)
  function flat(s, price, stock) { const f = newFair(s, { stock }); for (let h = 0; h < CFG.hours; h++) playHour(f, price); return totals(f); }
  function bestFlat(s, stock) { let best = null; for (let p = 1; p <= 20; p++) { const t = flat(s, p, stock); if (!best || t.gross > best.t.gross) best = { price: p, t }; } return best; }

  // ---------- posting to the books: one Cash sale + one Cost of goods sold per hour, through the engine's journal ----------
  function commitHour(s, f, h) {
    if (!h.units) return;
    const v = h.revenue, c = h.units * S.R.unitCost;
    S.post(s, "sale", `Market Day, hour ${h.hour + 1}: sold ${h.units} sacks at ${h.price} for Cash`, { cash: v, revenue: -v });
    S.post(s, "cogs", `Cost of the ${h.units} sacks sold at the fair`, { cogs: c, inv: -c });
    s.sacks -= h.units; s.week.revenue += v; s.week.cogs += c; s.week.sacksSold += h.units;
  }
  // Post every unposted hour and (re)write the fair's record. The UI calls this after EVERY hour, so a fair is "had" from its first posted hour:
  // quitting and reloading mid-afternoon cannot replay the same villagers for more takings (the saved game already has the sales and the record).
  function commit(s, f) {
    f.hours.forEach(h => { if (!h.posted) { commitHour(s, f, h); h.posted = true; } });
    const m = s.market || (s.market = { fairs: [], named: false, bet: null });
    const t = totals(f); const rec = { day: f.day, market: f.market, grisby: f.grisby, stock0: f.stock0, units: t.units, revenue: t.revenue, gross: t.gross, toGrisby: t.toGrisby, stolen: t.stolen,
      points: f.hours.map(h => ({ price: h.price, units: h.units, short: h.soldOutAt >= 0 })) };
    const i = m.fairs.findIndex(x => x.day === f.day); if (i >= 0) m.fairs[i] = rec; else m.fairs.push(rec);
    return t;
  }
  const history = s => (s.market && s.market.fairs) || [];
  // Did the player run an experiment that worked? A price change between hours that RAISED takings (T6b: showing up with two different prices isn't enough).
  const experiment = f => f.hours.some((h, i) => i > 0 && h.price !== f.hours[i - 1].price && h.revenue > f.hours[i - 1].revenue && h.soldOutAt < 0);
  // Maud's bet (day 14): settle it on any path. A finished fair is judged; a fair abandoned part-way (the page closed, the game reloaded) refunds the stake, so a quit never costs coin.
  function settleBet(s) {
    const m = s.market, b = m && m.bet; if (!b || !b.guess || b.settled) return null;
    const fair = m.fairs.find(x => x.day === b.day), done = fair && fair.points.length >= CFG.hours;
    if (!done && s.day <= b.day && !fair) return null; // the fair is still ahead or just beginning
    if (!done) { S.post(s, "wager", `Maud's bet on your fair price: the fair was left unfinished, stake ${b.stake} refunded`, { cash: b.stake, upkeep: -b.stake }); b.settled = "refunded"; return "refunded"; }
    const win = b.guess === b.answer; if (win) S.wagerWin(s, b.stake || 2, "Maud's bet on your fair price"); b.settled = win ? "won" : "lost"; return b.settled;
  }

  // ---------- Maud's bet (day 14): will raising your price by 1 raise or lower your takings? ----------
  function betAnswer(s, price, stock) { const a = flat(s, price, stock).revenue, b = flat(s, price + 1, stock).revenue; return { answer: b > a ? "up" : b < a ? "down" : "same", now: a, then: b }; }

  // ---------- the least-squares demand line through the player's hour-by-hour points (sold-out hours are cut off by stock, so they don't count) ----------
  function demandFit(points) {
    const p = points.filter(x => !x.short); if (new Set(p.map(x => x.price)).size < 2) return null;
    const n = p.length, mx = p.reduce((a, x) => a + x.price, 0) / n, my = p.reduce((a, x) => a + x.units, 0) / n;
    const sxx = p.reduce((a, x) => a + (x.price - mx) ** 2, 0), sxy = p.reduce((a, x) => a + (x.price - mx) * (x.units - my), 0);
    return sxx ? { slope: sxy / sxx, icpt: my - sxy / sxx * mx } : null;
  }

  // ---------- bots (tests): they see only what a player sees (the reactions), never the reserves ----------
  const bots = {
    fixed: price => ({ name: `fixed at ${price}`, pick: () => price }),
    // a price-setter who reads the faces: start a coin above the going price; if the hour ran faster than the stock allows, charge more; if the stock won't last the day... charge less
    smart: () => ({ name: "smart pricer", pick(f) {
      if (!f.hours.length) return f.market + 1;
      const last = f.hours[f.hours.length - 1], left = CFG.hours - f.hour, target = f.stock / left;
      if (last.soldOutAt >= 0 || last.units > target * 1.25) return last.price + 1;
      if (last.units < target * .75 && f.stock > 0) return Math.max(f.cost + 1, last.price - 1);
      return last.price; } }),
  };
  function auto(s, bot, stock) { const f = newFair(s, { stock }); while (f.hour < CFG.hours) playHour(f, bot.pick(f)); commit(s, f); return f; }

  root.Market = { CFG, FAIR_DAYS, SEG_NAMES, isDay, grisbyIn, grisbyPrice, grisbyStock, experiment, settleBet, villagers, decide, newFair, playHour, totals, flat, bestFlat, commit, commitHour, history, betAnswer, demandFit, bots, auto, roll };
  if (typeof module !== "undefined") module.exports = root.Market;
})(typeof window !== "undefined" ? window : globalThis);

// ======================================================================================================================
// The scene (browser only). One overlay inside #wrap: a pixel-art stall scene on a canvas, and a panel under it that is
// the set-up board, the between-hours price board, or the tally. Everything on screen is drawn from the same pure model above.
// ======================================================================================================================
if (typeof document !== "undefined") (function (root) {
  const M = root.Market, S = root.Spring, $ = id => document.getElementById(id);
  const STALL = { x: 38, y: 20 }, LW = 320, LH = 176, HOUR_S = 20;
  let G = null, ui = null;
  const money = n => String(n);

  // ---------- pixel icons (not emoji fonts): 11x9, drawn from rows like the rest of art.js ----------
  const FACE = ["...kkkkk...", "..kyyyyyk..", ".kyyyyyyyk.", ".kykyyykyk.", ".kyyyyyyyk.", ".kykyyykyk.", ".kyykkkyyk.", "..kyyyyyk..", "...kkkkk..."];
  const ROWS = {
    bought: FACE,
    hesitated: ["...kkkkk...", "..kyyyyyk.b", ".kyyyyyyyk.", ".kykyyykyk.", ".kyyyyyyyk.", ".kyyyyyyyk.", ".kyykkkyyk.", "..kyyyyyk..", "...kkkkk..."],
    dear: ["...kkkkk...", "..kyyyyyk..", ".kkkyyykkk.", ".kykyyykyk.", ".kyyyyyyyk.", ".kyykkkyyk.", ".kykyyykyk.", "..kyyyyyk..", "...kkkkk..."],
    soldout: ["...kkkkk...", "..kyyyyyk..", ".kyyyyyyyk.", ".kkkyyykkk.", ".kyyyyyyyk.", ".kyykkkyyk.", ".kyyyyyyyk.", "..kyyyyyk..", "...kkkkk..."],
  };
  const FACE_COL = { bought: "#f4d35e", hesitated: "#f6e7a6", dear: "#e0583a", soldout: "#b8bcc2" };
  const FACE_TXT = { bought: "bought", hesitated: "hesitated: a coin less would have sold", dear: "too dear", soldout: "sold out: you had no sacks left" };
  const icons = {}; // canvases, built once
  function iconCanvas(kind) { return icons[kind] || (icons[kind] = root.Art.sprite(ROWS[kind], { y: FACE_COL[kind], b: "#5aa6e8" })); }
  const iconHTML = (kind, px) => { const c = iconCanvas(kind), u = c.toDataURL(); return `<img class="mk-ic" alt="${kind}" src="${u}" style="width:${(px || 22) * 11 / 9 | 0}px;height:${px || 22}px">`; };

  // ---------- villagers: the player sprite recoloured per segment (so no new art assets) ----------
  const BASE = { "#7a4a2a": "H", "#5b7fc4": "c", "#46649e": "C", "#5a4636": "l" };
  const LOOKS = {
    thrifty: [{ H: "#6b5a3a", c: "#8a8f7a", C: "#6e7360", l: "#5a4a3a" }, { H: "#3a3a3a", c: "#a58a62", C: "#85704f", l: "#4a3a2a" }, { H: "#a8a8a8", c: "#7d8a96", C: "#626f7a", l: "#55483c" }],
    comfortable: [{ H: "#2f2018", c: "#7a3f8f", C: "#5d2f70", l: "#3a2f4a" }, { H: "#c9a24a", c: "#2f8f8a", C: "#256f6b", l: "#2f3a4a" }, { H: "#e8e0c8", c: "#d9b24a", C: "#b8932f", l: "#2f2f3a" }],
    hurry: [{ H: "#c0392b", c: "#e0583a", C: "#b8402a", l: "#5a4636" }, { H: "#2a2a2a", c: "#e8742a", C: "#c05a1a", l: "#3a3a3a" }],
    grisby: [{ H: "#b8431f", c: "#5f6f2f", C: "#455220", l: "#2a2a2a" }],
  };
  const hex = (r, g, b) => "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
  const cache = {};
  function tintFrames(look) { // {down:[3], up:[3], left:[3], right:[3]} of canvases
    const A = root.Art, out = {};
    ["down", "up", "left", "right"].forEach(dir => out[dir] = A.people.player[dir].map(src => {
      const c = document.createElement("canvas"); c.width = src.width; c.height = src.height; const x = c.getContext("2d"); x.drawImage(src, 0, 0);
      const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const k = BASE[hex(d[i], d[i + 1], d[i + 2])]; if (k && look[k]) { const m = /#(..)(..)(..)/.exec(look[k]); d[i] = parseInt(m[1], 16); d[i + 1] = parseInt(m[2], 16); d[i + 2] = parseInt(m[3], 16); } }
      x.putImageData(id, 0, 0); return c; }));
    return out;
  }
  const sprites = (seg, i) => { const L = LOOKS[seg], look = L[i % L.length], key = seg + (i % L.length); return cache[key] || (cache[key] = tintFrames(look)); };

  // ---------- a villager's walk: waypoints in hour-fractions (the same hour fraction the sale happens at) ----------
  function path(e) {
    const y0 = 84 + (e.k % 3) * 4, a = e.t * .52;
    if (e.to === "grisby") { const gx = 206 + (e.k % 3) * 12; return { dec: a + .16, pts: [{ t: a, x: -16, y: y0 }, { t: a + .12, x: gx, y: y0 }, { t: a + .16, x: gx, y: 66 }, { t: a + .30, x: gx, y: 66 }, { t: a + .34, x: gx, y: y0 }, { t: a + .46, x: 340, y: y0 }] }; }
    const sx = 112 + (e.k * 9) % 44; return { dec: a + .16, pts: [{ t: a, x: -16, y: y0 }, { t: a + .16, x: sx, y: y0 }, { t: a + .28, x: sx, y: y0 }, { t: a + .40, x: 340, y: y0 }] };
  }
  function at(p, t) { const q = p.pts; if (t <= q[0].t) return { x: q[0].x, y: q[0].y, mv: false, dir: "right", off: true }; const last = q[q.length - 1]; if (t >= last.t) return { x: last.x, y: last.y, mv: false, dir: "right", off: true };
    for (let i = 1; i < q.length; i++) if (t <= q[i].t) { const a = q[i - 1], b = q[i], u = (t - a.t) / (b.t - a.t || 1), dx = b.x - a.x, dy = b.y - a.y; return { x: a.x + dx * u, y: a.y + dy * u, mv: dx !== 0 || dy !== 0, dir: dx ? (dx > 0 ? "right" : "left") : dy < 0 ? "up" : "down", off: false }; } return { x: last.x, y: last.y, mv: false, dir: "right", off: true }; }

  // ---------- the stall on the village square (map prop; game.js calls these three) ----------
  const stallTiles = () => [[STALL.x - 1, STALL.y - 1], [STALL.x, STALL.y - 1], [STALL.x + 1, STALL.y - 1]];
  const stallAt = (x, y) => stallTiles().some(t => t[0] === x && t[1] === y);
  function available(s) { return !!s && M.isDay(s.day, s) && !history(s).some(f => f.day === s.day); }
  const history = s => M.history(s);
  function drawStall(ctx, cam, s, frame) {
    const x = (STALL.x - 1) * 16 - cam.x, y = (STALL.y - 1) * 16 - cam.y, on = available(s);
    ctx.fillStyle = "#6b4526"; ctx.fillRect(x + 2, y - 12, 2, 26); ctx.fillRect(x + 44, y - 12, 2, 26);
    ctx.fillStyle = "#cf9f62"; ctx.fillRect(x, y + 4, 48, 10); ctx.fillStyle = "#946b3c"; ctx.fillRect(x, y + 12, 48, 2);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? "#f4ead0" : "#2f6f62"; ctx.fillRect(x + i * 8, y - 16, 8, 9); } ctx.fillStyle = "#3b2a1e"; ctx.fillRect(x, y - 7, 48, 1);
    ctx.drawImage(root.Art.sack, Math.round(x + 6), Math.round(y - 4)); ctx.drawImage(root.Art.sack, Math.round(x + 18), Math.round(y - 4)); ctx.drawImage(root.Art.sack, Math.round(x + 30), Math.round(y - 4));
    // a chalk board leaning on the counter
    ctx.fillStyle = "#3b2a1e"; ctx.fillRect(x + 50, y - 2, 14, 16); ctx.fillStyle = "#2f4a3a"; ctx.fillRect(x + 51, y - 1, 12, 14); ctx.fillStyle = "#f4ead0"; ctx.fillRect(x + 53, y + 2, 8, 1); ctx.fillRect(x + 53, y + 5, 5, 1); ctx.fillRect(x + 53, y + 8, 7, 1);
    if (on) { const w = Math.round(Math.sin(frame / 10) * 1.5); ctx.fillStyle = "#3b2a1e"; ctx.fillRect(x + 22, y - 30, 2, 15); ctx.fillStyle = "#c43a1a"; ctx.fillRect(x + 24, y - 30, 12 + w, 4); ctx.fillRect(x + 24, y - 26, 8 + w, 3); }
  }

  // ---------- the goal-ribbon line: game.js adds this under the chapter goal on a fair day ----------
  function goalLine(s, busy) {
    if (s) try { M.settleBet(s); } catch (e) {} // a bet left over from a fair that was quit part-way is refunded the next time the screen refreshes
    if (!s || busy) return "";
    if (available(s)) return `<div class="mk-goal"><span class="k">Market Day</span> Set your own prices at the stall and watch who buys. <button type="button" class="btn gold" data-mk="go">To the stall</button></div>`;
    return "";
  }

  // ---------- the overlay ----------
  let st = null; // the current fair: { f, phase, price, bring, hourT, fast, bet, ... }
  const isOpen = () => !!st;
  function root_() { return $("mkt"); }
  function layout() { // size the canvas to the room the overlay has (keeps whole-pixel aspect, never taller than ~half the screen)
    const r = root_(); if (!r) return; const cv = $("mk-cv"); if (!cv) return;
    const W = r.clientWidth, H = r.clientHeight, byH = Math.max(190, H - 400) * LW / LH, w = Math.floor(Math.min(W - 24, 980, byH));
    cv.style.width = w + "px"; cv.style.height = Math.round(w * LH / LW) + "px";
  }

  function open() {
    const s = G.s;
    if (st) return;
    M.settleBet(s);
    if (!M.isDay(s.day, s)) return G.say("maud", `Market Day is on days 7, 14 and 21, and today is day ${s.day}: bring grain you can spare.`, ["Close"]);
    if (history(s).some(f => f.day === s.day)) return G.say("maud", "You've had your fair today. The next one is the next 7th day.", ["Close"]);
    if (!s.sacks) return G.say("maud", "The barn is empty, so there is nothing for the stall: come back with sacks you can spare.", ["Close"]);
    s.market = s.market || { fairs: [], named: false, bet: null };
    const pl = G.pl, T = G.T; pl.x = STALL.x * T + 8; pl.y = (STALL.y + 1) * T + 12; pl.dir = "up"; pl.target = null;
    const barn = s.sacks, committed = S.committed(s), spare = Math.max(0, barn - committed);
    st = { phase: "setup", price: S.marketPrice(s.day), bring: Math.min(barn, Math.max(spare, Math.min(barn, 12)), 18), barn, committed, spare, f: null, rec: null, hourT: 0, fast: false, evs: null, bet: null, last: 0, cash0: s.bal.cash };
    document.body.classList.add("mk-open");
    const el = document.createElement("div"); el.id = "mkt"; el.innerHTML = `<div class="mk-card"><div class="mk-top" id="mk-top"></div><div class="mk-sceneBox" id="mk-sceneBox"><canvas id="mk-cv" width="${LW}" height="${LH}"></canvas></div><div class="mk-panel" id="mk-panel"></div></div>`;
    $("wrap").appendChild(el); layout(); render(); loop.t = 0; if (!loop.on) { loop.on = true; requestAnimationFrame(loop); }
  }
  function close() {
    const el = root_(); if (el) el.remove(); document.body.classList.remove("mk-open"); st = null;
    G.hud(); G.save();
  }
  function go() { // from the goal ribbon
    if (st) return; open();
  }

  // ---------- panels ----------
  const btn = (id, label, cls, extra) => `<button type="button" id="${id}" class="mk-btn ${cls || ""}" ${extra || ""}>${label}</button>`;
  const stepper = (id, v, unit, lab) => `<div class="mk-step"><button type="button" class="mk-btn sq" data-st="${id}-" aria-label="${lab} down">−</button><div class="mk-val" id="${id}v"><b>${v}</b><span>${unit}</span></div><button type="button" class="mk-btn sq" data-st="${id}+" aria-label="${lab} up">+</button></div>`;
  const legend = () => `<div class="mk-legend">${["bought", "hesitated", "dear", "soldout"].map(k => `<span>${iconHTML(k, 18)} ${k === "bought" ? "bought" : k === "hesitated" ? "hesitated: a coin less would have sold" : k === "dear" ? "too dear" : "sold out"}</span>`).join("")}</div>
    <div class="mk-legend seg"><span class="sw thrifty"></span> thrifty <span class="sw comfortable"></span> comfortable <span class="sw hurry"></span> in a hurry</div>`;
  function marginLine(p) { const c = S.R.unitCost, m = p - c; return m < 0 ? `<span class="bad">Below cost: every sack loses ${-m}.</span>` : m === 0 ? `<span class="bad">You make nothing on a sack.</span>` : `Each sack cost you ${c}; at ${p} you keep ${m} (${Math.round(m / p * 100)}% of the price).`; }

  function top() {
    const s = G.s, el = $("mk-top"); if (!el) return;
    el.innerHTML = `<div class="mk-title"><b>Market Day</b> <span>day ${s.day}${M.grisbyIn(s.day) ? " · Grisby is across the lane" : ""}</span></div><div class="mk-stats"><span>Cash <b>${s.bal.cash}</b></span><span>Going price <b>${S.marketPrice(s.day)}</b></span>` +
      (st.f ? `<span>Sacks left <b id="mk-left">${st.f.stock}</b></span><span>Takings <b id="mk-take">0</b></span>` : `<span>Barn <b>${s.sacks}</b> sacks</span>`) + `</div>`;
    liveStats();
  }
  const CFG = () => M.CFG;

  function render() {
    top(); const p = $("mk-panel"), s = G.s; if (!p) return;
    $("mk-sceneBox").style.display = st.phase === "tally" ? "none" : "";
    if (st.phase === "setup") {
      const over = st.bring > st.spare && st.committed > 0;
      p.innerHTML = `<div class="mk-row"><div class="mk-box"><h3>Sacks to bring</h3>${stepper("bring", st.bring, "sacks", "Sacks")}<div class="mk-note">${s.sacks} in the barn.${st.committed ? ` Open orders still need <b>${st.committed}</b>.` : ""}</div>${over ? `<div class="mk-note bad" id="mk-warn">That dips into sacks you promised to customers.</div>` : ""}</div>
        <div class="mk-box board"><h3>Chalk board: a sack of wheat</h3>${stepper("price", st.price, "coins", "Price")}<div class="mk-note" id="mk-margin">${marginLine(st.price)}</div></div></div>
        <div class="mk-row"><div class="mk-help">${s.market && s.market.fairs.length ? "" : `Eight villagers walk by each hour. You can change your price once an hour. Watch the faces.`}${M.grisbyIn(s.day) ? ` <b>Grisby</b> watches your board and sets his price after you; he brings ${M.grisbyStock(s.day)} sacks today.` : ""}</div>
        <div class="mk-actions">${btn("mk-leave", "Not today", "alt")}${btn("mk-open", "Open the stall", "gold")}</div></div>`;
    } else if (st.phase === "bet") {
      const q = st.betQ; p.innerHTML = `<div class="mk-maud"><canvas id="mk-maud" width="16" height="16"></canvas><div><div class="mk-nm">Maud the reeve</div><div class="mk-say">Two coin says I know what one more coin on your board does. Say you chalk <b>${st.price + 1}</b> instead of <b>${st.price}</b> for the whole afternoon, with your ${st.bring} sacks${M.grisbyIn(s.day) ? " and Grisby watching" : ""}. Will your takings <b>rise</b>, <b>fall</b>, or <b>stay the same</b>?</div></div></div>
        <div class="mk-actions wide">${btn("mk-b-up", "Takings rise", "", 'data-bet="up"')}${btn("mk-b-down", "Takings fall", "", 'data-bet="down"')}${btn("mk-b-same", "Stay the same", "", 'data-bet="same"')}${btn("mk-b-no", "No bet", "alt", 'data-bet="no"')}</div>`;
      void q; const c = $("mk-maud"); if (c) c.getContext("2d").drawImage(root.Art.people.maud.down[0], 0, 0);
    } else if (st.phase === "pause") {
      const r = st.f.hours[st.f.hours.length - 1], hnext = st.f.hour + 1, c = r.counts;
      const nudge = r.soldOutAt >= 0 ? `You ran out of sacks partway through the hour: the buyers after that walked away.` : (c.hesitated || 0) >= 2 ? `${c.hesitated} villagers hesitated. A coin less may have won them.` : (c.dear || 0) >= 4 ? `Most of the crowd called it too dear.` : (c.bought || 0) >= 7 ? `Nearly everyone bought. Was your price too low?` : "";
      p.innerHTML = `<div class="mk-row"><div class="mk-box"><h3>Hour ${r.hour + 1} of ${CFG().hours}: ${r.units} sacks at ${r.price}</h3><div class="mk-faces">${["bought", "hesitated", "dear", "soldout"].filter(k => c[k]).map(k => `<span>${iconHTML(k, 26)} <b>${c[k]}</b></span>`).join("")}</div>
        ${gboard(r)}<div class="mk-note">${nudge}</div></div>
        <div class="mk-box board"><h3>Price for hour ${hnext}</h3>${stepper("price", st.price, "coins", "Price")}<div class="mk-note" id="mk-margin">${marginLine(st.price)}</div></div></div>
        <div class="mk-row"><div class="mk-help">${M.grisbyIn(s.day) ? "Grisby will see your new price before the hour starts." : ""}</div><div class="mk-actions">${btn("mk-fast", st.fast ? "Fast: on (tap to turn off)" : "Fast: off", "alt")}${btn("mk-next", `Open hour ${hnext}`, "gold")}</div></div>${legend()}`;
    } else if (st.phase === "walk") {
      p.innerHTML = `<div class="mk-row"><div class="mk-box"><h3>Hour ${st.f.hour} of ${CFG().hours} at ${st.rec.price}</h3><div class="mk-prog"><i id="mk-prog"></i></div><div class="mk-note">Your price is chalked for this hour. ${st.f.grisby ? `Grisby is asking ${st.rec.grisbyPrice}.` : ""}</div></div>
        <div class="mk-actions">${btn("mk-fast", "Fast", "alt")}</div></div>${legend()}`;
    } else if (st.phase === "tally") tally(p);
    wire(); layout();
  }

  // Grisby's board: what he asked, how many sacks he has left and what he took this hour (capped by his stock; the part that was really yours is separate)
  function gboard(r) {
    if (!st.f.grisby) return "";
    const took = r.toGrisby ? `took <b>${r.toGrisby}</b> sack${r.toGrisby === 1 ? "" : "s"}${r.stolen ? `, <b>${r.stolen}</b> from buyers who would have paid you` : ", none from buyers who would have paid you"}` : "took nothing";
    return `<div class="mk-gboard"><b>Grisby's board</b> ${r.grisbyOut ? `<span class="bad">sold out: nothing left to sell</span>` : `asked <b>${r.grisbyPrice}</b>`} <span>stock left <b>${r.grisbyStockLeft}</b> of ${st.f.gStock0}</span> <span>${r.grisbyOut ? "" : took}</span></div>`;
  }
  // the break-even cell (T6): after the takings, one question in the player's own numbers
  function beFacts(s, t) { const avg = t.units ? Math.round(t.revenue / t.units) : 0, keep = avg - S.R.unitCost, bill = S.weekBills(s); return keep > 0 && bill > 0 ? { avg, keep, bill, answer: Math.ceil(bill / keep) } : null; }
  function beCell(s, t) {
    const b = beFacts(s, t); if (!b) return ""; st.be = st.be || { tries: 0, done: false };
    return `<div class="mk-be" id="mk-be"><b>Break-even.</b> You kept <b>${b.keep}</b> on each sack (${b.avg} − ${S.R.unitCost}). This pay-day's wages and interest come to <b>${b.bill}</b>. How many sacks at that margin cover the bill?
      ${st.be.done ? `<span class="good">${st.be.msg}</span>` : `<input id="mk-be-in" type="text" inputmode="numeric" autocomplete="off" placeholder="sacks"><button type="button" class="mk-btn" id="mk-be-ok">Check</button> <span id="mk-be-msg" class="bad">${st.be.msg || ""}</span>`}</div>`;
  }
  function beWire() {
    const ok = $("mk-be-ok"); if (!ok) return; const s = G.s, b = beFacts(s, M.totals(st.f));
    const check = () => { const v = parseInt($("mk-be-in").value, 10); if (isNaN(v)) { $("mk-be-msg").textContent = "Type a number of sacks."; return; }
      if (v === b.answer) { st.be.done = true; st.be.msg = st.be.tries === 0 ? `Right: ${b.bill} ÷ ${b.keep}, rounded up, is ${b.answer} sacks.` : `Yes: ${b.answer} sacks.`; if (st.be.tries === 0 && root.Transcript) root.Transcript.master("breakeven", s.day); }
      else { st.be.tries++; if (st.be.tries >= 2) { st.be.done = true; st.be.msg = `It's ${b.answer}: ${b.bill} ÷ ${b.keep} = ${(b.bill / b.keep).toFixed(1)}, rounded up, because half a sack pays nobody.`; } else st.be.msg = "Not quite. Divide the bill by what you keep on one sack, and round up."; }
      render(); };
    ok.onclick = check; $("mk-be-in").addEventListener("keydown", e => { if (e.key === "Enter") check(); e.stopPropagation(); });
  }
  function wire() {
    const p = $("mk-panel"), upd = () => { const v = $("pricev"); if (v) v.firstChild.textContent = st.price; const b = $("bringv"); if (b) b.firstChild.textContent = st.bring; const m = $("mk-margin"); if (m) m.innerHTML = marginLine(st.price); const wn = $("mk-warn"); if (wn) wn.style.display = st.bring > st.spare ? "" : "none"; };
    p.querySelectorAll("[data-st]").forEach(b => b.onclick = () => { const k = b.dataset.st, d = k.endsWith("+") ? 1 : -1, w = k.slice(0, -1);
      if (w === "price") st.price = Math.max(1, Math.min(M.CFG.maxPrice, st.price + d)); else st.bring = Math.max(1, Math.min(G.s.sacks, st.bring + d)); upd(); });
    const on = (id, fn) => { const e = $(id); if (e) e.onclick = fn; };
    on("mk-leave", close); on("mk-open", startAfternoon); on("mk-next", nextHour); on("mk-fast", () => { if (st.phase === "walk") { st.fast = true; finishHour(); } else { st.fast = !st.fast; render(); } }); // in the pause, Fast toggles whether the next hours play instantly
    on("mk-done", () => { const first = M.history(G.s).length === 1; close(); if (first) setTimeout(() => floorBet(G.s), 60); });
    p.querySelectorAll("[data-bet]").forEach(b => b.onclick = () => placeBet(b.dataset.bet));
    if (st.phase === "tally") beWire();
  }

  // T6: after the FIRST fair, Maud's opportunity-cost bet. Ashby offers 5, above the sack's cost; what is the lowest price worth taking? (The best sale you give up.)
  async function floorBet(s) {
    const m = s.market, V = root.Verbs; if (!m || m.floorBet || !V || !V.bet || M.history(s).length !== 1) return; const fair = M.history(s)[0]; if (!fair.units) return;
    const cost = S.R.unitCost, alt = Math.round(fair.revenue / fair.units), offer = Math.max(cost + 1, Math.min(alt - 2, 5)); if (offer >= alt) return;
    m.floorBet = { day: s.day }; G.save();
    await G.say("ashby", `Cash for your spare sacks, dear: ${offer} a sack, on the nail. That's above what they cost you.`, ["Next"]);
    window.__walked = false;
    const r = await V.bet({ prompt: `Ashby's ${offer} is above your cost of ${cost}. Three coin says you can't name the lowest price worth taking for a spare sack, after the fair you've just had.`,
      docs: [{ label: "Open the fair's takings", open: () => { G.showPanel("fairhist", `<h1>Your last fair</h1><table class="stm"><tr><th>Hour</th><th>Price</th><th>Sacks sold</th></tr>${fair.points.map((p, i) => `<tr><td>${i + 1}</td><td class="num">${p.price}</td><td class="num">${p.units}</td></tr>`).join("")}</table><p>${fair.units} sacks for ${fair.revenue} in all.</p><button class="btn alt" id="fhclose">Back</button>`); const b = $("fhclose"); if (b) b.onclick = () => G.hidePanel(); } }],
      how: "What would the same sack fetch at the fair? The best sale you'd give up sets the real floor, not what the sack cost.", stake: { min: 0, max: 3 }, tol: 1, answer: () => alt, reveal: "now", kind: "floor",
      explain: () => `The fair paid you ${alt} a sack on average. Ashby's ${offer} keeps ${offer - cost} but gives up ${alt - offer}: your real floor is ${alt}, not ${cost}.` });
    m.floorBet.win = !!(r && r.win); if (r && r.win && !window.__walked && root.Transcript) root.Transcript.master("opportunity", s.day);
    G.hud(); G.save();
  }

  // ---------- the afternoon ----------
  function startAfternoon() {
    const s = G.s; st.f = M.newFair(s, { stock: st.bring });
    if (s.day === 14 && !(s.market.bet && s.market.bet.day === 14) && s.bal.cash >= 2) { st.phase = "bet"; return render(); }
    beginHour();
  }
  function placeBet(kind) {
    const s = G.s;
    if (kind !== "no") { G.act(() => S.wager(s, 2, "Maud's bet on your fair price")); const a = M.betAnswer(s, st.price, st.bring); s.market.bet = { day: s.day, guess: kind, answer: a.answer, now: a.now, then: a.then, price: st.price, stake: 2 }; }
    else s.market.bet = { day: s.day, guess: null };
    beginHour();
  }
  function beginHour() {
    const s = G.s; st.rec = M.playHour(st.f, st.price); st.evs = st.rec.events.map(e => ({ e, p: path(e) })); st.hourT = 0; st.phase = "walk"; st.last = 0; render();
    if (st.fast) finishHour();
  }
  function nextHour() { beginHour(); }
  function finishHour() { // the hour is over: its sales go on the books
    if (st.phase !== "walk") return; const s = G.s, rec = st.rec;
    st.hourT = 1; G.act(() => { M.commit(s, st.f); return { ok: true }; }); // posts this hour and records the fair, so a reload can't replay it
    if (st.f.hour >= CFG().hours) { st.phase = "tally"; finishFair(); } else st.phase = "pause";
    render(); drawFrame(0);
  }
  function finishFair() {
    const s = G.s, f = st.f, t = M.totals(f); M.commit(s, f);
    const fairs = s.market.fairs, prev = fairs.filter(x => x.day !== f.day), best = Math.max(0, ...prev.map(x => x.gross));
    st.tally = { t, newBest: prev.length > 0 && t.gross > best, firstFair: prev.length === 0 };
    const prices = new Set(f.hours.map(h => h.price)).size, bet = s.market.bet && s.market.bet.day === s.day ? s.market.bet : null;
    G.act(() => { // earn the ideas: seeing a demand curve, segments, and a rival
      // evidence of doing, not of showing up: only an experiment that WORKED counts (a price change between hours that raised takings); a price above the going price, where Grisby answers, shows the rival
      if (M.experiment(f)) { s.uses.push({ id: "segments", day: s.day, well: true }); s.uses.push({ id: "demand", day: s.day, well: true }); }
      if (f.grisby && f.hours.some(h => h.price > f.market)) s.uses.push({ id: "competitor", day: s.day, well: true });
      if (bet && bet.guess && M.settleBet(s) === "won" && root.Transcript) root.Transcript.master("demand", s.day);
      return { ok: true }; });
    top();
  }

  // ---------- the tally ----------
  function chartSVG(s, f) {
    // earlier fairs are drawn only if they were played under the same conditions (with or without Grisby): the two aren't comparable, so the others are left off the chart.
    // An hour that ran out of sacks says nothing about demand, so earlier sold-out hours are left off too (this fair's own are drawn hollow).
    const past = M.history(s).filter(x => x.day !== f.day && x.grisby === f.grisby).flatMap(x => x.points.filter(p => !p.short).map(p => Object.assign({ old: true, grisby: x.grisby }, p)));
    const cur = f.hours.map((h, i) => ({ price: h.price, units: h.units, short: h.soldOutAt >= 0, n: i + 1, take: h.revenue })), all = past.concat(cur);
    let lo = Math.min(...all.map(p => p.price)) - 1, hi = Math.max(...all.map(p => p.price)) + 1; if (hi - lo < 4) { lo -= 1; hi += 1; } lo = Math.max(0, lo);
    const ymax = Math.max(10, Math.ceil((Math.max(...all.map(p => p.units)) + 1) / 2) * 2), W = 460, H = 270, L = 52, R = 16, Tp = 16, B = 44;
    const X = p => L + (p - lo) / (hi - lo) * (W - L - R), Y = u => H - B - u / ymax * (H - B - Tp);
    let g = ""; for (let p = Math.ceil(lo); p <= hi; p++) g += `<line x1="${X(p)}" x2="${X(p)}" y1="${Tp}" y2="${H - B}" class="gl"/><text x="${X(p)}" y="${H - B + 17}" class="tk" text-anchor="middle">${p}</text>`;
    for (let u = 0; u <= ymax; u += 2) g += `<line x1="${L}" x2="${W - R}" y1="${Y(u)}" y2="${Y(u)}" class="gl"/><text x="${L - 8}" y="${Y(u) + 4}" class="tk" text-anchor="end">${u}</text>`;
    // the line is fitted only through hours played under the same conditions as this fair (with or without Grisby), and drawn only across the prices you actually tried
    const same = all.filter(p => !p.old || p.grisby === f.grisby), fit = M.demandFit(same), usable = same.filter(p => !p.short); let line = "";
    if (fit && fit.slope < 0) { const x1 = Math.min(...usable.map(p => p.price)), x2 = Math.max(...usable.map(p => p.price)), cl = v => Math.max(0, Math.min(ymax, v)); line = `<line x1="${X(x1)}" y1="${Y(cl(fit.icpt + fit.slope * x1))}" x2="${X(x2)}" y2="${Y(cl(fit.icpt + fit.slope * x2))}" class="fit"/>`; }
    const stack = {}; // hours that landed on the same spot stack their labels instead of printing over each other
    const dots = all.map(p => { const key = p.price + "," + p.units, lvl = p.old ? 0 : (stack[key] = (stack[key] == null ? 0 : stack[key] + 1)), dx = lvl ? (lvl % 2 ? 1 : -1) * 22 * Math.ceil(lvl / 2) : 0; // a little sideways jitter so same-spot hours stay visible
      return `<circle cx="${X(p.price) + dx}" cy="${Y(p.units)}" r="${p.old ? 6 : 9}" class="${p.old ? "old" : "cur"}${p.short ? " short" : ""}"/>` + (p.old ? "" : `<text x="${X(p.price) + dx + 14}" y="${Y(p.units) + 4}" class="lb" text-anchor="start">hour ${p.n}</text><text x="${X(p.price) + dx}" y="${Y(p.units) + 4}" class="in" text-anchor="middle">${p.n}</text>`); }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="mk-chart" role="img" aria-label="Price against sacks sold per hour">${g}${line}${dots}<text x="${(W + L) / 2}" y="${H - 6}" class="ax" text-anchor="middle">Price per sack (coins)</text><text transform="translate(14 ${(H - B) / 2 + Tp}) rotate(-90)" class="ax" text-anchor="middle">Sacks sold in the hour</text></svg>`;
  }
  function tally(p) {
    const s = G.s, f = st.f, t = st.tally.t, bet = s.market.bet && s.market.bet.day === s.day ? s.market.bet : null, cost = S.R.unitCost;
    const segSeen = {}, segBought = {}; f.hours.forEach(h => { for (const k in h.segSeen) segSeen[k] = (segSeen[k] || 0) + h.segSeen[k]; for (const k in h.segBought) segBought[k] = (segBought[k] || 0) + h.segBought[k]; });
    const prices = new Set(f.hours.map(h => h.price)).size, past = M.history(s).filter(x => x.day !== f.day), drawn = past.some(x => x.grisby === f.grisby && x.points.some(p => !p.short));
    const rows = f.hours.map(h => `<tr><td>${h.hour + 1}</td><td class="num">${h.price}</td><td class="num">${h.units}${h.soldOutAt >= 0 ? " <small>(sold out)</small>" : ""}</td><td class="num">${h.revenue}</td><td class="num">${h.gross}</td></tr>`).join("");
    if (st.nameLine == null) st.nameLine = !s.market.named && prices >= 2 ? (s.market.named = true, `<div class="mk-maudline"><b>Maud:</b> That's a demand curve. Yours. Each dot is one hour: the price you chalked and the sacks that left. Takings are price times sacks, so the best price is not always the lowest or the highest.</div>`)
      : !s.market.named && prices < 2 ? `<div class="mk-maudline"><b>Maud:</b> One price is only a dot, not a curve. Next fair, change your price between the hours and see what the village does.</div>` : "";
    const nameLine = st.nameLine, betLine = bet && bet.guess ? `<div class="mk-maudline ${bet.guess === bet.answer ? "win" : "lose"}"><b>Maud's bet:</b> you said takings would <b>${{ up: "rise", down: "fall", same: "stay the same" }[bet.guess]}</b>. At ${bet.price} all afternoon the model gives ${bet.now} takings; at ${bet.price + 1}, ${bet.then}. Takings ${bet.answer === "up" ? "rise" : bet.answer === "down" ? "fall" : "stay the same"}. ${bet.guess === bet.answer ? "You won: 2 coin back, and 2 more." : "You lose the 2 coin."}<br><i>A price rise wins when the extra coin on the sacks that still sell is more than the coin you lose on the sacks that no longer sell.</i></div>` : "";
    const seg = ["thrifty", "comfortable", "hurry"].filter(k => segSeen[k]).map(k => `<li><span class="sw ${k}"></span> ${M.SEG_NAMES[k]}: ${segBought[k] || 0} of ${segSeen[k]} bought</li>`).join("");
    const left = `<h2>The takings</h2><table class="mk-tab"><tr><th>Hour</th><th>Price</th><th>Sacks sold</th><th>Takings</th><th>Gross profit</th></tr>${rows}<tr class="tot"><td>Total</td><td></td><td class="num">${t.units}</td><td class="num">${t.revenue}</td><td class="num">${t.gross}</td></tr></table>
      <div class="mk-note">Gross profit is what you keep after the sacks' cost (${cost} each). ${t.unsold ? `<b>${t.unsold} sacks unsold</b>: back to the barn.` : "<b>Sold out.</b>"} ${f.grisby ? (t.stolen ? `Grisby took ${t.stolen} sack${t.stolen === 1 ? "" : "s"} from villagers who would have paid your price.` : t.toGrisby ? `Grisby sold ${t.toGrisby} sack${t.toGrisby === 1 ? "" : "s"}, but only to villagers your price had already lost.` : "Grisby sold nothing to your crowd.") : ""}</div>
      ${beCell(s, t)}<ul class="mk-seg">${seg}</ul>${st.tally.newBest ? `<div class="mk-best">Your best fair yet: ${t.gross} gross profit.</div>` : st.tally.firstFair ? "" : `<div class="mk-note">Best earlier fair: ${Math.max(...past.map(x => x.gross))} gross profit.</div>`}`;
    p.innerHTML = `<div class="mk-tally"><div class="mk-tl">${left}</div><div class="mk-tr"><h2>Your demand curve</h2>${chartSVG(s, f)}<div class="mk-note">${drawn ? `Solid dots: this fair. Faded dots: earlier fairs ${f.grisby ? "with Grisby" : "without a rival"}.` : `Solid dots: this fair.`}${M.history(s).some(x => x.day !== f.day && x.grisby !== f.grisby) ? ` Fairs ${f.grisby ? "without" : "with"} Grisby are left off: his stall changes who buys.` : ""} A hollow dot is an hour you ran out of sacks, so it says nothing about demand.${fitNote()}</div></div></div>${nameLine}${betLine}<div class="mk-actions">${btn("mk-done", "Pack up the stall", "gold")}</div>`;
    function fitNote() { const pts = M.history(s).filter(x => x.grisby === f.grisby).flatMap(x => x.points), fit = M.demandFit(pts);
      return fit && fit.slope < 0 ? ` The dashed line runs through your hours ${f.grisby ? "with Grisby across the lane" : "without a rival"}: roughly ${(-fit.slope).toFixed(1)} fewer sacks an hour for each coin more. Eight villagers an hour is a small sample, so read it as a guide.` : ""; }
  }

  // ---------- drawing the afternoon ----------
  function drawFrame(time) {
    const cv = $("mk-cv"); if (!cv || !st) return; const ctx = cv.getContext("2d"), A = root.Art, TL = A.TILES, s = G.s; ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < LH; y += 16) for (let x = 0; x < LW; x += 16) { const lane = y >= 48 && y < 112; ctx.drawImage(lane ? TL.cobble[((x >> 4) * 3 + (y >> 4)) % 2] : TL.grass[((x >> 4) + (y >> 4) * 2) % 4], x, y); }
    [[-6, -14], [292, -12], [-8, 134], [296, 130]].forEach(([x, y], i) => ctx.drawImage(A.tree[i % 3], x, y));
    const f = st.f, price = st.phase === "setup" || st.phase === "bet" ? st.price : (st.rec ? st.rec.price : st.price), g = (f ? f.grisby : M.grisbyIn(s.day));
    const grisbyP = g ? (st.rec && st.phase !== "setup" ? st.rec.grisbyPrice : M.grisbyPrice(S.marketPrice(s.day), price)) : null;
    // Grisby's stall (top) and yours (bottom)
    const stall = (cx, cy, awn, counterY, board, label, sacksN, vendor, vy, up) => {
      if (up) { ctx.fillStyle = "#6b4526"; ctx.fillRect(cx - 36, awn, 2, counterY - awn + 6); ctx.fillRect(cx + 34, awn, 2, counterY - awn + 6); }
      if (vendor) { const d = vendor.down[0]; ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fillRect(cx - 5, vy - 1, 10, 3); ctx.drawImage(d, cx - 8, vy - 16); }
      ctx.fillStyle = "#cf9f62"; ctx.fillRect(cx - 36, counterY, 72, 14); ctx.fillStyle = "#946b3c"; ctx.fillRect(cx - 36, counterY + 12, 72, 2);
      for (let i = 0; i < sacksN; i++) ctx.drawImage(A.sack, Math.round(cx - 38 + (i % 9) * 7), counterY - 6 - (i >= 9 ? 4 : 0));
      for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? "#f4ead0" : awnCol(label); ctx.fillRect(cx - 36 + i * 8, awn, 8, 10); } ctx.fillStyle = "#3b2a1e"; ctx.fillRect(cx - 36, awn + 10, 72, 1);
      // the price board
      ctx.fillStyle = "#3b2a1e"; ctx.fillRect(cx + 40, counterY - 8, 28, 24); ctx.fillStyle = "#2f4a3a"; ctx.fillRect(cx + 41, counterY - 7, 26, 22);
      ctx.fillStyle = "#f4ead0"; ctx.font = "bold 6px monospace"; ctx.textAlign = "center"; ctx.fillText(label, cx + 54, counterY); ctx.font = "bold 12px monospace"; ctx.fillText(board == null ? "–" : String(board), cx + 54, counterY + 12); ctx.textAlign = "left";
    };
    const awnCol = l => l === "GRISBY" ? "#9b2335" : "#2f6f62";
    // Grisby's stall (across the lane, from week 2), then yours; villagers walk the lane between them
    const gOut = !!(f && f.grisby && f.hour > 0 && f.gStock <= 0 && (st.phase !== "walk" || st.rec.grisbyOut));
    if (g) { stall(224, 0, 12, 40, grisbyP, "GRISBY", f ? Math.min(10, Math.ceil(f.gStock / 3)) : 10, sp("grisby"), 40, true); if (gOut) { ctx.fillStyle = "#9b2335"; ctx.fillRect(196, 30, 56, 11); ctx.fillStyle = "#fff"; ctx.font = "bold 7px monospace"; ctx.textAlign = "center"; ctx.fillText("SOLD OUT", 224, 38); ctx.textAlign = "left"; } }
    stall(140, 0, 100, 118, price, "YOURS", Math.min(18, Math.ceil(Math.max(0, remaining()) / 3)), null, 0, true);
    ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fillRect(135, 149, 10, 3); ctx.drawImage(A.people.player.up[0], 132, 134); // you, behind the counter
    if (remaining() <= 0 && st.f) { ctx.fillStyle = "#9b2335"; ctx.fillRect(112, 124, 56, 11); ctx.fillStyle = "#fff"; ctx.font = "bold 7px monospace"; ctx.textAlign = "center"; ctx.fillText("SOLD OUT", 140, 132); ctx.textAlign = "left"; }
    if (st.phase === "walk" || (st.phase === "pause" && st.evs)) {
      const t = st.phase === "walk" ? st.hourT : 1, list = (st.evs || []).map(({ e, p }) => ({ e, p, a: at(p, t) })).filter(o => !o.a.off).sort((a, b) => a.a.y - b.a.y);
      list.forEach(({ e, a }) => { const sp_ = sprites(e.seg, e.look)[a.dir], fr = a.mv ? 1 + (Math.floor(time * 8 + e.k) % 2) : 0; ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fillRect(Math.round(a.x - 5), Math.round(a.y - 1), 10, 3); ctx.drawImage(sp_[fr], Math.round(a.x - 8), Math.round(a.y - 16)); });
      list.forEach(({ e, p, a }) => { if (t >= p.dec && t < p.dec + .13) { bubble(ctx, Math.round(a.x), Math.round(a.y - 20), e.react);
        if (e.react === "bought" && e.to === "me") { const u = (t - p.dec) / .13, tx = 124 + (e.k % 4) * 10, ty = 96 - u * 10; ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.strokeText("+" + e.qty * e.price, tx, ty); ctx.fillStyle = "#7a5a10"; ctx.fillText("+" + e.qty * e.price, tx, ty); ctx.textAlign = "left"; } } });
    }
    function sp(who) { return cache["g" + who] || (cache["g" + who] = tintFrames(LOOKS.grisby[0])); }
  }
  function soldSoFar() { if (!st || !st.evs || st.phase !== "walk") return 0; return st.evs.filter(o => o.e.to === "me" && o.p.dec <= st.hourT).reduce((a, o) => a + o.e.qty, 0); }
  function remaining() { if (!st.f) return st.bring; return st.f.stock + (st.phase === "walk" ? (st.rec.units - soldSoFar()) : 0); }
  function bubble(ctx, x, y, kind) { y -= 6; ctx.fillStyle = "#3b2a1e"; ctx.fillRect(x - 8, y - 6, 17, 14); ctx.fillStyle = "#fff"; ctx.fillRect(x - 7, y - 5, 15, 12); ctx.fillStyle = "#3b2a1e"; ctx.fillRect(x - 1, y + 8, 3, 2); ctx.fillStyle = "#fff"; ctx.fillRect(x, y + 7, 1, 2); ctx.drawImage(iconCanvas(kind), x - 5, y - 4); }

  function liveStats() {
    if (!st || !st.f) return; const left = $("mk-left"), take = $("mk-take"); if (!left) return;
    const rec = st.rec, done = st.f.hours.filter(h => h.posted).reduce((a, h) => a + h.revenue, 0), now = st.phase === "walk" ? st.evs.filter(o => o.e.to === "me" && o.p.dec <= st.hourT).reduce((a, o) => a + o.e.qty * o.e.price, 0) : 0;
    left.textContent = Math.max(0, remaining()); take.textContent = done + now; void rec;
    const pg = $("mk-prog"); if (pg && st.phase === "walk") pg.style.width = Math.round(st.hourT * 100) + "%";
  }
  function loop(ts) {
    if (!st) { loop.on = false; return; } const dt = Math.min(.05, (ts - (loop.t || ts)) / 1000); loop.t = ts; // one loop at a time (reopening within a frame can't start a second)
    if (st.phase === "walk" && !st.hold) { st.hourT += dt / HOUR_S; if (st.hourT >= 1 || st.fast) finishHour(); }
    st && (st.time = (st.time || 0) + dt, drawFrame(st.time), liveStats());
    requestAnimationFrame(loop);
  }
  addEventListener("resize", layout);
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-mk=go]"); if (b) { e.stopPropagation(); go(); } });

  // test and screenshot hooks (not used by the game)
  const debug = { get st() { return st; }, seek(t) { if (st && st.phase === "walk") { st.hourT = t; st.hold = true; drawFrame(st.time || 0); liveStats(); } }, release() { if (st) st.hold = false; }, draw(time) { drawFrame(time || 0); },
    seekBest() { let best = 0, bt = .3; for (let t = 0; t <= 1; t += .01) { const n = st.evs.filter(o => t >= o.p.dec && t < o.p.dec + .13).length; if (n > best) { best = n; bt = t; } } debug.seek(bt); return bt; }, finish: finishHour };
  Object.assign(M, { init(g) { G = g; }, open, go, close, isOpen, stallAt, stallTiles, drawStall, goalLine, available, layout, debug, STALL });
})(typeof window !== "undefined" ? window : globalThis);
