import { PressableProps } from 'react-native';

/**
 * `primary` is the gradient call to action, `secondary` the neutral surface
 * beside it, `ghost` a borderless text action.
 */
export type StandardButtonVariant = 'primary' | 'secondary' | 'ghost';

export type StandardButtonProps = PressableProps & {
  variant?: StandardButtonVariant;
  /** Primary buttons that end a screen are uppercase; inline ones are not. */
  uppercase?: boolean;
};
