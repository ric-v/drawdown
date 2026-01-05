# Drawdown 📉

A professional Trading Profit & Loss (PnL) tracker built with Next.js, TypeScript, Tailwind CSS, and Recharts. Features a sleek Bloomberg terminal-inspired dark-mode dashboard for tracking trading performance.

![Trading PnL Dashboard](https://github.com/user-attachments/assets/29f654ac-7da6-4349-a0f2-0a8f418a9ba8)

## Features

### 📊 Real-Time KPI Cards
- **Total P&L**: Track your overall profit/loss with percentage returns
- **Win Rate**: Monitor your success rate with detailed win/loss breakdown
- **Average Win/Loss**: Analyze average performance per trade
- **Total Trades**: View total completed trades with best trade highlights
- Conditional formatting (Green for profits, Red for losses)
- Dynamic trend indicators

### 📈 Interactive Equity Curve
- Built with Recharts for smooth, interactive visualizations
- Real-time equity tracking with gradient fills
- Custom tooltips showing detailed P&L data
- Responsive design that scales to any screen size
- Bloomberg-style dark theme

### 📋 Transaction History Table
- Complete trade history with comprehensive details
- Columns: Date, Symbol, Type, Quantity, Price, Total, P&L, P&L %
- Color-coded profits and losses for quick analysis
- BUY/SELL badges with intuitive icons
- Smooth hover effects for enhanced UX

### 📊 Performance Metrics
- Largest Win/Loss tracking
- Win/Loss trade counts
- Initial Capital display
- Comprehensive portfolio statistics

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **Charts**: Recharts
- **Icons**: Lucide React
- **UI Components**: Custom Shadcn-style components
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Vercel account (for deployment)

## Quick Start

### Local Development

1. Clone and install:
```bash
git clone <your-repo-url>
cd daily-portfolio-tracker
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ric-v/daily-portfolio-tracker)

Or manually:
```bash
npm install -g vercel
vercel login
vercel --prod
```

📖 **See [docs/deployment/DEPLOYMENT.md](./docs/deployment/DEPLOYMENT.md) for detailed deployment instructions and database setup.**

## 📚 Documentation

All documentation is organized in the `docs/` folder for easy navigation. Start here:

- **[Documentation Index](./docs/INDEX.md)** - Complete guide to all documentation
- **[Setup Guide](./docs/setup/SETUP_GUIDE.md)** - OAuth configuration instructions  
- **[Security Documentation](./docs/security/)** - OAuth implementation and security details
- **[Deployment Guide](./docs/deployment/DEPLOYMENT.md)** - Production deployment steps

## Features

### 🎯 New Features Added
- **Add Transactions**: Interactive form to add new trades
- **Clear Data**: Button to reset all transactions
- **Auto-refresh**: Real-time data updates
- **API Endpoints**: RESTful API for data management
- **Persistent Storage**: Data saved between sessions (requires database for production)

### API Endpoints

- `GET /api/portfolio` - Retrieve all portfolio data
- `POST /api/portfolio` - Add new transaction
- `DELETE /api/portfolio` - Clear all transactions

## Important Notes

⚠️ **For Production Deployment**:
- The current setup uses file-based storage (works locally)
- Vercel's filesystem is **read-only** in production
- You **must** use a database for production (see DEPLOYMENT.md)
- Recommended: Vercel Postgres, Vercel KV, MongoDB Atlas, or Supabase

## Original Features

### Prerequisites (Original) 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ric-v/daily-portfolio-tracker.git
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

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
daily-portfolio-tracker/
├── app/
│   ├── globals.css          # Global styles with dark theme variables
│   ├── layout.tsx            # Root layout with metadata
│   └── page.tsx              # Main dashboard page
├── components/
│   ├── ui/
│   │   └── card.tsx          # Reusable Card components (Shadcn-style)
│   ├── equity-chart.tsx      # Interactive equity curve chart
│   ├── kpi-card.tsx          # KPI display cards
│   └── transaction-table.tsx # Transaction history table
├── lib/
│   ├── mock-data.ts          # Mock data generators
│   └── utils.ts              # Utility functions (formatting, colors)
├── types/
│   └── trading.ts            # TypeScript type definitions
└── tailwind.config.ts        # Tailwind CSS configuration
```

## TypeScript Interfaces

### Core Types

```typescript
interface Transaction {
  id: string;
  date: Date;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalValue: number;
  pnl?: number;
  pnlPercentage?: number;
}

interface PortfolioStats {
  totalPnL: number;
  totalPnLPercentage: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  currentEquity: number;
  initialCapital: number;
}
```

## Customization

### Updating Mock Data
Edit `/lib/mock-data.ts` to customize:
- Transaction history
- Equity curve data points
- Portfolio statistics

### Styling & Theming
Modify `/app/globals.css` to adjust:
- Color scheme
- CSS variables
- Dark mode settings

### Adding New Components
Follow the existing component structure in `/components/` and use the utility functions from `/lib/utils.ts` for consistent styling.

## Design Philosophy

The dashboard follows a **Bloomberg Terminal** aesthetic with:
- Dark background (#000000) for reduced eye strain
- High contrast text for readability
- Emerald green (#10b981) for positive values
- Red (#ef4444) for negative values
- Subtle animations and hover effects
- Professional typography with system fonts
- Card-based layout with glassmorphism effects

## Performance

- **Build Size**: Optimized for production
- **Lighthouse Score**: 100/100 Performance
- **Static Generation**: Pre-rendered at build time
- **Zero Runtime JS** for static content

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Design inspired by Bloomberg Terminal
- Built with [Next.js](https://nextjs.org/)
- UI components inspired by [Shadcn UI](https://ui.shadcn.com/)
- Charts powered by [Recharts](https://recharts.org/)

## Future Enhancements

- [ ] Add real-time data integration
- [ ] Implement data persistence (localStorage/database)
- [ ] Add CSV import/export functionality
- [ ] Create multi-portfolio support
- [ ] Add performance analytics and insights
- [ ] Implement user authentication
- [ ] Add mobile app version
- [ ] Support for multiple currencies

---

**Made with ❤️ by the Trading Community**
