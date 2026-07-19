export interface EngineEvaluation {
  cp?: number;
  mate?: number;
}

export function getEngineCategory(evaluation: EngineEvaluation | undefined) {
  if (!evaluation) {
    return 0;
  }

  if (evaluation.mate !== undefined) {
    return evaluation.mate > 0 ? 5 : -5;
  }

  const value = (evaluation.cp ?? 0) / 100;

  if (value <= -8) return -5;
  if (value <= -5) return -4;
  if (value <= -3) return -3;
  if (value <= -1.5) return -2;
  if (value <= -0.5) return -1;
  if (value < 0.5) return 0;
  if (value < 1.5) return 1;
  if (value < 3) return 2;
  if (value < 5) return 3;
  if (value < 8) return 4;

  return 5;
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
