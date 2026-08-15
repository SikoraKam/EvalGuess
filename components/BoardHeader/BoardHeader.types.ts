import { SideToMove } from '@/utils/fen';

export interface BoardHeaderProps {
  sideToMove: SideToMove;
  /** Full-move number from the FEN; hidden when the FEN does not carry one. */
  moveNumber?: number | null;
  onToggleFlip: () => void;
  width: number;
}
