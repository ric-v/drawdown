'use client';

import { KPICard } from '@/components/kpi-card';
import { EquityChart } from '@/components/equity-chart';
import { TransactionTable } from '@/components/transaction-table';
import { 
  generateMockTransactions, 
  generateEquityData, 
  generatePortfolioStats 
} from '@/lib/mock-data';
import { TrendingUp, DollarSign, Activity, Target } from 'lucide-react';

export default function Dashboard() {
  const transactions = generateMockTransactions();
  const equityData = generateEquityData();
  const stats = generatePortfolioStats();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-100">Trading PnL Tracker</h1>
                  <p className="text-xs text-gray-500">Professional Performance Analytics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Current Equity</p>
                <p className="text-lg font-bold text-gray-100">
                  ${stats.currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container mx-auto px-6 py-8">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            subtitle={`${stats.winningTrades}W / ${stats.losingTrades}L`}
            trend={stats.winRate >= 50 ? 'up' : 'down'}
          />
          <KPICard
            title="Average Win"
            value={stats.averageWin}
            subtitle={`Avg Loss: ${stats.averageLoss < 0 ? '-' : ''}$${Math.abs(stats.averageLoss).toFixed(2)}`}
            trend="up"
            isCurrency
            numericValue={stats.averageWin}
          />
          <KPICard
            title="Total Trades"
            value={stats.totalTrades}
            subtitle={`Best: ${stats.largestWin > 0 ? '+' : ''}$${stats.largestWin.toFixed(2)}`}
            trend="neutral"
          />
        </div>

        {/* Charts and Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <EquityChart data={equityData} />
          
          {/* Additional Stats Card */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-gray-400">Largest Win</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-500">
                    +${stats.largestWin.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-400">Largest Loss</span>
                  </div>
                  <span className="text-sm font-semibold text-red-500">
                    ${stats.largestLoss.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-400">Win Trades</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-100">
                    {stats.winningTrades}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-400">Loss Trades</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-100">
                    {stats.losingTrades}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-400">Initial Capital</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-100">
                    ${stats.initialCapital.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <TransactionTable transactions={transactions} />

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
          <p>© 2024 Trading PnL Tracker. Professional trading analytics platform.</p>
        </div>
      </main>
    </div>
  );
}
