# 📡 API Reference

Complete API endpoint documentation for Drawdown.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

All endpoints require a valid NextAuth session (handled automatically via cookies).

```typescript
const response = await fetch('/api/portfolio');
const data = await response.json();
```

---

## Portfolio Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolio` | Get all portfolio data |
| POST | `/api/portfolio` | Add new transaction |
| PUT | `/api/portfolio/[id]` | Update transaction |
| DELETE | `/api/portfolio/[id]` | Delete transaction |
| DELETE | `/api/portfolio` | Clear all data |

### GET /api/portfolio

Fetch all portfolio data including transactions, stats, and equity points.

**Response:**
```typescript
{
  transactions: DailyPnL[],
  stats: PortfolioStats,
  equityPoints: EquityPoint[],
  funds: FundTransaction[]
}
```

---

### POST /api/portfolio

Add a new daily P&L entry.

**Request:**
```typescript
{
  date: "YYYY-MM-DD",
  pnl: number,
  notes?: string
}
```

**Response:**
```typescript
{
  id: string,
  date: string,
  pnl: number,
  notes?: string,
  createdAt: string
}
```

---

### PUT /api/portfolio/[id]

Update an existing transaction.

**Request:**
```typescript
{
  date?: "YYYY-MM-DD",
  pnl?: number,
  notes?: string
}
```

---

### DELETE /api/portfolio/[id]

Delete a specific transaction.

---

## Equity Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolio/equity` | Get equity curve data |

### GET /api/portfolio/equity

Fetch equity curve points for charting.

**Response:**
```typescript
[
  {
    date: "2024-01-01",
    displayDate: "Jan 1",
    equity: 50000,
    pnl: 0,
    pnlPercentage: 0
  },
  // ...
]
```

---

## Fund Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolio/funds` | Get fund transactions |
| POST | `/api/portfolio/funds` | Add fund transaction |

### GET /api/portfolio/funds

Fetch all deposits and withdrawals.

**Response:**
```typescript
[
  {
    id: string,
    date: "YYYY-MM-DD",
    amount: number,
    type: "DEPOSIT" | "WITHDRAWAL",
    notes?: string
  }
]
```

### POST /api/portfolio/funds

Add a deposit or withdrawal.

**Request:**
```typescript
{
  date: "YYYY-MM-DD",
  amount: number,
  type: "DEPOSIT" | "WITHDRAWAL",
  notes?: string
}
```

---

## Data Types

```typescript
interface DailyPnL {
  id: string;
  date: Date;
  pnl: number;
  notes?: string;
}

interface PortfolioStats {
  totalPnL: number;
  totalPnLPercentage: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  expectancy: number;
  currentStreak: number;
}

interface EquityPoint {
  date: string;
  equity: number;
  pnl: number;
  pnlPercentage: number;
}

interface FundTransaction {
  id: string;
  date: Date;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  notes?: string;
}
```

---

## Error Responses

| Status | Code | Meaning |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Session required |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 500 | SERVER_ERROR | Internal error |

**Response Format:**
```typescript
{
  error: string,
  code?: string,
  details?: object
}
```

---

**Last updated**: January 6, 2026
