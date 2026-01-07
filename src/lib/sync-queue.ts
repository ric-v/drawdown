/**
 * Sync Queue for Background Cloud Updates
 * Batches and debounces writes to cloud storage
 * CLIENT-SIDE ONLY - Triggers server API calls
 */

import { getCachedPortfolio, getCachedSettings, getSyncMetadata, setSyncMetadata } from './local-cache';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface SyncQueue {
  userId: string;
  timeout: NodeJS.Timeout | null;
  status: SyncStatus;
  lastError: Error | null;
}

const queues = new Map<string, SyncQueue>();
const DEBOUNCE_MS = 5000; // Wait 5 seconds after last change before syncing

/**
 * Schedule a sync for the user's portfolio
 */
export function scheduleSync(userId: string): void {
  // Get or create queue for this user
  let queue = queues.get(userId);
  
  if (!queue) {
    queue = {
      userId,
      timeout: null,
      status: 'idle',
      lastError: null,
    };
    queues.set(userId, queue);
  }

  // Clear existing timeout
  if (queue.timeout) {
    clearTimeout(queue.timeout);
  }

  // Set new timeout
  queue.timeout = setTimeout(() => {
    performSync(userId).catch(error => {
      console.error('Background sync failed:', error);
    });
  }, DEBOUNCE_MS);

  console.log(`⏱️  Sync scheduled for user ${userId} in ${DEBOUNCE_MS}ms`);
}

/**
 * Perform actual sync via API call
 */
async function performSync(userId: string): Promise<void> {
  const queue = queues.get(userId);
  if (!queue) return;

  // Don't sync if already syncing
  if (queue.status === 'syncing') {
    console.log('⚠️  Sync already in progress, skipping');
    return;
  }

  queue.status = 'syncing';
  queue.lastError = null;

  try {
    console.log('☁️  Starting background sync to cloud...');
    
    // Get portfolio data from IndexedDB cache
    const portfolioData = await getCachedPortfolio(userId);
    if (!portfolioData) {
      console.warn('⚠️  No cached data to sync');
      queue.status = 'idle';
      return;
    }

    // Send portfolio data to API endpoint for cloud sync
    const response = await fetch('/api/portfolio/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ portfolioData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Sync failed');
    }

    // Update sync metadata
    await setSyncMetadata(userId, {
      pendingChanges: false,
      lastSync: new Date().toISOString(),
      lastError: null,
    });

    console.log('✅ Background sync completed successfully');
    queue.status = 'idle';
    
    // Emit sync complete event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('portfolio-synced', { 
        detail: { userId, success: true } 
      }));
    }
  } catch (error: any) {
    console.error('❌ Sync failed:', error);
    queue.status = 'error';
    queue.lastError = error;

    // Update sync metadata with error
    await setSyncMetadata(userId, {
      pendingChanges: true,
      lastSync: null,
      lastError: error.message,
    });

    // Emit sync error event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('portfolio-sync-error', { 
        detail: { userId, error: error.message } 
      }));
    }

    // Retry after 30 seconds
    setTimeout(() => {
      console.log('🔄 Retrying sync after error...');
      performSync(userId);
    }, 30000);
  }
}

/**
 * Force immediate sync (useful for critical operations)
 */
export async function forceSyncNow(userId: string): Promise<void> {
  const queue = queues.get(userId);
  if (!queue) {
    throw new Error('No sync queue found for user');
  }

  // Clear any pending timeout
  if (queue.timeout) {
    clearTimeout(queue.timeout);
    queue.timeout = null;
  }

  await performSync(userId);
}

/**
 * Get sync status for a user
 */
export function getSyncStatus(userId: string): { status: SyncStatus; lastError: Error | null } {
  const queue = queues.get(userId);
  if (!queue) {
    return { status: 'idle', lastError: null };
  }
  return { status: queue.status, lastError: queue.lastError };
}

/**
 * Schedule a sync for settings
 */
export function scheduleSettingsSync(userId: string): void {
  // Reuse the same queue system but with a settings-specific key
  const settingsUserId = `${userId}_settings`;
  
  let queue = queues.get(settingsUserId);
  
  if (!queue) {
    queue = {
      userId: settingsUserId,
      timeout: null,
      status: 'idle',
      lastError: null,
    };
    queues.set(settingsUserId, queue);
  }

  if (queue.timeout) {
    clearTimeout(queue.timeout);
  }

  console.log('⏱️ Settings sync scheduled (5s debounce)');
  queue.timeout = setTimeout(() => {
    performSettingsSync(userId);
  }, DEBOUNCE_MS);
}

/**
 * Perform the actual settings sync to cloud
 */
async function performSettingsSync(userId: string): Promise<void> {
  const settingsUserId = `${userId}_settings`;
  const queue = queues.get(settingsUserId);
  
  if (!queue) {
    console.error('❌ No settings sync queue found');
    return;
  }

  try {
    queue.status = 'syncing';
    console.log('🔄 Syncing settings to cloud...');

    // Get cached settings
    const cachedSettings = await getCachedSettings(userId);
    if (!cachedSettings) {
      console.warn('⚠️ No cached settings found to sync');
      queue.status = 'idle';
      return;
    }

    // Call server API to sync settings
    const response = await fetch('/api/settings/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settingsData: cachedSettings }),
    });

    if (!response.ok) {
      throw new Error(`Settings sync failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Settings synced successfully:', result);

    queue.status = 'idle';
    queue.lastError = null;

  } catch (error) {
    console.error('❌ Settings sync error:', error);
    queue.status = 'error';
    queue.lastError = error as Error;

    // Retry after 30 seconds
    setTimeout(() => {
      console.log('🔄 Retrying settings sync...');
      performSettingsSync(userId);
    }, 30000);
  }
}

