import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Card, Chip, SectionLabel, Toggle } from '../common';
import { Theme } from '@/const/theme';
import { DevSettings } from '@/utils/devSettings';
import { STARTING_RATING } from '@/utils/rating';
import {
  MAX_POSITION_RATING,
  MIN_POSITION_RATING,
} from '@/utils/positionDifficulty';

interface DevSettingsPanelProps {
  devSettings: DevSettings;
  onChange: (settings: DevSettings) => void;
  sessionRating: number;
}

const QUICK_RATINGS = [700, 1000, 1300, 1600, 1900, 2200];

export const DevSettingsPanel: FC<DevSettingsPanelProps> = ({
  devSettings,
  onChange,
  sessionRating,
}) => {
  const { ratingOverrideEnabled, ratingOverride } = devSettings;

  return (
    <View>
      <SectionLabel>Test settings</SectionLabel>

      <Card>
        <Text style={styles.caption}>
          Session rating: {sessionRating}. The override only affects which
          positions are served, not the rating you earn.
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Override rating for selection</Text>
          <Toggle
            value={ratingOverrideEnabled}
            accessibilityLabel="Override rating for selection"
            onChange={(enabled) =>
              onChange({ ...devSettings, ratingOverrideEnabled: enabled })
            }
          />
        </View>

        <Text style={styles.value}>Selection rating: {ratingOverride}</Text>

        <Slider
          disabled={!ratingOverrideEnabled}
          minimumValue={MIN_POSITION_RATING}
          maximumValue={MAX_POSITION_RATING}
          step={50}
          value={ratingOverride}
          onValueChange={(rating) =>
            onChange({ ...devSettings, ratingOverride: Math.round(rating) })
          }
          minimumTrackTintColor={Theme.colors.accent}
          maximumTrackTintColor={Theme.colors.surfaceTrack}
        />

        <View style={styles.quickRow}>
          {QUICK_RATINGS.map((rating) => (
            <Chip
              key={rating}
              label={String(rating)}
              selected={ratingOverrideEnabled && ratingOverride === rating}
              onPress={() =>
                onChange({
                  ratingOverrideEnabled: true,
                  ratingOverride: rating,
                })
              }
            />
          ))}
        </View>

        <Pressable
          onPress={() =>
            onChange({
              ratingOverrideEnabled: false,
              ratingOverride: STARTING_RATING,
            })
          }
        >
          <Text style={styles.link}>Reset to session rating</Text>
        </Pressable>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  caption: {
    fontFamily: Theme.font.sans,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  label: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
    flex: 1,
  },
  value: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  link: {
    marginTop: Theme.spacing.md,
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.accentBright,
  },
});
