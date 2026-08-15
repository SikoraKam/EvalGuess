import { FC, useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Theme } from '@/const/theme';
import { useSettings } from '@/providers';

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const PADDING = 3;
const KNOB_SIZE = TRACK_HEIGHT - PADDING * 2;
const TRAVEL = TRACK_WIDTH - KNOB_SIZE - PADDING * 2;

export interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
}

export const Toggle: FC<ToggleProps> = ({
  value,
  onChange,
  accessibilityLabel,
}) => {
  const { duration, haptic } = useSettings();
  const [progress] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: duration(Theme.motion.quick),
      useNativeDriver: false,
    }).start();
  }, [duration, progress, value]);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [Theme.colors.surfaceTrack, Theme.colors.accent],
  });
  const knobColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.45)', Theme.colors.onAccent],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => {
        haptic('light');
        onChange(!value);
      }}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View
          style={[
            styles.knob,
            {
              backgroundColor: knobColor,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, TRAVEL],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
  },
});
