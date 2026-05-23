// Feature: ui-overhaul-ai-insights, Property 12: AI insight list invariants under append, delete, and retry

import * as fc from 'fast-check';
import {
  appendInsightCard,
  deleteInsightCard,
  retryInsightCard,
  MAX_INSIGHT_CARDS,
  StoredInsightCard,
} from '../insight-list';
import type { RedactedSnapshot, InsightType, AIProvider } from '../types';

/**
 * Validates: Requirements 10.7, 10.9, 10.10
 *
 * Property 12: AI insight list invariants under append, delete, and retry
 *
 * For any sequence of insight-card append, delete, and retry operations against
 * a per-type InsightCard[] store, the post-state SHALL satisfy:
 * - list length is at most 20
 * - ordering is most-recent-first by createdAt
 * - deletion of id x produces a list with all entries having id === x removed
 * - a retry of any failed card SHALL reissue a request with a RedactedSnapshot
 *   deep-equal to the snapshot of the original request
 */

// --- Generators ---

// Generate valid ISO date strings using integer timestamps to avoid Invalid Date issues
const isoDateStringArb: fc.Arbitrary<string> = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2025-12-31').getTime(),
}).map((ts) => new Date(ts).toISOString());

const insightTypeArb: fc.Arbitrary<InsightType> = fc.constantFrom(
  'performance-summary',
  'risk-review',
  'trade-pattern-analysis',
);

const aiProviderArb: fc.Arbitrary<AIProvider> = fc.constantFrom(
  'openai',
  'anthropic',
  'gemini',
);

const redactedSnapshotArb: fc.Arbitrary<RedactedSnapshot> = fc.record({
  insightType: insightTypeArb,
  dateRange: fc.record({
    from: isoDateStringArb,
    to: isoDateStringArb,
  }),
  currency: fc.constantFrom('INR' as const, 'USD' as const, 'EUR' as const),
});

const storedInsightCardArb: fc.Arbitrary<StoredInsightCard> = fc.record({
  id: fc.uuid(),
  insightType: insightTypeArb,
  status: fc.constantFrom('success' as const, 'error' as const),
  provider: aiProviderArb,
  model: fc.string({ minLength: 1, maxLength: 20 }),
  contentMarkdown: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  errorMessage: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  tokenCount: fc.option(fc.nat({ max: 10000 }), { nil: undefined }),
  createdAt: isoDateStringArb,
  snapshot: fc.option(redactedSnapshotArb, { nil: undefined }),
});

const insightListArb = fc.array(storedInsightCardArb, { minLength: 0, maxLength: 25 });

// --- Property Tests ---

describe('Property 12: AI insight list invariants under append, delete, and retry', () => {
  describe('appendInsightCard', () => {
    it('result length is always <= MAX_INSIGHT_CARDS (20)', () => {
      fc.assert(
        fc.property(insightListArb, storedInsightCardArb, (list, card) => {
          const result = appendInsightCard(list, card);
          expect(result.length).toBeLessThanOrEqual(MAX_INSIGHT_CARDS);
        }),
        { numRuns: 100 },
      );
    });

    it('result is always sorted most-recent-first by createdAt', () => {
      fc.assert(
        fc.property(insightListArb, storedInsightCardArb, (list, card) => {
          const result = appendInsightCard(list, card);
          for (let i = 1; i < result.length; i++) {
            const prev = new Date(result[i - 1].createdAt).getTime();
            const curr = new Date(result[i].createdAt).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
          }
        }),
        { numRuns: 100 },
      );
    });

    it('the new card is always present in the result (unless it is the oldest and list was already at max)', () => {
      fc.assert(
        fc.property(insightListArb, storedInsightCardArb, (list, card) => {
          const result = appendInsightCard(list, card);
          const cardPresent = result.some((c) => c.id === card.id);

          if (!cardPresent) {
            // The card was evicted — it must be the oldest in the combined set
            // and the list must have been trimmed to MAX_INSIGHT_CARDS
            expect(result.length).toBe(MAX_INSIGHT_CARDS);
            // All items in result should have createdAt >= card.createdAt
            const cardTime = new Date(card.createdAt).getTime();
            for (const item of result) {
              expect(new Date(item.createdAt).getTime()).toBeGreaterThanOrEqual(cardTime);
            }
          }
        }),
        { numRuns: 100 },
      );
    });

    it('is immutable — original list is unchanged', () => {
      fc.assert(
        fc.property(insightListArb, storedInsightCardArb, (list, card) => {
          const originalCopy = JSON.parse(JSON.stringify(list));
          appendInsightCard(list, card);
          expect(list).toEqual(originalCopy);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('deleteInsightCard', () => {
    it('result never contains a card with the deleted id', () => {
      fc.assert(
        fc.property(insightListArb, fc.uuid(), (list, id) => {
          const result = deleteInsightCard(list, id);
          expect(result.every((c) => c.id !== id)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it('result length is <= original length', () => {
      fc.assert(
        fc.property(insightListArb, fc.uuid(), (list, id) => {
          const result = deleteInsightCard(list, id);
          expect(result.length).toBeLessThanOrEqual(list.length);
        }),
        { numRuns: 100 },
      );
    });

    it('is immutable — original list is unchanged', () => {
      fc.assert(
        fc.property(insightListArb, fc.uuid(), (list, id) => {
          const originalCopy = JSON.parse(JSON.stringify(list));
          deleteInsightCard(list, id);
          expect(list).toEqual(originalCopy);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('retryInsightCard', () => {
    it('returns the original snapshot when card exists with snapshot', () => {
      fc.assert(
        fc.property(
          insightListArb,
          storedInsightCardArb.filter((c) => c.snapshot !== undefined),
          (list, cardWithSnapshot) => {
            const listWithCard = [...list, cardWithSnapshot];
            const result = retryInsightCard(listWithCard, cardWithSnapshot.id);
            expect(result).toEqual(cardWithSnapshot.snapshot);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('returns null when card does not exist', () => {
      fc.assert(
        fc.property(insightListArb, fc.uuid(), (list, nonExistentId) => {
          // Ensure the id doesn't exist in the list
          const filteredList = list.filter((c) => c.id !== nonExistentId);
          const result = retryInsightCard(filteredList, nonExistentId);
          expect(result).toBeNull();
        }),
        { numRuns: 100 },
      );
    });
  });
});
