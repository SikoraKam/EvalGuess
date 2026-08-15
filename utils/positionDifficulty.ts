import { Position } from '@/positions/types';

export const MIN_POSITION_RATING = 600;
export const MAX_POSITION_RATING = 2400;

export function clampPositionRating(rating: number): number {
  return Math.round(
    Math.max(MIN_POSITION_RATING, Math.min(MAX_POSITION_RATING, rating)),
  );
}

export function estimatePositionRating(position: Position): number {
  const { evals } = position;

  if (evals.length === 0) {
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
