'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSettings } from '@/hooks/use-settings';

type ThemeValue = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeValue;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeValue) => void;
  toggleTheme: () => void;
  /** Non-null when the last persistence attempt failed */
  persistError: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const VALID_THEMES: ThemeValue[] = ['light', 'dark', 'system'];

function isValidTheme(value: unknown): value is ThemeValue {
  return typeof value === 'string' && VALID_THEMES.includes(value as ThemeValue);
}

/**
 * Resolve the effective theme given the user's preference and OS dark-mode state.
 */
export function resolveTheme(value: ThemeValue, prefersDark: boolean): ResolvedTheme {
  if (value === 'dark') return 'dark';
  if (value === 'light') return 'light';
  // 'system' — follow OS preference
  return prefersDark ? 'dark' : 'light';
}

/**
 * Synchronously update the <html> element's class list to reflect the resolved theme.
 * This is intentionally a direct DOM mutation for < 200 ms budget (req 3.6).
 */
function applyThemeClass(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [prefersDark, setPrefersDark] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);

  // Keep a ref to the current theme value so the matchMedia handler can read it
  // without causing re-subscriptions.
  const themeRef = useRef<ThemeValue>('system');

  // Read persisted theme from settings, default to 'system' when missing or invalid (req 3.4)
  const persisted = settings?.theme;
  const themeValue: ThemeValue = isValidTheme(persisted) ? persisted : 'system';

  // Keep ref in sync via effect to satisfy React compiler rules
  useEffect(() => { themeRef.current = themeValue; }, [themeValue]);

  const resolved = resolveTheme(themeValue, prefersDark);

  useEffect(() => {
    setMounted(true);

    // Initialize prefersDark from matchMedia
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDark(mq.matches);

    // Subscribe to OS color scheme changes (req 3.5)
    // When theme === 'system', re-apply the resolved class within 500 ms.
    // We apply the class directly in the handler for immediate response,
    // then update React state so the context value stays in sync.
    const handler = (e: MediaQueryListEvent) => {
      setPrefersDark(e.matches);

      // If current theme is 'system', apply the new resolved class immediately
      // (well within the 500 ms budget). Persistence is NOT modified (req 3.5).
      if (themeRef.current === 'system') {
        const newResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
        applyThemeClass(newResolved);
      }
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply theme class synchronously on any resolved theme change (< 200 ms, req 3.6)
  useEffect(() => {
    if (!mounted) return;
    applyThemeClass(resolved);
    // Keep localStorage in sync for the inline bootstrap script (prevents FOUC on reload)
    try {
      localStorage.setItem('theme', themeValue);
    } catch {
      // localStorage may be unavailable in some contexts; non-critical
    }
  }, [resolved, mounted, themeValue]);

  const setTheme = useCallback(
    (newTheme: ThemeValue) => {
      // Validate input — fall back to 'system' if invalid
      const validTheme: ThemeValue = isValidTheme(newTheme) ? newTheme : 'system';

      // Apply immediately to DOM (< 200 ms budget, req 3.6)
      const newResolved = resolveTheme(validTheme, prefersDark);
      applyThemeClass(newResolved);

      // Update localStorage for the bootstrap script
      try {
        localStorage.setItem('theme', validTheme);
      } catch {
        // non-critical
      }

      // Clear any previous persist error
      setPersistError(null);

      // Persist via useSettings (debounced cloud sync)
      // req 3.2: persist within 500 ms
      // req 3.3: if persistence fails, retain the applied theme for the session
      //          and surface an error indication
      updateSettings({ theme: validTheme }).catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Theme preference was not saved';
        setPersistError(message);
      });
    },
    [prefersDark, updateSettings],
  );

  const toggleTheme = useCallback(() => {
    const next: ThemeValue = resolved === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolved, setTheme]);

  // Don't render children until mounted to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <ThemeContext.Provider
      value={{ theme: themeValue, resolvedTheme: resolved, setTheme, toggleTheme, persistError }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
