import React, { FC, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { EvaluationResultModalProps } from './EvaluationResultModal.types';
import { StandardButton } from '../common';
import {
  getCategoryLabelBasedOnValue,
  getRangeFromCategoryLabel,
} from '@/utils/categories';
import { formatEngineEvaluation } from '@/utils/evaluation';
import { calculateRatingChange, formatRatingChange } from '@/utils/rating';

export const EvaluationResultModal: FC<EvaluationResultModalProps> = ({
  engineCategory,
  engineEvaluation,
  onNext,
  ratingChange,
  userEvalCategory,
  visible,
}) => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(detailsProgress, {
      toValue: detailsVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    });

    animation.start();
    return () => animation.stop();
  }, [detailsProgress, detailsVisible]);

  const interpolatedHeight = detailsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  const handleNext = () => {
    setDetailsVisible(false);
    onNext();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => undefined}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Evaluation Result</Text>
          </View>

          <Text style={styles.item}>
            Engine Evaluation:{' '}
            <Text style={styles.value}>
              {formatEngineEvaluation(engineEvaluation)} (
              {getCategoryLabelBasedOnValue(engineCategory)})
            </Text>
          </Text>

          <Text style={styles.item}>
            Your Guess:{' '}
            <Text style={styles.value}>
              {getRangeFromCategoryLabel(userEvalCategory)}
            </Text>
          </Text>

          <Text style={styles.item}>
            Rating change:{' '}
            <Text
              style={[
                styles.value,
                ratingChange > 0
                  ? styles.positiveRating
                  : ratingChange < 0
                    ? styles.negativeRating
                    : undefined,
              ]}
            >
              {formatRatingChange(ratingChange)}
            </Text>
          </Text>

          <Pressable
            style={styles.textButton}
            onPress={() => setDetailsVisible((current) => !current)}
          >
            <Text
              style={{ textDecorationLine: 'underline', fontWeight: '600' }}
            >
              {detailsVisible ? 'Hide Details' : 'Show Details'}
            </Text>
          </Pressable>

          <Animated.View
            style={[
              {
                height: interpolatedHeight,
                opacity: detailsProgress,
                overflow: 'hidden',
              },
              detailsVisible && styles.details,
            ]}
          >
            <Text style={styles.detailsText}>Rating rules:</Text>
            <Text style={styles.detailsText}>
              Exact category: {formatRatingChange(calculateRatingChange(0))}
            </Text>
            <Text style={styles.detailsText}>
              Difference of 1: {formatRatingChange(calculateRatingChange(1))}
            </Text>
            <Text style={styles.detailsText}>
              Difference of 2: {formatRatingChange(calculateRatingChange(2))}
            </Text>
            <Text style={styles.detailsText}>
              Difference of 3: {formatRatingChange(calculateRatingChange(3))}
            </Text>
            <Text style={styles.detailsText}>
              Each further category lowers rating further.
            </Text>
          </Animated.View>

          <StandardButton style={styles.button} onPress={handleNext}>
            Next
          </StandardButton>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  item: {
    fontSize: 16,
    marginVertical: 4,
  },
  value: {
    fontWeight: '600',
  },
  positiveRating: {
    color: '#2e7d32',
  },
  negativeRating: {
    color: '#c62828',
  },
  textButton: {
    padding: 4,
    marginTop: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  button: {
    marginTop: 12,
  },
  details: {
    marginTop: 15,
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 8,
  },
  detailsText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
