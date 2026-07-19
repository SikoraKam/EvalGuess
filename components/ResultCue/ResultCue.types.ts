export type ResultCueKind = 'exact' | 'close' | 'incorrect';

export interface ResultCueProps {
  kind: ResultCueKind;
  onComplete: () => void;
  visible: boolean;
}
