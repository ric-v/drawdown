'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { UserSettings } from '@/types/settings';
import { getCachedSettings, setCachedSettings } from '@/lib/local-cache';
import { scheduleSettingsSync } from '@/lib/sync-queue';
import { useSession } from 'next-auth/react';

export interface SettingsPersistError {
  field: string;
  message: string;
  timestamp: number;
}

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  persistError: SettingsPersistError | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  clearPersistError: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [persistError, setPersistError] = useState<SettingsPersistError | null>(null);
  const { data: session } = useSession();

  // Track last successfully persisted state for rollback
  const lastPersistedRef = useRef<UserSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        console.log('⚡ Checking settings cache...');
        const cached = await getCachedSettings(session.user.email);
        if (cached) {
          console.log('✅ Settings loaded from cache (<50ms)');
          setSettings(cached);
          lastPersistedRef.current = cached;
          setLoading(false);
        }

        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          lastPersistedRef.current = data;
          await setCachedSettings(session.user.email, data);
          console.log('💾 Settings cache updated from API');
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [session]);

  const clearPersistError = useCallback(() => setPersistError(null), []);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!settings || !session?.user?.email) {
      throw new Error('Missing settings or session');
    }

    const updatedSettings: UserSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };

    // Apply optimistically
    setSettings(updatedSettings);

    try {
      await setCachedSettings(session.user.email, updatedSettings);
      scheduleSettingsSync(session.user.email);
      // Persist succeeded — update the last-known-good snapshot
      lastPersistedRef.current = updatedSettings;
      setPersistError(null);
    } catch (error) {
      // Rollback to last successfully persisted value within 500ms
      const rollbackTarget = lastPersistedRef.current ?? settings;
      setSettings(rollbackTarget);

      // Identify which field failed
      const failedField = newSettings.ai ? 'AI Insights' : 'Display';
      setPersistError({
        field: failedField,
        message: `Failed to save ${failedField} settings`,
        timestamp: Date.now(),
      });

      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, persistError, updateSettings, clearPersistError }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
