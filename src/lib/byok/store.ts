/**
 * BYOK configuration store.
 *
 * Persists encrypted API key inside the `settings_{email}` IndexedDB record
 * under `ai.apiKey` and into the synced settings file (ciphertext only).
 * Issues zero `/api/*` requests for reads.
 *
 * Requirements: 9.2, 9.3, 9.6, 13.2
 */

import type { AIProvider } from '@/lib/ai/types';
import type { EncryptedKey } from './crypto';
import { getCachedSettings, setCachedSettings } from '@/lib/local-cache';
import { scheduleSettingsSync } from '@/lib/sync-queue';

export interface BYOKConfig {
  aiProvider: AIProvider;
  aiModel: string;
  apiKey: EncryptedKey;
  dailyRequestLimit?: number; // 1..10000
}

/**
 * Retrieves the BYOK configuration from the local IndexedDB cache.
 * Issues zero `/api/*` requests (req 9.3).
 */
export async function getBYOKConfig(userEmail: string): Promise<BYOKConfig | null> {
  const settings = await getCachedSettings(userEmail);
  if (!settings?.ai?.aiProvider || !settings?.ai?.aiModel || !settings?.ai?.apiKey) {
    return null;
  }

  return {
    aiProvider: settings.ai.aiProvider,
    aiModel: settings.ai.aiModel,
    apiKey: settings.ai.apiKey,
    dailyRequestLimit: settings.ai.dailyRequestLimit,
  };
}

/**
 * Persists the BYOK configuration to both IndexedDB and the synced settings file.
 * Only the encrypted ciphertext is stored — never plaintext.
 */
export async function setBYOKConfig(userEmail: string, cfg: BYOKConfig): Promise<void> {
  const settings = (await getCachedSettings(userEmail)) ?? {};

  const updated = {
    ...settings,
    ai: {
      ...settings.ai,
      aiProvider: cfg.aiProvider,
      aiModel: cfg.aiModel,
      apiKey: cfg.apiKey,
      dailyRequestLimit: cfg.dailyRequestLimit,
    },
  };

  await setCachedSettings(userEmail, updated);
  scheduleSettingsSync(userEmail);
}

/**
 * Deletes the BYOK configuration from both IndexedDB and the synced settings file.
 * Completes within 500 ms (req 9.6).
 */
export async function deleteBYOKConfig(userEmail: string): Promise<void> {
  const settings = (await getCachedSettings(userEmail)) ?? {};

  if (settings.ai) {
    const { aiProvider, aiModel, apiKey, dailyRequestLimit, ...restAi } = settings.ai;
    const updated = { ...settings, ai: restAi };
    await setCachedSettings(userEmail, updated);
    scheduleSettingsSync(userEmail);
  }
}
