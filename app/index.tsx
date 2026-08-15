import { Board, EvaluationSlider, ResultCue } from '@/components';
import { StandardButton } from '@/components/common';
import { EvaluationResultModal } from '@/components/EvaluationResultModal';
import { CategoryLabels } from '@/const/categories';
import { getCategoryDifference } from '@/utils/categories';
import { getEngineCategory } from '@/utils/evaluation';
import {
  GameSession,
  PositionIndex,
  createInitialGameSession,
  getNextGameSession,
} from '@/utils/gameSession';
import {
  loadGameSession,
  saveGameSession,
  migrateLegacyRating,
} from '@/utils/gameStorage';
import { calculateRatingChange, STARTING_RATING } from '@/utils/rating';
import {
  loadPositionIndex,
  loadPositionByRef,
} from '@/utils/positionService';
import { Position } from '@/positions/types';
import {
  DevSettings,
  DEFAULT_DEV_SETTINGS,
  getEffectiveRating,
} from '@/utils/devSettings';
import {
  loadDevSettings,
  saveDevSettings,
} from '@/utils/devSettingsStorage';
import { DevSettingsPanel } from '@/components/DevSettingsPanel/DevSettingsPanel';
import { useCallback, useEffect, useState } from 'react';
import { Text, View, ScrollView, ActivityIndicator } from 'react-native';

export default function Index() {
  const [positionIndex, setPositionIndex] = useState<PositionIndex | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [devSettings, setDevSettings] = useState<DevSettings>(DEFAULT_DEV_SETTINGS);

  const [selectedValueOnSlider, setSelectedValueOnSlider] = useState(0);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [isResultCueVisible, setIsResultCueVisible] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Initialize and load saved state on mount
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const loadedIndex = await loadPositionIndex();
        const loadedDevSettings = await loadDevSettings();

        if (!isMounted) return;

        setPositionIndex(loadedIndex);
        setDevSettings(loadedDevSettings);

        const savedSession = await loadGameSession(
          loadedIndex.manifest.files.length,
          (fileIndex) => loadedIndex.manifest.counts[fileIndex],
        );

        if (!isMounted) return;

        if (savedSession) {
          const migratedRating = migrateLegacyRating(savedSession.rating);
          setSession({
            ...savedSession,
            rating: migratedRating,
          });
        } else {
          const selectionRating = getEffectiveRating(STARTING_RATING, loadedDevSettings);
          const newSession = createInitialGameSession(loadedIndex, selectionRating);
          setSession(newSession);
        }
      } catch (error) {
        console.error('Failed to initialize application:', error);
      } finally {
        if (isMounted) {
          setIsDataLoaded(true);
        }
      }
    }

    void initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save session when it changes
  useEffect(() => {
    if (isDataLoaded && session) {
      void saveGameSession(session);
    }
  }, [isDataLoaded, session]);

  // Save dev settings when they change
  const handleDevSettingsChange = useCallback(async (newSettings: DevSettings) => {
    setDevSettings(newSettings);
    await saveDevSettings(newSettings);
  }, []);

  // Load current position when session reference changes
  useEffect(() => {
    if (!session?.currentPositionRef) {
      return;
    }

    let isMounted = true;

    async function fetchPosition() {
      try {
        const pos = await loadPositionByRef(session.currentPositionRef);
        if (isMounted) {
          setCurrentPosition(pos);
        }
      } catch (error) {
        console.error('Failed to load current position:', error);
      }
    }

    void fetchPosition();

    return () => {
      isMounted = false;
    };
  }, [session?.currentPositionRef]);

  const showResultModal = useCallback(() => {
    setIsResultCueVisible(false);
    setIsResultModalVisible(true);
  }, []);

  const goToNextPosition = () => {
    if (!session || !positionIndex) return;

    const engineEvaluation = currentPosition?.evals[0]?.pvs[0];
    const engineCategory = getEngineCategory(engineEvaluation);
    const userEvalCategory =
      CategoryLabels[
        `${selectedValueOnSlider}Category` as keyof typeof CategoryLabels
      ];
    const categoryDifference = getCategoryDifference(
      userEvalCategory,
      engineCategory,
    );

    const ratingChange = calculateRatingChange(
      session.rating,
      session.currentPositionRating,
      categoryDifference,
    );

    const nextRating = session.rating + ratingChange;
    const selectionRating = getEffectiveRating(nextRating, devSettings);

    setSession((currentSession) => {
      if (!currentSession) return null;
      return getNextGameSession(
        currentSession,
        positionIndex,
        ratingChange,
        categoryDifference === 0,
        selectionRating,
      );
    });

    setSelectedValueOnSlider(0);
    setIsResultModalVisible(false);
    setIsAnswerSubmitted(false);
  };

  if (!isDataLoaded || !session || !currentPosition || !positionIndex) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={{ marginTop: 12 }}>Loading game data…</Text>
      </View>
    );
  }

  const engineEvaluation = currentPosition.evals[0]?.pvs[0];
  const engineCategory = getEngineCategory(engineEvaluation);
  const userEvalCategory =
    CategoryLabels[
      `${selectedValueOnSlider}Category` as keyof typeof CategoryLabels
    ];
  const categoryDifference = getCategoryDifference(
    userEvalCategory,
    engineCategory,
  );

  const ratingChange = calculateRatingChange(
    session.rating,
    session.currentPositionRating,
    categoryDifference,
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
      }}
    >
      <Board fen={currentPosition.fen} />

      <Text style={{ marginTop: 20 }}>
        Rating: {session.rating} · Positions: {session.completedPositions} ·
        Exact guesses: {session.correctGuesses}
      </Text>

      <View style={{ marginTop: 40, width: '100%', alignItems: 'center' }}>
        <EvaluationSlider
          setValue={setSelectedValueOnSlider}
          value={selectedValueOnSlider}
        />

        <StandardButton
          style={{ marginTop: 30, width: '100%', maxWidth: 300 }}
          disabled={isAnswerSubmitted}
          onPress={() => {
            setIsAnswerSubmitted(true);
            setIsResultCueVisible(true);
          }}
        >
          Evaluate
        </StandardButton>
      </View>

      <EvaluationResultModal
        engineCategory={engineCategory}
        engineEvaluation={engineEvaluation}
        onNext={goToNextPosition}
        ratingChange={ratingChange}
        userEvalCategory={userEvalCategory}
        visible={isResultModalVisible}
        playerRating={session.rating}
        positionRating={session.currentPositionRating}
      />

      <ResultCue
        onComplete={showResultModal}
        ratingChange={ratingChange}
        visible={isResultCueVisible}
      />

      <DevSettingsPanel
        devSettings={devSettings}
        onChange={handleDevSettingsChange}
        sessionRating={session.rating}
      />
    </ScrollView>
  );
}
