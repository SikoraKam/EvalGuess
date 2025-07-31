import { FC } from 'react';
import { PieceProps } from './Piece.types';
import { Image } from 'expo-image';
import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const PIECES = {
  br: require('../../assets/images/br.png'),
  bp: require('../../assets/images/bp.png'),
  bn: require('../../assets/images/bn.png'),
  bb: require('../../assets/images/bb.png'),
  bq: require('../../assets/images/bq.png'),
  bk: require('../../assets/images/bk.png'),
  wr: require('../../assets/images/wr.png'),
  wn: require('../../assets/images/wn.png'),
  wb: require('../../assets/images/wb.png'),
  wq: require('../../assets/images/wq.png'),
  wk: require('../../assets/images/wk.png'),
  wp: require('../../assets/images/wp.png'),
};

export const Piece: FC<PieceProps> = ({ name }) => {
  return <Image source={PIECES[name]} style={styles.piece} />;
};

const styles = StyleSheet.create({
  piece: {
    width: width / 8,
    height: width / 8,
  },
});
