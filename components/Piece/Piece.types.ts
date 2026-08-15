import { Player, Type } from '@/main.types';

export type PieceName = `${Player}${Type}`;

export interface PieceProps {
  name: PieceName;
  size: number;
}
