import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_DEV_SETTINGS, DevSettings } from '@/utils/devSettings';

const DEV_SETTINGS_KEY = 'evalguess/dev-settings';

export async function loadDevSettings(): Promise<DevSettings> {
  const serializedSettings = await AsyncStorage.getItem(DEV_SETTINGS_KEY);

  if (!serializedSettings) {
    return DEFAULT_DEV_SETTINGS;
  }

  try {
    const settings = JSON.parse(serializedSettings) as Partial<DevSettings>;

    return {
      ratingOverrideEnabled: settings.ratingOverrideEnabled === true,
      ratingOverride:
        typeof settings.ratingOverride === 'number'
          ? settings.ratingOverride
          : DEFAULT_DEV_SETTINGS.ratingOverride,
    };
  } catch {
    await AsyncStorage.removeItem(DEV_SETTINGS_KEY);
    return DEFAULT_DEV_SETTINGS;
  }
}

export function saveDevSettings(settings: DevSettings) {
  return AsyncStorage.setItem(DEV_SETTINGS_KEY, JSON.stringify(settings));
}
