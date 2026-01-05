import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { getCosmosContainer } from '@/lib/database/cosmosdb';

// PUT: Update initial capital
export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
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
    
    const container = await getCosmosContainer();
    
    await container.items.upsert({
      id: 'config',
      type: 'config',
      initialCapital: parseFloat(initialCapital),
      lastUpdated: new Date().toISOString()
    });
    
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
