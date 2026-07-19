import { CategoryLabels } from '@/const/categories';

export const getCategoryLabelBasedOnValue = (val: number): string => {
  return CategoryLabels[`${val}Category` as keyof typeof CategoryLabels];
};

export const getCategoryValueBasedOnLabel = (label: string): number => {
  const categoryKey = Object.keys(CategoryLabels).find(
    (key) => CategoryLabels[key as keyof typeof CategoryLabels] === label,
  );
  return categoryKey ? parseInt(categoryKey.replace('Category', ''), 10) : 0;
};

export const getCategoryRange = (val: number): string => {
  switch (val) {
    case -5:
      return '≤ –8.00';
    case -4:
      return '–7.99 … –5.00';
    case -3:
      return '–4.99 … –3.00';
    case -2:
      return '–2.99 … –1.50';
    case -1:
      return '–1.49 … –0.50';
    case 0:
      return '–0.49 … +0.49';
    case 1:
      return '+0.50 … +1.49';
    case 2:
      return '+1.50 … +2.99';
    case 3:
      return '+3.00 … +4.99';
    case 4:
      return '+5.00 … +7.99';
    case 5:
      return '≥ +8.00';
    default:
      return '';
  }
};

export const getCategoryDifference = (
  userEval: CategoryLabels,
  engineEval: number,
): number => {
  const userValue = getCategoryValueBasedOnLabel(userEval);
  return Math.abs(userValue - engineEval);
};

export const getRangeFromCategoryLabel = (category: CategoryLabels): string => {
  const categoryValue = getCategoryValueBasedOnLabel(category);
  return getCategoryRange(categoryValue);
};
