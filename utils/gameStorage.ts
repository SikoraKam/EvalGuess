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

    return isValidGameSession(session, positionCount) ? session : null;
  } catch {
    await AsyncStorage.removeItem(GAME_SESSION_KEY);
    return null;
  }
}

export function saveGameSession(session: GameSession) {
  return AsyncStorage.setItem(GAME_SESSION_KEY, JSON.stringify(session));
}

function isValidGameSession(
  value: unknown,
  positionCount: number,
): value is GameSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as GameSession;

  if (!Array.isArray(session.remainingPositionIndexes)) {
    return false;
  }

  const statValues = [
    session.completedPositions,
    session.correctGuesses,
    session.totalPoints,
  ];
  const indexes = [
    session.currentPositionIndex,
    ...session.remainingPositionIndexes,
  ];

  return (
    statValues.every((stat) => Number.isInteger(stat) && stat >= 0) &&
    indexes.every(
      (index) => Number.isInteger(index) && index >= 0 && index < positionCount,
    ) &&
    new Set(indexes).size === indexes.length
  );
}
