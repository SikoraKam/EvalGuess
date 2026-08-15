#!/usr/bin/env node

/**
 * Builds the binary index the app selects positions from.
 *
 * positions/generated/
 *   manifest.json       file names + line counts
 *   ratings.bin         Uint16 difficulty per position, in global id order
 *   sorted-ids.bin      Uint32 global ids sorted by difficulty
 *   sorted-ratings.bin  Uint16 difficulties, sorted (binary-searched at runtime)
 *   offsets/<n>.bin     Uint32 (byteOffset, byteLength) pairs per line
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const { rawDifficulty } = require('./positionDifficulty');

const POSITIONS_DIR = path.join(__dirname, '../positions');
const GENERATED_DIR = path.join(POSITIONS_DIR, 'generated');
const OFFSETS_DIR = path.join(GENERATED_DIR, 'offsets');

const MIN_POSITION_RATING = 600;
const MAX_POSITION_RATING = 2400;
const NEWLINE = 10;
const CARRIAGE_RETURN = 13;

async function listPartFiles() {
  const entries = await fs.readdir(POSITIONS_DIR);

  return entries
    .filter((entry) => entry.startsWith('part_'))
    .sort((left, right) => left.localeCompare(right));
}

/**
 * Records byte offsets and lengths rather than reconstructing them from the
 * decoded text, so multi-byte characters and CRLF line endings cannot shift
 * the index.
 */
async function processFile(fileName, fileIndex, difficulties) {
  const fileBuffer = await fs.readFile(path.join(POSITIONS_DIR, fileName));
  const bounds = [];
  let lineStart = 0;

  for (let byteIndex = 0; byteIndex <= fileBuffer.length; byteIndex += 1) {
    if (byteIndex !== fileBuffer.length && fileBuffer[byteIndex] !== NEWLINE) {
      continue;
    }

    let lineEnd = byteIndex;

    if (lineEnd > lineStart && fileBuffer[lineEnd - 1] === CARRIAGE_RETURN) {
      lineEnd -= 1;
    }

    if (lineEnd > lineStart) {
      bounds.push(lineStart, lineEnd - lineStart);
      const position = JSON.parse(
        fileBuffer.toString('utf8', lineStart, lineEnd),
      );
      difficulties[bounds.length / 2 - 1] =
        rawDifficulty(position) ?? Number.NaN;
    }

    lineStart = byteIndex + 1;
  }

  await fs.writeFile(
    path.join(OFFSETS_DIR, `${fileIndex}.bin`),
    Buffer.from(Uint32Array.from(bounds).buffer),
  );

  return bounds.length / 2;
}

/**
 * Maps raw difficulty onto the rating scale by rank, so the pool is spread
 * evenly across it. The heuristic only orders positions sensibly; its absolute
 * values are meaningless, and using them directly piled 83% of the dataset into
 * a 400-point band while leaving the ends of the scale nearly empty.
 *
 * Ties are broken by global id: positions of genuinely equal difficulty end up
 * a few rating points apart, which keeps every rating backed by a usable pool.
 */
function toRatingsByRank(difficulties) {
  const total = difficulties.length;
  const finite = [];

  for (let globalId = 0; globalId < total; globalId += 1) {
    if (Number.isFinite(difficulties[globalId])) {
      finite.push(globalId);
    }
  }

  const sortedIds = Uint32Array.from(finite).sort((left, right) => {
    const difference = difficulties[left] - difficulties[right];

    return difference !== 0 ? difference : left - right;
  });

  const ratings = new Uint16Array(total);
  const span = MAX_POSITION_RATING - MIN_POSITION_RATING;
  const lastRank = Math.max(1, sortedIds.length - 1);

  for (let rank = 0; rank < sortedIds.length; rank += 1) {
    ratings[sortedIds[rank]] = Math.round(
      MIN_POSITION_RATING + (rank / lastRank) * span,
    );
  }

  // Positions the model cannot score keep the middle of the scale.
  const median = Math.round((MIN_POSITION_RATING + MAX_POSITION_RATING) / 2);

  for (let globalId = 0; globalId < total; globalId += 1) {
    if (!Number.isFinite(difficulties[globalId])) {
      ratings[globalId] = median;
    }
  }

  return { ratings, sortedIds };
}

function logDistribution(ratings) {
  const histogram = new Map();

  for (const rating of ratings) {
    const bucket = Math.floor(rating / 200) * 200;
    histogram.set(bucket, (histogram.get(bucket) ?? 0) + 1);
  }

  console.log('\nRating distribution (200-point buckets):');

  for (const [bucket, count] of [...histogram.entries()].sort(
    (left, right) => left[0] - right[0],
  )) {
    const share = ((100 * count) / ratings.length).toFixed(1);
    console.log(
      `  ${bucket}-${bucket + 199}: ${String(count).padStart(9)}  ${share}%`,
    );
  }
}

async function main() {
  const partFiles = await listPartFiles();

  if (partFiles.length === 0) {
    throw new Error('No part_* files found in positions/.');
  }

  await fs.mkdir(OFFSETS_DIR, { recursive: true });

  console.log(`Indexing ${partFiles.length} files...`);

  const counts = [];
  const chunks = [];
  let total = 0;

  for (let fileIndex = 0; fileIndex < partFiles.length; fileIndex += 1) {
    const difficulties = new Float64Array(20000);
    const lineCount = await processFile(
      partFiles[fileIndex],
      fileIndex,
      difficulties,
    );

    counts.push(lineCount);
    chunks.push(difficulties.subarray(0, lineCount));
    total += lineCount;

    if ((fileIndex + 1) % 20 === 0 || fileIndex === partFiles.length - 1) {
      console.log(`  ${fileIndex + 1}/${partFiles.length} files`);
    }
  }

  const difficulties = new Float64Array(total);
  let cursor = 0;

  for (const chunk of chunks) {
    difficulties.set(chunk, cursor);
    cursor += chunk.length;
  }

  const { ratings, sortedIds } = toRatingsByRank(difficulties);
  const sortedRatings = new Uint16Array(sortedIds.length);

  for (let rank = 0; rank < sortedIds.length; rank += 1) {
    sortedRatings[rank] = ratings[sortedIds[rank]];
  }

  const manifest = { files: partFiles, counts, totalPositions: total };

  await Promise.all([
    fs.writeFile(
      path.join(GENERATED_DIR, 'manifest.json'),
      JSON.stringify(manifest),
    ),
    fs.writeFile(
      path.join(GENERATED_DIR, 'ratings.bin'),
      Buffer.from(ratings.buffer),
    ),
    fs.writeFile(
      path.join(GENERATED_DIR, 'sorted-ids.bin'),
      Buffer.from(sortedIds.buffer),
    ),
    fs.writeFile(
      path.join(GENERATED_DIR, 'sorted-ratings.bin'),
      Buffer.from(sortedRatings.buffer),
    ),
  ]);

  logDistribution(ratings);
  console.log(`\nDone. Indexed ${total.toLocaleString()} positions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
