import {
  resolveDeltaTone,
  buildSparklineSeries,
  SEQUENTIAL_METRICS,
  KPIDirection,
  DateRange,
} from '../kpi';
import { DailyPnL } from '@/types/trading';

describe('resolveDeltaTone', () => {
  describe('up-good direction', () => {
    it('returns positive when delta is positive', () => {
      expect(resolveDeltaTone('up-good', 10)).toBe('positive');
    });

    it('returns negative when delta is negative', () => {
      expect(resolveDeltaTone('up-good', -5)).toBe('negative');
    });

    it('returns neutral when delta is zero', () => {
      expect(resolveDeltaTone('up-good', 0)).toBe('neutral');
    });
  });

  describe('up-bad direction', () => {
    it('returns negative when delta is positive (going up is bad)', () => {
      expect(resolveDeltaTone('up-bad', 10)).toBe('negative');
    });

    it('returns positive when delta is negative (going down is good)', () => {
      expect(resolveDeltaTone('up-bad', -5)).toBe('positive');
    });

    it('returns neutral when delta is zero', () => {
      expect(resolveDeltaTone('up-bad', 0)).toBe('neutral');
    });
  });

  describe('sign-of-streak direction', () => {
    it('returns positive when delta is positive', () => {
      expect(resolveDeltaTone('sign-of-streak', 3)).toBe('positive');
    });

    it('returns negative when delta is negative', () => {
      expect(resolveDeltaTone('sign-of-streak', -2)).toBe('negative');
    });

    it('returns neutral when delta is zero', () => {
      expect(resolveDeltaTone('sign-of-streak', 0)).toBe('neutral');
    });
  });
});

describe('buildSparklineSeries', () => {
  const makeEntry = (date: string, pnl: number): DailyPnL => ({
    id: `entry-${date}`,
    date: new Date(date),
    pnl,
  });

  const range: DateRange = {
    from: new Date('2024-01-01'),
    to: new Date('2024-01-05'),
  };

  const daily: DailyPnL[] = [
    makeEntry('2024-01-01', 100),
    makeEntry('2024-01-02', -50),
    makeEntry('2024-01-03', 200),
    makeEntry('2024-01-04', 0),
    makeEntry('2024-01-05', 150),
  ];

  it('returns cumulative totalPnL series', () => {
    const result = buildSparklineSeries(daily, range);
    expect(result.totalPnL).toEqual([100, 50, 250, 250, 400]);
  });

  it('returns cumulative currentEquity series', () => {
    const result = buildSparklineSeries(daily, range);
    expect(result.currentEquity).toEqual([100, 50, 250, 250, 400]);
  });

  it('returns cumulative winRate series', () => {
    const result = buildSparklineSeries(daily, range);
    // Day 1: 1 win / 1 total = 100%
    // Day 2: 1 win / 2 total = 50%
    // Day 3: 2 wins / 3 total = 66.67%
    // Day 4: 2 wins / 4 total = 50% (pnl=0 is not a win)
    // Day 5: 3 wins / 5 total = 60%
    expect(result.winRate[0]).toBeCloseTo(100);
    expect(result.winRate[1]).toBeCloseTo(50);
    expect(result.winRate[2]).toBeCloseTo(66.667, 2);
    expect(result.winRate[3]).toBeCloseTo(50);
    expect(result.winRate[4]).toBeCloseTo(60);
  });

  it('returns undefined for non-sequential metrics', () => {
    const result = buildSparklineSeries(daily, range);
    expect(result.profitFactor).toBeUndefined();
    expect(result.expectancy).toBeUndefined();
    expect(result.maxDrawdown).toBeUndefined();
    expect(result.currentStreak).toBeUndefined();
    expect(result.averageWin).toBeUndefined();
    expect(result.averageLoss).toBeUndefined();
    expect(result.largestWin).toBeUndefined();
    expect(result.largestLoss).toBeUndefined();
  });

  it('filters entries to the specified date range', () => {
    const narrowRange: DateRange = {
      from: new Date('2024-01-02'),
      to: new Date('2024-01-04'),
    };
    const result = buildSparklineSeries(daily, narrowRange);
    expect(result.totalPnL).toHaveLength(3);
    expect(result.totalPnL).toEqual([-50, 150, 150]);
  });

  it('returns empty arrays when no entries fall in range', () => {
    const emptyRange: DateRange = {
      from: new Date('2025-01-01'),
      to: new Date('2025-01-05'),
    };
    const result = buildSparklineSeries(daily, emptyRange);
    expect(result.totalPnL).toEqual([]);
    expect(result.currentEquity).toEqual([]);
    expect(result.winRate).toEqual([]);
  });

  it('returns empty arrays for empty daily input', () => {
    const result = buildSparklineSeries([], range);
    expect(result.totalPnL).toEqual([]);
    expect(result.currentEquity).toEqual([]);
    expect(result.winRate).toEqual([]);
  });

  it('sorts entries chronologically regardless of input order', () => {
    const unsorted: DailyPnL[] = [
      makeEntry('2024-01-03', 200),
      makeEntry('2024-01-01', 100),
      makeEntry('2024-01-02', -50),
    ];
    const result = buildSparklineSeries(unsorted, range);
    expect(result.totalPnL).toEqual([100, 50, 250]);
  });

  it('produces arrays with length equal to number of days in range', () => {
    const result = buildSparklineSeries(daily, range);
    expect(result.totalPnL).toHaveLength(5);
    expect(result.currentEquity).toHaveLength(5);
    expect(result.winRate).toHaveLength(5);
  });
});
