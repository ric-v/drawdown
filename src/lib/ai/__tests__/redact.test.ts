import { redactSnapshot, type RawSnapshotInputs } from '../redact';
import type { InsightType } from '../types';

/**
 * Creates a fully-populated RawSnapshotInputs with PII-like fields
 * embedded in nested objects to verify stripping behavior.
 */
function makeSampleInput(insightType: InsightType): RawSnapshotInputs {
  return {
    insightType,
    dateRange: {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
    },
    dailyPnL: [
      { id: 'txn-1', date: new Date('2024-01-02'), pnl: 150, notes: 'Good trade' },
      { id: 'txn-2', date: new Date('2024-01-03'), pnl: -80 },
      { id: 'txn-3', date: new Date('2024-01-04'), pnl: 200, notes: 'Breakout' },
    ],
    stats: {
      totalPnL: 270,
      totalPnLPercentage: 2.7,
      winRate: 66.67,
      totalDays: 3,
      profitDays: 2,
      lossDays: 1,
      averageProfit: 175,
      averageLoss: -80,
      largestProfit: 200,
      largestLoss: -80,
      currentEquity: 10270,
      initialCapital: 10000,
      profitFactor: 4.375,
      expectancy: 90,
      maxDrawdown: 0.78,
      currentStreak: 1,
    },
    drawdownSeries: [0, 0.01, 0.005, 0],
    currency: 'USD',
    notes: ['Good trade', 'Breakout'],
  };
}

describe('redactSnapshot — performance-summary', () => {
  const result = redactSnapshot(makeSampleInput('performance-summary'));

  it('includes required fields: insightType, dateRange, currency, dailyPnL, portfolioStats', () => {
    expect(result.insightType).toBe('performance-summary');
    expect(result.dateRange).toEqual({ from: '2024-01-01', to: '2024-01-31' });
    expect(result.currency).toBe('USD');
    expect(result.dailyPnL).toBeDefined();
    expect(result.dailyPnL!.length).toBe(3);
    expect(result.portfolioStats).toBeDefined();
  });

  it('does NOT include forbidden fields: drawdownSeries, perDayPnL, currentStreak, profitFactor, expectancy, notes', () => {
    expect(result).not.toHaveProperty('drawdownSeries');
    expect(result).not.toHaveProperty('perDayPnL');
    expect(result).not.toHaveProperty('currentStreak');
    expect(result).not.toHaveProperty('profitFactor');
    expect(result).not.toHaveProperty('expectancy');
    expect(result).not.toHaveProperty('notes');
  });
});

describe('redactSnapshot — risk-review', () => {
  const result = redactSnapshot(makeSampleInput('risk-review'));

  it('includes required fields: insightType, dateRange, drawdownSeries, currentStreak, profitFactor, expectancy', () => {
    expect(result.insightType).toBe('risk-review');
    expect(result.dateRange).toEqual({ from: '2024-01-01', to: '2024-01-31' });
    expect(result.drawdownSeries).toBeDefined();
    expect(result.drawdownSeries!.length).toBe(4);
    expect(result.currentStreak).toBe(1);
    expect(result.profitFactor).toBe(4.375);
    expect(result.expectancy).toBe(90);
  });

  it('does NOT include forbidden fields: dailyPnL, portfolioStats, perDayPnL, notes, currency', () => {
    expect(result).not.toHaveProperty('dailyPnL');
    expect(result).not.toHaveProperty('portfolioStats');
    expect(result).not.toHaveProperty('perDayPnL');
    expect(result).not.toHaveProperty('notes');
    expect(result).not.toHaveProperty('currency');
  });
});

describe('redactSnapshot — trade-pattern-analysis', () => {
  const result = redactSnapshot(makeSampleInput('trade-pattern-analysis'));

  it('includes required fields: insightType, dateRange, perDayPnL', () => {
    expect(result.insightType).toBe('trade-pattern-analysis');
    expect(result.dateRange).toEqual({ from: '2024-01-01', to: '2024-01-31' });
    expect(result.perDayPnL).toBeDefined();
    expect(result.perDayPnL!.length).toBe(3);
  });

  it('includes notes when present', () => {
    expect(result.notes).toEqual(['Good trade', 'Breakout']);
  });

  it('does NOT include forbidden fields: dailyPnL, portfolioStats, drawdownSeries, currentStreak, profitFactor, expectancy, currency', () => {
    expect(result).not.toHaveProperty('dailyPnL');
    expect(result).not.toHaveProperty('portfolioStats');
    expect(result).not.toHaveProperty('drawdownSeries');
    expect(result).not.toHaveProperty('currentStreak');
    expect(result).not.toHaveProperty('profitFactor');
    expect(result).not.toHaveProperty('expectancy');
    expect(result).not.toHaveProperty('currency');
  });
});

describe('redactSnapshot — PII stripping', () => {
  it('strips PII fields from nested objects at any depth', () => {
    // Inject PII-like fields into the stats object to verify stripping
    const input = makeSampleInput('performance-summary');
    const statsWithPII = {
      ...input.stats,
      email: 'user@example.com',
      displayName: 'John Doe',
      name: 'John',
      sub: 'oauth-sub-123',
      subject: 'subject-id',
      picture: 'https://example.com/avatar.png',
      avatar: 'https://example.com/avatar2.png',
      accountId: 'acc-123',
      userId: 'user-456',
      id: 'stats-id-789',
    };
    input.stats = statsWithPII as typeof input.stats;

    const result = redactSnapshot(input);

    // portfolioStats should exist but without PII fields
    expect(result.portfolioStats).toBeDefined();
    const stats = result.portfolioStats as unknown as Record<string, unknown>;
    expect(stats).not.toHaveProperty('email');
    expect(stats).not.toHaveProperty('displayName');
    expect(stats).not.toHaveProperty('name');
    expect(stats).not.toHaveProperty('sub');
    expect(stats).not.toHaveProperty('subject');
    expect(stats).not.toHaveProperty('picture');
    expect(stats).not.toHaveProperty('avatar');
    expect(stats).not.toHaveProperty('accountId');
    expect(stats).not.toHaveProperty('userId');
    expect(stats).not.toHaveProperty('id');

    // Legitimate stats fields should still be present
    expect(stats.totalPnL).toBe(270);
    expect(stats.winRate).toBe(66.67);
  });

  it('strips id fields from dailyPnL entries', () => {
    const input = makeSampleInput('performance-summary');
    const result = redactSnapshot(input);

    // dailyPnL entries should not have 'id' (it's in PII_FIELD_DENYLIST)
    for (const entry of result.dailyPnL!) {
      expect(entry).not.toHaveProperty('id');
    }
  });
});
