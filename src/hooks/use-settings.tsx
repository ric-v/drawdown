'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserSettings } from '@/types/settings';
import { getCachedSettings, setCachedSettings } from '@/lib/local-cache';
import { scheduleSettingsSync } from '@/lib/sync-queue';
import { useSession } from 'next-auth/react';

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        // 1. Try to load from cache first (instant)
        console.log('⚡ Checking settings cache...');
        const cached = await getCachedSettings(session.user.email);
        if (cached) {
          console.log('✅ Settings loaded from cache (<50ms)');
          setSettings(cached);
          setLoading(false);
          // Don't return - still fetch from API in background to ensure freshness
        }

        // 2. Fetch from API (may be slow if not cached on server)
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          
          // Update cache with fresh data
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

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!settings || !session?.user?.email) {
      console.error('Cannot update settings: missing settings or session');
      throw new Error('Missing settings or session');
    }

    try {
      // Optimistically update state immediately
      const updatedSettings: UserSettings = {
        ...settings,
        ...newSettings,
        updatedAt: new Date().toISOString(),
      };
      
      setSettings(updatedSettings);
      console.log('⚡ Settings updated in state (instant)');

      // Write to cache immediately (5-50ms)
      await setCachedSettings(session.user.email, updatedSettings);
      console.log('💾 Settings written to cache (<50ms)');

      // Schedule background sync to cloud
      scheduleSettingsSync(session.user.email);
      console.log('⏱️ Settings sync scheduled (background)');

    } catch (error) {
      console.error('❌ Failed to update settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
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
