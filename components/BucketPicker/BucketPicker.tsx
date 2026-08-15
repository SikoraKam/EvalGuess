import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EVALUATION_CATEGORIES } from '@/const/categories';
import { Theme } from '@/const/theme';
import { useSettings } from '@/providers';
import { getCategoryRange } from '@/utils/categories';
import { BucketPickerProps } from './BucketPicker.types';

const COLUMNS = 3;

const SIDE_LABEL = {
  white: 'WHITE',
  black: 'BLACK',
  none: '—',
} as const;

/**
 * Every bucket at once, for players who would rather name the answer than aim
 * at it. Writes exactly the same value as the slider.
 */
export const BucketPicker: FC<BucketPickerProps> = ({
  value,
  setValue,
  width,
  disabled = false,
}) => {
  const { haptic } = useSettings();
  const tileWidth = (width - Theme.spacing.sm * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.range}>{getCategoryRange(value)}</Text>

      <View style={styles.grid}>
        {EVALUATION_CATEGORIES.map((category) => {
          const selected = category.value === value;

          return (
            <Pressable
              key={category.value}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={category.label}
              onPress={() => {
                haptic('light');
                setValue(category.value);
              }}
              style={({ pressed }) => [
                styles.tile,
                { width: tileWidth },
                selected && styles.tileSelected,
                pressed && styles.tilePressed,
                disabled && styles.tileDisabled,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.name, selected && styles.nameSelected]}
              >
                {category.magnitudeLabel}
              </Text>
              <Text style={[styles.side, selected && styles.sideSelected]}>
                {SIDE_LABEL[category.side]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  range: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.accentBright,
    letterSpacing: 0.7,
    marginBottom: Theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  tile: {
    paddingVertical: Theme.spacing.sm + 1,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  tileSelected: {
    backgroundColor: Theme.colors.accentTintStrong,
    borderColor: Theme.colors.accentBorderStrong,
  },
  tilePressed: {
    opacity: 0.7,
  },
  tileDisabled: {
    opacity: 0.5,
  },
  name: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
  },
  nameSelected: {
    color: Theme.colors.accentPale,
  },
  side: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textGhost,
    letterSpacing: 0.9,
    marginTop: 2,
  },
  sideSelected: {
    color: Theme.colors.accentBright,
  },
});
