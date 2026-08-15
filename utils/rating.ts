export const STARTING_RATING = 1000;
export const DEFAULT_K_FACTOR = 32;

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
