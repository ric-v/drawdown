'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, WifiOff } from 'lucide-react';
import { useAIInsights } from '@/hooks/use-ai-insights';
import { BYOKEmptyState } from './byok-empty-state';
import { RateLimitBanner } from './rate-limit-banner';
import { GenerateButton } from './generate-button';
import { InsightCardView } from './insight-card';
import { InsightErrorCard } from './insight-error-card';
import type { InsightType, RedactedSnapshot } from '@/lib/ai/types';
import { useSettings } from '@/hooks/use-settings';

interface AIInsightsSectionProps {
  buildSnapshot: (insightType: InsightType) => RedactedSnapshot;
}

const INSIGHT_TYPES: InsightType[] = ['performance-summary', 'risk-review', 'trade-pattern-analysis'];

export function AIInsightsSection({ buildSnapshot }: AIInsightsSectionProps) {
  const { hasBYOK, cards, rateLimitState, isDisabled, isLoading, consecutiveFailures, generate, retry, deleteCard, acknowledgeSoftLimit } = useAIInsights();
  const { settings } = useSettings();
  const softLimit = settings?.ai?.dailyRequestLimit;

  // When no BYOK, render only the empty state — no provider modules imported
  if (!hasBYOK) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BYOKEmptyState />
        </CardContent>
      </Card>
    );
  }

  const handleGenerate = (type: InsightType) => {
    const snapshot = buildSnapshot(type);
    generate(type, snapshot);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> AI Insights
          </CardTitle>
          <span className="text-xs text-muted-foreground">{rateLimitState.todayCount} requests today</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <RateLimitBanner state={rateLimitState} softLimit={softLimit} onAcknowledge={acknowledgeSoftLimit} />

        {consecutiveFailures > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg border border-border px-3 py-2">
            <WifiOff className="h-3.5 w-3.5" />
            <span>AI provider unreachable ({consecutiveFailures} consecutive failures)</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {INSIGHT_TYPES.map((type) => (
            <GenerateButton
              key={type}
              insightType={type}
              disabled={isDisabled}
              loading={isLoading}
              onClick={() => handleGenerate(type)}
            />
          ))}
        </div>

        {cards.length > 0 && (
          <div className="space-y-2 mt-3">
            {cards.map((card) =>
              card.status === 'error' ? (
                <InsightErrorCard key={card.id} card={card} onRetry={retry} onDelete={deleteCard} />
              ) : (
                <InsightCardView key={card.id} card={card} onDelete={deleteCard} />
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
