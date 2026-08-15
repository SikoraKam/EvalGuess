import { EngineEvaluation } from '@/utils/evaluation';

export interface EvaluationResultModalProps {
  visible: boolean;
  onNext: () => void;
  onReview: () => void;
  canReview: boolean;
  engineCategory: number;
  engineEvaluation: EngineEvaluation | undefined;
  userCategory: number;
  ratingChange: number;
  playerRating: number;
  positionRating: number;
}
