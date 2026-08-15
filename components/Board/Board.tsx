import { FC, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { BoardProps, BoardSquare } from './Board.types';
import { Piece } from '../Piece/Piece';
import { PieceName } from '../Piece/Piece.types';
import { Theme } from '@/const/theme';
import { useSettings } from '@/providers';

const BORDER_WIDTH = 1;
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function parseBoard(fen: string): BoardSquare[][] | null {
  try {
    return new Chess(fen).board();
  } catch {
    return null;
  }
}

export const Board: FC<BoardProps> = ({
  fen,
  size,
  flipped = false,
  highlightedSquares,
}) => {
  const { boardTheme, settings } = useSettings();
  const board = useMemo(() => parseBoard(fen), [fen]);
  // The 1px frame is drawn inside `size`, so the squares have to share what is
  // left or the last file is clipped by the rounded corner.
  const squareSize = (size - BORDER_WIDTH * 2) / 8;
  const highlighted = useMemo(
    () => new Set<Square>(highlightedSquares ?? []),
    [highlightedSquares],
  );

  if (!board) {
    return (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Text style={styles.fallbackText}>Position could not be read</Text>
      </View>
    );
  }

  const rows = flipped ? [...board].reverse() : board;

  return (
    <View style={[styles.board, { width: size, height: size }]}>
      {rows.map((row, rowIndex) => {
        const columns = flipped ? [...row].reverse() : row;
        const rankIndex = flipped ? 7 - rowIndex : rowIndex;

        return (
          <View style={styles.row} key={RANKS[rankIndex]}>
            {columns.map((square, columnIndex) => {
              const fileIndex = flipped ? 7 - columnIndex : columnIndex;
              const isLight = (rankIndex + fileIndex) % 2 === 0;
              const coordinateColor = isLight
                ? boardTheme.coordinateOnLight
                : boardTheme.coordinateOnDark;
              const name = `${FILES[fileIndex]}${RANKS[rankIndex]}` as Square;

              return (
                <View
                  key={name}
                  style={[
                    styles.square,
                    {
                      width: squareSize,
                      height: squareSize,
                      backgroundColor: isLight
                        ? boardTheme.light
                        : boardTheme.dark,
                    },
                  ]}
                >
                  {highlighted.has(name) && <View style={styles.highlight} />}

                  {square && (
                    <Piece
                      name={`${square.color}${square.type}` as PieceName}
                      size={squareSize}
                    />
                  )}

                  {settings.coordinates && columnIndex === 0 && (
                    <Text
                      style={[
                        styles.rank,
                        { color: coordinateColor, fontSize: squareSize * 0.2 },
                      ]}
                    >
                      {RANKS[rankIndex]}
                    </Text>
                  )}

                  {settings.coordinates && rowIndex === 7 && (
                    <Text
                      style={[
                        styles.file,
                        { color: coordinateColor, fontSize: squareSize * 0.2 },
                      ]}
                    >
                      {FILES[fileIndex]}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    borderRadius: Theme.board.radius,
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH,
    borderColor: Theme.colors.borderStrong,
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Theme.colors.accentHighlight,
    borderWidth: 2,
    borderColor: Theme.colors.accentBorderStrong,
  },
  rank: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontFamily: Theme.font.monoBold,
  },
  file: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    fontFamily: Theme.font.monoBold,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.board.radius,
  },
  fallbackText: {
    fontFamily: Theme.font.sans,
    color: Theme.colors.textMuted,
  },
});
