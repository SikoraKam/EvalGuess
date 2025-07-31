import { CategoryLabels } from '@/const/categories';

export interface EvaluationResultModalProps {
  visible: boolean;
  onClose: () => void;
  engineEval: number;
  userEvalCategory: CategoryLabels;
  points: number;
}
