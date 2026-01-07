import { formatCurrency, formatPercentage, getColorClass } from '@/lib/utils/utils';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format positive currency correctly', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00');
    });

    it('should format negative currency correctly', () => {
      expect(formatCurrency(-1500)).toBe('₹1,500.00');
    });

    it('should add sign when withSign is true', () => {
      expect(formatCurrency(2000, true)).toBe('+₹2,000.00');
      expect(formatCurrency(-2000, true)).toBe('-₹2,000.00');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('₹0.00');
      expect(formatCurrency(0, true)).toBe('₹0.00');
    });

    it('should handle decimal values', () => {
      expect(formatCurrency(1234.567)).toBe('₹1,234.57');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentage correctly', () => {
      expect(formatPercentage(25.5)).toBe('25.50%');
    });

    it('should format negative percentage correctly', () => {
      expect(formatPercentage(-15.25)).toBe('15.25%');
    });

    it('should add sign when withSign is true', () => {
      expect(formatPercentage(10, true)).toBe('+10.00%');
      expect(formatPercentage(-10, true)).toBe('-10.00%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.00%');
      expect(formatPercentage(0, true)).toBe('0.00%');
    });
  });

  describe('getColorClass', () => {
    it('should return green class for positive values', () => {
      expect(getColorClass(100)).toBe('text-emerald-600 dark:text-emerald-400');
    });

    it('should return red class for negative values', () => {
      expect(getColorClass(-100)).toBe('text-rose-600 dark:text-rose-400');
    });

    it('should return gray class for zero', () => {
      expect(getColorClass(0)).toBe('text-gray-500 dark:text-gray-400');
    });
  });
});
