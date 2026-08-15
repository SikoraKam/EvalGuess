import { PositionRef, positionRefKey } from '@/positions/types';

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

const BASE_SELECTION_WINDOW = 150;
const MAX_SELECTION_WINDOW = 1800;
/** Widen the window until the pool is large enough to stay varied. */
const MIN_CANDIDATES = 200;
const MAX_SELECTION_ATTEMPTS = 40;
const RECENT_POSITION_LIMIT = 60;

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

interface CandidateRange {
  startIndex: number;
  endIndex: number;
}

/**
 * The pool thins out towards both ends of the difficulty scale, so a fixed
 * window would serve strong players the same handful of positions forever.
 */
export function findCandidateRange(
  sortedRatings: Uint16Array,
  playerRating: number,
): CandidateRange {
  const fullRange = {
    startIndex: 0,
    endIndex: sortedRatings.length - 1,
  };

  for (
    let window = BASE_SELECTION_WINDOW;
    window <= MAX_SELECTION_WINDOW;
    window *= 2
  ) {
    const startIndex = findFirstIndexAtOrAbove(
      sortedRatings,
      playerRating - window,
    );
    const endIndex = findLastIndexAtOrBelow(
      sortedRatings,
      playerRating + window,
    );

    if (endIndex - startIndex + 1 >= MIN_CANDIDATES) {
      return { startIndex, endIndex };
    }
  }

  return fullRange;
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
  const { startIndex, endIndex } = findCandidateRange(
    index.sortedRatings,
    playerRating,
  );

  const toSelection = (sortedIndex: number): SelectedPosition => {
    const globalId = index.sortedIds[sortedIndex];

    return {
      ref: globalIdToRef(index.manifest, globalId),
      rating: index.ratings[globalId],
    };
  };

  for (let attempt = 0; attempt < MAX_SELECTION_ATTEMPTS; attempt += 1) {
    const selection = toSelection(
      pickRandomIndex(startIndex, endIndex, random),
    );

    if (!recentKeys.has(positionRefKey(selection.ref))) {
      return selection;
    }
  }

  return toSelection(pickRandomIndex(startIndex, endIndex, random));
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
