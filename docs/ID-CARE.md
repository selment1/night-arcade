# 木漏れポケット: iD-inspired care sidecar

## Source boundary

This is an original browser simulation inspired by **Tamagotchi iD (2009)**, not iD L, firmware emulation or a claim of exact reproduction.

Primary source checked 2026-11-03:

- [BANDAI Tamagotchi iD white product page](https://www.bandai.co.jp/catalog/item.php?jan_cd=4543112592262000): November 2009 release, accessory dressing, room refurbishment, character individuality and friendship (たまとも), infrared downloads.
- [The manual linked by that page](https://www.bandai.co.jp/support/files/pdf/torisetu20tamagotchi20id.pdf) currently redirects to [BANDAI support maintenance](https://www.bandai.co.jp/mainte2/). The PDF was not available via browser or direct HTTP. Therefore precise official growth, care-miss, weight, favorite-item and friendship timing rules have **not** been verified.

All thresholds below are this game's disclosed balancing choices. The four friendship marks and three favorites plus companionship pattern are implemented as an iD-inspired interpretation, not verified as matching every iD rule. Character identities and favorite items are original. Infrared item downloads are not reproduced.

## Load and API

Load `public/id-care.js` after `pet-core.js`, before home UI. The API is `globalThis.IDCare`.

- `snapshot()` returns selected character, `phase` (`egg`, `baby`, `child`, `teen`, `friend`), `ageDays`, `hunger`, `happiness` (0–4, higher is healthier), `weight` (5–99), `waste` (0–3), `dirty`, `sick`, `asleep`, `lights`, `careMisses`, `friendship` (four booleans), `room`, `variant` (`bud`, `sunny`, `dreamy`, `wild`), `nextGrowthAt` (epoch ms, 0 for final stage), `favorites: {meal,snack,toy}`, `storageOK`, `notice`, and internal persistence fields. It catches up elapsed care and saves without emitting an event, so rendering cannot recurse.
- `act(type, value?)` returns `{ok, message, persistent?}`. Successful actions dispatch `idcare:change` with `{type,message}` detail if the host supports `CustomEvent`.
- `rooms`: `{meadow, cloud, sunset}` mapped to Japanese display labels.
- `favorites`: character-keyed original favorite item strings.
- `key`: `night-pet-id-v1`.

Actions:

| Type | Optional value | Effect |
| --- | --- | --- |
| meal | Item string; default character favorite | +1 hunger and weight; refuses when full |
| snack | Item string; default favorite | +1 happiness, +2 weight; weight ≥30 causes illness |
| toy | Item string; default favorite | +1 happiness, −1 weight |
| outside | None | Park visit: +1 happiness, −1 weight |
| toilet | None | Clears waste |
| bath | None | Clears dirt and its timer |
| medicine | None | Cures current illness; ongoing unmet needs can cause illness again |
| lights | Boolean; default toggles | Manual room light switch |
| room | `meadow`, `cloud`, `sunset` | Free room redesign; usable even during egg/sleep |

Feeding, snacks, toys and walks have independent 5-second repetition cooldowns. Egg and sleep block care other than lights/room. Lights do not force sleep outside the sleep schedule. A dark room does not prevent the pet waking at 07:00.

## Time, growth and consequences

- Egg hatches at 1 minute; baby becomes child at 61 minutes; teen at 25 hours; friend at 49 hours from creation. These are original accelerated browser timings. Growth includes sleep and offline elapsed time.
- Existing NightPet stage 0 maps to a new egg, stage 1 to child, stage 2 to friend. Only the first sidecar creation uses this mapping; subsequent chronological growth is independent of the coin evolution system.
- Sleep follows the device's local wall clock: child 20:00–07:00, teen 21:00–07:00, friend 22:00–07:00. Babies do not use this nightly schedule.
- Awake hunger loses one mark per 90 minutes (baby: 15), happiness per 120 minutes (baby: 20). Waste appears every 90 awake minutes; dirt after 240 awake minutes. These timers pause during sleep.
- Zero hunger, zero happiness or three waste piles start a distress episode. 15 awake minutes adds one care miss; 60 causes illness. Resolving all distress resets the episode. Leaving sleep lights on for 30 minutes adds one miss per night.
- On reaching friend stage, ≤2 misses yields sunny, 3–6 dreamy, ≥7 wild. This variant persists; no character or purchased inventory is deleted.
- Three favorite actions at friend stage award three friendship marks. The fourth requires all three plus 48 hours since reaching friend stage. This companionship timer includes offline time. The marks persist across reloads and are separate for each unlocked character.
- Offline care catchup is capped at seven days (10,080 one-minute steps). Older unattended care time is skipped, while chronological growth/age still catches up fully. Sub-minute remainder is retained so frequent rendering does not slow timers.
- No death, runaway, forced reset, marriage or generation loop is imposed. Neglect produces illness/care-driven evolution instead. This intentionally preserves existing pets and differs from destructive virtual-pet lifecycle systems.

## Save safety and economy

Only `night-pet-id-v1` is written. Original `night-pet-v1` coins, XP, characters, outfits and rewards are read indirectly through `NightPet.snapshot` and never changed by this module. No action spends coins. Existing outfit and game reward systems remain owned by NightPet.

Corrupt or unsupported sidecar data is left byte-for-byte intact and the current session uses in-memory care with a notice. Blocked/quota-failing storage also stays playable in memory. UI should display `notice` whenever nonempty. Save synchronization across multiple simultaneously open tabs is not implemented.

## Verification

Run `node scripts/verify-id-care.mjs`. Fake-clock tests cover phase transitions, legacy stage migration, original ledger preservation, deterministic elapsed catchup, long offline bounds, sleep/wake and light behavior, feeding refusal, waste and hygiene, illness/cure, care misses, friendship, room changes, per-character state, reload, storage failure and corrupt-save protection. This suite is headless; parent integration verifies rendered controls separately.
