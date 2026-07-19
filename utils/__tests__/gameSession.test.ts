import { createGameSession, getNextGameSession } from '../gameSession';

describe('game session', () => {
  it('uses every position once before starting a new deck', () => {
    const random = () => 0;
    let session = createGameSession(3, random);
    const shownIndexes = [session.currentPositionIndex];

    session = getNextGameSession(session, 3, 7, random);
    shownIndexes.push(session.currentPositionIndex);
    session = getNextGameSession(session, 3, 7, random);
    shownIndexes.push(session.currentPositionIndex);

    expect(new Set(shownIndexes)).toEqual(new Set([0, 1, 2]));
    expect(session.remainingPositionIndexes).toHaveLength(0);
  });

  it('updates accumulated statistics when moving to the next position', () => {
    const session = createGameSession(2, () => 0);
    const nextSession = getNextGameSession(session, 2, 10, () => 0);

    expect(nextSession).toMatchObject({
      completedPositions: 1,
      correctGuesses: 1,
      totalPoints: 10,
    });
  });
});
