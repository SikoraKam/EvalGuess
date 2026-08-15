import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getBoardTheme } from '@/const/boardThemes';
import { AppSettings, DEFAULT_SETTINGS, scaleDuration } from '@/utils/settings';
import { loadSettings, saveSettings } from '@/utils/settingsStorage';

type HapticStrength = 'light' | 'success' | 'warning' | 'error';

interface SettingsContextValue {
  settings: AppSettings;
  /** Ready once storage has been read, so the first paint is not the defaults. */
  isLoaded: boolean;
  setSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
  boardTheme: ReturnType<typeof getBoardTheme>;
  /** A base duration adjusted for the player's animation speed. */
  duration: (base: number) => number;
  /** No-ops when haptics are off or unsupported, so callers never branch. */
  haptic: (strength: HapticStrength) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const NOTIFICATION_TYPES = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
} as const;

export const SettingsProvider: FC<PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    void loadSettings().then((stored) => {
      if (isActive) {
        setSettings(stored);
        setIsLoaded(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const setSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((current) => {
        const next = { ...current, [key]: value };
        void saveSettings(next);

        return next;
      });
    },
    [],
  );

  const value = useMemo<SettingsContextValue>(() => {
    const haptic = (strength: HapticStrength) => {
      if (!settings.haptics || Platform.OS === 'web') {
        return;
      }

      const feedback =
        strength === 'light'
          ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          : Haptics.notificationAsync(NOTIFICATION_TYPES[strength]);

      void feedback.catch(() => undefined);
    };

    return {
      settings,
      isLoaded,
      setSetting,
      boardTheme: getBoardTheme(settings.boardTheme),
      duration: (base: number) => scaleDuration(base, settings.animationSpeed),
      haptic,
    };
  }, [isLoaded, setSetting, settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used inside a SettingsProvider');
  }

  return context;
}
