import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_CATEGORY } from '@/const/categories';
import { isValidPositionRef, PositionRef } from '@/positions/types';
import {
  createEmptyBuckets,
  GameMode,
  GameSession,
  getDayKey,
  GuessRecord,
  GuessResult,
} from '@/utils/gameSession';
import { clampPlayerRating, STARTING_RATING } from '@/utils/rating';

const GAME_SESSION_KEY = 'evalguess/game-session';

/**
 * 1 (implicit): `totalPoints` counter starting at 0, or an unbounded Elo that
 *   could sink to zero and below.
 * 2: clamped Elo rating, stamped so the migration below runs exactly once.
 * 3: streaks, rating history and per-bucket accuracy. A version 2 session is
 *   read as-is and simply starts those counters from empty.
 * 4: the game mode, the daily-set counter and the answer already scored
 *   against the current position. Older saves default to a rated run with an
 *   unanswered position, which is what they were.
 */
const SCHEMA_VERSION = 4;

const GAME_MODES: readonly GameMode[] = ['rated', 'endless', 'daily'];

/** From this version on, `rating` is already on the clamped Elo scale. */
const ELO_SCALE_VERSION = 2;

const BUCKET_COUNT = MAX_CATEGORY + 1;

type StoredSession = GameSession & { schemaVersion: number };

type LegacySession = Partial<StoredSession> & { totalPoints?: unknown };

export async function loadGameSession(
  fileCount: number,
  lineCountForFile: (fileIndex: number) => number,
): Promise<GameSession | null> {
  const serializedSession = await AsyncStorage.getItem(GAME_SESSION_KEY);

  if (!serializedSession) {
    return null;
  }

  try {
    const session = JSON.parse(serializedSession) as unknown;

    return getValidGameSession(session, fileCount, lineCountForFile);
  } catch {
    await AsyncStorage.removeItem(GAME_SESSION_KEY);
    return null;
  }
}

export function saveGameSession(session: GameSession) {
  const stored: StoredSession = { ...session, schemaVersion: SCHEMA_VERSION };

  return AsyncStorage.setItem(GAME_SESSION_KEY, JSON.stringify(stored));
}

export function clearGameSession() {
  return AsyncStorage.removeItem(GAME_SESSION_KEY);
}

export function getValidGameSession(
  value: unknown,
  fileCount: number,
  lineCountForFile: (fileIndex: number) => number,
): GameSession | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const session = value as LegacySession;
  const rating = getMigratedRating(session);

  if (rating === null) {
    return null;
  }

  const currentPositionRef = getPositionRef(session.currentPositionRef);

  if (
    !currentPositionRef ||
    !isValidPositionRef(currentPositionRef, fileCount, lineCountForFile)
  ) {
    return null;
  }

  const { currentPositionRating } = session;

  if (
    typeof currentPositionRating !== 'number' ||
    !Number.isFinite(currentPositionRating)
  ) {
    return null;
  }

  const completedPositions = getCounter(session.completedPositions);
  const correctGuesses = getCounter(session.correctGuesses);

  if (completedPositions === null || correctGuesses === null) {
    return null;
  }

  const recentPositionKeys = Array.isArray(session.recentPositionKeys)
    ? session.recentPositionKeys.filter(
        (key): key is string => typeof key === 'string',
      )
    : [];

  const currentStreak = getCounter(session.currentStreak) ?? 0;
  const ratingHistory = getNumberList(session.ratingHistory);

  return {
    mode: getMode(session.mode),
    rating,
    completedPositions,
    correctGuesses,
    currentPositionRef,
    currentPositionRating,
    recentPositionKeys,
    currentStreak,
    bestStreak: Math.max(getCounter(session.bestStreak) ?? 0, currentStreak),
    totalCategoryError: getCounter(session.totalCategoryError) ?? 0,
    ratingHistory: ratingHistory.length > 0 ? ratingHistory : [rating],
    bucketAttempts: getBuckets(session.bucketAttempts),
    bucketExact: getBuckets(session.bucketExact),
    recentGuesses: getRecentGuesses(session.recentGuesses),
    dayKey: typeof session.dayKey === 'string' ? session.dayKey : getDayKey(),
    solvedToday: getCounter(session.solvedToday) ?? 0,
    dailySolved: getCounter(session.dailySolved) ?? 0,
    lastResult: getGuessResult(session.lastResult),
  };
}

function getMode(value: unknown): GameMode {
  return GAME_MODES.includes(value as GameMode) ? (value as GameMode) : 'rated';
}

/**
 * Counters added after version 2 are missing from older payloads, so an absent
 * value is zero rather than a reason to discard the whole session. A present
 * but malformed value still fails, which is what the version 2 fields rely on.
 */
function getCounter(value: unknown): number | null {
  if (value === undefined) {
    return 0;
  }

  return Number.isInteger(value) && (value as number) >= 0
    ? (value as number)
    : null;
}

function getNumberList(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is number =>
          typeof entry === 'number' && Number.isFinite(entry),
      )
    : [];
}

function getBuckets(value: unknown): number[] {
  const counts = createEmptyBuckets();
  const stored = getNumberList(value);

  for (let index = 0; index < BUCKET_COUNT; index += 1) {
    const count = stored[index];

    if (Number.isInteger(count) && count >= 0) {
      counts[index] = count;
    }
  }

  return counts;
}

function isGuessResult(value: unknown): value is GuessResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Partial<GuessResult>;

  return (
    typeof result.guessCategory === 'number' &&
    typeof result.engineCategory === 'number' &&
    typeof result.categoryDifference === 'number' &&
    typeof result.ratingChange === 'number'
  );
}

function getRecentGuesses(value: unknown): GuessRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is GuessRecord =>
      isGuessResult(entry) &&
      typeof (entry as Partial<GuessRecord>).rating === 'number',
  );
}

/** A malformed answer is dropped, which simply re-asks the position. */
function getGuessResult(value: unknown): GuessResult | null {
  if (!isGuessResult(value)) {
    return null;
  }

  return {
    guessCategory: value.guessCategory,
    engineCategory: value.engineCategory,
    categoryDifference: value.categoryDifference,
    ratingChange: value.ratingChange,
  };
}

/**
 * Runs at most once per install: anything from before the Elo scale is read on
 * the old scale, converted, and then written back stamped as current.
 */
function getMigratedRating(session: LegacySession): number | null {
  const version = session.schemaVersion;

  if (typeof version === 'number' && version >= ELO_SCALE_VERSION) {
    return typeof session.rating === 'number' && Number.isFinite(session.rating)
      ? clampPlayerRating(session.rating)
      : null;
  }

  if (typeof session.totalPoints === 'number') {
    return clampPlayerRating(STARTING_RATING + session.totalPoints);
  }

  if (typeof session.rating !== 'number' || !Number.isFinite(session.rating)) {
    return null;
  }

  return clampPlayerRating(
    session.rating <= 0 ? STARTING_RATING + session.rating : session.rating,
  );
}

function getPositionRef(value: unknown): PositionRef | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const ref = value as PositionRef;

  if (typeof ref.fileIndex !== 'number' || typeof ref.lineIndex !== 'number') {
    return null;
  }

  return ref;
}
