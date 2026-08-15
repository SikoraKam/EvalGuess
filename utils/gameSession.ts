import {
  Position,
  PositionRef,
  positionRefKey,
} from '@/positions/types';
import {
  createPositionIndex,
  loadPositionFromJsonLine,
  PositionIndex,
  selectPositionFromIndex,
  SelectedPosition,
  trackRecentPositionKey,
} from '@/utils/positionSelection';
import { STARTING_RATING } from '@/utils/rating';

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
  const selected = selectPositionFromIndex(
    index,
    selectionRating,
    [],
    random,
  );

  return createGameSessionFromSelection(selected, STARTING_RATING);
}

export function createGameSessionFromSelection(
  selected: SelectedPosition,
  rating = STARTING_RATING,
): GameSession {
  const key = positionRefKey(selected.ref);

  return {
    rating,
    completedPositions: 0,
    correctGuesses: 0,
    currentPositionRef: selected.ref,
    currentPositionRating: selected.rating,
    recentPositionKeys: [key],
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
  const nextRating = session.rating + ratingChange;
  const selected = selectPositionFromIndex(
    index,
    selectionRating,
    session.recentPositionKeys,
    random,
  );

  return {
    rating: nextRating,
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

export function isValidPositionRef(
  ref: PositionRef,
  fileCount: number,
  lineCountForFile: (fileIndex: number) => number,
): boolean {
  if (!Number.isInteger(ref.fileIndex) || !Number.isInteger(ref.lineIndex)) {
    return false;
  }

  if (ref.fileIndex < 0 || ref.fileIndex >= fileCount) {
    return false;
  }

  return ref.lineIndex >= 0 && ref.lineIndex < lineCountForFile(ref.fileIndex);
}

export { createPositionIndex, loadPositionFromJsonLine, PositionIndex };
