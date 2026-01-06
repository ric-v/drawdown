import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import * as GoogleDrive from '@/lib/google-drive';
import * as OneDrive from '@/lib/onedrive';

// PUT: Update a specific entry by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || !session.accessToken || !session.provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;
    const body = await request.json();
    const { date, pnl, notes } = body;
    
    // Read existing data
    let data;
    if (session.provider === 'google') {
      data = await GoogleDrive.readPortfolioData(session.accessToken);
    } else if (session.provider === 'microsoft-entra-id') {
      data = await OneDrive.readPortfolioData(session.accessToken);
    }

    if (!data) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Find and update the entry
    const entryIndex = data.dailyPnL.findIndex((entry: any) => entry.id === id);
    if (entryIndex === -1) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    data.dailyPnL[entryIndex] = {
      id,
      date: new Date(date),
      pnl: parseFloat(pnl),
      notes: notes || ''
    };
    data.lastUpdated = new Date().toISOString();

    // Save back to cloud storage
    if (session.provider === 'google') {
      await GoogleDrive.savePortfolioData(session.accessToken, data);
    } else if (session.provider === 'microsoft-entra-id') {
      await OneDrive.savePortfolioData(session.accessToken, data);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific entry by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || !session.accessToken || !session.provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;

    // Read existing data
    let data;
    if (session.provider === 'google') {
      data = await GoogleDrive.readPortfolioData(session.accessToken);
    } else if (session.provider === 'microsoft-entra-id') {
      data = await OneDrive.readPortfolioData(session.accessToken);
    }

    if (!data) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Filter out the entry
    data.dailyPnL = data.dailyPnL.filter((entry: any) => entry.id !== id);
    data.lastUpdated = new Date().toISOString();

    // Save back to cloud storage
    if (session.provider === 'google') {
      await GoogleDrive.savePortfolioData(session.accessToken, data);
    } else if (session.provider === 'microsoft-entra-id') {
      await OneDrive.savePortfolioData(session.accessToken, data);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
