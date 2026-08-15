import { FC, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { BoardProps, BoardSquare } from './Board.types';
import { Piece } from '../Piece/Piece';
import { PieceName } from '../Piece/Piece.types';
import { Theme } from '@/const/theme';

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
  const board = useMemo(() => parseBoard(fen), [fen]);
  const squareSize = size / 8;
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
    <View style={{ width: size, height: size }}>
      {rows.map((row, rowIndex) => {
        const columns = flipped ? [...row].reverse() : row;
        const rankIndex = flipped ? 7 - rowIndex : rowIndex;

        return (
          <View style={styles.row} key={RANKS[rankIndex]}>
            {columns.map((square, columnIndex) => {
              const fileIndex = flipped ? 7 - columnIndex : columnIndex;
              const isLight = (rankIndex + fileIndex) % 2 === 0;
              const coordinateColor = isLight
                ? Theme.colors.boardCoordinateOnLight
                : Theme.colors.boardCoordinateOnDark;
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
                        ? Theme.colors.boardLight
                        : Theme.colors.boardDark,
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

                  {columnIndex === 0 && (
                    <Text
                      style={[
                        styles.rank,
                        { color: coordinateColor, fontSize: squareSize * 0.22 },
                      ]}
                    >
                      {RANKS[rankIndex]}
                    </Text>
                  )}

                  {rowIndex === 7 && (
                    <Text
                      style={[
                        styles.file,
                        { color: coordinateColor, fontSize: squareSize * 0.22 },
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
    backgroundColor: '#ffe082aa',
  },
  rank: {
    position: 'absolute',
    top: 1,
    left: 2,
    fontWeight: '700',
  },
  file: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    fontWeight: '700',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
  },
  fallbackText: {
    color: Theme.colors.textMuted,
  },
});
