// Feature: ui-overhaul-ai-insights, Property 4
import fc from 'fast-check';
import {
  applyPnLViewMode,
  applyEquityViewMode,
  sanitizeEquityPoints,
} from '../equity-chart-helpers';
import { EquityPoint } from '@/types/trading';

/**
 * Validates: Requirements 5.3, 5.4, 5.7, 5.8
 *
 * Property 4: Equity-chart pure transformations are bounded and skip invalid input
 *
 * For any EquityPoint[] (possibly containing arbitrary non-conforming entries)
 * and any view-mode parameters, the helper functions satisfy bounded output
 * invariants and gracefully handle invalid input.
 */

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const equityPointArb: fc.Arbitrary<EquityPoint> = fc.record({
  date: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(
    (d) => d.toISOString().slice(0, 10),
  ),
  equity: fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
  pnl: fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
  pnlPercentage: fc.double({ min: -100, max: 1000, noNaN: true, noDefaultInfinity: true }),
});

const equityPointsArb: fc.Arbitrary<EquityPoint[]> = fc.array(equityPointArb, {
  minLength: 0,
  maxLength: 50,
});

// ---------------------------------------------------------------------------
// applyPnLViewMode — 'raw' mode
// ---------------------------------------------------------------------------

describe('applyPnLViewMode (property)', () => {
  it('raw mode: output pnl values equal input pnl values', () => {
    fc.assert(
      fc.property(equityPointsArb, (points) => {
        const result = applyPnLViewMode(points, 'raw');
        expect(result).toHaveLength(points.length);
        for (let i = 0; i < points.length; i++) {
          expect(result[i].pnl).toBe(points[i].pnl);
        }
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // applyPnLViewMode — 'clipped' mode
  // ---------------------------------------------------------------------------

  it('clipped mode: all output pnl values are within [5th percentile, 95th percentile] of input', () => {
    fc.assert(
      fc.property(
        fc.array(equityPointArb, { minLength: 1, maxLength: 50 }),
        (points) => {
          const result = applyPnLViewMode(points, 'clipped');
          expect(result).toHaveLength(points.length);

          // Compute the 5th and 95th percentiles of the input pnl values
          const sortedPnl = points.map((p) => p.pnl).sort((a, b) => a - b);
          const p5 = computePercentile(sortedPnl, 5);
          const p95 = computePercentile(sortedPnl, 95);

          for (const p of result) {
            expect(p.pnl).toBeGreaterThanOrEqual(p5 - 1e-10);
            expect(p.pnl).toBeLessThanOrEqual(p95 + 1e-10);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // applyPnLViewMode — 'log' mode
  // ---------------------------------------------------------------------------

  it('log mode: output preserves sign and equals signedLog10', () => {
    fc.assert(
      fc.property(equityPointsArb, (points) => {
        const result = applyPnLViewMode(points, 'log');
        expect(result).toHaveLength(points.length);

        for (let i = 0; i < points.length; i++) {
          const input = points[i].pnl;
          const output = result[i].pnl;
          const expected = input === 0
            ? 0
            : Math.sign(input) * Math.log10(Math.abs(input) + 1);

          expect(output).toBeCloseTo(expected, 10);

          // Sign preservation: signedLog10 preserves sign.
          // For extremely small negatives (subnormals), log10(|x|+1) rounds to 0,
          // yielding -0 which is sign-correct in IEEE 754 but not strictly < 0.
          if (input > 0) expect(output).toBeGreaterThanOrEqual(0);
          if (input < 0) expect(output).toBeLessThanOrEqual(0);
          if (input === 0) expect(output).toBe(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('log mode: output is bounded by log10(|max| + 1)', () => {
    fc.assert(
      fc.property(
        fc.array(equityPointArb, { minLength: 1, maxLength: 50 }),
        (points) => {
          const result = applyPnLViewMode(points, 'log');
          const maxAbsPnl = Math.max(...points.map((p) => Math.abs(p.pnl)));
          const bound = Math.log10(maxAbsPnl + 1);

          for (const p of result) {
            expect(Math.abs(p.pnl)).toBeLessThanOrEqual(bound + 1e-10);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// applyEquityViewMode
// ---------------------------------------------------------------------------

describe('applyEquityViewMode (property)', () => {
  it('r-multiple mode: output equity = round2(input equity / rUnit) when rUnit > 0', () => {
    fc.assert(
      fc.property(
        equityPointsArb,
        fc.double({ min: 0.01, max: 1e5, noNaN: true, noDefaultInfinity: true }),
        (points, rUnit) => {
          const result = applyEquityViewMode(points, 'r-multiple', rUnit);
          expect(result).toHaveLength(points.length);

          for (let i = 0; i < points.length; i++) {
            const expected = Math.round((points[i].equity / rUnit) * 100) / 100;
            expect(result[i].equity).toBeCloseTo(expected, 10);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('absolute mode: output equity = round2(input equity)', () => {
    fc.assert(
      fc.property(equityPointsArb, (points) => {
        const result = applyEquityViewMode(points, 'absolute');
        expect(result).toHaveLength(points.length);

        for (let i = 0; i < points.length; i++) {
          const expected = Math.round(points[i].equity * 100) / 100;
          expect(result[i].equity).toBeCloseTo(expected, 10);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// sanitizeEquityPoints
// ---------------------------------------------------------------------------

describe('sanitizeEquityPoints (property)', () => {
  it('output length <= input length', () => {
    // Generate arrays that may contain invalid entries
    const mixedPointArb = fc.array(
      fc.oneof(
        equityPointArb,
        fc.record({
          date: fc.oneof(fc.string(), fc.constant(undefined)),
          equity: fc.oneof(
            fc.double({ noNaN: false }),
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity),
            fc.constant(undefined),
          ),
          pnl: fc.oneof(fc.double(), fc.constant(undefined)),
          pnlPercentage: fc.oneof(fc.double(), fc.constant(undefined)),
        }),
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(42),
        fc.constant('string'),
      ),
      { minLength: 0, maxLength: 30 },
    );

    fc.assert(
      fc.property(mixedPointArb, (points) => {
        const result = sanitizeEquityPoints(points);
        expect(result.length).toBeLessThanOrEqual(points.length);
      }),
      { numRuns: 100 },
    );
  });

  it('all output entries have finite equity', () => {
    const mixedPointArb = fc.array(
      fc.oneof(
        equityPointArb,
        fc.record({
          date: fc.oneof(fc.string(), fc.constant(undefined)),
          equity: fc.oneof(
            fc.double({ noNaN: false }),
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity),
          ),
          pnl: fc.oneof(fc.double(), fc.constant(undefined)),
          pnlPercentage: fc.oneof(fc.double(), fc.constant(undefined)),
        }),
        fc.constant(null),
      ),
      { minLength: 0, maxLength: 30 },
    );

    fc.assert(
      fc.property(mixedPointArb, (points) => {
        const result = sanitizeEquityPoints(points);
        for (const p of result) {
          expect(Number.isFinite(p.equity)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('never throws for any input', () => {
    const arbitraryInput = fc.oneof(
      fc.array(fc.anything(), { minLength: 0, maxLength: 20 }),
      fc.anything(),
    );

    fc.assert(
      fc.property(arbitraryInput, (input) => {
        expect(() => sanitizeEquityPoints(input)).not.toThrow();
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Helper: percentile computation (mirrors the implementation for verification)
// ---------------------------------------------------------------------------

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
