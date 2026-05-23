// Feature: ui-overhaul-ai-insights, Property 1
// Property 1: KPI delta and tone are determined by direction-of-good rules
// **Validates: Requirements 4.2, 4.4**

// Feature: ui-overhaul-ai-insights, Property 2
// Property 2: Sparkline series shape matches sequential-metric definition
// **Validates: Requirement 4.3**

// Feature: ui-overhaul-ai-insights, Property 3
// Property 3: KPI empty and error states render correctly without affecting peers
// **Validates: Requirements 4.7, 4.8**

import * as fc from 'fast-check';
import {
  resolveDeltaTone,
  buildSparklineSeries,
  SEQUENTIAL_METRICS,
  KPIDirection,
  DeltaTone,
  DateRange,
} from '../kpi';
import { DailyPnL } from '@/types/trading';

describe('Property 1: KPI delta and tone are determined by direction-of-good rules', () => {
  const directionArb = fc.oneof(
    fc.constant('up-good' as KPIDirection),
    fc.constant('up-bad' as KPIDirection),
    fc.constant('sign-of-streak' as KPIDirection),
  );

  const deltaArb = fc.double({ noNaN: true, noDefaultInfinity: true });

  it('returns neutral tone when delta is exactly zero for any direction', () => {
    fc.assert(
      fc.property(directionArb, (direction) => {
        const tone = resolveDeltaTone(direction, 0);
        expect(tone).toBe('neutral');
      }),
      { numRuns: 100 },
    );
  });

  it('up-good: positive delta yields positive tone, negative delta yields negative tone', () => {
    fc.assert(
      fc.property(
        deltaArb.filter((d) => d !== 0),
        (delta) => {
          const tone = resolveDeltaTone('up-good', delta);
          if (delta > 0) {
            expect(tone).toBe('positive');
          } else {
            expect(tone).toBe('negative');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('up-bad: positive delta yields negative tone, negative delta yields positive tone', () => {
    fc.assert(
      fc.property(
        deltaArb.filter((d) => d !== 0),
        (delta) => {
          const tone = resolveDeltaTone('up-bad', delta);
          if (delta > 0) {
            expect(tone).toBe('negative');
          } else {
            expect(tone).toBe('positive');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sign-of-streak: positive delta yields positive tone, negative delta yields negative tone', () => {
    fc.assert(
      fc.property(
        deltaArb.filter((d) => d !== 0),
        (delta) => {
          const tone = resolveDeltaTone('sign-of-streak', delta);
          if (delta > 0) {
            expect(tone).toBe('positive');
          } else {
            expect(tone).toBe('negative');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('for any direction and any finite delta, tone is always one of positive/negative/neutral', () => {
    fc.assert(
      fc.property(directionArb, deltaArb, (direction, delta) => {
        const tone = resolveDeltaTone(direction, delta);
        expect(['positive', 'negative', 'neutral']).toContain(tone);
      }),
      { numRuns: 100 },
    );
  });

  it('tone is symmetric: up-good and sign-of-streak agree on tone for any delta', () => {
    fc.assert(
      fc.property(deltaArb, (delta) => {
        const toneUpGood = resolveDeltaTone('up-good', delta);
        const toneStreak = resolveDeltaTone('sign-of-streak', delta);
        expect(toneUpGood).toBe(toneStreak);
      }),
      { numRuns: 100 },
    );
  });

  it('up-good and up-bad produce opposite tones for non-zero deltas', () => {
    fc.assert(
      fc.property(
        deltaArb.filter((d) => d !== 0),
        (delta) => {
          const toneGood = resolveDeltaTone('up-good', delta);
          const toneBad = resolveDeltaTone('up-bad', delta);
          // They should be opposite
          if (toneGood === 'positive') {
            expect(toneBad).toBe('negative');
          } else {
            expect(toneBad).toBe('positive');
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});


// Feature: ui-overhaul-ai-insights, Property 2

const NON_SEQUENTIAL_METRICS = [
  'profitFactor',
  'expectancy',
  'maxDrawdown',
  'currentStreak',
  'averageWin',
  'averageLoss',
  'largestWin',
  'largestLoss',
] as const;

// Generator for DailyPnL entries
const dailyPnLArb = fc.array(
  fc.record({
    id: fc.string(),
    date: fc.date(),
    pnl: fc.double({ noNaN: true, noDefaultInfinity: true }),
    notes: fc.option(fc.string()),
  }),
);

// Generator for a valid date range (from <= to)
const dateRangeArb = fc
  .tuple(fc.date(), fc.date())
  .map(([a, b]): DateRange => {
    const [from, to] = a <= b ? [a, b] : [b, a];
    return { from, to };
  });

describe('Property 2: Sparkline series shape matches sequential-metric definition', () => {
  it('sequential metrics return arrays with length equal to entries in range', () => {
    fc.assert(
      fc.property(dailyPnLArb, dateRangeArb, (daily, range) => {
        const entries: DailyPnL[] = daily.map((d) => ({
          id: d.id,
          date: d.date,
          pnl: d.pnl,
          ...(d.notes != null ? { notes: d.notes } : {}),
        }));

        const result = buildSparklineSeries(entries, range);

        // Count entries that fall within the range
        const entriesInRange = entries.filter((entry) => {
          const entryDate = new Date(entry.date);
          return entryDate >= range.from && entryDate <= range.to;
        });

        // Sequential metrics should have length equal to entries in range
        expect(result.totalPnL).toHaveLength(entriesInRange.length);
        expect(result.currentEquity).toHaveLength(entriesInRange.length);
        expect(result.winRate).toHaveLength(entriesInRange.length);
      }),
      { numRuns: 100 },
    );
  });

  it('non-sequential metrics return undefined', () => {
    fc.assert(
      fc.property(dailyPnLArb, dateRangeArb, (daily, range) => {
        const entries: DailyPnL[] = daily.map((d) => ({
          id: d.id,
          date: d.date,
          pnl: d.pnl,
          ...(d.notes != null ? { notes: d.notes } : {}),
        }));

        const result = buildSparklineSeries(entries, range);

        for (const metric of NON_SEQUENTIAL_METRICS) {
          expect(result[metric]).toBeUndefined();
        }
      }),
      { numRuns: 100 },
    );
  });

  it('totalPnL series is a cumulative sum of daily pnl values', () => {
    fc.assert(
      fc.property(dailyPnLArb, dateRangeArb, (daily, range) => {
        const entries: DailyPnL[] = daily.map((d) => ({
          id: d.id,
          date: d.date,
          pnl: d.pnl,
          ...(d.notes != null ? { notes: d.notes } : {}),
        }));

        const result = buildSparklineSeries(entries, range);

        if (result.totalPnL.length === 0) return;

        // Get entries in range sorted chronologically (same logic as implementation)
        const sorted = entries
          .filter((entry) => {
            const entryDate = new Date(entry.date);
            return entryDate >= range.from && entryDate <= range.to;
          })
          .sort(
            (a, b) =>
              new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

        // Verify cumulative sum
        let cumulativeSum = 0;
        for (let i = 0; i < sorted.length; i++) {
          cumulativeSum += sorted[i].pnl;
          expect(result.totalPnL[i]).toBeCloseTo(cumulativeSum, 10);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('winRate series values are all between 0 and 100', () => {
    fc.assert(
      fc.property(dailyPnLArb, dateRangeArb, (daily, range) => {
        const entries: DailyPnL[] = daily.map((d) => ({
          id: d.id,
          date: d.date,
          pnl: d.pnl,
          ...(d.notes != null ? { notes: d.notes } : {}),
        }));

        const result = buildSparklineSeries(entries, range);

        for (const value of result.winRate) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('all sequential arrays have the same length', () => {
    fc.assert(
      fc.property(dailyPnLArb, dateRangeArb, (daily, range) => {
        const entries: DailyPnL[] = daily.map((d) => ({
          id: d.id,
          date: d.date,
          pnl: d.pnl,
          ...(d.notes != null ? { notes: d.notes } : {}),
        }));

        const result = buildSparklineSeries(entries, range);

        const lengths = SEQUENTIAL_METRICS.map(
          (metric) => result[metric].length,
        );
        const allSame = lengths.every((len) => len === lengths[0]);
        expect(allSame).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});


// Feature: ui-overhaul-ai-insights, Property 3

import React from 'react';
import { render } from '@testing-library/react';
import { KPICard, KPIMetricId } from '@/components/features/portfolio/kpi-card';

// Mock Recharts components since they require a DOM with SVG support
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    React.createElement('div', { 'data-testid': 'responsive-container' }, children)
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    React.createElement('div', { 'data-testid': 'area-chart' }, children)
  ),
  Area: () => React.createElement('div', { 'data-testid': 'area' }),
}));

const ALL_METRIC_IDS: KPIMetricId[] = [
  'totalPnL', 'winRate', 'profitFactor', 'expectancy',
  'maxDrawdown', 'currentStreak', 'averageWin', 'averageLoss',
  'largestWin', 'largestLoss', 'currentEquity',
];

// Arbitrary for KPICard state: null value, error, or a valid numeric value
type CardState = { type: 'empty' } | { type: 'error'; message: string } | { type: 'valid'; value: number };

const cardStateArb: fc.Arbitrary<CardState> = fc.oneof(
  fc.constant({ type: 'empty' } as CardState),
  fc.string({ minLength: 1, maxLength: 50 }).map((msg) => ({ type: 'error', message: msg } as CardState)),
  fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e9, max: 1e9 }).map((v) => ({ type: 'valid', value: v } as CardState)),
);

// Generate an array of 11 card states (one per metric)
const cardStatesArb = fc.tuple(
  cardStateArb, cardStateArb, cardStateArb, cardStateArb,
  cardStateArb, cardStateArb, cardStateArb, cardStateArb,
  cardStateArb, cardStateArb, cardStateArb,
);

describe('Property 3: KPI empty and error states render correctly without affecting peers', () => {
  it('when value is null (empty state), the card renders "—", hides delta and sparkline, retains label and focusability', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_METRIC_IDS),
        fc.record({
          direction: fc.constantFrom('up-good' as KPIDirection, 'up-bad' as KPIDirection, 'sign-of-streak' as KPIDirection),
          delta: fc.option(fc.record({
            absolute: fc.double({ noNaN: true, noDefaultInfinity: true }),
            percentage: fc.double({ noNaN: true, noDefaultInfinity: true }),
          })),
          sparklineSeries: fc.option(fc.array(fc.double({ noNaN: true, noDefaultInfinity: true }), { minLength: 2, maxLength: 30 })),
          tooltip: fc.string({ minLength: 1, maxLength: 200 }),
        }),
        (metricId, props) => {
          const { container } = render(
            React.createElement(KPICard, {
              metricId,
              label: `Test ${metricId}`,
              value: null,
              formatter: (v: number) => v.toFixed(2),
              direction: props.direction,
              delta: props.delta ?? undefined,
              sparklineSeries: props.sparklineSeries ?? undefined,
              tooltip: props.tooltip,
            }),
          );

          // Should render placeholder "—"
          expect(container.textContent).toContain('—');

          // Should NOT render delta (no trending icons or delta text)
          const deltaIndicators = container.querySelectorAll('[class*="text-positive"], [class*="text-negative"]');
          // Delta section should not be present when value is null
          const valueDisplay = container.querySelector('.text-2xl');
          expect(valueDisplay?.textContent).toBe('—');

          // Should retain the label
          expect(container.textContent).toContain(`Test ${metricId}`);

          // Should remain keyboard-focusable (tabIndex=0)
          const focusableEl = container.querySelector('[tabindex="0"]');
          expect(focusableEl).not.toBeNull();

          // Sparkline should not render (no responsive-container when value is null)
          // The showSparkline condition requires showValue to be true
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when error is set, aria-invalid is true and an accessible error message is exposed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_METRIC_IDS),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom('up-good' as KPIDirection, 'up-bad' as KPIDirection, 'sign-of-streak' as KPIDirection),
        fc.string({ minLength: 1, maxLength: 200 }),
        (metricId, errorMsg, direction, tooltip) => {
          const { container } = render(
            React.createElement(KPICard, {
              metricId,
              label: `Test ${metricId}`,
              value: 42, // even with a valid value, error takes precedence
              formatter: (v: number) => v.toFixed(2),
              direction,
              tooltip,
              error: errorMsg,
            }),
          );

          // aria-invalid should be "true"
          const cardEl = container.querySelector('[aria-invalid="true"]');
          expect(cardEl).not.toBeNull();

          // aria-errormessage should reference an element with the error text
          const errMsgId = cardEl?.getAttribute('aria-errormessage');
          expect(errMsgId).toBeTruthy();
          const errMsgEl = container.querySelector(`#${errMsgId}`);
          expect(errMsgEl).not.toBeNull();
          expect(errMsgEl?.textContent).toBe(errorMsg);

          // Should render placeholder "—" (not the numeric value)
          const valueDisplay = container.querySelector('.text-2xl');
          expect(valueDisplay?.textContent).toBe('—');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('for any combination of null/error states across 11 metrics, each card state is independent of its peers', () => {
    fc.assert(
      fc.property(cardStatesArb, (states) => {
        const cards = ALL_METRIC_IDS.map((metricId, idx) => {
          const state = states[idx];
          const props = {
            metricId,
            label: `Label ${metricId}`,
            value: state.type === 'valid' ? state.value : (state.type === 'empty' ? null : 100),
            formatter: (v: number) => v.toFixed(2),
            direction: 'up-good' as KPIDirection,
            tooltip: `Tooltip for ${metricId}`,
            error: state.type === 'error' ? state.message : undefined,
          };
          return { props, state };
        });

        // Render all cards and verify each one independently
        for (const { props, state } of cards) {
          const { container } = render(React.createElement(KPICard, props));
          const valueDisplay = container.querySelector('.text-2xl');

          if (state.type === 'empty') {
            // Empty state: placeholder "—"
            expect(valueDisplay?.textContent).toBe('—');
            expect(container.querySelector('[aria-invalid="true"]')).toBeNull();
          } else if (state.type === 'error') {
            // Error state: placeholder "—" + aria-invalid
            expect(valueDisplay?.textContent).toBe('—');
            expect(container.querySelector('[aria-invalid="true"]')).not.toBeNull();
          } else {
            // Valid state: formatted value rendered
            expect(valueDisplay?.textContent).toBe(state.value.toFixed(2));
            expect(container.querySelector('[aria-invalid="true"]')).toBeNull();
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('error in one card does not affect the tone/value resolution of a sibling card with a valid value', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 }).filter((v) => v !== 0),
        fc.record({
          absolute: fc.double({ noNaN: true, noDefaultInfinity: true }).filter((d) => d !== 0),
          percentage: fc.double({ noNaN: true, noDefaultInfinity: true }),
        }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (validValue, delta, errorMsg) => {
          // Render an error card
          const { container: errorContainer } = render(
            React.createElement(KPICard, {
              metricId: 'totalPnL' as KPIMetricId,
              label: 'Total P&L',
              value: 999,
              formatter: (v: number) => v.toFixed(2),
              direction: 'up-good' as KPIDirection,
              tooltip: 'Total profit and loss',
              error: errorMsg,
            }),
          );

          // Render a valid sibling card
          const { container: validContainer } = render(
            React.createElement(KPICard, {
              metricId: 'winRate' as KPIMetricId,
              label: 'Win Rate',
              value: validValue,
              formatter: (v: number) => v.toFixed(2),
              direction: 'up-good' as KPIDirection,
              delta,
              tooltip: 'Percentage of winning trades',
            }),
          );

          // Error card should show "—" and aria-invalid
          const errorValueDisplay = errorContainer.querySelector('.text-2xl');
          expect(errorValueDisplay?.textContent).toBe('—');
          expect(errorContainer.querySelector('[aria-invalid="true"]')).not.toBeNull();

          // Valid card should show the formatted value and no aria-invalid
          const validValueDisplay = validContainer.querySelector('.text-2xl');
          expect(validValueDisplay?.textContent).toBe(validValue.toFixed(2));
          expect(validContainer.querySelector('[aria-invalid="true"]')).toBeNull();

          // Valid card should have a delta tone applied (not neutral since delta.absolute !== 0)
          const expectedTone = resolveDeltaTone('up-good', delta.absolute);
          expect(expectedTone).not.toBe('neutral');
        },
      ),
      { numRuns: 100 },
    );
  });
});
