import { FC } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/const/theme';
import { formatMoveNumber } from '@/utils/lineReplay';
import { LineReviewProps } from './LineReview.types';

/**
 * The dataset ships the engine's principal variation with every position, and
 * seeing it is the only thing that turns a wrong guess into an explanation.
 */
export const LineReview: FC<LineReviewProps> = ({
  replay,
  stepIndex,
  onStepChange,
  startsWithBlack,
  width,
}) => {
  const total = replay.steps.length;

  if (total === 0) {
    return null;
  }

  const atStart = stepIndex < 0;
  const atEnd = stepIndex >= total - 1;

  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>Engine&apos;s best line</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moves}
      >
        {replay.steps.map((step, index) => {
          const prefix = formatMoveNumber(step.ply, startsWithBlack);
          const isActive = index === stepIndex;

          return (
            <Pressable
              key={step.ply}
              onPress={() => onStepChange(index)}
              style={[styles.move, isActive && styles.moveActive]}
            >
              <Text
                style={[styles.moveText, isActive && styles.moveTextActive]}
              >
                {prefix ? `${prefix} ${step.san}` : step.san}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.controls}>
        <ControlButton
          label="◀◀"
          disabled={atStart}
          onPress={() => onStepChange(-1)}
        />
        <ControlButton
          label="◀"
          disabled={atStart}
          onPress={() => onStepChange(stepIndex - 1)}
        />
        <Text style={styles.counter}>
          {stepIndex + 1} / {total}
        </Text>
        <ControlButton
          label="▶"
          disabled={atEnd}
          onPress={() => onStepChange(stepIndex + 1)}
        />
        <ControlButton
          label="▶▶"
          disabled={atEnd}
          onPress={() => onStepChange(total - 1)}
        />
      </View>
    </View>
  );
};

const ControlButton: FC<{
  label: string;
  disabled: boolean;
  onPress: () => void;
}> = ({ label, disabled, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={[styles.control, disabled && styles.controlDisabled]}
  >
    <Text style={styles.controlText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.surface,
  },
  title: {
    fontSize: Theme.fontSize.md,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  moves: {
    gap: Theme.spacing.xs,
    paddingBottom: Theme.spacing.xs,
  },
  move: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.sm,
  },
  moveActive: {
    backgroundColor: Theme.colors.accentSoft,
  },
  moveText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textMuted,
  },
  moveTextActive: {
    color: Theme.colors.accentText,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  control: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.accentSoft,
  },
  controlDisabled: {
    opacity: 0.4,
  },
  controlText: {
    color: Theme.colors.accentText,
    fontWeight: '700',
  },
  counter: {
    minWidth: 56,
    textAlign: 'center',
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textMuted,
  },
});
