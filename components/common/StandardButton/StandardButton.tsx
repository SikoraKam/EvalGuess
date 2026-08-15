import { FC } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Theme } from '@/const/theme';
import { StandardButtonProps } from './StandardButton.types';

export const StandardButton: FC<StandardButtonProps> = ({
  children,
  style,
  variant = 'primary',
  ...props
}) => {
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={(state) => [
        styles.base,
        isSecondary ? styles.secondary : styles.primary,
        state.pressed &&
          (isSecondary ? styles.secondaryPressed : styles.primaryPressed),
        props.disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.label, isSecondary && styles.secondaryLabel]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Theme.colors.primary,
  },
  primaryPressed: {
    backgroundColor: Theme.colors.primaryPressed,
  },
  secondary: {
    backgroundColor: Theme.colors.accentSoft,
  },
  secondaryPressed: {
    opacity: 0.7,
  },
  disabled: {
    backgroundColor: Theme.colors.disabled,
  },
  label: {
    color: '#ffffff',
    fontSize: Theme.fontSize.lg,
    fontWeight: '600',
  },
  secondaryLabel: {
    color: Theme.colors.accentText,
  },
});
