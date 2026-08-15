import AsyncStorage from '@react-native-async-storage/async-storage';
import { PositionRef } from '@/positions/types';
import { GameSession } from '@/utils/gameSession';
import { STARTING_RATING } from '@/utils/rating';

const GAME_SESSION_KEY = 'evalguess/game-session';

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
  return AsyncStorage.setItem(GAME_SESSION_KEY, JSON.stringify(session));
}

function getValidGameSession(
  value: unknown,
  fileCount: number,
  lineCountForFile: (fileIndex: number) => number,
): GameSession | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const session = value as Partial<GameSession> & {
    totalPoints?: unknown;
    currentPositionIndex?: unknown;
    remainingPositionIndexes?: unknown;
  };

  const rating = getRating(session);

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

  const currentPositionRating = session.currentPositionRating;

  if (
    typeof currentPositionRating !== 'number' ||
    !Number.isFinite(currentPositionRating)
  ) {
    return null;
  }

  const counterValues = [session.completedPositions, session.correctGuesses];

  if (
    !counterValues.every((stat) => Number.isInteger(stat) && stat >= 0) ||
    !Number.isInteger(rating)
  ) {
    return null;
  }

  const recentPositionKeys = Array.isArray(session.recentPositionKeys)
    ? session.recentPositionKeys.filter(
        (key): key is string => typeof key === 'string',
      )
    : [];

  return {
    rating,
    completedPositions: session.completedPositions ?? 0,
    correctGuesses: session.correctGuesses ?? 0,
    currentPositionRef,
    currentPositionRating,
    recentPositionKeys,
  };
}

function getRating(
  session: Partial<GameSession> & { totalPoints?: unknown },
) {
  if (typeof session.rating === 'number') {
    return session.rating;
  }

  return typeof session.totalPoints === 'number' ? session.totalPoints : null;
}

function getPositionRef(value: unknown): PositionRef | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const ref = value as PositionRef;

  if (
    typeof ref.fileIndex !== 'number' ||
    typeof ref.lineIndex !== 'number'
  ) {
    return null;
  }

  return ref;
}

function isValidPositionRef(
  ref: PositionRef,
  fileCount: number,
  lineCountForFile: (fileIndex: number) => number,
): boolean {
  if (!Number.isInteger(ref.fileIndex) || !Number.isInteger(ref.lineIndex)) {
    return false;
  }

  if (ref.fileIndex < 0 || ref.fileIndex >= fileCount) {
    return false;
  }

  return ref.lineIndex >= 0 && ref.lineIndex < lineCountForFile(ref.fileIndex);
}

export function migrateLegacyRating(rating: number): number {
  if (rating <= 0) {
    return STARTING_RATING + rating;
  }

  return rating;
}
