import React, { useState, useRef, FC } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { EvaluationResultModalProps } from './EvaluationResultModal.types';
import { AntDesign } from '@expo/vector-icons';
import { StandardButton } from '../common';
import {
  getCategoryDifference,
  getPointsBasedOnCategoryDifference,
  getRangeFromCategoryLabel,
} from '@/utils/categories';

export const EvaluationResultModal: FC<EvaluationResultModalProps> = ({
  engineEval,
  onClose,
  points,
  userEvalCategory,
  visible,
}) => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [shouldApplyDetailsStyle, setShouldApplyDetailsStyle] = useState(false); // style gate

  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  const toggleDetails = () => {
    const showing = !detailsVisible;
    setDetailsVisible(showing);

    if (showing) {
      setShouldApplyDetailsStyle(true); // show styles immediately
    }

    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: showing ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: showing ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (!showing) {
        setShouldApplyDetailsStyle(false); // remove styles after animation ends
      }
    });
  };

  const interpolatedHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={{ height: 24, width: 24 }} />
            <Text style={styles.title}>Evaluation Result</Text>

            <Pressable onPress={onClose}>
              <AntDesign name="close" size={24} color="gray" />
            </Pressable>
          </View>

          <Text style={styles.item}>
            Engine Evaluation: <Text style={styles.value}>{engineEval}</Text>
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
                getCategoryDifference(userEvalCategory, engineEval),
              )}
            </Text>
          </Text>

          <Pressable style={styles.textButton} onPress={toggleDetails}>
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
                opacity: animatedOpacity,
                overflow: 'hidden',
              },
              shouldApplyDetailsStyle && styles.details,
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

          <StandardButton style={styles.button}>Next</StandardButton>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
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
