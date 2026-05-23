'use client';

import { KPISummary } from '@/components/features/portfolio/kpi-summary';
import { TraderCockpit } from '@/components/features/portfolio/trader-cockpit';
import { EquityChart } from '@/components/features/portfolio/equity-chart';
import { AIInsightsSection } from '@/components/features/ai-insights/ai-insights-section';
import { redactSnapshot, type RawSnapshotInputs } from '@/lib/ai/redact';
import type { InsightType } from '@/lib/ai/types';
import { TraderTransactionTable } from '@/components/features/transactions/trader-transaction-table';
import { AddTransactionForm } from '@/components/features/transactions/add-transaction-form';
import { EditEquityForm } from '@/components/features/portfolio/edit-equity-form';
import { EditTransactionForm } from '@/components/features/transactions/edit-transaction-form';
import { FundHistory } from '@/components/features/funds/fund-history';
import { AppLayout } from '@/components/layout/app-layout';
import { DayAnalysisDrawer } from '@/components/features/portfolio/day-analysis-drawer';
import { DailyPnL, PortfolioStats, EquityPoint } from '@/types/trading';
import { RefreshCw, CalendarIcon, Plus, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useIsMobile } from "@/hooks/use-mobile"
import { DateRange } from "react-day-picker"
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns"

import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { LoginScreen } from "@/components/auth/login-screen"
import { LoadingLayer } from "@/components/layout/loading-layer"
import { useSettings } from '@/hooks/use-settings'
import { getCachedPortfolio, setCachedPortfolio, getSyncMetadata } from '@/lib/local-cache'
import { scheduleSync, getSyncStatus } from '@/lib/sync-queue'
import { SyncStatusIndicator } from '@/components/common/sync-status-indicator'
import { calculatePortfolioStats, generateEquityData } from '@/lib/utils/calculate-stats'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const { settings } = useSettings()

  const [dailyPnL, setDailyPnL] = useState<DailyPnL[]>([]);
  const [equityData, setEquityData] = useState<EquityPoint[]>([]);
  const [stats, setStats] = useState<PortfolioStats>({
    totalPnL: 0,
    totalPnLPercentage: 0,
    winRate: 0,
    totalDays: 0,
    profitDays: 0,
    lossDays: 0,
    averageProfit: 0,
    averageLoss: 0,
    largestProfit: 0,
    largestLoss: 0,
    currentEquity: 100000,
    initialCapital: 100000,
    profitFactor: 0,
    expectancy: 0,
    maxDrawdown: 0,
    currentStreak: 0,
  });
  const [globalStats, setGlobalStats] = useState<PortfolioStats>({
    totalPnL: 0,
    totalPnLPercentage: 0,
    winRate: 0,
    totalDays: 0,
    profitDays: 0,
    lossDays: 0,
    averageProfit: 0,
    averageLoss: 0,
    largestProfit: 0,
    largestLoss: 0,
    currentEquity: 100000,
    initialCapital: 100000,
    profitFactor: 0,
    expectancy: 0,
    maxDrawdown: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<DailyPnL | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // View mode toggles for trader cockpit
  const [pnlViewMode, setPnlViewMode] = useState<'raw' | 'clipped' | 'log'>('raw');
  const [equityViewMode, setEquityViewMode] = useState<'absolute' | 'r-multiple'>('absolute');
  const [showDrawdown, setShowDrawdown] = useState(true);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<DailyPnL | null>(null);
  const [isCalendarDrawerOpen, setIsCalendarDrawerOpen] = useState(false);

  // Optimistic update state
  const [optimisticError, setOptimisticError] = useState<string | null>(null);
  const [optimisticProgress, setOptimisticProgress] = useState(false);

  // Stop Loss Simulator state
  const [simulatorMonth, setSimulatorMonth] = useState('current');
  const [simulatorAmount, setSimulatorAmount] = useState(5000);

  // Stop Loss Simulator calculation
  const calculateSimulatedPnL = () => {
    if (stats.totalPnL === 0) return 0;
    
    const baseMultiplier = simulatorMonth === 'current' ? 0.6 : 0.7;
    const lossReductionFactor = Math.min(0.9, simulatorAmount / 15000);
    return Math.max(0, stats.totalPnL * baseMultiplier * lossReductionFactor);
  };

  const getMonthDisplayName = () => {
    const monthNames: Record<string, string> = {
      'current': 'Current Month',
      '2025-12': 'December 2025', 
      '2025-11': 'November 2025',
      '2025-10': 'October 2025',
      '2025-09': 'September 2025',
      '2025-08': 'August 2025'
    };
    return monthNames[simulatorMonth] || 'Current Month';
  };

  // Date range state
  const [date, setDate] = useState<DateRange | undefined>(undefined)

  // Filter data based on date range - NO LONGER NEEDED, server side filtering
  const filteredEquityData = equityData;
  const filteredDailyPnL = dailyPnL;

  const fetchData = async () => {
    if (!session?.user?.email) return;
    
    try {
      setLoading(true);
      
      // Try cache first for instant load
      const cached = await getCachedPortfolio(session.user.email);
      if (cached) {
        console.log('⚡ Loading from cache (instant)');
        setDailyPnL(cached.dailyPnL.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        })));
        setLoading(false);
        
        // Fetch fresh data from API in background and update cache
        fetchAndProcessData(false);
        return;
      }

      // No cache, fetch from cloud
      console.log('☁️  Loading from cloud (slow)');
      await fetchAndProcessData(false);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndProcessData = async (updateCacheOnly: boolean) => {
    try {
      let url = `/api/portfolio?consolidated=false`;

      if (date?.from) {
        url += `&from=${date.from.toISOString()}`;
      }
      if (date?.to) {
        url += `&to=${date.to.toISOString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Always update state with fresh data
        setDailyPnL(data.dailyPnL.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        })));
        setEquityData(data.equityData);
        setStats(data.stats);
        setGlobalStats(data.globalStats);
        setLastUpdated(data.lastUpdated);
        
        // Cache the response for next time
        if (session?.user?.email) {
          const portfolioData = {
            dailyPnL: data.dailyPnL,
            fundTransactions: data.fundTransactions || [],
            initialCapital: data.stats.initialCapital,
            lastUpdated: data.lastUpdated
          };
          await setCachedPortfolio(session.user.email, portfolioData);
        }
      }
    } catch (error) {
      console.error('Error processing portfolio data:', error);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [date, status]); // Re-fetch when date changes

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    if (!session?.user?.email) return;

    // Save original for rollback
    const originalDailyPnL = [...dailyPnL];

    try {
      // INSTANT UPDATE: Remove from local state immediately
      const updatedDailyPnL = dailyPnL.filter(t => t.id !== id);
      setDailyPnL(updatedDailyPnL);

      // INSTANT STATS: Calculate stats immediately
      const newStats = calculatePortfolioStats(updatedDailyPnL, stats.initialCapital);
      setStats(newStats);
      setGlobalStats(newStats);
      console.log('📊 Stats recalculated after delete');

      // INSTANT EQUITY: Generate equity curve immediately
      const newEquityData = generateEquityData(updatedDailyPnL, stats.initialCapital);
      setEquityData(newEquityData);
      console.log('📈 Equity curve updated after delete');

      // Update IndexedDB cache immediately
      const cached = await getCachedPortfolio(session.user.email);
      if (cached) {
        const updatedCache = {
          ...cached,
          dailyPnL: cached.dailyPnL.filter((t: any) => t.id !== id),
          lastUpdated: new Date().toISOString(),
        };
        await setCachedPortfolio(session.user.email, updatedCache);
        console.log('💾 Cache updated - entry deleted');
      }

      // Schedule background sync to cloud (silent, no refetch needed)
      scheduleSync(session.user.email);
      console.log('⏱️  Delete sync scheduled (silent background sync)');

    } catch (error) {
      console.error('Error deleting entry:', error);
      // ROLLBACK: Restore original data
      setDailyPnL(originalDailyPnL);
      setOptimisticError('Failed to delete entry');
      setTimeout(() => setOptimisticError(null), 5000);
    }
  };

  const handleEditEntry = (entry: DailyPnL) => {
    setEditingEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEntry(null);
  };

  const handleUpdateEntry = async (id: string, updatedEntry: Partial<DailyPnL>) => {
    if (!session?.user?.email) return;

    // Find the original transaction to preserve existing values
    const originalTransaction = dailyPnL.find(t => t.id === id);
    if (!originalTransaction) {
      console.error('Transaction not found');
      return;
    }

    const updatedTransaction = {
      ...originalTransaction,
      date: updatedEntry.date || originalTransaction.date,
      pnl: updatedEntry.pnl !== undefined ? updatedEntry.pnl : originalTransaction.pnl,
      notes: updatedEntry.notes !== undefined ? updatedEntry.notes : (originalTransaction.notes || ''),
    };

    // INSTANT UPDATE: Update local state immediately
    const updatedDailyPnL = dailyPnL.map(t => t.id === id ? updatedTransaction : t);
    setDailyPnL(updatedDailyPnL);

    // INSTANT STATS: Calculate stats immediately
    const newStats = calculatePortfolioStats(updatedDailyPnL, stats.initialCapital);
    setStats(newStats);
    setGlobalStats(newStats);
    console.log('📊 Stats recalculated after update');

    // INSTANT EQUITY: Generate equity curve immediately
    const newEquityData = generateEquityData(updatedDailyPnL, stats.initialCapital);
    setEquityData(newEquityData);
    console.log('📈 Equity curve updated after update');

    try {
      // Write to IndexedDB cache immediately (instant persistence)
      const cached = await getCachedPortfolio(session.user.email);
      if (cached) {
        const updatedCache = {
          ...cached,
          dailyPnL: cached.dailyPnL.map((t: any) => 
            t.id === id ? updatedTransaction : t
          ),
          lastUpdated: new Date().toISOString(),
        };
        await setCachedPortfolio(session.user.email, updatedCache);
        console.log('💾 Cache updated instantly');
      }

      // Schedule background sync to cloud (no await - non-blocking)
      scheduleSync(session.user.email);
      console.log('⏱️  Cloud sync scheduled');

    } catch (error) {
      console.error('Error updating cache:', error);
      // ROLLBACK: Revert to original on cache error
      setDailyPnL(prev => prev.map(t => t.id === id ? originalTransaction : t));
      setOptimisticError('Error saving changes - please try again');
      setTimeout(() => setOptimisticError(null), 5000);
    }
  };

  const handleAddEntry = async (entry: Partial<DailyPnL>) => {
    if (!session?.user?.email) return;

    // Create new transaction with ID (declare before try block for rollback access)
    const newTransaction: DailyPnL = {
      id: crypto.randomUUID(),
      date: entry.date || new Date(),
      pnl: entry.pnl || 0,
      notes: entry.notes,
    };

    try {
      // Show progress indicator for large datasets (>5000 entries)
      if (dailyPnL.length > 5000) setOptimisticProgress(true);

      // INSTANT UPDATE: Add to local state immediately
      const updatedDailyPnL = [...dailyPnL, newTransaction].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setDailyPnL(updatedDailyPnL);
      console.log('⚡ Transaction added to state (instant)');

      // INSTANT STATS: Calculate stats immediately
      const newStats = calculatePortfolioStats(updatedDailyPnL, stats.initialCapital);
      setStats(newStats);
      setGlobalStats(newStats);
      console.log('📊 Stats calculated instantly');

      // INSTANT EQUITY: Generate equity curve immediately
      const newEquityData = generateEquityData(updatedDailyPnL, stats.initialCapital);
      setEquityData(newEquityData);
      console.log('📈 Equity curve updated instantly');

      // Write to IndexedDB cache immediately (5-50ms)
      const cached = await getCachedPortfolio(session.user.email);
      if (cached) {
        const updatedCache = {
          ...cached,
          dailyPnL: [...cached.dailyPnL, newTransaction],
          lastUpdated: new Date().toISOString(),
        };
        await setCachedPortfolio(session.user.email, updatedCache);
        console.log('💾 Cache updated (<50ms)');
      }

      // Schedule background sync to cloud (silent, no refetch needed)
      scheduleSync(session.user.email);
      console.log('⏱️  Cloud sync scheduled (silent background sync)');

    } catch (error) {
      console.error('Error adding transaction:', error);
      // ROLLBACK: Remove from state on error
      setDailyPnL(prev => prev.filter(t => t.id !== newTransaction.id));
      setOptimisticError('Error adding transaction - please try again');
      setTimeout(() => setOptimisticError(null), 5000);
    } finally {
      setOptimisticProgress(false);
    }
  };

  const handleCalendarDayClick = (dayData: DailyPnL | null, date: Date) => {
    setSelectedCalendarDay(dayData);
    setIsCalendarDrawerOpen(true);
  };

  const handleCloseCalendarDrawer = () => {
    setIsCalendarDrawerOpen(false);
    setSelectedCalendarDay(null);
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen"><RefreshCw className="animate-spin h-8 w-8" /></div>
  }

  if (status === "unauthenticated") {
    return <LoginScreen />
  }

  return (
    <>
      <LoadingLayer isLoading={loading} message="Syncing your portfolio data from cloud..." />
      <SyncStatusIndicator />
      <AppLayout 
        stats={globalStats}
        equityEditButton={
          <EditEquityForm
            currentEquity={stats.initialCapital}
            onEquityUpdated={fetchData}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                title="Edit Initial Capital"
                className="h-6 w-6 rounded-lg hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-all duration-200"
              >
                <Edit2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              </Button>
            }
          />
        }
        addPnlButton={
          <AddTransactionForm
            onAdd={handleAddEntry}
            trigger={
              <Button className="h-9 w-9 md:w-auto md:px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 active:scale-95">
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline font-medium text-sm ml-2">Add P&L</span>
              </Button>
            }
          />
        }
        refreshButton={
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            title="Refresh Data"
            className="h-9 w-9 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        }
      >
      <div className="flex flex-col space-y-5 p-4 md:p-6">
        {/* Non-blocking optimistic update error indicator */}
        {optimisticError && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/90 text-destructive-foreground text-sm shadow-lg animate-in slide-in-from-bottom-2 duration-200">
            <span>{optimisticError}</span>
            <button onClick={() => setOptimisticError(null)} className="ml-2 text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Progress indicator for large datasets */}
        {optimisticProgress && (
          <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-card border border-border text-sm shadow-lg">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
        {/* Header Section with Actions */}
        <div className="flex flex-col space-y-3 md:flex-row md:items-start md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-1">
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">Dashboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your daily trading performance and portfolio growth.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full md:w-[260px] h-11 justify-start text-left font-medium rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all duration-300",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align={isMobile ? "center" : "end"}>
                  <div className="flex flex-col md:flex-row">
                    <div className="grid grid-cols-3 gap-1 p-2 md:flex md:flex-col md:gap-2 md:p-3 border-b md:border-b-0 md:border-r">
                      <PresetButton
                        label="Today"
                        onClick={() => setDate({ from: new Date(), to: new Date() })}
                        isSelected={false}
                      />
                      <PresetButton
                        label="Yesterday"
                        onClick={() => {
                          const yesterday = subDays(new Date(), 1);
                          setDate({ from: yesterday, to: yesterday });
                        }}
                        isSelected={false}
                      />
                      <PresetButton
                        label="This Week"
                        onClick={() => setDate({
                          from: startOfWeek(new Date(), { weekStartsOn: 1 }),
                          to: new Date()
                        })}
                        isSelected={false}
                      />
                      <PresetButton
                        label="Last Week"
                        onClick={() => {
                          const lastWeek = subWeeks(new Date(), 1);
                          setDate({
                            from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
                            to: endOfWeek(lastWeek, { weekStartsOn: 1 })
                          });
                        }}
                        isSelected={false}
                      />
                      <PresetButton
                        label="This Month"
                        onClick={() => setDate({
                          from: startOfMonth(new Date()),
                          to: new Date()
                        })}
                        isSelected={false}
                      />
                      <PresetButton
                        label="Last Month"
                        onClick={() => {
                          const lastMonth = subMonths(new Date(), 1);
                          setDate({
                            from: startOfMonth(lastMonth),
                            to: endOfMonth(lastMonth)
                          });
                        }}
                        isSelected={false}
                      />
                      <PresetButton
                        label="All Time"
                        onClick={() => setDate(undefined)}
                        isSelected={!date}
                      />
                    </div>
                    <div className="p-3">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={isMobile ? 1 : 2}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

          </div>
        </div>

        {/* Main Dashboard Grid - Two Column Layout */}
        <div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {/* Left Column - Metrics & Chart */}
          <div className="space-y-5 lg:col-span-2 xl:col-span-3">
            {/* KPI Summary */}
            <KPISummary stats={stats} />

            {/* Chart */}
            <EquityChart
              className="w-full h-fit"
              data={filteredEquityData}
              allData={dailyPnL}
              dateRange={date && date.from && date.to ? { start: date.from, end: date.to } : { start: new Date(0), end: new Date() }}
              onDateRangeChange={() => { }}
              onCalendarDayClick={handleCalendarDayClick}
            />

            {/* Trading Journal */}
            <TraderTransactionTable
              transactions={filteredDailyPnL}
              onDelete={handleDeleteEntry}
              onEdit={handleEditEntry}
              onUpdate={handleUpdateEntry}
            />
          </div>

          {/* Right Column - Trader Cockpit Sidebar */}
          <div className="space-y-5 lg:col-span-1 xl:col-span-1">
            {/* AI Insights Section */}
            <AIInsightsSection
              buildSnapshot={(insightType: InsightType) => {
                const drawdownSeries = equityData.map((p) => {
                  const peak = Math.max(...equityData.slice(0, equityData.indexOf(p) + 1).map((e) => e.equity));
                  return peak > 0 ? ((p.equity - peak) / peak) * 100 : 0;
                });
                return redactSnapshot({
                  insightType,
                  dateRange: { from: date?.from ?? new Date(0), to: date?.to ?? new Date() },
                  dailyPnL: filteredDailyPnL,
                  stats,
                  drawdownSeries,
                  currency: settings?.currency ?? 'INR',
                  notes: filteredDailyPnL.filter((e) => e.notes).map((e) => e.notes!),
                });
              }}
            />

            {/* Trader Cockpit - Tabbed Risk/Edge/Behavior */}
            <TraderCockpit stats={stats} />

            {/* Fund History */}
            <FundHistory onFundUpdate={fetchData} dateRange={date} />
            
            {/* Stop Loss Simulator */}
            <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  🧮 Stop Loss Simulator
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Select Month:</span>
                    <select 
                      value={simulatorMonth}
                      className="text-xs border rounded px-2 py-1 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
                      onChange={(e) => setSimulatorMonth(e.target.value)}
                    >
                      <option value="current">Current Month</option>
                      <option value="2025-12">December 2025</option>
                      <option value="2025-11">November 2025</option>
                      <option value="2025-10">October 2025</option>
                      <option value="2025-09">September 2025</option>
                      <option value="2025-08">August 2025</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Daily Stop Loss:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">₹</span>
                      <input
                        type="number"
                        placeholder="5000"
                        value={simulatorAmount}
                        min="1000"
                        max="100000"
                        step="1000"
                        className="text-xs border rounded px-2 py-1 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 flex-1"
                        onChange={(e) => setSimulatorAmount(parseInt(e.target.value) || 5000)}
                      />
                    </div>
                  </div>
                  
                  <div className="p-2.5 bg-purple-50/50 dark:bg-purple-500/5 rounded-lg border border-purple-200/30">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {getMonthDisplayName()} P&L would be:
                    </div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      +₹{calculateSimulatedPnL().toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      With ₹{simulatorAmount.toLocaleString()} daily stop loss
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {editingEntry && (
          <EditTransactionForm
            key={editingEntry.id} // Force remount when entry changes
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            onUpdate={handleUpdateEntry}
            entry={editingEntry}
          />
        )}

        {/* Day Analysis Drawer */}
        <DayAnalysisDrawer
          isOpen={isCalendarDrawerOpen}
          onClose={handleCloseCalendarDrawer}
          dayData={selectedCalendarDay}
          selectedDate={selectedCalendarDay?.date ? new Date(selectedCalendarDay.date) : null}
        />
      </div>
    </AppLayout>
    </>
  );
}

function PresetButton({ label, onClick, isSelected }: { label: string, onClick: () => void, isSelected: boolean }) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "justify-center md:justify-start font-normal h-auto py-1.5 px-2 text-xs md:text-sm",
        isSelected && "bg-accent text-accent-foreground"
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
