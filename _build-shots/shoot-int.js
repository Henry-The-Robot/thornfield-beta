// Takes the v0.4 integration screenshots (1194x834) into _build-shots/v0.4-int/ with headless Chrome. Run: node _build-shots/shoot-int.js [only-this-shot]
const cp = require("child_process"), fs = require("fs"), path = require("path");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe", root = path.resolve(__dirname, ".."), out = path.join(__dirname, "v0.4-int");
fs.mkdirSync(out, { recursive: true });
const url = p => "file:///" + root.replace(/\\/g, "/") + "/" + p;
const shots = [
  ["01-day1-offer", "_build-shots/int-shots.html?shot=offer", 12000],
  ["02-week-card", "_build-shots/int-shots.html?shot=week", 12000],
  ["03-village-scene", "_build-shots/int-shots.html?shot=village", 12000],
  ["04-market-day", "tests/shot-market.html?scene=afternoon", 20000],
  ["05-practice-problem", "_build-shots/int-shots.html?shot=practice", 12000],
  ["06-case-board", "_build-shots/int-shots.html?shot=casebd", 20000],
  ["07-pause-menu", "_build-shots/int-shots.html?shot=pause", 12000],
];
const only = process.argv[2];
for (const [name, page, budget] of shots) {
  if (only && only !== name) continue;
  const file = path.join(out, name + ".png");
  const r = cp.spawnSync(CHROME, ["--headless", "--disable-gpu", "--allow-file-access-from-files", "--window-size=1194,834", "--virtual-time-budget=" + budget, "--screenshot=" + file, url(page)], { encoding: "utf8", timeout: 200000 });
  console.log(name, fs.existsSync(file) ? "ok " + fs.statSync(file).size + " bytes" : "MISSING " + (r.stderr || "").slice(0, 200));
}
