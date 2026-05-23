'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InsightType } from '@/lib/ai/types';

const LABELS: Record<InsightType, string> = {
  'performance-summary': 'Performance Summary',
  'risk-review': 'Risk Review',
  'trade-pattern-analysis': 'Trade Patterns',
};

interface GenerateButtonProps {
  insightType: InsightType;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export function GenerateButton({ insightType, disabled, loading, onClick }: GenerateButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className="gap-1.5 text-xs"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      {LABELS[insightType]}
    </Button>
  );
}
