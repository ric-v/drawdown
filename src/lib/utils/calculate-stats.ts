import { DailyPnL, PortfolioStats, EquityPoint } from '@/types/trading';

/**
 * Consolidate multiple entries for the same date into a single entry
 */
const consolidateDailyPnL = (dailyPnL: DailyPnL[]): DailyPnL[] => {
  const consolidatedMap = new Map<string, DailyPnL>();

  dailyPnL.forEach(entry => {
    const dateKey = new Date(entry.date).toDateString();

    if (consolidatedMap.has(dateKey)) {
      const existing = consolidatedMap.get(dateKey)!;
      existing.pnl += entry.pnl;
      if (entry.notes) {
        existing.notes = existing.notes ? `${existing.notes}; ${entry.notes}` : entry.notes;
      }
    } else {
      consolidatedMap.set(dateKey, { ...entry });
    }
  });

  return Array.from(consolidatedMap.values()).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

/**
 * Generate equity curve data from daily PnL
 * Client-side version that can run instantly without API call
 */
export const generateEquityData = (dailyPnL: DailyPnL[], initialCapital: number): EquityPoint[] => {
  const consolidatedPnL = consolidateDailyPnL(dailyPnL);

  const equityData: EquityPoint[] = [];
  let equity = initialCapital;

  consolidatedPnL.forEach(entry => {
    equity += entry.pnl;
    const pnlPercentage = initialCapital > 0 ? ((equity - initialCapital) / initialCapital) * 100 : 0;
    const entryDate = new Date(entry.date);
    const dateStr = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    equityData.push({
      date: entryDate.toISOString().split('T')[0],
      displayDate: dateStr,
      equity: Math.round(equity),
      pnl: Math.round(entry.pnl),
      pnlPercentage: parseFloat(pnlPercentage.toFixed(2)),
    });
  });

  return equityData;
};

/**
 * Calculate portfolio statistics from daily PnL data
 * Client-side version that can run instantly without API call
 */
export const calculatePortfolioStats = (dailyPnL: DailyPnL[], initialCapital: number): PortfolioStats => {
  const consolidatedPnL = consolidateDailyPnL(dailyPnL);

  const profitDays = consolidatedPnL.filter(d => d.pnl > 0);
  const lossDays = consolidatedPnL.filter(d => d.pnl < 0);

  const totalPnL = consolidatedPnL.reduce((sum, d) => sum + d.pnl, 0);
  const currentEquity = initialCapital + totalPnL;

  const grossProfit = profitDays.reduce((sum, d) => sum + d.pnl, 0);
  const grossLoss = lossDays.reduce((sum, d) => sum + d.pnl, 0);

  const averageProfit = profitDays.length > 0 ? grossProfit / profitDays.length : 0;
  const averageLoss = lossDays.length > 0 ? grossLoss / lossDays.length : 0;

  // Profit Factor
  const profitFactor = Math.abs(grossLoss) > 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? Infinity : 0;

  // Expectancy
  const totalTrades = consolidatedPnL.length;
  const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;

  // Max Drawdown
  let maxEquity = initialCapital;
  let maxDrawdownVal = 0;
  let currentEq = initialCapital;
  let maxDrawdownPct = 0;

  const chronologicalPnL = [...consolidatedPnL].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  chronologicalPnL.forEach(trade => {
    currentEq += trade.pnl;
    if (currentEq > maxEquity) {
      maxEquity = currentEq;
    }
    const drawdown = maxEquity - currentEq;
    if (drawdown > maxDrawdownVal) {
      maxDrawdownVal = drawdown;
      maxDrawdownPct = maxEquity > 0 ? (drawdown / maxEquity) * 100 : 0;
    }
  });

  // Current Streak
  const sortedByDateDesc = [...consolidatedPnL].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let currentStreak = 0;
  if (sortedByDateDesc.length > 0) {
    const firstPnl = sortedByDateDesc[0].pnl;
    if (firstPnl !== 0) {
      const isWin = firstPnl > 0;
      for (const trade of sortedByDateDesc) {
        if ((isWin && trade.pnl > 0) || (!isWin && trade.pnl < 0)) {
          currentStreak += isWin ? 1 : -1;
        } else {
          break;
        }
      }
    }
  }

  return {
    totalPnL,
    totalPnLPercentage: initialCapital > 0 ? (totalPnL / initialCapital) * 100 : 0,
    winRate: dailyPnL.length > 0 ? (profitDays.length / dailyPnL.length) * 100 : 0,
    totalDays: dailyPnL.length,
    profitDays: profitDays.length,
    lossDays: lossDays.length,
    averageProfit,
    averageLoss,
    largestProfit: dailyPnL.length > 0 ? Math.max(...dailyPnL.map(d => d.pnl)) : 0,
    largestLoss: dailyPnL.length > 0 ? Math.min(...dailyPnL.map(d => d.pnl)) : 0,
    currentEquity,
    initialCapital,
    profitFactor,
    expectancy,
    maxDrawdown: maxDrawdownPct,
    currentStreak
  };
};
