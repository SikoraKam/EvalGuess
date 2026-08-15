import { FC } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
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
  onResetProgress: () => void;
  width: number;
}

const QUICK_RATINGS = [700, 1000, 1300, 1600, 1900, 2200];

export const DevSettingsPanel: FC<DevSettingsPanelProps> = ({
  devSettings,
  onChange,
  sessionRating,
  onResetProgress,
  width,
}) => {
  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>Test settings</Text>
      <Text style={styles.caption}>
        Session rating: {sessionRating}. The override only affects which
        positions are served, not the rating you earn.
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Override rating for selection</Text>
        <Switch
          value={devSettings.ratingOverrideEnabled}
          onValueChange={(ratingOverrideEnabled) =>
            onChange({ ...devSettings, ratingOverrideEnabled })
          }
        />
      </View>

      <Text style={styles.valueLabel}>
        Selection rating: {devSettings.ratingOverride}
      </Text>

      <Slider
        disabled={!devSettings.ratingOverrideEnabled}
        minimumValue={MIN_POSITION_RATING}
        maximumValue={MAX_POSITION_RATING}
        step={50}
        value={devSettings.ratingOverride}
        onValueChange={(ratingOverride) =>
          onChange({
            ...devSettings,
            ratingOverride: Math.round(ratingOverride),
          })
        }
        minimumTrackTintColor={Theme.colors.accent}
        maximumTrackTintColor={Theme.colors.disabled}
      />

      <View style={styles.quickRow}>
        {QUICK_RATINGS.map((rating) => (
          <Pressable
            key={rating}
            style={[
              styles.quickButton,
              !devSettings.ratingOverrideEnabled && styles.quickButtonDisabled,
            ]}
            onPress={() =>
              onChange({
                ...devSettings,
                ratingOverrideEnabled: true,
                ratingOverride: rating,
              })
            }
          >
            <Text style={styles.quickButtonText}>{rating}</Text>
          </Pressable>
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
        <Text style={styles.linkButton}>Reset to session rating</Text>
      </Pressable>

      <Pressable onPress={onResetProgress}>
        <Text style={[styles.linkButton, styles.dangerButton]}>
          Wipe saved progress
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.xl,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.surface,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    fontWeight: '700',
    marginBottom: Theme.spacing.xs,
    color: Theme.colors.text,
  },
  caption: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  label: {
    fontSize: Theme.fontSize.md,
    flex: 1,
    paddingRight: Theme.spacing.md,
    color: Theme.colors.text,
  },
  valueLabel: {
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
    color: Theme.colors.text,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  quickButton: {
    backgroundColor: Theme.colors.accentSoft,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.md,
  },
  quickButtonDisabled: {
    opacity: 0.45,
  },
  quickButtonText: {
    color: Theme.colors.accentText,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: Theme.spacing.md,
    color: Theme.colors.accentText,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  dangerButton: {
    color: Theme.colors.negative,
  },
});
