# こもれびポケット

A Japanese, local-first virtual pet and five browser games. Play earns coins and growth points, then unlock companions, clothing and evolution. No payments, ads, accounts, analytics or server-side player data.

**Play:** https://selment1.github.io/night-arcade/

## The five games

- **ふたり将棋** (`games/shogi.html`): same-device 9×9 shogi. Captures, drops, promotion, legal king safety, pawn-drop restrictions, checkmate, fourfold repetition/perpetual check, undo and local save. No AI/network/clocks. Entering-king declarations and impasse points are not automatically adjudicated; mutual draw is explicit.
- **ふたりのオセロ** (`games/reversi.html`): same-device Othello-style 8×8 game, eight-direction flips, automatic pass, end/winner/draw, undo and save.
- **どうぶつタワー** (`games/stack.html`): real Matter.js rigid-body stacking with animal shapes; a fallen animal ends the game. One-player and alternating two-player modes.
- **記憶の設計図** (`games/recall.html`): recall color, shape, position and order; three difficulty levels and five escalating rounds.
- **ひらめき雑学** (`games/quiz.html`): 10-question sampled rounds, four shuffled options, explanations and primary-source links.

## Pet loop

Original characters: もりまる (free), こはく (120 coins), そらもち (180 coins). Each grows from egg → child (50 coins, 60 cumulative growth points) → adult (120 coins, 180 points). Growth points are shared, are not spent and come from games. Stages are per character. Clothing is purchased once and freely equipped thereafter: ribbon 35, glasses 45, scarf 65, crown 100.

Care is free. Feed/pet cooldown 30 seconds; rest 45 seconds. Passive stat decay is bounded to 48 hours per gap and a floor of 20; pets never die or disappear. No notifications or pressure-based monetization.

Rewards: completed shogi/reversi 30 coins / 20 points (shogi resignation after 12 plies: 8/5; agreed draw: none), stacking 3 coins / 2 points per landed animal capped 40/30, memory 2/2 per fully correct item capped 30 each round, trivia correct×3+10 coins and points per finished ten-question run. Stable run/match IDs prevent repeat result rewards. This is local casual progress, not a tamper-proof or real-money economy. Two-player results contribute to the same browser's pet.

## Development and tests

`npm ci` then `npm start` serves the explicit public allowlist at http://127.0.0.1:4185. Google Chrome is used by Playwright (`channel: chrome`).

- `npm test`: isolated server; pet care, cooldown, purchases, evolution, clothing, reload and storage-denied UI; all five game pages/home links at 320/390/1280px.
- `node scripts/verify-pet-core.mjs`: transactions, duplicate prevention, corrupt storage, partial storage failure, decay and live game rewards.
- `node scripts/verify-shogi.mjs --ui`: engine fixtures, legal-play invariants and promotion/capture/drop through actual browser controls.
- `node scripts/verify-reversi.mjs`: eight-direction/pass/end fixtures.
- `node scripts/verify-recall.mjs`: both board-game UI and memory timer/win/loss/progression checks.
- `node scripts/verify-stack.mjs`: physical landing/fall, pause, two-player turns and reward events.
- `node scripts/verify-quiz.mjs`: dataset and trivia UI/reward checks.
- `node scripts/verify-pet-journey.mjs`: actual quiz play → coins → evolution → outfit → reload, without seeded balances or direct reward calls. Supports `BASE_URL`.
- `BASE_URL=https://selment1.github.io/night-arcade/ npm test`: delivered origin smoke test. It uses isolated browser state only.

Screenshots are in ignored `artifacts/`. Viewport emulation is not physical-phone verification.

## Persistence and privacy

`night-pet-v1` stores balance, points, companions, stages, clothes, care times and a reward ledger. Corrupt JSON is backed up to `night-pet-v1-recovery` before recovery. Read/write failures retain current-session progress and display a notice. Records are tied to the current browser and origin: clearing site data deletes them, and no cross-device sync is provided. Existing first-edition game files and storage keys remain intact; they are not featured in the new collection and do not award pet coins.

A web manifest enables home-screen launching where supported, but offline caching is not claimed. This is a web app, not an App Store/Google Play release.

## Deployment

`node scripts/deploy.mjs` runs required suites, stages only project source, pushes main, then uploads only public assets to `gh-pages` without force. Wait for Pages build and check public URLs/artifact bytes before declaring release. Public hosting does not depend on the development machine staying awake; scheduled development does.

## Dependencies and sources

- Matter.js 0.20.0 vendored in `public/vendor/`, MIT license included. Physics engine source: https://github.com/liabru/matter-js .
- Playwright is project-local test tooling.
- Existing shogi engine was inspected but not reused because its legal evasion and hand-count parsing had correctness gaps; this project's engine is independently implemented and tested against rule fixtures. Rules: https://www.shogi.or.jp/knowledge/shogi/ and https://www.shogi.or.jp/match/taikyoku_rules/ .
- Trivia references are stored with each original question. SVG pet art and CSS/Canvas game visuals are original geometry; no third-party franchise assets are used.

## Two independent games

The pet app at `/night-arcade/` and World Heritage Travel at `/night-arcade/estates/` are separate products. No shared currency, character unlocks or navigation. The latter supports 2–4 players through real PeerJS/WebRTC with euro-denominated fictional assets. Host must stay online; reconnection, trading and universal cellular/NAT connectivity are not promised. See `docs/ESTATES-RULES.md` and `docs/ESTATES-NETWORK.md`.

Pet care defaults to time-based iD-inspired care with original pixel SVG characters, food, hygiene, medicine, sleep, favorites and friendship. Timings are independent web-game rules, not a firmware reproduction. Original coin-driven evolution remains in ゲーム育成; previous saves are preserved. New care data uses `night-pet-id-v1`. See `docs/ID-CARE.md`.

## Travel-table presentation
The standalone estates game uses a navy/brass travel-table UI, local licensed World Heritage photographs, visible die faces and real-state animation feedback for dice, movement, chance events and money changes. Photo credits/licenses are available per destination; see `docs/ESTATES-PHOTOS.md`. Reduced motion is respected. Presentation never determines rolls or changes the rule engine.

Pet care prices requested by the owner: meals3 coins, snacks2, rest/lights-off2; lights-on and other care free. Both care modes preserve existing balances. Exact iD firmware reproduction is not claimed.

## Expanded travel play
Solo supports1–3 CPU opponents. The complete square board fits the screen without internal scrolling. Perimeter depth is1.5× the original equal-grid cell size, using central space rather than enlarging the outer frame. All22 heritage photo cards have short UNESCO-sourced Japanese descriptions. Chance and letters use separate12-card finite decks with money, movement, repairs, detention and held escape cards; effects are original travel adaptations, not an official card-set reproduction. `verify-estates-expansion.mjs` covers4-player turns/auction and board geometry, `verify-estates-cards.mjs` covers effects/decks/debt.

World Heritage immersive edition: original opt-in Web Audio lounge music/foley, separate volumes and mute, full CSS3D authoritative dice → token → outcome sequence, short/reduced-motion mode, purchase balance preview and color-set progress/achievement stamps. Preferences use separate `heritage-sound-v1`; no changes to pet saves. See `docs/ESTATES-EXPERIENCE.md` for reference-rule comparison, psychology rationale, remaining strategic gaps and audio verification limits.

Deeds edition: tap any board space for a native detail dialog with full name, printed purchase price, current tariff, complete rent table and mortgage/building costs; all40 names/prices are searchable below the board. Your card collection separates owned title deeds and held chance/letter escape cards; consumed event cards are not shown as inventory. Inspection stays pinned across CPU turns until Current location is chosen. Tariffs track color ownership, buildings, mortgages, station count and utility multipliers; printed price is not auction acquisition cost. `verify-estates-deeds.mjs` checks actual purchase/held-card use, dialog focus, search, tariffs and mobile fit; the WebRTC suite checks per-player inventory and synchronized owner labels.
