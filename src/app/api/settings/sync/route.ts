import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import * as GoogleDrive from '@/lib/google-drive';
import * as OneDrive from '@/lib/onedrive';

/**
 * POST /api/settings/sync
 * Syncs settings from cache to cloud storage
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.accessToken || !session.provider || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const settingsData = body.settingsData;

    if (!settingsData) {
      return NextResponse.json({ error: 'No settings data provided' }, { status: 400 });
    }

    console.log('🔄 Syncing settings to cloud storage...');

    // Sync to appropriate cloud provider
    if (session.provider === 'google') {
      await GoogleDrive.writeSettingsData(session.accessToken, settingsData);
      console.log('✅ Settings synced to Google Drive');
    } else if (session.provider === 'microsoft-entra-id') {
      await OneDrive.writeSettingsData(session.accessToken, settingsData);
      console.log('✅ Settings synced to OneDrive');
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Settings synced to cloud',
      timestamp: new Date().toISOString(),
      provider: session.provider
    });
  } catch (error: any) {
    console.error('❌ Error syncing settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync settings',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
