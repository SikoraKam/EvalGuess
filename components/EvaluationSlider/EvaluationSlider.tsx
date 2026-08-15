import { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { MAX_CATEGORY, MIN_CATEGORY } from '@/const/categories';
import { Theme } from '@/const/theme';
import { getCategoryLabel, getCategoryRange } from '@/utils/categories';
import { EvaluationSliderProps } from './EvaluationSlider.types';

export const EvaluationSlider: FC<EvaluationSliderProps> = ({
  setValue,
  value,
  width,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.label}>{getCategoryLabel(value)}</Text>
      <Text style={styles.range}>{getCategoryRange(value)}</Text>

      <Slider
        style={[styles.slider, { width }]}
        minimumValue={MIN_CATEGORY}
        maximumValue={MAX_CATEGORY}
        step={1}
        value={value}
        disabled={disabled}
        onValueChange={setValue}
        minimumTrackTintColor={Theme.colors.primary}
        maximumTrackTintColor={Theme.colors.border}
        accessibilityLabel="Your evaluation"
        accessibilityValue={{ text: getCategoryLabel(value) }}
        tapToSeek
      />

      <View style={styles.scale}>
        <Text style={styles.scaleText}>Black winning</Text>
        <Text style={styles.scaleText}>Equal</Text>
        <Text style={styles.scaleText}>White winning</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '700',
    color: Theme.colors.text,
    textAlign: 'center',
  },
  range: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  slider: {
    height: 40,
    marginTop: Theme.spacing.sm,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Theme.spacing.xs,
  },
  scaleText: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textMuted,
  },
});
