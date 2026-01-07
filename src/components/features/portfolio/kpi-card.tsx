import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, getColorClass } from '@/lib/utils/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { formatCurrency, formatPercentage } from '@/lib/utils/format-settings';

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
  const { settings } = useSettings();
  // Determine numeric value for color coding
  const valueForColor = numericValue ?? (typeof value === 'number' ? value : 0);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Calm red/green palette for profit/loss
  const trendColor = trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500';
  const bgColor = trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-500/10' : trend === 'down' ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-gray-50 dark:bg-gray-500/10';

  return (
    <Card className="group relative border-gray-200/60 dark:border-slate-700/60 bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-slate-800/95 dark:via-slate-850/95 dark:to-slate-800/95 backdrop-blur-xl hover:shadow-2xl hover:shadow-gray-300/30 dark:hover:shadow-black/40 hover:scale-[1.03] hover:border-gray-300/80 dark:hover:border-slate-600/80 transition-all duration-500 ease-out rounded-2xl overflow-hidden">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-blue-500/5 dark:group-hover:from-blue-500/10 dark:group-hover:via-purple-500/10 dark:group-hover:to-blue-500/10 transition-all duration-500 rounded-2xl" />
      
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 p-5 md:p-6 pb-3 md:pb-4">
        <CardTitle className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-[0.15em] letter-spacing-wider">
          {title}
        </CardTitle>
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-md group-hover:shadow-lg group-hover:scale-110",
          bgColor
        )}>
          <TrendIcon className={cn("h-5 w-5 transition-transform duration-500 group-hover:scale-110", trendColor)} />
        </div>
      </CardHeader>
      <CardContent className="relative p-5 md:p-6 pt-0">
        <div className={cn(
          "text-2xl sm:text-3xl font-bold truncate mb-2 tracking-tight",
          (isCurrency || isPercentage) && getColorClass(valueForColor)
        )}>
          {typeof value === 'string' ? value : (
            isCurrency ? `${value >= 0 ? '+' : '-'}${formatCurrency(Math.abs(value), settings)}` :
              isPercentage ? `${value >= 0 ? '+' : ''}${formatPercentage(Math.abs(value), settings, { asDecimal: true })}%` :
                (settings ? Math.abs(value).toLocaleString(settings.numberFormat === 'indian' ? 'en-IN' : 'en-US') : value.toLocaleString())
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-2 tracking-wide">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
