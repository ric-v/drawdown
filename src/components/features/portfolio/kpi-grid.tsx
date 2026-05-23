'use client';

import { useMemo } from 'react';
import { DailyPnL } from '@/types/trading';
import { calculatePortfolioStats } from '@/lib/utils/calculate-stats';
import { buildSparklineSeries, type DateRange, type KPIDirection } from '@/lib/utils/kpi';
import { KPICard, type KPIMetricId } from './kpi-card';
import { useSettings } from '@/hooks/use-settings';
import { formatCurrency, formatPercentage } from '@/lib/utils/format-settings';

interface KPIGridProps {
  dailyPnL: DailyPnL[];
  initialCapital: number;
  dateRange: DateRange;
}

interface MetricDef {
  metricId: KPIMetricId;
  label: string;
  direction: KPIDirection;
  tooltip: string;
  getValue: (s: ReturnType<typeof calculatePortfolioStats>) => number;
  formatter: (v: number, settings: any) => string;
  sparklineKey?: 'totalPnL' | 'currentEquity' | 'winRate';
}

const METRICS: MetricDef[] = [
  { metricId: 'totalPnL', label: 'Total P&L', direction: 'up-good', tooltip: 'Sum of all daily profits and losses in the selected period.', getValue: (s) => s.totalPnL, formatter: (v, s) => formatCurrency(v, s), sparklineKey: 'totalPnL' },
  { metricId: 'winRate', label: 'Win Rate', direction: 'up-good', tooltip: 'Percentage of profitable days out of total trading days.', getValue: (s) => s.winRate, formatter: (v) => `${v.toFixed(1)}%`, sparklineKey: 'winRate' },
  { metricId: 'profitFactor', label: 'Profit Factor', direction: 'up-good', tooltip: 'Gross profit divided by gross loss. Above 1.0 means net profitable.', getValue: (s) => s.profitFactor, formatter: (v) => Number.isFinite(v) ? v.toFixed(2) : '—' },
  { metricId: 'expectancy', label: 'Expectancy', direction: 'up-good', tooltip: 'Average P&L per trade. Positive means profitable on average.', getValue: (s) => s.expectancy, formatter: (v, s) => formatCurrency(v, s) },
  { metricId: 'maxDrawdown', label: 'Max Drawdown', direction: 'up-bad', tooltip: 'Largest peak-to-trough decline as a percentage of peak equity.', getValue: (s) => s.maxDrawdown, formatter: (v) => `${v.toFixed(2)}%` },
  { metricId: 'currentStreak', label: 'Current Streak', direction: 'sign-of-streak', tooltip: 'Consecutive winning (+) or losing (-) days from the most recent trade.', getValue: (s) => s.currentStreak, formatter: (v) => `${v > 0 ? '+' : ''}${v}` },
  { metricId: 'averageWin', label: 'Average Win', direction: 'up-good', tooltip: 'Mean profit on winning days.', getValue: (s) => s.averageProfit, formatter: (v, s) => formatCurrency(v, s) },
  { metricId: 'averageLoss', label: 'Average Loss', direction: 'up-bad', tooltip: 'Mean loss on losing days.', getValue: (s) => s.averageLoss, formatter: (v, s) => formatCurrency(v, s) },
  { metricId: 'largestWin', label: 'Largest Win', direction: 'up-good', tooltip: 'Best single-day profit in the selected period.', getValue: (s) => s.largestProfit, formatter: (v, s) => formatCurrency(v, s) },
  { metricId: 'largestLoss', label: 'Largest Loss', direction: 'up-bad', tooltip: 'Worst single-day loss in the selected period.', getValue: (s) => s.largestLoss, formatter: (v, s) => formatCurrency(v, s) },
  { metricId: 'currentEquity', label: 'Current Equity', direction: 'up-good', tooltip: 'Initial capital plus cumulative P&L.', getValue: (s) => s.currentEquity, formatter: (v, s) => formatCurrency(v, s), sparklineKey: 'currentEquity' },
];

export function KPIGrid({ dailyPnL, initialCapital, dateRange }: KPIGridProps) {
  const { settings } = useSettings();

  const { stats, previousStats, sparklines } = useMemo(() => {
    const filtered = dailyPnL.filter((e) => {
      const d = new Date(e.date);
      return d >= dateRange.from && d <= dateRange.to;
    });

    const rangeDuration = dateRange.to.getTime() - dateRange.from.getTime();
    const prevFrom = new Date(dateRange.from.getTime() - rangeDuration);
    const prevTo = new Date(dateRange.from.getTime() - 1);

    const prevFiltered = dailyPnL.filter((e) => {
      const d = new Date(e.date);
      return d >= prevFrom && d <= prevTo;
    });

    return {
      stats: calculatePortfolioStats(filtered, initialCapital),
      previousStats: prevFiltered.length >= 2 ? calculatePortfolioStats(prevFiltered, initialCapital) : null,
      sparklines: buildSparklineSeries(filtered, dateRange),
    };
  }, [dailyPnL, initialCapital, dateRange]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {METRICS.map((m) => {
        const value = m.getValue(stats);
        const safeValue = Number.isFinite(value) ? value : null;
        const prevValue = previousStats ? m.getValue(previousStats) : null;

        let delta: { absolute: number; percentage: number } | null = null;
        if (safeValue !== null && prevValue !== null && Number.isFinite(prevValue) && prevValue !== 0) {
          const abs = safeValue - prevValue;
          delta = { absolute: abs, percentage: (abs / Math.abs(prevValue)) * 100 };
        }

        const sparklineData = m.sparklineKey ? sparklines[m.sparklineKey] : undefined;

        return (
          <KPICard
            key={m.metricId}
            metricId={m.metricId}
            label={m.label}
            value={safeValue}
            formatter={(v) => m.formatter(v, settings)}
            direction={m.direction}
            delta={delta}
            sparklineSeries={sparklineData}
            tooltip={m.tooltip}
            error={!Number.isFinite(value) ? `${m.label} is unavailable` : undefined}
          />
        );
      })}
    </div>
  );
}
