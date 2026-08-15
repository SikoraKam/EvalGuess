export type SideToMove = 'w' | 'b';

export function getSideToMove(fen: string): SideToMove {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w';
}
