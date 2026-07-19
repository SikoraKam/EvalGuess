import { FC, useEffect, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { ResultCueKind, ResultCueProps } from './ResultCue.types';

const cueContent: Record<ResultCueKind, { color: string; emoji: string }> = {
  exact: { color: '#2e7d32', emoji: '👍' },
  close: { color: '#f9a825', emoji: '👏' },
  incorrect: { color: '#c62828', emoji: '👎' },
};

export const ResultCue: FC<ResultCueProps> = ({
  kind,
  onComplete,
  visible,
}) => {
  const [progress] = useState(() => new Animated.Value(0));
  const content = cueContent[kind];

  useEffect(() => {
    if (!visible) {
      return;
    }

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
  }, [onComplete, progress, visible]);

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
            {
              backgroundColor: content.color,
              opacity,
              transform: [{ translateX }, { translateY }, { scale }],
            },
          ]}
        >
          <Text style={styles.emoji}>{content.emoji}</Text>
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
    alignItems: 'center',
    borderRadius: 32,
    elevation: 8,
    height: 64,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    top: 66,
    width: 64,
  },
  emoji: {
    fontSize: 36,
  },
});
