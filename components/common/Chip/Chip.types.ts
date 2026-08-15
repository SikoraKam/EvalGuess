import { StyleProp, ViewStyle } from 'react-native';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}
