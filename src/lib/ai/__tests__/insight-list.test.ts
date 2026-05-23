import {
  appendInsightCard,
  deleteInsightCard,
  retryInsightCard,
  MAX_INSIGHT_CARDS,
  StoredInsightCard,
} from '../insight-list';
import type { RedactedSnapshot } from '../types';

function makeCard(overrides: Partial<StoredInsightCard> = {}): StoredInsightCard {
  return {
    id: overrides.id ?? `card-${Math.random().toString(36).slice(2)}`,
    insightType: 'performance-summary',
    status: 'success',
    provider: 'openai',
    model: 'gpt-4',
    contentMarkdown: 'Some insight content',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<RedactedSnapshot> = {}): RedactedSnapshot {
  return {
    insightType: 'performance-summary',
    dateRange: { from: '2024-01-01', to: '2024-01-31' },
    currency: 'USD',
    ...overrides,
  };
}

describe('appendInsightCard', () => {
  it('appends a card to an empty list', () => {
    const card = makeCard({ id: 'c1', createdAt: '2024-06-01T10:00:00Z' });
    const result = appendInsightCard([], card);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(card);
  });

  it('maintains most-recent-first ordering by createdAt', () => {
    const older = makeCard({ id: 'c1', createdAt: '2024-06-01T08:00:00Z' });
    const newer = makeCard({ id: 'c2', createdAt: '2024-06-01T10:00:00Z' });
    const result = appendInsightCard([older], newer);
    expect(result[0].id).toBe('c2');
    expect(result[1].id).toBe('c1');
  });

  it('inserts a card with an older createdAt in the correct position', () => {
    const newest = makeCard({ id: 'c1', createdAt: '2024-06-03T10:00:00Z' });
    const middle = makeCard({ id: 'c2', createdAt: '2024-06-02T10:00:00Z' });
    const list = [newest, middle];
    const oldest = makeCard({ id: 'c3', createdAt: '2024-06-01T10:00:00Z' });
    const result = appendInsightCard(list, oldest);
    expect(result.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('enforces maximum length of 20 by evicting oldest cards', () => {
    const list: StoredInsightCard[] = [];
    for (let i = 0; i < 20; i++) {
      list.push(
        makeCard({
          id: `card-${i}`,
          createdAt: new Date(2024, 0, i + 1).toISOString(),
        }),
      );
    }
    // Sort most-recent-first
    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Append a new card that is the most recent
    const newCard = makeCard({
      id: 'card-new',
      createdAt: new Date(2024, 0, 25).toISOString(),
    });
    const result = appendInsightCard(list, newCard);

    expect(result).toHaveLength(MAX_INSIGHT_CARDS);
    expect(result[0].id).toBe('card-new');
    // The oldest card (card-0, Jan 1) should be evicted
    expect(result.find((c) => c.id === 'card-0')).toBeUndefined();
  });

  it('does not mutate the original list', () => {
    const card1 = makeCard({ id: 'c1', createdAt: '2024-06-01T10:00:00Z' });
    const original = [card1];
    const card2 = makeCard({ id: 'c2', createdAt: '2024-06-02T10:00:00Z' });
    appendInsightCard(original, card2);
    expect(original).toHaveLength(1);
    expect(original[0].id).toBe('c1');
  });

  it('preserves snapshot on appended card', () => {
    const snapshot = makeSnapshot();
    const card = makeCard({ id: 'c1', snapshot });
    const result = appendInsightCard([], card);
    expect(result[0].snapshot).toEqual(snapshot);
  });
});

describe('deleteInsightCard', () => {
  it('removes a card by id', () => {
    const card1 = makeCard({ id: 'c1' });
    const card2 = makeCard({ id: 'c2' });
    const result = deleteInsightCard([card1, card2], 'c1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c2');
  });

  it('returns the same list when id is not found', () => {
    const card1 = makeCard({ id: 'c1' });
    const result = deleteInsightCard([card1], 'nonexistent');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c1');
  });

  it('removes all entries with matching id (deduplication edge case)', () => {
    const card1 = makeCard({ id: 'dup' });
    const card2 = makeCard({ id: 'dup' });
    const card3 = makeCard({ id: 'other' });
    const result = deleteInsightCard([card1, card2, card3], 'dup');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('other');
  });

  it('returns an empty array when deleting from a single-item list', () => {
    const card = makeCard({ id: 'only' });
    const result = deleteInsightCard([card], 'only');
    expect(result).toHaveLength(0);
  });

  it('does not mutate the original list', () => {
    const card1 = makeCard({ id: 'c1' });
    const card2 = makeCard({ id: 'c2' });
    const original = [card1, card2];
    deleteInsightCard(original, 'c1');
    expect(original).toHaveLength(2);
  });
});

describe('retryInsightCard', () => {
  it('returns the snapshot for a card with a stored snapshot', () => {
    const snapshot = makeSnapshot({ currency: 'EUR' });
    const card = makeCard({ id: 'err1', status: 'error', snapshot });
    const result = retryInsightCard([card], 'err1');
    expect(result).toEqual(snapshot);
  });

  it('returns null when the card has no snapshot', () => {
    const card = makeCard({ id: 'err1', status: 'error' });
    const result = retryInsightCard([card], 'err1');
    expect(result).toBeNull();
  });

  it('returns null when the card id is not found', () => {
    const card = makeCard({ id: 'c1', snapshot: makeSnapshot() });
    const result = retryInsightCard([card], 'nonexistent');
    expect(result).toBeNull();
  });

  it('preserves the original RedactedSnapshot without modification', () => {
    const snapshot = makeSnapshot({
      insightType: 'risk-review',
      drawdownSeries: [0.1, 0.2, 0.3],
      currentStreak: 5,
      profitFactor: 1.8,
      expectancy: 42.5,
    });
    const card = makeCard({ id: 'retry-me', status: 'error', snapshot });
    const result = retryInsightCard([card], 'retry-me');
    expect(result).toEqual(snapshot);
    // Verify deep equality - the snapshot should be the exact same reference
    expect(result).toBe(card.snapshot);
  });

  it('returns null for an empty list', () => {
    const result = retryInsightCard([], 'any-id');
    expect(result).toBeNull();
  });
});
