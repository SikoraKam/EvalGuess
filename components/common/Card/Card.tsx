import { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Theme } from '@/const/theme';
import { CardProps } from './Card.types';

export const Card: FC<CardProps> = ({
  children,
  variant = 'default',
  style,
}) => <View style={[styles.base, styles[variant], style]}>{children}</View>;

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    padding: Theme.spacing.lg,
  },
  default: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
  },
  strong: {
    backgroundColor: Theme.colors.surfaceStrong,
    borderColor: Theme.colors.borderStrong,
  },
  accent: {
    backgroundColor: Theme.colors.accentTint,
    borderColor: Theme.colors.accentBorder,
  },
});
