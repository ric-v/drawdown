'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquityPoint } from '@/types/trading';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils/utils';
import { formatCurrencyShort, formatCurrency } from '@/lib/utils/format-settings';
import { useState } from 'react';
import { TrendingUp, BarChart3, Calendar, Activity, DollarSign, Target, Zap, BarChart2, Scale, TrendingDown, CalendarDays, CalendarRange } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { PnLCalendar } from './pnl-calendar';
import { DailyPnL } from '@/types/trading';
import { useSettings } from '@/hooks/use-settings';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { CustomTabs, TabItem } from '@/components/ui/custom-tabs';

interface EquityChartProps {
  data: EquityPoint[];
  allData?: DailyPnL[];
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  className?: string;
  // Trader cockpit controls
  showDrawdown?: boolean;
  pnlViewMode?: 'raw' | 'clipped' | 'log';
  equityViewMode?: 'absolute' | 'r-multiple';
  onShowDrawdownChange?: (show: boolean) => void;
  onPnlViewModeChange?: (mode: 'raw' | 'clipped' | 'log') => void;
  onEquityViewModeChange?: (mode: 'absolute' | 'r-multiple') => void;
  onCalendarDayClick?: (dayData: DailyPnL | null, date: Date) => void;
}

export function EquityChart({ 
  data, 
  allData, 
  dateRange, 
  onDateRangeChange, 
  className,
  showDrawdown = true,
  pnlViewMode = 'raw',
  equityViewMode = 'absolute',
  onShowDrawdownChange,
  onPnlViewModeChange,
  onEquityViewModeChange,
  onCalendarDayClick
}: EquityChartProps) {
  // Use localStorage for persistent state
  const [chartType, setChartType] = useLocalStorage<'equity' | 'pnl' | 'activity'>('equity-chart-type', 'equity');
  const [storedEquityViewMode, setStoredEquityViewMode] = useLocalStorage<'absolute' | 'r-multiple'>('equity-view-mode', 'absolute');
  const [storedPnlViewMode, setStoredPnlViewMode] = useLocalStorage<'raw' | 'clipped' | 'log'>('pnl-view-mode', 'raw');
  const [storedShowDrawdown, setStoredShowDrawdown] = useLocalStorage<boolean>('equity-show-drawdown', true);
  const [aggregationPeriod, setAggregationPeriod] = useLocalStorage<'daily' | 'weekly' | 'monthly'>('equity-aggregation-period', 'daily');
  
  // Annotations state (stored client-side for this session)
  const [annotations, setAnnotations] = useLocalStorage<Array<{ date: string; text: string; type: 'large-loss' | 'overtrade' | 'rule-break' }>>('equity-annotations', []);
  const { settings } = useSettings();

  // Use stored values or props as fallback
  const currentEquityViewMode = equityViewMode || storedEquityViewMode;
  const currentPnlViewMode = pnlViewMode || storedPnlViewMode;
  const currentShowDrawdown = showDrawdown !== undefined ? showDrawdown : storedShowDrawdown;

  // Tab configuration for chart types
  const tabItems: TabItem[] = [
    { id: 'equity', label: 'Equity', icon: TrendingUp },
    { id: 'pnl', label: 'P&L', icon: BarChart3 },
    { id: 'activity', label: 'Calendar', icon: Calendar }
  ];

  // Tab configuration for equity view modes
  const equityViewItems: TabItem[] = [
    { id: 'absolute', label: 'Absolute ₹', icon: DollarSign },
    { id: 'r-multiple', label: 'R-Multiple', icon: Target }
  ];

  // Tab configuration for P&L view modes
  const pnlViewItems: TabItem[] = [
    { id: 'raw', label: 'Raw ₹', icon: DollarSign },
    { id: 'clipped', label: 'Clipped', icon: BarChart2 },
    { id: 'log', label: 'Log Scale', icon: Scale }
  ];

  // Tab configuration for aggregation periods
  const aggregationItems: TabItem[] = [
    { id: 'daily', label: 'Daily', icon: Calendar },
    { id: 'weekly', label: 'Weekly', icon: CalendarDays },
    { id: 'monthly', label: 'Monthly', icon: CalendarRange }
  ];

  // Aggregate data based on selected period
  const aggregateData = (data: EquityPoint[], period: 'daily' | 'weekly' | 'monthly'): EquityPoint[] => {
    if (period === 'daily') return data;

    const groups = new Map<string, EquityPoint[]>();

    data.forEach(point => {
      const date = parseISO(point.date);
      let key: string;
      let displayDate: string;

      if (period === 'weekly') {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday as start
        key = format(weekStart, 'yyyy-MM-dd');
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        displayDate = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
      } else { // monthly
        key = format(startOfMonth(date), 'yyyy-MM-dd');
        displayDate = format(date, 'MMM yyyy');
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push({ ...point, displayDate });
    });

    // Aggregate each group
    const aggregated: EquityPoint[] = [];
    groups.forEach((points, key) => {
      // Use the last equity value in the period (end of week/month)
      const lastPoint = points[points.length - 1];
      // Sum up PnL for the period
      const totalPnl = points.reduce((sum, p) => sum + p.pnl, 0);
      // Calculate percentage based on total PnL
      const pnlPercentage = points[0].equity > 0 
        ? (totalPnl / (points[0].equity - points[0].pnl)) * 100 
        : 0;

      aggregated.push({
        date: key,
        displayDate: lastPoint.displayDate!,
        equity: lastPoint.equity,
        pnl: totalPnl,
        pnlPercentage: parseFloat(pnlPercentage.toFixed(2))
      });
    });

    return aggregated.sort((a, b) => a.date.localeCompare(b.date));
  };

  // Apply aggregation to data
  const aggregatedData = aggregateData(data, aggregationPeriod);

  // Calculate drawdown data for overlay
  const dataWithDrawdown = aggregatedData.map((point, index) => {
    const peak = Math.max(...aggregatedData.slice(0, index + 1).map(p => p.equity));
    const drawdownPercent = peak > 0 ? ((point.equity - peak) / peak) * 100 : 0;
    return {
      ...point,
      drawdownPercent,
      peak,
      isLossDay: point.pnl < 0,
      isMajorLoss: point.pnl < -Math.abs(aggregatedData.reduce((min, p) => Math.min(min, p.pnl), 0)) * 0.5 // 50% of worst period
    };
  });

  // Process P&L data based on view mode
  const processedPnLData = aggregatedData.map(point => {
    let processedPnL = point.pnl;
    
    if (currentPnlViewMode === 'clipped') {
      // Clip extreme outliers to 95th percentile
      const sortedPnL = aggregatedData.map(d => Math.abs(d.pnl)).sort((a, b) => b - a);
      const clipThreshold = sortedPnL[Math.floor(sortedPnL.length * 0.05)];
      if (Math.abs(processedPnL) > clipThreshold) {
        processedPnL = processedPnL > 0 ? clipThreshold : -clipThreshold;
      }
    } else if (currentPnlViewMode === 'log') {
      // Log scale transformation
      processedPnL = processedPnL >= 0 
        ? Math.log10(Math.abs(processedPnL) + 1) 
        : -Math.log10(Math.abs(processedPnL) + 1);
    }
    
    return {
      ...point,
      processedPnL,
      isMajorLoss: point.pnl < -Math.abs(aggregatedData.reduce((min, p) => Math.min(min, p.pnl), 0)) * 0.5
    };
  });

  const EquityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const drawdownData = dataWithDrawdown.find(d => d.date === data.date);
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl min-w-[240px]">
          <p className="text-gray-400 text-xs mb-3 font-medium">{data.displayDate || data.date}</p>
          <div className="space-y-2">
            <p className="text-gray-100 font-semibold text-sm">
              Equity: {formatCurrency(data.equity, settings)}
            </p>
            <p className={`text-sm font-medium ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              Daily P&L: {data.pnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(data.pnl), settings)} 
              <span className="text-gray-400 text-xs ml-1">({data.pnlPercentage >= 0 ? '+' : ''}{data.pnlPercentage}%)</span>
            </p>
            {drawdownData && drawdownData.drawdownPercent < -0.1 && (
              <p className="text-rose-400 text-xs font-medium">
                📉 Drawdown: {drawdownData.drawdownPercent.toFixed(1)}%
              </p>
            )}
            {drawdownData?.isMajorLoss && (
              <p className="text-amber-400 text-xs font-semibold">
                ⚠️ Major loss day
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const PnLTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const worstLoss = Math.abs(processedPnLData.reduce((min, p) => Math.min(min, p.pnl), 0));
      const lossPercentOfWorst = worstLoss > 0 ? (Math.abs(data.pnl) / worstLoss * 100) : 0;
      
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl min-w-[200px]">
          <p className="text-gray-400 text-xs mb-3 font-medium">{data.displayDate || data.date}</p>
          <div className="space-y-2">
            <p className={`font-semibold text-sm ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              P&L: {data.pnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(data.pnl), settings)}
            </p>
            <p className="text-gray-400 text-xs">
              {data.pnlPercentage >= 0 ? '+' : ''}{data.pnlPercentage}% of equity
            </p>
            {data.pnl < 0 && lossPercentOfWorst > 25 && (
              <p className="text-amber-400 text-xs font-medium">
                💥 {lossPercentOfWorst.toFixed(0)}% of worst loss
              </p>
            )}
            {data.isMajorLoss && (
              <p className="text-rose-400 text-xs font-semibold">
                🚨 Review: Rule violated?
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const tickFormatter = (value: number) => {
    return formatCurrencyShort(value, settings);
  };

  return (
    <Card className={cn("lg:col-span-2 border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl rounded-2xl min-w-0 overflow-hidden", className)}>
      <CardHeader className="flex flex-col gap-2 pb-2 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
              {chartType === 'equity' ? 'Equity Curve' : chartType === 'pnl' ? 'Daily P&L' : 'Activity Heatmap'}
            </CardTitle>
            
            {/* Chart Type Selector */}
            <CustomTabs
              items={tabItems}
              value={chartType}
              onValueChange={(value) => setChartType(value as 'equity' | 'pnl' | 'activity')}
            />
          </div>
          
          {/* Trader Controls */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            {/* Left side - View modes */}
            <div className="flex flex-wrap gap-2">
              {/* Aggregation Period Selector - Show for equity and pnl charts */}
              {(chartType === 'equity' || chartType === 'pnl') && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Period:</span>
                  <CustomTabs
                    items={aggregationItems}
                    value={aggregationPeriod}
                    onValueChange={(value) => setAggregationPeriod(value as 'daily' | 'weekly' | 'monthly')}
                    className="scale-90"
                  />
                </div>
              )}
              
              {chartType === 'equity' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">View:</span>
                  <CustomTabs
                    items={equityViewItems}
                    value={currentEquityViewMode}
                    onValueChange={(value) => {
                      const newMode = value as 'absolute' | 'r-multiple';
                      setStoredEquityViewMode(newMode);
                      onEquityViewModeChange?.(newMode);
                    }}
                    className="scale-90"
                  />
                </div>
              )}
              
              {chartType === 'pnl' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Scale:</span>
                  <CustomTabs
                    items={pnlViewItems}
                    value={currentPnlViewMode}
                    onValueChange={(value) => {
                      const newMode = value as 'raw' | 'clipped' | 'log';
                      setStoredPnlViewMode(newMode);
                      onPnlViewModeChange?.(newMode);
                    }}
                    className="scale-90"
                  />
                </div>
              )}
            </div>
            
            {/* Right side - Risk toggles */}
            {chartType === 'equity' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newValue = !currentShowDrawdown;
                    setStoredShowDrawdown(newValue);
                    onShowDrawdownChange?.(newValue);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    currentShowDrawdown
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                      : 'bg-gray-100/80 dark:bg-slate-800/80 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-200/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <TrendingDown className="w-3 h-3" />
                  <span>Drawdown Overlay</span>
                </button>
                
                <button
                  onClick={() => {
                    // Simple annotation - could be expanded to a modal
                    const today = new Date().toISOString().split('T')[0];
                    const text = prompt('Add annotation:');
                    if (text) {
                      const newAnnotation = { 
                        date: today, 
                        text, 
                        type: 'rule-break' as const 
                      };
                      setAnnotations([...annotations, newAnnotation]);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 bg-purple-100/80 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/30 hover:bg-purple-200/80 dark:hover:bg-purple-700/80"
                >
                  <span>📝</span>
                  <span>Annotate</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-1 sm:px-4 pb-1">
        {aggregatedData.length === 0 ? (
          <div className="h-[180px] sm:h-[200px] lg:h-[220px] w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-muted rounded-xl bg-muted/20">
            <div className="p-3 bg-muted rounded-full">
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No data available</p>
              <p className="text-xs text-muted-foreground mt-1">Try selecting a different date range</p>
            </div>
          </div>
        ) : (
          <div className="h-[180px] sm:h-[240px] lg:h-[320px] w-full">
            {chartType === 'activity' ? (
              <div className="h-full w-full pt-4 max-w-full overflow-hidden flex flex-col">
                <PnLCalendar
                  data={allData || data.map(d => ({
                    id: '', // Not needed for display
                    date: new Date(d.date),
                    pnl: d.pnl,
                    notes: ''
                  }))}
                  className="no-card border-0 shadow-none h-full w-full"
                  onDayClick={onCalendarDayClick}
                  showWeeklySummary={true}
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'equity' ? (
                  <AreaChart
                    data={dataWithDrawdown}
                    margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                      </linearGradient>
                      {/* Glow filter */}
                      <filter id="glow" height="200%" width="200%" x="-50%" y="-50%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="hsl(var(--muted-foreground))"
                      strokeOpacity={0.1}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="displayDate"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      dy={10}
                      minTickGap={30}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickFormatter={tickFormatter}
                    />
                    <Tooltip content={<EquityTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    
                    {/* Drawdown overlay - shows the pain */}
                    {currentShowDrawdown && (
                      <Area
                        type="monotone"
                        dataKey="peak"
                        stroke="transparent"
                        fillOpacity={1}
                        fill="url(#colorDrawdown)"
                        connectNulls={false}
                      />
                    )}
                    
                    {/* Main equity curve */}
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorEquity)"
                      filter="url(#glow)"
                      animationDuration={1500}
                    />
                    
                    {/* Major loss day markers */}
                    {dataWithDrawdown
                      .filter(d => d.isMajorLoss)
                      .map((point, index) => (
                        <ReferenceLine 
                          key={`loss-${index}`}
                          x={point.displayDate || point.date} 
                          stroke="#f59e0b" 
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                          strokeOpacity={0.6}
                        />
                      ))
                    }
                  </AreaChart>
                ) : (
                  <BarChart
                    data={processedPnLData}
                    margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                        <stop offset="100%" stopColor="#15803d" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                        <stop offset="100%" stopColor="#b91c1c" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="majorLossGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="hsl(var(--muted-foreground))"
                      strokeOpacity={0.1}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="displayDate"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      dy={10}
                      minTickGap={30}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickFormatter={(value) => {
                        if (currentPnlViewMode === 'log') {
                          return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
                        }
                        return tickFormatter(value);
                      }}
                    />
                    <Tooltip content={<PnLTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                    <Bar dataKey={currentPnlViewMode === 'raw' ? 'pnl' : 'processedPnL'} radius={[4, 4, 4, 4]} maxBarSize={50}>
                      {processedPnLData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.isMajorLoss ? "url(#majorLossGradient)" :
                            entry.pnl >= 0 ? "url(#profitGradient)" : "url(#lossGradient)"
                          }
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
