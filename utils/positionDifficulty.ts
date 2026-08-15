/**
 * Difficulty ratings are computed offline by scripts/build-position-index.js
 * and shipped in generated/ratings.bin, so the app only needs the bounds of
 * that scale.
 */
export const MIN_POSITION_RATING = 600;
export const MAX_POSITION_RATING = 2400;

export function clampPositionRating(rating: number): number {
  return Math.round(
    Math.max(MIN_POSITION_RATING, Math.min(MAX_POSITION_RATING, rating)),
  );
}
