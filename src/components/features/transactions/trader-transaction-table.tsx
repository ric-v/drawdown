'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyPnL } from '@/types/trading';
import { cn, getColorClass } from '@/lib/utils/utils';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Edit2, Trash2, Layers, Calendar, Brain, Zap, Coffee } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { CustomTabs, TabItem } from '@/components/ui/custom-tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FormattedCurrency, FormattedDate } from '@/components/common/formatted-values';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface TraderTransactionTableProps {
  transactions: DailyPnL[];
  onDelete?: (id: string) => void;
  onEdit?: (entry: DailyPnL) => void;
  onUpdate?: (id: string, updatedEntry: Partial<DailyPnL>) => Promise<void>;
}

type SortField = 'date' | 'pnl';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'daily' | 'weekly' | 'monthly' | 'compressed';

export function TraderTransactionTable({ transactions, onDelete, onEdit, onUpdate }: TraderTransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('trading-journal-view', 'weekly');
  const [loadingTags, setLoadingTags] = useState<Set<string>>(new Set()); // Track loading tags by "transactionId-tag"
  
  // Tag toggle function for direct updates
  const toggleTag = async (transaction: DailyPnL, tag: string) => {
    if (!onUpdate) return;
    
    const loadingKey = `${transaction.id}-${tag}`;
    setLoadingTags(prev => new Set(prev).add(loadingKey));
    
    try {
      const currentNotes = transaction.notes || '';
      const tagLower = tag.toLowerCase();
      let newNotes;
      
      if (currentNotes.toLowerCase().includes(tagLower)) {
        // Remove the tag
        newNotes = currentNotes.replace(new RegExp(`\\b${tagLower}\\b`, 'gi'), '').replace(/\s+/g, ' ').trim();
      } else {
        // Add the tag
        newNotes = currentNotes ? `${currentNotes} ${tagLower}` : tagLower;
      }
      
      await onUpdate(transaction.id, { notes: newNotes });
    } catch (error) {
      console.error('Failed to update transaction:', error);
    } finally {
      setLoadingTags(prev => {
        const newSet = new Set(prev);
        newSet.delete(loadingKey);
        return newSet;
      });
    }
  };

  // Tab configuration for view modes
  const tabItems: TabItem[] = [
    { id: 'compressed', label: 'Smart', icon: Brain },
    { id: 'weekly', label: 'Weekly', icon: Calendar },
    { id: 'monthly', label: 'Monthly', icon: TrendingUp },
    { id: 'daily', label: 'Daily', icon: Layers }
  ];
  
  // Weekly grouping for trader view
  const weeklyGroups = useMemo(() => {
    const groups = new Map<string, {
      weekStart: Date;
      weekEnd: Date;
      trades: DailyPnL[];
      totalPnL: number;
      winDays: number;
      lossDays: number;
      winRate: number;
      bestDay: number;
      worstDay: number;
      damageEfficiency: number;
      sparklineData: number[];
    }>();
    
    transactions.forEach(trade => {
      const tradeDate = new Date(trade.date);
      const weekStart = startOfWeek(tradeDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!groups.has(weekKey)) {
        const weekEnd = endOfWeek(tradeDate, { weekStartsOn: 1 });
        groups.set(weekKey, {
          weekStart,
          weekEnd,
          trades: [],
          totalPnL: 0,
          winDays: 0,
          lossDays: 0,
          winRate: 0,
          bestDay: 0,
          worstDay: 0,
          damageEfficiency: 0,
          sparklineData: []
        });
      }
      
      const week = groups.get(weekKey)!;
      week.trades.push(trade);
      week.totalPnL += trade.pnl;
      week.sparklineData.push(trade.pnl);
      if (trade.pnl > 0) week.winDays++;
      if (trade.pnl < 0) week.lossDays++;
      if (trade.pnl > week.bestDay) week.bestDay = trade.pnl;
      if (trade.pnl < week.worstDay) week.worstDay = trade.pnl;
      week.winRate = week.winDays > 0 ? (week.winDays / (week.winDays + week.lossDays)) * 100 : 0;
    });

    // Calculate damage efficiency for each week
    groups.forEach((week) => {
      week.damageEfficiency = Math.abs(week.worstDay) > 0 ? week.totalPnL / Math.abs(week.worstDay) : week.totalPnL > 0 ? 999 : 0;
    });
    
    return Array.from(groups.values()).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }, [transactions]);

  // Monthly grouping for summary view
  const monthlyGroups = useMemo(() => {
    const groups = new Map<string, {
      monthStart: Date;
      monthEnd: Date;
      trades: DailyPnL[];
      totalPnL: number;
      winDays: number;
      lossDays: number;
      winRate: number;
      bestDay: number;
      worstDay: number;
      averageDaily: number;
      tradingDays: number;
      profitableDays: number;
      maxDrawdown: number;
      sharpeRatio: number;
    }>();
    
    transactions.forEach(trade => {
      const tradeDate = new Date(trade.date);
      const monthStart = startOfMonth(tradeDate);
      const monthKey = format(monthStart, 'yyyy-MM');
      
      if (!groups.has(monthKey)) {
        const monthEnd = endOfMonth(tradeDate);
        groups.set(monthKey, {
          monthStart,
          monthEnd,
          trades: [],
          totalPnL: 0,
          winDays: 0,
          lossDays: 0,
          winRate: 0,
          bestDay: 0,
          worstDay: 0,
          averageDaily: 0,
          tradingDays: 0,
          profitableDays: 0,
          maxDrawdown: 0,
          sharpeRatio: 0
        });
      }
      
      const month = groups.get(monthKey)!;
      month.trades.push(trade);
      month.totalPnL += trade.pnl;
      month.tradingDays++;
      if (trade.pnl > 0) {
        month.winDays++;
        month.profitableDays++;
      }
      if (trade.pnl < 0) month.lossDays++;
      if (trade.pnl > month.bestDay) month.bestDay = trade.pnl;
      if (trade.pnl < month.worstDay) month.worstDay = trade.pnl;
      
      // Calculate metrics
      month.winRate = month.winDays > 0 ? (month.winDays / (month.winDays + month.lossDays)) * 100 : 0;
      month.averageDaily = month.tradingDays > 0 ? month.totalPnL / month.tradingDays : 0;
      
      // Calculate drawdown (simplified)
      let runningTotal = 0;
      let peak = 0;
      let maxDD = 0;
      month.trades.forEach(t => {
        runningTotal += t.pnl;
        if (runningTotal > peak) peak = runningTotal;
        const dd = peak - runningTotal;
        if (dd > maxDD) maxDD = dd;
      });
      month.maxDrawdown = maxDD;
      
      // Calculate Sharpe ratio (simplified - assuming risk-free rate = 0)
      const dailyReturns = month.trades.map(t => t.pnl);
      const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / dailyReturns.length;
      const stdDev = Math.sqrt(variance);
      month.sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
    });
    
    return Array.from(groups.values()).sort((a, b) => b.monthStart.getTime() - a.monthStart.getTime());
  }, [transactions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'pnl') {
        comparison = a.pnl - b.pnl;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sortField, sortOrder]);

  const currentData = viewMode === 'weekly' ? weeklyGroups : viewMode === 'monthly' ? monthlyGroups : sortedTransactions;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = currentData.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />;
    return sortOrder === 'asc' ?
      <ArrowUp className="ml-2 h-3.5 w-3.5" /> :
      <ArrowDown className="ml-2 h-3.5 w-3.5" />;
  };

  const getMistakeIcons = (notes: string) => {
    const mistakes = [];
    if (notes?.toLowerCase().includes('overtrade')) mistakes.push({ icon: Brain, label: 'overtrade' });
    if (notes?.toLowerCase().includes('revenge')) mistakes.push({ icon: Zap, label: 'revenge' });
    if (notes?.toLowerCase().includes('focus')) mistakes.push({ icon: Coffee, label: 'low focus' });
    return mistakes;
  };

  const SimpleSparkline = ({ data }: { data: number[] }) => {
    if (data.length <= 1) return <div className="w-8 h-4" />;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return (
      <svg className="w-8 h-4" viewBox={`0 0 ${data.length * 2} 16`}>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          points={data.map((value, index) => 
            `${index * 2},${16 - ((value - min) / range * 12) - 2}`
          ).join(' ')}
        />
      </svg>
    );
  };

  return (
    <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="p-4 md:p-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <span>📊</span>
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                Trading Journal
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {transactions.length} trading days • Pattern recognition over scrolling
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <CustomTabs
            items={tabItems}
            value={viewMode}
            onValueChange={(value) => {
              setViewMode(value as ViewMode);
              setCurrentPage(1);
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 pt-0">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-4">
              <Layers className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No trading data yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Start adding your daily P&L to track performance</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200/60 dark:border-slate-800/60">
                    {viewMode === 'weekly' ? (
                      <>
                        <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Week</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">P&L</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Win%</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Damage Efficiency</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Best/Worst</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Trend</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead 
                          className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center">
                            Date
                            <SortIcon field="date" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                          onClick={() => handleSort('pnl')}
                        >
                          <div className="flex items-center">
                            P&L
                            <SortIcon field="pnl" />
                          </div>
                        </TableHead>
                        {viewMode === 'compressed' && (
                          <>
                            <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Impact</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Behavior</TableHead>
                          </>
                        )}
                        {viewMode === 'daily' && (
                          <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Notes</TableHead>
                        )}
                        <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-12"></TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewMode === 'weekly' ? (
                    // Weekly View
                    weeklyGroups.slice(startIndex, endIndex).map((week, index) => (
                      <TableRow key={index} className="border-gray-100 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {format(week.weekStart, 'MMM d')} - {format(week.weekEnd, 'MMM d')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {week.trades.length} days • {week.winDays}W-{week.lossDays}L
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn("font-bold", getColorClass(week.totalPnL))}>
                            {week.totalPnL >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(week.totalPnL)} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={week.winRate >= 50 ? 'default' : 'destructive'} className="text-xs">
                            {week.winRate.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={cn("font-bold text-sm", 
                            week.damageEfficiency >= 2 ? 'text-emerald-600 dark:text-emerald-400' :
                            week.damageEfficiency >= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                          )}>
                            {week.damageEfficiency === 999 ? '∞' : week.damageEfficiency.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div className="text-emerald-600 dark:text-emerald-400">
                              +<FormattedCurrency value={week.bestDay} short />
                            </div>
                            <div className="text-red-600 dark:text-red-400">
                              <FormattedCurrency value={week.worstDay} short />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn("flex items-center", week.totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                            <SimpleSparkline data={week.sparklineData} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : viewMode === 'monthly' ? (
                    // Monthly View
                    monthlyGroups.slice(startIndex, endIndex).map((month, index) => (
                      <TableRow key={index} className="border-gray-100 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {format(month.monthStart, 'MMMM yyyy')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {month.tradingDays} days • {month.winDays}W-{month.lossDays}L • Avg: <FormattedCurrency value={month.averageDaily} short />
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={cn("font-bold text-sm", getColorClass(month.totalPnL))}>
                              {month.totalPnL >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(month.totalPnL)} />
                            </div>
                            <p className="text-xs text-gray-500">
                              Max DD: <FormattedCurrency value={month.maxDrawdown} short />
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={month.winRate >= 50 ? 'default' : 'destructive'} className="text-xs">
                              {month.winRate.toFixed(0)}%
                            </Badge>
                            <p className="text-xs text-gray-500">
                              Sharpe: {month.sharpeRatio.toFixed(2)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div className="text-emerald-600 dark:text-emerald-400">
                              Best: +<FormattedCurrency value={month.bestDay} short />
                            </div>
                            <div className="text-red-600 dark:text-red-400">
                              Worst: <FormattedCurrency value={month.worstDay} short />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div>📊 {month.profitableDays}/{month.tradingDays}</div>
                            <div className="text-gray-500">
                              {((month.profitableDays / month.tradingDays) * 100).toFixed(0)}% Hit
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // Daily Views (both compressed and detailed)
                    (sortedTransactions.slice(startIndex, endIndex) as DailyPnL[]).map((transaction) => (
                      <TableRow key={transaction.id} className="border-gray-100 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                        <TableCell>
                          <FormattedDate date={transaction.date} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-bold", getColorClass(transaction.pnl))}>
                              {transaction.pnl >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(transaction.pnl)} />
                            </span>
                            {transaction.pnl >= 0 ? 
                              <TrendingUp className="h-3 w-3 text-emerald-500" /> : 
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            }
                          </div>
                        </TableCell>
                        
                        {viewMode === 'compressed' && (
                          <>
                            <TableCell>
                              <Badge 
                                variant={Math.abs(transaction.pnl) > 5000 ? 'destructive' : Math.abs(transaction.pnl) > 2000 ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {Math.abs(transaction.pnl) > 5000 ? '🔥 High' : 
                                 Math.abs(transaction.pnl) > 2000 ? '⚡ Med' : '📍 Low'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {getMistakeIcons(transaction.notes || '').map((mistake, idx) => {
                                  const Icon = mistake.icon;
                                  return (
                                    <div key={idx} title={mistake.label}>
                                      <Icon 
                                        className="h-3 w-3 text-amber-500" 
                                      />
                                    </div>
                                  );
                                })}
                                {transaction.notes?.trim() && !getMistakeIcons(transaction.notes).length && (
                                  <div className="text-xs text-blue-500">📝</div>
                                )}
                              </div>
                            </TableCell>
                          </>
                        )}
                        
                        {viewMode === 'daily' && (
                          <TableCell className="max-w-xs">
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {['Revenge', 'Oversize', 'Late entry', 'Rule-followed'].map((tag) => {
                                  const loadingKey = `${transaction.id}-${tag}`;
                                  const isLoading = loadingTags.has(loadingKey);
                                  
                                  return (
                                    <button
                                      key={tag}
                                      onClick={() => toggleTag(transaction, tag)}
                                      disabled={!onUpdate || isLoading}
                                      className={cn(
                                        "px-2 py-1 text-xs rounded-md border transition-colors flex items-center gap-1",
                                        onUpdate && !isLoading ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-50",
                                        transaction.notes?.toLowerCase().includes(tag.toLowerCase()) 
                                          ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300"
                                          : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                      )}
                                      title={isLoading ? 'Updating...' : `Click to ${transaction.notes?.toLowerCase().includes(tag.toLowerCase()) ? 'remove' : 'add'} "${tag}" tag`}
                                    >
                                      {isLoading ? (
                                        <>
                                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                                          <span className="opacity-70">...</span>
                                        </>
                                      ) : (
                                        tag
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              {transaction.notes?.trim() && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {transaction.notes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                        )}
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                                <Edit2 className="mr-2 h-3 w-3" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDelete?.(transaction.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {viewMode === 'weekly' ? (
                // Weekly Mobile Cards
                weeklyGroups.slice(startIndex, endIndex).map((week, index) => (
                  <div key={index} className="bg-white dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-700/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm">
                          {format(week.weekStart, 'MMM d')} - {format(week.weekEnd, 'MMM d')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {week.trades.length} days • {week.winDays}W-{week.lossDays}L
                        </div>
                      </div>
                      <div className={cn("text-right")}>
                        <div className={cn("font-bold text-base", getColorClass(week.totalPnL))}>
                          {week.totalPnL >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(week.totalPnL)} />
                        </div>
                        <Badge variant={week.winRate >= 50 ? 'default' : 'destructive'} className="text-xs mt-1">
                          {week.winRate.toFixed(0)}% Win
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Damage Efficiency</div>
                        <div className={cn("font-bold text-sm", 
                          week.damageEfficiency >= 2 ? 'text-emerald-600 dark:text-emerald-400' :
                          week.damageEfficiency >= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                        )}>
                          {week.damageEfficiency === 999 ? '∞' : week.damageEfficiency.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Best/Worst</div>
                        <div className="space-y-0.5 text-xs">
                          <div className="text-emerald-600 dark:text-emerald-400">
                            +<FormattedCurrency value={week.bestDay} short />
                          </div>
                          <div className="text-red-600 dark:text-red-400">
                            <FormattedCurrency value={week.worstDay} short />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : viewMode === 'monthly' ? (
                // Monthly Mobile Cards
                monthlyGroups.slice(startIndex, endIndex).map((month, index) => (
                  <div key={index} className="bg-white dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-700/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm">
                          {format(month.monthStart, 'MMMM yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {month.tradingDays} days • {month.winDays}W-{month.lossDays}L
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn("font-bold text-base", getColorClass(month.totalPnL))}>
                          {month.totalPnL >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(month.totalPnL)} />
                        </div>
                        <Badge variant={month.winRate >= 50 ? 'default' : 'destructive'} className="text-xs mt-1">
                          {month.winRate.toFixed(0)}% Win
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Win Rate</div>
                        <Badge variant={month.winRate >= 50 ? 'default' : 'destructive'} className="text-xs">
                          {month.winRate.toFixed(0)}%
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Avg Daily</div>
                        <div className="text-sm font-medium">
                          <FormattedCurrency value={month.averageDaily} short />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Daily/Compressed Mobile Cards
                sortedTransactions.slice(startIndex, endIndex).map((transaction) => (
                  <div key={transaction.id} className="bg-white dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-700/60 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs text-gray-500">
                          <FormattedDate date={transaction.date} />
                        </div>
                        <div className={cn("text-lg font-bold mt-1", getColorClass(transaction.pnl))}>
                          {transaction.pnl >= 0 ? (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              +<FormattedCurrency value={transaction.pnl} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-4 w-4" />
                              <FormattedCurrency value={transaction.pnl} />
                            </div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                            <Edit2 className="mr-2 h-3 w-3" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete?.(transaction.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {viewMode === 'compressed' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={Math.abs(transaction.pnl) > 5000 ? 'destructive' : Math.abs(transaction.pnl) > 2000 ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {Math.abs(transaction.pnl) > 5000 ? '🔥 High Impact' : 
                           Math.abs(transaction.pnl) > 2000 ? '⚡ Med Impact' : '📍 Low Impact'}
                        </Badge>
                        <div className="flex gap-1">
                          {getMistakeIcons(transaction.notes || '').map((mistake, idx) => {
                            const Icon = mistake.icon;
                            return (
                              <div key={idx} title={mistake.label} className="p-1 bg-amber-100 dark:bg-amber-900/20 rounded">
                                <Icon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {viewMode === 'daily' && (
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        <div className="flex flex-wrap gap-1.5">
                          {['Revenge', 'Oversize', 'Late entry', 'Rule-followed'].map((tag) => {
                            const loadingKey = `${transaction.id}-${tag}`;
                            const isLoading = loadingTags.has(loadingKey);
                            
                            return (
                              <button
                                key={tag}
                                onClick={() => toggleTag(transaction, tag)}
                                disabled={!onUpdate || isLoading}
                                className={cn(
                                  "px-2 py-1 text-xs rounded-md border transition-all flex items-center gap-1",
                                  onUpdate && !isLoading ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-50",
                                  transaction.notes?.toLowerCase().includes(tag.toLowerCase()) 
                                    ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-slate-600"
                                )}
                              >
                                {isLoading ? (
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  tag
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {transaction.notes?.trim() && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {transaction.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200/60 dark:border-slate-800/60 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, currentData.length)} of {currentData.length} {viewMode === 'weekly' ? 'weeks' : 'entries'}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNumber)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}