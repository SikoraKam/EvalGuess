import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Board,
  BoardHeader,
  BucketPicker,
  EngineBar,
  EngineReveal,
  EvaluationSlider,
  LineReview,
  ResultPanel,
  StatusScreen,
} from '@/components';
import { Card, GlowOrb, Pill, StandardButton } from '@/components/common';
import { Theme } from '@/const/theme';
import { useGame, useSettings } from '@/providers';
import { getEvaluationInPawns } from '@/utils/evaluation';
import { getMoveNumber, getSideToMove } from '@/utils/fen';
import { buildLineReplay } from '@/utils/lineReplay';

/** Gap between auto-played moves, before the animation-speed multiplier. */
const AUTO_PLAY_STEP = 900;

const RUN_TITLES = {
  rated: 'Rated run',
  endless: 'Endless run',
  daily: 'Daily set',
} as const;

export default function PlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { settings, duration, haptic } = useSettings();
  const {
    phase,
    session,
    position,
    guess,
    reviewStep,
    outcome,
    stats,
    mode,
    setMode,
    errorMessage,
    setGuess,
    submit,
    finishCue,
    openReview,
    setReviewStep,
    next,
    retry,
  } = useGame();

  const [flipped, setFlipped] = useState(false);

  const contentWidth = Math.min(
    width - Theme.spacing.lg * 2,
    Theme.board.maxSize,
  );

  const replay = useMemo(
    () =>
      position
        ? buildLineReplay(position.fen, outcome?.engineEvaluation?.line ?? '')
        : null,
    [outcome?.engineEvaluation?.line, position],
  );

  const canReview = (replay?.steps.length ?? 0) > 0;

  /** Opened by a deep link there is nothing to pop back to, so go to the menu. */
  const goHome = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  useEffect(() => {
    if (phase === 'result') {
      const ratingChange = outcome?.ratingChange ?? 0;

      haptic(
        ratingChange > 0 ? 'success' : ratingChange < 0 ? 'warning' : 'error',
      );
    }
    // The cue only fires once per position, so the rating change is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === 'result' && settings.autoPlayBestLine && canReview) {
      openReview();
    }
  }, [canReview, openReview, phase, settings.autoPlayBestLine]);

  useEffect(() => {
    const total = replay?.steps.length ?? 0;

    if (
      phase !== 'review' ||
      !settings.autoPlayBestLine ||
      reviewStep >= total - 1
    ) {
      return;
    }

    const delay = duration(AUTO_PLAY_STEP) || 1;
    const timer = setTimeout(() => setReviewStep(reviewStep + 1), delay);

    return () => clearTimeout(timer);
  }, [duration, phase, replay, reviewStep, setReviewStep, settings]);

  if (phase === 'error') {
    return (
      <StatusScreen
        message="Could not load the position data"
        detail={errorMessage ?? undefined}
        onRetry={retry}
      />
    );
  }

  if (!session || !stats) {
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

  const enginePawns =
    phase === 'guessing' || !outcome
      ? null
      : getEvaluationInPawns(outcome.engineEvaluation);
  const barCaption =
    enginePawns === null
      ? 'YOUR CALL'
      : `${enginePawns >= 0 ? '+' : '−'}${Math.abs(enginePawns).toFixed(2)}`;

  // The set is only over once the last answer has been advanced past.
  const isDailyOver = mode === 'daily' && stats.isDailyComplete;
  const isGuessing = phase === 'guessing' && !isDailyOver;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Theme.spacing.sm },
      ]}
    >
      <GlowOrb size={320} style={styles.glow} />

      <View style={[styles.header, { width: contentWidth }]}>
        <Pressable
          onPress={goHome}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <LinearGradient
            colors={Theme.gradients.accentDeep}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mark}
          >
            <Text style={styles.markLetter}>‹</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.runTitle}>{RUN_TITLES[mode]}</Text>
          <Text style={styles.runMeta}>
            {mode === 'daily'
              ? `${Math.min(stats.dailySolved + 1, stats.dailyTarget)} / ${stats.dailyTarget}`
              : `POSITION ${stats.completedPositions + 1}`}{' '}
            · {session.currentPositionRating} ELO
          </Text>
        </View>

        <Pill label={`▲ ${stats.currentStreak}`} />
        <Pill label={String(stats.rating)} tone="plain" />
      </View>

      {activeFen ? (
        <View style={{ width: contentWidth }}>
          <BoardHeader
            sideToMove={getSideToMove(activeFen)}
            moveNumber={getMoveNumber(activeFen)}
            onToggleFlip={() => setFlipped((current) => !current)}
            width={contentWidth}
          />
          <Board
            fen={activeFen}
            size={contentWidth}
            flipped={flipped}
            highlightedSquares={lastMove}
          />
        </View>
      ) : (
        <View
          style={[
            styles.boardPlaceholder,
            { width: contentWidth, height: contentWidth },
          ]}
        />
      )}

      <View style={[styles.bar, { width: contentWidth }]}>
        <EngineBar
          guessCategory={guess}
          enginePawns={enginePawns}
          caption={barCaption}
          onPickCategory={
            isGuessing && settings.inputStyle === 'Engine bar'
              ? setGuess
              : undefined
          }
        />
      </View>

      <View style={[styles.panel, { width: contentWidth }]}>
        {phase === 'cue' && outcome ? (
          <EngineReveal
            targetPawns={getEvaluationInPawns(outcome.engineEvaluation)}
            depth={outcome.depth ?? undefined}
            onComplete={finishCue}
          />
        ) : phase === 'result' && outcome ? (
          <ResultPanel
            userCategory={guess}
            engineCategory={outcome.engineCategory}
            engineEvaluation={outcome.engineEvaluation}
            categoryDifference={outcome.categoryDifference}
            ratingChange={outcome.ratingChange}
            playerRating={session.rating}
            // Switching to endless does not undo a rating already awarded, so
            // the panel only calls an answer unrated when none was.
            unrated={mode === 'endless' && outcome.ratingChange === 0}
            canReview={canReview}
            onReview={openReview}
            onNext={next}
          />
        ) : isReviewing && replay ? (
          <>
            <LineReview
              replay={replay}
              stepIndex={reviewStep}
              onStepChange={setReviewStep}
              startsWithBlack={
                position ? getSideToMove(position.fen) === 'b' : false
              }
              width={contentWidth}
            />
            <StandardButton style={styles.action} onPress={next}>
              Next position
            </StandardButton>
          </>
        ) : isDailyOver ? (
          <Card>
            <Text style={styles.doneTitle}>Daily set complete</Text>
            <Text style={styles.doneCaption}>
              All {stats.dailyTarget} positions answered. A fresh set unlocks
              tomorrow.
            </Text>

            <View style={styles.doneActions}>
              <StandardButton
                variant="secondary"
                style={styles.doneButton}
                onPress={goHome}
              >
                Home
              </StandardButton>
              <StandardButton
                style={styles.doneButton}
                onPress={() => setMode('rated')}
              >
                Keep going
              </StandardButton>
            </View>
          </Card>
        ) : (
          <>
            {settings.inputStyle === 'Buckets' ? (
              <BucketPicker
                value={guess}
                setValue={setGuess}
                width={contentWidth}
                disabled={!isGuessing}
              />
            ) : (
              <EvaluationSlider
                value={guess}
                setValue={setGuess}
                width={contentWidth}
                disabled={!isGuessing || settings.inputStyle === 'Engine bar'}
              />
            )}

            <StandardButton
              style={styles.action}
              disabled={!isGuessing || !position}
              onPress={() => {
                haptic('light');
                submit();
              }}
            >
              Lock in evaluation
            </StandardButton>
          </>
        )}
      </View>
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
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl,
  },
  glow: {
    top: -160,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  mark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    fontFamily: Theme.font.sansBold,
    fontSize: Theme.fontSize.xxl,
    lineHeight: 24,
    color: Theme.colors.onAccent,
  },
  headerText: {
    flex: 1,
  },
  runTitle: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
  },
  runMeta: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textFaint,
    letterSpacing: 0.9,
    marginTop: 1,
  },
  boardPlaceholder: {
    borderRadius: Theme.board.radius,
    backgroundColor: Theme.colors.surface,
  },
  bar: {
    marginTop: Theme.spacing.lg,
  },
  panel: {
    marginTop: Theme.spacing.lg,
  },
  action: {
    marginTop: Theme.spacing.lg,
  },
  doneTitle: {
    fontFamily: Theme.font.sansBold,
    fontSize: Theme.fontSize.xl,
    color: Theme.colors.text,
  },
  doneCaption: {
    fontFamily: Theme.font.sans,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs,
  },
  doneActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm + 2,
    marginTop: Theme.spacing.lg,
  },
  doneButton: {
    flex: 1,
  },
});
