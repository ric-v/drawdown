'use client';

import { useState } from 'react';
import { PortfolioStats } from '@/types/trading';
import { cn } from '@/lib/utils/utils';
import { FormattedCurrency, FormattedPercentage } from '@/components/common/formatted-values';
import { useSettings } from '@/hooks/use-settings';
import { formatPercentage } from '@/lib/utils/format-settings';

interface TraderCockpitProps {
  stats: PortfolioStats;
}

type Tab = 'risk' | 'edge' | 'behavior';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'risk', label: 'Risk', icon: '⚠️' },
  { id: 'edge', label: 'Edge', icon: '📈' },
  { id: 'behavior', label: 'Behavior', icon: '🧠' },
];

function Row({ label, children, variant }: { label: string; children: React.ReactNode; variant?: 'positive' | 'negative' | 'neutral' }) {
  const bg = variant === 'positive' ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/30'
    : variant === 'negative' ? 'bg-rose-50/50 dark:bg-rose-500/5 border border-rose-200/30'
    : 'bg-gray-50/50 dark:bg-slate-800/50';
  return (
    <div className={cn('flex items-center justify-between p-2.5 rounded-lg', bg)}>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <span className="text-sm font-bold">{children}</span>
    </div>
  );
}

export function TraderCockpit({ stats }: TraderCockpitProps) {
  const [tab, setTab] = useState<Tab>('risk');
  const { settings } = useSettings();
  const maxAllowedDD = 30;

  return (
    <div className="rounded-xl border border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200/60 dark:border-slate-800/60">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 px-3 py-2.5 text-xs font-semibold transition-all',
              tab === t.id
                ? 'bg-white dark:bg-slate-900 border-b-2 border-current text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 space-y-2.5">
        {tab === 'risk' && (
          <>
            <Row label="Max Drawdown" variant="negative">
              <span className="text-rose-600 dark:text-rose-400"><FormattedPercentage value={stats.maxDrawdown} decimals={1} /></span>
            </Row>
            <div className="p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">DD / Allowed</span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{stats.maxDrawdown.toFixed(1)}% / {maxAllowedDD}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all',
                    stats.maxDrawdown <= maxAllowedDD * 0.7 ? 'bg-emerald-500' :
                    stats.maxDrawdown <= maxAllowedDD ? 'bg-amber-500' : 'bg-rose-500'
                  )}
                  style={{ width: `${Math.min(100, (stats.maxDrawdown / maxAllowedDD) * 100)}%` }}
                />
              </div>
            </div>
            <Row label="Risk of Ruin">
              <span className={cn(
                stats.maxDrawdown > 25 ? 'text-rose-600 dark:text-rose-400' :
                stats.maxDrawdown > 15 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              )}>
                {stats.maxDrawdown > 25 ? 'HIGH' : stats.maxDrawdown > 15 ? 'MED' : 'LOW'}
              </span>
            </Row>
          </>
        )}

        {tab === 'edge' && (
          <>
            <Row label="Profit Factor" variant={stats.profitFactor >= 1 ? 'positive' : 'negative'}>
              <span className={cn(stats.profitFactor >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {stats.profitFactor ? (settings ? formatPercentage(stats.profitFactor, settings, { asDecimal: true, decimals: 2 }) : stats.profitFactor.toFixed(2)) : '∞'}
              </span>
            </Row>
            <Row label="Expectancy">
              <span className={cn(stats.expectancy > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {stats.expectancy >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(stats.expectancy)} short />
              </span>
            </Row>
            <Row label="Tail Risk Ratio" variant={(Math.abs(stats.largestLoss) / stats.averageProfit) > 2 ? 'negative' : undefined}>
              <span className={cn(
                (Math.abs(stats.largestLoss) / stats.averageProfit) > 2 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              )}>
                {stats.averageProfit > 0 ? (Math.abs(stats.largestLoss) / stats.averageProfit).toFixed(1) : '∞'}
              </span>
            </Row>
          </>
        )}

        {tab === 'behavior' && (
          <>
            <Row label="Current Streak">
              <span className={cn(stats.currentStreak > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {stats.currentStreak > 0 ? '+' : ''}{stats.currentStreak}
              </span>
            </Row>
            <Row label="Asymmetry Ratio">
              <span className={cn(
                (stats.averageProfit / Math.abs(stats.averageLoss)) > 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              )}>
                {stats.averageLoss !== 0 ? (stats.averageProfit / Math.abs(stats.averageLoss)).toFixed(1) : '∞'}:1
              </span>
            </Row>
            <Row label="Best Day" variant="positive">
              <span className="text-emerald-600 dark:text-emerald-400">+<FormattedCurrency value={stats.largestProfit} short /></span>
            </Row>
            <Row label="Worst Day" variant="negative">
              <span className="text-rose-600 dark:text-rose-400">-<FormattedCurrency value={Math.abs(stats.largestLoss)} short /></span>
            </Row>
          </>
        )}
      </div>
    </div>
  );
}
