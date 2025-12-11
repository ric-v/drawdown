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
import { formatCurrency, cn } from '@/lib/utils';
import { useState } from 'react';
import { TrendingUp, BarChart3, Calendar, Activity } from 'lucide-react';
import { PnLCalendar } from './pnl-calendar';
import { DailyPnL } from '@/types/trading';

interface EquityChartProps {
  data: EquityPoint[];
  allData?: DailyPnL[];
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  className?: string;
}

const EquityTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as EquityPoint;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-2">{data.displayDate || data.date}</p>
        <p className="text-gray-100 font-semibold">
          Equity: {formatCurrency(data.equity)}
        </p>
        <p className={`text-sm ${data.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          P&L: {formatCurrency(data.pnl, true)} ({data.pnlPercentage >= 0 ? '+' : ''}{data.pnlPercentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const PnLTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as EquityPoint;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-2">{data.displayDate || data.date}</p>
        <p className={`font-semibold ${data.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          P&L: {formatCurrency(data.pnl, true)}
        </p>
        <p className="text-sm text-gray-400">
          {data.pnlPercentage >= 0 ? '+' : ''}{data.pnlPercentage}%
        </p>
      </div>
    );
  }
  return null;
};

export function EquityChart({ data, allData, dateRange, onDateRangeChange, className }: EquityChartProps) {
  const [chartType, setChartType] = useState<'equity' | 'pnl' | 'activity'>('equity');

  return (
    <Card className={cn("lg:col-span-2 shadow-sm border-0 bg-white dark:bg-card min-w-0 overflow-hidden", className)}>
      <CardHeader className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">
            {chartType === 'equity' ? 'Equity Curve' : 'Daily P&L'}
          </CardTitle>
          <div className="flex p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setChartType('equity')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${chartType === 'equity'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Equity</span>
            </button>
            <button
              onClick={() => setChartType('pnl')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${chartType === 'pnl'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>P&L</span>
            </button>
            <button
              onClick={() => setChartType('activity')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${chartType === 'activity'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                }`}
            >
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-1 sm:px-6 pb-6">
        {data.length === 0 ? (
          <div className="h-[300px] sm:h-[350px] lg:h-[400px] w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-muted rounded-xl bg-muted/20">
            <div className="p-3 bg-muted rounded-full">
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No data available</p>
              <p className="text-xs text-muted-foreground mt-1">Try selecting a different date range</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] sm:h-[350px] lg:h-[400px] w-full">
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
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'equity' ? (
                  <AreaChart
                    data={data}
                    margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
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
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<EquityTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
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
                  </AreaChart>
                ) : (
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
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
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<PnLTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                    <Bar dataKey="pnl" radius={[4, 4, 4, 4]} maxBarSize={50}>
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? "url(#profitGradient)" : "url(#lossGradient)"}
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
