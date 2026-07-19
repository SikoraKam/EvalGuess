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
  getCategoryDifference,
  getPointsBasedOnCategoryDifference,
  getRangeFromCategoryLabel,
} from '@/utils/categories';
import { formatEngineEvaluation } from '@/utils/evaluation';

export const EvaluationResultModal: FC<EvaluationResultModalProps> = ({
  engineCategory,
  engineEvaluation,
  onNext,
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
            Points Earned:{' '}
            <Text style={styles.value}>
              {getPointsBasedOnCategoryDifference(
                getCategoryDifference(userEvalCategory, engineCategory),
              )}
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
            <Text style={styles.detailsText}>Scoring Rules:</Text>
            <Text style={styles.detailsText}>
              Exact category match: 10 points
            </Text>
            <Text style={styles.detailsText}>
              Difference of 1 category: 7 points
            </Text>
            <Text style={styles.detailsText}>
              Difference of 2 categories: 5 points
            </Text>
            <Text style={styles.detailsText}>
              Difference of 3 categories: 3 points
            </Text>
            <Text style={styles.detailsText}>
              Difference of 4 categories: 1 points
            </Text>
            <Text style={styles.detailsText}>
              Difference of 5 or more categories: 0 points
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
