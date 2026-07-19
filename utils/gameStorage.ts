import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameSession } from './gameSession';

const GAME_SESSION_KEY = 'evalguess/game-session';

export async function loadGameSession(
  positionCount: number,
): Promise<GameSession | null> {
  const serializedSession = await AsyncStorage.getItem(GAME_SESSION_KEY);

  if (!serializedSession) {
    return null;
  }

  try {
    const session = JSON.parse(serializedSession) as unknown;

    return getValidGameSession(session, positionCount);
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
  positionCount: number,
): GameSession | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const session = value as GameSession;

  if (!Array.isArray(session.remainingPositionIndexes)) {
    return null;
  }

  const rating = getRating(session);

  if (rating === null) {
    return null;
  }

  const counterValues = [session.completedPositions, session.correctGuesses];
  const indexes = [
    session.currentPositionIndex,
    ...session.remainingPositionIndexes,
  ];

  const isValid =
    counterValues.every((stat) => Number.isInteger(stat) && stat >= 0) &&
    Number.isInteger(rating) &&
    indexes.every(
      (index) => Number.isInteger(index) && index >= 0 && index < positionCount,
    ) &&
    new Set(indexes).size === indexes.length;

  return isValid ? { ...session, rating } : null;
}

function getRating(session: Partial<GameSession> & { totalPoints?: unknown }) {
  if (typeof session.rating === 'number') {
    return session.rating;
  }

  return typeof session.totalPoints === 'number' ? session.totalPoints : null;
}
