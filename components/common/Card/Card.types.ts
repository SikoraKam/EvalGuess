import { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

/**
 * `accent` is reserved for the single most important card on a screen — the
 * design only ever tints one thing at a time.
 */
export type CardVariant = 'default' | 'strong' | 'accent';

export interface CardProps extends PropsWithChildren {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
}
