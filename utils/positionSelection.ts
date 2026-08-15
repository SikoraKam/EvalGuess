import { Position, PositionRef } from '@/positions/types';
import {
  MAX_POSITION_RATING,
  MIN_POSITION_RATING,
} from '@/utils/positionDifficulty';

export interface PositionManifest {
  files: string[];
  counts: number[];
  totalPositions: number;
}

export interface PositionIndex {
  manifest: PositionManifest;
  ratings: Uint16Array;
  sortedIds: Uint32Array;
  sortedRatings: Uint16Array;
}

export interface SelectedPosition {
  ref: PositionRef;
  rating: number;
}

type Random = () => number;

const POSITION_SELECTION_WINDOW = 150;
const MAX_SELECTION_ATTEMPTS = 40;
const RECENT_POSITION_LIMIT = 12;

function globalIdToRef(
  manifest: PositionManifest,
  globalId: number,
): PositionRef {
  let remaining = globalId;

  for (let fileIndex = 0; fileIndex < manifest.counts.length; fileIndex += 1) {
    const count = manifest.counts[fileIndex];

    if (remaining < count) {
      return { fileIndex, lineIndex: remaining };
    }

    remaining -= count;
  }

  throw new Error(`Invalid global position id: ${globalId}`);
}

function findFirstIndexAtOrAbove(
  sortedRatings: Uint16Array,
  minRating: number,
): number {
  let low = 0;
  let high = sortedRatings.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (sortedRatings[mid] < minRating) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function findLastIndexAtOrBelow(
  sortedRatings: Uint16Array,
  maxRating: number,
): number {
  let low = 0;
  let high = sortedRatings.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (sortedRatings[mid] <= maxRating) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

function pickRandomIndex(
  startIndex: number,
  endIndex: number,
  random: Random,
): number {
  return startIndex + Math.floor(random() * (endIndex - startIndex + 1));
}

export function selectPositionFromIndex(
  index: PositionIndex,
  playerRating: number,
  recentPositionKeys: string[],
  random: Random = Math.random,
): SelectedPosition {
  const recentKeys = new Set(recentPositionKeys);
  const minRating = Math.max(
    MIN_POSITION_RATING,
    playerRating - POSITION_SELECTION_WINDOW,
  );
  const maxRating = Math.min(
    MAX_POSITION_RATING,
    playerRating + POSITION_SELECTION_WINDOW,
  );

  let startIndex = findFirstIndexAtOrAbove(index.sortedRatings, minRating);
  let endIndex = findLastIndexAtOrBelow(index.sortedRatings, maxRating);

  if (startIndex > endIndex || endIndex < 0) {
    startIndex = 0;
    endIndex = index.sortedRatings.length - 1;
  }

  for (let attempt = 0; attempt < MAX_SELECTION_ATTEMPTS; attempt += 1) {
    const sortedIndex = pickRandomIndex(startIndex, endIndex, random);
    const globalId = index.sortedIds[sortedIndex];
    const ref = globalIdToRef(index.manifest, globalId);
    const key = `${ref.fileIndex}:${ref.lineIndex}`;

    if (!recentKeys.has(key)) {
      return {
        ref,
        rating: index.ratings[globalId],
      };
    }
  }

  const fallbackIndex = pickRandomIndex(startIndex, endIndex, random);
  const globalId = index.sortedIds[fallbackIndex];

  return {
    ref: globalIdToRef(index.manifest, globalId),
    rating: index.ratings[globalId],
  };
}

export function trackRecentPositionKey(
  recentPositionKeys: string[],
  key: string,
): string[] {
  return [key, ...recentPositionKeys].slice(0, RECENT_POSITION_LIMIT);
}

export function createPositionIndex(
  manifest: PositionManifest,
  ratingsBuffer: ArrayBuffer,
  sortedIdsBuffer: ArrayBuffer,
  sortedRatingsBuffer: ArrayBuffer,
): PositionIndex {
  return {
    manifest,
    ratings: new Uint16Array(ratingsBuffer),
    sortedIds: new Uint32Array(sortedIdsBuffer),
    sortedRatings: new Uint16Array(sortedRatingsBuffer),
  };
}

export async function loadPositionFromJsonLine(line: string): Promise<Position> {
  return JSON.parse(line) as Position;
}
