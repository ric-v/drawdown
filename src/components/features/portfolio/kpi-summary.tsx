'use client';

import { PortfolioStats } from '@/types/trading';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { FormattedCurrency, FormattedPercentage } from '@/components/common/formatted-values';

interface KPISummaryProps {
  stats: PortfolioStats;
}

function getSystemHealth(stats: PortfolioStats) {
  const pfScore = stats.profitFactor >= 1.5 ? 2 : stats.profitFactor >= 1.0 ? 1 : 0;
  const wrScore = stats.winRate >= 50 ? 2 : stats.winRate >= 40 ? 1 : 0;
  const ddScore = stats.maxDrawdown <= 10 ? 2 : stats.maxDrawdown <= 20 ? 1 : 0;
  const total = pfScore + wrScore + ddScore;
  if (total >= 5) return { label: 'Healthy', color: 'text-emerald-600 dark:text-emerald-400' };
  if (total >= 3) return { label: 'Fragile', color: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Broken', color: 'text-rose-600 dark:text-rose-400' };
}

export function KPISummary({ stats }: KPISummaryProps) {
  const health = getSystemHealth(stats);
  const maxAllowedDD = 30;
  const ddPct = Math.min(100, (stats.maxDrawdown / maxAllowedDD) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* P&L + Equity */}
      <div className="rounded-xl border border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total P&L</p>
          <span className={cn('text-xs font-bold', health.color)}>{health.label}</span>
        </div>
        <div className={cn('text-2xl font-bold', stats.totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
          {stats.totalPnL >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(stats.totalPnL)} short />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span><FormattedPercentage value={stats.totalPnLPercentage} /> return</span>
          <span>Equity: <FormattedCurrency value={stats.currentEquity} short /></span>
        </div>
      </div>

      {/* Win Rate + Days */}
      <div className="rounded-xl border border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Win Rate</p>
        <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400">{stats.profitDays}W</span>
          <span className="text-rose-600 dark:text-rose-400">{stats.lossDays}L</span>
          <span className="text-gray-500">{stats.totalDays} days</span>
          <span className={cn('ml-auto font-bold', stats.currentStreak > 0 ? 'text-emerald-600 dark:text-emerald-400' : stats.currentStreak < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500')}>
            {stats.currentStreak > 0 ? '+' : ''}{stats.currentStreak} streak
          </span>
        </div>
      </div>

      {/* Profit Factor + Expectancy */}
      <div className="rounded-xl border border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Edge</p>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-2xl font-bold', stats.profitFactor >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">PF</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Exp: {stats.expectancy >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(stats.expectancy)} short />/trade</span>
          <span>Avg W/L: {stats.averageLoss !== 0 ? (stats.averageProfit / Math.abs(stats.averageLoss)).toFixed(1) : '∞'}:1</span>
        </div>
      </div>

      {/* Max Drawdown + Risk */}
      <div className="rounded-xl border border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Max Drawdown</p>
          <span className={cn('text-xs font-bold',
            stats.maxDrawdown > 25 ? 'text-rose-600 dark:text-rose-400' :
            stats.maxDrawdown > 15 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
          )}>
            {stats.maxDrawdown > 25 ? 'HIGH' : stats.maxDrawdown > 15 ? 'MED' : 'LOW'} risk
          </span>
        </div>
        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
          <FormattedPercentage value={stats.maxDrawdown} decimals={1} />
        </div>
        <div className="space-y-1">
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
            <div
              className={cn('h-1.5 rounded-full transition-all',
                ddPct <= 70 ? 'bg-emerald-500' : ddPct <= 100 ? 'bg-amber-500' : 'bg-rose-500'
              )}
              style={{ width: `${ddPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">{stats.maxDrawdown.toFixed(1)}% / {maxAllowedDD}% allowed</p>
        </div>
      </div>
    </div>
  );
}
