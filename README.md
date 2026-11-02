# よふかしアーケード

Five small, Japanese, mobile-friendly browser games. No accounts, ads, analytics, runtime dependencies, or backend.

- **こだま郵便** — original delayed-echo courier puzzle; six BFS-verified levels, wait, undo, hint.
- **プリズムの小径** — rotate light paths through six puzzles.
- **星座あわせ** — constellation pairs, two difficulties.
- **ほしの軌道** — reverse direction to dodge meteors.
- **雨の庭** — catch rain and avoid hazards.

## Play / develop

Public site: https://selment1.github.io/night-arcade/

`npm ci`, then `npm start` (http://127.0.0.1:4185). Server serves only the public asset allowlist. For same-LAN devices explicitly run `HOST=0.0.0.0 npm start`; the host must stay awake. Public GitHub Pages does not depend on the local machine. Each game also has a direct URL under `games/`.

The web manifest supports home-screen launch on compatible browsers. This is a web release, not an App Store or Google Play submission. Internet access is required; no offline cache/service worker is claimed.

## Verification

Google Chrome is required for browser checks (`channel: chrome`).

- `npm test`: starts an isolated server; checks 320/390/1280px layouts, links and JavaScript errors; screenshots in ignored `artifacts/`.
- `node scripts/verify-puzzles.mjs`: all prism stages and both memory modes.
- `node scripts/verify-echo.mjs`: BFS solution lengths and real-browser completion of all six stages, save/undo/hints/storage-blocked behavior.
- `node scripts/verify-action.mjs`: with `npm start` running, score/collision/pause/restart/persistence. `ARCADE_URL` overrides origin.
- `BASE_URL=https://selment1.github.io/night-arcade/ npm test`: verify the delivered origin.

Browser viewport tests are not physical phone tests. Progress is stored locally, scoped to browser and origin; no cross-device sync. Clearing site data clears game records. Storage-disabled environments can still play, without durable saves.

## Publish

`node scripts/deploy.mjs` runs checks, commits selected source files and pushes `main`, then publishes only `public/` to `gh-pages` without force-pushing. It requires authorized GitHub access and the local server for arcade tests. GitHub Pages source is `gh-pages` root. No paid infrastructure is required. Confirm Pages build and live browser checks after uploading.

## Design choices

Existing option reviewed: [Phaser](https://github.com/phaserjs/phaser), an MIT HTML5 game framework. These small, bespoke mechanics use native DOM/Canvas to avoid shipping an engine; Playwright provides established browser verification. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) supplies managed static hosting. All illustrations are CSS/SVG/Canvas geometry rather than third-party media.
