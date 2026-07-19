import { CategoryLabels } from '../../const/categories';
import { getCategoryDifference } from '../categories';
import { formatEngineEvaluation, getEngineCategory } from '../evaluation';
import { calculateRatingChange, formatRatingChange } from '../rating';

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

describe('rating', () => {
  it.each([
    [0, 12],
    [1, 7],
    [2, 2],
    [3, -2],
    [5, -12],
    [10, -36],
  ])(
    'changes rating by %i for a %i-category difference',
    (difference, change) => {
      expect(calculateRatingChange(difference)).toBe(change);
    },
  );

  it('formats positive rating changes with a plus sign', () => {
    expect(formatRatingChange(12)).toBe('+12');
    expect(formatRatingChange(-4)).toBe('-4');
  });

  it('calculates the category difference from a player guess', () => {
    expect(getCategoryDifference(CategoryLabels['-2Category'], 3)).toBe(5);
  });
});
