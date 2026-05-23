import type { RedactedSnapshot, AIError } from '../types';
import { SYSTEM_PROMPT, INSIGHT_PROMPTS } from '../prompts';
import type { AIClient, AIClientResponse } from './openai';

const DEFAULT_COOLDOWN_SECONDS = 60;

function makeError(type: AIError['type'], message: string, retryAfter?: number): AIError {
  return { type, message, retryAfterSeconds: retryAfter, provider: 'gemini' };
}

export function createGeminiClient(apiKey: string, model: string): AIClient {
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  return {
    async testConnection() {
      try {
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'ping' }] }],
            generationConfig: { maxOutputTokens: 1 },
          }),
        });
        if (res.ok) return { ok: true, modelName: model };
        if (res.status === 401 || res.status === 403)
          return { ok: false, reason: 'Authentication failed. Check your API key.' };
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
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${INSIGHT_PROMPTS[snapshot.insightType] ?? ''}\n\nData:\n${JSON.stringify(snapshot)}` }] },
            ],
          }),
        });
      } catch (e: any) {
        if (e.name === 'AbortError') throw makeError('timeout', 'Request was cancelled');
        throw makeError('network', e.message || 'Network error');
      }

      if (res.status === 401 || res.status === 403) throw makeError('auth', 'Authentication failed');
      if (res.status === 429) {
        const ra = res.headers.get('retry-after');
        const cooldown = ra ? parseInt(ra, 10) : DEFAULT_COOLDOWN_SECONDS;
        throw makeError('rate_limit', 'Rate limited', cooldown);
      }
      if (res.status >= 500) throw makeError('server', `Server error ${res.status}`);
      if (!res.ok) throw makeError('unknown', `Unexpected status ${res.status}`);

      const json = await res.json();
      const content =
        json.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
      const tokenCount = json.usageMetadata?.totalTokenCount;

      return {
        contentMarkdown: content,
        tokenCount: tokenCount != null ? tokenCount : undefined,
        modelUsed: model,
      };
    },
  };
}
