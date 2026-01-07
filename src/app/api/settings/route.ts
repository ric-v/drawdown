import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/config/auth';
import { UserSettings, UpdateSettingsPayload } from '@/types/settings';
import * as GoogleDrive from '@/lib/google-drive';
import * as OneDrive from '@/lib/onedrive';

// Default settings for new users
const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: 'system',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'indian',
  defaultCapital: 100000,
  notifications: {
    emailNotifications: true,
    desktopNotifications: true,
    milestoneAlerts: true,
    dailySummary: true,
  },
  trading: {
    defaultPortfolioName: 'Main Portfolio',
    hideClosedTrades: false,
    showPnLPercentage: true,
    decimalsForPnL: 2,
  },
};

/**
 * Read settings from cloud storage
 */
const readSettings = async (accessToken: string, provider: string): Promise<UserSettings | null> => {
  try {
    let data;

    if (provider === 'google') {
      data = await GoogleDrive.readSettingsData(accessToken);
    } else if (provider === 'microsoft-entra-id') {
      data = await OneDrive.readSettingsData(accessToken);
    } else {
      throw new Error('Unsupported provider');
    }

    return data;
  } catch (error) {
    console.error('Error reading settings:', error);
    return null;
  }
};

/**
 * Write settings to cloud storage
 */
const writeSettings = async (
  accessToken: string,
  provider: string,
  settings: UserSettings
): Promise<boolean> => {
  try {
    if (provider === 'google') {
      await GoogleDrive.writeSettingsData(accessToken, settings);
    } else if (provider === 'microsoft-entra-id') {
      await OneDrive.writeSettingsData(accessToken, settings);
    } else {
      throw new Error('Unsupported provider');
    }
    return true;
  } catch (error) {
    console.error('Error writing settings:', error);
    return false;
  }
};

/**
 * GET /api/settings
 * Retrieve user settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = (session as any).accessToken;
    const provider = (session as any).provider;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    let settings = await readSettings(accessToken, provider);

    // If settings don't exist, create default settings
    if (!settings) {
      settings = {
        id: crypto.randomUUID(),
        userId: session.user.email,
        ...DEFAULT_SETTINGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Try to save default settings
      await writeSettings(accessToken, provider, settings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * Update user settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = (session as any).accessToken;
    const provider = (session as any).provider;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const payload: UpdateSettingsPayload = await request.json();

    // Fetch current settings
    let settings = await readSettings(accessToken, provider);

    if (!settings) {
      // Create new settings if they don't exist
      settings = {
        id: crypto.randomUUID(),
        userId: session.user.email,
        ...DEFAULT_SETTINGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Update settings with provided values
    if (payload.theme !== undefined) settings.theme = payload.theme;
    if (payload.currency !== undefined) settings.currency = payload.currency;
    if (payload.dateFormat !== undefined) settings.dateFormat = payload.dateFormat;
    if (payload.numberFormat !== undefined) settings.numberFormat = payload.numberFormat;
    if (payload.defaultCapital !== undefined) settings.defaultCapital = payload.defaultCapital;

    if (payload.notifications) {
      settings.notifications = {
        ...settings.notifications,
        ...payload.notifications,
      };
    }

    if (payload.trading) {
      settings.trading = {
        ...settings.trading,
        ...payload.trading,
      };
    }

    // Update the updatedAt timestamp
    settings.updatedAt = new Date().toISOString();

    // Write updated settings to storage
    const success = await writeSettings(accessToken, provider, settings);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in PUT /api/settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
