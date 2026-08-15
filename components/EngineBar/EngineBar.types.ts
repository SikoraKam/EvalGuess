export interface EngineBarProps {
  /** The player's current bucket, drawn as a tick across the bar. */
  guessCategory: number;
  /** Engine evaluation in pawns, or `null` while it is still hidden. */
  enginePawns: number | null;
  /** Text under the middle of the bar: the engine value, or a prompt. */
  caption: string;
  /** Supplied only when the bar itself is the input, so it accepts touches. */
  onPickCategory?: (category: number) => void;
}
