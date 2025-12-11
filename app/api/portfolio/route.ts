import { NextResponse } from 'next/server';
import { DailyPnL, PortfolioStats, EquityPoint } from '@/types/trading';
import { getCosmosContainer, initCosmosDB } from '@/lib/cosmosdb';

interface PortfolioData {
  dailyPnL: DailyPnL[];
  initialCapital: number;
  lastUpdated: string | null;
}

// Initialize Cosmos DB on first call
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await initCosmosDB();
    initialized = true;
  }
}

const readData = async (): Promise<PortfolioData> => {
  await ensureInitialized();
  const container = await getCosmosContainer();
  
  // Fetch all daily P&L entries
  const { resources: pnlDocs } = await container.items
    .query({
      query: "SELECT * FROM c WHERE c.type = 'dailyPnL' ORDER BY c.date DESC"
    })
    .fetchAll();
  
  // Fetch config (initial capital)
  const { resources: configDocs } = await container.items
    .query({
      query: "SELECT * FROM c WHERE c.type = 'config' AND c.id = 'config'"
    })
    .fetchAll();
  
  const dailyPnL = pnlDocs.map((doc: any) => ({
    id: doc.id,
    date: new Date(doc.date),
    pnl: doc.pnl,
    notes: doc.notes
  }));
  
  const initialCapital = configDocs[0]?.initialCapital || 100000;
  const lastUpdated = configDocs[0]?.lastUpdated || null;
  
  return { dailyPnL, initialCapital, lastUpdated };
};

const writeConfig = async (initialCapital: number, lastUpdated: string) => {
  await ensureInitialized();
  const container = await getCosmosContainer();
  
  await container.items.upsert({
    id: 'config',
    type: 'config',
    initialCapital,
    lastUpdated
  });
};

const writeDailyPnL = async (entry: DailyPnL) => {
  await ensureInitialized();
  const container = await getCosmosContainer();
  
  await container.items.upsert({
    id: entry.id,
    type: 'dailyPnL',
    date: entry.date.toISOString(),
    pnl: entry.pnl,
    notes: entry.notes
  });
};

const deleteDailyPnL = async (id: string) => {
  await ensureInitialized();
  const container = await getCosmosContainer();
  
  await container.item(id, 'dailyPnL').delete();
};

const calculatePortfolioStats = (dailyPnL: DailyPnL[], initialCapital: number): PortfolioStats => {
  const consolidatedPnL = consolidateDailyPnL(dailyPnL);
  
  const profitDays = consolidatedPnL.filter(d => d.pnl > 0);
  const lossDays = consolidatedPnL.filter(d => d.pnl < 0);
  
  const totalPnL = consolidatedPnL.reduce((sum, d) => sum + d.pnl, 0);
  const currentEquity = initialCapital + totalPnL;
  
  const averageProfit = profitDays.length > 0
    ? profitDays.reduce((sum, d) => sum + d.pnl, 0) / profitDays.length
    : 0;
  
  const averageLoss = lossDays.length > 0
    ? lossDays.reduce((sum, d) => sum + d.pnl, 0) / lossDays.length
    : 0;

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
    const { searchParams } = new URL(request.url);
    const consolidated = searchParams.get('consolidated') !== 'false';
    
    const data = await readData();
    const dailyPnLToReturn = consolidated ? consolidateDailyPnL(data.dailyPnL) : data.dailyPnL;
    const stats = calculatePortfolioStats(data.dailyPnL, data.initialCapital);
    const equityData = generateEquityData(data.dailyPnL, data.initialCapital);
    
    return NextResponse.json({
      dailyPnL: dailyPnLToReturn,
      stats,
      equityData,
      initialCapital: data.initialCapital,
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
    const body = await request.json();
    const { date, pnl, notes } = body;
    
    if (!date || pnl === undefined) {
      return NextResponse.json(
        { error: 'Date and PnL are required' },
        { status: 400 }
      );
    }
    
    const newEntry: DailyPnL = {
      id: `pnl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date(date),
      pnl: parseFloat(pnl),
      notes: notes || '',
    };
    
    await writeDailyPnL(newEntry);
    const data = await readData();
    await writeConfig(data.initialCapital, new Date().toISOString());
    
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
    await ensureInitialized();
    const container = await getCosmosContainer();
    
    // Delete all daily P&L entries
    const { resources: pnlDocs } = await container.items
      .query({
        query: "SELECT c.id FROM c WHERE c.type = 'dailyPnL'"
      })
      .fetchAll();
    
    for (const doc of pnlDocs) {
      await container.item(doc.id, 'dailyPnL').delete();
    }
    
    const data = await readData();
    await writeConfig(data.initialCapital, new Date().toISOString());
    
    return NextResponse.json({
      message: 'All data cleared successfully',
      dailyPnL: [],
      stats: calculatePortfolioStats([], data.initialCapital),
      equityData: []
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
  }
}
