import { FC, PropsWithChildren } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { DevSettingsPanel } from '@/components';
import { Chip, SectionLabel, Toggle } from '@/components/common';
import {
  BOARD_THEME_NAMES,
  BoardThemeName,
  getBoardTheme,
} from '@/const/boardThemes';
import { Theme } from '@/const/theme';
import { useGame, useSettings } from '@/providers';
import { ANIMATION_SPEEDS, INPUT_STYLES } from '@/utils/settings';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, setSetting } = useSettings();
  const { index, session, devSettings, setDevSettings, resetProgress } =
    useGame();

  const confirmReset = () => {
    // `Alert` is a no-op on web, where a confirm dialog is the equivalent.
    if (Platform.OS === 'web') {
      void resetProgress();
      return;
    }

    Alert.alert(
      'Reset progress?',
      'Your rating, streaks and history are deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => void resetProgress(),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Theme.spacing.md },
      ]}
    >
      <Text style={styles.title}>Settings</Text>

      <Group label="Board">
        <View style={[styles.row, styles.stacked]}>
          <Text style={styles.rowTitle}>Board theme</Text>
          <View style={styles.themes}>
            {BOARD_THEME_NAMES.map((name) => (
              <ThemeSwatch
                key={name}
                name={name}
                selected={settings.boardTheme === name}
                onPress={() => setSetting('boardTheme', name)}
              />
            ))}
          </View>
        </View>

        <SwitchRow
          title="Coordinates"
          caption="Show files and ranks"
          value={settings.coordinates}
          onChange={(value) => setSetting('coordinates', value)}
        />

        <SwitchRow
          title="Always show side to move"
          caption="Pill above the board"
          value={settings.alwaysShowSideToMove}
          onChange={(value) => setSetting('alwaysShowSideToMove', value)}
          last
        />
      </Group>

      <Group label="Gameplay">
        <View style={[styles.row, styles.stacked]}>
          <Text style={styles.rowTitle}>Input style</Text>
          <View style={styles.chips}>
            {INPUT_STYLES.map((style) => (
              <Chip
                key={style}
                label={style}
                selected={settings.inputStyle === style}
                onPress={() => setSetting('inputStyle', style)}
              />
            ))}
          </View>
        </View>

        <SwitchRow
          title="Auto-play best line"
          caption="Steps through the engine's line after each result"
          value={settings.autoPlayBestLine}
          onChange={(value) => setSetting('autoPlayBestLine', value)}
        />

        <View style={[styles.row, styles.stacked, styles.lastRow]}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>Animation speed</Text>
            <Text style={styles.rowValue}>{settings.animationSpeed}</Text>
          </View>
          <View style={styles.chips}>
            {ANIMATION_SPEEDS.map((speed) => (
              <Chip
                key={speed}
                label={speed}
                selected={settings.animationSpeed === speed}
                onPress={() => setSetting('animationSpeed', speed)}
              />
            ))}
          </View>
        </View>
      </Group>

      <Group label="Feedback">
        <SwitchRow
          title="Haptics"
          caption="Vibrate on each guess and result"
          value={settings.haptics}
          onChange={(value) => setSetting('haptics', value)}
          last
        />
      </Group>

      <Group label="Data">
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Position pack</Text>
            <Text style={styles.rowCaption}>
              {index
                ? `${index.manifest.totalPositions.toLocaleString()} positions indexed`
                : 'Loading…'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={confirmReset}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.row,
            styles.lastRow,
            pressed && styles.rowPressed,
          ]}
        >
          <View style={styles.rowText}>
            <Text style={styles.danger}>Reset progress</Text>
            <Text style={styles.rowCaption}>
              {session
                ? `${session.completedPositions} positions answered so far`
                : ' '}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Group>

      {__DEV__ && (
        <View style={styles.dev}>
          <DevSettingsPanel
            devSettings={devSettings}
            onChange={setDevSettings}
            sessionRating={session?.rating ?? 0}
          />
        </View>
      )}

      <Text style={styles.version}>
        EVALGUESS {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </ScrollView>
  );
}

const Group: FC<PropsWithChildren<{ label: string }>> = ({
  label,
  children,
}) => (
  <View style={styles.group}>
    <SectionLabel>{label}</SectionLabel>
    <View style={styles.groupBody}>{children}</View>
  </View>
);

const SwitchRow: FC<{
  title: string;
  caption?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}> = ({ title, caption, value, onChange, last = false }) => (
  <View style={[styles.row, last && styles.lastRow]}>
    <View style={styles.rowText}>
      <Text style={styles.rowTitle}>{title}</Text>
      {caption ? <Text style={styles.rowCaption}>{caption}</Text> : null}
    </View>
    <Toggle value={value} onChange={onChange} accessibilityLabel={title} />
  </View>
);

const ThemeSwatch: FC<{
  name: BoardThemeName;
  selected: boolean;
  onPress: () => void;
}> = ({ name, selected, onPress }) => {
  const theme = getBoardTheme(name);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.swatchWrapper, selected && styles.swatchSelected]}
    >
      <View style={styles.swatch}>
        <View style={[styles.swatchHalf, { backgroundColor: theme.light }]} />
        <View style={[styles.swatchHalf, { backgroundColor: theme.dark }]} />
      </View>
      <Text style={[styles.swatchLabel, selected && styles.swatchLabelOn]}>
        {name}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xxl,
  },
  title: {
    fontFamily: Theme.font.sansBold,
    fontSize: Theme.fontSize.xxl,
    color: Theme.colors.text,
    letterSpacing: -0.2,
    marginBottom: Theme.spacing.xl,
  },
  group: {
    marginBottom: Theme.spacing.lg,
  },
  groupBody: {
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: Theme.colors.surfaceStrong,
  },
  stacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: Theme.spacing.md - 2,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
  },
  rowCaption: {
    fontFamily: Theme.font.sans,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textFaint,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.accentBright,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm - 1,
  },
  themes: {
    flexDirection: 'row',
    gap: Theme.spacing.sm + 1,
  },
  swatchWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: Theme.spacing.sm - 2,
    paddingVertical: Theme.spacing.sm - 1,
    paddingHorizontal: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  swatchSelected: {
    borderColor: Theme.colors.accentBorderStrong,
    backgroundColor: Theme.colors.accentTint,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: Theme.radius.sm,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  swatchHalf: {
    flex: 1,
  },
  swatchLabel: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textMuted,
  },
  swatchLabelOn: {
    color: Theme.colors.accentPale,
  },
  danger: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.negative,
  },
  chevron: {
    fontSize: 16,
    color: Theme.colors.textGhost,
  },
  dev: {
    marginBottom: Theme.spacing.lg,
  },
  version: {
    textAlign: 'center',
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textGhost,
    letterSpacing: 0.8,
    marginTop: Theme.spacing.sm,
  },
});
