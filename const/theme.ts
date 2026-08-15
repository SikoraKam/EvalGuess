/**
 * The design system. Everything visual in the app resolves to a token here —
 * screens and components never hard-code a colour, a radius or a font.
 *
 * The palette is a single dark theme built around one accent, `rgb(141,143,201)`.
 * Surfaces are translucent whites layered over the near-black background rather
 * than opaque greys, so nested cards stay distinguishable without a second
 * palette.
 */

/** Raw values. Only this file should read them; the rest of the app uses `Theme`. */
const palette = {
  ink900: '#08090b',
  ink800: '#0b0d10',
  ink700: '#0d1014',
  ink600: '#15171b',
  ink500: '#1b1e24',
  ink400: '#22262d',
  ink300: '#2a2d33',

  accent: '#8d8fc9',
  accentBright: '#aeb0dd',
  accentPale: '#dfe0f2',
  accentDeep: '#4c4e94',
  accentDeeper: '#414383',
  accentShade: '#4e5093',
  /** Text and icons that sit *on* the accent. */
  onAccent: '#0d0e1c',

  bone: '#f2f0ec',
  green: '#6fbf87',
  ember: '#e0765c',
} as const;

const white = (alpha: number) => `rgba(255, 255, 255, ${alpha})`;
/** Accent at an opacity — used for tints, borders and glows. */
const accentAlpha = (alpha: number) => `rgba(141, 143, 201, ${alpha})`;

export const Theme = {
  colors: {
    /** App background, and the elevated bar surfaces that frame it. */
    background: palette.ink800,
    backgroundDeep: palette.ink900,
    bar: palette.ink700,

    /** Card fills, lightest first. */
    surface: white(0.035),
    surfaceStrong: white(0.05),
    surfaceSunken: palette.ink500,
    surfaceTrack: palette.ink400,

    border: white(0.07),
    borderStrong: white(0.1),
    divider: white(0.06),

    text: palette.bone,
    textMuted: white(0.5),
    textFaint: white(0.35),
    textGhost: white(0.25),

    accent: palette.accent,
    accentBright: palette.accentBright,
    accentPale: palette.accentPale,
    accentDeep: palette.accentDeep,
    accentDeeper: palette.accentDeeper,
    accentShade: palette.accentShade,
    onAccent: palette.onAccent,
    accentTint: accentAlpha(0.1),
    accentTintStrong: accentAlpha(0.14),
    accentBorder: accentAlpha(0.3),
    accentBorderStrong: accentAlpha(0.5),
    accentGlow: accentAlpha(0.45),
    accentHighlight: accentAlpha(0.34),

    positive: palette.green,
    negative: palette.ember,
    neutral: white(0.6),

    overlay: 'rgba(6, 7, 9, 0.72)',
    /** Side-to-move indicator. */
    whitePill: palette.bone,
    blackPill: palette.ink600,
  },

  /** Two-stop gradients, as `expo-linear-gradient` colour arrays. */
  gradients: {
    accent: [palette.accent, palette.accentDeep] as const,
    accentDeep: [palette.accent, palette.accentDeeper] as const,
    accentBar: [palette.accentDeeper, palette.accentBright] as const,
    accentColumn: [palette.accentBright, palette.accentShade] as const,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 26,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 17,
    pill: 999,
  },

  /**
   * Two families with two jobs: Space Grotesk carries language, JetBrains Mono
   * carries anything numeric or label-like so digits stay column-aligned as
   * they animate.
   */
  font: {
    sans: 'SpaceGrotesk_400Regular',
    sansMedium: 'SpaceGrotesk_500Medium',
    sansSemibold: 'SpaceGrotesk_600SemiBold',
    sansBold: 'SpaceGrotesk_700Bold',
    mono: 'JetBrainsMono_400Regular',
    monoMedium: 'JetBrainsMono_500Medium',
    monoBold: 'JetBrainsMono_700Bold',
  },

  fontSize: {
    xxs: 9.5,
    xs: 10.5,
    sm: 11.5,
    md: 13,
    lg: 15,
    xl: 17,
    xxl: 20,
    display: 28,
    hero: 54,
  },

  motion: {
    /** Bucket-to-bucket slider movement. */
    quick: 180,
    /** Panels arriving, values counting up. */
    normal: 350,
    /** The engine reveal count-up. */
    reveal: 950,
    /** Ambient glow and breathing loops. */
    ambient: 3400,
  },

  /** Board sizing that the board and its overlays have to agree on. */
  board: {
    maxSize: 420,
    radius: 14,
  },
} as const;

/**
 * Text presets. Every `<Text>` in the app should spread one of these rather
 * than assemble a size/family/weight triple of its own.
 */
export const Type = {
  /** Screen titles and the largest headings. */
  title: {
    fontFamily: Theme.font.sansBold,
    fontSize: Theme.fontSize.xxl,
    color: Theme.colors.text,
    letterSpacing: -0.2,
  },
  /** Card headings and the guess label. */
  heading: {
    fontFamily: Theme.font.sansBold,
    fontSize: Theme.fontSize.xl,
    color: Theme.colors.text,
    letterSpacing: -0.1,
  },
  /** Row titles, button labels. */
  body: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
  },
  /** Secondary sentences under a row title. */
  caption: {
    fontFamily: Theme.font.sans,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
  },
  /** All-caps mono section labels. */
  label: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textFaint,
    letterSpacing: 1.3,
  },
  /** Mono metadata beside a title. */
  meta: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
    letterSpacing: 0.6,
  },
  /** Numbers that carry weight: ratings, deltas, evaluations. */
  numeric: {
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.xl,
    color: Theme.colors.text,
  },
} as const;

export type ThemeColor = keyof typeof Theme.colors;
