export type SideToMove = 'w' | 'b';

export function getSideToMove(fen: string): SideToMove {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w';
}

/** The full-move number, or `null` when the FEN omits or mangles it. */
export function getMoveNumber(fen: string): number | null {
  const moveNumber = Number(fen.split(' ')[5]);

  return Number.isInteger(moveNumber) && moveNumber > 0 ? moveNumber : null;
}
