/**
 * Local IndexedDB Cache for Portfolio Data
 * Provides instant read/write with background cloud sync
 */

import { PortfolioData } from './google-drive';

const DB_NAME = 'drawdown-portfolio-cache';
const DB_VERSION = 1;
const STORE_NAME = 'portfolio';

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Get portfolio data from cache
 */
export async function getCachedPortfolio(userId: string): Promise<PortfolioData | null> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`portfolio_${userId}`);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          console.log('✅ Cache hit for portfolio:', userId);
          resolve(result.data);
        } else {
          console.log('❌ Cache miss for portfolio:', userId);
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Save portfolio data to cache
 */
export async function setCachedPortfolio(
  userId: string,
  data: PortfolioData
): Promise<void> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const record = {
        key: `portfolio_${userId}`,
        data,
        timestamp: Date.now(),
      };

      const request = store.put(record);

      request.onsuccess = () => {
        console.log('💾 Portfolio cached successfully');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error writing to cache:', error);
    throw error;
  }
}

/**
 * Get sync metadata (tracks pending changes)
 */
export async function getSyncMetadata(userId: string): Promise<any> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`sync_meta_${userId}`);

      request.onsuccess = () => {
        resolve(request.result?.data || { pendingChanges: false, lastSync: null });
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error reading sync metadata:', error);
    return { pendingChanges: false, lastSync: null };
  }
}

/**
 * Set sync metadata
 */
export async function setSyncMetadata(userId: string, metadata: any): Promise<void> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const record = {
        key: `sync_meta_${userId}`,
        data: metadata,
        timestamp: Date.now(),
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error writing sync metadata:', error);
  }
}

/**
 * Clear cache for a user
 */
export async function clearCache(userId: string): Promise<void> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      store.delete(`portfolio_${userId}`);
      store.delete(`sync_meta_${userId}`);
      store.delete(`settings_${userId}`);

      transaction.oncomplete = () => {
        console.log('🧹 Cache cleared for user:', userId);
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get settings data from cache
 */
export async function getCachedSettings(userId: string): Promise<any | null> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`settings_${userId}`);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          console.log('✅ Cache hit for settings:', userId);
          resolve(result.data);
        } else {
          console.log('❌ Cache miss for settings:', userId);
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error reading settings from cache:', error);
    return null;
  }
}

/**
 * Save settings data to cache
 */
export async function setCachedSettings(userId: string, data: any): Promise<void> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const record = {
        key: `settings_${userId}`,
        data,
        timestamp: Date.now(),
      };

      const request = store.put(record);

      request.onsuccess = () => {
        console.log('💾 Settings cached successfully');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error writing settings to cache:', error);
    throw error;
  }
}
