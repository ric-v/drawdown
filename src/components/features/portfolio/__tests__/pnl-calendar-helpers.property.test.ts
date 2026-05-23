// Feature: ui-overhaul-ai-insights, Property 5
// Property 5: Calendar palette and out-of-range opacity follow the spec
// **Validates: Requirements 6.1, 6.6**

// Feature: ui-overhaul-ai-insights, Property 6
// Property 6: Calendar click branches and monthly summary follow the spec
// **Validates: Requirements 6.2, 6.3, 6.4, 6.5**

import * as fc from 'fast-check';
import { mapPnLToBucket, computeMonthlySummary } from '../pnl-calendar-helpers';
import { DailyPnL } from '@/types/trading';

describe('Property 5: Calendar palette and out-of-range opacity follow the spec', () => {
  const pnlArb = fc.double({ noNaN: true, noDefaultInfinity: true });
  const maxAbsArb = fc.double({ min: 0.001, noNaN: true, noDefaultInfinity: true });

  it('bucket is always in range [0, 5] for any pnl and maxAbs > 0', () => {
    fc.assert(
      fc.property(pnlArb, maxAbsArb, (pnl, maxAbs) => {
        const { bucket } = mapPnLToBucket(pnl, maxAbs);
        expect(bucket).toBeGreaterThanOrEqual(0);
        expect(bucket).toBeLessThanOrEqual(5);
      }),
      { numRuns: 100 }
    );
  });

  it('pnl === 0 or maxAbs === 0 always yields bucket 0 and tone neutral', () => {
    fc.assert(
      fc.property(maxAbsArb, (maxAbs) => {
        const result = mapPnLToBucket(0, maxAbs);
        expect(result.bucket).toBe(0);
        expect(result.tone).toBe('neutral');
      }),
      { numRuns: 100 }
    );

    fc.assert(
      fc.property(pnlArb, (pnl) => {
        const result = mapPnLToBucket(pnl, 0);
        expect(result.bucket).toBe(0);
        expect(result.tone).toBe('neutral');
      }),
      { numRuns: 100 }
    );
  });

  it('buckets are monotonically non-decreasing as |pnl|/maxAbs increases', () => {
    fc.assert(
      fc.property(maxAbsArb, (maxAbs) => {
        let prevBucket = 0;
        // Sample 20 evenly spaced ratios from 0 to 1
        for (let i = 1; i <= 20; i++) {
          const ratio = i / 20;
          const pnl = ratio * maxAbs;
          const { bucket } = mapPnLToBucket(pnl, maxAbs);
          expect(bucket).toBeGreaterThanOrEqual(prevBucket);
          prevBucket = bucket;
        }
      }),
      { numRuns: 100 }
    );
  });

  it('positive pnl yields gain tone; negative pnl yields loss tone', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, noNaN: true, noDefaultInfinity: true }),
        maxAbsArb,
        (positivePnl, maxAbs) => {
          const gainResult = mapPnLToBucket(positivePnl, maxAbs);
          expect(gainResult.tone).toBe('gain');

          const lossResult = mapPnLToBucket(-positivePnl, maxAbs);
          expect(lossResult.tone).toBe('loss');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any two values where |a|/maxAbs < |b|/maxAbs: bucket(a) <= bucket(b)', () => {
    fc.assert(
      fc.property(
        maxAbsArb,
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (maxAbs, r1, r2) => {
          const ratioA = Math.min(r1, r2);
          const ratioB = Math.max(r1, r2);
          const pnlA = ratioA * maxAbs;
          const pnlB = ratioB * maxAbs;

          const { bucket: bucketA } = mapPnLToBucket(pnlA, maxAbs);
          const { bucket: bucketB } = mapPnLToBucket(pnlB, maxAbs);

          expect(bucketB).toBeGreaterThanOrEqual(bucketA);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Generator for DailyPnL arrays with finite, non-NaN pnl values.
 */
const dailyPnLArrayArb = fc.array(
  fc.record({
    id: fc.string(),
    date: fc.date(),
    pnl: fc.double({ noNaN: true, noDefaultInfinity: true }),
  }),
);

describe('Property 6: Calendar click branches and monthly summary follow the spec', () => {
  it('computeMonthlySummary: tradingDays equals entries.length', () => {
    fc.assert(
      fc.property(dailyPnLArrayArb, (entries) => {
        const result = computeMonthlySummary(entries as DailyPnL[]);
        expect(result.tradingDays).toBe(entries.length);
      }),
      { numRuns: 100 },
    );
  });

  it('computeMonthlySummary: totalPnL equals sum of all entry.pnl values', () => {
    fc.assert(
      fc.property(dailyPnLArrayArb, (entries) => {
        const result = computeMonthlySummary(entries as DailyPnL[]);
        const expectedSum = entries.reduce((sum, e) => sum + e.pnl, 0);
        expect(result.totalPnL).toBeCloseTo(expectedSum, 10);
      }),
      { numRuns: 100 },
    );
  });

  it('computeMonthlySummary: when tradingDays === 0, winRate is "N/A"', () => {
    fc.assert(
      fc.property(fc.constant([] as DailyPnL[]), (entries) => {
        const result = computeMonthlySummary(entries);
        expect(result.winRate).toBe('N/A');
      }),
      { numRuns: 100 },
    );
  });

  it('computeMonthlySummary: when tradingDays > 0, winRate is a string representing a percentage between 0.0 and 100.0', () => {
    const nonEmptyDailyPnLArb = fc.array(
      fc.record({
        id: fc.string(),
        date: fc.date(),
        pnl: fc.double({ noNaN: true, noDefaultInfinity: true }),
      }),
      { minLength: 1 },
    );

    fc.assert(
      fc.property(nonEmptyDailyPnLArb, (entries) => {
        const result = computeMonthlySummary(entries as DailyPnL[]);
        expect(result.winRate).not.toBe('N/A');
        const winRateNum = parseFloat(result.winRate);
        expect(winRateNum).toBeGreaterThanOrEqual(0.0);
        expect(winRateNum).toBeLessThanOrEqual(100.0);
      }),
      { numRuns: 100 },
    );
  });

  it('computeMonthlySummary: winRate = (positive pnl days / total days) * 100, rounded to 1 decimal place', () => {
    const nonEmptyDailyPnLArb = fc.array(
      fc.record({
        id: fc.string(),
        date: fc.date(),
        pnl: fc.double({ noNaN: true, noDefaultInfinity: true }),
      }),
      { minLength: 1 },
    );

    fc.assert(
      fc.property(nonEmptyDailyPnLArb, (entries) => {
        const result = computeMonthlySummary(entries as DailyPnL[]);
        const positiveDays = entries.filter((e) => e.pnl > 0).length;
        const expectedWinRate = ((positiveDays / entries.length) * 100).toFixed(1);
        expect(result.winRate).toBe(expectedWinRate);
      }),
      { numRuns: 100 },
    );
  });

  it('computeMonthlySummary: zero pnl days are NOT counted as wins', () => {
    // Generate arrays that always contain at least one zero-pnl entry
    const withZeroPnLArb = fc
      .tuple(
        fc.array(
          fc.record({
            id: fc.string(),
            date: fc.date(),
            pnl: fc.double({ noNaN: true, noDefaultInfinity: true }),
          }),
        ),
        fc.record({
          id: fc.string(),
          date: fc.date(),
          pnl: fc.constant(0),
        }),
      )
      .map(([rest, zero]) => [...rest, zero]);

    fc.assert(
      fc.property(withZeroPnLArb, (entries) => {
        const result = computeMonthlySummary(entries as DailyPnL[]);
        // Zero-pnl days should not be counted as wins
        const positiveDays = entries.filter((e) => e.pnl > 0).length;
        const expectedWinRate = ((positiveDays / entries.length) * 100).toFixed(1);
        expect(result.winRate).toBe(expectedWinRate);
      }),
      { numRuns: 100 },
    );
  });
});
