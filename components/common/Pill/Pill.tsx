import { FC } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme } from '@/const/theme';

export interface PillProps {
  label: string;
  /** `accent` for anything the player is meant to notice, `plain` otherwise. */
  tone?: 'accent' | 'plain';
  style?: StyleProp<ViewStyle>;
}

/** Small mono badge: streak counters, ratings, position counts. */
export const Pill: FC<PillProps> = ({ label, tone = 'accent', style }) => (
  <View style={[styles.pill, styles[tone], style]}>
    <Text style={[styles.label, tone === 'accent' && styles.accentLabel]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Theme.spacing.sm + 1,
    paddingVertical: 5,
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
  },
  accent: {
    backgroundColor: Theme.colors.accentTint,
    borderColor: Theme.colors.accentBorder,
  },
  plain: {
    backgroundColor: Theme.colors.surfaceStrong,
    borderColor: Theme.colors.borderStrong,
  },
  label: {
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.text,
  },
  accentLabel: {
    color: Theme.colors.accentBright,
  },
});
