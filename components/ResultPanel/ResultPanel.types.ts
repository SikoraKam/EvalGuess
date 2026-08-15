import { EngineEvaluation } from '@/utils/evaluation';

export interface ResultPanelProps {
  userCategory: number;
  engineCategory: number;
  engineEvaluation: EngineEvaluation | undefined;
  categoryDifference: number;
  ratingChange: number;
  /** Rating after the change, which is what the panel reports. */
  playerRating: number;
  /** Endless runs score accuracy but leave the rating alone. */
  unrated?: boolean;
  canReview: boolean;
  onReview: () => void;
  onNext: () => void;
}
