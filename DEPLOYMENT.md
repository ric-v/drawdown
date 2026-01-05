# Drawdown

A professional trading portfolio tracker with real-time P&L analytics, built with Next.js and deployed on Vercel.

## Features

- 📊 Real-time portfolio tracking
- 💰 P&L calculations and analytics
- 📈 Equity curve visualization
- 🎯 Win rate and performance metrics
- 💾 Persistent data storage
- 🔄 Daily updates capability

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Vercel account (for deployment)

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd daily-portfolio-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your repository
5. Vercel will auto-detect Next.js and configure build settings
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

## Data Persistence

### How Data is Stored

The application uses a JSON file-based storage system located in the `data/` directory:
- **Location**: `data/portfolio-data.json`
- **Structure**:
  ```json
  {
    "transactions": [],
    "initialCapital": 100000,
    "lastUpdated": null
  }
  ```

### Important Notes on Vercel Deployment

⚠️ **Vercel's filesystem is read-only in production**. This means:
- The JSON file approach works for local development
- For production on Vercel, you need a database solution

### Recommended Database Solutions for Production

1. **Vercel Postgres** (Recommended)
   - Native integration with Vercel
   - Serverless SQL database
   - Free tier available

2. **Vercel KV** (Redis)
   - Key-value store
   - Perfect for simple data structures
   - Fast and scalable

3. **MongoDB Atlas**
   - NoSQL database
   - Free tier available
   - Easy JSON-like documents

4. **Supabase**
   - Open-source Firebase alternative
   - PostgreSQL database
   - Free tier available

### Migrating to a Database (Example with Vercel Postgres)

1. Install Vercel Postgres package:
```bash
npm install @vercel/postgres
```

2. Set up database in Vercel Dashboard:
   - Go to your project
   - Navigate to "Storage"
   - Create a new Postgres database

3. Update the API route to use Postgres instead of file system

## API Endpoints

### GET /api/portfolio
Retrieve all portfolio data including transactions, stats, and equity curve.

**Response:**
```json
{
  "transactions": [...],
  "stats": {...},
  "equityData": [...],
  "initialCapital": 100000,
  "lastUpdated": "2024-12-11T..."
}
```

### POST /api/portfolio
Add a new transaction.

**Request Body:**
```json
{
  "date": "2024-12-11",
  "symbol": "AAPL",
  "type": "BUY",
  "quantity": 100,
  "price": 182.50,
  "totalValue": 18250,
  "pnl": 270,
  "pnlPercentage": 1.48
}
```

### DELETE /api/portfolio
Clear all transactions.

## Environment Variables

No environment variables are required for basic operation. If you integrate a database, you'll need to add:

```env
# Example for Vercel Postgres
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

## Project Structure

```
daily-portfolio-tracker/
├── app/
│   ├── api/
│   │   └── portfolio/
│   │       └── route.ts          # API endpoints
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Main dashboard
├── components/
│   ├── equity-chart.tsx           # Equity curve chart
│   ├── kpi-card.tsx               # KPI display cards
│   ├── transaction-table.tsx      # Transaction history
│   └── ui/
│       └── card.tsx               # Base card component
├── data/
│   └── portfolio-data.json        # Data storage (local only)
├── lib/
│   ├── mock-data.ts               # Mock data generators
│   └── utils.ts                   # Utility functions
├── types/
│   └── trading.ts                 # TypeScript interfaces
├── vercel.json                    # Vercel configuration
└── package.json
```

## Adding New Transactions

Currently, transactions can be added via API calls. To add a UI form:

1. Create a new component for the transaction form
2. Use the POST endpoint to submit new transactions
3. Refresh the dashboard after successful submission

## Technology Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Vercel

## Development Workflow

1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to your repository
4. Vercel automatically deploys changes (if connected)

## Troubleshooting

### Build Errors on Vercel

If you encounter build errors:
1. Check the build logs in Vercel Dashboard
2. Ensure all dependencies are in `package.json`
3. Verify TypeScript types are correct
4. Run `npm run build` locally to test

### Data Not Persisting

Remember: Vercel's filesystem is ephemeral. For production:
- Use a database solution (see recommendations above)
- Consider Vercel's built-in storage options

### CORS Issues

If accessing from external domains:
- Configure CORS in `next.config.js`
- Or use Vercel's built-in environment variable system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

See LICENSE file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Check Vercel documentation: https://vercel.com/docs
- Next.js documentation: https://nextjs.org/docs

---

**Note**: This README assumes you're using the file-based storage for local development. For production deployment on Vercel, you must migrate to a database solution as described above.
