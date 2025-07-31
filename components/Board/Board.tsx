import { FC, useMemo } from 'react';
import { BoardProps, BoardSquare } from './Board.types';
import { Chess } from 'chess.js';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Piece } from '../Piece/Piece';

const { width } = Dimensions.get('window');

export const Board: FC<BoardProps> = ({ fen }) => {
  const chess = useMemo(() => {
    return new Chess(fen);
  }, [fen]);

  const board = useMemo(() => {
    return chess.board();
  }, [chess]);

  const renderEmptySquare = (isSquareWhite: boolean) => (
    <View
      style={[
        styles.square,
        { backgroundColor: isSquareWhite ? '#e6fae3' : '#90d887' },
      ]}
    ></View>
  );

  const renderSquareWithPiece = (
    square: BoardSquare,
    isSquareWhite: boolean,
  ) => (
    <View
      style={[
        styles.square,
        { backgroundColor: isSquareWhite ? '#e6fae3' : '#90d887' },
      ]}
    >
      {square && <Piece name={`${square.color}${square.type}`} />}
    </View>
  );

  return (
    <View>
      {board.map((row, rowIndex) => (
        <View style={styles.rowContainer} key={rowIndex}>
          {row.map((square, columnIndex) => {
            const isSquareWhite = (rowIndex + columnIndex) % 2 === 0;
            return (
              <View key={columnIndex}>
                {!square
                  ? renderEmptySquare(isSquareWhite)
                  : renderSquareWithPiece(square, isSquareWhite)}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
  },
  square: {
    width: width / 8,
    height: width / 8,
  },
});
