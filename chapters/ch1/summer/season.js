// Summer at Thornfield: the season's settings, as data (SM2). Same shape as chapters/ch1/spring/season.js; core/engine.js registers it as "ch1/summer".
// Summer starts from Spring's engine keys (prices, wages, loans, field) and overrides or adds what this season teaches. Design: chapters/ch1/summer/DESIGN.md.
// Every number below is [Guessing] until the Summer bot runs (SM-later cards) tune it; each line names the session it teaches. Wiki: docs/wiki/ch1/summer-settings.md.
(function (root) {
  const base = root.SpringSeason || require("../spring/season.js");
  const R = Object.assign({}, base, {
    days: 28, // four weeks (DESIGN.md section 4)
    // The King's order (SU1, C2.09 cash cycle days + C5.01 time value): the purveyor takes 120 sacks at a fixed price and pays with an Exchequer tally in 42 days.
    // The player cannot refuse the King. tallyDiscount is what Ezra takes per week to buy the tally early: 42 days = 6 weeks, so 6 x 3% off the face value.
    king: { sacks: 120, price: 10, tallyDays: 42, tallyDiscount: 0.03, dueIn: 14 },
    // Buyers' terms (SU2, C16.11 trade price for term): Ashby and Hobb each ask for 14 days. A swap of a shorter term for a small price cut gains for both sides.
    buyerTerms: { days: 14, termValuePct: 0.02, swapCutPct: 0.03 }, // termValuePct: what a week of credit is worth to a buyer; swapCutPct: the price cut a 7-day term can buy
    // Edric's water bill (SU3, C1.06 interest expense differs from the cash coupon): a bill left unpaid, with interest. Recording it restates the books.
    waterBill: { principal: 60, yearsUnpaid: 2, interestRate: 0.08, cashPaid: 0 }, // interest owed = principal x ((1 + rate)^years - 1)
    // The mill wing (SU5, C4.03 corrected): unit cost = (fixed + variable x volume) / volume, so scale pays only if sales follow. Break-even volume V solves
    // price x V - (fixedAfter + varAfter x V) = price x v0 - (fixedBefore + varBefore x v0) (55,882 in the session's units, not 61,800).
    millWing: { price: 17, before: { fixed: 500, varCost: 10, volume: 50 }, after: { fixed: 700, varCost: 8, volume: 100 } }, // session units 1:1000; before unit cost 20, after 15
    // The stall price test (SU5, C4.01 corrected): daily sales q = a - b x price. At the reference price 8 the elasticity is b x 8 / q = -1.09 (elastic), so a rise loses more volume than it gains.
    demand: { a: 92, b: 6, refPrice: 8, elasticity: -1.09, testDays: 6 }, // q(8) = 44; revenue peaks at a / (2b) = 7.67, below the old price
    // The shiny crop test plot (SU7, C3.09, C7.01, C14.06): one plot with a pass line written before the data shows. Odds of a good crop, and the seed it costs.
    testPlot: { plots: 1, goodOdds: 0.3, seedCost: 12, passLineMax: 3, allInPlots: 6 }, // odds [Guessing]; passLineMax = most failing results the player may accept
    // SU4 (C2.03 margin per scarce unit): orders per week compete for the same cart days. [week 1 day, buyer, sacks, price] are set by the Summer story card.
    scarce: { cartSlots: 3, weeks: 4 },
    // SU8 (C12.02, C12.09): the clerk's gift, and the banner deal with Ashby that carries a penalty clause.
    gift: { value: 15, fasterByDays: 14 }, banner: { sacks: 30, price: 11, penaltyPct: 0.2 },
  });
  root.SummerSeason = R;
  if (typeof module !== "undefined") module.exports = R;
})(typeof window !== "undefined" ? window : globalThis);
