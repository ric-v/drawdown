/**
 * BYOK configuration validator.
 *
 * Validates candidate BYOK configuration objects against field-level invariants:
 * - aiProvider ∈ {'openai', 'anthropic', 'gemini'}
 * - aiModel: length 1..100, must be in the published model list for the provider
 * - apiKey: length 20..512, at least one non-whitespace character
 * - dailyRequestLimit (optional): integer in 1..10000
 *
 * Returns a discriminated Result<BYOKConfig, ValidationError[]>.
 */

import type { EncryptedKey } from './crypto';
import type { AIProvider } from '@/lib/ai/types';
import { getProviderModels, isValidModel } from '@/lib/ai/models';

// Re-export for backward compatibility
export type { AIProvider };
export { getProviderModels };

const VALID_PROVIDERS: ReadonlySet<string> = new Set<AIProvider>([
  'openai',
  'anthropic',
  'gemini',
]);

// --- BYOKConfig type ---

export interface BYOKConfig {
  aiProvider: AIProvider;
  aiModel: string;
  apiKey: EncryptedKey;
  dailyRequestLimit?: number;
}

// --- Validation types ---

export interface ValidationError {
  field: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; value: BYOKConfig }
  | { ok: false; errors: ValidationError[] };

// --- Validator ---

/**
 * Validates a candidate BYOK configuration object.
 *
 * Enforces:
 * - aiProvider ∈ {'openai', 'anthropic', 'gemini'}
 * - aiModel: string of length 1..100, in the published model list for the provider
 * - apiKey: string of length 20..512 with at least one non-whitespace character
 * - dailyRequestLimit (when present): integer in [1, 10000]
 *
 * Returns a discriminated Result: { ok: true, value: BYOKConfig } on success,
 * or { ok: false, errors: ValidationError[] } on failure.
 *
 * Note: `apiKey` in the candidate is the plaintext key string for validation purposes.
 * The caller is responsible for encrypting it before persisting as BYOKConfig.apiKey (EncryptedKey).
 */
export function validateBYOKConfig(candidate: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (candidate === null || candidate === undefined || typeof candidate !== 'object') {
    return {
      ok: false,
      errors: [{ field: 'candidate', message: 'Configuration must be a non-null object' }],
    };
  }

  const obj = candidate as Record<string, unknown>;

  // Validate aiProvider
  const aiProvider = obj.aiProvider;
  let validProvider: AIProvider | null = null;

  if (typeof aiProvider !== 'string' || !VALID_PROVIDERS.has(aiProvider)) {
    errors.push({
      field: 'aiProvider',
      message: `aiProvider must be one of: openai, anthropic, gemini`,
    });
  } else {
    validProvider = aiProvider as AIProvider;
  }

  // Validate aiModel
  const aiModel = obj.aiModel;

  if (typeof aiModel !== 'string') {
    errors.push({
      field: 'aiModel',
      message: 'aiModel must be a string',
    });
  } else if (aiModel.length < 1 || aiModel.length > 100) {
    errors.push({
      field: 'aiModel',
      message: 'aiModel must be between 1 and 100 characters',
    });
  } else if (validProvider !== null && !isValidModel(validProvider, aiModel)) {
    errors.push({
      field: 'aiModel',
      message: `aiModel must be a valid model for provider "${validProvider}"`,
    });
  }

  // Validate apiKey
  const apiKey = obj.apiKey;

  if (typeof apiKey !== 'string') {
    errors.push({
      field: 'apiKey',
      message: 'apiKey must be a string',
    });
  } else if (apiKey.length < 20 || apiKey.length > 512) {
    errors.push({
      field: 'apiKey',
      message: 'apiKey must be between 20 and 512 characters',
    });
  } else if (apiKey.trim().length === 0) {
    errors.push({
      field: 'apiKey',
      message: 'apiKey must contain at least one non-whitespace character',
    });
  }

  // Validate dailyRequestLimit (optional)
  const dailyRequestLimit = obj.dailyRequestLimit;

  if (dailyRequestLimit !== undefined && dailyRequestLimit !== null) {
    if (
      typeof dailyRequestLimit !== 'number' ||
      !Number.isInteger(dailyRequestLimit) ||
      dailyRequestLimit < 1 ||
      dailyRequestLimit > 10000
    ) {
      errors.push({
        field: 'dailyRequestLimit',
        message: 'dailyRequestLimit must be an integer between 1 and 10000',
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // All validations passed — construct the validated BYOKConfig.
  // Note: The apiKey field in BYOKConfig is EncryptedKey, but at validation time
  // we're validating the plaintext. The caller encrypts before storing.
  // We return a placeholder EncryptedKey structure to satisfy the type;
  // the actual encryption happens in the store layer.
  return {
    ok: true,
    value: {
      aiProvider: validProvider!,
      aiModel: aiModel as string,
      apiKey: obj.apiKey as unknown as EncryptedKey,
      ...(dailyRequestLimit !== undefined && dailyRequestLimit !== null
        ? { dailyRequestLimit: dailyRequestLimit as number }
        : {}),
    },
  };
}
