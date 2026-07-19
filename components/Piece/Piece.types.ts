import { Player, Type } from '@/main.types';

export interface PieceProps {
  name: Piece;
}

type Piece = `${Player}${Type}`;
