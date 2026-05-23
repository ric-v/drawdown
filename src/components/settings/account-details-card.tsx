'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar } from 'lucide-react';
import Image from 'next/image';

// Google Icon
/* eslint-disable no-restricted-syntax -- brand logos require exact brand colors */
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Microsoft Icon
const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="#F25022" d="M1 1h10v10H1z"/>
    <path fill="#00A4EF" d="M13 1h10v10H13z"/>
    <path fill="#7FBA00" d="M1 13h10v10H1z"/>
    <path fill="#FFB900" d="M13 13h10v10H13z"/>
  </svg>
);
/* eslint-enable no-restricted-syntax */

interface AccountFile {
  name: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
}

interface AccountInfo {
  provider: string;
  email: string;
  name?: string;
  picture?: string;
  files?: {
    portfolio: AccountFile | null;
    settings: AccountFile | null;
  };
}

export function AccountDetailsCard() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/account');

        if (!response.ok) {
          throw new Error('Failed to fetch account information');
        }

        const data = await response.json();
        setAccountInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountInfo();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProviderLabel = (provider: string): string => {
    return provider === 'google' ? 'Google' : 'Microsoft';
  };

  const getProviderIcon = (provider: string) => {
    return provider === 'google' ? (
      <GoogleIcon className="h-5 w-5" />
    ) : (
      <MicrosoftIcon className="h-5 w-5" />
    );
  };

  const getStorageIcon = (provider: string) => {
    return provider === 'google' ? (
      <div className="w-5 h-5 flex items-center justify-center">
        <Image 
          src="/google-drive.png" 
          alt="Google Drive" 
          width={20} 
          height={20}
          className="object-contain"
          style={{ background: 'transparent' }}
        />
      </div>
    ) : (
      <div className="w-5 h-5 flex items-center justify-center">
        <Image 
          src="/onedrive.png" 
          alt="OneDrive" 
          width={20} 
          height={20}
          className="object-contain"
          style={{ background: 'transparent' }}
        />
      </div>
    );
  };

  const getStorageLabel = (provider: string): string => {
    return provider === 'google' ? 'Google Drive' : 'OneDrive';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!accountInfo) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStorageIcon(accountInfo.provider)}
          Connected Account
        </CardTitle>
        <CardDescription>
          Your account and {getStorageLabel(accountInfo.provider)} information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {getProviderIcon(accountInfo.provider)}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {accountInfo.name || 'User'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {accountInfo.email}
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {getProviderLabel(accountInfo.provider)}
            </Badge>
          </div>
        </div>

        {/* Cloud Files */}
        {accountInfo.files && (
          <div className="border-t border-gray-200 dark:border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              {getStorageIcon(accountInfo.provider)}
              {getStorageLabel(accountInfo.provider)} Files
            </h3>
            <div className="space-y-3">
              {/* Settings File */}
              {accountInfo.files.settings && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {accountInfo.files.settings.name}
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Size: {formatFileSize(accountInfo.files.settings.size)}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Created: {formatDate(accountInfo.files.settings.createdTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Modified: {formatDate(accountInfo.files.settings.modifiedTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio File */}
              {accountInfo.files.portfolio && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                  <FileText className="h-5 w-5 text-positive mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {accountInfo.files.portfolio.name}
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Size: {formatFileSize(accountInfo.files.portfolio.size)}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Created: {formatDate(accountInfo.files.portfolio.createdTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Modified: {formatDate(accountInfo.files.portfolio.modifiedTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!accountInfo.files.settings && !accountInfo.files.portfolio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 py-4">
                  No cloud files found yet. They will be created when you save data.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
