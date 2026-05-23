/**
 * Unit tests for the AI provider models module.
 *
 * Validates: Requirements 9.1, 9.8, 13.2
 */

import {
  getProviderModels,
  isValidModel,
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  GEMINI_MODELS,
  PROVIDER_MODEL_SET,
} from '../models';
import type { AIProvider } from '../types';

describe('getProviderModels', () => {
  const providers: AIProvider[] = ['openai', 'anthropic', 'gemini'];

  it.each(providers)('returns a non-empty array for provider "%s"', (provider) => {
    const models = getProviderModels(provider);
    expect(models.length).toBeGreaterThan(0);
  });

  it.each(providers)(
    'returns strings of length 1..100 for provider "%s"',
    (provider) => {
      const models = getProviderModels(provider);
      models.forEach((m) => {
        expect(typeof m).toBe('string');
        expect(m.length).toBeGreaterThanOrEqual(1);
        expect(m.length).toBeLessThanOrEqual(100);
      });
    }
  );

  it('returns OPENAI_MODELS for openai', () => {
    expect(getProviderModels('openai')).toBe(OPENAI_MODELS);
  });

  it('returns ANTHROPIC_MODELS for anthropic', () => {
    expect(getProviderModels('anthropic')).toBe(ANTHROPIC_MODELS);
  });

  it('returns GEMINI_MODELS for gemini', () => {
    expect(getProviderModels('gemini')).toBe(GEMINI_MODELS);
  });

  it('returns arrays that are readonly (frozen reference)', () => {
    providers.forEach((provider) => {
      const models = getProviderModels(provider);
      // The array reference should be stable across calls
      expect(getProviderModels(provider)).toBe(models);
    });
  });
});

describe('isValidModel', () => {
  it('returns true for a valid openai model', () => {
    expect(isValidModel('openai', 'gpt-4o')).toBe(true);
  });

  it('returns true for a valid anthropic model', () => {
    expect(isValidModel('anthropic', 'claude-sonnet-4-20250514')).toBe(true);
  });

  it('returns true for a valid gemini model', () => {
    expect(isValidModel('gemini', 'gemini-2.5-pro')).toBe(true);
  });

  it('returns false for a model from a different provider', () => {
    expect(isValidModel('openai', 'claude-3-opus-20240229')).toBe(false);
    expect(isValidModel('anthropic', 'gpt-4o')).toBe(false);
    expect(isValidModel('gemini', 'gpt-4o')).toBe(false);
  });

  it('returns false for an unknown model string', () => {
    expect(isValidModel('openai', 'nonexistent-model')).toBe(false);
    expect(isValidModel('anthropic', 'nonexistent-model')).toBe(false);
    expect(isValidModel('gemini', 'nonexistent-model')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidModel('openai', '')).toBe(false);
  });
});

describe('PROVIDER_MODEL_SET', () => {
  it('contains a Set for each provider', () => {
    expect(PROVIDER_MODEL_SET.openai).toBeInstanceOf(Set);
    expect(PROVIDER_MODEL_SET.anthropic).toBeInstanceOf(Set);
    expect(PROVIDER_MODEL_SET.gemini).toBeInstanceOf(Set);
  });

  it('Set sizes match array lengths', () => {
    expect(PROVIDER_MODEL_SET.openai.size).toBe(OPENAI_MODELS.length);
    expect(PROVIDER_MODEL_SET.anthropic.size).toBe(ANTHROPIC_MODELS.length);
    expect(PROVIDER_MODEL_SET.gemini.size).toBe(GEMINI_MODELS.length);
  });
});

describe('model list contents', () => {
  it('openai models include expected entries', () => {
    expect(OPENAI_MODELS).toContain('gpt-4o');
    expect(OPENAI_MODELS).toContain('gpt-4o-mini');
    expect(OPENAI_MODELS).toContain('gpt-4');
  });

  it('anthropic models include expected entries', () => {
    expect(ANTHROPIC_MODELS).toContain('claude-sonnet-4-20250514');
    expect(ANTHROPIC_MODELS).toContain('claude-3-5-sonnet-20241022');
    expect(ANTHROPIC_MODELS).toContain('claude-3-opus-20240229');
  });

  it('gemini models include expected entries', () => {
    expect(GEMINI_MODELS).toContain('gemini-2.5-pro');
    expect(GEMINI_MODELS).toContain('gemini-2.0-flash');
    expect(GEMINI_MODELS).toContain('gemini-1.5-pro');
  });

  it('no provider has duplicate models', () => {
    expect(new Set(OPENAI_MODELS).size).toBe(OPENAI_MODELS.length);
    expect(new Set(ANTHROPIC_MODELS).size).toBe(ANTHROPIC_MODELS.length);
    expect(new Set(GEMINI_MODELS).size).toBe(GEMINI_MODELS.length);
  });
});
