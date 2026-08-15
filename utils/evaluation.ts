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
