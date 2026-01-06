import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import * as GoogleDrive from '@/lib/google-drive';
import * as OneDrive from '@/lib/onedrive';
import type { FundTransaction } from '@/types/trading';

// GET: Retrieve all fund transactions
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || !session.accessToken || !session.provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Read data from cloud storage
    let data;
    if (session.provider === 'google') {
      data = await GoogleDrive.readPortfolioData(session.accessToken);
    } else if (session.provider === 'microsoft-entra-id') {
      data = await OneDrive.readPortfolioData(session.accessToken);
    }

    if (!data) {
      data = {
        fundTransactions: [],
        dailyPnL: [],
        initialCapital: 100000,
        lastUpdated: new Date().toISOString()
      };
    }

    let fundTransactions = data.fundTransactions || [];

    if (fromParam) {
      const fromDate = new Date(fromParam);
      fromDate.setHours(0, 0, 0, 0);

      fundTransactions = fundTransactions.filter((t: any) => {
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
    if (!session || !session.accessToken || !session.provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const newTransaction: Omit<FundTransaction, 'id'> = await request.json();

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

    const transaction: FundTransaction = {
      id: `fund-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newTransaction,
      date: new Date(newTransaction.date),
    };

    // Add transaction to history
    data.fundTransactions = data.fundTransactions || [];
    data.fundTransactions.push(transaction);

    // Update initial capital based on transaction type
    if (transaction.type === 'DEPOSIT') {
      data.initialCapital += transaction.amount;
    } else if (transaction.type === 'WITHDRAWAL') {
      data.initialCapital -= transaction.amount;
    }

    data.lastUpdated = new Date().toISOString();

    // Save back to cloud storage
    if (session.provider === 'google') {
      await GoogleDrive.savePortfolioData(session.accessToken, data);
    } else if (session.provider === 'microsoft-entra-id') {
      await OneDrive.savePortfolioData(session.accessToken, data);
    }

    return NextResponse.json({
      transaction,
      newInitialCapital: data.initialCapital,
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
    if (!session || !session.accessToken || !session.provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

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

    // If ID is provided, delete specific transaction
    if (id) {
      const transaction = data.fundTransactions?.find((t: any) => t.id === id);

      if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      // Reverse the capital adjustment
      if (transaction.type === 'DEPOSIT') {
        data.initialCapital -= transaction.amount;
      } else if (transaction.type === 'WITHDRAWAL') {
        data.initialCapital += transaction.amount;
      }

      // Remove transaction
      data.fundTransactions = data.fundTransactions.filter((t: any) => t.id !== id);
      data.lastUpdated = new Date().toISOString();

      // Save back to cloud storage
      if (session.provider === 'google') {
        await GoogleDrive.savePortfolioData(session.accessToken, data);
      } else if (session.provider === 'microsoft-entra-id') {
        await OneDrive.savePortfolioData(session.accessToken, data);
      }

      return NextResponse.json({
        message: 'Fund transaction deleted successfully',
        newInitialCapital: data.initialCapital
      });
    } else {
      // Clear all fund transactions and reset capital
      const defaultCapital = 100000;
      data.fundTransactions = [];
      data.initialCapital = defaultCapital;
      data.lastUpdated = new Date().toISOString();

      // Save back to cloud storage
      if (session.provider === 'google') {
        await GoogleDrive.savePortfolioData(session.accessToken, data);
      } else if (session.provider === 'microsoft-entra-id') {
        await OneDrive.savePortfolioData(session.accessToken, data);
      }

      return NextResponse.json({
        message: 'All fund transactions cleared successfully',
        newInitialCapital: defaultCapital
      });
    }
  } catch (error) {
    console.error('Error deleting fund transaction:', error);
    return NextResponse.json({ error: 'Failed to delete fund transaction' }, { status: 500 });
  }
}
