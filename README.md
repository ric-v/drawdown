# Drawdown 📉

A professional, premium trading Profit & Loss (PnL) tracker built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **Recharts**. Features a sleek Bloomberg terminal-inspired dark-mode dashboard for tracking trading performance with advanced analytics and real-time updates.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ric-v/drawdown)

![Trading PnL Dashboard](https://github.com/ric-v/drawdown/assets/user/dashboard-preview.png)

## ✨ Key Features

### 📊 Real-Time KPI Dashboard
- **Total P&L**: Comprehensive profit/loss tracking with percentage returns
- **Win Rate**: Detailed win/loss breakdown with visual indicators
- **Average Win/Loss**: Performance metrics per trade
- **Profit Factor**: Advanced metric for strategy evaluation
- **Max Drawdown**: Peak-to-trough decline analysis
- **Current Streak**: Winning/losing streak tracking
- Conditional formatting (Emerald green for profits, Rose red for losses)
- Dynamic trend indicators with animations

### 📈 Interactive Equity Curve
- Built with Recharts for smooth, responsive visualizations
- Real-time equity tracking with gradient fills
- Custom tooltips with detailed P&L data
- Responsive design scaling to any screen size
- Bloomberg-style dark theme with professional styling

### 📋 Advanced Transaction Management
- Complete trade history with comprehensive details
- Columns: Date, Symbol, Type, Quantity, Price, Total, P&L, P&L %
- Color-coded profits and losses for quick analysis
- BUY/SELL badges with intuitive icons
- Inline editing capabilities
- Smooth hover effects and transitions

### 💰 Fund Management
- Track deposits and withdrawals
- Complete fund transaction history
- Initial capital configuration
- Fund flow visualization

### 📊 Performance Calendar
- Visual representation of trading performance
- Daily P&L heatmap
- Profitable and losing day identification
- Monthly performance summaries

### 🔐 Authentication & Security
- **OAuth 2.0 Integration**:
  - Google OAuth support
  - Microsoft Entra ID (Azure AD) support
  - Secure session management with NextAuth.js
- **Data Storage Options**:
  - Google Drive integration for cloud backup
  - OneDrive/SharePoint integration (optional)
  - Secure data compression and encryption
- Role-based access control
- Environment-based configuration

### 📱 Responsive Design
- Mobile-first approach
- Desktop, tablet, and mobile optimization
- Touch-friendly interface
- Adaptive layouts

### 🎨 Professional UI/UX
- Dark mode by default (Bloomberg terminal aesthetic)
- Custom Shadcn-style components
- Tailwind CSS v3 with animations
- Glassmorphism effects
- Smooth transitions and micro-interactions

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 with App Router |
| **Language** | TypeScript 5.9 |
| **Styling** | Tailwind CSS 3.4 |
| **Charts** | Recharts 3.5 |
| **Icons** | Lucide React |
| **UI Components** | Shadcn-style components + Radix UI |
| **Authentication** | NextAuth.js 5.0-beta |
| **Date Handling** | date-fns 3.6 |
| **Testing** | Jest 29 + React Testing Library |
| **Code Quality** | ESLint + Prettier |
| **Cloud Storage** | Google Drive API, Microsoft Graph |

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **npm 9+** or **yarn 1.22+**
- Git
- Google Cloud Console account (for OAuth)

### Quick Start - Local Development

```bash
# 1. Clone the repository
git clone https://github.com/ric-v/drawdown.git
cd drawdown

# 2. Install dependencies
npm install

# 3. Set up environment variables (see Setup Guide below)
cp .env.example .env.local

# 4. Run development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:3000
```

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Run unit tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage

# Type checking
npm run type-check
```

## 📋 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
AUTH_SECRET="your-random-secret-key-at-least-32-chars"
AUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Microsoft Entra ID (Optional)
AUTH_MICROSOFT_ENTRA_ID_ID="your-client-id"
AUTH_MICROSOFT_ENTRA_ID_SECRET="your-client-secret"
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID="common"
```

### 2. Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

### 3. OAuth Configuration

See **[Setup Guide](./docs/SETUP.md)** for detailed OAuth configuration instructions for:
- ✅ Google OAuth
- ✅ Microsoft Entra ID
- ✅ Google Drive Integration
- ✅ OneDrive Integration

## 📚 Documentation

Complete documentation is available in the `/docs` folder:

| Document | Purpose |
|----------|---------|
| **[Setup Guide](./docs/SETUP.md)** | OAuth and environment configuration |
| **[Deployment Guide](./docs/DEPLOYMENT.md)** | Production deployment to Vercel, Azure |
| **[User Guide](./docs/USER_GUIDE.md)** | Feature walkthrough and usage |
| **[Features](./docs/FEATURES.md)** | Detailed feature documentation |
| **[Security](./docs/SECURITY.md)** | Security practices and data protection |
| **[Roadmap](./docs/ROADMAP.md)** | Future features and improvements |

## 🏗 Project Structure

```
drawdown/
├── public/                          # Static assets
├── src/
│   ├── app/                        # Next.js app router
│   │   ├── (public)/              # Public pages (privacy, terms)
│   │   ├── api/                   # API routes
│   │   │   ├── auth/              # NextAuth configuration
│   │   │   ├── portfolio/         # Portfolio endpoints
│   │   │   └── ...
│   │   ├── actions/               # Server actions
│   │   ├── globals.css            # Global styles with CSS variables
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main dashboard
│   ├── components/
│   │   ├── auth/                  # Authentication components
│   │   ├── features/              # Feature-specific components
│   │   │   ├── portfolio/         # Portfolio KPIs, charts
│   │   │   ├── transactions/      # Transaction management
│   │   │   └── funds/             # Fund management
│   │   ├── layout/                # Layout components
│   │   └── ui/                    # Reusable UI components
│   ├── config/                    # Configuration files
│   ├── hooks/                     # React hooks
│   ├── lib/
│   │   ├── utils/                 # Utility functions
│   │   ├── google-drive.ts        # Google Drive integration
│   │   ├── onedrive.ts            # OneDrive integration
│   │   └── auth/                  # Auth utilities
│   ├── middleware.ts              # Next.js middleware
│   └── types/                     # TypeScript type definitions
├── docs/                          # Documentation
├── .eslintrc.json                # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── jest.config.js                # Jest testing configuration
├── jest.setup.js                 # Jest setup
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.js                # Next.js configuration
└── package.json                  # Project dependencies
```

## 🧪 Testing

The project includes comprehensive unit tests using Jest and React Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage
```

### Test Coverage

- ✅ Utility functions (formatting, colors, calculations)
- ✅ Type definitions
- ✅ Component integration tests
- ✅ API route validation

### Test Location Pattern

Tests are co-located with source files:
```
src/
├── lib/
│   └── utils/
│       ├── utils.ts
│       └── __tests__/
│           └── utils.test.ts
```

## 📊 Core Type Definitions

### Transaction/DailyPnL

```typescript
interface DailyPnL {
  id: string;
  date: Date;
  pnl: number;        // Profit (+ve) or Loss (-ve)
  notes?: string;
}
```

### Portfolio Statistics

```typescript
interface PortfolioStats {
  totalPnL: number;
  totalPnLPercentage: number;
  winRate: number;
  totalDays: number;
  profitDays: number;
  lossDays: number;
  averageProfit: number;
  averageLoss: number;
  largestProfit: number;
  largestLoss: number;
  currentEquity: number;
  initialCapital: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  currentStreak: number;
}
```

## 🎨 Design System

### Color Palette

| Usage | Color | CSS Class |
|-------|-------|-----------|
| Profits | Emerald-600 | `text-emerald-600 dark:text-emerald-400` |
| Losses | Rose-600 | `text-rose-600 dark:text-rose-400` |
| Neutral | Gray-500 | `text-gray-500 dark:text-gray-400` |
| Background | Black | `#000000` |
| Text | Light Gray | `#f3f4f6` |

### Typography

- **Headings**: System fonts (sans-serif stack)
- **Body**: System fonts for performance
- **Mono**: System monospace for data

## 🔒 Security

### Data Protection
- OAuth 2.0 authentication
- Secure session tokens
- Environment-based secrets
- Data encryption for cloud storage
- CORS protection
- CSP headers configured

### Privacy
- No tracking cookies by default
- GDPR-compliant privacy policy
- User data stored in their Google Drive/OneDrive
- See [Security Documentation](./docs/SECURITY.md)

## 🚀 Deployment

### Vercel (Recommended)

1. Fork the repository on GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy with one click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ric-v/drawdown)

### Azure Static Web Apps

```bash
npm run build
az staticwebapp up --name drawdown --source . --deployment-token <token>
```

### Self-Hosted (Docker)

See [Deployment Guide](./docs/DEPLOYMENT.md) for Docker setup.

## ⚠️ Important Notes

### Production Deployment
- The current setup uses file-based storage (works locally)
- **Vercel's filesystem is read-only** in production
- **You MUST use a database for production** (Vercel Postgres, MongoDB Atlas, Supabase, etc.)
- See [Deployment Guide](./docs/DEPLOYMENT.md) for database setup

### Browser Support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest version
- Mobile browsers: iOS Safari 12+, Chrome Mobile latest

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality

- Run linter: `npm run lint:fix`
- Format code: `npm run format`
- Run tests: `npm test`
- Check types: `npm run type-check`

All pull requests must pass CI/CD checks.

## 🗺️ Roadmap

See [Roadmap](./docs/ROADMAP.md) for upcoming features:

- [ ] Real-time data integration with brokers
- [ ] AI-powered trading insights
- [ ] Advanced analytics dashboards
- [ ] Multi-portfolio support
- [ ] Trading signals and alerts
- [ ] Tax reporting tools
- [ ] Mobile app (React Native)
- [ ] Community features

## 📄 License

This project is licensed under the **ISC License** - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Design inspired by **Bloomberg Terminal**
- Built with [Next.js](https://nextjs.org/)
- UI components inspired by [Shadcn UI](https://ui.shadcn.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Icons by [Lucide React](https://lucide.dev/)
- Authentication by [NextAuth.js](https://next-auth.js.org/)

## 📞 Support

- 📖 [Documentation](./docs)
- 🐛 [Report Issues](https://github.com/ric-v/drawdown/issues)
- 💬 [Discussions](https://github.com/ric-v/drawdown/discussions)

---

**Made with ❤️ by the Trading Community**

*Last updated: January 6, 2026*
