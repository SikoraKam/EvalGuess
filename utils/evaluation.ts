import { getCategoryForPawns, MAX_CATEGORY } from '@/const/categories';
import { EngineEval, EnginePv, Position } from '@/positions/types';

export interface EngineEvaluation {
  cp?: number;
  mate?: number;
}

/**
 * Evaluations are stored best-first for the side to move, so the first pv of
 * the deepest analysis is the engine's verdict on the position.
 */
export function getDeepestEval(position: Position): EngineEval | undefined {
  if (position.evals.length === 0) {
    return undefined;
  }

  return position.evals.reduce((deepest, current) =>
    current.depth > deepest.depth ? current : deepest,
  );
}

export function getPrimaryEvaluation(position: Position): EnginePv | undefined {
  return getDeepestEval(position)?.pvs[0];
}

export function getEngineCategory(
  evaluation: EngineEvaluation | undefined,
): number {
  if (!evaluation) {
    return 0;
  }

  if (evaluation.mate !== undefined) {
    return evaluation.mate > 0 ? MAX_CATEGORY : -MAX_CATEGORY;
  }

  return getCategoryForPawns((evaluation.cp ?? 0) / 100);
}

/**
 * Evaluation in pawns, for the bar that draws it. A forced mate has no pawn
 * value, so it is reported as the far end of the bar on the winning side.
 */
export const MATE_IN_PAWNS = 12;

export function getEvaluationInPawns(
  evaluation: EngineEvaluation | undefined,
): number {
  if (!evaluation) {
    return 0;
  }

  if (evaluation.mate !== undefined) {
    return evaluation.mate > 0 ? MATE_IN_PAWNS : -MATE_IN_PAWNS;
  }

  return (evaluation.cp ?? 0) / 100;
}

export function formatEngineEvaluation(
  evaluation: EngineEvaluation | undefined,
): string {
  if (!evaluation) {
    return '0.00';
  }

  if (evaluation.mate !== undefined) {
    return `M${evaluation.mate > 0 ? '+' : '-'}${Math.abs(evaluation.mate)}`;
  }

  const evaluationInPawns = (evaluation.cp ?? 0) / 100;
  const sign = evaluationInPawns > 0 ? '+' : '';

  return `${sign}${evaluationInPawns.toFixed(2)}`;
}
