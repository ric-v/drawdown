import type { InsightCard, RedactedSnapshot } from './types';

/**
 * Maximum number of insight cards retained per list.
 * Requirement 10.9: persist the most recent 20 InsightCards per insight type.
 */
export const MAX_INSIGHT_CARDS = 20;

/**
 * An InsightCard stored with its original RedactedSnapshot for retry support.
 * The snapshot is preserved so that retrying a failed card can reissue
 * the request with the identical payload (Property 12, Requirement 10.7).
 */
export interface StoredInsightCard extends InsightCard {
  /** The redacted snapshot used for the original request. Preserved for retry. */
  snapshot?: RedactedSnapshot;
}

/**
 * Appends a new insight card to the list, enforcing:
 * - Maximum length of 20 (FIFO eviction of oldest cards)
 * - Ordering most-recent-first by `createdAt`
 *
 * Returns a new array (immutable operation).
 *
 * Validates: Requirements 10.7, 10.9
 */
export function appendInsightCard(
  list: StoredInsightCard[],
  card: StoredInsightCard,
): StoredInsightCard[] {
  // Insert the new card and sort most-recent-first by createdAt
  const updated = [card, ...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Enforce max length by trimming oldest entries
  return updated.slice(0, MAX_INSIGHT_CARDS);
}

/**
 * Deletes all insight cards with the given id from the list.
 * Returns a new array with matching entries removed.
 *
 * Validates: Requirement 10.10
 */
export function deleteInsightCard(
  list: StoredInsightCard[],
  id: string,
): StoredInsightCard[] {
  return list.filter((card) => card.id !== id);
}

/**
 * Prepares a retry for a failed insight card by locating it in the list
 * and returning the original RedactedSnapshot for resubmission.
 *
 * Returns the original snapshot if the card exists and has one stored,
 * or null if the card is not found or has no snapshot.
 *
 * The retry operation preserves the original RedactedSnapshot so the
 * reissued request is identical to the original (Property 12, Requirement 10.7).
 */
export function retryInsightCard(
  list: StoredInsightCard[],
  id: string,
): RedactedSnapshot | null {
  const card = list.find((c) => c.id === id);
  if (!card || !card.snapshot) {
    return null;
  }
  return card.snapshot;
}
