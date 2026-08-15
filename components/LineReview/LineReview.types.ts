import { LineReplay } from '@/utils/lineReplay';

export interface LineReviewProps {
  replay: LineReplay;
  /** -1 shows the starting position, 0..n-1 shows the position after a move. */
  stepIndex: number;
  onStepChange: (stepIndex: number) => void;
  startsWithBlack: boolean;
  width: number;
}
