import { FC, useEffect, useState } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { Theme } from '@/const/theme';
import { useSettings } from '@/providers';

/**
 * The soft accent bloom behind the top of a screen. React Native has no radial
 * gradient, so it is approximated with concentric circles whose opacity falls
 * off towards the edge, breathing slowly.
 */
const RING_COUNT = 5;

export interface GlowOrbProps {
  size: number;
  style?: StyleProp<ViewStyle>;
}

export const GlowOrb: FC<GlowOrbProps> = ({ size, style }) => {
  const { duration } = useSettings();
  const [pulse] = useState(() => new Animated.Value(0));
  const cycle = duration(Theme.motion.ambient) * 2;

  useEffect(() => {
    if (cycle === 0) {
      pulse.setValue(0.5);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: cycle / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: cycle / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [cycle, pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.8],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
        },
        style,
      ]}
    >
      {Array.from({ length: RING_COUNT }, (_, ring) => {
        const scale = 1 - ring / RING_COUNT;

        return (
          <Animated.View
            key={ring}
            style={{
              position: 'absolute',
              width: size * scale,
              height: size * scale,
              borderRadius: (size * scale) / 2,
              backgroundColor: `rgba(141, 143, 201, ${0.045 + ring * 0.006})`,
            }}
          />
        );
      })}
    </Animated.View>
  );
};
