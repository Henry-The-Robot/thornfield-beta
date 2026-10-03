// Runs one tests/*.html page in a REAL-TIME headless Chromium (Playwright) and prints its RESULTS. Needed for pages that render audio (tests/audio.html), because the
// --virtual-time-budget runs used for the other pages never advances an OfflineAudioContext. Run: node tests/run-html.js tests/audio.html [timeoutMs]
const { chromium } = require("playwright");
(async () => {
  const path = require("path"), [file, wait] = [path.resolve(process.argv[2]), +(process.argv[3] || 60000)]; const exe = process.env.CHROMIUM_PATH || undefined;
  const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox", "--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"] });
  const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + file); const t0 = Date.now();
  while (Date.now() - t0 < wait) { const txt = await p.evaluate(() => document.getElementById("out").textContent); if (txt !== "running") { console.log(txt); break; } await p.waitForTimeout(500); }
  if (Date.now() - t0 >= wait) console.log("TIMEOUT", await p.evaluate(() => document.getElementById("out").textContent));
  if (errs.length) console.log("page errors:", errs.slice(0, 5)); await b.close();
})();
