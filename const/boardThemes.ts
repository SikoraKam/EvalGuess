/**
 * Board skins. All four are low-saturation on purpose: the board sits next to
 * the accent-coloured evaluation UI, and a strongly tinted board would compete
 * with the one thing the player is being asked to read.
 */
export interface BoardTheme {
  name: string;
  light: string;
  dark: string;
  /** Coordinate colours, chosen per square so both stay legible. */
  coordinateOnLight: string;
  coordinateOnDark: string;
}

export const BOARD_THEMES = {
  Lavender: {
    name: 'Lavender',
    light: '#efeffb',
    dark: '#a0a3d0',
    coordinateOnLight: '#7c7fa4',
    coordinateOnDark: '#3a3c66',
  },
  Fog: {
    name: 'Fog',
    light: '#f2f4f9',
    dark: '#98a0b8',
    coordinateOnLight: '#767f96',
    coordinateOnDark: '#3b4257',
  },
  Dove: {
    name: 'Dove',
    light: '#eceef4',
    dark: '#868ea8',
    coordinateOnLight: '#6f7789',
    coordinateOnDark: '#31374a',
  },
  Stone: {
    name: 'Stone',
    light: '#f1eee7',
    dark: '#a9a398',
    coordinateOnLight: '#807a70',
    coordinateOnDark: '#3f3b34',
  },
} as const satisfies Record<string, BoardTheme>;

export type BoardThemeName = keyof typeof BOARD_THEMES;

export const BOARD_THEME_NAMES = Object.keys(BOARD_THEMES) as BoardThemeName[];

export const DEFAULT_BOARD_THEME: BoardThemeName = 'Lavender';

export function getBoardTheme(name: BoardThemeName): BoardTheme {
  return BOARD_THEMES[name] ?? BOARD_THEMES[DEFAULT_BOARD_THEME];
}
