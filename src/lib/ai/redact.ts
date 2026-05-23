import type { DailyPnL, PortfolioStats } from '@/types/trading';
import type { UserSettings } from '@/types/settings';
import { type InsightType, type RedactedSnapshot, PII_FIELD_DENYLIST } from './types';

/**
 * Raw inputs provided to the redaction function.
 * Contains all possible data that might be sent to an AI provider,
 * before filtering by insight type and stripping PII.
 */
export interface RawSnapshotInputs {
  insightType: InsightType;
  dateRange: { from: Date; to: Date };
  dailyPnL: DailyPnL[];
  stats: PortfolioStats;
  drawdownSeries: number[];
  currency: UserSettings['currency'];
  notes: string[];
}

/**
 * Per-insight-type allow-lists defining which top-level keys
 * (beyond the always-present base keys) are included in the output.
 */
const INSIGHT_ALLOW_LIST: Record<InsightType, ReadonlyArray<keyof RedactedSnapshot>> = {
  'performance-summary': [
    'insightType',
    'dateRange',
    'currency',
    'dailyPnL',
    'portfolioStats',
  ],
  'risk-review': [
    'insightType',
    'dateRange',
    'drawdownSeries',
    'currentStreak',
    'profitFactor',
    'expectancy',
  ],
  'trade-pattern-analysis': [
    'insightType',
    'dateRange',
    'perDayPnL',
    'notes',
  ],
};

/**
 * Recursively strips any key whose name appears in PII_FIELD_DENYLIST
 * from an object at any nesting depth. Returns a new object (does not mutate).
 *
 * - Arrays are traversed element-by-element.
 * - Primitives are returned as-is.
 * - Date objects are converted to ISO strings.
 */
function stripPII(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(stripPII);
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (!(PII_FIELD_DENYLIST as readonly string[]).includes(key)) {
        result[key] = stripPII(val);
      }
    }
    return result;
  }

  return value;
}

/**
 * Formats a Date to ISO 8601 date string (YYYY-MM-DD).
 */
function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Builds a PII-stripped, allow-list-filtered snapshot for the given insight type.
 *
 * Pure function — references no global session state.
 *
 * - Only top-level keys in the per-insightType allow-list are included.
 * - Any nested key whose name appears in PII_FIELD_DENYLIST is stripped at any depth.
 *
 * @param input - Raw snapshot inputs containing all portfolio data
 * @returns A RedactedSnapshot safe to send to an AI provider
 */
export function redactSnapshot(input: RawSnapshotInputs): RedactedSnapshot {
  const { insightType, dateRange, dailyPnL, stats, drawdownSeries, currency, notes } = input;

  // Build the full candidate snapshot with all possible fields
  const fullSnapshot: RedactedSnapshot = {
    insightType,
    dateRange: {
      from: toISODate(dateRange.from),
      to: toISODate(dateRange.to),
    },
    currency,
    // Performance Summary fields
    dailyPnL: dailyPnL.map((entry) => ({
      date: toISODate(entry.date),
      pnl: entry.pnl,
      ...(entry.notes !== undefined ? { notes: entry.notes } : {}),
    })),
    portfolioStats: stats,
    // Risk Review fields
    drawdownSeries,
    currentStreak: stats.currentStreak,
    profitFactor: stats.profitFactor,
    expectancy: stats.expectancy,
    // Trade Pattern Analysis fields
    perDayPnL: dailyPnL.map((entry) => ({
      date: toISODate(entry.date),
      pnl: entry.pnl,
    })),
    notes: notes.length > 0 ? notes : undefined,
  };

  // Filter to only allowed keys for this insight type
  const allowedKeys = INSIGHT_ALLOW_LIST[insightType];
  const filtered: Record<string, unknown> = {};

  for (const key of allowedKeys) {
    if (key in fullSnapshot && fullSnapshot[key] !== undefined) {
      filtered[key] = fullSnapshot[key];
    }
  }

  // Strip PII from the entire filtered object at any depth
  const redacted = stripPII(filtered) as RedactedSnapshot;

  return redacted;
}
