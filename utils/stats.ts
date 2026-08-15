import { MAX_CATEGORY } from '@/const/categories';
import { GameMode, GameSession, getDayKey } from '@/utils/gameSession';

/** Positions in a daily set, and the target the home screen counts towards. */
export const DAILY_TARGET = 20;

/**
 * Display grouping for accuracy-by-bucket. The session tracks each magnitude
 * separately; the two most lopsided ones are shown together because they are
 * rare enough on their own to be noise.
 */
const BUCKET_ROWS: { name: string; magnitudes: number[] }[] = [
  { name: 'Equal', magnitudes: [0] },
  { name: 'Slight edge', magnitudes: [1] },
  { name: 'Moderate edge', magnitudes: [2] },
  { name: 'Clear edge', magnitudes: [3] },
  { name: 'Decisive+', magnitudes: [4, MAX_CATEGORY] },
];

/** Rating bands, used for the label under the player's name. */
const TITLES: { from: number; name: string }[] = [
  { from: 2200, name: 'Engine whisperer' },
  { from: 1800, name: 'Senior analyst' },
  { from: 1500, name: 'Analyst' },
  { from: 1200, name: 'Candidate analyst' },
  { from: 900, name: 'Apprentice' },
  { from: 0, name: 'Novice' },
];

export interface BucketAccuracy {
  name: string;
  attempts: number;
  exact: number;
  /** `null` until the bucket has been seen at least once. */
  percentage: number | null;
}

export interface SessionStats {
  mode: GameMode;
  rating: number;
  title: string;
  completedPositions: number;
  /** Share of exact calls, 0–100, or `null` before the first answer. */
  exactPercentage: number | null;
  /** Mean bucket distance, or `null` before the first answer. */
  averageError: number | null;
  currentStreak: number;
  bestStreak: number;
  /** Everything answered today, in any mode. */
  solvedToday: number;
  /** Answered positions of today's daily set only. */
  dailySolved: number;
  dailyTarget: number;
  dailyRemaining: number;
  dailyProgress: number;
  isDailyComplete: boolean;
  ratingHistory: number[];
  peakRating: number;
  /** Rating gained or lost across the stored history. */
  ratingTrend: number;
  buckets: BucketAccuracy[];
}

export function getTitleForRating(rating: number): string {
  return (
    TITLES.find((title) => rating >= title.from)?.name ??
    TITLES[TITLES.length - 1].name
  );
}

function sumAt(counts: number[], magnitudes: number[]): number {
  return magnitudes.reduce((total, index) => total + (counts[index] ?? 0), 0);
}

/**
 * A session that has not been touched today reports zero solved, so the daily
 * counter resets without needing anything to run at midnight.
 */
export function getSessionStats(
  session: GameSession,
  dayKey = getDayKey(),
): SessionStats {
  const { completedPositions, ratingHistory } = session;
  const isToday = session.dayKey === dayKey;
  const solvedToday = isToday ? session.solvedToday : 0;
  const dailySolved = Math.min(isToday ? session.dailySolved : 0, DAILY_TARGET);

  const buckets = BUCKET_ROWS.map(({ name, magnitudes }) => {
    const attempts = sumAt(session.bucketAttempts, magnitudes);
    const exact = sumAt(session.bucketExact, magnitudes);

    return {
      name,
      attempts,
      exact,
      percentage: attempts > 0 ? Math.round((100 * exact) / attempts) : null,
    };
  });

  const history = ratingHistory.length > 0 ? ratingHistory : [session.rating];

  return {
    mode: session.mode,
    rating: session.rating,
    title: getTitleForRating(session.rating),
    completedPositions,
    exactPercentage:
      completedPositions > 0
        ? Math.round((100 * session.correctGuesses) / completedPositions)
        : null,
    averageError:
      completedPositions > 0
        ? session.totalCategoryError / completedPositions
        : null,
    currentStreak: session.currentStreak,
    bestStreak: session.bestStreak,
    solvedToday,
    dailySolved,
    dailyTarget: DAILY_TARGET,
    dailyRemaining: DAILY_TARGET - dailySolved,
    dailyProgress: dailySolved / DAILY_TARGET,
    isDailyComplete: dailySolved >= DAILY_TARGET,
    ratingHistory: history,
    peakRating: Math.max(...history),
    ratingTrend: history[history.length - 1] - history[0],
    buckets,
  };
}
