import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Board,
  BoardHeader,
  DevSettingsPanel,
  EvaluationResultModal,
  EvaluationSlider,
  LineReview,
  ResultCue,
  StatsBar,
  StatusScreen,
} from '@/components';
import { StandardButton } from '@/components/common';
import { Theme } from '@/const/theme';
import {
  gameReducer,
  getGuessOutcome,
  INITIAL_GAME_STATE,
} from '@/utils/gameMachine';
import {
  createInitialGameSession,
  getNextGameSession,
  GameSession,
} from '@/utils/gameSession';
import {
  clearGameSession,
  loadGameSession,
  saveGameSession,
} from '@/utils/gameStorage';
import {
  DEFAULT_DEV_SETTINGS,
  DevSettings,
  getEffectiveRating,
} from '@/utils/devSettings';
import { loadDevSettings, saveDevSettings } from '@/utils/devSettingsStorage';
import { getSideToMove } from '@/utils/fen';
import { buildLineReplay } from '@/utils/lineReplay';
import {
  loadPositionByRef,
  loadPositionIndex,
  prefetchPosition,
} from '@/utils/positionService';
import { STARTING_RATING } from '@/utils/rating';

const MAX_BOARD_SIZE = 420;

export default function Index() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);
  const [devSettings, setDevSettings] =
    useState<DevSettings>(DEFAULT_DEV_SETTINGS);
  const [flipped, setFlipped] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  /** Selected while the player reads the result, so "Next" feels instant. */
  const pendingSession = useRef<GameSession | null>(null);

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width - Theme.spacing.lg * 2, MAX_BOARD_SIZE);

  const { phase, session, position, index, guess, reviewStep } = state;

  useEffect(() => {
    let isActive = true;

    async function initialize() {
      try {
        const [loadedIndex, loadedDevSettings] = await Promise.all([
          loadPositionIndex(),
          loadDevSettings(),
        ]);

        if (!isActive) return;

        setDevSettings(loadedDevSettings);

        const savedSession = await loadGameSession(
          loadedIndex.manifest.files.length,
          (fileIndex) => loadedIndex.manifest.counts[fileIndex],
        );

        if (!isActive) return;

        dispatch({
          type: 'initialized',
          index: loadedIndex,
          session:
            savedSession ??
            createInitialGameSession(
              loadedIndex,
              getEffectiveRating(STARTING_RATING, loadedDevSettings),
            ),
        });
      } catch (error) {
        if (!isActive) return;

        dispatch({
          type: 'failed',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred.',
        });
      }
    }

    void initialize();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  const currentRef = session?.currentPositionRef;

  useEffect(() => {
    if (!currentRef) {
      return;
    }

    let isActive = true;

    loadPositionByRef(currentRef)
      .then((loaded) => {
        if (isActive) {
          dispatch({
            type: 'positionLoaded',
            position: loaded,
            ref: currentRef,
          });
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          dispatch({
            type: 'failed',
            message:
              error instanceof Error
                ? error.message
                : 'Could not load the position.',
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentRef]);

  useEffect(() => {
    if (session && phase !== 'loading' && phase !== 'error') {
      void saveGameSession(session);
    }
  }, [phase, session]);

  const outcome = useMemo(
    () =>
      session
        ? getGuessOutcome(
            position,
            guess,
            session.rating,
            session.currentPositionRating,
          )
        : null,
    [guess, position, session],
  );

  // Choosing the next position up front lets it download during the animation.
  useEffect(() => {
    if (phase !== 'cue' || !session || !index || !outcome) {
      return;
    }

    const next = getNextGameSession(
      session,
      index,
      outcome.ratingChange,
      outcome.isExact,
      getEffectiveRating(session.rating + outcome.ratingChange, devSettings),
    );

    pendingSession.current = next;
    prefetchPosition(next.currentPositionRef);
  }, [devSettings, index, outcome, phase, session]);

  const handleDevSettingsChange = useCallback((newSettings: DevSettings) => {
    setDevSettings(newSettings);
    pendingSession.current = null;
    void saveDevSettings(newSettings);
  }, []);

  const handleCueFinished = useCallback(() => {
    dispatch({ type: 'cueFinished' });
  }, []);

  const handleNext = useCallback(() => {
    if (!session || !index || !outcome) {
      return;
    }

    const next =
      pendingSession.current ??
      getNextGameSession(
        session,
        index,
        outcome.ratingChange,
        outcome.isExact,
        getEffectiveRating(session.rating + outcome.ratingChange, devSettings),
      );

    pendingSession.current = null;
    dispatch({ type: 'advanced', session: next });
  }, [devSettings, index, outcome, session]);

  const handleResetProgress = useCallback(async () => {
    await clearGameSession();
    setReloadToken((token) => token + 1);
    dispatch({ type: 'retrying' });
  }, []);

  const replay = useMemo(
    () =>
      position
        ? buildLineReplay(position.fen, outcome?.engineEvaluation?.line ?? '')
        : null,
    [outcome?.engineEvaluation?.line, position],
  );

  if (phase === 'loading') {
    return <StatusScreen message="Loading game data…" />;
  }

  if (phase === 'error') {
    return (
      <StatusScreen
        message="Could not load the position data"
        detail={state.errorMessage ?? undefined}
        onRetry={() => {
          dispatch({ type: 'retrying' });
          setReloadToken((token) => token + 1);
        }}
      />
    );
  }

  if (!session) {
    return <StatusScreen message="Loading game data…" />;
  }

  const isReviewing = phase === 'review';
  const reviewFen =
    isReviewing && replay && reviewStep >= 0
      ? replay.steps[reviewStep].fen
      : position?.fen;
  const activeFen = reviewFen ?? position?.fen;
  const lastMove =
    isReviewing && replay && reviewStep >= 0
      ? [replay.steps[reviewStep].from, replay.steps[reviewStep].to]
      : undefined;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Theme.spacing.xl },
      ]}
    >
      {activeFen ? (
        <>
          <BoardHeader
            sideToMove={getSideToMove(activeFen)}
            onToggleFlip={() => setFlipped((current) => !current)}
            width={contentWidth}
          />
          <Board
            fen={activeFen}
            size={contentWidth}
            flipped={flipped}
            highlightedSquares={lastMove}
          />
        </>
      ) : (
        <View
          style={[
            styles.boardPlaceholder,
            { width: contentWidth, height: contentWidth },
          ]}
        />
      )}

      <StatsBar
        rating={session.rating}
        completedPositions={session.completedPositions}
        correctGuesses={session.correctGuesses}
        positionRating={session.currentPositionRating}
        width={contentWidth}
      />

      {isReviewing && replay ? (
        <>
          <LineReview
            replay={replay}
            stepIndex={reviewStep}
            onStepChange={(step) =>
              dispatch({ type: 'reviewStepChanged', step })
            }
            startsWithBlack={
              position ? getSideToMove(position.fen) === 'b' : false
            }
            width={contentWidth}
          />

          <StandardButton
            style={[styles.action, { width: contentWidth }]}
            onPress={handleNext}
          >
            Next position
          </StandardButton>
        </>
      ) : (
        <View style={styles.guessArea}>
          <EvaluationSlider
            value={guess}
            setValue={(value) =>
              dispatch({ type: 'guessChanged', guess: value })
            }
            width={contentWidth}
            disabled={phase !== 'guessing'}
          />

          <StandardButton
            style={[styles.action, { width: contentWidth }]}
            disabled={phase !== 'guessing' || !position}
            onPress={() => dispatch({ type: 'submitted' })}
          >
            Evaluate
          </StandardButton>
        </View>
      )}

      {outcome && (
        <>
          <ResultCue
            onComplete={handleCueFinished}
            ratingChange={outcome.ratingChange}
            visible={phase === 'cue'}
          />

          <EvaluationResultModal
            engineCategory={outcome.engineCategory}
            engineEvaluation={outcome.engineEvaluation}
            userCategory={guess}
            ratingChange={outcome.ratingChange}
            playerRating={session.rating}
            positionRating={session.currentPositionRating}
            visible={phase === 'result'}
            canReview={(replay?.steps.length ?? 0) > 0}
            onReview={() => dispatch({ type: 'reviewOpened' })}
            onNext={handleNext}
          />
        </>
      )}

      {__DEV__ && (
        <DevSettingsPanel
          devSettings={devSettings}
          onChange={handleDevSettingsChange}
          sessionRating={session.rating}
          onResetProgress={handleResetProgress}
          width={contentWidth}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
  },
  boardPlaceholder: {
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.surface,
  },
  guessArea: {
    marginTop: Theme.spacing.xl,
    alignItems: 'center',
  },
  action: {
    marginTop: Theme.spacing.lg,
  },
});
