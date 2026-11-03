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
- Event squares draw an original short travel event: money gain/loss, departure, detention, escape card, or three steps backward. Backward landings resolve their destination.
- Insufficient payment enters a debt phase. Sell buildings and mortgage assets; payment executes automatically once enough cash exists. Bankruptcy is allowed only when total realizable cash (cash + sale proceeds + available mortgages) is below the debt. Debt must be resolved before ending your turn.
- Bankruptcy to a player transfers remaining cash, escape cards and mortgaged/unmortgaged properties; buildings are liquidated to that creditor at half cost. Bankruptcy to the bank clears ownership and mortgages. Eliminated players are skipped. The last survivor wins.

## Deliberate simplifications / not official complete rules

No trading or negotiated deals; unlimited bank building supply; no special house-shortage auction; independently random event draws (with replacement, not finite shuffled decks); no multi-player payment cards or building-repair cards; no interest charge on receipt of a bankrupt player's mortgaged property (the 10% redemption fee remains); bank-bankrupt property returns unsold instead of being immediately auctioned; all building/asset management restricted to your own turn. No AI, fixed turn timer, forced disconnection forfeiture, saved match restoration after host departure, or central anti-cheat authority. A connected host validates actions and generates dice; guests cannot submit whole-state edits, but a modified malicious host is not prevented.

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
