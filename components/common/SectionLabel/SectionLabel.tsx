import { FC } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { Theme, Type } from '@/const/theme';

/** The all-caps mono line that opens a group of rows. */
export const SectionLabel: FC<{
  children: string;
  style?: StyleProp<TextStyle>;
}> = ({ children, style }) => (
  <Text style={[styles.label, style]}>{children.toUpperCase()}</Text>
);

const styles = StyleSheet.create({
  label: {
    ...Type.label,
    marginBottom: Theme.spacing.sm,
  },
});
