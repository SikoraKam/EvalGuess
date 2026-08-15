import { MAX_CATEGORY, MIN_CATEGORY } from '@/const/categories';

/**
 * Geometry shared by everything that draws the evaluation axis: the slider,
 * the bucket grid and the engine bar all have to agree on where a bucket sits,
 * or the guess marker lands somewhere the player did not tap.
 */
const CATEGORY_SPAN = MAX_CATEGORY - MIN_CATEGORY;

/** Pawn value at which the engine bar is fully filled on one side. */
export const BAR_RANGE_IN_PAWNS = 6;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Position of a bucket along the axis, 0 (Black) to 1 (White). */
export function categoryToFraction(category: number): number {
  return (category - MIN_CATEGORY) / CATEGORY_SPAN;
}

/** The bucket nearest a point on the axis. */
export function fractionToCategory(fraction: number): number {
  return Math.round(clamp01(fraction) * CATEGORY_SPAN) + MIN_CATEGORY;
}

/** Position of an engine evaluation along the axis, saturating at the ends. */
export function pawnsToFraction(pawns: number): number {
  return clamp01(0.5 + pawns / (BAR_RANGE_IN_PAWNS * 2));
}
