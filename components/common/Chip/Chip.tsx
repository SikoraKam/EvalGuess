import { FC } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Theme } from '@/const/theme';
import { ChipProps } from './Chip.types';

/** A one-of-many choice. Selection is carried by tint, border and text weight. */
export const Chip: FC<ChipProps> = ({ label, selected, onPress, style }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    style={({ pressed }) => [
      styles.chip,
      selected ? styles.selected : styles.unselected,
      pressed && styles.pressed,
      style,
    ]}
  >
    <Text style={[styles.label, selected && styles.selectedLabel]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: Theme.colors.accentTintStrong,
    borderColor: Theme.colors.accentBorderStrong,
  },
  unselected: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
  },
  selectedLabel: {
    color: Theme.colors.accentPale,
  },
});
