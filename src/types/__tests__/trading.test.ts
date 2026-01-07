/**
 * @jest-environment jsdom
 */
import { PortfolioStats, DailyPnL, EquityPoint } from '@/types/trading';

describe('Trading Types', () => {
  describe('DailyPnL', () => {
    it('should create a valid DailyPnL object', () => {
      const pnl: DailyPnL = {
        id: 'test-1',
        date: new Date('2024-01-01'),
        pnl: 1000,
        notes: 'Test trade',
      };

      expect(pnl.id).toBe('test-1');
      expect(pnl.pnl).toBe(1000);
      expect(pnl.notes).toBe('Test trade');
    });
  });

  describe('PortfolioStats', () => {
    it('should create a valid PortfolioStats object with all required fields', () => {
      const stats: PortfolioStats = {
        totalPnL: 5000,
        totalPnLPercentage: 10,
        winRate: 65,
        totalDays: 100,
        profitDays: 65,
        lossDays: 35,
        averageProfit: 200,
        averageLoss: -150,
        largestProfit: 2000,
        largestLoss: -1000,
        currentEquity: 55000,
        initialCapital: 50000,
        profitFactor: 1.33,
        expectancy: 50,
        maxDrawdown: -5000,
        currentStreak: 5,
      };

      expect(stats.totalPnL).toBe(5000);
      expect(stats.winRate).toBe(65);
      expect(stats.profitFactor).toBe(1.33);
    });
  });

  describe('EquityPoint', () => {
    it('should create a valid EquityPoint object', () => {
      const point: EquityPoint = {
        date: '2024-01-01',
        displayDate: 'Jan 1, 2024',
        equity: 50000,
        pnl: 0,
        pnlPercentage: 0,
      };

      expect(point.date).toBe('2024-01-01');
      expect(point.equity).toBe(50000);
    });
  });
});
