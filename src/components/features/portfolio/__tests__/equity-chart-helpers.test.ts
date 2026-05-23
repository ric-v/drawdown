import {
  applyPnLViewMode,
  applyEquityViewMode,
  sanitizeEquityPoints,
} from '../equity-chart-helpers';
import { EquityPoint } from '@/types/trading';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const samplePoints: EquityPoint[] = [
  { date: '2024-01-01', equity: 10000, pnl: 100, pnlPercentage: 1.0 },
  { date: '2024-01-02', equity: 10200, pnl: 200, pnlPercentage: 1.96 },
  { date: '2024-01-03', equity: 9800, pnl: -400, pnlPercentage: -3.92 },
  { date: '2024-01-04', equity: 10500, pnl: 700, pnlPercentage: 7.14 },
  { date: '2024-01-05', equity: 10300, pnl: -200, pnlPercentage: -1.9 },
];

// ---------------------------------------------------------------------------
// applyPnLViewMode
// ---------------------------------------------------------------------------

describe('applyPnLViewMode', () => {
  it('raw mode returns points with pnl unchanged', () => {
    const result = applyPnLViewMode(samplePoints, 'raw');
    expect(result.map((p) => p.pnl)).toEqual(samplePoints.map((p) => p.pnl));
  });

  it('raw mode does not mutate the original array', () => {
    const original = samplePoints.map((p) => ({ ...p }));
    applyPnLViewMode(original, 'raw');
    expect(original).toEqual(samplePoints);
  });

  it('log mode applies signedLog10 to pnl values', () => {
    const result = applyPnLViewMode(samplePoints, 'log');
    // signedLog10(100) = log10(101) ≈ 2.004
    expect(result[0].pnl).toBeCloseTo(Math.log10(101), 5);
    // signedLog10(-400) = -log10(401) ≈ -2.603
    expect(result[2].pnl).toBeCloseTo(-Math.log10(401), 5);
  });

  it('log mode preserves zero pnl as zero', () => {
    const points: EquityPoint[] = [
      { date: '2024-01-01', equity: 10000, pnl: 0, pnlPercentage: 0 },
    ];
    const result = applyPnLViewMode(points, 'log');
    expect(result[0].pnl).toBe(0);
  });

  it('clipped mode bounds pnl to 5th/95th percentile', () => {
    // Create a dataset with an outlier
    const points: EquityPoint[] = Array.from({ length: 100 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      equity: 10000 + i * 10,
      pnl: i === 99 ? 10000 : i * 10, // outlier at index 99
      pnlPercentage: 1,
    }));

    const result = applyPnLViewMode(points, 'clipped');
    const sortedPnl = points.map((p) => p.pnl).sort((a, b) => a - b);
    const p5 = sortedPnl[Math.floor(4.95)]; // approximate 5th percentile
    const p95 = sortedPnl[Math.floor(94.05)]; // approximate 95th percentile

    // The outlier should be clipped
    for (const p of result) {
      expect(p.pnl).toBeGreaterThanOrEqual(p5 - 1); // allow small rounding
      expect(p.pnl).toBeLessThanOrEqual(p95 + 1);
    }
  });

  it('clipped mode returns empty array for empty input', () => {
    expect(applyPnLViewMode([], 'clipped')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// applyEquityViewMode
// ---------------------------------------------------------------------------

describe('applyEquityViewMode', () => {
  it('absolute mode rounds equity to 2 decimal places', () => {
    const points: EquityPoint[] = [
      { date: '2024-01-01', equity: 10000.456, pnl: 100, pnlPercentage: 1.0 },
    ];
    const result = applyEquityViewMode(points, 'absolute');
    expect(result[0].equity).toBe(10000.46);
  });

  it('r-multiple mode divides equity by rUnit and rounds to 2dp', () => {
    const points: EquityPoint[] = [
      { date: '2024-01-01', equity: 10000, pnl: 100, pnlPercentage: 1.0 },
    ];
    const result = applyEquityViewMode(points, 'r-multiple', 500);
    expect(result[0].equity).toBe(20); // 10000 / 500 = 20
  });

  it('r-multiple mode with fractional result rounds to 2dp', () => {
    const points: EquityPoint[] = [
      { date: '2024-01-01', equity: 10000, pnl: 100, pnlPercentage: 1.0 },
    ];
    const result = applyEquityViewMode(points, 'r-multiple', 300);
    expect(result[0].equity).toBe(33.33); // 10000 / 300 ≈ 33.333...
  });

  it('r-multiple mode falls back to absolute when rUnit is 0', () => {
    const points: EquityPoint[] = [
      { date: '2024-01-01', equity: 10000.456, pnl: 100, pnlPercentage: 1.0 },
    ];
    const result = applyEquityViewMode(points, 'r-multiple', 0);
    expect(result[0].equity).toBe(10000.46);
  });

  it('r-multiple mode falls back to absolute when rUnit is negative', () => {
    const points: EquityPoint[] = [
      { date: '2024-01-01', equity: 10000.456, pnl: 100, pnlPercentage: 1.0 },
    ];
    const result = applyEquityViewMode(points, 'r-multiple', -100);
    expect(result[0].equity).toBe(10000.46);
  });

  it('r-multiple mode falls back to absolute when rUnit is undefined', () => {
    const points: EquityPoint[] = [
      { date: '2024-01-01', equity: 10000.456, pnl: 100, pnlPercentage: 1.0 },
    ];
    const result = applyEquityViewMode(points, 'r-multiple');
    expect(result[0].equity).toBe(10000.46);
  });

  it('does not mutate the original array', () => {
    const original = samplePoints.map((p) => ({ ...p }));
    applyEquityViewMode(original, 'absolute');
    expect(original).toEqual(samplePoints);
  });
});

// ---------------------------------------------------------------------------
// sanitizeEquityPoints
// ---------------------------------------------------------------------------

describe('sanitizeEquityPoints', () => {
  it('returns valid points unchanged', () => {
    const result = sanitizeEquityPoints(samplePoints);
    expect(result).toHaveLength(5);
    expect(result[0].date).toBe('2024-01-01');
  });

  it('drops entries with missing date field', () => {
    const points = [
      { equity: 10000, pnl: 100, pnlPercentage: 1.0 },
      { date: '2024-01-02', equity: 10200, pnl: 200, pnlPercentage: 1.96 },
    ];
    const result = sanitizeEquityPoints(points);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-01-02');
  });

  it('drops entries with missing equity field', () => {
    const points = [
      { date: '2024-01-01', pnl: 100, pnlPercentage: 1.0 },
    ];
    const result = sanitizeEquityPoints(points);
    expect(result).toHaveLength(0);
  });

  it('drops entries with missing pnl field', () => {
    const points = [
      { date: '2024-01-01', equity: 10000, pnlPercentage: 1.0 },
    ];
    const result = sanitizeEquityPoints(points);
    expect(result).toHaveLength(0);
  });

  it('drops entries with missing pnlPercentage field', () => {
    const points = [
      { date: '2024-01-01', equity: 10000, pnl: 100 },
    ];
    const result = sanitizeEquityPoints(points);
    expect(result).toHaveLength(0);
  });

  it('drops entries with NaN equity', () => {
    const points = [
      { date: '2024-01-01', equity: NaN, pnl: 100, pnlPercentage: 1.0 },
    ];
    const result = sanitizeEquityPoints(points);
    expect(result).toHaveLength(0);
  });

  it('drops entries with Infinity equity', () => {
    const points = [
      { date: '2024-01-01', equity: Infinity, pnl: 100, pnlPercentage: 1.0 },
      { date: '2024-01-02', equity: -Infinity, pnl: 100, pnlPercentage: 1.0 },
    ];
    const result = sanitizeEquityPoints(points);
    expect(result).toHaveLength(0);
  });

  it('drops null entries', () => {
    const points = [null, { date: '2024-01-01', equity: 10000, pnl: 100, pnlPercentage: 1.0 }];
    const result = sanitizeEquityPoints(points);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for non-array input', () => {
    expect(sanitizeEquityPoints(null)).toEqual([]);
    expect(sanitizeEquityPoints(undefined)).toEqual([]);
    expect(sanitizeEquityPoints('hello')).toEqual([]);
    expect(sanitizeEquityPoints(42)).toEqual([]);
    expect(sanitizeEquityPoints({})).toEqual([]);
  });

  it('preserves original order of valid entries', () => {
    const points = [
      { date: '2024-01-03', equity: 9800, pnl: -400, pnlPercentage: -3.92 },
      { date: 'invalid' }, // dropped
      { date: '2024-01-01', equity: 10000, pnl: 100, pnlPercentage: 1.0 },
    ];
    const result = sanitizeEquityPoints(points);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2024-01-03');
    expect(result[1].date).toBe('2024-01-01');
  });

  it('never throws even with bizarre input', () => {
    expect(() => sanitizeEquityPoints(Symbol('test'))).not.toThrow();
    expect(() => sanitizeEquityPoints(() => {})).not.toThrow();
  });
});
