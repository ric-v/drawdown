'use client';

import { SettingsForm } from '@/components/settings/settings-form';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserNav } from '@/components/auth/user-nav';
import { Footer } from '@/components/layout/footer';
import { Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-700">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 flex h-16 md:h-20 shrink-0 items-center justify-between gap-3 md:gap-6 border-b border-gray-200/60 dark:border-slate-800/60 px-4 md:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-sm">
        {/* Logo Section - Clickable */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity duration-200">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-blue-500/20 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 ring-1 ring-blue-500/20 dark:ring-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
            <Image
              src="/logo.png"
              alt="Logo"
              width={24}
              height={24}
              className="object-contain md:w-7 md:h-7"
            />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">Drawdown</h1>
            <p className="hidden md:block text-[10px] font-medium text-gray-500 dark:text-gray-400">Portfolio Tracker</p>
          </div>
        </Link>

        {/* Settings Icon & Title - Center on Mobile - Clickable */}
        <Link href="/" className="flex-1 flex justify-center sm:hidden hover:opacity-80 transition-opacity duration-200">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-gray-900 dark:text-white">Settings</span>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserNav />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            {/* Desktop Title Section */}
            <div className="hidden sm:block mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl font-bold">Settings</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your preferences and portfolio settings
              </p>
            </div>

            {/* Settings Form */}
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8">
              <SettingsForm />
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
