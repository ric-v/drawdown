'use client';

import { ReactNode } from 'react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserNav } from '@/components/auth/user-nav';
import { cn } from '@/lib/utils/utils';
import Image from 'next/image';
import { Footer } from '@/components/layout/footer';
import { FormattedCurrency, FormattedPercentage } from '@/components/common/formatted-values';
import { MobileNav } from '@/components/ui/mobile-nav';
import { useBreakpoint } from '@/hooks/use-breakpoint';

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
  const breakpoint = useBreakpoint();

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950/95 transition-colors duration-300 motion-reduce:duration-0">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-14 md:h-16 shrink-0 items-center justify-between gap-2 md:gap-4 border-b border-border px-3 md:px-6 bg-background/90 backdrop-blur-xl">
        {/* Left: Logo + Mobile Nav */}
        <div className="flex items-center gap-2">
          {breakpoint === 'mobile' && <MobileNav />}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/50">
              <Image src="/logo.png" alt="Logo" width={20} height={20} className="object-contain" />
            </div>
            <h1 className="font-bold text-sm md:text-lg">Drawdown</h1>
          </div>
        </div>

        {/* Center: Stats (tablet+) */}
        {stats && breakpoint !== 'mobile' && (
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-card border border-border">
              <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Equity</p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold"><FormattedCurrency value={stats.currentEquity} short /></p>
                {equityEditButton}
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-card border border-border">
              <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">P&L</p>
              <div className="flex items-baseline gap-1">
                <p className={cn('text-sm font-bold', stats.totalPnL >= 0 ? 'text-positive' : 'text-negative')}>
                  {stats.totalPnL >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(stats.totalPnL)} short />
                </p>
                <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded', stats.totalPnL >= 0 ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative')}>
                  <FormattedPercentage value={stats.totalPnLPercentage} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {addPnlButton}
          {refreshButton}
          <ThemeToggle />
          <UserNav stats={stats} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <main className="w-full max-w-full animate-in fade-in duration-300 motion-reduce:duration-0">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
