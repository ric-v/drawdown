import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { getCosmosContainer } from '@/lib/database/cosmosdb';
import type { FundTransaction } from '@/types/trading';

// Helper functions for Cosmos DB operations
async function getFundTransactions(): Promise<FundTransaction[]> {
  const container = await getCosmosContainer();
  const { resources } = await container.items
    .query({
      query: "SELECT * FROM c WHERE c.type = @type ORDER BY c.date DESC",
      parameters: [{ name: "@type", value: "fundTransaction" }]
    })
    .fetchAll();

  return resources.map(item => ({
    id: item.id,
    amount: item.amount,
    type: item.fundType,
    date: new Date(item.date),
    notes: item.notes,
  }));
}

async function getInitialCapital(): Promise<number> {
  const container = await getCosmosContainer();
  const { resources } = await container.items
    .query({
      query: "SELECT * FROM c WHERE c.type = @type",
      parameters: [{ name: "@type", value: "config" }]
    })
    .fetchAll();

  return resources.length > 0 ? resources[0].initialCapital : 100000;
}

async function updateInitialCapital(newCapital: number): Promise<void> {
  const container = await getCosmosContainer();
  await container.items.upsert({
    id: 'config',
    type: 'config',
    initialCapital: newCapital,
    lastUpdated: new Date().toISOString(),
  });
}

// GET: Retrieve all fund transactions
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    let fundTransactions = await getFundTransactions();

    if (fromParam) {
      const fromDate = new Date(fromParam);
      fromDate.setHours(0, 0, 0, 0);

      fundTransactions = fundTransactions.filter(t => {
        const tDate = new Date(t.date);
        tDate.setHours(0, 0, 0, 0);

        if (toParam) {
          const toDate = new Date(toParam);
          toDate.setHours(23, 59, 59, 999);
          return tDate >= fromDate && tDate <= toDate;
        }
        return tDate >= fromDate;
      });
    }

    return NextResponse.json({
      fundTransactions,
    });
  } catch (error) {
    console.error('Error reading fund transactions:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

// POST: Add new fund transaction
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const newTransaction: Omit<FundTransaction, 'id'> = await request.json();
    const container = await getCosmosContainer();

    const transaction: FundTransaction = {
      id: `fund-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newTransaction,
      date: new Date(newTransaction.date),
    };

    // Save fund transaction to Cosmos DB
    await container.items.upsert({
      id: transaction.id,
      type: 'fundTransaction',
      fundType: transaction.type,
      amount: transaction.amount,
      date: transaction.date.toISOString(),
      notes: transaction.notes,
    });

    // Update initial capital based on transaction type
    const currentCapital = await getInitialCapital();
    let newCapital = currentCapital;

    if (transaction.type === 'DEPOSIT') {
      newCapital = currentCapital + transaction.amount;
    } else if (transaction.type === 'WITHDRAWAL') {
      newCapital = currentCapital - transaction.amount;
    }

    await updateInitialCapital(newCapital);

    return NextResponse.json({
      transaction,
      newInitialCapital: newCapital,
      message: 'Fund transaction added successfully'
    });
  } catch (error) {
    console.error('Error adding fund transaction:', error);
    return NextResponse.json({ error: 'Failed to add fund transaction' }, { status: 500 });
  }
}

// DELETE: Delete a specific fund transaction or clear all
export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const container = await getCosmosContainer();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // If ID is provided, delete specific transaction
    if (id) {
      // Get the transaction to reverse the capital adjustment
      const fundTransactions = await getFundTransactions();
      const transaction = fundTransactions.find(t => t.id === id);

      if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      // Reverse the capital adjustment
      const currentCapital = await getInitialCapital();
      let newCapital = currentCapital;

      if (transaction.type === 'DEPOSIT') {
        newCapital = currentCapital - transaction.amount;
      } else if (transaction.type === 'WITHDRAWAL') {
        newCapital = currentCapital + transaction.amount;
      }

      await updateInitialCapital(newCapital);

      // Delete the transaction
      await container.item(id, 'fundTransaction').delete();

      return NextResponse.json({
        message: 'Fund transaction deleted successfully',
        newInitialCapital: newCapital,
      });
    }

    // Otherwise, delete all fund transactions
    const fundTransactions = await getFundTransactions();

    // Reverse all fund transactions by adjusting initial capital
    let capitalAdjustment = 0;
    fundTransactions.forEach(transaction => {
      if (transaction.type === 'DEPOSIT') {
        capitalAdjustment -= transaction.amount;
      } else if (transaction.type === 'WITHDRAWAL') {
        capitalAdjustment += transaction.amount;
      }
    });

    // Update initial capital
    const currentCapital = await getInitialCapital();
    await updateInitialCapital(currentCapital + capitalAdjustment);

    // Delete all fund transaction documents
    for (const transaction of fundTransactions) {
      await container.item(transaction.id, 'fundTransaction').delete();
    }

    return NextResponse.json({
      message: 'All fund transactions cleared successfully',
      newInitialCapital: currentCapital + capitalAdjustment,
    });
  } catch (error) {
    console.error('Error deleting fund transactions:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
