export interface BoardHeaderProps {
  sideToMove: 'w' | 'b';
  onToggleFlip: () => void;
  width: number;
}
