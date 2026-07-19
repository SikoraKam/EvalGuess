import { CategoryLabels } from '@/const/categories';
import { EngineEvaluation } from '@/utils/evaluation';

export interface EvaluationResultModalProps {
  visible: boolean;
  onNext: () => void;
  engineCategory: number;
  engineEvaluation: EngineEvaluation | undefined;
  userEvalCategory: CategoryLabels;
}
