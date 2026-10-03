// The opening's script and timeline are data: check them before anything is drawn. Run: node tests/test-intro.js
global.window = global; require("../intro.js"); const I = window.Intro;
let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
const L = I.SCRIPT, sent = x => x.split(/(?<=[.?!])\s+(?=[A-Z"'])/).filter(Boolean).length;
ok(L.length === 11 && new Set(L.map(l => l.id)).size === L.length && L.every(l => /^i\d\d$/.test(l.id)), "11 lines with unique ids (i01-i11): the file names a voice would be saved as");
ok(L.every(l => l.text && l.who && l.dir && l.dur > 0), "every line has the words, a speaker, a delivery note and a maximum length");
ok(L.every(l => sent(l.text) <= 2 && l.text.length <= 110), "each line is at most two sentences and 110 characters, short enough to voice without rushing");
ok(L.every((l, i) => !i || L[i - 1].at + L[i - 1].dur <= l.at + .001), "lines never overlap");
ok(L.every(l => l.at >= I.STARTS[l.shot] && l.at + l.dur <= I.STARTS[l.shot] + I.SHOTS[l.shot].dur + .3), "every line sits inside the shot it belongs to");
ok(L.every(l => l.text.length / l.dur <= 21), "reading speed is comfortable (at most 21 characters a second)");
ok(I.TOTAL > 60 && I.TOTAL < 90, `the opening runs ${I.TOTAL.toFixed(1)} seconds`);
ok(I.SHOTS.every(s => s.cues.every(([t, n]) => t >= 0 && t <= s.dur && typeof n === "string") && s.mood), "every sound cue falls inside its shot and every shot names a piece of the score");
const m = I.manifest(); ok(m.length === L.length && m.every(r => /\.mp3$/.test(r.file) && r.text && r.maxSeconds > 0), "the manifest for a voice service lists id, speaker, words, direction and the clip length it must fit");
const q = s => new URLSearchParams(s); ok(I.wanted(q("")) && I.wanted(q("?intro=1&new=1")) && !I.wanted(q("?intro=0")) && !I.wanted(q("?fast=1")) && !I.wanted(q("?sandbox")) && !I.wanted(q("?new=1")), "a new story game opens with it; sandbox, fast and test runs don't; ?intro=1 forces it");
process.exit(fail ? 1 : 0);
