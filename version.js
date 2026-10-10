// The one place the game's version lives. Bump it with `node tools/stamp.js <new version>` (see tools/stamp.js); never edit the ?v= tags by hand.
// Loaded first by game.html, so the game can read window.LC_VERSION (progress report, bug reports); node tools and tests require() it.
(function (root) { const v = "0.4.11"; root.LC_VERSION = v; if (typeof module !== "undefined") module.exports = v; })(typeof window !== "undefined" ? window : globalThis);
