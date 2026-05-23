import { DailyPnL } from '@/types/trading';

/**
 * Maps a P&L value to a color bucket and tone for the calendar heatmap.
 *
 * Bucket 0 is the neutral baseline (pnl === 0 or maxAbs === 0).
 * Buckets 1–5 represent monotonically non-decreasing intensity steps
 * based on |pnl| / maxAbs.
 *
 * @param pnl - The day's profit/loss value
 * @param maxAbs - The largest absolute daily P&L in the active range
 * @returns An object with `bucket` (0–5) and `tone` ('gain' | 'loss' | 'neutral')
 */
export function mapPnLToBucket(
  pnl: number,
  maxAbs: number
): { bucket: 0 | 1 | 2 | 3 | 4 | 5; tone: 'gain' | 'loss' | 'neutral' } {
  if (pnl === 0 || maxAbs === 0) {
    return { bucket: 0, tone: 'neutral' };
  }

  const tone: 'gain' | 'loss' = pnl > 0 ? 'gain' : 'loss';
  const ratio = Math.abs(pnl) / maxAbs;

  // 5 discrete intensity steps with monotonic non-decreasing thresholds
  let bucket: 1 | 2 | 3 | 4 | 5;
  if (ratio <= 0.2) {
    bucket = 1;
  } else if (ratio <= 0.4) {
    bucket = 2;
  } else if (ratio <= 0.6) {
    bucket = 3;
  } else if (ratio <= 0.8) {
    bucket = 4;
  } else {
    bucket = 5;
  }

  return { bucket, tone };
}

/**
 * Computes a monthly summary from an array of DailyPnL entries.
 *
 * @param entries - The DailyPnL entries for the month
 * @returns An object with `totalPnL`, `tradingDays`, and `winRate`
 *          (a string with 1 decimal place percentage, or "N/A" when tradingDays === 0)
 */
export function computeMonthlySummary(entries: DailyPnL[]): {
  totalPnL: number;
  tradingDays: number;
  winRate: string;
} {
  const tradingDays = entries.length;
  const totalPnL = entries.reduce((sum, entry) => sum + entry.pnl, 0);

  if (tradingDays === 0) {
    return { totalPnL: 0, tradingDays: 0, winRate: 'N/A' };
  }

  const winDays = entries.filter((entry) => entry.pnl > 0).length;
  const winRate = ((winDays / tradingDays) * 100).toFixed(1);

  return { totalPnL, tradingDays, winRate };
}
