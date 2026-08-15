import { GameSession } from '../gameSession';
import { DAILY_TARGET, getSessionStats, getTitleForRating } from '../stats';

const DAY = '2026-01-01';

function sessionWith(overrides: Partial<GameSession>): GameSession {
  return {
    mode: 'daily',
    rating: 1200,
    completedPositions: 30,
    correctGuesses: 12,
    currentPositionRef: { fileIndex: 0, lineIndex: 0 },
    currentPositionRating: 1200,
    recentPositionKeys: [],
    currentStreak: 2,
    bestStreak: 5,
    totalCategoryError: 21,
    ratingHistory: [1000, 1100, 1200],
    bucketAttempts: [10, 8, 6, 4, 1, 1],
    bucketExact: [6, 3, 2, 1, 0, 0],
    recentGuesses: [],
    dayKey: DAY,
    solvedToday: 9,
    dailySolved: 5,
    lastResult: null,
    ...overrides,
  };
}

describe('session statistics', () => {
  it('reports the daily set as its own counter', () => {
    const stats = getSessionStats(sessionWith({}), DAY);

    expect(stats).toMatchObject({
      solvedToday: 9,
      dailySolved: 5,
      dailyTarget: DAILY_TARGET,
      dailyRemaining: DAILY_TARGET - 5,
      isDailyComplete: false,
    });
    expect(stats.dailyProgress).toBeCloseTo(5 / DAILY_TARGET);
  });

  it('completes the set at the target', () => {
    const stats = getSessionStats(
      sessionWith({ dailySolved: DAILY_TARGET }),
      DAY,
    );

    expect(stats.isDailyComplete).toBe(true);
    expect(stats.dailyRemaining).toBe(0);
    expect(stats.dailyProgress).toBe(1);
  });

  /** Nothing runs at midnight, so a stale day key has to read as a fresh set. */
  it('unlocks a fresh set the next day', () => {
    const stats = getSessionStats(
      sessionWith({ dailySolved: DAILY_TARGET }),
      '2026-01-02',
    );

    expect(stats.isDailyComplete).toBe(false);
    expect(stats.dailySolved).toBe(0);
    expect(stats.solvedToday).toBe(0);
  });

  it('has no accuracy to report before the first answer', () => {
    const stats = getSessionStats(
      sessionWith({ completedPositions: 0, correctGuesses: 0 }),
      DAY,
    );

    expect(stats.exactPercentage).toBeNull();
    expect(stats.averageError).toBeNull();
  });

  it('names the rating band', () => {
    expect(getTitleForRating(2400)).toBe('Engine whisperer');
    expect(getTitleForRating(500)).toBe('Novice');
  });
});
