import { FC } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/const/theme';

/** Bars shorter than this would read as empty, so the scale starts here. */
const MIN_BAR_FRACTION = 0.2;

export interface SparklineProps {
  values: number[];
  height: number;
  /** The most recent bars, drawn in full accent rather than a flat tint. */
  highlightLast?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A rating history as bars. Scaled between the run's own low and high, since
 * an absolute scale flattens the only movement worth seeing.
 */
export const Sparkline: FC<SparklineProps> = ({
  values,
  height,
  highlightLast = 0,
  style,
}) => {
  // A single point has no shape to show; one full-height block would only
  // read as a bug.
  if (values.length < 2) {
    return null;
  }

  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low;

  return (
    <View style={[styles.row, { height }, style]}>
      {values.map((value, index) => {
        const fraction =
          span === 0
            ? 1
            : MIN_BAR_FRACTION +
              (1 - MIN_BAR_FRACTION) * ((value - low) / span);
        const isHot = index >= values.length - highlightLast;

        return (
          <View
            key={index}
            style={[styles.bar, { height: `${fraction * 100}%` }]}
          >
            {isHot ? (
              <LinearGradient
                colors={Theme.gradients.accentColumn}
                style={styles.fill}
              />
            ) : (
              <View style={[styles.fill, styles.cool]} />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  cool: {
    backgroundColor: 'rgba(141, 143, 201, 0.22)',
  },
});
