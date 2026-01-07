'use client';

import { useSettings } from '@/hooks/use-settings';
import { formatCurrency, formatCurrencyShort, formatDate, formatPercentage, getCurrencySymbol } from '@/lib/utils/format-settings';

/**
 * Component to display formatted currency
 */
export function FormattedCurrency({
  value,
  short = false,
  decimals,
}: {
  value: number;
  short?: boolean;
  decimals?: number;
}) {
  const { settings } = useSettings();

  if (!settings)
    return <span>{short ? '₹0' : '₹0.00'}</span>;

  return (
    <span>
      {short ? formatCurrencyShort(value, settings) : formatCurrency(value, settings, { decimals })}
    </span>
  );
}

/**
 * Component to display formatted date
 */
export function FormattedDate({ date }: { date: Date | string }) {
  const { settings } = useSettings();

  if (!date) return <span>—</span>;
  
  if (!settings) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return <span>{dateObj.toLocaleDateString()}</span>;
  }

  return <span>{formatDate(date, settings)}</span>;
}

/**
 * Component to display formatted percentage
 */
export function FormattedPercentage({ 
  value, 
  decimals 
}: { 
  value: number; 
  decimals?: number;
}) {
  const { settings } = useSettings();

  if (!settings) return <span>{value >= 0 ? '+' : ''}{value.toFixed(decimals ?? 2)}%</span>;

  return <span>{formatPercentage(value, settings, { decimals })}</span>;
}

/**
 * Component to get currency symbol
 */
export function CurrencySymbol() {
  const { settings } = useSettings();
  if (!settings) return <span>₹</span>;
  return <span>{getCurrencySymbol(settings)}</span>;
}
