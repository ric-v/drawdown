/**
 * User Settings Types
 * TypeScript interfaces for user preferences and settings
 */

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  currency: 'INR' | 'USD' | 'EUR';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD.MM.YYYY' | 'DD-MM-YYYY' | 'MMM DD, YYYY' | 'DD MMM YYYY' | 'MMMM DD, YYYY';
  numberFormat: 'indian' | 'western';
  defaultCapital: number;
  notifications: {
    emailNotifications: boolean;
    desktopNotifications: boolean;
    milestoneAlerts: boolean;
    dailySummary: boolean;
  };
  trading: {
    defaultPortfolioName: string;
    hideClosedTrades: boolean;
    showPnLPercentage: boolean;
    decimalsForPnL: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  theme?: 'light' | 'dark' | 'system';
  currency?: 'INR' | 'USD' | 'EUR';
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD.MM.YYYY' | 'DD-MM-YYYY' | 'MMM DD, YYYY' | 'DD MMM YYYY' | 'MMMM DD, YYYY';
  numberFormat?: 'indian' | 'western';
  defaultCapital?: number;
  notifications?: {
    emailNotifications?: boolean;
    desktopNotifications?: boolean;
    milestoneAlerts?: boolean;
    dailySummary?: boolean;
  };
  trading?: {
    defaultPortfolioName?: string;
    hideClosedTrades?: boolean;
    showPnLPercentage?: boolean;
    decimalsForPnL?: number;
  };
}

export type SettingsFormData = Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
