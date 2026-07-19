import { FC } from 'react';
import { Pressable, Text } from 'react-native';
import { StandardButtonProps } from './StandardButton.types';

export const StandardButton: FC<StandardButtonProps> = ({
  children,
  style,
  ...props
}) => {
  return (
    <Pressable
      {...props}
      style={(state) => [
        {
          backgroundColor: state.pressed ? '#ddd' : '#4CAF50',
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
        },
        props.disabled && { backgroundColor: '#ccc' },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={{ color: '#fff', fontSize: 16 }}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
};
