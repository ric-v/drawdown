/**
 * Unit tests for the BYOK configuration validator.
 *
 * Validates: Requirements 9.1, 9.5, 9.8, 13.1, 13.2
 */

import {
  validateBYOKConfig,
  getProviderModels,
  type AIProvider,
  type ValidationResult,
} from '../validate';

describe('validateBYOKConfig', () => {
  // Helper to build a valid candidate
  function validCandidate(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      aiProvider: 'openai',
      aiModel: 'gpt-4o',
      apiKey: 'sk-1234567890abcdefghij', // 21 chars, non-whitespace
      ...overrides,
    };
  }

  describe('accepts valid configurations', () => {
    it('accepts a minimal valid config (no dailyRequestLimit)', () => {
      const result = validateBYOKConfig(validCandidate());
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.aiProvider).toBe('openai');
        expect(result.value.aiModel).toBe('gpt-4o');
        expect(result.value.dailyRequestLimit).toBeUndefined();
      }
    });

    it('accepts a config with dailyRequestLimit', () => {
      const result = validateBYOKConfig(validCandidate({ dailyRequestLimit: 50 }));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.dailyRequestLimit).toBe(50);
      }
    });

    it.each(['openai', 'anthropic', 'gemini'] as const)(
      'accepts provider "%s" with a valid model',
      (provider) => {
        const models = getProviderModels(provider);
        const result = validateBYOKConfig(
          validCandidate({ aiProvider: provider, aiModel: models[0] })
        );
        expect(result.ok).toBe(true);
      }
    );

    it('accepts dailyRequestLimit at boundaries (1 and 10000)', () => {
      expect(validateBYOKConfig(validCandidate({ dailyRequestLimit: 1 })).ok).toBe(true);
      expect(validateBYOKConfig(validCandidate({ dailyRequestLimit: 10000 })).ok).toBe(true);
    });

    it('accepts apiKey at minimum length (20 chars)', () => {
      const result = validateBYOKConfig(validCandidate({ apiKey: 'a'.repeat(20) }));
      expect(result.ok).toBe(true);
    });

    it('accepts apiKey at maximum length (512 chars)', () => {
      const result = validateBYOKConfig(validCandidate({ apiKey: 'x'.repeat(512) }));
      expect(result.ok).toBe(true);
    });
  });

  describe('rejects invalid aiProvider', () => {
    it('rejects a non-string provider', () => {
      const result = validateBYOKConfig(validCandidate({ aiProvider: 123 }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'aiProvider' })
        );
      }
    });

    it('rejects an unknown provider string', () => {
      const result = validateBYOKConfig(validCandidate({ aiProvider: 'cohere' }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'aiProvider' })
        );
      }
    });
  });

  describe('rejects invalid aiModel', () => {
    it('rejects a non-string model', () => {
      const result = validateBYOKConfig(validCandidate({ aiModel: 42 }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'aiModel' })
        );
      }
    });

    it('rejects an empty string model', () => {
      const result = validateBYOKConfig(validCandidate({ aiModel: '' }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'aiModel' })
        );
      }
    });

    it('rejects a model longer than 100 characters', () => {
      const result = validateBYOKConfig(validCandidate({ aiModel: 'x'.repeat(101) }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'aiModel' })
        );
      }
    });

    it('rejects a model not in the published list for the provider', () => {
      const result = validateBYOKConfig(
        validCandidate({ aiProvider: 'openai', aiModel: 'claude-3-opus-20240229' })
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'aiModel' })
        );
      }
    });
  });

  describe('rejects invalid apiKey', () => {
    it('rejects a non-string apiKey', () => {
      const result = validateBYOKConfig(validCandidate({ apiKey: null }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'apiKey' })
        );
      }
    });

    it('rejects apiKey shorter than 20 characters', () => {
      const result = validateBYOKConfig(validCandidate({ apiKey: 'short' }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'apiKey' })
        );
      }
    });

    it('rejects apiKey longer than 512 characters', () => {
      const result = validateBYOKConfig(validCandidate({ apiKey: 'x'.repeat(513) }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'apiKey' })
        );
      }
    });

    it('rejects apiKey that is all whitespace', () => {
      const result = validateBYOKConfig(validCandidate({ apiKey: ' '.repeat(30) }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'apiKey' })
        );
      }
    });
  });

  describe('rejects invalid dailyRequestLimit', () => {
    it('rejects a non-integer limit', () => {
      const result = validateBYOKConfig(validCandidate({ dailyRequestLimit: 5.5 }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'dailyRequestLimit' })
        );
      }
    });

    it('rejects limit below 1', () => {
      const result = validateBYOKConfig(validCandidate({ dailyRequestLimit: 0 }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'dailyRequestLimit' })
        );
      }
    });

    it('rejects limit above 10000', () => {
      const result = validateBYOKConfig(validCandidate({ dailyRequestLimit: 10001 }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'dailyRequestLimit' })
        );
      }
    });

    it('rejects a non-number limit', () => {
      const result = validateBYOKConfig(validCandidate({ dailyRequestLimit: 'ten' }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ field: 'dailyRequestLimit' })
        );
      }
    });
  });

  describe('rejects non-object candidates', () => {
    it('rejects null', () => {
      const result = validateBYOKConfig(null);
      expect(result.ok).toBe(false);
    });

    it('rejects undefined', () => {
      const result = validateBYOKConfig(undefined);
      expect(result.ok).toBe(false);
    });

    it('rejects a string', () => {
      const result = validateBYOKConfig('not an object');
      expect(result.ok).toBe(false);
    });
  });

  describe('collects multiple errors', () => {
    it('returns all field errors when multiple fields are invalid', () => {
      const result = validateBYOKConfig({
        aiProvider: 'invalid',
        aiModel: '',
        apiKey: 'short',
        dailyRequestLimit: -1,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const fields = result.errors.map((e) => e.field);
        expect(fields).toContain('aiProvider');
        expect(fields).toContain('aiModel');
        expect(fields).toContain('apiKey');
        expect(fields).toContain('dailyRequestLimit');
      }
    });
  });
});

describe('getProviderModels', () => {
  it.each(['openai', 'anthropic', 'gemini'] as const)(
    'returns a non-empty array for provider "%s"',
    (provider) => {
      const models = getProviderModels(provider);
      expect(models.length).toBeGreaterThan(0);
      models.forEach((m) => {
        expect(typeof m).toBe('string');
        expect(m.length).toBeGreaterThan(0);
        expect(m.length).toBeLessThanOrEqual(100);
      });
    }
  );
});
