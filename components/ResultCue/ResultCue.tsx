import { FC, useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/const/theme';
import { formatRatingChange } from '@/utils/rating';
import { ResultCueProps } from './ResultCue.types';

function playFeedback(ratingChange: number) {
  if (Platform.OS === 'web') {
    return;
  }

  const style =
    ratingChange > 0
      ? Haptics.NotificationFeedbackType.Success
      : ratingChange < 0
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Error;

  void Haptics.notificationAsync(style).catch(() => undefined);
}

export const ResultCue: FC<ResultCueProps> = ({
  onComplete,
  ratingChange,
  visible,
}) => {
  const [progress] = useState(() => new Animated.Value(0));
  const color =
    ratingChange > 0
      ? Theme.colors.positive
      : ratingChange < 0
        ? Theme.colors.negative
        : Theme.colors.neutral;

  useEffect(() => {
    if (!visible) {
      return;
    }

    playFeedback(ratingChange);
    progress.setValue(0);

    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 0.7,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(progress, {
        toValue: 1,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.delay(220),
      Animated.timing(progress, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });

    return () => animation.stop();
  }, [onComplete, progress, ratingChange, visible]);

  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 1, 1.2],
    outputRange: [0, 1, 1, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.7, 1, 1.2],
    outputRange: [0.5, 1.25, 1, 0.7],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.7, 1, 1.2],
    outputRange: [110, -8, 0, 55],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 0.7, 1, 1.2],
    outputRange: [-35, 5, 0, -18],
  });

  return (
    <Modal transparent visible={visible} statusBarTranslucent>
      <View pointerEvents="none" style={styles.container}>
        <Animated.View
          style={[
            styles.cue,
            { opacity, transform: [{ translateX }, { translateY }, { scale }] },
          ]}
        >
          <Text style={[styles.value, { color }]}>
            {formatRatingChange(ratingChange)}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cue: {
    position: 'absolute',
    right: 20,
    top: 66,
  },
  value: {
    fontSize: 42,
    fontWeight: '800',
  },
});
