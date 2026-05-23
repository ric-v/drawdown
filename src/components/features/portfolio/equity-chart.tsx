'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EquityPoint, DailyPnL } from '@/types/trading';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine, Cell,
} from 'recharts';
import { cn } from '@/lib/utils/utils';
import { formatCurrencyShort, formatCurrency } from '@/lib/utils/format-settings';
import { TrendingUp, BarChart3, Calendar, TrendingDown } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, format, parseISO } from 'date-fns';
import { PnLCalendar } from './pnl-calendar';
import { useSettings } from '@/hooks/use-settings';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { CustomTabs, TabItem } from '@/components/ui/custom-tabs';
import {
  applyPnLViewMode, applyEquityViewMode, sanitizeEquityPoints,
  type PnLViewMode, type EquityViewMode,
} from './equity-chart-helpers';

interface EquityChartProps {
  data: EquityPoint[];
  allData?: DailyPnL[];
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  className?: string;
  onCalendarDayClick?: (dayData: DailyPnL | null, date: Date) => void;
}

/**
 * EquityTooltip — formats date as ISO 8601 (YYYY-MM-DD), equity/P&L to 2dp,
 * percentage to 2dp. Opens within 200ms on hover or keyboard focus.
 */
function EquityTooltip({ active, payload, settings }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  // Date is already stored as ISO 8601 (YYYY-MM-DD) in EquityPoint.date
  const isoDate = d.date;
  const equityFormatted = typeof d.equity === 'number' ? d.equity.toFixed(2) : '—';
  const pnlFormatted = typeof d.pnl === 'number' ? d.pnl.toFixed(2) : '—';
  const pctFormatted = typeof d.pnlPercentage === 'number' ? d.pnlPercentage.toFixed(2) : '—';

  return (
    <div
      className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm"
      role="tooltip"
    >
      <p className="text-muted-foreground text-xs mb-2">{isoDate}</p>
      <p className="font-semibold">
        Equity: {equityFormatted}
      </p>
      <p className={d.pnl >= 0 ? 'text-positive' : 'text-negative'}>
        P&L: {d.pnl >= 0 ? '+' : ''}{pnlFormatted}
      </p>
      <p className="text-muted-foreground text-xs">
        {d.pnlPercentage >= 0 ? '+' : ''}{pctFormatted}%
      </p>
    </div>
  );
}

export function EquityChart({
  data, allData, dateRange, onDateRangeChange, className, onCalendarDayClick,
}: EquityChartProps) {
  const [chartType, setChartType] = useLocalStorage<'equity' | 'pnl' | 'activity'>('equity-chart-type', 'equity');
  const [equityViewMode, setEquityViewMode] = useLocalStorage<EquityViewMode>('equity-view-mode', 'absolute');
  const [pnlViewMode, setPnlViewMode] = useLocalStorage<PnLViewMode>('pnl-view-mode', 'raw');
  const [showDrawdown, setShowDrawdown] = useLocalStorage<boolean>('equity-show-drawdown', true);
  const [aggregation, setAggregation] = useLocalStorage<'daily' | 'weekly' | 'monthly'>('equity-aggregation-period', 'daily');
  const { settings } = useSettings();

  // Sanitize input — never throws (req 5.7, 5.8)
  const safeData = useMemo(() => sanitizeEquityPoints(data), [data]);

  // Aggregate data
  const aggregatedData = useMemo(() => {
    if (aggregation === 'daily') return safeData;
    const groups = new Map<string, EquityPoint[]>();
    safeData.forEach((point) => {
      const d = parseISO(point.date);
      const key = aggregation === 'weekly'
        ? format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        : format(startOfMonth(d), 'yyyy-MM-dd');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(point);
    });
    const result: EquityPoint[] = [];
    groups.forEach((points, key) => {
      const last = points[points.length - 1];
      const totalPnl = points.reduce((s, p) => s + p.pnl, 0);
      const pct = points[0].equity > 0 ? (totalPnl / (points[0].equity - points[0].pnl)) * 100 : 0;
      result.push({ date: key, displayDate: last.displayDate, equity: last.equity, pnl: totalPnl, pnlPercentage: parseFloat(pct.toFixed(2)) });
    });
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [safeData, aggregation]);

  // Apply view-mode transformations via pure helpers
  const equityData = useMemo(() => applyEquityViewMode(aggregatedData, equityViewMode), [aggregatedData, equityViewMode]);
  const pnlData = useMemo(() => applyPnLViewMode(aggregatedData, pnlViewMode), [aggregatedData, pnlViewMode]);

  // Drawdown overlay data (peak tracking)
  const dataWithDrawdown = useMemo(() => {
    return equityData.reduce<Array<typeof equityData[0] & { peak: number }>>((acc, p) => {
      const prevPeak = acc.length > 0 ? acc[acc.length - 1].peak : 0;
      const peak = Math.max(prevPeak, p.equity);
      acc.push({ ...p, peak });
      return acc;
    }, []);
  }, [equityData]);

  const tabItems: TabItem[] = [
    { id: 'equity', label: 'Equity', icon: TrendingUp },
    { id: 'pnl', label: 'P&L', icon: BarChart3 },
    { id: 'activity', label: 'Calendar', icon: Calendar },
  ];

  const tickFormatter = (v: number) => formatCurrencyShort(v, settings);

  // Toggle drawdown without remounting the AreaChart (req 5.2)
  const handleDrawdownToggle = useCallback(() => {
    setShowDrawdown(!showDrawdown);
  }, [showDrawdown, setShowDrawdown]);

  // Empty state (req 5.7)
  if (safeData.length === 0) {
    return (
      <Card className={cn('lg:col-span-2 border-border bg-card rounded-2xl', className)}>
        <CardContent className="flex items-center justify-center h-[220px]">
          <p className="text-muted-foreground text-sm">No equity data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('lg:col-span-2 border-border bg-card rounded-2xl min-w-0 overflow-hidden', className)}>
      <CardHeader className="flex flex-col gap-2 pb-2 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-xl font-bold">
            {chartType === 'equity' ? 'Equity Curve' : chartType === 'pnl' ? 'Daily P&L' : 'Activity Heatmap'}
          </CardTitle>
          <CustomTabs items={tabItems} value={chartType} onValueChange={(v) => setChartType(v as any)} />
        </div>

        {(chartType === 'equity' || chartType === 'pnl') && (
          <div className="flex flex-wrap gap-2 items-center" role="toolbar" aria-label="Chart view controls">
            {chartType === 'equity' && (
              <>
                <ToggleButton
                  active={equityViewMode === 'absolute'}
                  onClick={() => setEquityViewMode('absolute')}
                  label="Absolute"
                />
                <ToggleButton
                  active={equityViewMode === 'r-multiple'}
                  onClick={() => setEquityViewMode('r-multiple')}
                  label="R-Multiple"
                />
                <ToggleButton
                  active={showDrawdown}
                  onClick={handleDrawdownToggle}
                  label="Drawdown"
                  icon={<TrendingDown className="h-3 w-3" />}
                />
              </>
            )}
            {chartType === 'pnl' && (
              <>
                <ToggleButton active={pnlViewMode === 'raw'} onClick={() => setPnlViewMode('raw')} label="Raw" />
                <ToggleButton active={pnlViewMode === 'clipped'} onClick={() => setPnlViewMode('clipped')} label="Clipped" />
                <ToggleButton active={pnlViewMode === 'log'} onClick={() => setPnlViewMode('log')} label="Log" />
              </>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="px-1 sm:px-4 pb-2">
        <div className="h-[200px] sm:h-[260px] lg:h-[320px] w-full">
          {chartType === 'activity' ? (
            <PnLCalendar
              data={allData || safeData.map((d) => ({ id: '', date: new Date(d.date), pnl: d.pnl }))}
              className="no-card border-0 shadow-none h-full w-full"
              onDayClick={onCalendarDayClick}
              showWeeklySummary
            />
          ) : chartType === 'equity' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataWithDrawdown} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                {/* eslint-disable no-restricted-syntax -- chart series styling */}
                <defs>
                  <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} dy={10} minTickGap={30} /> {/* eslint-disable-line no-restricted-syntax -- chart axis styling */}
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={tickFormatter} /> {/* eslint-disable-line no-restricted-syntax -- chart axis styling */}
                <RechartsTooltip
                  content={<EquityTooltip settings={settings} />}
                  animationDuration={200}
                />
                {/* Drawdown overlay: mounts/unmounts only this <Area> node (req 5.2) */}
                {showDrawdown && (
                  <Area type="monotone" dataKey="peak" stroke="transparent" fillOpacity={1} fill="url(#ddFill)" isAnimationActive={false} />
                )}
                <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#eqFill)" isAnimationActive={false} /> {/* eslint-disable-line no-restricted-syntax -- chart series styling */}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                {/* eslint-disable no-restricted-syntax -- chart series styling */}
                <defs>
                  <linearGradient id="profitG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#15803d" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="lossG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#b91c1c" stopOpacity={1} />
                  </linearGradient>
                </defs>
                {/* eslint-enable no-restricted-syntax */}
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} dy={10} minTickGap={30} /> {/* eslint-disable-line no-restricted-syntax -- chart axis styling */}
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={tickFormatter} /> {/* eslint-disable-line no-restricted-syntax -- chart axis styling */}
                <RechartsTooltip
                  content={<EquityTooltip settings={settings} />}
                  animationDuration={200}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                <Bar dataKey="pnl" radius={[4, 4, 4, 4]} maxBarSize={50} isAnimationActive={false}>
                  {pnlData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? 'url(#profitG)' : 'url(#lossG)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Toggle button using the shared Button `toggle` variant.
 * Exposes `aria-pressed`, visible focus rings, reachable via Tab,
 * operable via Enter/Space (native button behavior).
 */
function ToggleButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <Button
      variant="toggle"
      size="sm"
      aria-pressed={active}
      data-pressed={active}
      onClick={onClick}
      className={cn(
        'h-7 px-2.5 text-xs font-medium transition-colors duration-200 motion-reduce:duration-0',
      )}
    >
      {icon}
      {label}
    </Button>
  );
}
