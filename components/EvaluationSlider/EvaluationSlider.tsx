import { FC, useEffect, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  EVALUATION_CATEGORIES,
  MAX_CATEGORY,
  MIN_CATEGORY,
} from '@/const/categories';
import { Theme } from '@/const/theme';
import { useSettings } from '@/providers';
import { getCategoryLabel, getCategoryRange } from '@/utils/categories';
import {
  categoryToFraction,
  fractionToCategory,
} from '@/utils/evaluationScale';
import { EvaluationSliderProps } from './EvaluationSlider.types';

const ROW_HEIGHT = 44;
const TRACK_TOP = 20;
const TRACK_HEIGHT = 4;
const THUMB_SIZE = 28;
const TICK_SLOT_WIDTH = 24;

/** The centre and the two extremes are taller, so the axis reads without labels. */
function tickHeight(category: number): number {
  if (category === 0) return 18;

  return Math.abs(category) === MAX_CATEGORY ? 16 : 12;
}

/**
 * A discrete slider over the eleven buckets. The platform slider cannot show
 * where the buckets are, and where they are is the whole question, so this is
 * drawn and driven directly.
 */
export const EvaluationSlider: FC<EvaluationSliderProps> = ({
  setValue,
  value,
  width,
  disabled = false,
}) => {
  const { duration, haptic } = useSettings();
  const [position] = useState(
    () => new Animated.Value(categoryToFraction(value)),
  );

  /**
   * Every mark is laid out on the same axis: bucket `f` sits at
   * `THUMB_SIZE / 2 + f * travel`, which keeps the outermost thumb fully on
   * screen and the ticks under it.
   */
  const travel = Math.max(0, width - THUMB_SIZE);
  const centre = THUMB_SIZE / 2 + travel / 2;

  useEffect(() => {
    const target = categoryToFraction(value);
    const ms = duration(Theme.motion.quick);

    if (ms === 0) {
      position.setValue(target);
      return;
    }

    Animated.timing(position, {
      toValue: target,
      duration: ms,
      useNativeDriver: false,
    }).start();
  }, [duration, position, value]);

  const handleTouch = (event: GestureResponderEvent) => {
    if (disabled || travel === 0) {
      return;
    }

    const next = fractionToCategory(
      (event.nativeEvent.locationX - THUMB_SIZE / 2) / travel,
    );

    if (next !== value) {
      haptic('light');
      setValue(next);
    }
  };

  // Rebuilt every render so the handler always sees the current value; the
  // gesture itself carries no state across events.
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: handleTouch,
    onPanResponderMove: handleTouch,
  });

  const thumbOffset = position.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travel],
  });

  const fillLeft = position.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [THUMB_SIZE / 2, centre, centre],
  });
  const fillWidth = position.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [travel / 2, 0, travel / 2],
  });

  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.label}>{getCategoryLabel(value)}</Text>
      <Text style={styles.range}>{getCategoryRange(value)}</Text>

      <View
        style={[styles.row, { width }]}
        accessibilityRole="adjustable"
        accessibilityLabel="Your evaluation"
        accessibilityValue={{
          min: MIN_CATEGORY,
          max: MAX_CATEGORY,
          now: value,
          text: getCategoryLabel(value),
        }}
        accessibilityState={{ disabled }}
        {...responder.panHandlers}
      >
        <View pointerEvents="none" style={styles.trackArea}>
          <View style={styles.track} />

          <Animated.View
            style={[styles.fill, { left: fillLeft, width: fillWidth }]}
          >
            <LinearGradient
              colors={Theme.gradients.accentBar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fillGradient}
            />
          </Animated.View>

          {EVALUATION_CATEGORIES.map((category) => (
            <View
              key={category.value}
              style={[
                styles.tickSlot,
                {
                  left:
                    THUMB_SIZE / 2 +
                    categoryToFraction(category.value) * travel -
                    TICK_SLOT_WIDTH / 2,
                },
              ]}
            >
              <View
                style={[
                  styles.tick,
                  { height: tickHeight(category.value) },
                  category.value === value && styles.tickActive,
                ]}
              />
            </View>
          ))}

          <Animated.View
            style={[styles.thumb, { transform: [{ translateX: thumbOffset }] }]}
          />
        </View>
      </View>

      <View style={styles.scale}>
        <Text style={styles.scaleText}>CRUSHING</Text>
        <Text style={styles.scaleText}>EQUAL</Text>
        <Text style={styles.scaleText}>CRUSHING</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontFamily: Theme.font.sansBold,
    fontSize: 22,
    color: Theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  range: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.accentBright,
    marginTop: Theme.spacing.xs,
    letterSpacing: 0.7,
  },
  row: {
    height: ROW_HEIGHT,
    marginTop: Theme.spacing.md,
  },
  trackArea: {
    flex: 1,
  },
  track: {
    position: 'absolute',
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    top: TRACK_TOP,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Theme.colors.surfaceTrack,
  },
  fill: {
    position: 'absolute',
    top: TRACK_TOP,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  fillGradient: {
    flex: 1,
  },
  tickSlot: {
    position: 'absolute',
    top: 8,
    height: THUMB_SIZE,
    width: TICK_SLOT_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  tickActive: {
    backgroundColor: Theme.colors.accentBright,
  },
  thumb: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Theme.colors.background,
    borderWidth: 2,
    borderColor: Theme.colors.accentBright,
    shadowColor: Theme.colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  scaleText: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textGhost,
    letterSpacing: 0.9,
  },
});
