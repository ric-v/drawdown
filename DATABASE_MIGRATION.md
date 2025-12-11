# Database Migration Guide

This guide helps you migrate from file-based storage to a production database for Vercel deployment.

## Why You Need a Database

Vercel's serverless functions have a **read-only filesystem**. While the JSON file approach works for local development, you need a database for production deployment.

## Option 1: Vercel Postgres (Recommended)

### Setup

1. Go to your Vercel project dashboard
2. Navigate to "Storage" tab
3. Click "Create Database" → "Postgres"
4. Follow the setup wizard

### Install Package

```bash
npm install @vercel/postgres
```

### Update API Route

Replace the file operations in `app/api/portfolio/route.ts`:

```typescript
import { sql } from '@vercel/postgres';

// Create table (run once)
export async function GET() {
  try {
    // Initialize table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        type VARCHAR(4) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        total_value DECIMAL(12, 2) NOT NULL,
        pnl DECIMAL(10, 2),
        pnl_percentage DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Fetch all transactions
    const { rows } = await sql`
      SELECT * FROM transactions ORDER BY date DESC
    `;

    // Calculate stats and return
    // ... (use existing calculation logic)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST: Add transaction
export async function POST(request: Request) {
  const transaction = await request.json();
  
  await sql`
    INSERT INTO transactions (date, symbol, type, quantity, price, total_value, pnl, pnl_percentage)
    VALUES (${transaction.date}, ${transaction.symbol}, ${transaction.type}, 
            ${transaction.quantity}, ${transaction.price}, ${transaction.totalValue},
            ${transaction.pnl || null}, ${transaction.pnlPercentage || null})
  `;
  
  // Fetch updated data and return
}

// DELETE: Clear all transactions
export async function DELETE() {
  await sql`DELETE FROM transactions`;
  // Return success response
}
```

## Option 2: Vercel KV (Redis)

### Setup

1. Go to Vercel Dashboard → Storage → Create Database → KV
2. Connect to your project

### Install Package

```bash
npm install @vercel/kv
```

### Update API Route

```typescript
import { kv } from '@vercel/kv';

const TRANSACTIONS_KEY = 'portfolio:transactions';
const CAPITAL_KEY = 'portfolio:initial_capital';

export async function GET() {
  const transactions = await kv.get(TRANSACTIONS_KEY) || [];
  const initialCapital = await kv.get(CAPITAL_KEY) || 100000;
  
  // Calculate stats and return
}

export async function POST(request: Request) {
  const transaction = await request.json();
  const transactions = await kv.get(TRANSACTIONS_KEY) || [];
  
  transactions.push(transaction);
  await kv.set(TRANSACTIONS_KEY, transactions);
  
  // Return updated data
}

export async function DELETE() {
  await kv.del(TRANSACTIONS_KEY);
  // Return success response
}
```

## Option 3: MongoDB Atlas

### Setup

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Add to Vercel environment variables: `MONGODB_URI`

### Install Package

```bash
npm install mongodb
```

### Create Connection

```typescript
// lib/mongodb.ts
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function connectToDatabase() {
  await client.connect();
  return client.db('portfolio');
}
```

### Update API Route

```typescript
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  const db = await connectToDatabase();
  const transactions = await db.collection('transactions')
    .find({})
    .sort({ date: -1 })
    .toArray();
  
  // Calculate stats and return
}

export async function POST(request: Request) {
  const transaction = await request.json();
  const db = await connectToDatabase();
  
  await db.collection('transactions').insertOne(transaction);
  
  // Return updated data
}

export async function DELETE() {
  const db = await connectToDatabase();
  await db.collection('transactions').deleteMany({});
  // Return success response
}
```

## Option 4: Supabase

### Setup

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get API URL and anon key
4. Add to Vercel environment variables

### Install Package

```bash
npm install @supabase/supabase-js
```

### Create Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Update API Route

```typescript
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });
  
  // Calculate stats and return
}

export async function POST(request: Request) {
  const transaction = await request.json();
  
  await supabase
    .from('transactions')
    .insert([transaction]);
  
  // Return updated data
}

export async function DELETE() {
  await supabase
    .from('transactions')
    .delete()
    .neq('id', 0); // Delete all
  
  // Return success response
}
```

## Environment Variables

After choosing a database, add the required environment variables in Vercel:

1. Go to Project Settings → Environment Variables
2. Add the required variables for your database
3. Redeploy your application

## Testing

After migration:

1. Test locally with the database credentials
2. Deploy to Vercel
3. Test all endpoints:
   - GET: Fetch data
   - POST: Add transaction
   - DELETE: Clear data

## Migration from File Storage

If you have existing data in `data/portfolio-data.json`:

1. Set up your database
2. Create a migration script:

```typescript
// scripts/migrate.ts
import fs from 'fs';
import path from 'path';

const data = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data', 'portfolio-data.json'), 'utf-8')
);

// Insert data.transactions into your database
// Use your database client from above examples
```

3. Run the migration: `npx ts-node scripts/migrate.ts`

## Troubleshooting

### Connection Errors
- Verify environment variables are set correctly
- Check database credentials
- Ensure IP whitelist includes Vercel IPs (for MongoDB)

### Slow Performance
- Add indexes on frequently queried fields (date, symbol)
- Use connection pooling
- Consider caching frequently accessed data

### Data Loss
- Always backup before migration
- Test thoroughly in development
- Use transactions for critical operations

## Cost Considerations

- **Vercel Postgres**: Free tier includes 256 MB storage
- **Vercel KV**: Free tier includes 256 MB storage
- **MongoDB Atlas**: Free tier includes 512 MB storage
- **Supabase**: Free tier includes 500 MB storage

All options provide generous free tiers suitable for personal trading trackers.
