import { CategoryLabels } from '@/const/categories';

export interface EvaluationResultModalProps {
  visible: boolean;
  onClose: () => void;
  onNext: () => void;
  engineEval: number;
  userEvalCategory: CategoryLabels;
}
