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
import { DollarSign, Activity, Target, RefreshCw, Trash2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isConsolidated, setIsConsolidated] = useState(true);
  const [editingEntry, setEditingEntry] = useState<DailyPnL | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Date range state - default to current month
  const getDefaultDateRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: startOfMonth, end: now };
  };
  
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  
  // Filter data based on date range
  const filteredEquityData = equityData.filter(point => {
    // Parse the date string (format: "DD MMM YYYY" or ISO string)
    const pointDate = new Date(point.date);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Set time to start of day for accurate comparison
    pointDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return pointDate >= startDate && pointDate <= endDate;
  });
  
  const filteredDailyPnL = dailyPnL.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Set time to start of day for accurate comparison
    entryDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return entryDate >= startDate && entryDate <= endDate;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/portfolio?consolidated=${isConsolidated}`);
      if (response.ok) {
        const data = await response.json();
        setDailyPnL(data.dailyPnL.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        })));
        setEquityData(data.equityData);
        setStats(data.stats);
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
  }, [isConsolidated]);

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
    <AppLayout stats={stats}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header with Actions */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Dashboard</h2>
              {lastUpdated && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <AddTransactionForm onTransactionAdded={fetchData} />
              <AddFundsForm onFundsAdded={fetchData} />
              <EditEquityForm currentEquity={stats.initialCapital} onEquityUpdated={fetchData} />
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading portfolio data...</p>
            </div>
          </div>
        ) : (
          <>
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <KPICard
            title="Total P&L"
            value={stats.totalPnL}
            subtitle={`${stats.totalPnLPercentage.toFixed(2)}% Return`}
            trend={stats.totalPnL > 0 ? 'up' : stats.totalPnL < 0 ? 'down' : 'neutral'}
            isCurrency
            numericValue={stats.totalPnL}
          />
          <KPICard
            title="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            subtitle={`${stats.profitDays}P / ${stats.lossDays}L Days`}
            trend={stats.winRate >= 50 ? 'up' : 'down'}
          />
          <KPICard
            title="Average Profit"
            value={stats.averageProfit}
            subtitle={`Avg Loss: ${stats.averageLoss < 0 ? '-' : ''}₹${Math.abs(stats.averageLoss).toFixed(2)}`}
            trend="up"
            isCurrency
            numericValue={stats.averageProfit}
          />
          <KPICard
            title="Total Days"
            value={stats.totalDays}
            subtitle={`Best Day: ${stats.largestProfit > 0 ? '+' : ''}₹${stats.largestProfit.toFixed(2)}`}
            trend="neutral"
          />
        </div>

        {/* Charts and Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <EquityChart 
            data={filteredEquityData} 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          {/* Additional Stats and Fund History */}
          <div className="space-y-4 sm:space-y-6">
            {/* Performance Metrics Card */}
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4 sm:mb-6">
                Performance Metrics
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Largest Profit</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +₹{stats.largestProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Largest Loss</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">
                    ₹{stats.largestLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Profit Days</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                    {stats.profitDays}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Loss Days</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                    {stats.lossDays}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 pt-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                      <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Initial Capital</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                    ₹{stats.initialCapital.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Fund History */}
            <FundHistory key={lastUpdated} />
          </div>
        </div>

        {/* Daily P&L History */}
        <TransactionTable 
          transactions={filteredDailyPnL} 
          isConsolidated={isConsolidated}
          onToggleConsolidation={() => setIsConsolidated(!isConsolidated)}
          onDelete={handleDeleteEntry}
          onEdit={handleEditEntry}
        />

        {/* Edit Transaction Modal */}
        <EditTransactionForm
          entry={editingEntry}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={fetchData}
        />

        </>
        )}
      </div>
    </AppLayout>
  );
}
