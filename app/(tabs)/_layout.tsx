import { FC } from 'react';
import { ColorValue, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Theme } from '@/const/theme';

/**
 * Glyphs rather than an icon set: the design's marks are geometric, and three
 * characters keep the bar free of another asset dependency.
 */
const TabGlyph: FC<{ glyph: string; color: ColorValue }> = ({
  glyph,
  color,
}) => <Text style={[styles.glyph, { color }]}>{glyph}</Text>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Theme.colors.background },
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: Theme.colors.accentBright,
        tabBarInactiveTintColor: Theme.colors.textFaint,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
      }}
    >
      <Tabs.Screen
        name="(train)"
        options={{
          title: 'Train',
          tabBarIcon: ({ color }) => <TabGlyph glyph="◆" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabGlyph glyph="●" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabGlyph glyph="⚙" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Theme.colors.bar,
    borderTopColor: Theme.colors.border,
    borderTopWidth: 1,
    height: 74,
    paddingTop: Theme.spacing.sm,
  },
  item: {
    paddingVertical: Theme.spacing.xs,
  },
  label: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.xs,
  },
  glyph: {
    fontSize: 15,
    lineHeight: 18,
  },
});
