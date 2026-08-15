import { FC } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/const/theme';

export interface ProgressBarProps {
  /** 0–1. Values outside the range are clamped. */
  progress: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const ProgressBar: FC<ProgressBarProps> = ({
  progress,
  height = 6,
  style,
}) => {
  const width = `${Math.max(0, Math.min(1, progress)) * 100}%` as const;

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
      accessibilityRole="progressbar"
    >
      <LinearGradient
        colors={Theme.gradients.accentBar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width, borderRadius: height / 2 }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: Theme.colors.surfaceSunken,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});
