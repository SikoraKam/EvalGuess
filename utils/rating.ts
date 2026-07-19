const DEFAULT_K_FACTOR = 12;
const NEUTRAL_CATEGORY_DIFFERENCE = 2.5;

export function calculateRatingChange(
  categoryDifference: number,
  kFactor = DEFAULT_K_FACTOR,
): number {
  return Math.round(
    kFactor * (1 - categoryDifference / NEUTRAL_CATEGORY_DIFFERENCE),
  );
}

export function formatRatingChange(ratingChange: number): string {
  return `${ratingChange > 0 ? '+' : ''}${ratingChange}`;
}
