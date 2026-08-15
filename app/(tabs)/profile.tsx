import { FC } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusScreen } from '@/components';
import {
  Card,
  Pill,
  SectionLabel,
  Sparkline,
  StatTile,
} from '@/components/common';
import { Theme } from '@/const/theme';
import { useGame } from '@/providers';
import { getCategoryLabel } from '@/utils/categories';
import { GuessRecord } from '@/utils/gameSession';
import { formatRatingChange } from '@/utils/rating';
import { BucketAccuracy } from '@/utils/stats';

/** How many of the most recent bars get the full accent treatment. */
const HOT_BARS = 4;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { stats, session } = useGame();

  if (!stats || !session) {
    return <StatusScreen message="Loading game data…" />;
  }

  const history = stats.ratingHistory;
  const hasHistory = history.length > 1;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Theme.spacing.md },
      ]}
    >
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarGlyph}>◆</Text>
        </View>

        <View style={styles.identityText}>
          <Text style={styles.title}>{stats.title}</Text>
          <Text style={styles.subtitle}>
            {stats.rating} ELO · {stats.completedPositions} POSITIONS
          </Text>
        </View>

        <Pill label={`▲ ${stats.currentStreak}`} />
      </View>

      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartLabel}>
            {hasHistory
              ? `RATING · LAST ${history.length} ANSWERS`
              : 'RATING HISTORY'}
          </Text>
          {hasHistory && (
            <Text
              style={[
                styles.chartTrend,
                {
                  color:
                    stats.ratingTrend >= 0
                      ? Theme.colors.positive
                      : Theme.colors.negative,
                },
              ]}
            >
              {stats.ratingTrend > 0 ? '+' : stats.ratingTrend < 0 ? '−' : ''}
              {Math.abs(stats.ratingTrend)}
            </Text>
          )}
        </View>

        {hasHistory ? (
          <>
            <Sparkline
              values={history}
              height={96}
              highlightLast={HOT_BARS}
              style={styles.chart}
            />

            <View style={styles.chartAxis}>
              <Text style={styles.axisText}>{history[0]}</Text>
              <Text style={styles.axisText}>PEAK {stats.peakRating}</Text>
              <Text style={styles.axisText}>{stats.rating}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.chartEmpty}>
            Answer a few positions and your rating will chart here.
          </Text>
        )}
      </Card>

      <View style={styles.tiles}>
        <StatTile
          style={styles.tile}
          value={String(stats.completedPositions)}
          label="positions"
        />
        <StatTile
          style={styles.tile}
          value={
            stats.exactPercentage === null ? '–' : `${stats.exactPercentage}%`
          }
          label="exact"
        />
        <StatTile
          style={styles.tile}
          value={String(stats.bestStreak)}
          label="best streak"
          highlighted
        />
      </View>

      <View style={styles.section}>
        <SectionLabel>Accuracy by bucket</SectionLabel>
        <View style={styles.buckets}>
          {stats.buckets.map((bucket) => (
            <BucketRow key={bucket.name} bucket={bucket} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>Recent</SectionLabel>

        {session.recentGuesses.length === 0 ? (
          <Text style={styles.empty}>
            Answers you give show up here, newest first.
          </Text>
        ) : (
          <View style={styles.recent}>
            {session.recentGuesses.map((record, index) => (
              <RecentRow key={index} record={record} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const BucketRow: FC<{ bucket: BucketAccuracy }> = ({ bucket }) => (
  <View style={styles.bucketRow}>
    <Text style={styles.bucketName}>{bucket.name}</Text>
    <View style={styles.bucketTrack}>
      <View
        style={[styles.bucketFill, { width: `${bucket.percentage ?? 0}%` }]}
      />
    </View>
    <Text style={styles.bucketValue}>
      {bucket.percentage === null ? '–' : `${bucket.percentage}%`}
    </Text>
  </View>
);

const RecentRow: FC<{ record: GuessRecord }> = ({ record }) => {
  const color =
    record.ratingChange > 0
      ? Theme.colors.positive
      : record.ratingChange < 0
        ? Theme.colors.negative
        : Theme.colors.neutral;

  return (
    <View style={styles.recentRow}>
      <View style={[styles.recentDot, { backgroundColor: color }]} />
      <Text style={styles.recentText} numberOfLines={1}>
        {record.categoryDifference === 0
          ? 'Exact'
          : `${record.categoryDifference} off`}{' '}
        · {getCategoryLabel(record.engineCategory)}
      </Text>
      <Text style={[styles.recentDelta, { color }]}>
        {formatRatingChange(record.ratingChange)}
      </Text>
    </View>
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
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md + 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.accentBorder,
    backgroundColor: Theme.colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: {
    fontSize: 20,
    color: Theme.colors.accentBright,
  },
  identityText: {
    flex: 1,
  },
  title: {
    fontFamily: Theme.font.sansBold,
    fontSize: Theme.fontSize.xl,
    color: Theme.colors.text,
  },
  subtitle: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textFaint,
    letterSpacing: 0.7,
    marginTop: 3,
  },
  chartCard: {
    marginTop: Theme.spacing.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  chartLabel: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textFaint,
    letterSpacing: 1.2,
  },
  chartTrend: {
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.sm,
  },
  chart: {
    marginTop: Theme.spacing.md + 2,
  },
  chartEmpty: {
    fontFamily: Theme.font.sans,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textFaint,
    marginTop: Theme.spacing.sm,
  },
  chartAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.sm,
  },
  axisText: {
    fontFamily: Theme.font.monoMedium,
    fontSize: Theme.fontSize.xxs,
    color: Theme.colors.textGhost,
  },
  tiles: {
    flexDirection: 'row',
    gap: Theme.spacing.sm + 1,
    marginTop: Theme.spacing.md,
  },
  tile: {
    flex: 1,
  },
  section: {
    marginTop: Theme.spacing.xl,
  },
  buckets: {
    gap: Theme.spacing.sm,
  },
  bucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm + 2,
  },
  bucketName: {
    width: 96,
    fontFamily: Theme.font.sansMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.neutral,
  },
  bucketTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: Theme.colors.surfaceSunken,
    overflow: 'hidden',
  },
  bucketFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Theme.colors.accent,
  },
  bucketValue: {
    width: 34,
    textAlign: 'right',
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textMuted,
  },
  recent: {
    gap: Theme.spacing.sm - 1,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm + 2,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm + 2,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  recentDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  recentText: {
    flex: 1,
    fontFamily: Theme.font.sansMedium,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.neutral,
  },
  recentDelta: {
    fontFamily: Theme.font.monoBold,
    fontSize: Theme.fontSize.sm,
  },
  empty: {
    fontFamily: Theme.font.sans,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textFaint,
  },
});
