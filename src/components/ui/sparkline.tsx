'use client';

import * as React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/utils';

const sparklineVariants = cva('', {
  variants: {
    variant: {
      positive: '',
      negative: '',
      neutral: '',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

const variantColorMap = {
  positive: 'var(--positive)',
  negative: 'var(--negative)',
  neutral: 'var(--neutral)',
} as const;

export interface SparklineProps
  extends VariantProps<typeof sparklineVariants> {
  data: number[];
  variant: 'positive' | 'negative' | 'neutral';
  ariaLabel: string;
  className?: string;
}

export function Sparkline({ data, variant, ariaLabel, className }: SparklineProps) {
  const chartData = React.useMemo(
    () => data.map((value, index) => ({ index, value })),
    [data]
  );

  const colorToken = variantColorMap[variant];
  const strokeColor = `hsl(${colorToken})`;
  const fillColor = `hsl(${colorToken} / 0.2)`;

  return (
    <div
      className={cn(sparklineVariants({ variant }), className)}
      style={{ width: '100%', height: 32 }}
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height={32}>
        <AreaChart
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            fill={fillColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { sparklineVariants, variantColorMap };
