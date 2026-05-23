import type { AIProvider } from './types';
import type { AIClient } from './providers/openai';

export type { AIClient, AIClientResponse } from './providers/openai';

/**
 * Returns an AI client for the given provider using lazy dynamic imports.
 * Users without BYOK never load provider modules (req 12.1).
 */
export async function getAIClient(provider: AIProvider, apiKey: string, model: string): Promise<AIClient> {
  switch (provider) {
    case 'openai': {
      const { createOpenAIClient } = await import('./providers/openai');
      return createOpenAIClient(apiKey, model);
    }
    case 'anthropic': {
      const { createAnthropicClient } = await import('./providers/anthropic');
      return createAnthropicClient(apiKey, model);
    }
    case 'gemini': {
      const { createGeminiClient } = await import('./providers/gemini');
      return createGeminiClient(apiKey, model);
    }
  }
}
