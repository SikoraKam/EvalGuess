import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/const/theme';
import { StandardButtonProps } from './StandardButton.types';

export const StandardButton: FC<StandardButtonProps> = ({
  children,
  style,
  variant = 'primary',
  uppercase = variant === 'primary',
  ...props
}) => {
  const isPrimary = variant === 'primary';
  const isDisabled = props.disabled === true;

  // Pressable allows render-prop children, which this button does not use;
  // anything but a plain label is passed straight through.
  const content = typeof children === 'function' ? null : children;

  const label =
    typeof children === 'string' ? (
      <Text
        style={[
          styles.label,
          styles[`${variant}Label`],
          uppercase && styles.uppercase,
          isDisabled && styles.disabledLabel,
        ]}
      >
        {uppercase ? children.toUpperCase() : children}
      </Text>
    ) : (
      content
    );

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={(state) => [
        styles.base,
        !isPrimary && styles[variant],
        state.pressed && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {isPrimary && !isDisabled && (
        <LinearGradient
          colors={Theme.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View style={styles.content}>{label}</View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: Theme.spacing.lg - 1,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: Theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: Theme.colors.borderStrong,
  },
  ghost: {
    paddingVertical: Theme.spacing.sm,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  label: {
    fontFamily: Theme.font.sansBold,
    fontSize: Theme.fontSize.lg,
  },
  primaryLabel: {
    color: Theme.colors.onAccent,
  },
  secondaryLabel: {
    color: Theme.colors.text,
  },
  ghostLabel: {
    color: Theme.colors.accentBright,
    fontSize: Theme.fontSize.md,
  },
  uppercase: {
    letterSpacing: 0.9,
  },
  disabledLabel: {
    color: Theme.colors.textFaint,
  },
});
