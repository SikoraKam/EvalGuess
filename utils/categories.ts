import { getCategory } from '@/const/categories';

export const getCategoryLabel = (value: number): string =>
  getCategory(value).label;

export const getCategoryRange = (value: number): string =>
  getCategory(value).range;

/** How many buckets apart the guess and the engine are. */
export const getCategoryDifference = (
  userCategory: number,
  engineCategory: number,
): number => Math.abs(userCategory - engineCategory);
