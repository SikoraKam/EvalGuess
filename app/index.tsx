import { Board, EvaluationSlider } from '@/components';
import { StandardButton } from '@/components/common';
import { EvaluationResultModal } from '@/components/EvaluationResultModal';
import { CategoryLabels } from '@/const/categories';
import { positionsExample } from '@/positions/positionExample';
import {
  getCategoryDifference,
  getPointsBasedOnCategoryDifference,
} from '@/utils/categories';
import { getEngineCategory } from '@/utils/evaluation';
import { createGameSession, getNextGameSession } from '@/utils/gameSession';
import { loadGameSession, saveGameSession } from '@/utils/gameStorage';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function Index() {
  const [session, setSession] = useState(() =>
    createGameSession(positionsExample.length),
  );
  const [selectedValueOnSlider, setSelectedValueOnSlider] = useState(0);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  const position = positionsExample[session.currentPositionIndex];
  const engineEvaluation = position.evals[0]?.pvs[0];
  const engineCategory = getEngineCategory(engineEvaluation);
  const userEvalCategory =
    CategoryLabels[
      `${selectedValueOnSlider}Category` as keyof typeof CategoryLabels
    ];
  const points = getPointsBasedOnCategoryDifference(
    getCategoryDifference(userEvalCategory, engineCategory),
  );

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const savedSession = await loadGameSession(positionsExample.length);

      if (!isMounted) {
        return;
      }

      if (savedSession) {
        setSession(savedSession);
      }

      setIsSessionLoaded(true);
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isSessionLoaded) {
      void saveGameSession(session);
    }
  }, [isSessionLoaded, session]);

  const closeResultModal = () => setIsResultModalVisible(false);

  const goToNextPosition = () => {
    setSession((currentSession) =>
      getNextGameSession(currentSession, positionsExample.length, points),
    );
    setSelectedValueOnSlider(0);
    closeResultModal();
  };

  if (!isSessionLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading saved progress…</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
      }}
    >
      <Board fen={position.fen} />

      <Text style={{ marginTop: 20 }}>
        Points: {session.totalPoints} · Positions: {session.completedPositions}{' '}
        · Exact guesses: {session.correctGuesses}
      </Text>

      <View style={{ marginTop: 40 }}>
        <EvaluationSlider
          setValue={setSelectedValueOnSlider}
          value={selectedValueOnSlider}
        />

        <StandardButton
          style={{ marginTop: 30 }}
          onPress={() => setIsResultModalVisible(true)}
        >
          Evaluate
        </StandardButton>
      </View>

      <EvaluationResultModal
        engineEval={engineCategory}
        onClose={closeResultModal}
        onNext={goToNextPosition}
        userEvalCategory={userEvalCategory}
        visible={isResultModalVisible}
      />
    </View>
  );
}
