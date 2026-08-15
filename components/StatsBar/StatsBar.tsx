import { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/const/theme';
import { StatsBarProps } from './StatsBar.types';

export const StatsBar: FC<StatsBarProps> = ({
  rating,
  completedPositions,
  correctGuesses,
  positionRating,
  width,
}) => {
  const accuracy =
    completedPositions > 0
      ? Math.round((100 * correctGuesses) / completedPositions)
      : null;

  return (
    <View style={[styles.container, { width }]}>
      <Stat label="Your rating" value={String(rating)} />
      <Stat label="Position" value={String(positionRating)} />
      <Stat label="Solved" value={String(completedPositions)} />
      <Stat label="Exact" value={accuracy === null ? '–' : `${accuracy}%`} />
    </View>
  );
};

const Stat: FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.surface,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: Theme.fontSize.lg,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  label: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
});
