// Ledger & Crown — the cast. Who these people are, how they talk, what they're hiding, and what they'll tell you once you've earned it.
// Pure data plus two small functions; game.js asks Cast.greet(who, state) when you walk up to someone with no business to do, and Cast.topics(who, state) for the
// "Ask about..." choices (some are locked until you're trusted, or until the story has reached them). Nothing here changes the books.
// House rule for every line: a person says it, not a textbook. Short sentences, one idea a breath, a verbal habit each reader can hear.
window.Cast = (function () {
  const WHO = {
    maud: {
      name: "Maud Fenwick, the reeve", look: "Grey braid, green wool, a wooden abacus she keeps on the desk and never touches.",
      habit: "Answers a question with a question. Never says 'good'; says 'That's not wrong.'", mantra: "Profit is an opinion. Cash is a fact.",
      voice: "dry, exact, kind underneath",
      greet: ["Mm. Count it again.", "You look like a person with a question. Ask it better.", "Cash first. Then opinions.", "I'm not here to be thanked. I'm here to be right.", "Do you know what's in the chest? Not what you hope. What's in it.",
        "The Ledger flatters. The chest does not."],
      low: ["You're thin on Cash. Don't tell me it's fine. Tell me what's due on the seventh.", "A short chest and a long list. I've seen that picture before."],
      rich: ["A fat chest. Whose Cash is it, really? Anything you owe come due before Midwinter?"], rain: ["Rain. Good for the crops, bad for everyone's temper. Mind the ledger anyway."],
      topics: [
        { id: "abacus", label: "Ask about the abacus", lines: ["That? Oh, it's accurate. Beautifully accurate. It's the only honest instrument in Thornfield.", "I don't use it. It lies slowly. Your uncle used to say a ledger lies quickly and an abacus lies slowly. He was never certain which he preferred."] },
        { id: "edric", label: "Ask what Edric was like", need: { trust: 3 }, lines: ["Edric? He was the most generous man I ever argued with.", "He'd give you the coat off his back and then forget he'd done it. Then he'd wonder why he was cold. I told him a hundred times: a farm is not a charity.", "He nodded every time. And the next week he'd give away something else."] },
        { id: "why", label: "Ask why she's helping you", need: { trust: 5 }, lines: ["Because I was his friend. Because someone should have stopped him. Because I was somewhere else when it mattered.", "That's three reasons. Pick the one that lets you sleep."] },
        { id: "mantra", label: "Ask what she believes about money", need: { trust: 2 }, lines: ["Profit is an opinion. Cash is a fact.", "The Ledger tells you what you think you earned. The chest tells you what you can pay on the seventh. Only one of those feeds the hands."] },
      ],
    },
    crane: {
      name: "Bailiff Crane", look: "Black coat, a ledger under one arm, pen behind each ear in case one fails.",
      habit: "Numbers his sentences. Counts everything twice. Is polite in the way a locked door is polite.", mantra: "Everything is somebody's.",
      voice: "formal, pedantic, accidentally funny",
      greet: ["Item: you are standing in my light. Item: I do not mind. Carry on.", "I am not following you. I am merely going where you are, shortly after.", "Everything is somebody's, heir. Including that fence.",
        "For the record, I counted your sacks. Fifteen. Then again. Still fifteen."],
      low: ["Your chest is light. That is not a threat. I am only observing it, twice."], rich: ["Your chest is heavy. I note it. I do not comment. I comment a little."], rain: ["Rain. Item: it is wetter than yesterday."],
      topics: [
        { id: "job", label: "Ask what a bailiff does", lines: ["I count what is owed and what is owned, and I write down the difference without opinion. The difference is the only part anyone argues about.", "I'm told it is a lonely profession. I have never had time to check."] },
        { id: "clerk", label: "Ask where he worked before", need: { trust: 4 }, lines: ["The Duke's counting-house. Eleven years. I was a good clerk.", "Then one winter I noticed that two columns which ought to agree did not. I mentioned it. Once. In writing.", "I was transferred. To the bailiffs. It is considered a promotion. It is not."] },
        { id: "edric", label: "Ask what he thought of Edric", need: { trust: 5 }, lines: ["He was the only farmer who ever offered me a chair.", "He kept dreadful books and a clear conscience. I would have traded him the second for the first."] },
      ],
    },
    ashby: {
      name: "Widow Ashby", look: "Flour to the elbows, a ring on a ribbon round her neck, forearms like a blacksmith.",
      habit: "Talks in dough: proving, kneading, rising. Calls everyone 'dear'. Takes cash on the nail and nothing else.", mantra: "Cash on the nail, dear. Or no bread.",
      voice: "warm, brisk, with a blade in it",
      greet: ["Good grain makes good bread, dear. Mind the flour.", "The ovens don't wait and neither do I.", "You'll want to hear it from someone: your uncle would have haggled worse and smiled more.", "Butter doesn't spread itself. Neither do orders.",
        "Cash on the nail. It's the only thing that rises on its own."],
      low: ["Thin pockets, dear? Eat something. A hungry farmer makes poor bargains."], rich: ["Well! Somebody's loaf is proving."], rain: ["Wet flour is a misery. Wet customers are worse."],
      topics: [
        { id: "cash", label: "Ask why she only takes Cash", lines: ["Because a promise doesn't heat an oven.", "My Bram baked for the whole valley, on a nod and a handshake. 'Pay you Friday, Bram.' Forty friends, forty Fridays.", "When he died, the ledger said we were rich. The cupboard said otherwise. So: Cash on the nail."] },
        { id: "bram", label: "Ask about Bram", need: { trust: 4 }, lines: ["Bram was a loud man and a gentle one. Sang when he kneaded. Gave away the heels of every loaf to the children.", "He'd have liked you. He liked anyone who showed up before sunrise."] },
        { id: "edric", label: "Ask what she owed Edric", need: { trust: 6, flag: "ashbyAsked" }, lines: ["...Ask me another day, dear. Not with flour on my hands."] },
      ],
    },
    hobb: {
      name: "Hobb the Miller", look: "Broad as a door, dusted white, his big hands always doing something small.",
      habit: "Talks slowly, with a pause before anything that matters. Says 'Eventually' about money and means it kindly.", mantra: "The river's slow. It gets there.",
      voice: "slow, deep, deadpan",
      greet: ["The wheel turns when there's grain... and not before.", "Weather's coming. Always is.", "I pay on terms... but I always pay. Eventually.", "Your uncle... stood where you're standing. Same worried look.",
        "Grain's good. Price is... a conversation."],
      low: ["You look tired. The mill... has a bench."], rich: ["Business is good. That frightens me a little."], rain: ["Rain. Good for the wheel. Bad for the road. Hm."],
      topics: [
        { id: "wheel", label: "Ask about the mill", lines: ["Forty years. Broke the wheel twice. Both times I borrowed.", "Both times I paid it back. Slowly. A mill is... a slow thing. So am I."] },
        { id: "terms", label: "Ask why he pays so late", need: { trust: 3 }, lines: ["I'm not late. I'm... on terms.", "The farmers who buy my flour pay me in fourteen days, if I'm lucky. So I pay you in fourteen days. If I paid you sooner, I'd be lending you my own money.", "Everyone's owed. Everyone owes. It's... a long chain. I'm somewhere in the middle."] },
        { id: "edric", label: "Ask about Edric", need: { trust: 5 }, lines: ["He once gave me a sack of grain and said it was a mistake. It wasn't a mistake.", "I never... told him I knew. That's one of the things I'd... do over."] },
      ],
    },
    tomas: {
      name: "Tomas the seed merchant", look: "Green waistcoat, orange hair, a smile like a shop-window.",
      habit: "Sells in superlatives. Interrupts himself with prices. Calls everyone 'my friend', including people he is about to overcharge.", mantra: "Credit is friendship, my friend. Friendship has terms.",
      voice: "bright, quick, breathless",
      greet: ["My friend! The finest seed in four valleys, and the only seed in this one!", "Come in, come in! Don't tell me what you can afford: tell me what you can grow!", "Twelve a packet, a bargain at twice the price, which I'm not charging, because I like you!",
        "Credit, my friend! The art of getting paid for waiting! I'm very good at it, ask anyone, don't ask Ezra."],
      low: ["Cash tight, my friend? I have terms! Wonderful terms! Fourteen days! Two percent off if you're quick! (I only say that because I like you.)"], rich: ["Look at that chest! Buy something! Anything! I'll find you something!"], rain: ["Rain! Wonderful for seed! Terrible for my hat!"],
      topics: [
        { id: "terms", label: "Ask about his terms", lines: ["Two-seven, net fourteen! Pay in seven days, two percent off. Pay in fourteen, full price. After that I tell people.", "It's very simple. The seed costs what it costs. Time costs a little extra, or a little less if you rush. Everyone pays for time, my friend. I just write it down."] },
        { id: "cousin", label: "Ask about his family", need: { trust: 4 }, lines: ["Cousin Wick. Lovely man. Terrible at paying. Terrible at saying so. Lost his farm to a man who asked very politely.", "I extend credit very carefully now. Very. Carefully. Which means rarely. Which is not what the sign says. Don't read the sign."] },
        { id: "vane", label: "Ask who else buys his seed", need: { trust: 5 }, lines: ["...Well. A man in a grey cloak wanted every contract I hold. Said he'd pay triple. Said it was 'consolidating'.", "I said no. Mostly. I said 'not today'. I'm a merchant, my friend. 'Never' is an expensive word."] },
      ],
    },
    ezra: {
      name: "Ezra the moneylender", look: "Plum-coloured coat, steepled fingers, a face you'd trust with a secret and a signature.",
      habit: "Speaks softly and exactly. Never raises his voice, his rate, or an eyebrow without telling you why.", mantra: "Patience has a price. I merely publish it.",
      voice: "quiet, courteous, unnervingly honest",
      greet: ["Good morning. You owe me nothing today. I mention it because it is rare.", "Come in. Sit. I won't charge for the chair.", "Interest is only the cost of someone else's patience. Remember that when you're the one waiting.",
        "I keep two ledgers. One is for money. The other is for how people behave when it runs out."],
      low: ["You are short. I can see it in how you stand. I can lend, if you'd like to be exact about how much."], rich: ["You've Cash to spare. Repay early? There is a fee. I regret the fee. I charge it anyway."], rain: ["Damp weather. Damp ink. I write carefully."],
      topics: [
        { id: "rate", label: "Ask how he sets his rate", lines: ["By how much I believe the person in front of me. Show me a forecast that holds, and I believe you more. Believing is cheaper than doubting.", "It isn't personal. It's only the price of my not knowing."] },
        { id: "edric", label: "Ask about Edric's loan", need: { trust: 4 }, lines: ["He never lied to me about a number. Not once. Only about himself.", "'I'm fine, Ezra.' Then he'd borrow a hundred. A man who is fine does not borrow a hundred on a Thursday."] },
        { id: "letter", label: "Ask if Edric left anything", need: { trust: 6 }, lines: ["He left a letter. Several. I have been waiting until you could read a balance sheet without flinching.", "Not yet. But close. I'll tell you when."] },
      ],
    },
    duke: {
      name: "Corvin Vane, the Duke's steward", look: "Grey cloak, a smile polished like a coin, gloves he never removes.",
      habit: "Speaks in opportunities. Says 'we' for things only he will own. Compliments you in a way that lands as a price.", mantra: "A farm that cannot grow is only waiting to be bought.",
      voice: "velvet, patient, faintly amused",
      greet: ["Heir. Ambition suits you. It will suit His Grace better.", "I only want what's best for Thornfield. Which is, conveniently, what's best for the Duke.", "Think of a larger field. Now think who could fund it. We should speak.",
        "Small farms are charming. Like small dogs. Briefly."],
      low: ["Your chest is light. How unfortunate. We could discuss something larger, with less to carry."], rich: ["Prosperous! How very temporary."], rain: ["Rain. It falls on everyone. Eventually it falls on the people who owe."],
      topics: [
        { id: "grow", label: "Ask why the Duke wants so much grain", lines: ["A great house eats. A great house also pays, in time. I take the long view. It is a very long view. Longer than any one harvest.", "You may take the shorter one, if you prefer."] },
        { id: "edric", label: "Ask what he thought of Edric", need: { trust: 3 }, lines: ["A good man. A *remarkably* good man. It's a rare quality in a farmer and a fatal one in a debtor.", "I wept at his funeral. Discreetly. I have excellent control."] },
      ],
    },
    pell: { name: "Pell the pig farmer", look: "Mud to the knees, a hat older than the pigs, a bucket he never puts down.", habit: "Talks to his pigs mid-sentence. Blunt, funny, quick to forgive.", mantra: "A pig's a pig. A neighbour's a neighbour.", voice: "gruff, warm",
      greet: ["Not you, Duchess. Morning, neighbour.", "Pigs are cheaper than people and twice as honest. Mostly.", "Don't mind the smell. It's the smell of a living."], low: ["Short? Aye. Me too. We'll live."], rich: ["Fat chest! Don't let the pigs see."], rain: ["Wet pigs. Wet farmer. Wet everything."],
      topics: [{ id: "pigs", label: "Ask about the pigs", lines: ["Eleven of them. Duchess is the clever one. She's escaped four times and always comes home for supper.", "Pigs don't want to wreck your field, neighbour. They want to find out what's growing in it."] }] },
    pedlar: { name: "Barnaby the pedlar", look: "A coat of many pockets, a smile with one gold tooth, a pack of everything.", habit: "Says the price last and the warning never.", mantra: "Free advice! Poison extra.", voice: "cheerful, wheedling",
      greet: ["Pins, pans, poisons, proverbs! All sizes!", "I sell what people need. Sometimes before they know.", "Free advice: don't trust a man selling free advice."], low: ["Short on coin? Short on rats? I can fix one."], rich: ["A buyer! I felt it in my pockets."], rain: ["Wet road, dry pedlar. I've an umbrella. It's for sale."],
      topics: [{ id: "road", label: "Ask what he's heard on the road", lines: ["Heard a steward in a grey cloak's been buying paper in every village from here to the river. Not grain. Paper. Notes. Mortgages. Promises.", "Odd thing to buy. Unless you mean to call them in."] }] },
    mira: { name: "Mira, a travelling baker", look: "Yellow shawl, flour in her hair, a stall that folds into a cart.", habit: "Gossips in whispers at full volume. Everything is 'between us and the cabbages'.", mantra: "Everybody pays somebody.", voice: "quick, conspiratorial",
      greet: ["Between us and the cabbages, the Duke's steward is buying everything that isn't nailed down.", "Six sacks, Cash, today. Don't tell Ashby I'm cheaper.", "I hear everything. It's the only thing I'm paid for."], low: ["Cash tight? I buy cheap and I buy now. Terms are for people who can wait."], rich: ["You look fat. Buy a pie."], rain: ["Rain. Customers evaporate."],
      topics: [{ id: "rumour", label: "Ask what she's heard", lines: ["The steward's agents have been through six villages. Hobb's mill loan, a bakery guarantee, a dozen small notes. All bought up. All at a discount, from the Crown, that was glad to be rid of them.", "A man doesn't buy that much paper to be kind. He buys it to be paid. Or to be owed. Which is better, depends on who owes."] }] },
    abbey: { name: "Brother Anselm", look: "A brown habit and a very small abacus he keeps in his sleeve.", habit: "Counts bells. Checks everything twice, 'because God checks once and I'd like to be sure'.", mantra: "Check it twice.", voice: "gentle, patient",
      greet: ["Peace to you. And receipts.", "Pays a week after delivery, and I'll write the day on the receipt. A day written down is a day remembered.", "I check my sums twice. God checks them once. I should like to be sure."], low: ["Short, friend? We keep a loaf for the hungry. And a ledger for the rest."], rich: ["God is generous. The abbot is more so, on Tuesdays."], rain: ["Rain. The bells sound wetter."],
      topics: [{ id: "books", label: "Ask how the Abbey keeps its books", lines: ["Two brothers keep them, and neither knows what the other wrote. At the end of the month we compare. When they disagree, we find the mistake. When they agree, we are suspicious.", "It's a very holy way to be doubtful."] }] },
  };
  const hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  // a line for walking up to someone with no business to do: the weather and the chest first, then something from their pool that wasn't just said
  function greet(who, s) {
    const c = WHO[who]; if (!c) return "..."; s.said = s.said || {};
    const cash = s.bal.cash, rain = Spring.rain(s.day), tag = s.said[who + ":tag"];
    const ctx = rain && c.rain && tag !== "rain" ? ["rain", c.rain] : cash < 70 && c.low && tag !== "low" ? ["low", c.low] : cash > 450 && c.rich && tag !== "rich" ? ["rich", c.rich] : null;
    if (ctx && (s.day + hash(who)) % 3 === 0) { s.said[who + ":tag"] = ctx[0]; return ctx[1][(s.day + hash(who)) % ctx[1].length]; }
    s.said[who + ":tag"] = null; const pool = c.greet; let i = (s.day * 3 + hash(who)) % pool.length; if (s.said[who] === i) i = (i + 1) % pool.length; s.said[who] = i; return pool[i];
  }
  // the "Ask about..." choices available right now: some need trust (the hearts), a story flag, or a day
  function topics(who, s) {
    const c = WHO[who]; if (!c || !c.topics) return []; s.heard = s.heard || {};
    return c.topics.filter(t => { const n = t.need || {}; return (!n.trust || (s.trust[who] || 0) >= n.trust) && (!n.flag || (s.flags && s.flags[n.flag])) && (!n.day || s.day >= n.day); })
      .map(t => ({ id: t.id, label: t.label, lines: t.lines, heard: !!s.heard[who + ":" + t.id] }));
  }
  const locked = (who, s) => { const c = WHO[who]; if (!c || !c.topics) return 0; return c.topics.length - topics(who, s).length; };
  return { WHO, greet, topics, locked, name: id => WHO[id] ? WHO[id].name : id };
})();
