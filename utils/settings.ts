import {
  BOARD_THEME_NAMES,
  BoardThemeName,
  DEFAULT_BOARD_THEME,
} from '@/const/boardThemes';

/** How the player picks a bucket. All three write the same value. */
export const INPUT_STYLES = ['Slider', 'Engine bar', 'Buckets'] as const;
export type InputStyle = (typeof INPUT_STYLES)[number];

export const ANIMATION_SPEEDS = ['Off', 'Calm', 'Fast', 'Snappy'] as const;
export type AnimationSpeed = (typeof ANIMATION_SPEEDS)[number];

/** Multiplier applied to every animation duration. `Off` skips animation. */
const SPEED_SCALE: Record<AnimationSpeed, number> = {
  Off: 0,
  Calm: 1.6,
  Fast: 1,
  Snappy: 0.6,
};

export interface AppSettings {
  boardTheme: BoardThemeName;
  coordinates: boolean;
  alwaysShowSideToMove: boolean;
  inputStyle: InputStyle;
  autoPlayBestLine: boolean;
  animationSpeed: AnimationSpeed;
  haptics: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  boardTheme: DEFAULT_BOARD_THEME,
  coordinates: true,
  alwaysShowSideToMove: true,
  inputStyle: 'Slider',
  autoPlayBestLine: false,
  animationSpeed: 'Fast',
  haptics: true,
};

/** Scales a base duration by the player's animation speed. */
export function scaleDuration(duration: number, speed: AnimationSpeed): number {
  return Math.round(duration * SPEED_SCALE[speed]);
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Anything unrecognised in storage falls back to the default for that key. */
export function getValidSettings(value: unknown): AppSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_SETTINGS;
  }

  const stored = value as Partial<AppSettings>;

  return {
    boardTheme: oneOf<BoardThemeName>(
      stored.boardTheme,
      BOARD_THEME_NAMES,
      DEFAULT_SETTINGS.boardTheme,
    ),
    coordinates: bool(stored.coordinates, DEFAULT_SETTINGS.coordinates),
    alwaysShowSideToMove: bool(
      stored.alwaysShowSideToMove,
      DEFAULT_SETTINGS.alwaysShowSideToMove,
    ),
    inputStyle: oneOf(
      stored.inputStyle,
      INPUT_STYLES,
      DEFAULT_SETTINGS.inputStyle,
    ),
    autoPlayBestLine: bool(
      stored.autoPlayBestLine,
      DEFAULT_SETTINGS.autoPlayBestLine,
    ),
    animationSpeed: oneOf(
      stored.animationSpeed,
      ANIMATION_SPEEDS,
      DEFAULT_SETTINGS.animationSpeed,
    ),
    haptics: bool(stored.haptics, DEFAULT_SETTINGS.haptics),
  };
}
