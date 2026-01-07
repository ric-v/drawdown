import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @deprecated Use formatCurrency from @/lib/utils/format-settings instead for settings-aware formatting
 */
export function formatCurrency(amount: number, withSign: boolean = false): string {
  const formatted = `₹${Math.abs(amount).toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
  
  if (!withSign) return formatted;
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * @deprecated Use formatPercentage from @/lib/utils/format-settings instead for settings-aware formatting
 */
export function formatPercentage(value: number, withSign: boolean = false): string {
  const formatted = `${Math.abs(value).toFixed(2)}%`;
  
  if (!withSign) return formatted;
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

export function getColorClass(value: number): string {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-rose-600 dark:text-rose-400';
  return 'text-gray-500 dark:text-gray-400';
}
