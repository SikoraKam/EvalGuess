import {
  createInitialGameSession,
  getNextGameSession,
} from '../gameSession';

describe('game session', () => {
  const manifest = {
    files: ['part_0.jsonl'],
    counts: [3],
    totalPositions: 3,
  };

  // Three positions: 0 (rating 900), 1 (rating 1000), 2 (rating 1100)
  const ratings = new Uint16Array([900, 1000, 1100]);
  const sortedIds = new Uint32Array([0, 1, 2]);
  const sortedRatings = new Uint16Array([900, 1000, 1100]);

  const index = {
    manifest,
    ratings,
    sortedIds,
    sortedRatings,
  };

  it('initializes game session correctly', () => {
    // Starting rating: 1000
    // Candidate range: 850 - 1150 (all 3 positions are candidates)
    // random returning 0 picks sorted index 0 (rating 900)
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
    const session = createInitialGameSession(index, 1000, () => 0); // selected position 0 (900)

    // Move to next position: exact guess, ratingChange = +20, new selection rating = 1000
    // random returning 0.5 picks sorted index 1 (rating 1000)
    const nextSession = getNextGameSession(session, index, 20, true, 1000, () => 0.5);

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
    const session = createInitialGameSession(index, 1000, () => 0); // selected 0:0, rating 900

    // Try to select next position. Since 0:0 is in recent keys, we want to select something else.
    let randomCallCount = 0;
    const mockRandom = () => {
      randomCallCount++;
      if (randomCallCount === 1) {
        return 0; // index 0 (0:0) which is already seen
      }
      return 0.5; // index 1 (0:1) which is not seen
    };

    const nextSession = getNextGameSession(session, index, 10, false, 1000, mockRandom);

    expect(nextSession.currentPositionRef).toEqual({ fileIndex: 0, lineIndex: 1 });
    expect(nextSession.recentPositionKeys).toContain('0:1');
    expect(nextSession.recentPositionKeys).toContain('0:0');
  });
});
