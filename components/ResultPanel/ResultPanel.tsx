import { FC, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { StandardButton } from '../common';
import { Theme } from '@/const/theme';
import { useSettings } from '@/providers';
import { getCategoryLabel, getCategoryRange } from '@/utils/categories';
import { formatEngineEvaluation } from '@/utils/evaluation';
import { formatRatingChange } from '@/utils/rating';
import { ResultPanelProps } from './ResultPanel.types';

const SPARK_COUNT = 8;
const SPARK_DISTANCE = 46;
/** Ratings are shown against the 100-point band they sit in. */
const RATING_BAND = 100;

function verdictText(difference: number): string {
  if (difference === 0) return 'Exact call';
  if (difference === 1) return 'One bucket off';

  return `${difference} buckets off`;
}

/**
 * The verdict, side by side with what the engine actually said. Replaces the
 * modal the screen used to throw up: the board stays visible, so the numbers
 * can be read against the position that produced them.
 */
export const ResultPanel: FC<ResultPanelProps> = ({
  userCategory,
  engineCategory,
  engineEvaluation,
  categoryDifference,
  ratingChange,
  playerRating,
  unrated = false,
  canReview,
  onReview,
  onNext,
}) => {
  const { duration } = useSettings();
  const [rise] = useState(() => new Animated.Value(0));
  const isExact = categoryDifference === 0;

  const deltaColor =
    unrated || ratingChange === 0
      ? Theme.colors.neutral
      : ratingChange > 0
        ? Theme.colors.positive
        : Theme.colors.negative;

  useEffect(() => {
    const ms = duration(Theme.motion.normal);

    if (ms === 0) {
      rise.setValue(1);
      return;
    }

    rise.setValue(0);
    const animation = Animated.timing(rise, {
      toValue: 1,
      duration: ms,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [duration, rise]);

  return (
    <Animated.View
      style={{
        opacity: rise,
        transform: [
          {
            translateY: rise.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.verdictRow}>
        <View style={styles.verdict}>
          <View style={[styles.dot, { backgroundColor: deltaColor }]} />
          <Text style={styles.verdictText}>
            {verdictText(categoryDifference)}
          </Text>
        </View>

        <View>
          <Text
            style={[
              styles.delta,
              unrated && styles.unratedDelta,
              { color: deltaColor },
            ]}
          >
            {unrated ? 'UNRATED' : formatRatingChange(ratingChange)}
          </Text>
          {isExact && <Sparks />}
        </View>
      </View>

      <View style={styles.comparison}>
        <View style={styles.column}>
          <Text style={styles.columnLabel}>YOUR CALL</Text>
          <Text style={styles.columnValue}>
            {getCategoryLabel(userCategory)}
          </Text>
          <Text style={styles.columnRange}>
            {getCategoryRange(userCategory)}
          </Text>
        </View>

        <View style={[styles.column, styles.engineColumn]}>
          <Text style={[styles.columnLabel, styles.engineLabel]}>ENGINE</Text>
          <Text style={styles.columnValue}>
            {getCategoryLabel(engineCategory)}
          </Text>
          <Text style={[styles.columnRange, styles.engineRange]}>
            {formatEngineEvaluation(engineEvaluation)}
          </Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
        <View style={styles.ratingTrack}>
          <View
            style={[
              styles.ratingFill,
              {
                width: `${((playerRating % RATING_BAND) / RATING_BAND) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.ratingText}>{playerRating} ELO</Text>
      </View>

      <View style={styles.actions}>
        {canReview && (
          <StandardButton
            variant="secondary"
            style={styles.reviewButton}
            onPress={onReview}
          >
            Best line
          </StandardButton>
        )}

        <StandardButton style={styles.nextButton} onPress={onNext}>
          Next
        </StandardButton>
      </View>
    </Animated.View>
  );
};

/** A short burst outwards, only ever shown for an exact call. */
const Sparks: FC = () => {
  const { duration } = useSettings();
  const [progress] = useState(() => new Animated.Value(0));
  const ms = duration(Theme.motion.normal) * 2.4;

  useEffect(() => {
    if (ms === 0) {
      return;
    }

    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: ms,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [ms, progress]);

  if (ms === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.sparkField}>
      {Array.from({ length: SPARK_COUNT }, (_, index) => {
        const angle = (index / SPARK_COUNT) * Math.PI * 2;

        return (
          <Animated.View
            key={index}
            style={[
              styles.spark,
              {
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 0],
                }),
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(angle) * SPARK_DISTANCE],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(angle) * SPARK_DISTANCE],
                    }),
                  },
                  {
                    scale: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.2],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm + 1,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  verdictText: {
    fontFamily: Theme.font.sansBold,
    fontSize: Theme.fontSize.xl,
    color: Theme.colors.text,
  },
  delta: {
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.display,
  },
  unratedDelta: {
    fontSize: Theme.fontSize.md,
    letterSpacing: 1.4,
  },
  sparkField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Theme.colors.positive,
  },
  comparison: {
    flexDirection: 'row',
    gap: Theme.spacing.sm + 2,
    marginTop: Theme.spacing.md,
  },
  column: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
  },
  engineColumn: {
    backgroundColor: 'rgba(141, 143, 201, 0.07)',
    borderColor: 'rgba(141, 143, 201, 0.22)',
  },
  columnLabel: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textFaint,
    letterSpacing: 1.2,
  },
  engineLabel: {
    color: Theme.colors.accentBright,
  },
  columnValue: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
    marginTop: 5,
  },
  columnRange: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  engineRange: {
    color: Theme.colors.accentBright,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  ratingTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.surfaceSunken,
    overflow: 'hidden',
  },
  ratingFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Theme.colors.accent,
  },
  ratingText: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textMuted,
    letterSpacing: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm + 2,
    marginTop: Theme.spacing.lg,
  },
  reviewButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1.25,
  },
});
