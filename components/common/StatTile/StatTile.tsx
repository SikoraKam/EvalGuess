import { FC } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme } from '@/const/theme';

export interface StatTileProps {
  value: string;
  label: string;
  /** Tints the tile — used for the one figure worth singling out. */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const StatTile: FC<StatTileProps> = ({
  value,
  label,
  highlighted = false,
  style,
}) => (
  <View style={[styles.tile, highlighted && styles.highlighted, style]}>
    <Text style={[styles.value, highlighted && styles.highlightedValue]}>
      {value}
    </Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  tile: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
  },
  highlighted: {
    backgroundColor: Theme.colors.accentTint,
    borderColor: Theme.colors.accentBorder,
  },
  value: {
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.xl,
    color: Theme.colors.text,
  },
  highlightedValue: {
    color: Theme.colors.accentBright,
  },
  label: {
    fontFamily: Theme.font.sans,
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textFaint,
    marginTop: 2,
  },
});
