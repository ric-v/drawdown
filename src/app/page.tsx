'use client';

import { KPICard } from '@/components/features/portfolio/kpi-card';
import { EquityChart } from '@/components/features/portfolio/equity-chart';
import { TransactionTable } from '@/components/features/transactions/transaction-table';
import { AddTransactionForm } from '@/components/features/transactions/add-transaction-form';
import { EditEquityForm } from '@/components/features/portfolio/edit-equity-form';
import { EditTransactionForm } from '@/components/features/transactions/edit-transaction-form';
import { AddFundsForm } from '@/components/features/funds/add-funds-form';
import { FundHistory } from '@/components/features/funds/fund-history';
import { AppLayout } from '@/components/layout/app-layout';
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

export default function Dashboard() {
  const { data: session, status } = useSession()

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

  // Date range state
  const [date, setDate] = useState<DateRange | undefined>(undefined)

  // Filter data based on date range - NO LONGER NEEDED, server side filtering
  const filteredEquityData = equityData;
  const filteredDailyPnL = dailyPnL;

  const fetchData = async () => {
    try {
      setLoading(true);
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
        setDailyPnL(data.dailyPnL.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        })));
        setEquityData(data.equityData);
        setEquityData(data.equityData);
        setStats(data.stats);
        setGlobalStats(data.globalStats);
        setLastUpdated(data.lastUpdated);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
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

    try {
      const response = await fetch(`/api/portfolio/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        alert('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry');
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

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen"><RefreshCw className="animate-spin h-8 w-8" /></div>
  }

  if (status === "unauthenticated") {
    return <LoginScreen />
  }

  return (
    <AppLayout stats={globalStats}>
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

            <div className="grid grid-cols-4 gap-2 md:flex md:flex-row md:items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchData}
                title="Refresh Data"
                className="h-10 w-full md:w-10 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              <AddTransactionForm
                onTransactionAdded={fetchData}
                trigger={
                  <Button className="h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white w-full px-3 md:w-auto rounded-xl shadow-sm hover:shadow-md transition-all duration-300 active:scale-95">
                    <Plus className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline font-medium text-sm">Add P&L</span>
                    <span className="md:hidden font-medium text-sm">P&L</span>
                  </Button>
                }
              />

              <AddFundsForm
                onFundsAdded={fetchData}
                trigger={
                  <Button className="h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-full px-3 md:w-auto rounded-xl shadow-sm hover:shadow-md transition-all duration-300 active:scale-95">
                    <Plus className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline font-medium text-sm">Funds</span>
                    <span className="md:hidden font-medium text-sm">Funds</span>
                  </Button>
                }
              />

              <EditEquityForm
                currentEquity={stats.initialCapital}
                onEquityUpdated={fetchData}
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    title="Edit Initial Capital"
                    className="h-10 w-full md:w-10 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid - Two Column Layout */}
        <div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {/* Left Column - Metrics & Chart */}
          <div className="space-y-5 lg:col-span-2 xl:col-span-3">
            {/* Hero Metrics - Compact Row */}
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
                        {stats.totalPnL >= 0 ? '+' : ''}₹{Math.abs(stats.totalPnL / 1000).toFixed(1)}k
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {stats.totalPnLPercentage >= 0 ? '+' : ''}{stats.totalPnLPercentage.toFixed(2)}% Return
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
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Net Worth</p>
                      <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-0.5">
                        ₹{(globalStats.currentEquity / 1000).toFixed(1)}k
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Current Equity
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl hover:shadow-xl transition-all duration-300 ease-out rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Win Rate</p>
                      <div className={cn(
                        "text-2xl md:text-3xl font-bold mb-0.5",
                        stats.winRate > 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      )}>
                        {stats.winRate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {stats.profitDays}W - {stats.lossDays}L
                      </p>
                    </div>
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      stats.winRate > 50 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'
                    )}>
                      <Target className={cn("h-5 w-5", stats.winRate > 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <EquityChart
              className="w-full h-full"
              data={filteredEquityData}
              allData={dailyPnL}
              dateRange={date && date.from && date.to ? { start: date.from, end: date.to } : { start: new Date(0), end: new Date() }}
              onDateRangeChange={() => { }}
            />
          </div>

          {/* Right Column - Stats Sidebar */}
          <div className="space-y-5 lg:col-span-1 xl:col-span-1">
            {/* Performance Metrics */}
            <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Profit Factor</span>
                    <span className={cn("text-sm font-bold", 
                      !stats.profitFactor || stats.profitFactor > 1.5 ? 'text-emerald-600 dark:text-emerald-400' : stats.profitFactor < 1 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white')}>
                      {stats.profitFactor ? stats.profitFactor.toFixed(2) : '∞'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Expectancy</span>
                    <span className={cn("text-sm font-bold", stats.expectancy > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                      {stats.expectancy >= 0 ? '+' : ''}₹{(stats.expectancy / 1000).toFixed(1)}k
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Max Drawdown</span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      {stats.maxDrawdown.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Avg Profit</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      +₹{(stats.averageProfit / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extremes */}
            <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">Best & Worst</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-lg border border-emerald-200/30 dark:border-emerald-500/20">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Best Day</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +₹{(stats.largestProfit / 1000).toFixed(1)}k
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-rose-50/50 dark:bg-rose-500/5 rounded-lg border border-rose-200/30 dark:border-rose-500/20">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Worst Day</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    -₹{(Math.abs(stats.largestLoss) / 1000).toFixed(1)}k
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Avg Loss</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    -₹{(Math.abs(stats.averageLoss) / 1000).toFixed(1)}k
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Streak</span>
                  <span className={cn("text-sm font-bold", stats.currentStreak > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                    {stats.currentStreak > 0 ? '+' : ''}{stats.currentStreak}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Fund History */}
            <FundHistory onFundUpdate={fetchData} dateRange={date} />
          </div>
        </div>

        {/* Transaction Table */}
        <TransactionTable
          transactions={filteredDailyPnL}
          isConsolidated={false}
          onDelete={handleDeleteEntry}
          onEdit={handleEditEntry}
        />

        {editingEntry && (
          <EditTransactionForm
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            onEntryUpdated={fetchData}
            entry={editingEntry}
          />
        )}
      </div>
    </AppLayout>
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
