import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { DailyPnL, PortfolioStats, EquityPoint } from '@/types/trading';
import * as GoogleDrive from '@/lib/google-drive';
import * as OneDrive from '@/lib/onedrive';
import { getCachedPortfolio, setCachedPortfolio } from '@/lib/local-cache';

interface PortfolioData {
  dailyPnL: DailyPnL[];
  fundTransactions: any[];
  initialCapital: number;
  lastUpdated: string;
}

/**
 * Read portfolio data from appropriate cloud storage based on provider
 */
const readData = async (accessToken: string, provider: string): Promise<PortfolioData> => {
  try {
    let data;
    
    if (provider === 'google') {
      data = await GoogleDrive.readPortfolioData(accessToken);
    } else if (provider === 'microsoft-entra-id') {
      data = await OneDrive.readPortfolioData(accessToken);
    } else {
      throw new Error('Unsupported provider');
    }

    if (!data) {
      // Return empty portfolio if file doesn't exist
      return {
        dailyPnL: [],
        fundTransactions: [],
        initialCapital: 100000,
        lastUpdated: new Date().toISOString()
      };
    }

    // Convert date strings back to Date objects
    const dailyPnL = data.dailyPnL.map((entry: any) => ({
      ...entry,
      date: new Date(entry.date)
    }));

    return {
      dailyPnL,
      fundTransactions: data.fundTransactions || [],
      initialCapital: data.initialCapital,
      lastUpdated: data.lastUpdated
    };
  } catch (error) {
    console.error('Error reading portfolio data:', error);
    // Return empty portfolio on error
    return {
      dailyPnL: [],
      fundTransactions: [],
      initialCapital: 100000,
      lastUpdated: new Date().toISOString()
    };
  }
};

const calculatePortfolioStats = (dailyPnL: DailyPnL[], initialCapital: number): PortfolioStats => {
  const consolidatedPnL = consolidateDailyPnL(dailyPnL);

  const profitDays = consolidatedPnL.filter(d => d.pnl > 0);
  const lossDays = consolidatedPnL.filter(d => d.pnl < 0); // Strictly less than 0

  const totalPnL = consolidatedPnL.reduce((sum, d) => sum + d.pnl, 0);
  const currentEquity = initialCapital + totalPnL;

  const grossProfit = profitDays.reduce((sum, d) => sum + d.pnl, 0);
  const grossLoss = lossDays.reduce((sum, d) => sum + d.pnl, 0);

  const averageProfit = profitDays.length > 0 ? grossProfit / profitDays.length : 0;
  const averageLoss = lossDays.length > 0 ? grossLoss / lossDays.length : 0;

  // Advanced KPIs
  // Profit Factor
  const profitFactor = Math.abs(grossLoss) > 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? Infinity : 0;

  // Expectancy (Average P&L per trade)
  // Formula: (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
  // Note: averageLoss is negative, so we add it directly: (Win% * AvgWin) + (Loss% * AvgLoss) -> NO.
  // Standard formula: (Prob Win * Avg Win) - (Prob Loss * Abs(Avg Loss))
  // Or simply: Total PnL / Total Trades
  const totalTrades = consolidatedPnL.length;
  const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;

  // Max Drawdown
  let maxEquity = initialCapital;
  let minEquityAfterMax = initialCapital;
  let maxDrawdownVal = 0; // In currency
  let currentEq = initialCapital;
  let maxDrawdownPct = 0;

  // Iterate chronologically
  const chronologicalPnL = [...consolidatedPnL].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  chronologicalPnL.forEach(trade => {
    currentEq += trade.pnl;
    if (currentEq > maxEquity) {
      maxEquity = currentEq;
    }
    const drawdown = maxEquity - currentEq;
    if (drawdown > maxDrawdownVal) {
      maxDrawdownVal = drawdown;
      // Calculate percentage at this point relative to the peak
      maxDrawdownPct = maxEquity > 0 ? (drawdown / maxEquity) * 100 : 0;
    }
  });

  // Current Streak
  // Sort descending by date to find current streak
  const sortedByDateDesc = [...consolidatedPnL].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

const generateEquityData = (dailyPnL: DailyPnL[], initialCapital: number): EquityPoint[] => {
  const consolidatedPnL = consolidateDailyPnL(dailyPnL);

  const equityData: EquityPoint[] = [];
  let equity = initialCapital;

  consolidatedPnL.forEach(entry => {
    equity += entry.pnl;
    const pnlPercentage = initialCapital > 0 ? ((equity - initialCapital) / initialCapital) * 100 : 0;
    const entryDate = new Date(entry.date);
    const dateStr = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    equityData.push({
      date: entryDate.toISOString().split('T')[0], // Store as YYYY-MM-DD for filtering
      displayDate: dateStr, // Keep formatted date for display
      equity: Math.round(equity),
      pnl: Math.round(entry.pnl),
      pnlPercentage: parseFloat(pnlPercentage.toFixed(2)),
    });
  });

  return equityData;
};

// GET: Retrieve all data
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || !session.accessToken || !session.provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const consolidated = searchParams.get('consolidated') !== 'false';
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const data = await readData(session.accessToken, session.provider);

    let filteredDailyPnL = data.dailyPnL;
    let adjustedInitialCapital = data.initialCapital;

    // Filter by date range if provided
    if (fromParam) {
      const fromDate = new Date(fromParam);
      fromDate.setHours(0, 0, 0, 0);

      // Calculate capital accumulated before the start date
      const previousEntries = data.dailyPnL.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate < fromDate;
      });

      const previousPnL = previousEntries.reduce((sum, entry) => sum + entry.pnl, 0);
      adjustedInitialCapital += previousPnL;

      // Filter entries within range
      filteredDailyPnL = data.dailyPnL.filter(entry => {
        const entryDate = new Date(entry.date);
        // Normalize entry date to start of day for accurate comparison
        const entryDateStart = new Date(entry.date);
        entryDateStart.setHours(0, 0, 0, 0);

        if (toParam) {
          const toDate = new Date(toParam);
          toDate.setHours(23, 59, 59, 999);
          return entryDateStart >= fromDate && entryDateStart <= toDate;
        }
        return entryDateStart >= fromDate;
      });
    }

    const dailyPnLToReturn = consolidated ? consolidateDailyPnL(filteredDailyPnL) : filteredDailyPnL;

    // Calculate stats for the selected period
    const stats = calculatePortfolioStats(filteredDailyPnL, adjustedInitialCapital);

    // Calculate global stats (All Time)
    const globalStats = calculatePortfolioStats(data.dailyPnL, data.initialCapital);

    const equityData = generateEquityData(filteredDailyPnL, adjustedInitialCapital);

    return NextResponse.json({
      dailyPnL: dailyPnLToReturn,
      stats,
      globalStats, // Return all-time stats separately
      equityData,
      initialCapital: adjustedInitialCapital, // Send the adjusted capital for the period
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('Error reading portfolio data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

// POST: Add new daily P&L entry
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || !session.accessToken || !session.provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json();
    const { date, pnl, notes } = body;

    if (!date || pnl === undefined) {
      return NextResponse.json(
        { error: 'Date and PnL are required' },
        { status: 400 }
      );
    }

    // Read existing data
    const data = await readData(session.accessToken, session.provider);

    // Create new entry
    const newEntry: DailyPnL = {
      id: `pnl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date(date),
      pnl: parseFloat(pnl),
      notes: notes || '',
    };

    // Add to existing data
    data.dailyPnL.push(newEntry);
    data.lastUpdated = new Date().toISOString();

    // Save back to cloud storage
    if (session.provider === 'google') {
      await GoogleDrive.savePortfolioData(session.accessToken, data);
    } else if (session.provider === 'microsoft-entra-id') {
      await OneDrive.savePortfolioData(session.accessToken, data);
    }

    const stats = calculatePortfolioStats(data.dailyPnL, data.initialCapital);
    const equityData = generateEquityData(data.dailyPnL, data.initialCapital);

    return NextResponse.json({
      dailyPnL: data.dailyPnL,
      stats,
      equityData,
      message: 'Daily P&L added successfully'
    });
  } catch (error) {
    console.error('Error adding daily P&L:', error);
    return NextResponse.json({ error: 'Failed to add daily P&L' }, { status: 500 });
  }
}

// DELETE: Clear all data
export async function DELETE() {
  try {
    // Check authentication
    const session = await auth()
    if (!session || !session.accessToken || !session.provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear data by saving empty portfolio
    const emptyData = {
      dailyPnL: [],
      fundTransactions: [],
      initialCapital: 100000,
      lastUpdated: new Date().toISOString()
    };

    if (session.provider === 'google') {
      await GoogleDrive.savePortfolioData(session.accessToken, emptyData);
    } else if (session.provider === 'microsoft-entra-id') {
      await OneDrive.savePortfolioData(session.accessToken, emptyData);
    }

    return NextResponse.json({
      message: 'All data cleared successfully',
      dailyPnL: [],
      stats: calculatePortfolioStats([], emptyData.initialCapital),
      equityData: []
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
  }
}
