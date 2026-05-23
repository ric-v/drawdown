/**
 * Rate-limit reducer for AI Insights.
 *
 * Pure state machine managing cooldown windows, daily request counts,
 * and soft-limit acknowledgement. Day-boundary resets use local timezone.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */

/**
 * State shape for the rate-limit reducer.
 */
export interface RateLimitState {
  /** Epoch ms until which the generate control is disabled; 0 = no cooldown */
  cooldownUntil: number;
  /** Count of requests completed today (local timezone) */
  todayCount: number;
  /** ISO date string (YYYY-MM-DD) of the last reset day in local timezone */
  lastResetIso: string;
  /** Whether the soft limit has been reached today */
  softLimitHit: boolean;
  /** Whether the user has acknowledged the soft-limit warning today */
  softLimitAcknowledged: boolean;
}

/**
 * Events that drive the rate-limit state machine.
 */
export type RateLimitEvent =
  | { type: 'request_completed'; at: number }
  | { type: 'rate_limited'; retryAfterSeconds: number | null; at: number }
  | { type: 'soft_limit_acknowledged'; at: number }
  | { type: 'tick'; at: number };

/** Default cooldown in seconds when Retry-After header is absent (req 11.5) */
const DEFAULT_COOLDOWN_SECONDS = 60;

/**
 * Returns the local-timezone date string (YYYY-MM-DD) for a given epoch ms timestamp.
 */
function getLocalDateIso(epochMs: number): string {
  const d = new Date(epochMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Creates the initial rate-limit state.
 */
export function createInitialRateLimitState(now: number = Date.now()): RateLimitState {
  return {
    cooldownUntil: 0,
    todayCount: 0,
    lastResetIso: getLocalDateIso(now),
    softLimitHit: false,
    softLimitAcknowledged: false,
  };
}

/**
 * Applies a day-boundary reset if the event timestamp falls on a different
 * local-timezone calendar day than the last reset.
 */
function applyDayReset(state: RateLimitState, at: number): RateLimitState {
  const currentDay = getLocalDateIso(at);
  if (currentDay !== state.lastResetIso) {
    return {
      ...state,
      todayCount: 0,
      lastResetIso: currentDay,
      softLimitHit: false,
      softLimitAcknowledged: false,
    };
  }
  return state;
}

/**
 * Pure reducer for rate-limit state.
 *
 * Handles day-boundary resets, request counting, cooldown windows,
 * and soft-limit logic.
 *
 * @param state - Current rate-limit state
 * @param event - The event to process
 * @param softLimit - Optional daily request soft limit (1..10000)
 * @returns The new rate-limit state
 */
export function rateLimitReducer(
  state: RateLimitState,
  event: RateLimitEvent,
  softLimit: number | undefined,
): RateLimitState {
  // Always check for day-boundary reset first
  let current = applyDayReset(state, event.at);

  switch (event.type) {
    case 'request_completed': {
      const newCount = current.todayCount + 1;
      const hitLimit = softLimit !== undefined && newCount >= softLimit;
      return {
        ...current,
        todayCount: newCount,
        softLimitHit: hitLimit,
        // If the limit was just hit, reset acknowledgement so user must re-acknowledge
        softLimitAcknowledged: hitLimit ? false : current.softLimitAcknowledged,
      };
    }

    case 'rate_limited': {
      const cooldownSeconds = event.retryAfterSeconds ?? DEFAULT_COOLDOWN_SECONDS;
      return {
        ...current,
        cooldownUntil: event.at + cooldownSeconds * 1000,
      };
    }

    case 'soft_limit_acknowledged': {
      return {
        ...current,
        softLimitAcknowledged: true,
      };
    }

    case 'tick': {
      // Tick events are used to re-evaluate state (e.g., cooldown expiry).
      // Day reset is already applied above. No additional state changes needed.
      return current;
    }

    default:
      return current;
  }
}

/**
 * Derives the `disabled` flag for the generate control.
 *
 * The control is disabled when:
 * - A cooldown window is active (cooldownUntil > now)
 * - The soft limit has been hit but not acknowledged
 * - A request is currently in flight
 *
 * @param state - Current rate-limit state
 * @param now - Current epoch ms timestamp
 * @param requestInFlight - Whether a request is currently in progress
 * @returns Whether the generate control should be disabled
 */
export function isGenerateDisabled(
  state: RateLimitState,
  now: number,
  requestInFlight: boolean,
): boolean {
  return (
    state.cooldownUntil > now ||
    (state.softLimitHit && !state.softLimitAcknowledged) ||
    requestInFlight
  );
}

/**
 * Parses the `Retry-After` header from an HTTP response.
 *
 * Supports:
 * - Integer seconds (e.g., "60")
 * - HTTP-date format (e.g., "Wed, 21 Oct 2015 07:28:00 GMT")
 *
 * Returns the number of seconds to wait, or `null` if the header is
 * absent, empty, or unparseable.
 *
 * @param headers - Response headers (or a plain object / Map-like)
 * @returns Retry-after duration in seconds, or null
 */
export function parseRetryAfter(
  headers: Headers | Record<string, string | undefined | null>,
): number | null {
  let raw: string | undefined | null;

  if (headers instanceof Headers) {
    raw = headers.get('retry-after');
  } else {
    // Support case-insensitive lookup on plain objects
    raw =
      headers['retry-after'] ??
      headers['Retry-After'] ??
      headers['RETRY-AFTER'];
  }

  if (raw == null || raw.trim() === '') {
    return null;
  }

  const trimmed = raw.trim();

  // Try parsing as integer seconds first
  const asInt = Number(trimmed);
  if (Number.isFinite(asInt) && asInt >= 0 && String(Math.floor(asInt)) === trimmed) {
    return Math.floor(asInt);
  }

  // Try parsing as HTTP-date
  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    const secondsFromNow = Math.max(0, Math.ceil((dateMs - Date.now()) / 1000));
    return secondsFromNow;
  }

  return null;
}
