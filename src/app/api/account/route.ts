import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import * as GoogleDrive from '@/lib/google-drive';
import * as OneDrive from '@/lib/onedrive';

interface AccountInfo {
  provider: string;
  email: string;
  name?: string;
  picture?: string;
  files?: {
    portfolio: { name: string; size: number; createdTime: string; modifiedTime: string } | null;
    settings: { name: string; size: number; createdTime: string; modifiedTime: string } | null;
  };
}

/**
 * GET /api/account
 * Retrieve connected account details and cloud files
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = (session as any).accessToken;
    const provider = (session as any).provider;

    if (!accessToken || !provider) {
      return NextResponse.json({ error: 'No access token or provider' }, { status: 401 });
    }

    const accountInfo: AccountInfo = {
      provider,
      email: session.user.email,
      name: session.user.name || undefined,
      picture: session.user.image || undefined,
    };

    // Fetch files from cloud storage
    if (provider === 'google') {
      const portfolioFile = await GoogleDrive.findPortfolioFile(accessToken);
      const settingsFile = await GoogleDrive.findSettingsFile(accessToken);

      accountInfo.files = {
        portfolio: portfolioFile
          ? {
              name: portfolioFile.name,
              size: portfolioFile.size,
              createdTime: portfolioFile.createdTime,
              modifiedTime: portfolioFile.modifiedTime,
            }
          : null,
        settings: settingsFile
          ? {
              name: settingsFile.name,
              size: settingsFile.size,
              createdTime: settingsFile.createdTime,
              modifiedTime: settingsFile.modifiedTime,
            }
          : null,
      };
    } else if (provider === 'microsoft-entra-id') {
      // Fetch user profile from Microsoft Graph
      const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        accountInfo.name = profile.displayName || accountInfo.name;
      }

      const portfolioFile = await OneDrive.findPortfolioFile(accessToken);
      const settingsFile = await OneDrive.findSettingsFile(accessToken);

      accountInfo.files = {
        portfolio: portfolioFile
          ? {
              name: portfolioFile.name,
              size: portfolioFile.size,
              createdTime: portfolioFile.createdDateTime,
              modifiedTime: portfolioFile.lastModifiedDateTime,
            }
          : null,
        settings: settingsFile
          ? {
              name: settingsFile.name,
              size: settingsFile.size,
              createdTime: settingsFile.createdDateTime,
              modifiedTime: settingsFile.lastModifiedDateTime,
            }
          : null,
      };
    }

    return NextResponse.json(accountInfo);
  } catch (error) {
    console.error('Error in GET /api/account:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve account information' },
      { status: 500 }
    );
  }
}
