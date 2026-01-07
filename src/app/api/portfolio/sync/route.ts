import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import * as GoogleDrive from '@/lib/google-drive';
import * as OneDrive from '@/lib/onedrive';

/**
 * POST /api/portfolio/sync
 * Syncs ALL pending changes from the queue to cloud storage
 * This endpoint reads the entire portfolio and uploads to cloud
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.accessToken || !session.provider || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const portfolioData = body.portfolioData;

    if (!portfolioData) {
      return NextResponse.json({ error: 'No portfolio data provided' }, { status: 400 });
    }

    console.log('🔄 Syncing portfolio to cloud storage...');

    // Sync to appropriate cloud provider
    if (session.provider === 'google') {
      await GoogleDrive.savePortfolioData(session.accessToken, portfolioData);
      console.log('✅ Synced to Google Drive');
    } else if (session.provider === 'microsoft-entra-id') {
      await OneDrive.savePortfolioData(session.accessToken, portfolioData);
      console.log('✅ Synced to OneDrive');
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Portfolio synced to cloud',
      timestamp: new Date().toISOString(),
      provider: session.provider
    });
  } catch (error: any) {
    console.error('❌ Error syncing portfolio:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync portfolio',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
