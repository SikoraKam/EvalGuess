import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/const/theme';
import { BoardHeaderProps } from './BoardHeader.types';

/**
 * Whose turn it is changes the answer, and the FEN is the only place that
 * information lives, so it has to be on screen.
 */
export const BoardHeader: FC<BoardHeaderProps> = ({
  sideToMove,
  onToggleFlip,
  width,
}) => {
  const isWhite = sideToMove === 'w';

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.side}>
        <View
          style={[
            styles.pill,
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
      </View>

      <Pressable
        onPress={onToggleFlip}
        accessibilityRole="button"
        accessibilityLabel="Flip board"
        hitSlop={8}
      >
        <Text style={styles.flip}>Flip</Text>
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
  pill: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.neutral,
  },
  label: {
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  flip: {
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
    color: Theme.colors.accentText,
  },
});
