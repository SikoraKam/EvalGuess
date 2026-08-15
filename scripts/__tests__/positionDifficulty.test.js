const {
  boundaryProximity,
  materialBalance,
  pvSharpness,
  depthDisagreement,
  rawDifficulty,
} = require('../positionDifficulty');

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';

function position(fen, evals) {
  return { fen, evals };
}

describe('materialBalance', () => {
  it('is level in the starting position', () => {
    expect(materialBalance(START_FEN)).toBe(0);
  });

  it('counts from White', () => {
    expect(materialBalance('8/8/4k3/8/7Q/3BK3/8/8 w - -')).toBe(12);
    expect(materialBalance('8/8/4K3/8/7q/3bk3/8/8 w - -')).toBe(-12);
  });

  it('ignores the fields after the board', () => {
    expect(materialBalance('8/8/8/8/8/8/8/8 b KQkq e3')).toBe(0);
  });
});

describe('boundaryProximity', () => {
  it('peaks on a bucket border', () => {
    expect(boundaryProximity(1.5)).toBeCloseTo(1);
    expect(boundaryProximity(0.5)).toBeCloseTo(1);
  });

  it('bottoms out in the middle of a bucket', () => {
    expect(boundaryProximity(1)).toBeCloseTo(0);
    expect(boundaryProximity(2.25)).toBeCloseTo(0);
  });

  /**
   * The equal bucket runs from -0.49 to +0.49, so a dead level position is as
   * far from a border as it gets, not sitting on one.
   */
  it('treats a dead level position as unambiguous', () => {
    expect(boundaryProximity(0)).toBeCloseTo(0);
    expect(boundaryProximity(0.49)).toBeGreaterThan(0.9);
    expect(boundaryProximity(-0.49)).toBeGreaterThan(0.9);
  });

  it('is symmetric', () => {
    for (const pawns of [0.4, 1.2, 2.9, 6]) {
      expect(boundaryProximity(pawns)).toBeCloseTo(boundaryProximity(-pawns));
    }
  });
});

describe('pvSharpness', () => {
  it('is zero when only one move was analysed', () => {
    expect(pvSharpness({ depth: 30, knodes: 1, pvs: [{ cp: 40 }] })).toBe(0);
  });

  it('grows with the gap to the second best move', () => {
    expect(
      pvSharpness({ depth: 30, knodes: 1, pvs: [{ cp: 40 }, { cp: -260 }] }),
    ).toBeCloseTo(3);
  });
});

describe('depthDisagreement', () => {
  it('is zero when every depth agrees', () => {
    expect(
      depthDisagreement([
        { depth: 40, knodes: 1, pvs: [{ cp: 30 }] },
        { depth: 20, knodes: 1, pvs: [{ cp: 45 }] },
      ]),
    ).toBe(0);
  });

  it('counts how many buckets the analyses span', () => {
    expect(
      depthDisagreement([
        { depth: 40, knodes: 1, pvs: [{ cp: 30 }] },
        { depth: 20, knodes: 1, pvs: [{ cp: 400 }] },
      ]),
    ).toBe(3);
  });
});

describe('rawDifficulty', () => {
  const trivialMate = position('8/8/4k3/8/7Q/3BK3/8/8 w - -', [
    { depth: 40, knodes: 1, pvs: [{ mate: 6, line: 'h4h6' }] },
  ]);

  // Black is a queen up, yet the position is dead level.
  const queenDownButEqual = position(
    'r4r2/5p2/b2pppk1/q3P3/1p3P2/7R/P5PP/5R1K w - -',
    [{ depth: 40, knodes: 1, pvs: [{ cp: 0, line: 'h3g3' }] }],
  );

  it('rates an overwhelming material advantage as easy', () => {
    expect(rawDifficulty(trivialMate)).toBe(0);
  });

  it('rates a position that contradicts the material as hard', () => {
    expect(rawDifficulty(queenDownButEqual)).toBeGreaterThan(
      rawDifficulty(trivialMate),
    );
  });

  it('ignores how much engine time a position received', () => {
    const shallow = position(START_FEN, [
      { depth: 12, knodes: 10, pvs: [{ cp: 20, line: 'e2e4' }] },
    ]);
    const deep = position(START_FEN, [
      { depth: 60, knodes: 9_000_000, pvs: [{ cp: 20, line: 'e2e4' }] },
    ]);

    expect(rawDifficulty(shallow)).toBe(rawDifficulty(deep));
  });

  it('has no opinion on a position without evaluations', () => {
    expect(rawDifficulty(position(START_FEN, []))).toBeNull();
  });
});
