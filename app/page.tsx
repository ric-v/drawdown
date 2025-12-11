'use client';

import { KPICard } from '@/components/kpi-card';
import { EquityChart } from '@/components/equity-chart';
import { TransactionTable } from '@/components/transaction-table';
import { AddTransactionForm } from '@/components/add-transaction-form';
import { EditEquityForm } from '@/components/edit-equity-form';
import { EditTransactionForm } from '@/components/edit-transaction-form';
import { AddFundsForm } from '@/components/add-funds-form';
import { FundHistory } from '@/components/fund-history';
import { AppLayout } from '@/components/app-layout';
import { DailyPnL, PortfolioStats, EquityPoint } from '@/types/trading';
import { DollarSign, Activity, Target, RefreshCw, CalendarIcon, MoreHorizontal, IndianRupeeIcon, Plus, Edit2 } from 'lucide-react';
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

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
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
    fetchData();
  }, [date]); // Re-fetch when date changes

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

  return (
    <AppLayout stats={globalStats}>
      <div className="flex flex-col space-y-6 p-4 md:p-8">
        {/* Header Section with Actions */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
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
                      "w-full md:w-[260px] justify-start text-left font-normal",
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
                className="h-10 w-full md:w-10"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              <AddTransactionForm
                onTransactionAdded={fetchData}
                trigger={
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full px-2 md:w-auto">
                    <Plus className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Add P&L</span>
                    <span className="md:hidden">P&L</span>
                  </Button>
                }
              />

              <AddFundsForm
                onFundsAdded={fetchData}
                trigger={
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full px-2 md:w-auto">
                    <Plus className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Funds</span>
                    <span className="md:hidden">Funds</span>
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
                    className="h-10 w-full md:w-10 md:border-0 md:bg-transparent md:hover:bg-accent"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          <KPICard
            title="Total PnL"
            value={stats.totalPnL}
            isCurrency
            trend={stats.totalPnL >= 0 ? 'up' : 'down'}
            subtitle={`${stats.totalPnLPercentage >= 0 ? '+' : ''}${stats.totalPnLPercentage.toFixed(2)}% Return`}
          />
          <KPICard
            title="Net Worth"
            value={globalStats.currentEquity}
            isCurrency
            trend="neutral"
            subtitle="Current Equity"
          />
          <KPICard
            title="Profit Factor"
            value={stats.profitFactor ? stats.profitFactor.toFixed(2) : 'Inf'}
            trend={!stats.profitFactor || stats.profitFactor > 1.5 ? 'up' : stats.profitFactor < 1 ? 'down' : 'neutral'}
            subtitle={!stats.profitFactor || stats.profitFactor > 2 ? 'Excellent' : stats.profitFactor > 1.2 ? 'Good' : 'Needs Improvement'}
          />
          <KPICard
            title="Max Drawdown"
            value={`${stats.maxDrawdown.toFixed(2)}%`}
            trend="down"
            subtitle="Peak to Valley"
          />
          <KPICard
            title="Win Rate"
            value={stats.winRate}
            isPercentage
            trend={stats.winRate > 50 ? 'up' : 'down'}
            subtitle={`${stats.profitDays}W - ${stats.lossDays}L (${stats.totalDays} Days)`}
          />
          <KPICard
            title="Expectancy"
            value={stats.expectancy}
            isCurrency
            trend={stats.expectancy > 0 ? 'up' : 'down'}
            subtitle="Avg per Trade"
          />
          <KPICard
            title="Streak"
            value={Math.abs(stats.currentStreak)}
            trend={stats.currentStreak > 0 ? 'up' : 'down'}
            subtitle={stats.currentStreak > 0 ? 'Consecutive Wins' : 'Consecutive Losses'}
          />
          <KPICard
            title="Avg Profit"
            value={stats.averageProfit}
            isCurrency
            trend="up"
            subtitle="Per Winning Day"
          />
        </div>

        {/* Charts and Stats Area */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="col-span-3 lg:col-span-2 flex flex-col gap-6">
            <EquityChart
              className="w-full h-full"
              data={filteredEquityData}
              allData={dailyPnL}
              dateRange={date && date.from && date.to ? { start: date.from, end: date.to } : { start: new Date(0), end: new Date() }}
              onDateRangeChange={() => { }}
            />
          </div>

          <div className="col-span-3 lg:col-span-1 flex flex-col gap-6">
            <Card className="flex-1 shadow-sm border-0">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <IndianRupeeIcon className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium">Largest Profit</span>
                    </div>
                    <span className="font-bold text-emerald-500">
                      {stats.largestProfit > 0 ? '+' : ''}{stats.largestProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <IndianRupeeIcon className="h-4 w-4 text-red-500" />
                      </div>
                      <span className="text-sm font-medium">Largest Loss</span>
                    </div>
                    <span className="font-bold text-red-500">
                      {stats.largestLoss.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-red-500" />
                      </div>
                      <span className="text-sm font-medium">Avg Loss</span>
                    </div>
                    <span className="font-bold text-red-500">
                      {Math.abs(stats.averageLoss).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Target className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">Total Trades</span>
                    </div>
                    <span className="font-bold">
                      {stats.totalDays}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
