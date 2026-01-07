'use client';

import React, { useMemo, useState } from 'react';
import { DailyPnL } from '@/types/trading';
import {
  eachDayOfInterval,
  endOfYear,
  format,
  getDay,
  startOfYear,
  subYears,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
} from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils/utils"
import { useSettings } from '@/hooks/use-settings';
import { formatCurrency } from '@/lib/utils/format-settings';
import { formatDate } from '@/lib/utils/format-settings';

interface PnLCalendarProps {
  data: DailyPnL[];
  className?: string;
  year?: number; // Optional year to force display, otherwise defaults to usually last year or derived from data
  // Trader cockpit features
  onDayClick?: (day: DailyPnL | null, date: Date) => void;
  showWeeklySummary?: boolean;
}

export function PnLCalendar({ data, className, year, onDayClick, showWeeklySummary = true }: PnLCalendarProps) {
  const { settings } = useSettings();
  const isMobile = useIsMobile();
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(4); // Default to Q4 (current quarter)
  
  // Weekly summary calculations
  const weeklyData = useMemo(() => {
    const weeks = new Map<string, {
      weekStart: Date;
      weekEnd: Date;
      totalPnL: number;
      winDays: number;
      lossDays: number;
      maxDD: number;
      trades: DailyPnL[];
    }>();
    
    data.forEach(entry => {
      const entryDate = new Date(entry.date);
      const weekStart = startOfWeek(entryDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, {
          weekStart,
          weekEnd: endOfWeek(entryDate, { weekStartsOn: 1 }),
          totalPnL: 0,
          winDays: 0,
          lossDays: 0,
          maxDD: 0,
          trades: []
        });
      }
      
      const week = weeks.get(weekKey)!;
      week.totalPnL += entry.pnl;
      week.trades.push(entry);
      if (entry.pnl > 0) week.winDays++;
      if (entry.pnl < 0) week.lossDays++;
    });
    
    return weeks;
  }, [data]);
  // Always use the last 12 months ending today
  const { startDate, endDate, months } = useMemo(() => {
    const today = new Date();
    const end = today;
    const start = subYears(today, 1);

    // Generate each month in the interval
    const monthStarts = eachDayOfInterval({ start, end })
      .filter(d => d.getDate() === 1); // Get all 1st days of months

    // Ensure we capture the start month properly if start date is mid-month (though subYears(today, 1) usually hits same day)
    // Better: split interval into months.

    // We want exactly 12 months back? Or just Jan-Dec of current year? 
    // User said "show the activitiy last 12 months always".
    // Let's iterate from month of (today - 11 months) to month of (today).

    const monthsData = [];
    let current = startOfWeek(start); // Start loop, but handle weeks...

    // Actually, distinct Month Blocks approach:
    // Iterate 12 months.
    const anchor = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
      monthsData.push(d);
    }

    return { startDate: monthsData[0], endDate: end, months: monthsData };
  }, []);

  // Split months into 4 groups of 3 consecutive months on mobile
  const displayMonths = useMemo(() => {
    if (!isMobile) return months;
    
    // Split the 12 months into 4 groups of 3 consecutive months
    const startIndex = (selectedQuarter - 1) * 3;
    const endIndex = startIndex + 3;
    
    return months.slice(startIndex, endIndex);
  }, [months, selectedQuarter, isMobile]);

  const pnlMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(entry => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      map.set(dateKey, entry.pnl);
    });
    return map;
  }, [data]);

  // Calculate intensity for color scaling
  const { maxProfit, maxLoss } = useMemo(() => {
    let maxP = 0;
    let maxL = 0;
    // Optimization: only scan visible data if needed, but scanning all is fine for scale consistency
    data.forEach(d => {
      if (d.pnl > maxP) maxP = d.pnl;
      if (d.pnl < maxL) maxL = d.pnl;
    });
    return { maxProfit: maxP, maxLoss: Math.abs(maxL) };
  }, [data]);

  const getColorClass = (pnl: number | undefined) => {
    if (pnl === undefined || pnl === 0) return 'bg-gray-100 dark:bg-muted/40 hover:bg-gray-200 dark:hover:bg-muted/60';

    if (pnl > 0) {
      if (!maxProfit) return 'bg-emerald-400 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400';
      const intensity = pnl / maxProfit;
      // Enhanced with hover states for interactivity
      if (intensity < 0.25) return 'bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-500 hover:bg-emerald-300 dark:hover:bg-emerald-800/60';
      if (intensity < 0.5) return 'bg-emerald-300 dark:bg-emerald-700/60 hover:bg-emerald-400 dark:hover:bg-emerald-600/80';
      if (intensity < 0.75) return 'bg-emerald-400 dark:bg-emerald-600 hover:bg-emerald-500 dark:hover:bg-emerald-500';
      return 'bg-emerald-500 dark:bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400';
    } else {
      const absPnl = Math.abs(pnl);
      if (!maxLoss) return 'bg-red-400 dark:bg-red-500 hover:bg-red-500 dark:hover:bg-red-400';
      const intensity = absPnl / maxLoss;
      // Enhanced with hover states for interactivity
      if (intensity < 0.25) return 'bg-red-200 dark:bg-red-900/40 dark:text-red-500 hover:bg-red-300 dark:hover:bg-red-800/60';
      if (intensity < 0.5) return 'bg-red-300 dark:bg-red-700/60 hover:bg-red-400 dark:hover:bg-red-600/80';
      if (intensity < 0.75) return 'bg-red-400 dark:bg-red-600 hover:bg-red-500 dark:hover:bg-red-500';
      return 'bg-red-500 dark:bg-red-500 hover:bg-red-600 dark:hover:bg-red-400';
    }
  };
  
  const handleDayClick = (date: Date) => {
    if (!onDayClick) return;
    
    const dayData = data.find(entry => 
      isSameDay(new Date(entry.date), date)
    );
    
    onDayClick(dayData || null, date);
  };

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [months]); // Trigger when months data is ready

  const content = (
    <div className="flex flex-col gap-3">
      {/* Quarter Selector - Mobile Only */}
      {isMobile && (
        <div className="flex gap-2 justify-center mb-2">
          {[1, 2, 3, 4].map((quarter) => (
            <button
              key={quarter}
              onClick={() => setSelectedQuarter(quarter as 1 | 2 | 3 | 4)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                selectedQuarter === quarter
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
              )}
            >
              Q{quarter}
            </button>
          ))}
        </div>
      )}
      
      <div
        ref={scrollContainerRef}
        className="flex flex-col gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent w-full max-w-full relative"
        style={{ scrollBehavior: 'smooth' }}
      >
      <div className="flex gap-2 min-w-max px-1">
        {/* Weekday Labels Column - Sticky Left */}
        <div className="sticky left-0 bg-white dark:bg-card z-10 flex flex-col gap-1 text-[10px] text-muted-foreground pt-[20px] pr-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
          {/* Offset for Month Label Height */}
          <div className="h-3"></div>
          <div className="h-3">Mon</div>
          <div className="h-3"></div>
          <div className="h-3">Wed</div>
          <div className="h-3"></div>
          <div className="h-3">Fri</div>
          <div className="h-3"></div>
        </div>

        {/* Months Container */}
        <div className="flex gap-2">
          {displayMonths.map((monthStart, mIndex) => {
            // Generate full weeks for this month
            // To align week rows, we need to know the Day of Week of the 1st
            // And pad the first week column with empty cells
            const daysInMonth = eachDayOfInterval({
              start: monthStart,
              end: endOfWeek(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0))
              // Actually we just want the days of the month, but arranged in weeks.
              // If we use endOfWeek, we get the trailing days of the last week (which are in next month).
              // We should filter those out visually.
            });

            // Re-calculate: Get days strictly in month
            const realDays = eachDayOfInterval({
              start: monthStart,
              end: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
            });

            // Group into columns (weeks)
            // Strategy: 
            // 1. Determine start dow (0-6).
            // 2. Fill grid column by column.

            const weeks = [];
            let currentWeek = new Array(7).fill(null);

            realDays.forEach(day => {
              const dow = getDay(day); // 0=Sun
              currentWeek[dow] = day;
              if (dow === 6) { // Saturday, week ends
                weeks.push(currentWeek);
                currentWeek = new Array(7).fill(null);
              }
            });
            if (currentWeek.some(d => d !== null)) {
              weeks.push(currentWeek);
            }

            return (
              <div key={mIndex} className="flex flex-col gap-2">
                <div className="text-[10px] text-muted-foreground text-center h-[16px]">
                  {format(monthStart, 'MMM')}
                </div>
                <div className="flex gap-[2px]">
                  {weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-[2px]">
                      {week.map((day: Date | null, dIndex: number) => {
                        if (!day) return <div key={dIndex} className="w-3 h-3" />; // Empty slot

                        const dateKey = format(day, 'yyyy-MM-dd');
                        const pnl = pnlMap.get(dateKey);

                        return (
                          <TooltipProvider key={dateKey}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleDayClick(day)}
                                  className={cn(
                                    "w-3 h-3 rounded-[1px] transition-all duration-200 cursor-pointer transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1", 
                                    getColorClass(pnl),
                                    onDayClick ? "hover:shadow-sm" : "cursor-default"
                                  )}
                                  disabled={!onDayClick}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1 min-w-[180px]">
                                  <p className="font-semibold text-center">{formatDate(day, settings)}</p>
                                  <div className="border-t pt-1">
                                    <p className={cn(
                                      "font-medium text-center",
                                      pnl && pnl > 0 ? "text-emerald-500" : pnl && pnl < 0 ? "text-red-500" : "text-muted-foreground"
                                    )}>
                                      {pnl ? (pnl > 0 ? '+' : '') + formatCurrency(Math.abs(pnl), settings) : 'No Activity'}
                                    </p>
                                    {pnl && (
                                      <p className="text-muted-foreground text-center text-[10px]">
                                        {Math.abs(pnl) > maxProfit * 0.5 ? '🎯 Big win!' : 
                                         Math.abs(pnl) > maxLoss * 0.5 ? '⚠️ Major loss' :
                                         pnl > 0 ? '✅ Positive day' : '❌ Loss day'}
                                      </p>
                                    )}
                                    {onDayClick && (
                                      <p className="text-[10px] text-blue-400 text-center mt-1 font-medium">
                                        📊 Click to analyze
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-2 px-1 text-[10px] text-muted-foreground sticky left-0 bg-transparent">
        <span>Less</span>
        <div className="flex gap-[2px]">
          <div className="w-3 h-3 rounded-[1px] bg-red-200 dark:bg-red-900/40" />
          <div className="w-3 h-3 rounded-[1px] bg-red-300 dark:bg-red-700/60" />
          <div className="w-3 h-3 rounded-[1px] bg-red-500 dark:bg-red-600" />
          <div className="w-3 h-3 rounded-[1px] bg-gray-100 dark:bg-muted/40" />
          <div className="w-3 h-3 rounded-[1px] bg-emerald-200 dark:bg-emerald-900/40" />
          <div className="w-3 h-3 rounded-[1px] bg-emerald-300 dark:bg-emerald-700/60" />
          <div className="w-3 h-3 rounded-[1px] bg-emerald-500 dark:bg-emerald-500" />
        </div>
        <span>More</span>
      </div>
      </div>
    </div>
  );

  if (className?.includes('no-card')) {
    return <div className={cn(className, "block")}>{content}</div>;
  }

  return (
    <Card className={cn("border-0 shadow-none", className)}>
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-base font-medium">PnL Activity</CardTitle>
        <CardDescription>{data.length} trading days recorded</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {content}
      </CardContent>
    </Card>
  );
}
