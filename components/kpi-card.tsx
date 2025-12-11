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

  return (
    <Card className="hover:border-gray-700 transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <TrendIcon className={cn('h-4 w-4', trendColor)} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          'text-3xl font-bold mb-1',
          isCurrency || isPercentage ? getColorClass(valueForColor) : 'text-gray-100'
        )}>
          {typeof value === 'string' ? value : (
            isCurrency ? formatCurrency(value, true) :
            isPercentage ? formatPercentage(value, true) :
            value.toLocaleString()
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
