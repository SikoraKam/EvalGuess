export interface EnginePv {
  cp?: number;
  mate?: number;
  line: string;
}

export interface EngineEval {
  pvs: EnginePv[];
  knodes: number;
  depth: number;
}

export interface Position {
  fen: string;
  evals: EngineEval[];
}

export interface PositionRef {
  fileIndex: number;
  lineIndex: number;
}

export function positionRefKey(ref: PositionRef): string {
  return `${ref.fileIndex}:${ref.lineIndex}`;
}
