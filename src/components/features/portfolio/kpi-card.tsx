'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { Sparkline } from '@/components/ui/sparkline';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type KPIDirection, type DeltaTone, resolveDeltaTone } from '@/lib/utils/kpi';

const kpiCardVariants = cva(
  'relative rounded-xl border p-4 transition-all duration-200 motion-reduce:duration-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      tone: {
        positive: 'border-positive/20 bg-positive/5',
        negative: 'border-negative/20 bg-negative/5',
        neutral: 'border-border bg-card',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type KPIMetricId =
  | 'totalPnL'
  | 'winRate'
  | 'profitFactor'
  | 'expectancy'
  | 'maxDrawdown'
  | 'currentStreak'
  | 'averageWin'
  | 'averageLoss'
  | 'largestWin'
  | 'largestLoss'
  | 'currentEquity';

export interface KPICardProps extends VariantProps<typeof kpiCardVariants> {
  metricId: KPIMetricId;
  label: string;
  value: number | null;
  formatter: (value: number) => string;
  direction: KPIDirection;
  delta?: { absolute: number; percentage: number } | null;
  sparklineSeries?: number[];
  tooltip: string;
  error?: string;
}

export function KPICard({
  metricId,
  label,
  value,
  formatter,
  direction,
  delta,
  sparklineSeries,
  tooltip,
  error,
}: KPICardProps) {
  const deltaTone: DeltaTone = delta ? resolveDeltaTone(direction, delta.absolute) : 'neutral';
  const cardTone = value !== null && !error ? deltaTone : 'neutral';
  const errorId = `kpi-err-${metricId}`;

  const showValue = value !== null && !error;
  const showDelta = showValue && delta != null;
  const showSparkline = showValue && sparklineSeries != null && sparklineSeries.length > 1;

  const content = (
    <div
      className={cn(kpiCardVariants({ tone: cardTone }))}
      tabIndex={0}
      aria-label={label}
      aria-invalid={error ? 'true' : undefined}
      aria-errormessage={error ? errorId : undefined}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>

      <div className="mt-1 text-2xl font-bold truncate">
        {showValue ? formatter(value) : '—'}
      </div>

      {showDelta && (
        <div className={cn('flex items-center gap-1 mt-1 text-xs', `text-${deltaTone}`)}>
          {deltaTone === 'positive' && <TrendingUp className="h-3 w-3" />}
          {deltaTone === 'negative' && <TrendingDown className="h-3 w-3" />}
          {deltaTone === 'neutral' && <Minus className="h-3 w-3" />}
          <span>
            {delta!.absolute >= 0 ? '+' : ''}
            {delta!.absolute.toFixed(2)}
          </span>
          <span>
            ({delta!.percentage >= 0 ? '+' : ''}
            {delta!.percentage.toFixed(2)}%)
          </span>
        </div>
      )}

      {showSparkline && (
        <div className="mt-2">
          <Sparkline data={sparklineSeries!} variant={deltaTone} ariaLabel={`${label} trend`} />
        </div>
      )}

      {error && (
        <p id={errorId} className="sr-only">
          {error}
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { kpiCardVariants };
