import { createInitialGameSession, getNextGameSession } from '../gameSession';
import { findCandidateRange, PositionIndex } from '../positionSelection';
import { MIN_PLAYER_RATING } from '../rating';

describe('game session', () => {
  const manifest = {
    files: ['part_0.jsonl'],
    counts: [3],
    totalPositions: 3,
  };

  // Three positions: 0 (rating 900), 1 (rating 1000), 2 (rating 1100)
  const index: PositionIndex = {
    manifest,
    ratings: new Uint16Array([900, 1000, 1100]),
    sortedIds: new Uint32Array([0, 1, 2]),
    sortedRatings: new Uint16Array([900, 1000, 1100]),
  };

  it('initializes game session correctly', () => {
    // random returning 0 picks the first candidate (rating 900)
    const session = createInitialGameSession(index, 1000, () => 0);

    expect(session).toEqual({
      rating: 1000,
      completedPositions: 0,
      correctGuesses: 0,
      currentPositionRef: { fileIndex: 0, lineIndex: 0 },
      currentPositionRating: 900,
      recentPositionKeys: ['0:0'],
    });
  });

  it('updates session and selects next position correctly', () => {
    const session = createInitialGameSession(index, 1000, () => 0);

    const nextSession = getNextGameSession(
      session,
      index,
      20,
      true,
      1000,
      () => 0.5,
    );

    expect(nextSession).toEqual({
      rating: 1020,
      completedPositions: 1,
      correctGuesses: 1,
      currentPositionRef: { fileIndex: 0, lineIndex: 1 },
      currentPositionRating: 1000,
      recentPositionKeys: ['0:1', '0:0'],
    });
  });

  it('avoids recently seen positions', () => {
    const session = createInitialGameSession(index, 1000, () => 0);

    let call = 0;
    const mockRandom = () => {
      call += 1;
      return call === 1 ? 0 : 0.5;
    };

    const nextSession = getNextGameSession(
      session,
      index,
      10,
      false,
      1000,
      mockRandom,
    );

    expect(nextSession.currentPositionRef).toEqual({
      fileIndex: 0,
      lineIndex: 1,
    });
    expect(nextSession.recentPositionKeys).toEqual(['0:1', '0:0']);
  });

  it('does not let a losing streak sink the rating below the pool', () => {
    let session = createInitialGameSession(index, 1000, () => 0);

    for (let round = 0; round < 200; round += 1) {
      session = getNextGameSession(session, index, -30, false, 1000, () => 0);
    }

    expect(session.rating).toBe(MIN_PLAYER_RATING);
  });
});

describe('findCandidateRange', () => {
  // 4000 positions spread evenly over 600-2400, the shape the index now has.
  const sortedRatings = new Uint16Array(
    Array.from({ length: 4000 }, (_, index) =>
      Math.round(600 + (index / 3999) * 1800),
    ),
  );

  it('keeps the window tight when the pool is dense', () => {
    const { startIndex, endIndex } = findCandidateRange(sortedRatings, 1500);
    const count = endIndex - startIndex + 1;

    expect(count).toBeGreaterThanOrEqual(200);
    expect(sortedRatings[startIndex]).toBeGreaterThanOrEqual(1350);
    expect(sortedRatings[endIndex]).toBeLessThanOrEqual(1650);
  });

  it('widens rather than starving a player at the edge of the scale', () => {
    const sparse = new Uint16Array([600, 700, 800, 2350, 2400]);
    const { startIndex, endIndex } = findCandidateRange(sparse, 2400);

    expect(endIndex - startIndex + 1).toBe(sparse.length);
  });

  it('never returns an empty range', () => {
    for (const rating of [0, 600, 1000, 2400, 5000]) {
      const { startIndex, endIndex } = findCandidateRange(
        sortedRatings,
        rating,
      );

      expect(endIndex).toBeGreaterThanOrEqual(startIndex);
    }
  });
});
