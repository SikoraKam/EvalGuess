import { getValidGameSession } from '../gameStorage';
import { MIN_PLAYER_RATING, STARTING_RATING } from '../rating';

const FILE_COUNT = 2;
const lineCountForFile = () => 100;

function parse(value: unknown) {
  return getValidGameSession(value, FILE_COUNT, lineCountForFile);
}

const validSession = {
  schemaVersion: 2,
  rating: 1250,
  completedPositions: 7,
  correctGuesses: 3,
  currentPositionRef: { fileIndex: 1, lineIndex: 42 },
  currentPositionRating: 1300,
  recentPositionKeys: ['1:42'],
};

describe('reading a saved session', () => {
  it('accepts a current session unchanged', () => {
    expect(parse(validSession)).toEqual({
      rating: 1250,
      completedPositions: 7,
      correctGuesses: 3,
      currentPositionRef: { fileIndex: 1, lineIndex: 42 },
      currentPositionRating: 1300,
      recentPositionKeys: ['1:42'],
    });
  });

  it.each([
    ['not an object', 42],
    ['null', null],
    [
      'a reference outside the dataset',
      { ...validSession, currentPositionRef: { fileIndex: 9, lineIndex: 0 } },
    ],
    [
      'a negative line index',
      { ...validSession, currentPositionRef: { fileIndex: 0, lineIndex: -1 } },
    ],
    [
      'a missing position rating',
      { ...validSession, currentPositionRating: 'high' },
    ],
    ['a fractional counter', { ...validSession, completedPositions: 1.5 }],
    ['a negative counter', { ...validSession, correctGuesses: -1 }],
    [
      'no rating at all',
      { ...validSession, rating: undefined, schemaVersion: 2 },
    ],
  ])('rejects %s', (_label, value) => {
    expect(parse(value)).toBeNull();
  });

  it('drops non-string entries from the recent list', () => {
    const session = parse({
      ...validSession,
      recentPositionKeys: ['1:42', 7, null, '0:1'],
    });

    expect(session?.recentPositionKeys).toEqual(['1:42', '0:1']);
  });
});

describe('migrating older saves', () => {
  it('converts the original points counter into a rating', () => {
    const session = parse({
      ...validSession,
      schemaVersion: undefined,
      rating: undefined,
      totalPoints: -120,
    });

    expect(session?.rating).toBe(STARTING_RATING - 120);
  });

  it('repairs a rating that had sunk to zero under the old scale', () => {
    const session = parse({
      ...validSession,
      schemaVersion: undefined,
      rating: -30,
    });

    expect(session?.rating).toBe(STARTING_RATING - 30);
  });

  /**
   * The old code re-applied this conversion on every launch, so a player at or
   * below zero gained 1000 rating each time the app started.
   */
  it('does not re-apply the conversion once the save is stamped', () => {
    const migrated = parse({
      ...validSession,
      schemaVersion: undefined,
      rating: -30,
    });
    const reloaded = parse({
      ...validSession,
      schemaVersion: 2,
      rating: migrated!.rating,
    });

    expect(reloaded?.rating).toBe(migrated?.rating);
  });

  it('clamps migrated ratings into the supported range', () => {
    const session = parse({
      ...validSession,
      schemaVersion: undefined,
      rating: undefined,
      totalPoints: -100000,
    });

    expect(session?.rating).toBe(MIN_PLAYER_RATING);
  });
});
