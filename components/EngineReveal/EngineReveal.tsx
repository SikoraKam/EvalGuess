import { FC, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/const/theme';
import { useSettings } from '@/providers';
import { EngineRevealProps } from './EngineReveal.types';

const SWEEP_WIDTH = 120;

function formatPawns(pawns: number): string {
  return `${pawns >= 0 ? '+' : '−'}${Math.abs(pawns).toFixed(2)}`;
}

/**
 * The beat between locking in and being told. The counter runs from level to
 * the engine's verdict, so the player watches the answer arrive rather than
 * having it appear.
 */
export const EngineReveal: FC<EngineRevealProps> = ({
  targetPawns,
  depth,
  onComplete,
}) => {
  const { duration } = useSettings();
  const [counted, setCounted] = useState(0);
  const [count] = useState(() => new Animated.Value(0));
  const [sweep] = useState(() => new Animated.Value(0));

  const ms = duration(Theme.motion.reveal);
  // With animation off there is nothing to count towards, so the verdict is
  // simply the value.
  const shown = ms === 0 ? targetPawns : counted;

  useEffect(() => {
    if (ms === 0) {
      onComplete();
      return;
    }

    const id = count.addListener(({ value }) =>
      setCounted(value * targetPawns),
    );

    const counting = Animated.timing(count, {
      toValue: 1,
      duration: ms,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    const sweeping = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: Math.max(400, ms / 2),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    sweeping.start();
    counting.start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });

    return () => {
      count.removeListener(id);
      counting.stop();
      sweeping.stop();
      count.setValue(0);
    };
  }, [count, ms, onComplete, sweep, targetPawns]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ENGINE{depth ? ` · DEPTH ${depth}` : ''}</Text>
      <Text style={styles.value}>{formatPawns(shown)}</Text>

      <View style={styles.sweepTrack}>
        <Animated.View
          style={[
            styles.sweep,
            {
              transform: [
                {
                  translateX: sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-SWEEP_WIDTH * 0.6, SWEEP_WIDTH],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 172,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm + 2,
  },
  label: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
    letterSpacing: 2.4,
  },
  value: {
    fontFamily: Theme.font.monoBold,
    fontSize: 40,
    color: Theme.colors.accentBright,
    letterSpacing: -0.8,
  },
  sweepTrack: {
    width: SWEEP_WIDTH,
    height: 2,
    borderRadius: 1,
    backgroundColor: Theme.colors.surfaceTrack,
    overflow: 'hidden',
  },
  sweep: {
    width: SWEEP_WIDTH * 0.6,
    height: '100%',
    backgroundColor: Theme.colors.accent,
  },
});
