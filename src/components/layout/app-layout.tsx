'use client';

import { ReactNode } from 'react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserNav } from '@/components/auth/user-nav';
import { cn } from '@/lib/utils/utils';
import Image from 'next/image';

interface AppLayoutProps {
  children: ReactNode;
  stats?: {
    currentEquity: number;
    totalPnL: number;
    totalPnLPercentage: number;
  };
}

export function AppLayout({ children, stats }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-700">
      {/* Premium Header */}
      <header className="flex h-16 md:h-20 shrink-0 items-center justify-between gap-3 md:gap-6 border-b border-gray-200/60 dark:border-slate-800/60 px-4 md:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-sm">
        {/* Logo Section */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-blue-500/20 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 ring-1 ring-blue-500/20 dark:ring-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
            <Image
              src="/logo.png"
              alt="Logo"
              width={24}
              height={24}
              className="object-contain md:w-7 md:h-7"
            />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">Drawdown</h1>
            <p className="hidden md:block text-[10px] font-medium text-gray-500 dark:text-gray-400">Portfolio Tracker</p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Stats Section - Premium Cards */}
          {stats && (
            <div className="hidden sm:flex items-center gap-2 md:gap-3">
              <div className="px-3 md:px-4 py-2 rounded-xl bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
                <p className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">Equity</p>
                <p className="text-xs md:text-base font-bold text-gray-900 dark:text-white">
                  ₹{(stats.currentEquity / 1000).toFixed(1)}k
                </p>
              </div>
              
              <div className="px-3 md:px-4 py-2 rounded-xl bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
                <p className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">P&L</p>
                <div className="flex items-baseline gap-1.5">
                  <p className={cn(
                    'text-xs md:text-base font-bold transition-colors duration-300',
                    stats.totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  )}>
                    {stats.totalPnL >= 0 ? '+' : ''}₹{Math.abs(stats.totalPnL / 1000).toFixed(1)}k
                  </p>
                  <span className={cn(
                    'text-[9px] md:text-[10px] font-semibold px-1.5 py-0.5 rounded-md',
                    stats.totalPnL >= 0 
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                  )}>
                    {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnLPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="hidden md:block h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-slate-700" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserNav stats={stats} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </div>
    </div>
  );
}
