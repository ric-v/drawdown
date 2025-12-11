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
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { TrendingUp, BarChart3, Calendar } from 'lucide-react';

interface EquityChartProps {
  data: EquityPoint[];
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
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

export function EquityChart({ data, dateRange, onDateRangeChange }: EquityChartProps) {
  const [chartType, setChartType] = useState<'equity' | 'pnl'>('equity');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value);
    onDateRangeChange({ ...dateRange, start: newStart });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value);
    onDateRangeChange({ ...dateRange, end: newEnd });
  };

  const presets = [
    { label: 'This Month', getValue: () => {
      const now = new Date();
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    }},
    { label: 'Last Month', getValue: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: lastMonth, end: lastDayOfLastMonth };
    }},
    { label: 'Last 7 Days', getValue: () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return { start: sevenDaysAgo, end: now };
    }},
    { label: 'Last 30 Days', getValue: () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { start: thirtyDaysAgo, end: now };
    }},
    { label: 'All Time', getValue: () => {
      return { start: new Date(2000, 0, 1), end: new Date() };
    }},
  ];

  return (
    <Card className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black border-gray-200 dark:border-gray-800 shadow-lg">
      <CardHeader className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            {chartType === 'equity' ? 'Equity Curve' : 'Daily P&L'}
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('equity')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 shadow-sm ${
                chartType === 'equity'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">Equity</span>
            </button>
            <button
              onClick={() => setChartType('pnl')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 shadow-sm ${
                chartType === 'pnl'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">P&L</span>
            </button>
          </div>
        </div>
        
        {/* Date Range Section */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200 shadow-sm w-fit"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">
              {formatDateForInput(dateRange.start)} to {formatDateForInput(dateRange.end)}
            </span>
          </button>
          
          {showDatePicker && (
            <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      onDateRangeChange(preset.getValue());
                      setShowDatePicker(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              {/* Custom Date Inputs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(dateRange.start)}
                    onChange={handleStartDateChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(dateRange.end)}
                    onChange={handleEndDateChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] sm:h-[350px] lg:h-[400px] w-full flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No data available for the selected date range</p>
              <p className="text-xs mt-2">Try selecting a different date range</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] sm:h-[350px] lg:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            {chartType === 'equity' ? (
              <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#374151" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={{ stroke: '#374151' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={{ stroke: '#374151' }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<EquityTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }} />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEquity)"
                />
              </AreaChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                  </linearGradient>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#374151" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={{ stroke: '#374151' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={{ stroke: '#374151' }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<PnLTooltip />} cursor={{ fill: 'rgba(55, 65, 81, 0.5)' }} />
                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'url(#colorProfit)' : 'url(#colorLoss)'} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
