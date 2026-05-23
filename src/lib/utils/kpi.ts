import { DailyPnL } from '@/types/trading';

/**
 * KPI direction-of-good classification.
 * - 'up-good': higher values are beneficial (e.g., Win Rate, Profit Factor, Total P&L)
 * - 'up-bad': higher values are detrimental (e.g., Max Drawdown, Average Loss)
 * - 'sign-of-streak': positive streak is good, negative streak is bad
 */
export type KPIDirection = 'up-good' | 'up-bad' | 'sign-of-streak';

/**
 * Tone tokens for KPI delta indicators.
 */
export type DeltaTone = 'positive' | 'negative' | 'neutral';

/**
 * Resolves the visual tone for a KPI delta indicator based on the metric's
 * direction-of-good and the absolute delta value.
 *
 * - 'up-good': positive delta → positive tone, negative → negative, zero → neutral
 * - 'up-bad': positive delta → negative tone (going up is bad), negative → positive, zero → neutral
 * - 'sign-of-streak': positive delta → positive tone, negative → negative, zero → neutral
 *
 * @param direction - The direction-of-good for the metric
 * @param deltaAbsolute - The absolute change value (current - previous)
 * @returns The tone token to apply to the delta indicator
 */
export function resolveDeltaTone(
  direction: KPIDirection,
  deltaAbsolute: number,
): DeltaTone {
  if (deltaAbsolute === 0) {
    return 'neutral';
  }

  switch (direction) {
    case 'up-good':
      return deltaAbsolute > 0 ? 'positive' : 'negative';
    case 'up-bad':
      return deltaAbsolute > 0 ? 'negative' : 'positive';
    case 'sign-of-streak':
      return deltaAbsolute > 0 ? 'positive' : 'negative';
  }
}

/**
 * The set of metrics that are sequential (have meaningful per-day cumulative series).
 */
export const SEQUENTIAL_METRICS = ['totalPnL', 'currentEquity', 'winRate'] as const;
export type SequentialMetric = (typeof SEQUENTIAL_METRICS)[number];

/**
 * Result shape from buildSparklineSeries.
 * Sequential metrics get a number[] of cumulative values per day.
 * Non-sequential metrics are undefined.
 */
export interface SparklineSeriesByMetric {
  totalPnL: number[];
  currentEquity: number[];
  winRate: number[];
  profitFactor: undefined;
  expectancy: undefined;
  maxDrawdown: undefined;
  currentStreak: undefined;
  averageWin: undefined;
  averageLoss: undefined;
  largestWin: undefined;
  largestLoss: undefined;
}

/**
 * Date range for filtering daily P&L entries.
 */
export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Builds per-day cumulative sparkline series for sequential metrics.
 *
 * For each day in the range (filtered from the provided daily P&L entries),
 * computes cumulative values:
 * - totalPnL: running sum of daily P&L
 * - currentEquity: not computable without initialCapital, so uses running sum (relative equity change)
 * - winRate: cumulative win rate as percentage (wins / total days so far * 100)
 *
 * Non-sequential metrics return undefined.
 *
 * @param daily - Array of DailyPnL entries (will be filtered to range and sorted by date)
 * @param range - The date range to filter entries to
 * @returns SparklineSeriesByMetric with arrays for sequential metrics, undefined for others
 */
export function buildSparklineSeries(
  daily: DailyPnL[],
  range: DateRange,
): SparklineSeriesByMetric {
  // Filter entries to the specified date range and sort chronologically
  const filtered = daily
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= range.from && entryDate <= range.to;
    })
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

  const totalPnL: number[] = [];
  const currentEquity: number[] = [];
  const winRate: number[] = [];

  let cumulativePnL = 0;
  let winCount = 0;

  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];

    // Cumulative total P&L
    cumulativePnL += entry.pnl;
    totalPnL.push(cumulativePnL);

    // Cumulative equity (relative, starting from 0)
    currentEquity.push(cumulativePnL);

    // Cumulative win rate
    if (entry.pnl > 0) {
      winCount++;
    }
    const totalDaysSoFar = i + 1;
    winRate.push((winCount / totalDaysSoFar) * 100);
  }

  return {
    totalPnL,
    currentEquity,
    winRate,
    profitFactor: undefined,
    expectancy: undefined,
    maxDrawdown: undefined,
    currentStreak: undefined,
    averageWin: undefined,
    averageLoss: undefined,
    largestWin: undefined,
    largestLoss: undefined,
  };
}
