# 世界遺産トラベル: mobile multiplayer

## Runtime

`public/estates/` is a standalone mobile-first JavaScript app, intentionally separate from 木漏れポケット (no shared economy or navigation). 2–4 players, room code or share URL, host-only start. All monetary labels are game euros. Board actions are authoritative in the host browser via `engine.js`; guests submit only actions and expected state revision. Member ID comes from the established PeerJS data connection, never guest payload. A guest cannot choose another actor, inject state, roll locally, or replay an old revision. Actions are allowlisted and numeric fields bounded; joins cap names at 20 characters, room size 4, and prohibit late entry. Guest inbound messages have size/rate limits. Nicknames use textContent.

PeerJS 1.5.5 MIT is vendored under public/vendor/peerjs.min.js with LICENSE-peerjs.txt, fetched from the official npm peerjs package. Default free PeerJS cloud signaling connects WebRTC data channels. No BroadcastChannel or storage transport, no paid configuration. Standard WebRTC caveat: restrictive firewalls/NAT can prevent a direct connection; no paid TURN fallback is provisioned. Connection attempts time out with user-visible status. Host must keep browser open; phone backgrounding can interrupt transport.

## Departure policy

No resumability is claimed. A reload creates a fresh peer identity. Once a match starts, if any player disconnects, the match is explicitly halted and actions disabled; players create a new room. Lobby guests can leave freely. Host departure visibly ends connectivity. No silently invented bankruptcy or AI substitution. Match state is ephemeral and is not retained in localStorage. Rejoin tokens are deliberately not used in this version.

## Verification

`node scripts/verify-estates-network.mjs` starts the local static server, or `BASE_URL=https://your-host/night-arcade/ node scripts/verify-estates-network.mjs` tests a deployment. Requires installed Chrome and @playwright/test. Creates two isolated browser contexts, real default PeerJS signaling and a real open RTCPeerConnection/data channel. Exercises lobby, host start, invalid actor/state payload rejection, deterministic host roll, purchase, turn handoff, full state synchronization, second-player action, mobile widths 320/390, safe nickname rendering, and departure notice. Screenshots go to artifacts/estates-mobile-{320,390}.png. Both peers may run on the same machine: this verifies real cloud-mediated WebRTC, not cellular-carrier interoperability.

## Gameplay scope

World Heritage names come from the board dataset source links. Original travel branding and visual layout. Property buying, rent, sets/building, auctions, mortgages, detention, bankruptcy and game end are engine-controlled. Player-to-player trades use host-validated offer/counter/accept/reject/cancel actions, authenticated connection identity, revision and proposal IDs. Cash and properties exchange atomically only on acceptance. Not represented as an official Monopoly product or a perfect implementation of all official rules.

Verified 2026-11-03 locally using two isolated Chrome contexts, default public PeerJS signaling and actual open WebRTC data channel. Full suite passed, including host roll / purchase / end-turn, guest roll, tampered actor/state rejection, and guest departure detection. Heartbeat checks disconnected peers (about 18–22 seconds); an interrupted mobile app does not silently leave a frozen game. 320px screenshot visually inspected. Live HTTPS-origin verification is a separate parent deployment step.

### Invitation entry (2026-11-04)

A valid `?room=<10 hex characters>` link opens a focused nickname + “この招待に参加” screen. The code is read from the URL; no room-number entry is shown. Creation/solo controls are hidden until the user follows “招待を使わずに遊ぶ”. Joining remains an explicit tap. Invalid invitation values fall back to manual entry with an error, and never silently create a room. The network regression follows the host-generated share URL without entering the code and verifies real WebRTC play/trading.

### Safari connection investigation (2026-11-04)

User reports iPhone Safari cannot join via invitation or code, with no visible feedback. Device-specific cause not confirmed. Playwright WebKit27.2 (not an actual iPhone) reproduces join timeout with Chrome or WebKit host: guest has host candidates only and ICE failed; Chrome host has host/srflx. A forced-relay probe against bundled PeerJS default TURN endpoints yielded no relay candidate and DNS701 failures. PeerJS officially discontinued free TURN in2023: https://github.com/orgs/peers/discussions/1172 . Do not equate same-machine Chrome success with phone/cellular support. The primary invitation change is published and Chrome-tested, but is NOT a fix for failed connectivity.

A second feedback improvement mirrors connection status immediately below Join. `node scripts/diagnose-estates-webkit.mjs` (optional CHROME_HOST=1) prints states/candidate TYPES only, no room codes or addresses. A public OpenRelay static-auth probe also yielded no relay candidates; it was NOT installed as a production fallback. A working authorized TURN service or hosted relay, with forced-relay and phone verification, is still needed before claiming robust cross-network play. Current privacy and transport stay unchanged.
