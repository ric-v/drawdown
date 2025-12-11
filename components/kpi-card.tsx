import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency, formatPercentage, getColorClass } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  isCurrency?: boolean;
  isPercentage?: boolean;
  numericValue?: number;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend = 'neutral',
  isCurrency = false,
  isPercentage = false,
  numericValue,
}: KPICardProps) {
  // Determine numeric value for color coding
  const valueForColor = numericValue ?? (typeof value === 'number' ? value : 0);
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';

  const formatINR = (amount: number, withSign: boolean = false) => {
    const formatted = `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (!withSign) return formatted;
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black border-gray-200 dark:border-gray-800 overflow-hidden relative">
      {/* Gradient accent bar */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
        trend === 'up' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
        trend === 'down' ? 'bg-gradient-to-r from-red-400 to-red-600' : 
        'bg-gradient-to-r from-gray-400 to-gray-600'
      )} />
      
      <CardHeader className="pb-2 pt-5">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{title}</span>
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-950' : 
            trend === 'down' ? 'bg-red-100 dark:bg-red-950' : 
            'bg-gray-100 dark:bg-gray-800'
          )}>
            <TrendIcon className={cn('h-4 w-4', trendColor)} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-5">
        <div className={cn(
          'text-xl md:text-2xl font-bold mb-2 transition-colors',
          isCurrency || isPercentage ? getColorClass(valueForColor) : 'text-gray-900 dark:text-gray-100'
        )}>
          {typeof value === 'string' ? value : (
            isCurrency ? formatINR(value, true) :
            isPercentage ? formatPercentage(value, true) :
            value.toLocaleString()
          )}
        </div>
        {subtitle && (
          <p className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
