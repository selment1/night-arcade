# Travel-table experience review — 2026-11-04

## Comparison and design reasoning

Reference: Hasbro's published classic Monopoly rules (older Parker Brothers edition, not a claim that every modern edition is identical): https://www.hasbro.com/common/instruct/monins.pdf . Buying, declined purchases going to auction, color-set building and cash consequences create choices rather than a pure roll-and-move game. The current original travel adaptation already implements these core loops. Negotiated player-to-player trades and a finite shared supply of houses/hotels are still absent; these are meaningful strategic gaps, not things sound effects can replace. The finite chance/letter decks are original travel adaptations. No official Monopoly branding/assets/audio are reused.

Psychology reference: Przybylski, Rigby & Ryan (2010), *A Motivational Model of Video Game Engagement*: https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf . Its competence/autonomy/relatedness framework informs the following design hypotheses; these have not been validated in user research and no dopamine, therapeutic or addiction claims are made.

| Need | Previous friction | Change |
| --- | --- | --- |
| Autonomy / understandable choice | Purchase buttons lacked cash consequence | Show cash remaining after purchase and explain decline means auction |
| Competence / progress | Color-set progress hidden in ownership state | Selected color shows owned/total, remaining count, building cost and completion |
| Anticipation / cause and effect | Small tumbling icons, result and movement too close | Full felt-table 3D dice: throw, bounce, confirmed result, travel, actual money/card |
| Feedback | Purchase and building easy to miss | Brief acquisition, completed-set, building and victory stamps with distinct short motifs |
| Control / comfort | No sound controls | Opt-in original ambient music and foley; separate volumes, mute, short effects, OS reduced-motion |
| Social clarity | CPU turns invited the human to roll | Waiting text describes the other player's current task; auctions remain shared |

The dice are CSS 3D presentation, not a second physics/random engine. Their final visible face and total are driven only by acknowledged game state. Animations cannot change odds, grant money or select outcomes. Presentation uses no Math.random, so visual/audio additions do not perturb seeded gameplay.

## Audio / lifecycle

`audio.js` synthesizes an original four-chord ambient lounge phrase and soft sine-note motifs with Web Audio; deterministic filtered noise supplies dice impacts. No audio assets, trackers, extra libraries or network requests. Audio starts only after the sound button gesture; never autoplay on reload. `heritage-sound-v1` stores only music/effects volumes and short-presentation preference, not game records. Storage exceptions keep current-session controls usable. Music pauses when hidden; all nodes stop on mute/pagehide. Headless PCM verification proves signal generation, not that a physical phone speaker sounded pleasant. Listening on actual phones remains unverified.

Human mutation controls wait approximately 2.05 seconds for a normal roll presentation. CPU scheduling respects the remaining presentation delay via an optional callback; rules and authoritative revisions remain unchanged. Quick/reduced-motion resolves without the large tray. Network peers continue sharing only rules state, not audio preferences. The tray can be dismissed with “盤面を見る”; this hides it, does not alter the outcome or shorten the rules presentation lock.

Verification: `node scripts/verify-estates-immersion.mjs`, effects, solo, expansion and actual WebRTC suites plus full deployment gates. Screenshots under ignored artifacts/; all tests use isolated browser contexts. Repeat immersion and network checks against BASE_URL after Pages succeeds.
