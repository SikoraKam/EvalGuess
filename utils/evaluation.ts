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
