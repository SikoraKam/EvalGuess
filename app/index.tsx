import { Board } from '@/components/Board/Board';
import { positionsExample } from '@/positions/positionExample';
import { Chess } from 'chess.js';
import { Text, View } from 'react-native';

export default function Index() {
  const position = positionsExample[1];

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Board fen={position.fen} />
    </View>
  );
}
