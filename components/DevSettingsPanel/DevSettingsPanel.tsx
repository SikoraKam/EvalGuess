import React, { FC } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
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

export const DevSettingsPanel: FC<DevSettingsPanelProps> = ({
  devSettings,
  onChange,
  sessionRating,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test settings</Text>
      <Text style={styles.caption}>
        Session rating: {sessionRating}. Override only affects position
        selection, not earned points.
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
          onChange({ ...devSettings, ratingOverride: Math.round(ratingOverride) })
        }
        minimumTrackTintColor="#1976d2"
        maximumTrackTintColor="#cccccc"
      />

      <View style={styles.quickRow}>
        {[800, 1000, 1200, 1500, 1800, 2100].map((rating) => (
          <Text
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
            {rating}
          </Text>
        ))}
      </View>

      <Text
        style={styles.resetButton}
        onPress={() =>
          onChange({
            ratingOverrideEnabled: false,
            ratingOverride: STARTING_RATING,
          })
        }
      >
        Reset to session rating
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 420,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  caption: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    flex: 1,
    paddingRight: 12,
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickButton: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: '600',
  },
  quickButtonDisabled: {
    opacity: 0.45,
  },
  resetButton: {
    marginTop: 12,
    color: '#1565c0',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
