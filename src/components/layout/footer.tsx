import Link from 'next/link';
import { Github, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 transition-colors">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p>© {currentYear} Drawdown. <Link href="https://github.com/ric-v/drawdown/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white underline transition-colors">GPL v3 License</Link></p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-xs">
            <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="https://github.com/ric-v/drawdown" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Github className="w-4 h-4" />
            </Link>
            <a href="mailto:support@astrx.dev" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
