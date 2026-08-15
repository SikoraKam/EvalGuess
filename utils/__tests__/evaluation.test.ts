import {
  CATEGORY_THRESHOLDS,
  EVALUATION_CATEGORIES,
  getCategory,
  getCategoryForPawns,
} from '../../const/categories';
import { getCategoryDifference, getCategoryRange } from '../categories';
import {
  formatEngineEvaluation,
  getEngineCategory,
  getPrimaryEvaluation,
} from '../evaluation';
import {
  calculateRatingChange,
  clampPlayerRating,
  formatRatingChange,
  MIN_PLAYER_RATING,
} from '../rating';

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

  it('treats a missing evaluation as equal', () => {
    expect(getEngineCategory(undefined)).toBe(0);
  });

  it('places thresholds symmetrically around zero', () => {
    for (const threshold of CATEGORY_THRESHOLDS) {
      expect(getCategoryForPawns(threshold)).toBe(
        -getCategoryForPawns(-threshold),
      );
    }
  });
});

describe('category table', () => {
  it('covers every bucket exactly once', () => {
    expect(EVALUATION_CATEGORIES.map((category) => category.value)).toEqual([
      -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5,
    ]);
  });

  it('derives labels and ranges from the thresholds', () => {
    expect(getCategory(0).range).toBe('–0.49 … +0.49');
    expect(getCategory(1).range).toBe('+0.50 … +1.49');
    expect(getCategory(-2).range).toBe('–2.99 … –1.50');
    expect(getCategory(5).range).toBe('≥ +8.00');
    expect(getCategory(-5).range).toBe('≤ –8.00');
    expect(getCategory(1).label).toBe('Slight edge for White');
    expect(getCategory(-4).label).toBe('Decisive for Black');
    expect(getCategory(0).label).toBe('Equal');
  });

  it('describes the same range the engine mapping uses', () => {
    // Every displayed range must round-trip back to its own bucket.
    for (const category of EVALUATION_CATEGORIES) {
      const boundaries = category.range.match(/[-–+]?\d+\.\d+/g) ?? [];

      for (const boundary of boundaries) {
        const pawns = Number(boundary.replace('–', '-'));
        expect(getCategoryForPawns(pawns)).toBe(category.value);
      }
    }
  });

  it('exposes the range through the util wrapper', () => {
    expect(getCategoryRange(3)).toBe('+3.00 … +4.99');
  });
});

describe('formatEngineEvaluation', () => {
  it('formats centipawn and mate scores for display', () => {
    expect(formatEngineEvaluation({ cp: 83 })).toBe('+0.83');
    expect(formatEngineEvaluation({ cp: -50 })).toBe('-0.50');
    expect(formatEngineEvaluation({ mate: 3 })).toBe('M+3');
    expect(formatEngineEvaluation(undefined)).toBe('0.00');
  });
});

describe('getPrimaryEvaluation', () => {
  it('reads the first line of the deepest analysis', () => {
    const position = {
      fen: '8/8/8/8/8/8/8/8 w - -',
      evals: [
        { depth: 20, knodes: 1, pvs: [{ cp: 10, line: 'a2a3' }] },
        { depth: 40, knodes: 1, pvs: [{ cp: 250, line: 'e2e4' }] },
      ],
    };

    expect(getPrimaryEvaluation(position)?.cp).toBe(250);
    expect(getEngineCategory(getPrimaryEvaluation(position))).toBe(2);
  });

  it('handles positions with no analysis', () => {
    expect(
      getPrimaryEvaluation({ fen: '8/8/8/8/8/8/8/8 w - -', evals: [] }),
    ).toBe(undefined);
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
    expect(formatRatingChange(0)).toBe('0');
  });

  it('calculates the category difference from a player guess', () => {
    expect(getCategoryDifference(-2, 3)).toBe(5);
    expect(getCategoryDifference(2, 2)).toBe(0);
  });

  it('keeps the rating inside the range the position pool covers', () => {
    expect(clampPlayerRating(-500)).toBe(MIN_PLAYER_RATING);
    expect(clampPlayerRating(99999)).toBe(3000);
    expect(clampPlayerRating(1234)).toBe(1234);
  });
});
