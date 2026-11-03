# 世界遺産エステーツ — rules and sources

This is an original, unofficial world-travel property game, not the official MONOPOLY app. The UNESCO listing names identify destinations; no UNESCO endorsement or asset use is implied. All prices, ownership, building and rent mechanics are fictional game values, not real heritage valuation or permissions to develop protected places.

## Play

- 2–4 players, each starts with **€1500**. Pass or land on the departure square for **€200** (except detention transfer). All amounts are integer euros.
- Roll two dice, buy an unowned destination or send it to auction. Any non-eliminated player, including the decliner, may bid a whole euro above the current bid, up to available cash. Passing withdraws permanently from this auction. The last remaining highest bidder wins; all-pass leaves the lot at the bank. Highest bidder cannot withdraw. No auction timer.
- Pay rent automatically on another player's unmortgaged asset. Complete a color group to double its undeveloped base rent. A mortgaged member still counts toward ownership of a group/transport/utility portfolio but receives no rent itself.
- Build evenly across your complete, unmortgaged color group: 1–4 houses, then a hotel (level 5). Sell one level at half the build cost, evenly in reverse. Hotel sale returns to four houses.
- Mortgage an undeveloped asset for the listed mortgage value. For a color group, sell **all** its buildings first. Redeem for mortgage plus 10%, rounded up to the next euro. Asset actions are available only during your own turn, not during auctions. You can sell or mortgage while in debt, but cannot build/redeem.
- Stations charge €25 / €50 / €100 / €200 by count owned. Utilities charge 4× / 10× the landing roll total. Tax squares charge €200 and €100. Free parking has no jackpot.
- Doubles grant another roll after resolving the landing; three successive doubles send you directly to detention without collecting departure money.
- Detention: before rolling, pay €50 or use a held escape card. Otherwise roll to escape with doubles (no extra roll on this release). On the third unsuccessful attempt pay €50 and move by that already-rolled total. If insolvent, selling/mortgaging can resolve the fee and resume movement correctly. Ordinary visits to the detention square have no effect.
- Chance (旅のチャンス) and letters (旅の手紙) have separate original 12-card decks. Randomly select from remaining cards without replacement; refill after exhaustion, excluding held escape cards. Effects include income, payments, departure, detention, held escape, backward travel, nearest station / Paris travel, and building repairs. Each destination resolves purchase/rent/tax/cards normally; backward travel earns no departure income. Repairs charge each house separately and each hotel once, not five houses. Repair debt is fixed when drawn. Escape cards return to their source deck on use or bank bankruptcy; player bankruptcy transfers them to the creditor.
- Insufficient payment enters a debt phase. Sell buildings and mortgage assets; payment executes automatically once enough cash exists. Bankruptcy is allowed only when total realizable cash (cash + sale proceeds + available mortgages) is below the debt. Debt must be resolved before ending your turn.
- Bankruptcy to a player transfers remaining cash, escape cards and mortgaged/unmortgaged properties; buildings are liquidated to that creditor at half cost. Bankruptcy to the bank clears ownership and mortgages. Eliminated players are skipped. The last survivor wins.

## Deliberate simplifications / not official complete rules

No trading or negotiated deals; unlimited bank building supply; no special house-shortage auction; original 12-card travel decks rather than the official printed card lists; no multi-player payment cards; nearest-station cards use normal rent rather than a special multiplier; no interest charge on receipt of a bankrupt player's mortgaged property (the 10% redemption fee remains); bank-bankrupt property returns unsold instead of being immediately auctioned; all building/asset management restricted to your own turn. No fixed turn timer, forced disconnection forfeiture, saved match restoration after host departure, or central anti-cheat authority. A connected host validates actions and generates dice; guests cannot submit whole-state edits, but a modified malicious host is not prevented.

## Engine contract / verification

`engine.js` exports `BOARD`, `createGame(players)`, `act(state,playerId,action,rng)` and has no DOM or network dependency. Rejected operations return the original state and error; successful operations clone before changes and increase `revision` by one. Never trust guest-provided player IDs or RNG: the network host must bind IDs to established connections and call `act` locally.

`jail` is attempts remaining (3, 2, 1; 0 is free). A debt `pending` may carry `resume: {type:'jailMove',steps}` for mandatory third-attempt release. This is internal continuation data, not a client command. Auctions use the agreed `active` ID list; no designated auction turn. Unknown actions reject. `bankrupt` is not a generic forfeit command.

Run `node scripts/verify-estates-engine.mjs` for deterministic fixtures and 30 seeded 500-action simulations, including rejected operations, purchase/auction handling, rent, tax, construction, mortgages, jail continuation, cards, debt and winner determination.

## Existing implementation preflight

Reviewed [intrepidcoder/monopoly](https://github.com/intrepidcoder/monopoly) and its [game implementation](https://github.com/intrepidcoder/monopoly/blob/gh-pages/monopoly.js). Its global game state and DOM/UI-coupled operations do not fit this game's pure immutable host-authoritative reducer contract. The rules engine here was written independently; no code or card text copied from that project. Peer networking is handled separately by the UI/network implementation.

## Destination sources

Verified against UNESCO World Heritage Centre official listing pages on 2026-11-03. Short Japanese labels are display abbreviations; exact English listing titles are stored as `officialName` in `board.js`. Only names and identifiers are used, not UNESCO descriptive prose/photos. The palette, prices and grouping are fictional.

- アユタヤ — [Historic City of Ayutthaya](https://whc.unesco.org/en/list/576/)
- アヌラーダプラ — [Sacred City of Anuradhapura](https://whc.unesco.org/en/list/200/)
- タオス・プエブロ — [Taos Pueblo](https://whc.unesco.org/en/list/492/)
- スカン・グアイ — [SGang Gwaay](https://whc.unesco.org/en/list/157/)
- ハル・サフリエニ — [Ħal Saflieni Hypogeum](https://whc.unesco.org/en/list/130/)
- 法隆寺 — [Buddhist Monuments in the Horyu-ji Area](https://whc.unesco.org/en/list/660/)
- エローラ石窟群 — [Ellora Caves](https://whc.unesco.org/en/list/243/)
- ヌビア遺跡群 — [Nubian Monuments from Abu Simbel to Philae](https://whc.unesco.org/en/list/88/)
- ダラム城と大聖堂 — [Durham Castle and Cathedral](https://whc.unesco.org/en/list/370/)
- イスタンブル歴史地区 — [Historic Areas of Istanbul](https://whc.unesco.org/en/list/356/)
- エルサレム旧市街 — [Old City of Jerusalem and its Walls](https://whc.unesco.org/en/list/148/)
- ウルル — [Uluru-Kata Tjuta National Park](https://whc.unesco.org/en/list/447/)
- ヨセミテ国立公園 — [Yosemite National Park](https://whc.unesco.org/en/list/308/)
- シドニー・オペラハウス — [Sydney Opera House](https://whc.unesco.org/en/list/166/)
- ペトラ — [Petra](https://whc.unesco.org/en/list/326/)
- アテネのアクロポリス — [Acropolis, Athens](https://whc.unesco.org/en/list/404/)
- 万里の長城 — [The Great Wall](https://whc.unesco.org/en/list/438/)
- モン・サン・ミシェル — [Mont-Saint-Michel and its Bay](https://whc.unesco.org/en/list/80/)
- ローマ歴史地区 — [Historic Centre of Rome, the Properties of the Holy See in that City Enjoying Extraterritorial Rights and San Paolo Fuori le Mura](https://whc.unesco.org/en/list/91/)
- ヴェルサイユ — [Palace and Park of Versailles](https://whc.unesco.org/en/list/83/)
- タージ・マハル — [Taj Mahal](https://whc.unesco.org/en/list/252/)
- パリのセーヌ河岸 — [Paris, Banks of the Seine](https://whc.unesco.org/en/list/600/)

## Solo CPU play
The independent entry button starts one human against one to three CPUs locally, without opening PeerJS signaling. Same validated rules, money and dice as online play. CPU buys with a cash reserve, bids up to a public-state valuation, develops complete sets, redeems mortgages and sells/mortgages to settle debts before bankruptcy. Actions are paced at1500ms. This is a basic heuristic opponent, not a difficulty-ranked AI. Closing/reloading ends the match; no solo persistence or offline asset cache is claimed.

## Card state and verification

`cards.js` exports `CARD_DECKS.chance` and `.chest` with original Japanese titles, full effect descriptions and machine-readable effects. State contains `decks[type].remaining` (card IDs), each player has `heldCards: [{type,id}]` plus the backwards-compatible `cards` count, and `cardSequence` monotonically increases. `lastCard` is `{type,id,title,text,sequence,playerId}`. `cardEvents` resets on each successful action and lists every newly drawn card in resolution order, including chained backward-into-letter landings; UI should use these typed events instead of guessing by log text. All are JSON-serializable for the host-authoritative connection. Existing in-memory older states lazily initialize deck data on first draw.

Run `node scripts/verify-estates-cards.mjs`: every one of the 24 effects in four-player state, finite independent decks, held card exclusion/return/creditor transfer, chained draws, forward GO income, backward tax, movement rent, debt liquidation and bankruptcy. Engine baseline remains `node scripts/verify-estates-engine.mjs`.

## Negotiated trades

At the start or end of their turn, a player can propose one or more properties from either side with a nonnegative integer € difference in one direction. The recipient can accept, reject or counter; the current proposer can withdraw. The original turn and phase resume after agreement/rejection/cancellation. Pending offers freeze other game actions. No cash/property moves until acceptance; ownership, participants, available funds and proposal identity are revalidated atomically.

Current scope permits only unmortgaged properties whose entire color group has no buildings, including stations/utilities. This deliberately excludes mortgaged-property transfer interest, card trading, debt-phase negotiations, and developed-property transfers. The UI states the limits. No expiration auto-accepts an offer. CPU recipients use public printed prices and a €100 cash reserve; they accept equal-or-better offers and otherwise reject. CPU does not initiate offers or bluff.

Verify with `verify-estates-trading.mjs`, actual solo offer accept/reject at320/390, and real two-context WebRTC proposal/counter/accept/cancel with exact balances and ownership synchronization.
