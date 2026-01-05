import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatPercentage, getColorClass } from '@/lib/utils/utils';
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

  // Calm red/green palette for profit/loss
  const trendColor = trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500';
  const bgColor = trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-500/10' : trend === 'down' ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-gray-50 dark:bg-gray-500/10';

  const formatINR = (amount: number, withSign: boolean = false) => {
    const formatted = `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (!withSign) return formatted;
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <Card className="border-gray-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-5 pb-2 md:pb-3">
        <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {title}
        </CardTitle>
        <div className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
          bgColor
        )}>
          <TrendIcon className={cn("h-4 w-4", trendColor)} />
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-5 pt-0">
        <div className={cn(
          "text-xl sm:text-2xl font-bold truncate mb-1",
          (isCurrency || isPercentage) && getColorClass(valueForColor)
        )}>
          {typeof value === 'string' ? value : (
            isCurrency ? formatINR(value, true) :
              isPercentage ? formatPercentage(value, true) :
                value.toLocaleString()
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1.5">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
