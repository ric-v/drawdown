'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative group flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 hover:from-gray-200 hover:to-gray-300 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all duration-300 border border-gray-300/50 dark:border-slate-700/50 shadow-sm hover:shadow-md active:scale-95 overflow-hidden"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label="Toggle theme"
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500" />
      
      {/* Icons with rotation animation */}
      <div className="relative">
        {theme === 'light' ? (
          <Moon className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-200 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
        ) : (
          <Sun className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-200 transition-all duration-300 group-hover:rotate-180 group-hover:scale-110" />
        )}
      </div>
    </button>
  );
}
