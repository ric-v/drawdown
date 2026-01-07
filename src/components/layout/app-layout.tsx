'use client';

import { ReactNode } from 'react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserNav } from '@/components/auth/user-nav';
import { cn } from '@/lib/utils/utils';
import Image from 'next/image';
import { Footer } from '@/components/layout/footer';
import { FormattedCurrency, FormattedPercentage } from '@/components/common/formatted-values';

interface AppLayoutProps {
  children: ReactNode;
  stats?: {
    currentEquity: number;
    totalPnL: number;
    totalPnLPercentage: number;
  };
  equityEditButton?: ReactNode;
  refreshButton?: ReactNode;
  addPnlButton?: ReactNode;
}

export function AppLayout({ children, stats, equityEditButton, refreshButton, addPnlButton }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950/95 transition-colors duration-700">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 flex h-16 md:h-20 shrink-0 items-center justify-between gap-3 md:gap-6 border-b border-gray-200/60 dark:border-slate-700/60 px-4 md:px-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-lg shadow-gray-200/50 dark:shadow-black/20">
        {/* Logo Section */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/15 via-purple-500/15 to-blue-500/15 dark:from-blue-500/25 dark:via-purple-500/25 dark:to-blue-500/25 shadow-xl shadow-blue-500/20 dark:shadow-blue-500/30 ring-1 ring-blue-500/30 dark:ring-blue-500/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/40 hover:ring-blue-500/40 dark:hover:ring-blue-500/50">
            <Image
              src="/logo.png"
              alt="Logo"
              width={24}
              height={24}
              className="object-contain md:w-7 md:h-7"
            />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-xl bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent tracking-tight">Drawdown</h1>
            <p className="hidden md:block text-[10px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider">Portfolio Tracker</p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Stats Section - Premium Cards */}
          {stats && (
            <div className="hidden sm:flex items-center gap-2 md:gap-3">
              <div className="group relative px-3 md:px-5 py-2.5 rounded-xl bg-gradient-to-br from-gray-50/95 to-gray-100/95 dark:from-slate-800/70 dark:to-slate-900/70 backdrop-blur-xl border border-gray-200/70 dark:border-slate-700/70 shadow-md shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300 hover:shadow-lg hover:shadow-gray-300/60 dark:hover:shadow-black/40 hover:scale-[1.02] hover:border-gray-300/80 dark:hover:border-slate-600/80">
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600 dark:text-gray-400 mb-1">Equity</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs md:text-base font-bold text-gray-900 dark:text-white">
                    <FormattedCurrency value={stats.currentEquity} short />
                  </p>
                  {equityEditButton}
                </div>
              </div>
              
              <div className="px-3 md:px-5 py-2.5 rounded-xl bg-gradient-to-br from-gray-50/95 to-gray-100/95 dark:from-slate-800/70 dark:to-slate-900/70 backdrop-blur-xl border border-gray-200/70 dark:border-slate-700/70 shadow-md shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300 hover:shadow-lg hover:shadow-gray-300/60 dark:hover:shadow-black/40 hover:scale-[1.02] hover:border-gray-300/80 dark:hover:border-slate-600/80">
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600 dark:text-gray-400 mb-1">P&L</p>
                <div className="flex items-baseline gap-1.5">
                  <p className={cn(
                    'text-xs md:text-base font-bold transition-colors duration-300',
                    stats.totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  )}>
                    {stats.totalPnL >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(stats.totalPnL)} short />
                  </p>
                  <span className={cn(
                    'text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm',
                    stats.totalPnL >= 0 
                      ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-500/25 text-rose-700 dark:text-rose-400'
                  )}>
                    <FormattedPercentage value={stats.totalPnLPercentage} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="hidden md:block h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-slate-700" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {addPnlButton}
            {refreshButton}
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

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
