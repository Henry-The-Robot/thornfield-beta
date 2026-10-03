// Takes every WS6 screenshot into _build-shots/v0.4-story/ with headless Chrome. Run: node _build-shots/shoot-ws6.js [only-this-shot]
const cp = require("child_process"), fs = require("fs"), path = require("path");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe", root = path.resolve(__dirname, ".."), out = path.join(__dirname, "v0.4-story");
fs.mkdirSync(out, { recursive: true });
const url = p => "file:///" + root.replace(/\\/g, "/") + "/" + p;
const shots = [
  ...["week1", "week2", "week3", "week4", "offer", "desk", "corvin", "tied", "page", "tvm", "cashbook"].map(n => [n, `_build-shots/ws6-shots.html?shot=${n}`, 9000, "1280,800"]),
  ...["sold", "seized", "bridged", "free"].map(n => ["ending-" + n, `game.html?fast=1&new=1&seed=3&touch=0&ending=${n}`, 4000, "1280,800"]),
  ["case-board", "tests/smoke-story.html?shotAfter=case", 400000, "1280,860"],
];
const only = process.argv[2];
for (const [name, page, budget, size] of shots) {
  if (only && only !== name) continue;
  const file = path.join(out, name + ".png");
  const r = cp.spawnSync(CHROME, ["--headless", "--disable-gpu", "--allow-file-access-from-files", "--window-size=" + size, "--virtual-time-budget=" + budget, "--screenshot=" + file, url(page)], { encoding: "utf8", timeout: 400000 });
  console.log(name, fs.existsSync(file) ? "ok " + fs.statSync(file).size + " bytes" : "MISSING " + (r.stderr || "").slice(0, 200));
}
