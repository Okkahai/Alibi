# Daily system

How the shared daily case is chosen, published and kept stable. This replaces the older design notes in `docs/11-daily-mode.md`, which described a database cache that was never needed.

## One case per UTC date

- The seed is the UTC date (`YYYY-MM-DD`), and the difficulty is `DAILY_DIFFICULTY` (`src/lib/engines/daily-case.ts`).
- `generateCase` is pure and deterministic, so every player's browser builds the same case. No database is involved.
- The case number counts from `DAILY_LAUNCH_DATE` (2026-11-01 is Nº 001).
- The rollover is 00:00 UTC.

## Published days never change (§8 step 9)

- **Fingerprints.** `src/data/daily-fingerprints.json` holds a hash of every published day's full case (`daily-fingerprint.ts`).
- **The test.** `__tests__/daily-frozen.test.ts` regenerates each listed day and fails if any hash differs.
- **Freezing new days.** The **Freeze published dailies** workflow runs at 00:10 UTC, adds the new day and commits. To run it by hand: `npx tsx scripts/freeze-dailies.ts`. It never rewrites an existing entry.

### Changing the generator

Any change that alters generated output must apply only from a future date. Branch on the seed:

```ts
const v2 = seed >= "2026-12-01"; // rule change takes effect for dailies from this date
```

Practice cases use non-date seeds and always get the newest rules.

If the frozen test fails, the change touched a published day. Gate it as above. Never edit the fingerprint to make the test pass.

## Answer integrity (§21)

- **What runs where.** The case, including its solution, runs in the browser, and so do the hints and the reveal.
- **Cheating.** A determined player can read the answer from the JavaScript bundle. That is acceptable for a casual daily puzzle. Scoring runs on the server (`/api/accusation`), but the hint count is reported by the client.
- **If a leaderboard is ever added.** It would need the case served without its solution and the hints counted server-side.

## Sharing

`formatDailyShareText` produces a ledger-style result:

- verdict marks per field, exhibits found, hints used and the score;
- never a name, method or room.
