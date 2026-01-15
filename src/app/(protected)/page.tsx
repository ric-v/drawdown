'use client';

import { KPICard } from '@/components/features/portfolio/kpi-card';
import { EquityChart } from '@/components/features/portfolio/equity-chart';
import { TraderTransactionTable } from '@/components/features/transactions/trader-transaction-table';
import { AddTransactionForm } from '@/components/features/transactions/add-transaction-form';
import { EditEquityForm } from '@/components/features/portfolio/edit-equity-form';
import { EditTransactionForm } from '@/components/features/transactions/edit-transaction-form';
import { AddFundsForm } from '@/components/features/funds/add-funds-form';
import { FundHistory } from '@/components/features/funds/fund-history';
import { AppLayout } from '@/components/layout/app-layout';
import { DayAnalysisDrawer } from '@/components/features/portfolio/day-analysis-drawer';
import { DailyPnL, PortfolioStats, EquityPoint } from '@/types/trading';
import { DollarSign, Activity, Target, RefreshCw, CalendarIcon, MoreHorizontal, IndianRupeeIcon, Plus, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useIsMobile } from "@/hooks/use-mobile"
import { DateRange } from "react-day-picker"
import {
  addDays,
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  startOfYear,
  endOfYear,
  subYears
} from "date-fns"

import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { LoginScreen } from "@/components/auth/login-screen"
import { LoadingLayer } from "@/components/layout/loading-layer"
import { FormattedCurrency, FormattedPercentage } from '@/components/common/formatted-values'
import { useSettings } from '@/hooks/use-settings'
import { formatPercentage } from '@/lib/utils/format-settings'
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

  // Stop Loss Simulator state
  const [simulatorMonth, setSimulatorMonth] = useState('current');
  const [simulatorAmount, setSimulatorAmount] = useState(5000);

  // System Health calculation
  const getSystemHealth = (stats: PortfolioStats) => {
    const profitFactorScore = stats.profitFactor >= 1.5 ? 2 : stats.profitFactor >= 1.0 ? 1 : 0;
    const winRateScore = stats.winRate >= 50 ? 2 : stats.winRate >= 40 ? 1 : 0;
    const drawdownScore = stats.maxDrawdown <= 10 ? 2 : stats.maxDrawdown <= 20 ? 1 : 0;
    
    const totalScore = profitFactorScore + winRateScore + drawdownScore;
    
    if (totalScore >= 5) return { status: 'Healthy', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
    if (totalScore >= 3) return { status: 'Fragile', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' };
    return { status: 'Broken', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' };
  };

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

  const systemHealth = getSystemHealth(stats);
  const maxAllowedDD = 30; // Max allowed drawdown percentage

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
      alert('Failed to delete entry');
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
      alert('Error saving changes - please try again');
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
      alert('Error adding transaction - please try again');
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
            {/* Hero Metrics - Trader Decision Row */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl hover:shadow-xl transition-all duration-300 ease-out rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total P&L</p>
                      <div className={cn(
                        "text-2xl md:text-3xl font-bold mb-0.5",
                        stats.totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      )}>
                        {stats.totalPnL >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(stats.totalPnL)} short />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <FormattedPercentage value={stats.totalPnLPercentage} /> • since last reset
                      </p>
                    </div>
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      stats.totalPnL >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'
                    )}>
                      {stats.totalPnL >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl hover:shadow-xl transition-all duration-300 ease-out rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">System Health</p>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn("text-sm font-bold", systemHealth.color, systemHealth.bg)}>
                          {systemHealth.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {systemHealth.status === 'Healthy' ? '✓ all systems green' : 
                         systemHealth.status === 'Fragile' ? '⚠ needs attention' : '⚠ critical issues'}
                      </p>
                    </div>
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      systemHealth.bg
                    )}>
                      <Activity className={cn("h-5 w-5", systemHealth.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl hover:shadow-xl transition-all duration-300 ease-out rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Max Drawdown</p>
                      <div className="text-2xl md:text-3xl font-bold mb-0.5 text-rose-600 dark:text-rose-400">
                        <FormattedPercentage value={stats.maxDrawdown} decimals={1} />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        vs {maxAllowedDD}% allowed • {stats.maxDrawdown <= maxAllowedDD ? '✓ safe' : '⚠ over limit'}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <EquityChart
              className="w-full h-fit"
              data={filteredEquityData}
              allData={dailyPnL}
              dateRange={date && date.from && date.to ? { start: date.from, end: date.to } : { start: new Date(0), end: new Date() }}
              onDateRangeChange={() => { }}
              showDrawdown={showDrawdown}
              pnlViewMode={pnlViewMode}
              equityViewMode={equityViewMode}
              onShowDrawdownChange={setShowDrawdown}
              onPnlViewModeChange={setPnlViewMode}
              onEquityViewModeChange={setEquityViewMode}
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
            {/* 1. RISK - Most critical for trader survival */}
            <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  ⚠️ Risk Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-rose-50/50 dark:bg-rose-500/5 rounded-lg border border-rose-200/30">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Max Drawdown</span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      <FormattedPercentage value={stats.maxDrawdown} decimals={1} />
                    </span>
                  </div>
                  
                  {/* Progress bar for current DD vs allowed DD */}
                  <div className="p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Current DD / Allowed DD</span>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        {stats.maxDrawdown.toFixed(1)}% / {maxAllowedDD}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          stats.maxDrawdown <= maxAllowedDD * 0.7 ? "bg-emerald-500" :
                          stats.maxDrawdown <= maxAllowedDD ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${Math.min(100, (stats.maxDrawdown / maxAllowedDD) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Risk of Ruin</span>
                    <span className={cn("text-sm font-bold", 
                      stats.maxDrawdown > 25 ? 'text-rose-600 dark:text-rose-400' : 
                      stats.maxDrawdown > 15 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      {stats.maxDrawdown > 25 ? 'HIGH' : stats.maxDrawdown > 15 ? 'MED' : 'LOW'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. EDGE - Is the system actually profitable? */}
            <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  📈 Edge
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-2.5">
                  <div className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border",
                    stats.profitFactor < 1 ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-200/30' : 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200/30'
                  )}>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Profit Factor</span>
                    <span className={cn("text-sm font-bold", 
                      stats.profitFactor < 1 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      {stats.profitFactor ? (settings ? formatPercentage(stats.profitFactor, settings, { asDecimal: true, decimals: 2 }) : stats.profitFactor.toFixed(2)) : '∞'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Expectancy</span>
                    <span className={cn("text-sm font-bold", stats.expectancy > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                      {stats.expectancy >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(stats.expectancy)} short />
                    </span>
                  </div>

                  <div className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border",
                    (Math.abs(stats.largestLoss) / stats.averageProfit) > 2 ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-200/30' : 'bg-gray-50/50 dark:bg-slate-800/50'
                  )}>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tail Risk Ratio</span>
                    <span className={cn("text-sm font-bold", 
                      (Math.abs(stats.largestLoss) / stats.averageProfit) > 2 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      {stats.averageProfit > 0 ? (Math.abs(stats.largestLoss) / stats.averageProfit).toFixed(1) : '∞'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. BEHAVIOR - Psychological execution */}
            <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  🧠 Behavior
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Current Streak</span>
                    <span className={cn("text-sm font-bold", stats.currentStreak > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                      {stats.currentStreak > 0 ? '+' : ''}{stats.currentStreak}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Asymmetry Ratio</span>
                    <span className={cn("text-sm font-bold", 
                      (stats.averageProfit / Math.abs(stats.averageLoss)) > 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    )}>
                      {stats.averageLoss !== 0 ? (stats.averageProfit / Math.abs(stats.averageLoss)).toFixed(1) : '∞'}:1
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-lg border border-emerald-200/30">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Best Day</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      +<FormattedCurrency value={stats.largestProfit} short />
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-rose-50/50 dark:bg-rose-500/5 rounded-lg border border-rose-200/30">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Worst Day</span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      -<FormattedCurrency value={Math.abs(stats.largestLoss)} short />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
