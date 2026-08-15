import { PositionRef, positionRefKey } from '@/positions/types';
import {
  PositionIndex,
  selectPositionFromIndex,
  SelectedPosition,
  trackRecentPositionKey,
} from '@/utils/positionSelection';
import { clampPlayerRating, STARTING_RATING } from '@/utils/rating';

export interface GameSession {
  rating: number;
  completedPositions: number;
  correctGuesses: number;
  currentPositionRef: PositionRef;
  currentPositionRating: number;
  recentPositionKeys: string[];
}

type Random = () => number;

export function createInitialGameSession(
  index: PositionIndex,
  selectionRating = STARTING_RATING,
  random: Random = Math.random,
): GameSession {
  const selected = selectPositionFromIndex(index, selectionRating, [], random);

  return createGameSessionFromSelection(selected, STARTING_RATING);
}

export function createGameSessionFromSelection(
  selected: SelectedPosition,
  rating = STARTING_RATING,
): GameSession {
  return {
    rating,
    completedPositions: 0,
    correctGuesses: 0,
    currentPositionRef: selected.ref,
    currentPositionRating: selected.rating,
    recentPositionKeys: [positionRefKey(selected.ref)],
  };
}

export function getNextGameSession(
  session: GameSession,
  index: PositionIndex,
  ratingChange: number,
  isExactGuess: boolean,
  selectionRating: number,
  random: Random = Math.random,
): GameSession {
  const selected = selectPositionFromIndex(
    index,
    selectionRating,
    session.recentPositionKeys,
    random,
  );

  return {
    rating: clampPlayerRating(session.rating + ratingChange),
    completedPositions: session.completedPositions + 1,
    correctGuesses: session.correctGuesses + (isExactGuess ? 1 : 0),
    currentPositionRef: selected.ref,
    currentPositionRating: selected.rating,
    recentPositionKeys: trackRecentPositionKey(
      session.recentPositionKeys,
      positionRefKey(selected.ref),
    ),
  };
}

export type { PositionIndex };
