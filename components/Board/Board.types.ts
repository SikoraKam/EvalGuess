import { Color, PieceSymbol, Square } from 'chess.js';

export interface BoardProps {
  fen: string;
  /** Width of the whole board in points. */
  size: number;
  flipped?: boolean;
  /** Squares to highlight, e.g. the move being replayed. */
  highlightedSquares?: readonly Square[];
}

export type BoardSquare = {
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null;
