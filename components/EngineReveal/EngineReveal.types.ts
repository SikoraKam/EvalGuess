export interface EngineRevealProps {
  /** Where the counter lands, in pawns from White's point of view. */
  targetPawns: number;
  /** Search depth behind the evaluation, shown above the counter. */
  depth?: number;
  onComplete: () => void;
}
