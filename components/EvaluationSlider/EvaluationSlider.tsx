import React, { FC } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { getCategoryLabelBasedOnValue } from '@/utils/categories';
import { EvaluationSliderProps } from './EvaluationSlider.types';

const { width: windowWidth } = Dimensions.get('window');

export const EvaluationSlider: FC<EvaluationSliderProps> = ({
  setValue,
  value,
}) => {
  return (
    <View style={styles.container}>
      <Slider
        style={{ height: 40, width: windowWidth - 80 }}
        minimumValue={-5}
        maximumValue={5}
        step={1}
        value={value}
        onValueChange={setValue}
        minimumTrackTintColor="#4CAF50"
        maximumTrackTintColor="#ddd"
        tapToSeek
      />

      <Text style={styles.title}>{getCategoryLabelBasedOnValue(value)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 5,
  },
  tick: {
    fontSize: 12,
    textAlign: 'center',
    width: 20,
  },
});
