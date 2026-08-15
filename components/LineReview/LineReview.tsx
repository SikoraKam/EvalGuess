import { FC } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SectionLabel } from '../common';
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
      <SectionLabel>Engine&apos;s best line</SectionLabel>

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
    style={({ pressed }) => [
      styles.control,
      pressed && styles.controlPressed,
      disabled && styles.controlDisabled,
    ]}
  >
    <Text style={styles.controlText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
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
    backgroundColor: Theme.colors.accentTintStrong,
  },
  moveText: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textMuted,
  },
  moveTextActive: {
    fontFamily: Theme.font.monoBold,
    color: Theme.colors.accentBright,
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
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    backgroundColor: Theme.colors.surfaceStrong,
    borderColor: Theme.colors.border,
  },
  controlPressed: {
    backgroundColor: Theme.colors.accentTintStrong,
  },
  controlDisabled: {
    opacity: 0.35,
  },
  controlText: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.accentBright,
  },
  counter: {
    minWidth: 56,
    textAlign: 'center',
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
  },
});
