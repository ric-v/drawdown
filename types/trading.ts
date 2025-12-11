/**
 * Trading PnL Tracker Types
 * TypeScript interfaces for the trading dashboard
 */

export interface DailyPnL {
  id: string;
  date: Date;
  pnl: number; // Profit (+ve) or Loss (-ve) in INR
  notes?: string;
}

export interface FundTransaction {
  id: string;
  date: Date;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  notes?: string;
}

export interface EquityPoint {
  date: string; // ISO date string (YYYY-MM-DD) for filtering
  displayDate?: string; // Formatted date for display
  equity: number;
  pnl: number;
  pnlPercentage: number;
}

export interface PortfolioStats {
  totalPnL: number;
  totalPnLPercentage: number;
  winRate: number;
  totalDays: number;
  profitDays: number;
  lossDays: number;
  averageProfit: number;
  averageLoss: number;
  largestProfit: number;
  largestLoss: number;
  currentEquity: number;
  initialCapital: number;
}

// Keeping for backward compatibility
export interface Transaction extends DailyPnL {
  symbol?: string;
  type?: 'BUY' | 'SELL';
  quantity?: number;
  price?: number;
  totalValue?: number;
  pnlPercentage?: number;
}

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  isPercentage?: boolean;
  isCurrency?: boolean;
}
