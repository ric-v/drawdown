'use client';

import React, { useMemo, useState } from 'react';
import { DailyPnL } from '@/types/trading';
import {
  eachDayOfInterval, format, getDay, subYears, isSameDay,
  startOfWeek, endOfWeek, isFuture,
} from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';
import { useSettings } from '@/hooks/use-settings';
import { formatCurrency, formatDate } from '@/lib/utils/format-settings';
import { mapPnLToBucket, computeMonthlySummary } from './pnl-calendar-helpers';

interface PnLCalendarProps {
  data: DailyPnL[];
  className?: string;
  dateRange?: { from: Date; to: Date };
  onDayClick?: (day: DailyPnL | null, date: Date) => void;
  showWeeklySummary?: boolean;
}

export function PnLCalendar({ data, className, dateRange, onDayClick, showWeeklySummary = true }: PnLCalendarProps) {
  const { settings } = useSettings();
  const isMobile = useIsMobile();
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(4);
  const [futureMessage, setFutureMessage] = useState<string | null>(null);

  const { months } = useMemo(() => {
    const anchor = new Date();
    const monthsData = [];
    for (let i = 11; i >= 0; i--) {
      monthsData.push(new Date(anchor.getFullYear(), anchor.getMonth() - i, 1));
    }
    return { months: monthsData };
  }, []);

  const displayMonths = useMemo(() => {
    if (!isMobile) return months;
    const start = (selectedQuarter - 1) * 3;
    return months.slice(start, start + 3);
  }, [months, selectedQuarter, isMobile]);

  const pnlMap = useMemo(() => {
    const map = new Map<string, DailyPnL>();
    data.forEach((entry) => {
      const key = new Date(entry.date).toISOString().split('T')[0];
      map.set(key, entry);
    });
    return map;
  }, [data]);

  const maxAbs = useMemo(() => {
    let m = 0;
    data.forEach((d) => { m = Math.max(m, Math.abs(d.pnl)); });
    return m;
  }, [data]);

  const isInRange = (date: Date) => {
    if (!dateRange) return true;
    return date >= dateRange.from && date <= dateRange.to;
  };

  const getColorClass = (pnl: number | undefined) => {
    if (pnl === undefined || pnl === 0) return 'bg-muted/40';
    const { bucket, tone } = mapPnLToBucket(pnl, maxAbs);
    if (bucket === 0) return 'bg-muted/40';
    return `bg-${tone}-${bucket}`;
  };

  const handleDayClick = (date: Date) => {
    if (!onDayClick) return;
    setFutureMessage(null);

    if (isFuture(date)) {
      setFutureMessage('Future dates cannot have transactions added.');
      setTimeout(() => setFutureMessage(null), 3000);
      return;
    }

    const key = format(date, 'yyyy-MM-dd');
    const entry = pnlMap.get(key);
    onDayClick(entry || null, date);
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [months]);

  const content = (
    <div className="flex flex-col gap-3">
      {isMobile && (
        <div className="flex gap-2 justify-center mb-2">
          {([1, 2, 3, 4] as const).map((q) => (
            <button key={q} onClick={() => setSelectedQuarter(q)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 motion-reduce:duration-0',
                selectedQuarter === q ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-accent/50'
              )}>
              Q{q}
            </button>
          ))}
        </div>
      )}

      {futureMessage && (
        <p className="text-xs text-muted-foreground text-center py-1">{futureMessage}</p>
      )}

      <div ref={scrollRef} className="flex flex-col gap-2 overflow-x-auto pb-2 w-full max-w-full" style={{ scrollBehavior: 'smooth' }}>
        <div className="flex gap-2 min-w-max px-1">
          <div className="sticky left-0 bg-card z-10 flex flex-col gap-1 text-[10px] text-muted-foreground pt-[20px] pr-2">
            <div className="h-3" />
            <div className="h-3">Mon</div>
            <div className="h-3" />
            <div className="h-3">Wed</div>
            <div className="h-3" />
            <div className="h-3">Fri</div>
            <div className="h-3" />
          </div>

          <div className="flex gap-2">
            {displayMonths.map((monthStart, mIndex) => {
              const realDays = eachDayOfInterval({
                start: monthStart,
                end: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0),
              });

              const weeks: (Date | null)[][] = [];
              let currentWeek: (Date | null)[] = new Array(7).fill(null);
              realDays.forEach((day) => {
                const dow = getDay(day);
                currentWeek[dow] = day;
                if (dow === 6) { weeks.push(currentWeek); currentWeek = new Array(7).fill(null); }
              });
              if (currentWeek.some((d) => d !== null)) weeks.push(currentWeek);

              // Monthly summary
              const monthEntries = data.filter((e) => {
                const d = new Date(e.date);
                return d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear();
              });
              const summary = computeMonthlySummary(monthEntries);

              return (
                <div key={mIndex} className="flex flex-col gap-1">
                  <div className="text-[10px] text-muted-foreground text-center h-[16px]">{format(monthStart, 'MMM')}</div>
                  <div className="flex gap-[2px]">
                    {weeks.map((week, wIndex) => (
                      <div key={wIndex} className="flex flex-col gap-[2px]">
                        {week.map((day, dIndex) => {
                          if (!day) return <div key={dIndex} className="w-3 h-3" />;
                          const dateKey = format(day, 'yyyy-MM-dd');
                          const entry = pnlMap.get(dateKey);
                          const pnl = entry?.pnl;
                          const inRange = isInRange(day);

                          return (
                            <TooltipProvider key={dateKey} delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleDayClick(day)}
                                    className={cn(
                                      'w-3 h-3 rounded-[1px] transition-colors duration-150 motion-reduce:duration-0 focus:outline-none focus:ring-1 focus:ring-ring',
                                      getColorClass(pnl),
                                      !inRange && 'opacity-40',
                                      onDayClick && 'cursor-pointer hover:scale-110'
                                    )}
                                    disabled={!onDayClick}
                                    aria-label={`${dateKey}: ${pnl !== undefined ? formatCurrency(pnl, settings) : 'No activity'}`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs font-medium">{formatDate(day, settings)}</p>
                                  <p className={cn('text-xs', pnl && pnl > 0 ? 'text-positive' : pnl && pnl < 0 ? 'text-negative' : 'text-muted-foreground')}>
                                    {pnl !== undefined ? `${pnl > 0 ? '+' : ''}${formatCurrency(Math.abs(pnl), settings)}` : 'No activity'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {/* Monthly summary row */}
                  <div className="text-[9px] text-muted-foreground text-center mt-0.5 leading-tight">
                    <span className={summary.totalPnL >= 0 ? 'text-positive' : 'text-negative'}>
                      {formatCurrency(summary.totalPnL, settings)}
                    </span>
                    {' · '}
                    <span>{summary.winRate === 'N/A' ? 'N/A' : `${summary.winRate}%`}</span>
                    {' · '}
                    <span>{summary.tradingDays}d</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-1 px-1 text-[10px] text-muted-foreground sticky left-0">
          <span>Less</span>
          <div className="flex gap-[2px]">
            <div className="w-3 h-3 rounded-[1px] bg-loss-1" />
            <div className="w-3 h-3 rounded-[1px] bg-loss-3" />
            <div className="w-3 h-3 rounded-[1px] bg-loss-5" />
            <div className="w-3 h-3 rounded-[1px] bg-muted/40" />
            <div className="w-3 h-3 rounded-[1px] bg-gain-1" />
            <div className="w-3 h-3 rounded-[1px] bg-gain-3" />
            <div className="w-3 h-3 rounded-[1px] bg-gain-5" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );

  if (className?.includes('no-card')) {
    return <div className={cn(className, 'block')}>{content}</div>;
  }

  return (
    <Card className={cn('border-0 shadow-none', className)}>
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-base font-medium">PnL Activity</CardTitle>
        <CardDescription>{data.length} trading days recorded</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">{content}</CardContent>
    </Card>
  );
}
