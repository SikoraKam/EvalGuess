import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  getValidSettings,
} from '@/utils/settings';

const SETTINGS_KEY = 'evalguess/settings';

export async function loadSettings(): Promise<AppSettings> {
  const serialized = await AsyncStorage.getItem(SETTINGS_KEY);

  if (!serialized) {
    return DEFAULT_SETTINGS;
  }

  try {
    return getValidSettings(JSON.parse(serialized));
  } catch {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  return AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
