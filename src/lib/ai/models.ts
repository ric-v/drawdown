/**
 * Published model lists per AI provider.
 *
 * Used to:
 * 1. Validate `aiModel` in the BYOK configuration (Requirement 9.1, 9.8)
 * 2. Populate the Settings model `<Select>` dropdown (Requirement 13.2)
 *
 * Each provider's list contains only models that are publicly available
 * and support the chat/completions or equivalent API endpoint.
 */

import type { AIProvider } from './types';

/**
 * OpenAI models supporting the chat completions API.
 */
export const OPENAI_MODELS: readonly string[] = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'o1',
  'o1-mini',
  'o1-preview',
  'o3',
  'o3-mini',
  'o4-mini',
] as const;

/**
 * Anthropic models supporting the messages API.
 */
export const ANTHROPIC_MODELS: readonly string[] = [
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
] as const;

/**
 * Google Gemini models supporting the generateContent API.
 */
export const GEMINI_MODELS: readonly string[] = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
] as const;

/**
 * Lookup map from provider to the set of valid model identifiers.
 * Used for O(1) membership checks during validation.
 */
export const PROVIDER_MODEL_SET: Record<AIProvider, ReadonlySet<string>> = {
  openai: new Set(OPENAI_MODELS),
  anthropic: new Set(ANTHROPIC_MODELS),
  gemini: new Set(GEMINI_MODELS),
};

/**
 * Returns the published model list for a given provider.
 *
 * Used to populate the Settings model `<Select>` and to validate
 * that a user-selected `aiModel` is in the provider's published list.
 *
 * @param provider - The AI provider identifier
 * @returns An ordered array of model identifiers for the provider
 */
export function getProviderModels(provider: AIProvider): readonly string[] {
  switch (provider) {
    case 'openai':
      return OPENAI_MODELS;
    case 'anthropic':
      return ANTHROPIC_MODELS;
    case 'gemini':
      return GEMINI_MODELS;
  }
}

/**
 * Checks whether a model identifier is valid for the given provider.
 *
 * @param provider - The AI provider identifier
 * @param model - The model identifier to validate
 * @returns true if the model is in the provider's published list
 */
export function isValidModel(provider: AIProvider, model: string): boolean {
  return PROVIDER_MODEL_SET[provider].has(model);
}

/**
 * Fetches available models from the provider's API using the given key.
 * Returns model IDs sorted alphabetically, or null on failure.
 */
export async function fetchModelsFromAPI(provider: AIProvider, apiKey: string): Promise<string[] | null> {
  try {
    switch (provider) {
      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return (json.data as { id: string }[])
          .map((m) => m.id)
          .filter((id) => id.startsWith('gpt-') || id.startsWith('o'))
          .sort();
      }
      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return (json.data as { id: string }[]).map((m) => m.id).sort();
      }
      case 'gemini': {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        );
        if (!res.ok) return null;
        const json = await res.json();
        return (json.models as { name: string }[])
          .map((m) => m.name.replace('models/', ''))
          .filter((id) => id.startsWith('gemini-'))
          .sort();
      }
    }
  } catch {
    return null;
  }
}
