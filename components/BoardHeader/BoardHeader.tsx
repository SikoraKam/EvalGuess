import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/const/theme';
import { useSettings } from '@/providers';
import { BoardHeaderProps } from './BoardHeader.types';

/**
 * Whose turn it is changes the answer, and the FEN is the only place that
 * information lives, so it has to be on screen.
 */
export const BoardHeader: FC<BoardHeaderProps> = ({
  sideToMove,
  moveNumber,
  onToggleFlip,
  width,
}) => {
  const { settings, haptic } = useSettings();
  const isWhite = sideToMove === 'w';

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.side}>
        {settings.alwaysShowSideToMove && (
          <>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isWhite
                    ? Theme.colors.whitePill
                    : Theme.colors.blackPill,
                },
              ]}
            />
            <Text style={styles.label}>
              {isWhite ? 'White to move' : 'Black to move'}
            </Text>
          </>
        )}

        {moveNumber !== null && moveNumber !== undefined && (
          <Text style={styles.move}>MOVE {moveNumber}</Text>
        )}
      </View>

      <Pressable
        onPress={() => {
          haptic('light');
          onToggleFlip();
        }}
        accessibilityRole="button"
        accessibilityLabel="Flip board"
        hitSlop={8}
        style={({ pressed }) => [styles.flip, pressed && styles.flipPressed]}
      >
        <Text style={styles.flipLabel}>⇅ Flip</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.textFaint,
  },
  label: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
  },
  move: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textFaint,
    letterSpacing: 0.8,
  },
  flip: {
    paddingHorizontal: Theme.spacing.md - 2,
    paddingVertical: 5,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surfaceStrong,
  },
  flipPressed: {
    backgroundColor: Theme.colors.accentTintStrong,
    borderColor: Theme.colors.accentBorder,
  },
  flipLabel: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
  },
});
