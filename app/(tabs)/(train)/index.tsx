import { FC } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Card,
  GlowOrb,
  Pill,
  ProgressBar,
  Sparkline,
} from '@/components/common';
import { StatusScreen } from '@/components';
import { Theme } from '@/const/theme';
import { GameMode, useGame, useSettings } from '@/providers';

/** Bars on the home spark chart. Enough to read a trend, few enough to fit. */
const HOME_HISTORY_LENGTH = 7;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { haptic } = useSettings();
  const { phase, stats, session, setMode, errorMessage, retry } = useGame();

  if (phase === 'error') {
    return (
      <StatusScreen
        message="Could not load the position data"
        detail={errorMessage ?? undefined}
        onRetry={retry}
      />
    );
  }

  if (!stats || !session) {
    return <StatusScreen message="Loading game data…" />;
  }

  const start = (mode: GameMode) => {
    haptic('light');
    setMode(mode);
    router.push('/play');
  };

  const history = stats.ratingHistory.slice(-HOME_HISTORY_LENGTH);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Theme.spacing.md },
      ]}
    >
      <GlowOrb size={340} style={styles.glow} />

      <View style={styles.header}>
        <LinearGradient
          colors={Theme.gradients.accentDeep}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mark}
        >
          <Text style={styles.markLetter}>E</Text>
        </LinearGradient>

        <Text style={styles.wordmark}>EvalGuess</Text>

        <Pill
          style={styles.headerPill}
          label={
            stats.currentStreak > 0
              ? `▲ ${stats.currentStreak} streak`
              : 'No streak yet'
          }
        />
      </View>

      <Text style={styles.ratingLabel}>CURRENT RATING</Text>

      <View style={styles.ratingRow}>
        <Text style={styles.rating}>{stats.rating}</Text>
        {stats.ratingTrend !== 0 && (
          <Text
            style={[
              styles.trend,
              {
                color:
                  stats.ratingTrend > 0
                    ? Theme.colors.positive
                    : Theme.colors.negative,
              },
            ]}
          >
            {stats.ratingTrend > 0 ? '+' : '−'}
            {Math.abs(stats.ratingTrend)} this run
          </Text>
        )}
      </View>

      <Sparkline
        values={history}
        height={52}
        highlightLast={1}
        style={styles.spark}
      />

      <Pressable onPress={() => start('rated')}>
        {({ pressed }) => (
          <Card
            variant="accent"
            style={[styles.primary, pressed && styles.pressed]}
          >
            <View style={styles.primaryText}>
              <Text style={styles.primaryTitle}>
                {stats.completedPositions > 0
                  ? 'Continue rated run'
                  : 'Start rated run'}
              </Text>
              <Text style={styles.primaryMeta}>
                POSITION {stats.completedPositions + 1} ·{' '}
                {session.currentPositionRating} ELO · {stats.solvedToday} TODAY
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Card>
        )}
      </Pressable>

      <View style={styles.modes}>
        <ModeCard
          glyph="◈"
          title="Endless"
          caption="Unrated practice"
          onPress={() => start('endless')}
        />
        <ModeCard
          glyph={stats.isDailyComplete ? '✓' : '◷'}
          title="Daily set"
          caption={
            stats.isDailyComplete
              ? 'Done · back tomorrow'
              : `${stats.dailyTarget} positions · ${stats.dailyRemaining} left`
          }
          disabled={stats.isDailyComplete}
          onPress={() => start('daily')}
        />
      </View>

      <Card style={styles.target}>
        <View style={styles.targetHeader}>
          <Text style={styles.targetLabel}>TODAY&apos;S TARGET</Text>
          <Text style={styles.targetCount}>
            {stats.dailySolved} / {stats.dailyTarget}
          </Text>
        </View>

        <ProgressBar progress={stats.dailyProgress} style={styles.targetBar} />

        <View style={styles.targetStats}>
          <MiniStat
            value={
              stats.exactPercentage === null ? '–' : `${stats.exactPercentage}%`
            }
            label="exact"
          />
          <MiniStat
            value={
              stats.averageError === null ? '–' : stats.averageError.toFixed(1)
            }
            label="avg. error"
          />
          <MiniStat value={String(stats.bestStreak)} label="best streak" />
        </View>
      </Card>
    </ScrollView>
  );
}

const ModeCard: FC<{
  glyph: string;
  title: string;
  caption: string;
  disabled?: boolean;
  onPress: () => void;
}> = ({ glyph, title, caption, disabled = false, onPress }) => (
  <Pressable
    style={styles.modeWrapper}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    onPress={onPress}
  >
    {({ pressed }) => (
      <Card
        style={[
          styles.mode,
          pressed && styles.pressed,
          disabled && styles.modeDone,
        ]}
      >
        <Text style={styles.modeGlyph}>{glyph}</Text>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeCaption}>{caption}</Text>
      </Card>
    )}
  </Pressable>
);

const MiniStat: FC<{ value: string; label: string }> = ({ value, label }) => (
  <View>
    <Text style={styles.miniValue}>{value}</Text>
    <Text style={styles.miniLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xxl,
  },
  glow: {
    top: -170,
    right: -110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md - 1,
  },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    fontFamily: Theme.font.sansBold,
    fontSize: Theme.fontSize.xl,
    color: Theme.colors.onAccent,
  },
  wordmark: {
    fontFamily: Theme.font.sansBold,
    fontSize: 19,
    color: Theme.colors.text,
    letterSpacing: -0.2,
  },
  headerPill: {
    marginLeft: 'auto',
  },
  ratingLabel: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textFaint,
    letterSpacing: 1.8,
    marginTop: Theme.spacing.xxl,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Theme.spacing.sm + 2,
    marginTop: 2,
  },
  rating: {
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.hero,
    color: Theme.colors.text,
    letterSpacing: -1.6,
    lineHeight: 58,
  },
  trend: {
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.md,
    paddingBottom: Theme.spacing.sm,
  },
  spark: {
    marginTop: Theme.spacing.md,
  },
  primary: {
    marginTop: Theme.spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryText: {
    flex: 1,
  },
  primaryTitle: {
    fontFamily: Theme.font.sansBold,
    fontSize: Theme.fontSize.lg,
    color: Theme.colors.accentPale,
  },
  primaryMeta: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs,
  },
  chevron: {
    fontSize: 20,
    color: Theme.colors.accentBright,
  },
  pressed: {
    opacity: 0.75,
  },
  modes: {
    flexDirection: 'row',
    gap: Theme.spacing.md - 1,
    marginTop: Theme.spacing.md - 1,
  },
  modeWrapper: {
    flex: 1,
  },
  mode: {
    borderRadius: Theme.radius.xl,
  },
  modeDone: {
    opacity: 0.55,
  },
  modeGlyph: {
    fontSize: 16,
    color: Theme.colors.textMuted,
  },
  modeTitle: {
    fontFamily: Theme.font.sansSemibold,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
    marginTop: Theme.spacing.sm + 1,
  },
  modeCaption: {
    fontFamily: Theme.font.sans,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textFaint,
    marginTop: 2,
  },
  target: {
    marginTop: Theme.spacing.md - 1,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  targetLabel: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textFaint,
    letterSpacing: 1.4,
  },
  targetCount: {
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.accentBright,
  },
  targetBar: {
    marginTop: Theme.spacing.sm + 1,
  },
  targetStats: {
    flexDirection: 'row',
    gap: Theme.spacing.xxl,
    marginTop: Theme.spacing.md + 2,
  },
  miniValue: {
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.xl,
    color: Theme.colors.text,
  },
  miniLabel: {
    fontFamily: Theme.font.sans,
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textFaint,
    marginTop: 1,
  },
});
