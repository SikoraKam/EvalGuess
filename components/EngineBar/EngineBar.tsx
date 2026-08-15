import { FC, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/const/theme';
import {
  categoryToFraction,
  fractionToCategory,
  pawnsToFraction,
} from '@/utils/evaluationScale';
import { EngineBarProps } from './EngineBar.types';

const BAR_HEIGHT = 10;

/**
 * The classic engine bar, laid out horizontally: Black on the left, White on
 * the right, the engine's verdict growing out of the centre once it is known.
 * The player's own guess stays marked on it throughout, which is what makes
 * the reveal readable at a glance.
 */
export const EngineBar: FC<EngineBarProps> = ({
  guessCategory,
  enginePawns,
  caption,
  onPickCategory,
}) => {
  const [width, setWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const pick = (event: GestureResponderEvent) => {
    if (!onPickCategory || width === 0) {
      return;
    }

    onPickCategory(fractionToCategory(event.nativeEvent.locationX / width));
  };

  // Rebuilt every render so the handler always sees the measured width; the
  // gesture itself carries no state across events.
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: pick,
    onPanResponderMove: pick,
  });

  const guessLeft = categoryToFraction(guessCategory) * width;
  const engineFraction =
    enginePawns === null ? 0.5 : pawnsToFraction(enginePawns);
  const engineLeft = Math.min(0.5, engineFraction) * width;
  const engineWidth = Math.abs(engineFraction - 0.5) * width;

  return (
    <View>
      <View
        style={styles.track}
        onLayout={handleLayout}
        {...(onPickCategory ? responder.panHandlers : {})}
        accessibilityRole={onPickCategory ? 'adjustable' : 'progressbar'}
        accessibilityLabel="Evaluation bar"
      >
        <View style={styles.blackHalf} />

        {enginePawns !== null && (
          <LinearGradient
            colors={['rgba(141, 143, 201, 0.35)', 'rgba(141, 143, 201, 0.75)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.engineFill,
              { left: engineLeft, width: engineWidth },
            ]}
          />
        )}

        <View style={styles.centre} />
        <View style={[styles.guessMark, { left: guessLeft }]} />
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>BLACK</Text>
        <Text style={styles.caption}>{caption}</Text>
        <Text style={styles.legendText}>WHITE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2 + 1,
    backgroundColor: Theme.colors.surfaceSunken,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  blackHalf: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
  },
  engineFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  centre: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  guessMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: Theme.colors.text,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.sm - 2,
  },
  legendText: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textGhost,
    letterSpacing: 1,
  },
  caption: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textFaint,
    letterSpacing: 1,
  },
});
