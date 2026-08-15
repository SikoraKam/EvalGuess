import { Stack } from 'expo-router';
import { Theme } from '@/const/theme';

/**
 * Home and the board are one tab: pushing the board keeps Train highlighted,
 * and going back returns to the menu with the session untouched.
 */
export default function TrainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Theme.colors.background },
      }}
    />
  );
}
