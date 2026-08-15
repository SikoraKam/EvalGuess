export const STARTING_RATING = 1000;
export const DEFAULT_K_FACTOR = 32;

/**
 * Elo has no natural floor, and without one a long losing streak drifts the
 * player below the difficulty range of the whole position pool.
 */
export const MIN_PLAYER_RATING = 400;
export const MAX_PLAYER_RATING = 3000;

export function clampPlayerRating(rating: number): number {
  return Math.round(
    Math.max(MIN_PLAYER_RATING, Math.min(MAX_PLAYER_RATING, rating)),
  );
}

export function guessScore(categoryDifference: number): number {
  if (categoryDifference <= 0) {
    return 1;
  }

  if (categoryDifference === 1) {
    return 0.75;
  }

  if (categoryDifference === 2) {
    return 0.5;
  }

  if (categoryDifference === 3) {
    return 0.25;
  }

  return 0;
}

export function expectedScore(
  playerRating: number,
  positionRating: number,
): number {
  return 1 / (1 + 10 ** ((positionRating - playerRating) / 400));
}

export function calculateRatingChange(
  playerRating: number,
  positionRating: number,
  categoryDifference: number,
  kFactor = DEFAULT_K_FACTOR,
): number {
  const score = guessScore(categoryDifference);
  const expected = expectedScore(playerRating, positionRating);

  return Math.round(kFactor * (score - expected));
}

export function formatRatingChange(ratingChange: number): string {
  return `${ratingChange > 0 ? '+' : ''}${ratingChange}`;
}
