import { Chess, Square } from 'chess.js';

export interface ReplayStep {
  /** Position after the move was played. */
  fen: string;
  san: string;
  from: Square;
  to: Square;
  /** 1-based ply number, used to build the "1. e4 e5" move list. */
  ply: number;
}

export interface LineReplay {
  startFen: string;
  steps: ReplayStep[];
}

/**
 * Turns a UCI principal variation ("f7g7 e6e2 …") into positions that can be
 * stepped through. A malformed or illegal tail is dropped rather than
 * discarding the whole line.
 */
export function buildLineReplay(startFen: string, line: string): LineReplay {
  const steps: ReplayStep[] = [];

  let chess: Chess;

  try {
    chess = new Chess(startFen);
  } catch {
    return { startFen, steps };
  }

  const moves = line.trim().split(/\s+/).filter(Boolean);

  for (const [index, uci] of moves.entries()) {
    if (uci.length < 4) {
      break;
    }

    try {
      const move = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci[4] : undefined,
      });

      steps.push({
        fen: chess.fen(),
        san: move.san,
        from: move.from,
        to: move.to,
        ply: index + 1,
      });
    } catch {
      break;
    }
  }

  return { startFen, steps };
}

/**
 * Prefix for a ply in a move list: "1." before White's moves, "1..." only when
 * the line opens with Black, and nothing for Black's later moves.
 */
export function formatMoveNumber(
  ply: number,
  startsWithBlack: boolean,
): string | null {
  const isWhiteMove = startsWithBlack ? ply % 2 === 0 : ply % 2 === 1;
  const moveNumber = startsWithBlack
    ? Math.floor(ply / 2) + 1
    : Math.floor((ply + 1) / 2);

  if (isWhiteMove) {
    return `${moveNumber}.`;
  }

  return ply === 1 ? `${moveNumber}...` : null;
}
