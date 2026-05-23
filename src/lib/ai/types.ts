import type { PortfolioStats } from '@/types/trading';

/**
 * Supported AI provider identifiers for the BYOK integration.
 */
export type AIProvider = 'openai' | 'anthropic' | 'gemini';

/**
 * Supported insight request types that can be generated.
 */
export type InsightType =
  | 'performance-summary'
  | 'risk-review'
  | 'trade-pattern-analysis';

/**
 * Represents a pending or completed insight request.
 */
export interface InsightRequest {
  id: string;
  insightType: InsightType;
  provider: AIProvider;
  model: string;
  requestedAt: string; // ISO 8601
}

/**
 * A persisted insight card rendered in the AI Insights section.
 * Status discriminates between success (with markdown content) and error (with message).
 */
export interface InsightCard {
  id: string;
  insightType: InsightType;
  status: 'success' | 'error';
  provider: AIProvider;
  model: string;
  contentMarkdown?: string; // present when status === 'success'
  errorMessage?: string; // present when status === 'error'
  tokenCount?: number; // present only when provider returned usage
  createdAt: string; // ISO 8601
}

/**
 * A PII-stripped snapshot of portfolio data sent to the AI provider.
 * Only fields relevant to the requested insight type are populated.
 */
export interface RedactedSnapshot {
  insightType: InsightType;
  dateRange: { from: string; to: string }; // ISO 8601
  currency: 'INR' | 'USD' | 'EUR';
  // Performance Summary
  dailyPnL?: Array<{ date: string; pnl: number; notes?: string }>;
  portfolioStats?: PortfolioStats;
  // Risk Review
  drawdownSeries?: number[];
  currentStreak?: number;
  profitFactor?: number;
  expectancy?: number;
  // Trade Pattern Analysis
  perDayPnL?: Array<{ date: string; pnl: number }>;
  notes?: string[];
}

/**
 * Typed error returned by AI provider interactions.
 */
export interface AIError {
  type: 'auth' | 'rate_limit' | 'server' | 'network' | 'timeout' | 'unknown';
  message: string;
  retryAfterSeconds?: number;
  provider: AIProvider;
}

/**
 * Fields that must never appear in payloads sent to AI providers.
 * Used by the redaction utility to strip PII at any nesting depth.
 */
export const PII_FIELD_DENYLIST = [
  'email',
  'displayName',
  'name',
  'sub',
  'subject',
  'picture',
  'avatar',
  'accountId',
  'userId',
  'id',
] as const;
