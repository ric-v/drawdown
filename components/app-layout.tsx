'use client';

import { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
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
    <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 px-6">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={32} 
            height={32}
            className="object-contain"
          />
          <h1 className="hidden md:block font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">Trading PnL Tracker</h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {stats && (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right">
                <p className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400">Current Equity</p>
                <p className="text-xs md:text-lg font-bold text-gray-900 dark:text-gray-100">
                  ₹{stats.currentEquity.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="h-6 md:h-8 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="text-right">
                <p className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400">Total P&L</p>
                <p className={cn(
                  'text-xs md:text-lg font-bold',
                  stats.totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {stats.totalPnL >= 0 ? '+' : ''}₹{stats.totalPnL.toLocaleString('en-IN')}
                  <span className="text-[10px] md:text-xs ml-1">
                    ({stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnLPercentage.toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
