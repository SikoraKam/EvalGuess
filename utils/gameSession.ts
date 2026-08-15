import { PositionRef, positionRefKey } from '@/positions/types';
import { MAX_CATEGORY } from '@/const/categories';
import {
  PositionIndex,
  selectPositionFromIndex,
  SelectedPosition,
  trackRecentPositionKey,
} from '@/utils/positionSelection';
import { clampPlayerRating, STARTING_RATING } from '@/utils/rating';

/** Kept short: the profile screen only ever shows the last few answers. */
const RECENT_GUESS_LIMIT = 12;
/** One point per answered position, which is what the profile chart plots. */
const RATING_HISTORY_LIMIT = 30;
/** Magnitudes 0…5, so accuracy can be broken down by how sharp the position was. */
const BUCKET_COUNT = MAX_CATEGORY + 1;

/**
 * `rated` is the open-ended run. `endless` plays the same positions and keeps
 * the same accuracy statistics, but the Elo is left alone — practice that
 * cannot cost anything. `daily` is a rated run bounded to a fixed number of
 * positions a day, so it can actually be finished.
 */
export type GameMode = 'rated' | 'endless' | 'daily';

/** The part of a finished guess the session needs to remember. */
export interface GuessResult {
  guessCategory: number;
  engineCategory: number;
  categoryDifference: number;
  ratingChange: number;
}

export interface GuessRecord extends GuessResult {
  /** Player rating *after* the guess, so the profile can list a running total. */
  rating: number;
}

export interface GameSession {
  /** Part of the session, so a run survives a restart as the mode it started in. */
  mode: GameMode;
  rating: number;
  completedPositions: number;
  correctGuesses: number;
  currentPositionRef: PositionRef;
  currentPositionRating: number;
  recentPositionKeys: string[];
  /** Consecutive exact calls, reset by anything else. */
  currentStreak: number;
  bestStreak: number;
  /** Summed bucket distance, divided by `completedPositions` for average error. */
  totalCategoryError: number;
  ratingHistory: number[];
  /** Indexed by |engine category|: how many were seen, and how many were exact. */
  bucketAttempts: number[];
  bucketExact: number[];
  recentGuesses: GuessRecord[];
  /** Local `YYYY-MM-DD` the daily counters belong to. */
  dayKey: string;
  solvedToday: number;
  /** Answered positions of today's daily set, which the other modes leave alone. */
  dailySolved: number;
  /**
   * The answer already scored against the current position, or `null` while it
   * is still unanswered. Scoring on submit rather than on "next" is what keeps
   * a result that is read but never advanced past.
   */
  lastResult: GuessResult | null;
}

type Random = () => number;

export function getDayKey(date: Date = new Date()): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

export function createEmptyBuckets(): number[] {
  return new Array<number>(BUCKET_COUNT).fill(0);
}

export function createInitialGameSession(
  index: PositionIndex,
  selectionRating = STARTING_RATING,
  random: Random = Math.random,
  dayKey = getDayKey(),
): GameSession {
  const selected = selectPositionFromIndex(index, selectionRating, [], random);

  return createGameSessionFromSelection(selected, STARTING_RATING, dayKey);
}

export function createGameSessionFromSelection(
  selected: SelectedPosition,
  rating = STARTING_RATING,
  dayKey = getDayKey(),
): GameSession {
  return {
    mode: 'rated',
    rating,
    completedPositions: 0,
    correctGuesses: 0,
    currentPositionRef: selected.ref,
    currentPositionRating: selected.rating,
    recentPositionKeys: [positionRefKey(selected.ref)],
    currentStreak: 0,
    bestStreak: 0,
    totalCategoryError: 0,
    ratingHistory: [rating],
    bucketAttempts: createEmptyBuckets(),
    bucketExact: createEmptyBuckets(),
    recentGuesses: [],
    dayKey,
    solvedToday: 0,
    dailySolved: 0,
    lastResult: null,
  };
}

function increment(counts: number[], index: number): number[] {
  const next = [...counts];
  next[index] += 1;

  return next;
}

/**
 * Scores the answer into the session while the position is still on screen.
 * The result screen is therefore already saved, and closing the app on it
 * costs the player nothing.
 */
export function applyGuessResult(
  session: GameSession,
  result: GuessResult,
  dayKey = getDayKey(),
): GameSession {
  const rating = clampPlayerRating(session.rating + result.ratingChange);
  const isExact = result.categoryDifference === 0;
  const currentStreak = isExact ? session.currentStreak + 1 : 0;
  const bucket = Math.min(Math.abs(result.engineCategory), MAX_CATEGORY);
  const isSameDay = session.dayKey === dayKey;
  const dailySolved = isSameDay ? session.dailySolved : 0;

  return {
    ...session,
    rating,
    completedPositions: session.completedPositions + 1,
    correctGuesses: session.correctGuesses + (isExact ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(session.bestStreak, currentStreak),
    totalCategoryError: session.totalCategoryError + result.categoryDifference,
    ratingHistory: [...session.ratingHistory, rating].slice(
      -RATING_HISTORY_LIMIT,
    ),
    bucketAttempts: increment(session.bucketAttempts, bucket),
    bucketExact: isExact
      ? increment(session.bucketExact, bucket)
      : session.bucketExact,
    recentGuesses: [{ ...result, rating }, ...session.recentGuesses].slice(
      0,
      RECENT_GUESS_LIMIT,
    ),
    dayKey,
    solvedToday: isSameDay ? session.solvedToday + 1 : 1,
    dailySolved: dailySolved + (session.mode === 'daily' ? 1 : 0),
    lastResult: result,
  };
}

/** Moves on to a fresh position; the answer behind it is already scored. */
export function selectNextPosition(
  session: GameSession,
  index: PositionIndex,
  selectionRating: number,
  random: Random = Math.random,
): GameSession {
  const selected = selectPositionFromIndex(
    index,
    selectionRating,
    session.recentPositionKeys,
    random,
  );

  return {
    ...session,
    currentPositionRef: selected.ref,
    currentPositionRating: selected.rating,
    recentPositionKeys: trackRecentPositionKey(
      session.recentPositionKeys,
      positionRefKey(selected.ref),
    ),
    lastResult: null,
  };
}

/** Both halves of a turn at once, which is how a full turn reads in tests. */
export function getNextGameSession(
  session: GameSession,
  index: PositionIndex,
  result: GuessResult,
  selectionRating: number,
  random: Random = Math.random,
  dayKey = getDayKey(),
): GameSession {
  return selectNextPosition(
    applyGuessResult(session, result, dayKey),
    index,
    selectionRating,
    random,
  );
}

export type { PositionIndex };
