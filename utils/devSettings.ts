export interface DevSettings {
  ratingOverrideEnabled: boolean;
  ratingOverride: number;
}

export const DEFAULT_DEV_SETTINGS: DevSettings = {
  ratingOverrideEnabled: false,
  ratingOverride: 1000,
};

export function getEffectiveRating(
  sessionRating: number,
  devSettings: DevSettings,
): number {
  if (devSettings.ratingOverrideEnabled) {
    return devSettings.ratingOverride;
  }

  return sessionRating;
}
