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
    // [playerRating, positionRating, categoryDifference, expectedChange]
    [1000, 1000, 0, 16],
    [1000, 1000, 1, 8],
    [1000, 1000, 2, 0],
    [1000, 1000, 3, -8],
    [1000, 1000, 4, -16],
    [1000, 1200, 0, 24],
    [1000, 1200, 4, -8],
  ])(
    'changes rating for player %i vs position %i with category difference %i by %i',
    (playerRating, positionRating, difference, expectedChange) => {
      expect(
        calculateRatingChange(playerRating, positionRating, difference),
      ).toBe(expectedChange);
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
