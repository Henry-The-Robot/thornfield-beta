// Day-loop report (work order item 7): for each day of Spring, what choice and what surprise or set piece is on offer. Shared by tests/test-dayloop.js (node) and tests/day-loop.html (browser).
// A CHOICE is a decision with stakes (an order to take or haggle, a notice, a standing order, a Market Day, a visitor's deal, a scene's choice, the Court).
// A SURPRISE / SET PIECE is something the player did not schedule (a night event, a visitor, the steward, a scene, the fair, a week card, a story beat).
(function (root) {
  function dayLoop(S, extra, seed) {
    extra = extra || {}; const s = S.newGame({ story: true, seed }), ev = s.events || {}, R = S.R, rows = [];
    const evDay = k => +Object.keys(ev).find(d => ev[d] === k);
    const pig = evDay("pigs"), rat = evDay("rats"), frost = evDay("frost"), pell = [pig - 4, pig - 1], ped = [rat - 3, rat], weekStart = [1, 8, 15, 22], fairs = (extra.Market && extra.Market.FAIR_DAYS) || [7, 14, 21], NOTICE = S.NOTICE_DAYS || { 2: "tinker", 6: "trader", 12: "hands" };
    for (let d = 1; d <= 28; d++) {
      const c = [], z = []; s.day = d;
      // choices
      S.OFFERS.filter(o => o[0] === d && !(o[1] === "duke")).forEach(o => c.push("order from " + o[1])); (R.deposits || []).filter(r => r[0] === d).forEach(r => { c.push("deposit order from " + r[1]); z.push("a customer pays up front"); });
      (R.corvin || []).filter(o => o.day === d).forEach(() => { c.push("Corvin's order: take, halve or decline"); z.push("Corvin Vane brings an order"); });
      if (NOTICE[d]) { c.push("notice board: " + NOTICE[d]); z.push("a notice on the board: " + NOTICE[d]); }
      if (frost && d === frost - 1) { c.push("the frost almanac: cover or risk"); z.push("the almanac's 1 in 3"); }
      if (d >= pell[0] && d <= pell[1]) c.push("Pell's deal (a window)"); if (d === pell[0]) z.push("Pell the pig farmer arrives");
      if (d >= ped[0] && d <= ped[1]) c.push("Barnaby's rat poison (a window)"); if (d === ped[0]) z.push("Barnaby the pedlar arrives");
      if (extra.Standing) { s.day = d; if (extra.Standing.today(s).length) c.push("standing orders on the board"); }
      if (fairs.indexOf(d) >= 0) { c.push("Market Day: set your own prices"); z.push("Market Day"); }
      // a scene is on offer from its first day until its last (or, with no last day, for three days); it is a surprise on the day it first appears
      if (extra.Scenes) extra.Scenes.SC.forEach(sc => { if (d >= sc.from && d <= (sc.to != null ? sc.to : sc.from + 2)) { c.push("scene: " + sc.id); if (d === sc.from) z.push("village scene: " + sc.id); } });
      if (d === 1) { c.push("Crane's offer: sell or stay"); z.push("Crane carries Vane's offer"); }
      if (d === 28) { c.push("the Reeve's Court"); z.push("the Reeve's Court"); }
      // surprises
      if (R.rain.indexOf(d) >= 0) z.push("rain: no watering today"); if (ev[d]) z.push("night event: " + ev[d]); if (ev[d + 1] && d >= 2) z.push("warning: " + ev[d + 1] + " tomorrow night");
      if (weekStart.indexOf(d) >= 0) z.push("week card " + (weekStart.indexOf(d) + 1)); if (d % 7 === 0 && d < 28) z.push("wages day"); if (d === 12) z.push("Edric's page (the midpoint)");
      if (d === 7) z.push("wages day: the first hands walk-off risk");
      rows.push({ day: d, choices: c, surprises: z });
    }
    return rows;
  }
  root.DayLoop = { dayLoop };
  if (typeof module !== "undefined") module.exports = root.DayLoop;
})(typeof window !== "undefined" ? window : globalThis);
