import { Position } from '@/positions/types';
import {
  gameReducer,
  getGuessOutcome,
  getStoredOutcome,
  GameState,
  INITIAL_GAME_STATE,
  toGuessResult,
} from '../gameMachine';
import {
  applyGuessResult,
  createEmptyBuckets,
  GameSession,
  GuessResult,
} from '../gameSession';
import { PositionIndex } from '../positionSelection';

const index = {
  manifest: { files: ['part_0'], counts: [2], totalPositions: 2 },
  ratings: new Uint16Array([1000, 1100]),
  sortedIds: new Uint32Array([0, 1]),
  sortedRatings: new Uint16Array([1000, 1100]),
} satisfies PositionIndex;

const session: GameSession = {
  mode: 'rated',
  rating: 1000,
  completedPositions: 0,
  correctGuesses: 0,
  currentPositionRef: { fileIndex: 0, lineIndex: 0 },
  currentPositionRating: 1000,
  recentPositionKeys: ['0:0'],
  currentStreak: 0,
  bestStreak: 0,
  totalCategoryError: 0,
  ratingHistory: [1000],
  bucketAttempts: createEmptyBuckets(),
  bucketExact: createEmptyBuckets(),
  recentGuesses: [],
  dayKey: '2026-01-01',
  solvedToday: 0,
  dailySolved: 0,
  lastResult: null,
};

const position: Position = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -',
  evals: [{ depth: 40, knodes: 1, pvs: [{ cp: 220, line: 'e2e4 e7e5' }] }],
};

/** The result a guess of `guess` produces against the position above. */
function scored(guess: number, from: GameSession = session): GuessResult {
  const outcome = getGuessOutcome(
    position,
    guess,
    from.rating,
    from.currentPositionRating,
  )!;

  return toGuessResult(guess, outcome, from.mode);
}

function submit(state: GameState, guess: number): GameState {
  return gameReducer(state, {
    type: 'submitted',
    session: applyGuessResult(state.session!, scored(guess, state.session!)),
  });
}

function readyState(from: GameSession = session): GameState {
  const initialized = gameReducer(INITIAL_GAME_STATE, {
    type: 'initialized',
    index,
    session: from,
  });

  return gameReducer(initialized, {
    type: 'positionLoaded',
    position,
    ref: from.currentPositionRef,
  });
}

describe('game phases', () => {
  it('starts by loading', () => {
    expect(INITIAL_GAME_STATE.phase).toBe('loading');
  });

  it('walks guess -> cue -> result -> review', () => {
    let state = readyState();
    expect(state.phase).toBe('guessing');

    state = submit(state, 2);
    expect(state.phase).toBe('cue');

    state = gameReducer(state, { type: 'cueFinished' });
    expect(state.phase).toBe('result');

    state = gameReducer(state, { type: 'reviewOpened' });
    expect(state.phase).toBe('review');
    expect(state.reviewStep).toBe(-1);
  });

  it('refuses to submit before the position has arrived', () => {
    const loading = gameReducer(INITIAL_GAME_STATE, {
      type: 'initialized',
      index,
      session,
    });
    const state = gameReducer(loading, {
      type: 'submitted',
      session: applyGuessResult(session, scored(0)),
    });

    expect(state.phase).toBe('guessing');
    expect(state.session?.lastResult).toBeNull();
  });

  it('ignores guess changes once the answer is in', () => {
    let state = gameReducer(readyState(), { type: 'guessChanged', guess: 3 });
    state = submit(state, 3);
    state = gameReducer(state, { type: 'guessChanged', guess: -5 });

    expect(state.guess).toBe(3);
  });

  it('ignores a position that arrives after the player moved on', () => {
    const state = gameReducer(readyState(), {
      type: 'positionLoaded',
      position: { fen: 'stale', evals: [] },
      ref: { fileIndex: 9, lineIndex: 9 },
    });

    expect(state.position).toBe(position);
  });

  it('resets the guess and the board when advancing', () => {
    let state = gameReducer(readyState(), { type: 'guessChanged', guess: 4 });
    state = submit(state, 4);
    state = gameReducer(state, { type: 'cueFinished' });
    state = gameReducer(state, {
      type: 'advanced',
      session: {
        ...session,
        currentPositionRef: { fileIndex: 0, lineIndex: 1 },
      },
    });

    expect(state).toMatchObject({
      phase: 'guessing',
      guess: 0,
      position: null,
      reviewStep: -1,
    });
  });

  it('scores the answer into the session on submit, not on advance', () => {
    const state = submit(readyState(), 2);

    expect(state.session).toMatchObject({
      rating: 1016,
      completedPositions: 1,
      correctGuesses: 1,
      lastResult: { guessCategory: 2, categoryDifference: 0 },
      // The board has not moved on, so the same position is still on screen.
      currentPositionRef: session.currentPositionRef,
    });
  });

  it('reopens a saved answer on its result screen instead of re-asking it', () => {
    const answered = applyGuessResult(session, scored(4));
    const state = gameReducer(INITIAL_GAME_STATE, {
      type: 'initialized',
      index,
      session: answered,
    });

    expect(state.phase).toBe('result');
    expect(state.guess).toBe(4);
  });

  it('asks an unanswered position normally', () => {
    expect(readyState().phase).toBe('guessing');
    expect(readyState().guess).toBe(0);
  });

  it('keeps the mode across a switch without disturbing the phase', () => {
    const state = gameReducer(readyState(), {
      type: 'modeChanged',
      mode: 'endless',
    });

    expect(state.session?.mode).toBe('endless');
    expect(state.phase).toBe('guessing');
  });

  it('surfaces a failure and can be retried', () => {
    const failed = gameReducer(readyState(), {
      type: 'failed',
      message: 'network down',
    });

    expect(failed).toMatchObject({
      phase: 'error',
      errorMessage: 'network down',
    });
    expect(gameReducer(failed, { type: 'retrying' })).toEqual(
      INITIAL_GAME_STATE,
    );
  });
});

describe('scoring a guess', () => {
  it('scores against the deepest evaluation', () => {
    const outcome = getGuessOutcome(position, 2, 1000, 1000);

    expect(outcome).toMatchObject({
      engineCategory: 2,
      categoryDifference: 0,
      isExact: true,
      ratingChange: 16,
    });
  });

  it('penalises a guess that is far off', () => {
    const outcome = getGuessOutcome(position, -5, 1000, 1000);

    expect(outcome?.categoryDifference).toBe(7);
    expect(outcome?.ratingChange).toBeLessThan(0);
  });

  it('has nothing to score without a position', () => {
    expect(getGuessOutcome(null, 0, 1000, 1000)).toBeNull();
  });

  it('leaves the rating alone in endless mode', () => {
    const outcome = getGuessOutcome(position, 2, 1000, 1000)!;

    expect(toGuessResult(2, outcome, 'endless').ratingChange).toBe(0);
    expect(toGuessResult(2, outcome, 'daily').ratingChange).toBe(16);
  });

  it('replays a stored answer exactly as it was scored', () => {
    const result = scored(-5);
    const stored = getStoredOutcome(position, result);

    expect(stored).toMatchObject({
      engineCategory: 2,
      categoryDifference: 7,
      ratingChange: result.ratingChange,
      isExact: false,
      depth: 40,
    });
  });

  it('has nothing stored for an unanswered position', () => {
    expect(getStoredOutcome(position, null)).toBeNull();
  });
});
