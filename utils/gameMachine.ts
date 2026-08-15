import { Position, PositionRef, positionRefKey } from '@/positions/types';
import { getCategoryDifference } from '@/utils/categories';
import {
  getDeepestEval,
  getEngineCategory,
  getPrimaryEvaluation,
} from '@/utils/evaluation';
import { GameMode, GameSession, GuessResult } from '@/utils/gameSession';
import { PositionIndex } from '@/utils/positionSelection';
import { calculateRatingChange } from '@/utils/rating';

/**
 * The screen used to track four independent booleans, which allowed states
 * like "result modal and cue both visible". One phase at a time makes the
 * flow explicit and testable.
 */
export type GamePhase =
  | 'loading'
  | 'error'
  | 'guessing'
  | 'cue'
  | 'result'
  | 'review';

export interface GameState {
  phase: GamePhase;
  errorMessage: string | null;
  index: PositionIndex | null;
  session: GameSession | null;
  position: Position | null;
  guess: number;
  /** -1 is the starting position, 0..n-1 the position after each move. */
  reviewStep: number;
}

export type GameAction =
  | { type: 'initialized'; index: PositionIndex; session: GameSession }
  | { type: 'failed'; message: string }
  | { type: 'retrying' }
  | { type: 'positionLoaded'; position: Position; ref: PositionRef }
  | { type: 'guessChanged'; guess: number }
  /** Carries the session with the answer already scored into it. */
  | { type: 'submitted'; session: GameSession }
  | { type: 'cueFinished' }
  | { type: 'reviewOpened' }
  | { type: 'reviewStepChanged'; step: number }
  | { type: 'modeChanged'; mode: GameMode }
  | { type: 'advanced'; session: GameSession };

export const INITIAL_GAME_STATE: GameState = {
  phase: 'loading',
  errorMessage: null,
  index: null,
  session: null,
  position: null,
  guess: 0,
  reviewStep: -1,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'initialized': {
      const answered = action.session.lastResult;

      return {
        ...state,
        // An answer that was scored but never advanced past comes back on its
        // result screen instead of being asked a second time.
        phase: answered ? 'result' : 'guessing',
        errorMessage: null,
        index: action.index,
        session: action.session,
        position: null,
        guess: answered?.guessCategory ?? 0,
        reviewStep: -1,
      };
    }

    case 'failed':
      return { ...state, phase: 'error', errorMessage: action.message };

    case 'retrying':
      return { ...INITIAL_GAME_STATE };

    case 'positionLoaded':
      // A slow response for a position we already moved past must be ignored.
      if (
        !state.session ||
        positionRefKey(state.session.currentPositionRef) !==
          positionRefKey(action.ref)
      ) {
        return state;
      }

      return { ...state, position: action.position };

    case 'guessChanged':
      return state.phase === 'guessing'
        ? { ...state, guess: action.guess }
        : state;

    case 'submitted':
      return state.phase === 'guessing' && state.position
        ? { ...state, phase: 'cue', session: action.session }
        : state;

    case 'cueFinished':
      return state.phase === 'cue' ? { ...state, phase: 'result' } : state;

    case 'reviewOpened':
      return state.phase === 'result'
        ? { ...state, phase: 'review', reviewStep: -1 }
        : state;

    case 'reviewStepChanged':
      return state.phase === 'review'
        ? { ...state, reviewStep: action.step }
        : state;

    case 'modeChanged':
      // The mode only decides how the *next* answer is scored, so switching
      // mid-position is harmless and does not disturb the phase.
      return state.session
        ? { ...state, session: { ...state.session, mode: action.mode } }
        : state;

    case 'advanced':
      return {
        ...state,
        phase: 'guessing',
        session: action.session,
        position: null,
        guess: 0,
        reviewStep: -1,
      };

    default:
      return state;
  }
}

export interface GuessOutcome {
  engineCategory: number;
  engineEvaluation: ReturnType<typeof getPrimaryEvaluation>;
  categoryDifference: number;
  ratingChange: number;
  isExact: boolean;
  /** Search depth behind the evaluation, for the reveal. */
  depth: number | null;
}

/** Single place the guess is scored, called once when the answer is locked in. */
export function getGuessOutcome(
  position: Position | null,
  guess: number,
  playerRating: number,
  positionRating: number,
): GuessOutcome | null {
  if (!position) {
    return null;
  }

  const engineEvaluation = getPrimaryEvaluation(position);
  const engineCategory = getEngineCategory(engineEvaluation);
  const categoryDifference = getCategoryDifference(guess, engineCategory);

  return {
    engineCategory,
    engineEvaluation,
    categoryDifference,
    depth: getDeepestEval(position)?.depth ?? null,
    ratingChange: calculateRatingChange(
      playerRating,
      positionRating,
      categoryDifference,
    ),
    isExact: categoryDifference === 0,
  };
}

/**
 * The scored answer the session carries, re-joined with the position it was
 * given for. Everything the result screen shows comes from here, so a session
 * restored from storage renders exactly what it showed before.
 */
export function getStoredOutcome(
  position: Position | null,
  result: GuessResult | null,
): GuessOutcome | null {
  if (!position || !result) {
    return null;
  }

  return {
    engineCategory: result.engineCategory,
    engineEvaluation: getPrimaryEvaluation(position),
    categoryDifference: result.categoryDifference,
    ratingChange: result.ratingChange,
    depth: getDeepestEval(position)?.depth ?? null,
    isExact: result.categoryDifference === 0,
  };
}

/** The result of the guess, as it should be written into the session. */
export function toGuessResult(
  guess: number,
  outcome: GuessOutcome,
  mode: GameMode,
): GuessResult {
  return {
    guessCategory: guess,
    engineCategory: outcome.engineCategory,
    categoryDifference: outcome.categoryDifference,
    // Endless practice cannot cost anything, so nothing is ever applied.
    ratingChange: mode === 'endless' ? 0 : outcome.ratingChange,
  };
}
