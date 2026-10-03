// Prints the opening's script for a text-to-speech service. Usage: node tools/intro-script.js [json|csv|txt]
// Each line: id (the file name to produce, <id>.mp3), the speaker, the words, a delivery note, and the longest the clip may run so it fits the animation.
global.window = global; require("../intro.js"); const fmt = process.argv[2] || "json", rows = window.Intro.manifest();
if (fmt === "csv") { console.log("id,speaker,start_s,max_seconds,direction,text"); rows.forEach(r => console.log([r.id, r.speaker, r.start, r.maxSeconds, JSON.stringify(r.direction), JSON.stringify(r.text)].join(","))); }
else if (fmt === "txt") rows.forEach(r => console.log(`[${r.id}] ${r.speaker} (${r.direction}; at most ${r.maxSeconds}s)\n${r.text}\n`));
else console.log(JSON.stringify({ title: "Ledger & Crown: the opening", totalSeconds: window.Intro.TOTAL, lines: rows }, null, 2));
