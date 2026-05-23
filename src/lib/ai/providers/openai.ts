import type { RedactedSnapshot, AIError } from '../types';
import { parseRetryAfter } from '../rate-limit';
import { SYSTEM_PROMPT, INSIGHT_PROMPTS } from '../prompts';

/**
 * Response shape returned by all AI provider clients on successful generation.
 */
export interface AIClientResponse {
  contentMarkdown: string;
  tokenCount?: number;
  modelUsed: string;
}

/**
 * Unified AI client interface implemented by each provider.
 */
export interface AIClient {
  testConnection(): Promise<{ ok: true; modelName: string } | { ok: false; reason: string }>;
  generate(
    snapshot: RedactedSnapshot,
    opts: { signal: AbortSignal },
  ): Promise<AIClientResponse>;
}

/**
 * Constructs a typed AIError for the OpenAI provider.
 */
function makeError(
  type: AIError['type'],
  message: string,
  retryAfterSeconds?: number,
): AIError {
  return { type, message, retryAfterSeconds, provider: 'openai' };
}

/**
 * Factory that creates an OpenAI-compatible AIClient.
 *
 * - testConnection: POSTs a minimal request to validate the key; returns model name on success.
 * - generate: POSTs the redacted snapshot as a chat completion, parses the response.
 * - Error handling: 401 → 'auth', 429 → 'rate_limit' (parses Retry-After), 5xx → 'server', network → 'network'.
 *
 * Requirements: 9.4, 10.6, 10.7, 11.4, 11.5, 11.6, 11.7, 12.4, 12.5, 12.6
 */
export function createOpenAIClient(apiKey: string, model: string): AIClient {
  const baseUrl = 'https://api.openai.com/v1/chat/completions';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  return {
    async testConnection() {
      try {
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          }),
        });

        if (res.ok) {
          return { ok: true, modelName: model };
        }
        if (res.status === 401) {
          return { ok: false, reason: 'Authentication failed. Check your API key.' };
        }
        return { ok: false, reason: `Provider returned ${res.status}` };
      } catch {
        return { ok: false, reason: 'Network error' };
      }
    },

    async generate(snapshot, { signal }) {
      let res: Response;
      try {
        res = await fetch(baseUrl, {
          method: 'POST',
          headers,
          signal,
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: `${INSIGHT_PROMPTS[snapshot.insightType] ?? ''}\n\nData:\n${JSON.stringify(snapshot)}`,
              },
            ],
          }),
        });
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') {
          throw makeError('timeout', 'Request was cancelled');
        }
        const message =
          e instanceof Error ? e.message : 'Network error';
        throw makeError('network', message || 'Network error');
      }

      if (res.status === 401) {
        throw makeError('auth', 'Authentication failed');
      }

      if (res.status === 429) {
        const retryAfterSeconds = parseRetryAfter(res.headers) ?? undefined;
        throw makeError('rate_limit', 'Rate limited', retryAfterSeconds);
      }

      if (res.status >= 500) {
        throw makeError('server', `Server error ${res.status}`);
      }

      if (!res.ok) {
        throw makeError('unknown', `Unexpected status ${res.status}`);
      }

      const json = await res.json();
      return {
        contentMarkdown: json.choices?.[0]?.message?.content ?? '',
        tokenCount: json.usage?.total_tokens,
        modelUsed: json.model ?? model,
      };
    },
  };
}
