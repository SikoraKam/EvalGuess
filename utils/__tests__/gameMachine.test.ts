import { Position } from '@/positions/types';
import {
  gameReducer,
  getGuessOutcome,
  GameState,
  INITIAL_GAME_STATE,
} from '../gameMachine';
import { GameSession } from '../gameSession';
import { PositionIndex } from '../positionSelection';

const index = {
  manifest: { files: ['part_0'], counts: [2], totalPositions: 2 },
  ratings: new Uint16Array([1000, 1100]),
  sortedIds: new Uint32Array([0, 1]),
  sortedRatings: new Uint16Array([1000, 1100]),
} satisfies PositionIndex;

const session: GameSession = {
  rating: 1000,
  completedPositions: 0,
  correctGuesses: 0,
  currentPositionRef: { fileIndex: 0, lineIndex: 0 },
  currentPositionRating: 1000,
  recentPositionKeys: ['0:0'],
};

const position: Position = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -',
  evals: [{ depth: 40, knodes: 1, pvs: [{ cp: 220, line: 'e2e4 e7e5' }] }],
};

function readyState(): GameState {
  const initialized = gameReducer(INITIAL_GAME_STATE, {
    type: 'initialized',
    index,
    session,
  });

  return gameReducer(initialized, {
    type: 'positionLoaded',
    position,
    ref: session.currentPositionRef,
  });
}

describe('game phases', () => {
  it('starts by loading', () => {
    expect(INITIAL_GAME_STATE.phase).toBe('loading');
  });

  it('walks guess -> cue -> result -> review', () => {
    let state = readyState();
    expect(state.phase).toBe('guessing');

    state = gameReducer(state, { type: 'submitted' });
    expect(state.phase).toBe('cue');

    state = gameReducer(state, { type: 'cueFinished' });
    expect(state.phase).toBe('result');

    state = gameReducer(state, { type: 'reviewOpened' });
    expect(state.phase).toBe('review');
    expect(state.reviewStep).toBe(-1);
  });

  it('refuses to submit before the position has arrived', () => {
    const state = gameReducer(
      gameReducer(INITIAL_GAME_STATE, { type: 'initialized', index, session }),
      { type: 'submitted' },
    );

    expect(state.phase).toBe('guessing');
  });

  it('ignores guess changes once the answer is in', () => {
    let state = gameReducer(readyState(), { type: 'guessChanged', guess: 3 });
    state = gameReducer(state, { type: 'submitted' });
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
    state = gameReducer(state, { type: 'submitted' });
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
});
