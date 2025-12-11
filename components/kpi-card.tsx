import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatPercentage, getColorClass } from '@/lib/utils';
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

  // For shadcn style, we might want to keep the icon color subtle or matching the theme
  // but keeping the semantic color (red/green) is good for financial apps.
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  const formatINR = (amount: number, withSign: boolean = false) => {
    const formatted = `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (!withSign) return formatted;
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1 md:pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center bg-muted/50"
        )}>
          <TrendIcon className={cn("h-3 w-3", trendColor)} />
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-4 pt-1">
        <div className={cn(
          "text-lg sm:text-xl font-bold truncate",
          (isCurrency || isPercentage) && getColorClass(valueForColor)
        )}>
          {typeof value === 'string' ? value : (
            isCurrency ? formatINR(value, true) :
              isPercentage ? formatPercentage(value, true) :
                value.toLocaleString()
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
