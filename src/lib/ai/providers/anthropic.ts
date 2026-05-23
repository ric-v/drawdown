import type { RedactedSnapshot, AIError } from '../types';
import { SYSTEM_PROMPT, INSIGHT_PROMPTS } from '../prompts';
import type { AIClient, AIClientResponse } from './openai';

function makeError(type: AIError['type'], message: string, retryAfter?: number): AIError {
  return { type, message, retryAfterSeconds: retryAfter, provider: 'anthropic' };
}

export function createAnthropicClient(apiKey: string, model: string): AIClient {
  const baseUrl = 'https://api.anthropic.com/v1/messages';
  const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };

  return {
    async testConnection() {
      try {
        const res = await fetch(baseUrl, {
          method: 'POST', headers,
          body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] }),
        });
        if (res.ok) return { ok: true, modelName: model };
        if (res.status === 401) return { ok: false, reason: 'Authentication failed. Check your API key.' };
        return { ok: false, reason: `Provider returned ${res.status}` };
      } catch { return { ok: false, reason: 'Network error' }; }
    },

    async generate(snapshot, { signal }) {
      let res: Response;
      try {
        res = await fetch(baseUrl, {
          method: 'POST', headers, signal,
          body: JSON.stringify({ model, max_tokens: 4096, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: `${INSIGHT_PROMPTS[snapshot.insightType] ?? ''}\n\nData:\n${JSON.stringify(snapshot)}` }] }),
        });
      } catch (e: any) {
        if (e.name === 'AbortError') throw makeError('timeout', 'Request was cancelled');
        throw makeError('network', e.message || 'Network error');
      }

      if (res.status === 401) throw makeError('auth', 'Authentication failed');
      if (res.status === 429) {
        const ra = res.headers.get('retry-after');
        throw makeError('rate_limit', 'Rate limited', ra ? parseInt(ra, 10) : undefined);
      }
      if (res.status >= 500) throw makeError('server', `Server error ${res.status}`);
      if (!res.ok) throw makeError('unknown', `Unexpected status ${res.status}`);

      const json = await res.json();
      return {
        contentMarkdown: json.content?.[0]?.text ?? '',
        tokenCount: json.usage ? (json.usage.input_tokens ?? 0) + (json.usage.output_tokens ?? 0) : undefined,
        modelUsed: json.model ?? model,
      };
    },
  };
}
