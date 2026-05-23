import { EquityPoint } from '@/types/trading';

/**
 * Equity chart pure helper functions.
 *
 * These are deterministic, side-effect-free transformations used by the
 * EquityChart component to apply view modes and sanitize input data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PnLViewMode = 'raw' | 'clipped' | 'log';
export type EquityViewMode = 'absolute' | 'r-multiple';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Signed log10 transformation: sign(x) * log10(|x| + 1)
 * Preserves the sign while compressing magnitude.
 */
function signedLog10(x: number): number {
  if (x === 0) return 0;
  return Math.sign(x) * Math.log10(Math.abs(x) + 1);
}

/**
 * Compute the k-th percentile of a sorted numeric array (0-indexed).
 * Uses linear interpolation between adjacent ranks.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Round a number to 2 decimal places.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply a P&L view mode transformation to an array of EquityPoints.
 *
 * - `raw`: identity — returns points with pnl unchanged.
 * - `clipped`: clips pnl values to the [5th, 95th] percentile range of the
 *   dataset's pnl values.
 * - `log`: applies signedLog10 to each pnl value.
 *
 * Returns a new array; does not mutate the input.
 */
export function applyPnLViewMode(
  points: EquityPoint[],
  mode: PnLViewMode,
): EquityPoint[] {
  if (mode === 'raw') {
    return points.map((p) => ({ ...p }));
  }

  if (mode === 'log') {
    return points.map((p) => ({
      ...p,
      pnl: signedLog10(p.pnl),
    }));
  }

  // mode === 'clipped'
  if (points.length === 0) return [];

  const sortedPnl = points.map((p) => p.pnl).sort((a, b) => a - b);
  const p5 = percentile(sortedPnl, 5);
  const p95 = percentile(sortedPnl, 95);

  return points.map((p) => ({
    ...p,
    pnl: Math.max(p5, Math.min(p95, p.pnl)),
  }));
}

/**
 * Apply an equity view mode transformation to an array of EquityPoints.
 *
 * - `absolute`: rounds equity to 2 decimal places (account currency).
 * - `r-multiple`: divides equity by `rUnit` and rounds to 2 decimal places.
 *   If `rUnit` is not provided or is <= 0, falls back to `absolute` behavior.
 *
 * Returns a new array; does not mutate the input.
 */
export function applyEquityViewMode(
  points: EquityPoint[],
  mode: EquityViewMode,
  rUnit?: number,
): EquityPoint[] {
  if (mode === 'absolute') {
    return points.map((p) => ({
      ...p,
      equity: round2(p.equity),
    }));
  }

  // mode === 'r-multiple'
  if (!rUnit || rUnit <= 0) {
    // Fallback to absolute when rUnit is invalid
    return points.map((p) => ({
      ...p,
      equity: round2(p.equity),
    }));
  }

  return points.map((p) => ({
    ...p,
    equity: round2(p.equity / rUnit),
  }));
}

/**
 * Sanitize an array of equity points by dropping entries that:
 * - Are missing required fields (`date`, `equity`, `pnl`, `pnlPercentage`)
 * - Have a non-finite `equity` value (NaN, +Infinity, -Infinity)
 *
 * Never throws — returns an empty array for any invalid input.
 * Preserves the original order of valid entries.
 */
export function sanitizeEquityPoints(
  points: unknown,
): EquityPoint[] {
  try {
    if (!Array.isArray(points)) return [];

    return points.filter((point): point is EquityPoint => {
      if (point == null || typeof point !== 'object') return false;

      const p = point as Record<string, unknown>;

      // Required fields must be present
      if (typeof p.date !== 'string') return false;
      if (typeof p.equity !== 'number') return false;
      if (typeof p.pnl !== 'number') return false;
      if (typeof p.pnlPercentage !== 'number') return false;

      // equity must be finite
      if (!Number.isFinite(p.equity)) return false;

      return true;
    });
  } catch {
    // Never throw — return empty array on any unexpected error
    return [];
  }
}
