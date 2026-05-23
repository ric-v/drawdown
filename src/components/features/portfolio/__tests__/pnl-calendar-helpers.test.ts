import { mapPnLToBucket, computeMonthlySummary } from '../pnl-calendar-helpers';
import { DailyPnL } from '@/types/trading';

describe('mapPnLToBucket', () => {
  it('returns bucket 0 and neutral tone when pnl is 0', () => {
    expect(mapPnLToBucket(0, 100)).toEqual({ bucket: 0, tone: 'neutral' });
  });

  it('returns bucket 0 and neutral tone when maxAbs is 0', () => {
    expect(mapPnLToBucket(50, 0)).toEqual({ bucket: 0, tone: 'neutral' });
  });

  it('returns gain tone for positive pnl', () => {
    const result = mapPnLToBucket(50, 100);
    expect(result.tone).toBe('gain');
  });

  it('returns loss tone for negative pnl', () => {
    const result = mapPnLToBucket(-50, 100);
    expect(result.tone).toBe('loss');
  });

  it('maps ratio <= 0.2 to bucket 1', () => {
    expect(mapPnLToBucket(20, 100).bucket).toBe(1);
    expect(mapPnLToBucket(10, 100).bucket).toBe(1);
  });

  it('maps ratio <= 0.4 to bucket 2', () => {
    expect(mapPnLToBucket(30, 100).bucket).toBe(2);
    expect(mapPnLToBucket(40, 100).bucket).toBe(2);
  });

  it('maps ratio <= 0.6 to bucket 3', () => {
    expect(mapPnLToBucket(50, 100).bucket).toBe(3);
    expect(mapPnLToBucket(60, 100).bucket).toBe(3);
  });

  it('maps ratio <= 0.8 to bucket 4', () => {
    expect(mapPnLToBucket(70, 100).bucket).toBe(4);
    expect(mapPnLToBucket(80, 100).bucket).toBe(4);
  });

  it('maps ratio > 0.8 to bucket 5', () => {
    expect(mapPnLToBucket(90, 100).bucket).toBe(5);
    expect(mapPnLToBucket(100, 100).bucket).toBe(5);
  });

  it('handles negative pnl with correct bucket based on absolute value', () => {
    expect(mapPnLToBucket(-20, 100)).toEqual({ bucket: 1, tone: 'loss' });
    expect(mapPnLToBucket(-100, 100)).toEqual({ bucket: 5, tone: 'loss' });
  });

  it('produces monotonically non-decreasing buckets as |pnl|/maxAbs increases', () => {
    const maxAbs = 100;
    let prevBucket = 0;
    for (let pnl = 1; pnl <= 100; pnl++) {
      const { bucket } = mapPnLToBucket(pnl, maxAbs);
      expect(bucket).toBeGreaterThanOrEqual(prevBucket);
      prevBucket = bucket;
    }
  });
});

describe('computeMonthlySummary', () => {
  it('returns N/A winRate and 0 tradingDays when entries is empty', () => {
    expect(computeMonthlySummary([])).toEqual({
      totalPnL: 0,
      tradingDays: 0,
      winRate: 'N/A',
    });
  });

  it('computes totalPnL as sum of all entry pnl values', () => {
    const entries: DailyPnL[] = [
      { id: '1', date: new Date('2024-01-01'), pnl: 100 },
      { id: '2', date: new Date('2024-01-02'), pnl: -50 },
      { id: '3', date: new Date('2024-01-03'), pnl: 200 },
    ];
    const result = computeMonthlySummary(entries);
    expect(result.totalPnL).toBe(250);
  });

  it('counts tradingDays as the number of entries', () => {
    const entries: DailyPnL[] = [
      { id: '1', date: new Date('2024-01-01'), pnl: 100 },
      { id: '2', date: new Date('2024-01-02'), pnl: -50 },
    ];
    const result = computeMonthlySummary(entries);
    expect(result.tradingDays).toBe(2);
  });

  it('computes winRate as percentage of positive pnl days to 1 decimal place', () => {
    const entries: DailyPnL[] = [
      { id: '1', date: new Date('2024-01-01'), pnl: 100 },
      { id: '2', date: new Date('2024-01-02'), pnl: -50 },
      { id: '3', date: new Date('2024-01-03'), pnl: 200 },
    ];
    // 2 wins out of 3 days = 66.7%
    const result = computeMonthlySummary(entries);
    expect(result.winRate).toBe('66.7');
  });

  it('treats zero pnl days as non-winning days', () => {
    const entries: DailyPnL[] = [
      { id: '1', date: new Date('2024-01-01'), pnl: 0 },
      { id: '2', date: new Date('2024-01-02'), pnl: 100 },
    ];
    // 1 win out of 2 days = 50.0%
    const result = computeMonthlySummary(entries);
    expect(result.winRate).toBe('50.0');
  });

  it('returns 100.0 winRate when all days are positive', () => {
    const entries: DailyPnL[] = [
      { id: '1', date: new Date('2024-01-01'), pnl: 100 },
      { id: '2', date: new Date('2024-01-02'), pnl: 50 },
    ];
    const result = computeMonthlySummary(entries);
    expect(result.winRate).toBe('100.0');
  });

  it('returns 0.0 winRate when all days are negative', () => {
    const entries: DailyPnL[] = [
      { id: '1', date: new Date('2024-01-01'), pnl: -100 },
      { id: '2', date: new Date('2024-01-02'), pnl: -50 },
    ];
    const result = computeMonthlySummary(entries);
    expect(result.winRate).toBe('0.0');
  });
});
