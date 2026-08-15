/**
 * Single source of truth for the 11 evaluation buckets.
 *
 * Engine scores in the dataset are always from White's point of view, so a
 * positive value means White is better regardless of whose turn it is.
 *
 * A position falls into bucket `sign(v) * k` where `k` is the number of
 * thresholds that `|v|` reaches. The boundaries are therefore symmetric:
 * both -8.00 and +8.00 sit in the outermost bucket on their side.
 */
export const CATEGORY_THRESHOLDS = [0.5, 1.5, 3, 5, 8] as const;

const MAGNITUDE_LABELS = [
  'Equal',
  'Slight edge',
  'Moderate edge',
  'Clear edge',
  'Decisive',
  'Crushing',
] as const;

export const MIN_CATEGORY = -CATEGORY_THRESHOLDS.length;
export const MAX_CATEGORY = CATEGORY_THRESHOLDS.length;

export type EvaluationSide = 'white' | 'black' | 'none';

export interface EvaluationCategory {
  value: number;
  label: string;
  range: string;
  /** The magnitude on its own ("Slight edge"), for compact bucket tiles. */
  magnitudeLabel: string;
  side: EvaluationSide;
}

function buildLabel(value: number): string {
  const name = MAGNITUDE_LABELS[Math.abs(value)];

  if (value === 0) {
    return name;
  }

  return `${name} for ${value > 0 ? 'White' : 'Black'}`;
}

function formatBound(pawns: number): string {
  return `${pawns > 0 ? '+' : '–'}${Math.abs(pawns).toFixed(2)}`;
}

function buildRange(value: number): string {
  const magnitude = Math.abs(value);
  const sign = value < 0 ? -1 : 1;

  if (magnitude === MAX_CATEGORY) {
    const bound = CATEGORY_THRESHOLDS[magnitude - 1] * sign;
    return `${sign > 0 ? '≥' : '≤'} ${formatBound(bound)}`;
  }

  const upper = CATEGORY_THRESHOLDS[magnitude] - 0.01;

  if (value === 0) {
    return `${formatBound(-upper)} … ${formatBound(upper)}`;
  }

  const lower = CATEGORY_THRESHOLDS[magnitude - 1];

  return sign > 0
    ? `${formatBound(lower)} … ${formatBound(upper)}`
    : `${formatBound(-upper)} … ${formatBound(-lower)}`;
}

export const EVALUATION_CATEGORIES: readonly EvaluationCategory[] = Array.from(
  { length: MAX_CATEGORY * 2 + 1 },
  (_, offset) => {
    const value = offset + MIN_CATEGORY;

    return {
      value,
      label: buildLabel(value),
      range: buildRange(value),
      magnitudeLabel: MAGNITUDE_LABELS[Math.abs(value)],
      side: value === 0 ? 'none' : value > 0 ? 'white' : 'black',
    };
  },
);

const CATEGORIES_BY_VALUE = new Map(
  EVALUATION_CATEGORIES.map((category) => [category.value, category]),
);

export function getCategory(value: number): EvaluationCategory {
  const category = CATEGORIES_BY_VALUE.get(value);

  if (!category) {
    throw new Error(`Unknown evaluation category: ${value}`);
  }

  return category;
}

/** Bucket for an evaluation expressed in pawns, from White's point of view. */
export function getCategoryForPawns(pawns: number): number {
  const magnitude = CATEGORY_THRESHOLDS.filter(
    (threshold) => Math.abs(pawns) >= threshold,
  ).length;

  return magnitude > 0 && pawns < 0 ? -magnitude : magnitude;
}
