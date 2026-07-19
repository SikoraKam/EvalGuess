import { CategoryLabels } from '../../const/categories';
import {
  getCategoryDifference,
  getPointsBasedOnCategoryDifference,
} from '../categories';
import { formatEngineEvaluation, getEngineCategory } from '../evaluation';

describe('getEngineCategory', () => {
  it.each([
    [{ cp: -800 }, -5],
    [{ cp: -500 }, -4],
    [{ cp: -300 }, -3],
    [{ cp: -150 }, -2],
    [{ cp: -50 }, -1],
    [{ cp: 49 }, 0],
    [{ cp: 50 }, 1],
    [{ cp: 150 }, 2],
    [{ cp: 300 }, 3],
    [{ cp: 500 }, 4],
    [{ cp: 800 }, 5],
    [{ mate: -3 }, -5],
    [{ mate: 1 }, 5],
  ])('maps %o to category %i', (evaluation, expectedCategory) => {
    expect(getEngineCategory(evaluation)).toBe(expectedCategory);
  });
});

describe('formatEngineEvaluation', () => {
  it('formats centipawn and mate scores for display', () => {
    expect(formatEngineEvaluation({ cp: 83 })).toBe('+0.83');
    expect(formatEngineEvaluation({ cp: -50 })).toBe('-0.50');
    expect(formatEngineEvaluation({ mate: 3 })).toBe('M+3');
  });
});

describe('scoring', () => {
  it.each([
    [0, 10],
    [1, 7],
    [2, 5],
    [3, 3],
    [4, 1],
    [5, 0],
    [10, 0],
  ])('awards %i-category difference %i points', (difference, points) => {
    expect(getPointsBasedOnCategoryDifference(difference)).toBe(points);
  });

  it('calculates the category difference from a player guess', () => {
    expect(getCategoryDifference(CategoryLabels['-2Category'], 3)).toBe(5);
  });
});
