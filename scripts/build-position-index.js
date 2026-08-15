#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const POSITIONS_DIR = path.join(__dirname, '../positions');
const GENERATED_DIR = path.join(POSITIONS_DIR, 'generated');
const OFFSETS_DIR = path.join(GENERATED_DIR, 'offsets');

function clampPositionRating(rating) {
  return Math.round(Math.max(600, Math.min(2400, rating)));
}

function estimatePositionRating(position) {
  const { evals } = position;

  if (!evals || evals.length === 0) {
    return 1000;
  }

  const deepestEval = evals.reduce((best, current) =>
    current.depth >= best.depth ? current : best,
  );
  const primaryPv = deepestEval.pvs[0];

  let minCp = Number.POSITIVE_INFINITY;
  let maxCp = Number.NEGATIVE_INFINITY;
  let shortestMate = Number.POSITIVE_INFINITY;
  let maxDepth = 0;
  let maxKnodes = 0;
  let totalPvs = 0;

  for (const evalEntry of evals) {
    maxDepth = Math.max(maxDepth, evalEntry.depth);
    maxKnodes = Math.max(maxKnodes, evalEntry.knodes);

    for (const pv of evalEntry.pvs) {
      totalPvs += 1;

      if (pv.mate !== undefined) {
        shortestMate = Math.min(shortestMate, Math.abs(pv.mate));
      }

      if (pv.cp !== undefined) {
        minCp = Math.min(minCp, pv.cp);
        maxCp = Math.max(maxCp, pv.cp);
      }
    }
  }

  let rating = 1000;

  if (Number.isFinite(minCp) && Number.isFinite(maxCp)) {
    const spread = maxCp - minCp;
    rating += Math.min(350, spread * 0.45);
  }

  if (evals.length > 1) {
    rating += (evals.length - 1) * 18;
  }

  rating += Math.min(120, Math.max(0, totalPvs - 1) * 10);
  rating += Math.min(180, Math.max(0, maxDepth - 24) * 3.5);

  if (maxKnodes > 0) {
    rating += Math.min(120, Math.log10(maxKnodes + 1) * 18);
  }

  if (Number.isFinite(shortestMate)) {
    if (shortestMate <= 2) {
      rating -= 280;
    } else if (shortestMate <= 5) {
      rating -= 120;
    } else {
      rating += Math.min(220, shortestMate * 7);
    }
  }

  if (primaryPv?.cp !== undefined && Math.abs(primaryPv.cp) < 35) {
    rating += 90;
  }

  if (
    primaryPv?.cp !== undefined &&
    Math.abs(primaryPv.cp) >= 500 &&
    totalPvs === 1
  ) {
    rating -= 80;
  }

  return clampPositionRating(rating);
}

async function listPartFiles() {
  const entries = await fs.readdir(POSITIONS_DIR);
  return entries
    .filter((entry) => entry.startsWith('part_'))
    .sort((left, right) => left.localeCompare(right));
}

async function processFile(fileName, fileIndex, ratings, globalIdStart) {
  const filePath = path.join(POSITIONS_DIR, fileName);
  const fileBuffer = await fs.readFile(filePath);
  const offsets = new Uint32Array(10000);
  let lineIndex = 0;
  let lineStart = 0;

  for (let byteIndex = 0; byteIndex <= fileBuffer.length; byteIndex += 1) {
    const isLineEnd =
      byteIndex === fileBuffer.length || fileBuffer[byteIndex] === 10;

    if (!isLineEnd) {
      continue;
    }

    const line = fileBuffer
      .subarray(lineStart, byteIndex)
      .toString('utf8')
      .trim();

    lineStart = byteIndex + 1;

    if (!line) {
      continue;
    }

    offsets[lineIndex] = lineStart - line.length - 1;
    const position = JSON.parse(line);
    ratings[globalIdStart + lineIndex] = estimatePositionRating(position);
    lineIndex += 1;
  }

  if (lineIndex !== 10000) {
    throw new Error(`${fileName} has ${lineIndex} lines, expected 10000.`);
  }

  await fs.writeFile(
    path.join(OFFSETS_DIR, `${fileIndex}.bin`),
    Buffer.from(offsets.buffer),
  );

  return lineIndex;
}

async function main() {
  const partFiles = await listPartFiles();

  if (partFiles.length === 0) {
    throw new Error('No part_* files found in positions/.');
  }

  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.mkdir(OFFSETS_DIR, { recursive: true });

  const totalPositions = partFiles.length * 10000;
  const ratings = new Uint16Array(totalPositions);
  const counts = [];

  console.log(`Building index for ${partFiles.length} files...`);

  for (let fileIndex = 0; fileIndex < partFiles.length; fileIndex += 1) {
    const fileName = partFiles[fileIndex];
    const globalIdStart = fileIndex * 10000;
    const lineCount = await processFile(
      fileName,
      fileIndex,
      ratings,
      globalIdStart,
    );
    counts.push(lineCount);

    if ((fileIndex + 1) % 10 === 0 || fileIndex === partFiles.length - 1) {
      console.log(`Processed ${fileIndex + 1}/${partFiles.length} files`);
    }
  }

  const sortedEntries = Array.from({ length: totalPositions }, (_, globalId) => ({
    globalId,
    rating: ratings[globalId],
  })).sort((left, right) => {
    if (left.rating !== right.rating) {
      return left.rating - right.rating;
    }

    return left.globalId - right.globalId;
  });

  const sortedIds = new Uint32Array(totalPositions);
  const sortedRatings = new Uint16Array(totalPositions);

  for (let index = 0; index < sortedEntries.length; index += 1) {
    sortedIds[index] = sortedEntries[index].globalId;
    sortedRatings[index] = sortedEntries[index].rating;
  }

  const manifest = {
    files: partFiles,
    counts,
    totalPositions,
  };

  await fs.writeFile(
    path.join(GENERATED_DIR, 'manifest.json'),
    JSON.stringify(manifest),
  );
  await fs.writeFile(
    path.join(GENERATED_DIR, 'ratings.bin'),
    Buffer.from(ratings.buffer),
  );
  await fs.writeFile(
    path.join(GENERATED_DIR, 'sorted-ids.bin'),
    Buffer.from(sortedIds.buffer),
  );
  await fs.writeFile(
    path.join(GENERATED_DIR, 'sorted-ratings.bin'),
    Buffer.from(sortedRatings.buffer),
  );

  const histogram = new Map();
  for (const entry of sortedEntries) {
    const bucket = Math.floor(entry.rating / 100) * 100;
    histogram.set(bucket, (histogram.get(bucket) ?? 0) + 1);
  }

  console.log('Rating distribution (100-point buckets):');
  for (const [bucket, count] of [...histogram.entries()].sort(
    (left, right) => left[0] - right[0],
  )) {
    console.log(`${bucket}-${bucket + 99}: ${count}`);
  }

  console.log(`Done. Indexed ${totalPositions.toLocaleString()} positions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
