import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidPositionRef, PositionRef } from '@/positions/types';
import { GameSession } from '@/utils/gameSession';
import { clampPlayerRating, STARTING_RATING } from '@/utils/rating';

const GAME_SESSION_KEY = 'evalguess/game-session';

/**
 * 1 (implicit): `totalPoints` counter starting at 0, or an unbounded Elo that
 *   could sink to zero and below.
 * 2: clamped Elo rating, stamped so the migration below runs exactly once.
 */
const SCHEMA_VERSION = 2;

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

  return {
    rating,
    completedPositions,
    correctGuesses,
    currentPositionRef,
    currentPositionRating,
    recentPositionKeys,
  };
}

function getCounter(value: unknown): number | null {
  if (value === undefined) {
    return 0;
  }

  return Number.isInteger(value) && (value as number) >= 0
    ? (value as number)
    : null;
}

/**
 * Runs at most once per install: anything without a schema version is read on
 * the old scale, converted, and then written back stamped as current.
 */
function getMigratedRating(session: LegacySession): number | null {
  if (session.schemaVersion === SCHEMA_VERSION) {
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
