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
