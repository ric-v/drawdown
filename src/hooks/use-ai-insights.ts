'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSettings } from './use-settings';
import type { InsightType, InsightCard, RedactedSnapshot } from '@/lib/ai/types';
import type { StoredInsightCard } from '@/lib/ai/insight-list';
import { appendInsightCard, deleteInsightCard, retryInsightCard } from '@/lib/ai/insight-list';
import { rateLimitReducer, createInitialRateLimitState, isGenerateDisabled, type RateLimitState, type RateLimitEvent } from '@/lib/ai/rate-limit';
import { getBYOKConfig } from '@/lib/byok/store';
import { decryptApiKey } from '@/lib/byok/crypto';

interface UseAIInsightsReturn {
  hasBYOK: boolean;
  cards: StoredInsightCard[];
  rateLimitState: RateLimitState;
  isDisabled: boolean;
  isLoading: boolean;
  consecutiveFailures: number;
  generate: (insightType: InsightType, snapshot: RedactedSnapshot) => Promise<void>;
  retry: (cardId: string) => Promise<void>;
  deleteCard: (cardId: string) => void;
  acknowledgeSoftLimit: () => void;
}

function rlReducerWrapper(state: RateLimitState, action: { event: RateLimitEvent; softLimit: number | undefined }): RateLimitState {
  return rateLimitReducer(state, action.event, action.softLimit);
}

export function useAIInsights(): UseAIInsightsReturn {
  const { data: session } = useSession();
  const { settings, updateSettings } = useSettings();
  const email = session?.user?.email ?? '';

  const [hasBYOK, setHasBYOK] = useState(false);
  const [cards, setCards] = useState<StoredInsightCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const softLimit = settings?.ai?.dailyRequestLimit;
  const [rlState, dispatchRL] = useReducer(rlReducerWrapper, createInitialRateLimitState());

  const abortRef = useRef<AbortController | null>(null);
  const keyRef = useRef<string | null>(null);

  // Load BYOK config and cards on mount
  useEffect(() => {
    if (!email) return;
    (async () => {
      const cfg = await getBYOKConfig(email);
      setHasBYOK(!!cfg);
      // Load persisted cards from settings
      const all: StoredInsightCard[] = [
        ...(settings?.ai?.insights?.performanceSummary ?? []),
        ...(settings?.ai?.insights?.riskReview ?? []),
        ...(settings?.ai?.insights?.tradePatternAnalysis ?? []),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCards(all);
    })();
  }, [email, settings?.ai?.insights]);

  // Cleanup on unmount — abort in-flight, zero key
  useEffect(() => () => {
    abortRef.current?.abort();
    keyRef.current = null;
  }, []);

  const isDisabled = isGenerateDisabled(rlState, Date.now(), isLoading);

  const persistCards = useCallback(async (updated: StoredInsightCard[]) => {
    const perf = updated.filter((c) => c.insightType === 'performance-summary').slice(0, 20);
    const risk = updated.filter((c) => c.insightType === 'risk-review').slice(0, 20);
    const trade = updated.filter((c) => c.insightType === 'trade-pattern-analysis').slice(0, 20);
    await updateSettings({ ai: { ...settings?.ai, insights: { performanceSummary: perf, riskReview: risk, tradePatternAnalysis: trade } } });
  }, [settings, updateSettings]);

  const generate = useCallback(async (insightType: InsightType, snapshot: RedactedSnapshot) => {
    if (isLoading) return; // Reject while in-flight (req 10.12)
    if (!email) return;

    const cfg = await getBYOKConfig(email);
    if (!cfg) return;

    // Decrypt key lazily
    if (!keyRef.current) {
      keyRef.current = await decryptApiKey(cfg.apiKey, email);
    }

    setIsLoading(true);
    abortRef.current = new AbortController();

    try {
      const { getAIClient } = await import('@/lib/ai/client');
      const client = await getAIClient(cfg.aiProvider, keyRef.current, cfg.aiModel);
      const result = await client.generate(snapshot, { signal: abortRef.current.signal });

      const card: StoredInsightCard = {
        id: crypto.randomUUID(),
        insightType,
        status: 'success',
        provider: cfg.aiProvider,
        model: result.modelUsed,
        contentMarkdown: result.contentMarkdown,
        tokenCount: result.tokenCount,
        createdAt: new Date().toISOString(),
        snapshot,
      };

      const updated = appendInsightCard(cards, card);
      setCards(updated);
      await persistCards(updated);
      setConsecutiveFailures(0);
      dispatchRL({ event: { type: 'request_completed', at: Date.now() }, softLimit });
    } catch (err: any) {
      const errorCard: StoredInsightCard = {
        id: crypto.randomUUID(),
        insightType,
        status: 'error',
        provider: cfg.aiProvider,
        model: cfg.aiModel,
        errorMessage: err?.message ?? 'Unknown error',
        createdAt: new Date().toISOString(),
        snapshot,
      };

      const updated = appendInsightCard(cards, errorCard);
      setCards(updated);
      await persistCards(updated);
      setConsecutiveFailures((c) => c + 1);

      if (err?.type === 'rate_limit') {
        dispatchRL({ event: { type: 'rate_limited', retryAfterSeconds: err.retryAfterSeconds ?? null, at: Date.now() }, softLimit });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [email, cards, isLoading, persistCards, softLimit]);

  const retry = useCallback(async (cardId: string) => {
    const snapshot = retryInsightCard(cards, cardId);
    if (!snapshot) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    await generate(card.insightType, snapshot);
  }, [cards, generate]);

  const deleteCard = useCallback((cardId: string) => {
    const updated = deleteInsightCard(cards, cardId);
    setCards(updated);
    persistCards(updated);
  }, [cards, persistCards]);

  const acknowledgeSoftLimit = useCallback(() => {
    dispatchRL({ event: { type: 'soft_limit_acknowledged', at: Date.now() }, softLimit });
  }, [softLimit]);

  return { hasBYOK, cards, rateLimitState: rlState, isDisabled, isLoading, consecutiveFailures, generate, retry, deleteCard, acknowledgeSoftLimit };
}
