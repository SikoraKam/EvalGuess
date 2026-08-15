import {
  applyGuessResult,
  createEmptyBuckets,
  createInitialGameSession,
  GameSession,
  getNextGameSession,
} from '../gameSession';
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

  const DAY = '2026-01-01';

  /** An exact call on a "Slight edge for White" position, worth +20. */
  const exactGuess = {
    guessCategory: 1,
    engineCategory: 1,
    categoryDifference: 0,
    ratingChange: 20,
  };

  it('initializes game session correctly', () => {
    // random returning 0 picks the first candidate (rating 900)
    const session = createInitialGameSession(index, 1000, () => 0, DAY);

    expect(session).toEqual({
      mode: 'rated',
      rating: 1000,
      completedPositions: 0,
      correctGuesses: 0,
      currentPositionRef: { fileIndex: 0, lineIndex: 0 },
      currentPositionRating: 900,
      recentPositionKeys: ['0:0'],
      currentStreak: 0,
      bestStreak: 0,
      totalCategoryError: 0,
      ratingHistory: [1000],
      bucketAttempts: createEmptyBuckets(),
      bucketExact: createEmptyBuckets(),
      recentGuesses: [],
      dayKey: DAY,
      solvedToday: 0,
      dailySolved: 0,
      lastResult: null,
    });
  });

  it('updates session and selects next position correctly', () => {
    const session = createInitialGameSession(index, 1000, () => 0, DAY);

    const nextSession = getNextGameSession(
      session,
      index,
      exactGuess,
      1000,
      () => 0.5,
      DAY,
    );

    expect(nextSession).toEqual({
      mode: 'rated',
      rating: 1020,
      completedPositions: 1,
      correctGuesses: 1,
      currentPositionRef: { fileIndex: 0, lineIndex: 1 },
      currentPositionRating: 1000,
      recentPositionKeys: ['0:1', '0:0'],
      currentStreak: 1,
      bestStreak: 1,
      totalCategoryError: 0,
      ratingHistory: [1000, 1020],
      bucketAttempts: [0, 1, 0, 0, 0, 0],
      bucketExact: [0, 1, 0, 0, 0, 0],
      recentGuesses: [{ ...exactGuess, rating: 1020 }],
      dayKey: DAY,
      solvedToday: 1,
      // Only a daily run fills the daily set, and the answer is behind us.
      dailySolved: 0,
      lastResult: null,
    });
  });

  it('keeps the best streak after the current one is broken', () => {
    let session = createInitialGameSession(index, 1000, () => 0, DAY);

    for (let round = 0; round < 3; round += 1) {
      session = getNextGameSession(
        session,
        index,
        exactGuess,
        1000,
        () => 0,
        DAY,
      );
    }

    session = getNextGameSession(
      session,
      index,
      { ...exactGuess, categoryDifference: 2, ratingChange: -8 },
      1000,
      () => 0,
      DAY,
    );

    expect(session.currentStreak).toBe(0);
    expect(session.bestStreak).toBe(3);
    expect(session.totalCategoryError).toBe(2);
  });

  it('restarts the daily counter on a new day', () => {
    let session = createInitialGameSession(index, 1000, () => 0, DAY);

    session = getNextGameSession(
      session,
      index,
      exactGuess,
      1000,
      () => 0,
      DAY,
    );
    session = getNextGameSession(
      session,
      index,
      exactGuess,
      1000,
      () => 0,
      DAY,
    );

    expect(session.solvedToday).toBe(2);

    session = getNextGameSession(
      session,
      index,
      exactGuess,
      1000,
      () => 0,
      '2026-01-02',
    );

    expect(session.solvedToday).toBe(1);
    expect(session.dayKey).toBe('2026-01-02');
  });

  it('scores the answer without moving off the position', () => {
    const session = createInitialGameSession(index, 1000, () => 0, DAY);
    const answered = applyGuessResult(session, exactGuess, DAY);

    expect(answered).toMatchObject({
      rating: 1020,
      completedPositions: 1,
      currentStreak: 1,
      lastResult: exactGuess,
      currentPositionRef: session.currentPositionRef,
      currentPositionRating: session.currentPositionRating,
    });
  });

  it('clears the answer once the next position is chosen', () => {
    const session = createInitialGameSession(index, 1000, () => 0, DAY);
    const answered = applyGuessResult(session, exactGuess, DAY);
    const next = getNextGameSession(
      session,
      index,
      exactGuess,
      1000,
      () => 0.5,
      DAY,
    );

    expect(answered.lastResult).toEqual(exactGuess);
    expect(next.lastResult).toBeNull();
  });

  it('fills the daily set only while the run is a daily one', () => {
    let session: GameSession = {
      ...createInitialGameSession(index, 1000, () => 0, DAY),
      mode: 'daily',
    };

    session = getNextGameSession(
      session,
      index,
      exactGuess,
      1000,
      () => 0,
      DAY,
    );
    session = getNextGameSession(
      session,
      index,
      exactGuess,
      1000,
      () => 0,
      DAY,
    );

    expect(session.dailySolved).toBe(2);
    expect(session.solvedToday).toBe(2);

    session = getNextGameSession(
      { ...session, mode: 'rated' },
      index,
      exactGuess,
      1000,
      () => 0,
      DAY,
    );

    expect(session.dailySolved).toBe(2);
    expect(session.solvedToday).toBe(3);
  });

  it('restarts the daily set on a new day', () => {
    let session: GameSession = {
      ...createInitialGameSession(index, 1000, () => 0, DAY),
      mode: 'daily',
    };

    session = getNextGameSession(
      session,
      index,
      exactGuess,
      1000,
      () => 0,
      DAY,
    );
    session = getNextGameSession(
      session,
      index,
      exactGuess,
      1000,
      () => 0,
      '2026-01-02',
    );

    expect(session.dailySolved).toBe(1);
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
      { ...exactGuess, categoryDifference: 1, ratingChange: 10 },
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
      session = getNextGameSession(
        session,
        index,
        { ...exactGuess, categoryDifference: 3, ratingChange: -30 },
        1000,
        () => 0,
      );
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
