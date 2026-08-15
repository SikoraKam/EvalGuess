import { PressableProps } from 'react-native';

export type StandardButtonProps = PressableProps & {
  variant?: 'primary' | 'secondary';
};
