// Spring at Thornfield — pixel art, all drawn in code. 16x16 tiles. Characters, crops and props are small
// palette-indexed string arrays (the classic sprite-sheet-as-text technique); ground tiles, trees and buildings are
// drawn procedurally with a seeded dither so every tile is hand-made-looking but free. Warm palette after Stardew Valley.
(function (root) {
  const T = 16;
  const P = {
    k: "#3b2a1e", g: "#79b851", G: "#5f9e3f", h: "#93cc62", d: "#d9b27a", D: "#bf9559", s: "#8e5d35", S: "#6f4628",
    m: "#5c3b22", M: "#472c18", w: "#4a90d9", W: "#8cc4f2", y: "#f4d35e", Y: "#d9a83a", l: "#4c9a38", L: "#86d25a",
    f: "#cf9f62", F: "#946b3c", e: "#f3c69b", E: "#dca37c", o: "#4a3526", r: "#ffffff", c: "#5b7fc4", C: "#46649e", H: "#7a4a2a",
    n: "#9aa0a6", N: "#6f757b", p: "#e76f8a", q: "#fff0a0", b: "#7ea6e8", u: "#c4c9cf", U: "#8d949b",
  };
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function sprite(rows, pal, flip) { // rows: strings, '.' or ' ' transparent; pal overrides the base palette
    const w = Math.max(...rows.map(r => r.length)), c = canvas(w, rows.length), x = c.getContext("2d"), p = Object.assign({}, P, pal || {});
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === "." || ch === " " || !p[ch]) return; x.fillStyle = p[ch]; x.fillRect(flip ? w - 1 - i : i, j, 1, 1); }));
    return c;
  }
  // ---------- people: one template, recoloured per villager ----------
  const HEAD_F = ["", ".....kkkkkk.....", "....kHHHHHHk....", "...kHHHHHHHHk...", "...kHHHHHHHHk...", "...kHeeeeeeHk...", "...kekeeeekek...", "...keeeeeeeek...", "....keeEEeek...."];
  const HEAD_B = ["", ".....kkkkkk.....", "....kHHHHHHk....", "...kHHHHHHHHk...", "...kHHHHHHHHk...", "...kHHHHHHHHk...", "...kHHHHHHHHk...", "...kHHHHHHHHk...", "....keHHHHek...."];
  const HEAD_S = ["", ".....kkkkkk.....", "....kHHHHHHk....", "...kHHHHHHHHk...", "...kHHHHHHHHk...", "...kHHHHeeeek...", "...kHHHeeekek...", "...kHHeeeeeek...", "....keeeeEek...."];
  const BODY_F = ["...kcccccccck...", "..keccccccccek..", "...kCccccccCk...", "...kllllllllk..."];
  const BODY_S = ["....kcccccck....", "....kccccCek....", "....kCccccCk....", "....kllllllk...."];
  const LEGS_F = [["...kllkkkkllk...", "...kook..kook...", "....kk....kk...."], ["...kllk..kllk...", "...kook...kk....", "....kk...kook..."]];
  const LEGS_S = [["....kllkkllk....", "....kookkook....", ".....kk..kk....."], ["...kllk..kllk...", "...kook..kook...", "....kk....kk...."]];
  function person(pal) { // {down:[a,b,c], up:[...], left:[...], right:[...]}
    const f = (head, body, legs) => head.concat(body, legs);
    const down = [sprite(f(HEAD_F, BODY_F, LEGS_F[0]), pal), sprite(f(HEAD_F, BODY_F, LEGS_F[1]), pal), sprite(f(HEAD_F, BODY_F, LEGS_F[1]), pal, true)];
    const up = [sprite(f(HEAD_B, BODY_F, LEGS_F[0]), pal), sprite(f(HEAD_B, BODY_F, LEGS_F[1]), pal), sprite(f(HEAD_B, BODY_F, LEGS_F[1]), pal, true)];
    const right = [sprite(f(HEAD_S, BODY_S, LEGS_S[0]), pal), sprite(f(HEAD_S, BODY_S, LEGS_S[1]), pal), sprite(f(HEAD_S, BODY_S, LEGS_S[0]), pal)];
    const left = right.map((_, i) => sprite(f(HEAD_S, BODY_S, LEGS_S[i === 1 ? 1 : 0]), pal, true));
    return { down, up, left, right };
  }
  const PEOPLE = {
    player: { H: "#7a4a2a", c: "#5b7fc4", C: "#46649e", l: "#5a4636" },
    maud: { H: "#c9c9c9", c: "#6c9a4a", C: "#557a3a", l: "#6b4f3a" },
    ezra: { H: "#2a2a2a", c: "#6a3f7a", C: "#512f5e", l: "#2f2a3a", e: "#e8b88f" },
    ashby: { H: "#f0ece0", c: "#e79bb0", C: "#c97a91", l: "#8a6a5a" },
    hobb: { H: "#a86a32", c: "#f2efe6", C: "#cfcabb", l: "#6a5a48", e: "#e9b48a" },
    tomas: { H: "#d8742a", c: "#3f8f6f", C: "#2f6f55", l: "#5a4636" },
    corvin: { H: "#1a1a24", c: "#1f6a62", C: "#154a45", l: "#d9b24a", e: "#efd2b0" }, // WS6: Corvin Vane, the Duke's steward (replaces the generic Duke sprite); key "duke" stays in game state, aliased below
    mira: { H: "#2f2018", c: "#d9a83a", C: "#b8862b", l: "#5a4636", e: "#d9a07a" },
    abbey: { H: "#8a6a4a", c: "#6b5a48", C: "#54463a", l: "#54463a" },
    pell: { H: "#6a4a2a", c: "#b07a6a", C: "#8f5f50", l: "#4a3a2a", e: "#e0a888" },
    pedlar: { H: "#2a2a3a", c: "#7a7a2a", C: "#5a5a1f", l: "#3a3a2a", e: "#e0b090" },
    crane: { H: "#d8d8d8", c: "#26262c", C: "#15151a", l: "#1c1c22", e: "#e8c9a8" }, // WS3: Bailiff Crane, black coat; the ledger under his arm is added in build()
  };
  const CHEST = ["", "", "", "", "", "..kkkkkkkkkkkk..", ".kHHHHHHHHHHHHk.", ".kHsHHHHHHHHsHk.", ".kkkkkkYYkkkkkk.", ".kssssskYksssSk.", ".kssssssYssssSk.", ".kSSSSSSSSSSSSk.", "..kkkkkkkkkkkk.."]; // WS3: the farm's cash chest
  // ---------- crops (wheat), five growth stages ----------
  const CROPS = [
    ["", "", "", "", "", "", "", "", "", "", "....Y....Y......", "..........Y..Y..", "......Y.........", "............"],
    ["", "", "", "", "", "", "", "", "", "......L..L......", ".......LL.......", ".......l........", "....L.......L...", ".....lL...lL...."],
    ["", "", "", "", "", "", "", "....L.....L.....", ".....L.L.L......", "..L...lLl...L...", "...L..lLl..L....", "....l.lll.l.....", ".....lllll......"],
    ["", "", "", "......L..L......", ".....LL..LL.....", "..L..lL..Ll..L..", "..LL.lL..Ll.LL..", "...Ll.l..l.lL...", "...l..lL.l..l...", "..Ll..l.Ll..lL..", "...l.l..l.l.l...", "....ll..l..ll...", ".....l.lll.l....", "......lllll....."],
    ["", "....y.....y.....", "...yYy...yYy....", "...yYy.y.yYy.y..", "..y.Y.yYy.Y.yYy.", "..yYy.yYy.l.yYy.", "..yYy..Y..l..Y..", "...Y.l.l.l.l.l..", "...l..lL.l..l...", "..Ll..l.Ll..lL..", "...l.l..l.l.l...", "....ll..l..ll...", ".....l.lll.l....", "......lllll....."],
  ];
  const CRATE = ["", "", ".kkkkkkkkkkkkkk.", ".kFFFFFFFFFFFFk.", ".kffffffffffffk.", ".kFFFFFFFFFFFFk.", ".kkkkkkkkkkkkkk.", ".kffkffffffkffk.", ".kffkffffffkffk.", ".kFFkFFFFFFkFFk.", ".kffkffyyffkffk.", ".kffkfyYYyfkffk.", ".kFFkFFFFFFkFFk.", ".kkkkkkkkkkkkkk.", "..k..........k.."];
  const SPRINKLER = ["", "", "", "", "", "", ".......kk.......", "......kWWk......", ".....kWrWWk.....", "....kuuuuuuk....", "....kUUUUUUk....", ".....kkkkkk....."];
  const SACK = ["", "", "", "", ".....kk.kk......", "......kkk.......", ".....kfffk......", "....kfffffk.....", "...kfffFfffk....", "...kffFFFffk....", "...kfffffffk....", "....kkkkkkk....."];

  // ---------- ground tiles (procedural dither, seeded so they never flicker) ----------
  function tile(base, specks, sd) { seed = sd; const c = canvas(T, T), x = c.getContext("2d"); x.fillStyle = base; x.fillRect(0, 0, T, T);
    specks.forEach(([col, n, w, h]) => { x.fillStyle = col; for (let i = 0; i < n; i++) x.fillRect(Math.floor(rnd() * T), Math.floor(rnd() * T), w || 1, h || 1); }); return c; }
  const TILES = {};
  function build() {
    TILES.grass = [0, 1, 2, 3].map(i => tile(P.g, [[P.G, 10, 1, 2], [P.h, 7, 1, 1]], 11 + i));
    TILES.flower = [["p"], ["q"], ["b"]].map(([c], i) => { const t = tile(P.g, [[P.G, 8, 1, 2]], 40 + i), x = t.getContext("2d"); x.fillStyle = P[c]; [[4, 5], [10, 9], [6, 12]].forEach(([a, b]) => { x.fillRect(a, b, 2, 2); x.fillStyle = P.q; x.fillRect(a, b, 1, 1); x.fillStyle = P[c]; }); return t; });
    TILES.path = [0, 1].map(i => tile(P.d, [[P.D, 14, 2, 1], ["#e6c48e", 6, 1, 1]], 21 + i));
    TILES.cobble = [0, 1].map(i => { const t = tile("#b8aa90", [], 30 + i), x = t.getContext("2d"); // irregular flagstones
      const L = i ? [[0, 0, 7, 6], [8, 0, 8, 4], [8, 5, 5, 5], [0, 7, 7, 5], [14, 5, 2, 5], [0, 13, 9, 3], [10, 11, 6, 5]] : [[0, 0, 5, 5], [6, 0, 10, 6], [0, 6, 8, 5], [9, 7, 7, 4], [0, 12, 6, 4], [7, 12, 9, 4]];
      L.forEach(([a, b, w, h], k) => { x.fillStyle = k % 2 ? "#cdc1a8" : "#c6b99f"; x.fillRect(a, b, w, h); x.fillStyle = "#d8cdb6"; x.fillRect(a, b, w, 1); }); return t; });
    TILES.soil = tile(P.s, [[P.S, 18, 3, 1]], 51); TILES.wet = tile(P.m, [[P.M, 18, 3, 1], ["#6a4a30", 4, 1, 1]], 52);
    TILES.water = [0, 1].map(i => { const t = tile(P.w, [], 60), x = t.getContext("2d"); x.fillStyle = P.W; for (let j = 0; j < 4; j++) x.fillRect((j * 5 + i * 3) % 14, j * 4 + 2, 3, 1); return t; });
    TILES.fence = (() => { const c = canvas(T, T), x = c.getContext("2d"); x.fillStyle = P.F; x.fillRect(0, 6, 16, 2); x.fillRect(0, 11, 16, 2); x.fillStyle = P.f; x.fillRect(2, 3, 3, 12); x.fillRect(11, 3, 3, 12); x.fillStyle = P.k; x.fillRect(2, 14, 3, 1); x.fillRect(11, 14, 3, 1); return c; })();
    Object.keys(PEOPLE).forEach(k => ART.people[k] = person(PEOPLE[k]));
    // WS3: Crane carries a brown ledger under one arm (drawn onto his sprite frames: front/back at the right hip, sides in front)
    ["down", "up", "left", "right"].forEach(d => ART.people.crane[d].forEach((c, i) => { const x = c.getContext("2d"), side = d === "left" || d === "right"; x.fillStyle = P.k; x.fillRect(side ? 5 : 10, 10, 5, 7); x.fillStyle = "#8a4b3a"; x.fillRect(side ? 6 : 11, 11, 3, 5); x.fillStyle = "#e8d8a8"; x.fillRect(side ? 6 : 11, 11, 3, 1); }));
    // WS6: Corvin Vane carries his office on him: a feathered cap, a gold chain with a seal across the coat, a rolled order under the arm
    ["down", "up", "left", "right"].forEach(d => ART.people.corvin[d].forEach(c => { const x = c.getContext("2d"), side = d === "left" || d === "right";
      x.fillStyle = P.k; x.fillRect(3, 1, 10, 3); x.fillStyle = "#2a2440"; x.fillRect(4, 1, 8, 2); x.fillStyle = P.Y; x.fillRect(4, 3, 8, 1); x.fillStyle = "#d9534f"; x.fillRect(side ? 3 : 11, 0, 2, 3); // cap, gold band, red feather
      if (d !== "up") { x.fillStyle = P.y; x.fillRect(side ? 6 : 5, 10, side ? 3 : 6, 1); x.fillStyle = P.Y; x.fillRect(7, 11, 2, 2); x.fillStyle = "#9b2335"; x.fillRect(7, 12, 2, 1); } // chain + wax seal
      x.fillStyle = "#f4ead0"; x.fillRect(side ? 5 : 11, 9, 2, 6); x.fillStyle = P.k; x.fillRect(side ? 5 : 11, 9, 2, 1); })); // the rolled order
    ART.people.duke = ART.people.corvin;
    ART.chest = sprite(CHEST);
    ART.crops = CROPS.map(r => sprite(r)); ART.crate = sprite(CRATE); ART.sprinkler = sprite(SPRINKLER); ART.sack = sprite(SACK);
    ART.tree = [0, 1, 2].map(i => tree(70 + i)); ART.bush = bush(90);
  }
  function tree(sd) { seed = sd; const c = canvas(32, 44), x = c.getContext("2d");
    x.fillStyle = "rgba(0,0,0,.18)"; x.beginPath(); x.ellipse(16, 41, 11, 3, 0, 0, 7); x.fill();
    x.fillStyle = "#6b4526"; x.fillRect(13, 26, 6, 15); x.fillStyle = "#553619"; x.fillRect(13, 26, 2, 15);
    const blob = (cx, cy, r, col) => { x.fillStyle = col; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + rnd() * 4) x.fillRect(cx + i, cy + j, 1, 1); };
    blob(16, 17, 13, "#2f6b2a"); blob(14, 14, 11, "#3f8a34"); blob(12, 11, 7, "#5aa845"); blob(20, 9, 4, "#5aa845");
    x.fillStyle = "#79c35a"; for (let i = 0; i < 18; i++) x.fillRect(6 + Math.floor(rnd() * 16), 4 + Math.floor(rnd() * 14), 1, 1); return c; }
  function bush(sd) { seed = sd; const c = canvas(16, 16), x = c.getContext("2d"); x.fillStyle = "rgba(0,0,0,.15)"; x.fillRect(2, 13, 12, 2);
    for (let j = -6; j <= 6; j++) for (let i = -7; i <= 7; i++) if (i * i / 49 + j * j / 36 <= 1 + rnd() * .2) { x.fillStyle = j < -2 ? "#5aa845" : "#3f8a34"; x.fillRect(8 + i, 8 + j, 1, 1); }
    x.fillStyle = P.p; x.fillRect(5, 6, 1, 1); x.fillRect(10, 9, 1, 1); return c; }
  // ---------- buildings (procedural): roof with shingles, plank walls, lit windows, door, sign ----------
  function building(w, h, o) { // w,h in tiles; o: {roof, roofD, wall, wallD, sign, chimney}
    const W = w * T, H = h * T, c = canvas(W, H + 4), x = c.getContext("2d"), roofH = Math.floor(H * .5);
    x.fillStyle = "rgba(0,0,0,.2)"; x.fillRect(4, H - 2, W - 4, 5);
    x.fillStyle = o.wall; x.fillRect(4, roofH - 4, W - 8, H - roofH + 2);
    x.fillStyle = o.wallD; for (let i = 8; i < W - 8; i += 6) x.fillRect(i, roofH, 1, H - roofH - 2);
    x.fillStyle = P.k; x.fillRect(4, H - 2, W - 8, 1); x.fillRect(4, roofH - 4, 1, H - roofH + 2); x.fillRect(W - 5, roofH - 4, 1, H - roofH + 2);
    if (o.chimney) { x.fillStyle = "#8a4b3a"; x.fillRect(W - 22, 0, 8, 12); x.fillStyle = P.k; x.fillRect(W - 22, 0, 8, 1); }
    for (let j = 0; j < roofH; j++) { const inset = Math.max(0, 10 - j); x.fillStyle = j % 5 === 4 ? o.roofD : o.roof; x.fillRect(inset, j + 2, W - inset * 2, 1); }
    x.fillStyle = o.roofD; for (let j = 6; j < roofH; j += 5) for (let i = 6 + (j % 10 ? 4 : 0); i < W - 6; i += 8) x.fillRect(i, j, 1, 4);
    x.fillStyle = P.k; x.fillRect(0, roofH + 1, W, 1);
    const dx = Math.floor(w / 2) * T; // the door sits on the tile at x + floor(w/2)
    x.fillStyle = "#5a3620"; x.fillRect(dx + 3, H - 16, 10, 14); x.fillStyle = "#74492b"; x.fillRect(dx + 4, H - 15, 8, 13); x.fillStyle = P.y; x.fillRect(dx + 10, H - 9, 1, 2);
    x.fillStyle = P.k; x.strokeStyle = P.k;
    [[dx - 18, H - 17], [dx + 22, H - 17]].forEach(([wx, wy]) => { if (wx < 8 || wx > W - 18) return; x.fillStyle = P.k; x.fillRect(wx - 1, wy - 1, 12, 10); x.fillStyle = "#ffd98a"; x.fillRect(wx, wy, 10, 8); x.fillStyle = "#f2b75a"; x.fillRect(wx, wy + 4, 10, 4); x.fillStyle = P.k; x.fillRect(wx + 5, wy, 1, 8); x.fillRect(wx, wy + 4, 10, 1); });
    if (o.sign) { x.fillStyle = P.F; x.fillRect(dx - 2, roofH + 3, 20, 10); x.fillStyle = P.f; x.fillRect(dx - 1, roofH + 4, 18, 8); o.sign(x, dx + 8, roofH + 8); }
    return c;
  }
  const SIGNS = {
    bread: (x, cx, cy) => { x.fillStyle = "#c98a3a"; x.fillRect(cx - 5, cy - 2, 10, 4); x.fillStyle = "#e8b45a"; x.fillRect(cx - 4, cy - 2, 8, 2); },
    sack: (x, cx, cy) => { x.fillStyle = "#f2efe6"; x.fillRect(cx - 3, cy - 3, 6, 6); x.fillStyle = P.k; x.fillRect(cx - 1, cy - 4, 2, 1); },
    seed: (x, cx, cy) => { x.fillStyle = P.l; x.fillRect(cx - 1, cy - 3, 2, 6); x.fillStyle = P.L; x.fillRect(cx - 4, cy - 2, 3, 2); x.fillRect(cx + 1, cy - 1, 3, 2); },
    coin: (x, cx, cy) => { x.fillStyle = P.Y; x.fillRect(cx - 3, cy - 3, 6, 6); x.fillStyle = P.y; x.fillRect(cx - 2, cy - 2, 4, 4); x.fillStyle = P.Y; x.fillRect(cx - 1, cy - 1, 2, 2); },
    scroll: (x, cx, cy) => { x.fillStyle = "#f4ead0"; x.fillRect(cx - 4, cy - 3, 8, 6); x.fillStyle = "#9b2335"; x.fillRect(cx - 1, cy + 1, 2, 2); x.fillStyle = P.k; x.fillRect(cx - 3, cy - 1, 6, 1); },
  };
  const ART = { T, P, people: {}, sprite, building, SIGNS, build, get TILES() { return TILES; } };
  root.Art = ART;
})(window);
