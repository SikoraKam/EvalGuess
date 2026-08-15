import { FC } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StandardButton } from '../common';
import { Theme } from '@/const/theme';
import { StatusScreenProps } from './StatusScreen.types';

export const StatusScreen: FC<StatusScreenProps> = ({
  message,
  detail,
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      {onRetry ? (
        <Text style={styles.icon}>⚠️</Text>
      ) : (
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      )}

      <Text style={styles.message}>{message}</Text>

      {detail ? <Text style={styles.detail}>{detail}</Text> : null}

      {onRetry ? (
        <StandardButton style={styles.button} onPress={onRetry}>
          Try again
        </StandardButton>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.background,
  },
  icon: {
    fontSize: 40,
  },
  message: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.lg,
    fontWeight: '600',
    color: Theme.colors.text,
    textAlign: 'center',
  },
  detail: {
    marginTop: Theme.spacing.sm,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: Theme.spacing.xl,
    minWidth: 200,
  },
});
