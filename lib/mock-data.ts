import { Transaction, EquityPoint, PortfolioStats } from '@/types/trading';

/**
 * Mock data generator for the trading dashboard
 */

export const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [
    {
      id: '1',
      date: new Date('2024-12-01'),
      symbol: 'AAPL',
      type: 'BUY',
      quantity: 100,
      price: 182.50,
      totalValue: 18250,
    },
    {
      id: '2',
      date: new Date('2024-12-03'),
      symbol: 'AAPL',
      type: 'SELL',
      quantity: 100,
      price: 185.20,
      totalValue: 18520,
      pnl: 270,
      pnlPercentage: 1.48,
    },
    {
      id: '3',
      date: new Date('2024-12-04'),
      symbol: 'MSFT',
      type: 'BUY',
      quantity: 50,
      price: 378.90,
      totalValue: 18945,
    },
    {
      id: '4',
      date: new Date('2024-12-05'),
      symbol: 'MSFT',
      type: 'SELL',
      quantity: 50,
      price: 382.40,
      totalValue: 19120,
      pnl: 175,
      pnlPercentage: 0.92,
    },
    {
      id: '5',
      date: new Date('2024-12-06'),
      symbol: 'GOOGL',
      type: 'BUY',
      quantity: 75,
      price: 142.30,
      totalValue: 10672.50,
    },
    {
      id: '6',
      date: new Date('2024-12-07'),
      symbol: 'GOOGL',
      type: 'SELL',
      quantity: 75,
      price: 140.80,
      totalValue: 10560,
      pnl: -112.50,
      pnlPercentage: -1.05,
    },
    {
      id: '7',
      date: new Date('2024-12-08'),
      symbol: 'TSLA',
      type: 'BUY',
      quantity: 40,
      price: 242.80,
      totalValue: 9712,
    },
    {
      id: '8',
      date: new Date('2024-12-09'),
      symbol: 'TSLA',
      type: 'SELL',
      quantity: 40,
      price: 248.50,
      totalValue: 9940,
      pnl: 228,
      pnlPercentage: 2.35,
    },
    {
      id: '9',
      date: new Date('2024-12-10'),
      symbol: 'NVDA',
      type: 'BUY',
      quantity: 30,
      price: 505.20,
      totalValue: 15156,
    },
    {
      id: '10',
      date: new Date('2024-12-11'),
      symbol: 'NVDA',
      type: 'SELL',
      quantity: 30,
      price: 512.80,
      totalValue: 15384,
      pnl: 228,
      pnlPercentage: 1.50,
    },
  ];

  return transactions;
};

export const generateEquityData = (): EquityPoint[] => {
  const startDate = new Date('2024-12-01');
  const data: EquityPoint[] = [];
  let equity = 100000; // Starting capital

  const dailyReturns = [0, 0.27, 0.18, -0.15, 0.32, -0.11, 0.25, 0.19, -0.08, 0.22, 0.15];

  for (let i = 0; i < dailyReturns.length; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const pnlPercentage = dailyReturns[i];
    const pnl = equity * (pnlPercentage / 100);
    equity += pnl;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      equity: Math.round(equity),
      pnl: Math.round(pnl),
      pnlPercentage: parseFloat(pnlPercentage.toFixed(2)),
    });
  }

  return data;
};

export const generatePortfolioStats = (): PortfolioStats => {
  const transactions = generateMockTransactions();
  const completedTrades = transactions.filter(t => t.pnl !== undefined);
  
  const winningTrades = completedTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = completedTrades.filter(t => (t.pnl || 0) < 0);
  
  const totalPnL = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const initialCapital = 100000;
  const currentEquity = initialCapital + totalPnL;
  
  const averageWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
    : 0;
  
  const averageLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length
    : 0;

  return {
    totalPnL,
    totalPnLPercentage: (totalPnL / initialCapital) * 100,
    winRate: completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0,
    totalTrades: completedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    averageWin,
    averageLoss,
    largestWin: Math.max(...completedTrades.map(t => t.pnl || 0)),
    largestLoss: Math.min(...completedTrades.map(t => t.pnl || 0)),
    currentEquity,
    initialCapital,
  };
};
