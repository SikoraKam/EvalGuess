export interface GameSession {
  completedPositions: number;
  correctGuesses: number;
  currentPositionIndex: number;
  remainingPositionIndexes: number[];
  totalPoints: number;
}

type Random = () => number;

export function createGameSession(
  positionCount: number,
  random: Random = Math.random,
): GameSession {
  if (positionCount < 1) {
    throw new Error('At least one position is required to start a game.');
  }

  const shuffledIndexes = shuffleIndexes(positionCount, random);

  return {
    completedPositions: 0,
    correctGuesses: 0,
    currentPositionIndex: shuffledIndexes[0],
    remainingPositionIndexes: shuffledIndexes.slice(1),
    totalPoints: 0,
  };
}

export function getNextGameSession(
  session: GameSession,
  positionCount: number,
  points: number,
  random: Random = Math.random,
): GameSession {
  const updatedStats = {
    completedPositions: session.completedPositions + 1,
    correctGuesses: session.correctGuesses + (points === 10 ? 1 : 0),
    totalPoints: session.totalPoints + points,
  };

  if (session.remainingPositionIndexes.length > 0) {
    const [currentPositionIndex, ...remainingPositionIndexes] =
      session.remainingPositionIndexes;

    return {
      ...updatedStats,
      currentPositionIndex,
      remainingPositionIndexes,
    };
  }

  const nextDeck = shuffleIndexes(positionCount, random);

  return {
    ...updatedStats,
    currentPositionIndex: nextDeck[0],
    remainingPositionIndexes: nextDeck.slice(1),
  };
}

function shuffleIndexes(positionCount: number, random: Random): number[] {
  const indexes = Array.from({ length: positionCount }, (_, index) => index);

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [indexes[index], indexes[randomIndex]] = [
      indexes[randomIndex],
      indexes[index],
    ];
  }

  return indexes;
}
