import { Color, PieceSymbol, Square } from 'chess.js';

export interface BoardProps {
  fen: string;
}

export type BoardSquare = {
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null;
