# EvalGuess

Guess how a chess engine evaluates a position. You see a position, pick one of
11 evaluation buckets on a slider, and your Elo rating moves depending on how
close you were and how hard the position was.

Built with Expo (expo-router) for iOS, Android and web.

## Running it

```bash
yarn install
```

```bash
yarn build:index
```

```bash
yarn start
```

`build:index` is required before the first run: the position index it produces
is not committed. It takes a couple of minutes and only has to be rerun when
`positions/part_*` or the difficulty model changes.

Checks:

```bash
yarn verify
```

(`yarn typecheck`, `yarn lint` and `yarn test` individually.)

## The dataset

`positions/part_*` holds 2.41M positions (241 files × 10 000 JSONL lines,
~950 MB) taken from the Lichess evaluation database. Each line is:

```json
{ "fen": "...", "evals": [{ "pvs": [{ "cp": 58, "line": "f7g7 e6e2 …" }], "knodes": 200973, "depth": 39 }] }
```

Two things about `evals` matter throughout the code:

- **`cp` and `mate` are always from White's point of view**, whichever side is
  to move. (Verified against the multi-PV ordering: lines are listed best-first
  for the side to move, and 99.9% of entries are ordered consistently with a
  White-relative score.)
- Within one `evals` entry the PVs are ordered best-first **for the side to
  move**, so with Black to move the `cp` values ascend.

### The generated index

The dataset is far too large to bundle or to scan at runtime, so
`scripts/build-position-index.js` precomputes `positions/generated/`:

| File | Contents |
| --- | --- |
| `manifest.json` | file names and line counts |
| `ratings.bin` | `Uint16` difficulty rating per position, in global id order |
| `sorted-ids.bin` | `Uint32` global ids sorted by rating |
| `sorted-ratings.bin` | `Uint16` ratings, sorted — binary searched at runtime |
| `offsets/<n>.bin` | `Uint32` `(byteOffset, byteLength)` pairs, one per line |

Picking a position is a binary search over `sorted-ratings.bin` for the window
around the player's rating, then a random pick inside it. Loading a position is
a single positioned read of one line — nothing parses the 950 MB.

`positions/generated/` is gitignored; rebuild it with `yarn build:index`.

## Serving the data

In development, `metro.config.js` adds a `/positions-data` route to the Metro
dev server that serves the manifest, the binaries, and individual position
lines by byte offset.

**This is dev-only.** A release build has no Metro server, so the app currently
cannot ship as-is — the data needs a real home first. The client side is
already isolated behind one interface in `utils/positionService.ts`, so this is
a matter of adding a data source, not of reworking the app. The realistic
options are static hosting with HTTP range requests (the offsets file already
carries the lengths those need), bundling a smaller subset as an asset, or a
backend.

## How difficulty is rated

`scripts/positionDifficulty.js` scores how hard a position is to evaluate, from
properties of the position itself:

- **Material vs evaluation mismatch** — the dominant signal. A position where
  material and evaluation disagree (a rook down but winning, level material but
  +3) is what makes the question hard.
- **Proximity to a bucket border** — an evaluation of +1.48 punishes a sound
  read, because the answer sits one point from the next bucket.
- **Sharpness** — how far the second-best move falls behind the best one.
- **Cross-depth disagreement** — analyses at different depths landing in
  different buckets means the position is genuinely unstable.

Engine bookkeeping (`depth`, `knodes`, how many analyses a position accumulated)
is deliberately **not** used: it measures how much work Lichess spent on a
position, not how hard the position is for a human.

The raw score is unitless and only its ordering is meaningful, so the build maps
it onto 600–2400 **by rank**. That keeps the pool evenly spread across the whole
scale — roughly 11% of positions in every 200-point band — so a player at any
rating has a large pool to draw from.

## Rating

Standard Elo (`utils/rating.ts`), K=32, starting at 1000, clamped to 400–3000.
The guess scores 1 / 0.75 / 0.5 / 0.25 / 0 for being 0 / 1 / 2 / 3 / 4+ buckets
away from the engine, played against the position's difficulty rating.

## Layout

```
app/            expo-router screens; index.tsx is the whole game screen
components/     presentational components, one folder each
const/          category table (single source of truth) and theme tokens
utils/          game logic, storage, data access — where the tests live
positions/      dataset + generated index
scripts/        offline index builder and the difficulty model
```

`utils/gameMachine.ts` holds the screen's state machine as a pure reducer, so
the flow (loading → guessing → cue → result → review) is testable without
rendering anything.
