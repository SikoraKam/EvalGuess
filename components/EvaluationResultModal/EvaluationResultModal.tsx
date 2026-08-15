import { FC, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { EvaluationResultModalProps } from './EvaluationResultModal.types';
import { StandardButton } from '../common';
import { Theme } from '@/const/theme';
import { getCategoryLabel, getCategoryRange } from '@/utils/categories';
import { formatEngineEvaluation } from '@/utils/evaluation';
import { calculateRatingChange, formatRatingChange } from '@/utils/rating';

const DIFFERENCE_ROWS = [0, 1, 2, 3];

export const EvaluationResultModal: FC<EvaluationResultModalProps> = ({
  engineCategory,
  engineEvaluation,
  onNext,
  onReview,
  canReview,
  ratingChange,
  userCategory,
  visible,
  playerRating,
  positionRating,
}) => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const isExact = userCategory === engineCategory;

  const ratingStyle =
    ratingChange > 0
      ? styles.positiveRating
      : ratingChange < 0
        ? styles.negativeRating
        : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onNext}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {isExact ? 'Exact guess' : 'Evaluation result'}
          </Text>

          <View style={styles.comparison}>
            <View style={styles.column}>
              <Text style={styles.columnTitle}>Your guess</Text>
              <Text style={styles.columnValue}>
                {getCategoryLabel(userCategory)}
              </Text>
              <Text style={styles.columnRange}>
                {getCategoryRange(userCategory)}
              </Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.columnTitle}>Engine</Text>
              <Text style={styles.columnValue}>
                {getCategoryLabel(engineCategory)}
              </Text>
              <Text style={styles.columnRange}>
                {formatEngineEvaluation(engineEvaluation)}
              </Text>
            </View>
          </View>

          <Text style={styles.item}>
            Rating change:{' '}
            <Text style={[styles.value, ratingStyle]}>
              {formatRatingChange(ratingChange)}
            </Text>{' '}
            <Text style={styles.muted}>
              (you {playerRating} vs position {positionRating})
            </Text>
          </Text>

          <Pressable
            style={styles.textButton}
            onPress={() => setDetailsVisible((current) => !current)}
          >
            <Text style={styles.textButtonLabel}>
              {detailsVisible ? 'Hide details' : 'Show details'}
            </Text>
          </Pressable>

          {detailsVisible && (
            <View style={styles.details}>
              <Text style={styles.detailsText}>
                What each guess would have been worth here:
              </Text>
              {DIFFERENCE_ROWS.map((difference) => (
                <Text key={difference} style={styles.detailsText}>
                  {difference === 0
                    ? 'Exact category'
                    : `${difference} category off`}
                  :{' '}
                  {formatRatingChange(
                    calculateRatingChange(
                      playerRating,
                      positionRating,
                      difference,
                    ),
                  )}
                </Text>
              ))}
              <Text style={styles.detailsText}>
                4 or more off scores nothing.
              </Text>
            </View>
          )}

          {canReview && (
            <StandardButton
              variant="secondary"
              style={styles.button}
              onPress={onReview}
            >
              Review the best line
            </StandardButton>
          )}

          <StandardButton style={styles.button} onPress={onNext}>
            Next position
          </StandardButton>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.xl,
    borderRadius: Theme.radius.lg,
    elevation: 10,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.lg,
  },
  comparison: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  column: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.surface,
  },
  columnTitle: {
    fontSize: Theme.fontSize.xs,
    textTransform: 'uppercase',
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.xs,
  },
  columnValue: {
    fontSize: Theme.fontSize.md,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  columnRange: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  item: {
    fontSize: Theme.fontSize.lg,
    marginTop: Theme.spacing.lg,
    color: Theme.colors.text,
  },
  value: {
    fontWeight: '700',
  },
  muted: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
  },
  positiveRating: {
    color: Theme.colors.positive,
  },
  negativeRating: {
    color: Theme.colors.negative,
  },
  textButton: {
    paddingVertical: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
    alignItems: 'center',
  },
  textButtonLabel: {
    textDecorationLine: 'underline',
    fontWeight: '600',
    color: Theme.colors.accentText,
  },
  details: {
    marginTop: Theme.spacing.sm,
    backgroundColor: Theme.colors.surfaceAlt,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
  },
  detailsText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  button: {
    marginTop: Theme.spacing.md,
  },
});
