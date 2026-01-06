import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import * as GoogleDrive from '@/lib/google-drive';
import * as OneDrive from '@/lib/onedrive';

// PUT: Update initial capital
export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || !session.accessToken || !session.provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json();
    const { initialCapital } = body;
    
    if (initialCapital === undefined) {
      return NextResponse.json(
        { error: 'Initial capital is required' },
        { status: 400 }
      );
    }

    // Read existing data
    let data;
    if (session.provider === 'google') {
      data = await GoogleDrive.readPortfolioData(session.accessToken);
    } else if (session.provider === 'microsoft-entra-id') {
      data = await OneDrive.readPortfolioData(session.accessToken);
    }

    if (!data) {
      data = {
        dailyPnL: [],
        fundTransactions: [],
        initialCapital: 100000,
        lastUpdated: new Date().toISOString()
      };
    }

    // Update initial capital
    data.initialCapital = parseFloat(initialCapital);
    data.lastUpdated = new Date().toISOString();

    // Save back to cloud storage
    if (session.provider === 'google') {
      await GoogleDrive.savePortfolioData(session.accessToken, data);
    } else if (session.provider === 'microsoft-entra-id') {
      await OneDrive.savePortfolioData(session.accessToken, data);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Initial capital updated successfully',
      initialCapital: parseFloat(initialCapital)
    });
  } catch (error) {
    console.error('Error updating equity:', error);
    return NextResponse.json(
      { error: 'Failed to update equity' },
      { status: 500 }
    );
  }
}
