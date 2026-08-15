/**
 * Difficulty model.
 *
 * The question the player answers is "which of 11 evaluation buckets does this
 * position fall into", so difficulty means: how far the correct answer sits
 * from what the position looks like at a glance.
 *
 * Every signal below is a property of the position itself. Engine bookkeeping
 * (depth, node count, how many times someone requested an analysis) is
 * deliberately ignored — it measures how much work Lichess spent, not how hard
 * the position is for a human.
 */

const CATEGORY_THRESHOLDS = [0.5, 1.5, 3, 5, 8];

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };

/** Mate scores are treated as this many pawns when compared against material. */
const MATE_IN_PAWNS = 12;
const MAX_EVAL_PAWNS = 12;

const WEIGHTS = {
  materialMismatch: 100,
  boundaryProximity: 260,
  pvSharpness: 45,
  depthDisagreement: 130,
};

function materialBalance(fen) {
  const board = fen.split(' ')[0];
  let balance = 0;

  for (let index = 0; index < board.length; index += 1) {
    const symbol = board[index];
    const value = PIECE_VALUES[symbol.toLowerCase()];

    if (value === undefined) {
      continue;
    }

    balance += symbol === symbol.toLowerCase() ? -value : value;
  }

  return balance;
}

function pvToPawns(pv) {
  if (!pv) {
    return null;
  }

  if (pv.mate !== undefined) {
    return pv.mate > 0 ? MATE_IN_PAWNS : -MATE_IN_PAWNS;
  }

  if (pv.cp === undefined) {
    return null;
  }

  return Math.max(-MAX_EVAL_PAWNS, Math.min(MAX_EVAL_PAWNS, pv.cp / 100));
}

function categoryForPawns(pawns) {
  const magnitude = CATEGORY_THRESHOLDS.filter(
    (threshold) => Math.abs(pawns) >= threshold,
  ).length;

  return magnitude > 0 && pawns < 0 ? -magnitude : magnitude;
}

/**
 * 1 when the evaluation sits exactly on a bucket border (where a sound read of
 * the position still lands one bucket off), 0 in the middle of a bucket.
 */
function boundaryProximity(pawns) {
  const magnitude = Math.abs(pawns);
  const [firstThreshold] = CATEGORY_THRESHOLDS;

  // The equal bucket straddles zero, so its centre is 0.00 rather than the
  // midpoint of the magnitudes it covers.
  if (magnitude < firstThreshold) {
    return magnitude / firstThreshold;
  }

  const lower = CATEGORY_THRESHOLDS.filter(
    (threshold) => magnitude >= threshold,
  ).pop();
  const upper = CATEGORY_THRESHOLDS.find((threshold) => magnitude < threshold);

  if (upper === undefined) {
    // The outermost bucket is open-ended: only its lower border can be missed.
    return Math.max(0, 1 - (magnitude - lower) / 2);
  }

  const halfWidth = (upper - lower) / 2;
  const distanceToBorder = Math.min(magnitude - lower, upper - magnitude);

  return Math.max(0, 1 - distanceToBorder / halfWidth);
}

/** How much the position hinges on finding one specific move. */
function pvSharpness(deepestEval) {
  const scores = deepestEval.pvs
    .map(pvToPawns)
    .filter((value) => value !== null);

  if (scores.length < 2) {
    return 0;
  }

  return Math.min(6, Math.abs(scores[0] - scores[1]));
}

/** Analyses at different depths landing in different buckets means unstable. */
function depthDisagreement(evals) {
  const categories = evals
    .map((entry) => pvToPawns(entry.pvs[0]))
    .filter((value) => value !== null)
    .map(categoryForPawns);

  if (categories.length < 2) {
    return 0;
  }

  return Math.max(...categories) - Math.min(...categories);
}

/**
 * Unbounded, unitless "how hard does this feel" score. Only its ordering
 * matters — build-position-index.js maps it onto the rating scale by rank.
 */
function rawDifficulty(position) {
  const evals = position.evals;

  if (!evals || evals.length === 0) {
    return null;
  }

  const deepestEval = evals.reduce((deepest, current) =>
    current.depth > deepest.depth ? current : deepest,
  );
  const evalPawns = pvToPawns(deepestEval.pvs[0]);

  if (evalPawns === null) {
    return null;
  }

  const material = materialBalance(position.fen);
  const mismatch = Math.min(12, Math.abs(evalPawns - material));

  return (
    mismatch * WEIGHTS.materialMismatch +
    boundaryProximity(evalPawns) * WEIGHTS.boundaryProximity +
    pvSharpness(deepestEval) * WEIGHTS.pvSharpness +
    depthDisagreement(evals) * WEIGHTS.depthDisagreement
  );
}

module.exports = {
  CATEGORY_THRESHOLDS,
  boundaryProximity,
  categoryForPawns,
  depthDisagreement,
  materialBalance,
  pvSharpness,
  pvToPawns,
  rawDifficulty,
};
