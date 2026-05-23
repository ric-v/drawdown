/**
 * User Settings Types
 * TypeScript interfaces for user preferences and settings
 */

import type { AIProvider, InsightCard } from '@/lib/ai/types';
import type { EncryptedKey } from '@/lib/byok/crypto';

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

  /** AI configuration — additive optional fields for BYOK integration */
  ai?: {
    aiProvider?: AIProvider;
    aiModel?: string;
    apiKey?: EncryptedKey;
    dailyRequestLimit?: number;
    insights?: {
      performanceSummary?: InsightCard[];
      riskReview?: InsightCard[];
      tradePatternAnalysis?: InsightCard[];
    };
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
  ai?: {
    aiProvider?: AIProvider;
    aiModel?: string;
    apiKey?: EncryptedKey;
    dailyRequestLimit?: number;
    insights?: {
      performanceSummary?: InsightCard[];
      riskReview?: InsightCard[];
      tradePatternAnalysis?: InsightCard[];
    };
  };
}

export type SettingsFormData = Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
