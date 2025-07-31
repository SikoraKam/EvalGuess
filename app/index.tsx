import { Board, EvaluationSlider } from '@/components';
import { StandardButton } from '@/components/common';
import { EvaluationResultModal } from '@/components/EvaluationResultModal';
import { CategoryLabels } from '@/const/categories';
import { positionsExample } from '@/positions/positionExample';
import { useState } from 'react';
import { View } from 'react-native';

export default function Index() {
  const position = positionsExample[1];

  const [selectedValueOnSlider, setSelectedValueOnSlider] = useState(0);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
      }}
    >
      <Board fen={position.fen} />

      <View style={{ marginTop: 40 }}>
        <EvaluationSlider
          setValue={setSelectedValueOnSlider}
          value={selectedValueOnSlider}
        />

        <StandardButton style={{ marginTop: 30 }}>Evaluate</StandardButton>
      </View>

      <EvaluationResultModal
        engineEval={4}
        onClose={() => null}
        points={4}
        userEval={CategoryLabels['-1Category']}
        visible
      />
    </View>
  );
}
