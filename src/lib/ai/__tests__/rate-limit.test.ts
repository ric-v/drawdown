import {
  RateLimitState,
  RateLimitEvent,
  rateLimitReducer,
  parseRetryAfter,
  createInitialRateLimitState,
  isGenerateDisabled,
} from '../rate-limit';

describe('rateLimitReducer', () => {
  const baseState: RateLimitState = {
    cooldownUntil: 0,
    todayCount: 0,
    lastResetIso: '2024-06-15',
    softLimitHit: false,
    softLimitAcknowledged: false,
  };

  // Use a fixed timestamp for 2024-06-15 12:00:00 local time
  const noon = new Date(2024, 5, 15, 12, 0, 0).getTime();

  describe('request_completed', () => {
    it('increments todayCount', () => {
      const event: RateLimitEvent = { type: 'request_completed', at: noon };
      const result = rateLimitReducer(baseState, event, undefined);
      expect(result.todayCount).toBe(1);
    });

    it('sets softLimitHit when count reaches soft limit', () => {
      const state = { ...baseState, todayCount: 4 };
      const event: RateLimitEvent = { type: 'request_completed', at: noon };
      const result = rateLimitReducer(state, event, 5);
      expect(result.todayCount).toBe(5);
      expect(result.softLimitHit).toBe(true);
    });

    it('sets softLimitHit when count exceeds soft limit', () => {
      const state = { ...baseState, todayCount: 5 };
      const event: RateLimitEvent = { type: 'request_completed', at: noon };
      const result = rateLimitReducer(state, event, 5);
      expect(result.todayCount).toBe(6);
      expect(result.softLimitHit).toBe(true);
    });

    it('does not set softLimitHit when no soft limit configured', () => {
      const state = { ...baseState, todayCount: 999 };
      const event: RateLimitEvent = { type: 'request_completed', at: noon };
      const result = rateLimitReducer(state, event, undefined);
      expect(result.softLimitHit).toBe(false);
    });

    it('resets softLimitAcknowledged when limit is hit', () => {
      const state = { ...baseState, todayCount: 4, softLimitAcknowledged: true };
      const event: RateLimitEvent = { type: 'request_completed', at: noon };
      const result = rateLimitReducer(state, event, 5);
      expect(result.softLimitHit).toBe(true);
      expect(result.softLimitAcknowledged).toBe(false);
    });
  });

  describe('rate_limited', () => {
    it('sets cooldownUntil using retryAfterSeconds', () => {
      const event: RateLimitEvent = {
        type: 'rate_limited',
        retryAfterSeconds: 30,
        at: noon,
      };
      const result = rateLimitReducer(baseState, event, undefined);
      expect(result.cooldownUntil).toBe(noon + 30 * 1000);
    });

    it('uses default 60s cooldown when retryAfterSeconds is null', () => {
      const event: RateLimitEvent = {
        type: 'rate_limited',
        retryAfterSeconds: null,
        at: noon,
      };
      const result = rateLimitReducer(baseState, event, undefined);
      expect(result.cooldownUntil).toBe(noon + 60 * 1000);
    });
  });

  describe('soft_limit_acknowledged', () => {
    it('sets softLimitAcknowledged to true', () => {
      const state = { ...baseState, softLimitHit: true, softLimitAcknowledged: false };
      const event: RateLimitEvent = { type: 'soft_limit_acknowledged', at: noon };
      const result = rateLimitReducer(state, event, 5);
      expect(result.softLimitAcknowledged).toBe(true);
    });
  });

  describe('tick', () => {
    it('returns state unchanged when no day boundary crossed', () => {
      const event: RateLimitEvent = { type: 'tick', at: noon };
      const result = rateLimitReducer(baseState, event, undefined);
      expect(result).toEqual(baseState);
    });
  });

  describe('day-boundary reset', () => {
    it('resets todayCount, softLimitHit, and softLimitAcknowledged on new day', () => {
      const state: RateLimitState = {
        cooldownUntil: 0,
        todayCount: 10,
        lastResetIso: '2024-06-15',
        softLimitHit: true,
        softLimitAcknowledged: true,
      };
      // Next day at noon
      const nextDayNoon = new Date(2024, 5, 16, 12, 0, 0).getTime();
      const event: RateLimitEvent = { type: 'tick', at: nextDayNoon };
      const result = rateLimitReducer(state, event, 5);
      expect(result.todayCount).toBe(0);
      expect(result.lastResetIso).toBe('2024-06-16');
      expect(result.softLimitHit).toBe(false);
      expect(result.softLimitAcknowledged).toBe(false);
    });

    it('preserves cooldownUntil across day boundary', () => {
      const futureCooldown = new Date(2024, 5, 16, 12, 1, 0).getTime();
      const state: RateLimitState = {
        cooldownUntil: futureCooldown,
        todayCount: 5,
        lastResetIso: '2024-06-15',
        softLimitHit: true,
        softLimitAcknowledged: false,
      };
      const nextDayNoon = new Date(2024, 5, 16, 12, 0, 0).getTime();
      const event: RateLimitEvent = { type: 'tick', at: nextDayNoon };
      const result = rateLimitReducer(state, event, 5);
      expect(result.cooldownUntil).toBe(futureCooldown);
    });

    it('resets on day boundary then processes request_completed', () => {
      const state: RateLimitState = {
        cooldownUntil: 0,
        todayCount: 10,
        lastResetIso: '2024-06-15',
        softLimitHit: true,
        softLimitAcknowledged: true,
      };
      const nextDayNoon = new Date(2024, 5, 16, 12, 0, 0).getTime();
      const event: RateLimitEvent = { type: 'request_completed', at: nextDayNoon };
      const result = rateLimitReducer(state, event, 5);
      // After reset: todayCount=0, then +1 from request_completed
      expect(result.todayCount).toBe(1);
      expect(result.lastResetIso).toBe('2024-06-16');
      expect(result.softLimitHit).toBe(false);
    });
  });
});

describe('isGenerateDisabled', () => {
  const baseState: RateLimitState = {
    cooldownUntil: 0,
    todayCount: 0,
    lastResetIso: '2024-06-15',
    softLimitHit: false,
    softLimitAcknowledged: false,
  };

  const now = Date.now();

  it('returns false when no conditions are met', () => {
    expect(isGenerateDisabled(baseState, now, false)).toBe(false);
  });

  it('returns true when cooldown is active', () => {
    const state = { ...baseState, cooldownUntil: now + 10000 };
    expect(isGenerateDisabled(state, now, false)).toBe(true);
  });

  it('returns false when cooldown has expired', () => {
    const state = { ...baseState, cooldownUntil: now - 1 };
    expect(isGenerateDisabled(state, now, false)).toBe(false);
  });

  it('returns true when soft limit hit and not acknowledged', () => {
    const state = { ...baseState, softLimitHit: true, softLimitAcknowledged: false };
    expect(isGenerateDisabled(state, now, false)).toBe(true);
  });

  it('returns false when soft limit hit but acknowledged', () => {
    const state = { ...baseState, softLimitHit: true, softLimitAcknowledged: true };
    expect(isGenerateDisabled(state, now, false)).toBe(false);
  });

  it('returns true when request is in flight', () => {
    expect(isGenerateDisabled(baseState, now, true)).toBe(true);
  });
});

describe('parseRetryAfter', () => {
  it('returns integer seconds from a numeric string', () => {
    const headers = new Headers({ 'retry-after': '120' });
    expect(parseRetryAfter(headers)).toBe(120);
  });

  it('returns null for empty header', () => {
    const headers = new Headers();
    expect(parseRetryAfter(headers)).toBeNull();
  });

  it('returns null for whitespace-only header', () => {
    const headers = new Headers({ 'retry-after': '   ' });
    expect(parseRetryAfter(headers)).toBeNull();
  });

  it('returns 0 for "0"', () => {
    const headers = new Headers({ 'retry-after': '0' });
    expect(parseRetryAfter(headers)).toBe(0);
  });

  it('parses HTTP-date format', () => {
    const futureDate = new Date(Date.now() + 30000).toUTCString();
    const headers = new Headers({ 'retry-after': futureDate });
    const result = parseRetryAfter(headers);
    expect(result).not.toBeNull();
    // Should be approximately 30 seconds (allow some tolerance)
    expect(result!).toBeGreaterThanOrEqual(28);
    expect(result!).toBeLessThanOrEqual(31);
  });

  it('returns 0 for past HTTP-date', () => {
    const pastDate = new Date(Date.now() - 60000).toUTCString();
    const headers = new Headers({ 'retry-after': pastDate });
    expect(parseRetryAfter(headers)).toBe(0);
  });

  it('returns null for unparseable value', () => {
    const headers = new Headers({ 'retry-after': 'not-a-number-or-date' });
    expect(parseRetryAfter(headers)).toBeNull();
  });

  it('works with plain object headers (case-insensitive lookup)', () => {
    expect(parseRetryAfter({ 'retry-after': '45' })).toBe(45);
    expect(parseRetryAfter({ 'Retry-After': '90' })).toBe(90);
  });

  it('returns null when header is undefined in plain object', () => {
    expect(parseRetryAfter({})).toBeNull();
  });
});

describe('createInitialRateLimitState', () => {
  it('creates state with zero counts and current date', () => {
    const now = new Date(2024, 5, 15, 12, 0, 0).getTime();
    const state = createInitialRateLimitState(now);
    expect(state.cooldownUntil).toBe(0);
    expect(state.todayCount).toBe(0);
    expect(state.lastResetIso).toBe('2024-06-15');
    expect(state.softLimitHit).toBe(false);
    expect(state.softLimitAcknowledged).toBe(false);
  });
});
