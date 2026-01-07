/**
 * Settings formatting utilities
 * Provides functions to format currency and dates based on user settings
 */

import { format, parse } from 'date-fns';
import { UserSettings } from '@/types/settings';

/**
 * Format currency value based on user settings
 */
export function formatCurrency(
  value: number,
  settings: UserSettings | null,
  options?: { decimals?: number }
): string {
  const decimals = options?.decimals ?? settings?.trading?.decimalsForPnL ?? 2;
  const currency = settings?.currency ?? 'INR';
  const numberFormat = settings?.numberFormat ?? 'indian';

  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
  };

  // Use appropriate locale for number formatting
  const locale = numberFormat === 'indian' ? 'en-IN' : 'en-US';
  const formatted = Math.abs(value).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const symbol = symbols[currency] || currency;

  return `${value < 0 ? '-' : ''}${symbol}${formatted}`;
}

/**
 * Format currency for display (shortened with k/M/L/Cr based on number format)
 */
export function formatCurrencyShort(
  value: number,
  settings: UserSettings | null
): string {
  const currency = settings?.currency ?? 'INR';
  const numberFormat = settings?.numberFormat ?? 'indian';
  
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
  };
  const symbol = symbols[currency] || currency;

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (numberFormat === 'indian') {
    // Indian number system: Lakhs (100,000) and Crores (10,000,000)
    if (absValue >= 10000000) {
      return `${sign}${symbol}${(absValue / 10000000).toFixed(2)}Cr`;
    }
    if (absValue >= 100000) {
      return `${sign}${symbol}${(absValue / 100000).toFixed(2)}L`;
    }
    if (absValue >= 1000) {
      return `${sign}${symbol}${(absValue / 1000).toFixed(1)}k`;
    }
  } else {
    // Western number system: Thousands, Millions, Billions
    if (absValue >= 1000000000) {
      return `${sign}${symbol}${(absValue / 1000000000).toFixed(2)}B`;
    }
    if (absValue >= 1000000) {
      return `${sign}${symbol}${(absValue / 1000000).toFixed(2)}M`;
    }
    if (absValue >= 1000) {
      return `${sign}${symbol}${(absValue / 1000).toFixed(1)}k`;
    }
  }
  
  return `${sign}${symbol}${absValue.toFixed(0)}`;
}

/**
 * Parse date string based on user's date format setting
 */
export function parseDate(
  dateString: string,
  settings: UserSettings | null
): Date | null {
  const dateFormat = settings?.dateFormat ?? 'DD/MM/YYYY';
  try {
    return parse(dateString, dateFormat, new Date());
  } catch (error) {
    console.error('Failed to parse date:', error);
    return null;
  }
}

/**
 * Format date based on user's date format setting
 */
export function formatDate(
  date: Date | string,
  settings: UserSettings | null
): string {
  const dateFormatSetting = settings?.dateFormat ?? 'DD/MM/YYYY';
  
  // Safely convert to Date object
  let dateObj: Date;
  if (typeof date === 'string') {
    // Handle ISO string or other formats
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '';
  }

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date:', date);
    return '';
  }

  // Convert user-facing format to date-fns format
  // DD/MM/YYYY -> dd/MM/yyyy
  // MM/DD/YYYY -> MM/dd/yyyy
  // YYYY-MM-DD -> yyyy-MM-dd
  // DD.MM.YYYY -> dd.MM.yyyy
  // DD-MM-YYYY -> dd-MM-yyyy
  // MMM DD, YYYY -> MMM dd, yyyy
  // DD MMM YYYY -> dd MMM yyyy
  // MMMM DD, YYYY -> MMMM dd, yyyy
  const formatPatternMap: Record<string, string> = {
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'MM/DD/YYYY': 'MM/dd/yyyy',
    'YYYY-MM-DD': 'yyyy-MM-dd',
    'DD.MM.YYYY': 'dd.MM.yyyy',
    'DD-MM-YYYY': 'dd-MM-yyyy',
    'MMM DD, YYYY': 'MMM dd, yyyy',
    'DD MMM YYYY': 'dd MMM yyyy',
    'MMMM DD, YYYY': 'MMMM dd, yyyy',
  };
  
  const dateFormat = formatPatternMap[dateFormatSetting] || 'dd/MM/yyyy';

  try {
    return format(dateObj, dateFormat);
  } catch (error) {
    console.error('Failed to format date:', error, { date, dateFormat });
    // Fallback to locale string
    return dateObj.toLocaleDateString();
  }
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(settings: UserSettings | null): string {
  const currency = settings?.currency ?? 'INR';
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
  };
  return symbols[currency] || currency;
}

/**
 * Format percentage based on settings
 */
export function formatPercentage(
  value: number,
  settings: UserSettings | null,
  options?: { asDecimal?: boolean; decimals?: number }
): string {
  const decimals = options?.decimals ?? settings?.trading?.decimalsForPnL ?? 2;
  const asDecimal = options?.asDecimal ?? false;
  
  // For decimal display (e.g., profit factor: 2.45 instead of 2.45%)
  if (asDecimal) {
    return value.toFixed(decimals);
  }
  
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}
