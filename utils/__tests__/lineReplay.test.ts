import { buildLineReplay, formatMoveNumber } from '../lineReplay';
import { getSideToMove } from '../fen';

const START_FEN = '7r/1p3k2/p1bPR3/5p2/2B2P1p/8/PP4P1/3K4 b - -';
const LINE = 'f7g7 e6e2 h8d8 e2d2 b7b5';

describe('buildLineReplay', () => {
  it('converts a UCI line into positions and SAN', () => {
    const replay = buildLineReplay(START_FEN, LINE);

    expect(replay.steps).toHaveLength(5);
    expect(replay.steps.map((step) => step.san)).toEqual([
      'Kg7',
      'Re2',
      'Rd8',
      'Rd2',
      'b5',
    ]);
    expect(replay.steps[0]).toMatchObject({ from: 'f7', to: 'g7', ply: 1 });
    expect(getSideToMove(replay.steps[0].fen)).toBe('w');
  });

  it('keeps the moves it could play when the line goes bad', () => {
    const replay = buildLineReplay(START_FEN, 'f7g7 a1a8 e6e2');

    expect(replay.steps.map((step) => step.san)).toEqual(['Kg7']);
  });

  it('returns nothing for an unreadable position', () => {
    expect(buildLineReplay('not a fen', LINE).steps).toEqual([]);
  });

  it('returns nothing for an empty line', () => {
    expect(buildLineReplay(START_FEN, '').steps).toEqual([]);
  });
});

describe('formatMoveNumber', () => {
  it('numbers a line that starts with White', () => {
    expect([1, 2, 3, 4].map((ply) => formatMoveNumber(ply, false))).toEqual([
      '1.',
      null,
      '2.',
      null,
    ]);
  });

  it('marks the opening ellipsis when Black moves first', () => {
    expect([1, 2, 3, 4].map((ply) => formatMoveNumber(ply, true))).toEqual([
      '1...',
      '2.',
      null,
      '3.',
    ]);
  });
});
