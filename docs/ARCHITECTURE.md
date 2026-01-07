# 🏗 Architecture Guide

System design and component architecture for Drawdown.

## System Layers

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│        React Components (TSX + Tailwind CSS)            │
│  ├─ Layout: AppLayout, ThemeProvider                   │
│  ├─ Features: KPI, Charts, Transactions, Funds         │
│  └─ UI: Buttons, Cards, Dialogs, Tables (Shadcn)      │
├─────────────────────────────────────────────────────────┤
│                  Business Logic Layer                    │
│        Hooks & Utilities (/lib)                         │
│  ├─ Calculations: PnL, win rate, drawdown             │
│  ├─ Formatting: Currency, percentage, dates           │
│  └─ Integration: Google Drive, OneDrive API           │
├─────────────────────────────────────────────────────────┤
│                  API Layer                              │
│        Next.js API Routes (/api)                        │
│  ├─ /api/auth/* - NextAuth.js OAuth                   │
│  ├─ /api/portfolio - CRUD operations                  │
│  ├─ /api/portfolio/equity - Equity curve              │
│  └─ /api/portfolio/funds - Fund transactions          │
├─────────────────────────────────────────────────────────┤
│                  Storage Layer                          │
│  ├─ Development: File-based                            │
│  ├─ Production: Database (Vercel Postgres, MongoDB)    │
│  └─ Cloud: Google Drive, OneDrive (optional)          │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

### `/src/app` - Next.js App Router

```
app/
├── page.tsx              # Main dashboard
├── layout.tsx            # Root layout
├── globals.css           # Global styles
├── middleware.ts         # Auth middleware
├── (public)/             # Public routes
│   ├── privacy/page.tsx
│   └── terms/page.tsx
└── api/                  # API routes
    ├── auth/[...nextauth]/route.ts
    ├── portfolio/route.ts
    ├── portfolio/equity/route.ts
    ├── portfolio/funds/route.ts
    └── get-ip/route.ts
```

### `/src/components` - React Components

```
components/
├── auth/                 # Login, user profile
├── features/
│   ├── portfolio/        # KPI cards, charts
│   ├── transactions/     # Transaction table, forms
│   └── funds/            # Fund history, forms
├── layout/               # App layout, theme
└── ui/                   # Reusable UI components
```

### `/src/lib` - Core Utilities

```
lib/
├── utils/utils.ts        # Helpers (format, calculate)
├── auth.ts & auth.config.ts
├── google-drive.ts       # Google Drive API
├── onedrive.ts          # OneDrive API
└── is-public-route.ts
```

### `/src/types` - TypeScript Types

```typescript
// Key types
interface DailyPnL {
  id: string;
  date: Date;
  pnl: number;
  notes?: string;
}

interface PortfolioStats {
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  // ... 10+ metrics
}

interface EquityPoint {
  date: string;
  equity: number;
  pnl: number;
  pnlPercentage: number;
}
```

## Data Flow

### Adding a Transaction

```
1. User fills form (AddTransactionForm)
2. Client-side validation
3. POST /api/portfolio
4. Server validates & persists
5. Response sent back
6. Component state updated
7. KPI calculations triggered
8. UI re-renders
```

### KPI Calculations

**Key Metrics:**

- **Win Rate (%)** = (profitDays / totalDays) × 100
- **Profit Factor** = grossProfit / |grossLoss|
- **Max Drawdown** = (peakEquity - troughEquity) / peakEquity
- **Expectancy** = totalPnL / totalDays
- **Current Streak** = consecutive winning/losing days

## Authentication

**NextAuth.js v5 with OAuth 2.0:**

- **Providers**: Google, Microsoft Entra ID
- **Session**: JWT-based, 30-day expiry
- **Token Refresh**: Automatic hourly refresh
- **Protection**: Middleware-based route guards

```typescript
// Protected routes
const session = await auth();
if (!session) return Response.redirect('/login');
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/portfolio` | GET | Fetch all data |
| `/api/portfolio` | POST | Add transaction |
| `/api/portfolio/[id]` | PUT | Update transaction |
| `/api/portfolio/[id]` | DELETE | Delete transaction |
| `/api/portfolio/equity` | GET | Equity curve data |
| `/api/portfolio/funds` | GET | Fund transactions |
| `/api/portfolio/funds` | POST | Add fund transaction |

## Testing

- **Framework**: Jest + React Testing Library
- **Test Files**: Colocated in `__tests__/` folders
- **Coverage Target**: 70%+ for components, 90%+ for utilities

## Performance Optimizations

- Code splitting per route
- Component memoization with React.memo()
- useMemo/useCallback for expensive operations
- Image optimization
- CSS minification

## Security

- NextAuth.js session management
- OAuth 2.0 token refresh
- CSRF protection
- HTTPS-only in production
- Environment-based secrets
- Input validation (client & server)

---

**Last updated**: January 6, 2026
```

---

## Data Flow

### User Interaction Flow

```
1. User clicks "Add Transaction"
   ↓
2. Form component (AddTransactionForm)
   ↓
3. Form validation (client-side)
   ↓
4. Submit → POST /api/portfolio
   ↓
5. API route processes request
   ↓
6. Data persisted (file/database)
   ↓
7. Response sent back
   ↓
8. Component state updated
   ↓
9. UI re-renders with new data
   ↓
10. Calculations triggered
    ├─ KPI metrics recalculated
    ├─ Equity curve updated
    └─ Table refreshed
```

### State Management

**Local State:**
```typescript
const [transactions, setTransactions] = useState<DailyPnL[]>([]);
const [stats, setStats] = useState<PortfolioStats>({...});
const [loading, setLoading] = useState(false);
```

**Server State:**
```typescript
// Fetched from API routes
const portfolioData = await fetch('/api/portfolio');
```

**Session State:**
```typescript
// NextAuth.js session
const { data: session } = useSession();
```

---

## Component Hierarchy

### Main Dashboard

```
<Dashboard />  (src/app/page.tsx - Main page)
├─ <AppLayout />  (Layout wrapper)
│  ├─ <Header />
│  │  ├─ <UserNav />
│  │  └─ <ThemeToggle />
│  ├─ <MainContent />
│  │  ├─ <KPISection />
│  │  │  ├─ <KPICard /> (Total P&L)
│  │  │  ├─ <KPICard /> (Win Rate)
│  │  │  └─ ... (8+ cards)
│  │  ├─ <EquityChartSection />
│  │  │  └─ <EquityChart /> (Recharts)
│  │  ├─ <DateRangeFilter />
│  │  │  └─ <DatePicker />
│  │  └─ <DataSection />
│  │     ├─ <Tabs />
│  │     ├─ <TransactionTable />
│  │     ├─ <AddTransactionForm />
│  │     ├─ <FundHistory />
│  │     └─ <AddFundsForm />
│  └─ <Footer />
└─ <SessionProvider />
```

---

## Calculation Logic

### KPI Calculations

**Win Rate:**
```typescript
const winRate = (profitDays / totalDays) * 100;
// Based on count of days with pnl > 0
```

**Profit Factor:**
```typescript
const grossProfit = transactions
  .filter(t => t.pnl > 0)
  .reduce((sum, t) => sum + t.pnl, 0);

const grossLoss = Math.abs(transactions
  .filter(t => t.pnl < 0)
  .reduce((sum, t) => sum + t.pnl, 0));

const profitFactor = grossProfit / grossLoss;
```

**Max Drawdown:**
```typescript
let peak = initialCapital;
let maxDD = 0;

for (const point of equityPoints) {
  if (point.equity > peak) {
    peak = point.equity;
  }
  const dd = (peak - point.equity) / peak;
  maxDD = Math.max(maxDD, dd);
}
```

### Equity Curve Generation

```typescript
function generateEquityPoints(
  transactions: DailyPnL[],
  initialCapital: number
): EquityPoint[] {
  let equity = initialCapital;
  
  return transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(transaction => {
      equity += transaction.pnl;
      
      return {
        date: formatISO(transaction.date),
        displayDate: format(transaction.date, 'MMM d'),
        equity,
        pnl: transaction.pnl,
        pnlPercentage: ((equity - initialCapital) / initialCapital) * 100,
      };
    });
}
```

---

## API Routes

### Portfolio Endpoints

```typescript
// GET /api/portfolio
// Fetch all portfolio data
Response: {
  transactions: DailyPnL[],
  stats: PortfolioStats,
  equityPoints: EquityPoint[]
}

// POST /api/portfolio
// Add new transaction
Body: { date: Date, pnl: number, notes?: string }
Response: { id: string }

// PUT /api/portfolio/[id]
// Update transaction
Body: Partial<DailyPnL>
Response: { success: boolean }

// DELETE /api/portfolio/[id]
// Delete transaction
Response: { success: boolean }

// DELETE /api/portfolio
// Clear all data
Response: { success: boolean }
```

---

## Authentication Flow

### NextAuth.js Integration

```
1. User clicks "Sign in"
   ↓
2. Redirected to /api/auth/signin
   ↓
3. Select provider (Google/Microsoft)
   ↓
4. OAuth provider login
   ↓
5. Callback: /api/auth/callback/[provider]
   ↓
6. Session created (JWT token)
   ↓
7. Redirect to dashboard
   ↓
8. useSession() hook returns session data
```

### Middleware Protection

```typescript
// middleware.ts
- Protected routes require valid session
- Public routes accessible without session
- API routes with auth checks
```

---

## Testing Architecture

### Test Structure

```
src/
├── lib/utils/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts      (Jest + Testing Library)
├── types/
│   ├── trading.ts
│   └── __tests__/
│       └── trading.test.ts
└── components/
    └── __tests__/
        └── [component].test.tsx
```

### Test Coverage

- **Utilities**: 90%+ coverage
- **Types**: 100% coverage (validation)
- **Components**: 70%+ coverage (rendering)
- **API Routes**: 60%+ coverage (critical paths)

---

## Performance Optimizations

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting (Next.js)
- Component lazy loading

### Caching
- HTTP caching headers on static files
- Browser caching via service workers
- API response caching with SWR hook

### Rendering
- React.memo() for expensive components
- useMemo() for calculations
- useCallback() for event handlers
- Proper dependency arrays

### Bundle Size
- Tree-shaking of unused code
- Image optimization
- CSS minification
- JavaScript minification

---

## Deployment Architecture

### Development
- Local file-based storage
- Hot module reloading
- Detailed error messages

### Production
- Database-backed storage
- Optimized builds
- Error tracking (Sentry optional)
- Analytics (Vercel Analytics)
- CDN delivery

---

## Security Layers

1. **Authentication**: NextAuth.js + OAuth 2.0
2. **Authorization**: Session-based access control
3. **Data Encryption**: HTTPS + optional field encryption
4. **Input Validation**: Server and client-side
5. **CSRF Protection**: Token-based
6. **Rate Limiting**: API endpoint protection
7. **CSP Headers**: Content security policy
8. **Secrets Management**: Environment variables

---

## Monitoring & Observability

### Logging
- Next.js built-in logging
- API route request logging
- Error tracking

### Analytics
- Vercel Analytics (page views, performance)
- Custom event tracking (optional)

### Performance Monitoring
- Lighthouse scores
- Core Web Vitals
- API response times

---

**Last updated**: January 6, 2026
