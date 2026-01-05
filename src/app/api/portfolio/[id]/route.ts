import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { getCosmosContainer } from '@/lib/database/cosmosdb';

// PUT: Update a specific entry by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;
    const body = await request.json();
    const { date, pnl, notes } = body;
    
    const container = await getCosmosContainer();
    
    await container.items.upsert({
      id,
      type: 'dailyPnL',
      date: new Date(date).toISOString(),
      pnl: parseFloat(pnl),
      notes: notes || ''
    });
    
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;
    const container = await getCosmosContainer();
    
    await container.item(id, 'dailyPnL').delete();
    
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
