/**
 * Trading PnL Tracker Types
 * TypeScript interfaces for the trading dashboard
 */

export interface Transaction {
  id: string;
  date: Date;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalValue: number;
  pnl?: number;
  pnlPercentage?: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  pnl: number;
  pnlPercentage: number;
}

export interface PortfolioStats {
  totalPnL: number;
  totalPnLPercentage: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  currentEquity: number;
  initialCapital: number;
}

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  isPercentage?: boolean;
  isCurrency?: boolean;
}
