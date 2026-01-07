# 🚀 Deployment Guide

Complete deployment instructions for production.

## Prerequisites

- Node.js 18+
- Git repository (GitHub)
- Vercel or Azure account
- OAuth credentials (Google Cloud, Microsoft Azure)

---

## Vercel Deployment (Recommended)

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables:
   ```
   AUTH_SECRET=<generate with: openssl rand -base64 32>
   AUTH_URL=https://your-domain.vercel.app
   AUTH_GOOGLE_ID=<from Google Cloud>
   AUTH_GOOGLE_SECRET=<from Google Cloud>
   AUTH_MICROSOFT_ENTRA_ID_ID=<optional>
   AUTH_MICROSOFT_ENTRA_ID_SECRET=<optional>
   AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=common
   ```
5. Click "Deploy"

### 3. Custom Domain (Optional)

1. In Vercel project settings
2. Go to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### 4. Deploy via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Azure Static Web Apps Deployment

### 1. Create Azure Resource Group

```bash
az group create --name drawdown-rg --location eastus
```

### 2. Create Static Web App

```bash
az staticwebapp create \
  --name drawdown \
  --resource-group drawdown-rg \
  --location eastus \
  --source https://github.com/YOUR_USERNAME/drawdown \
  --branch main \
  --login-with-github
```

### 3. Configure Environment Variables

In Azure Portal:
1. Go to your Static Web App
2. Settings → Configuration
3. Add application settings:
   ```
   AUTH_SECRET
   AUTH_URL=https://your-app.azurestaticapps.net
   AUTH_GOOGLE_ID
   AUTH_GOOGLE_SECRET
   AUTH_MICROSOFT_ENTRA_ID_ID
   AUTH_MICROSOFT_ENTRA_ID_SECRET
   AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
   ```

---

## Database Configuration

### Option 1: Vercel Postgres (Recommended)

1. In Vercel dashboard, go to **Storage**
2. Create new **Postgres** database
3. Copy connection string
4. Set `DATABASE_URL` environment variable

### Option 2: MongoDB Atlas

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Get connection string
4. Set `MONGODB_URI` environment variable

### Option 3: Supabase

1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Get PostgreSQL connection string
4. Set `DATABASE_URL` environment variable

---

## Environment Variables

Required for production:

```env
# Authentication
AUTH_SECRET=<32-char random string from: openssl rand -base64 32>
AUTH_URL=https://your-domain.com

# Google OAuth (Required)
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>

# Microsoft OAuth (Optional)
AUTH_MICROSOFT_ENTRA_ID_ID=<from Azure Portal>
AUTH_MICROSOFT_ENTRA_ID_SECRET=<from Azure Portal>
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=common

# Database (Optional - local storage works without)
DATABASE_URL=<database connection string>
```

---

## Pre-Deployment Checklist

- ✅ All secrets added to environment variables
- ✅ OAuth redirect URIs updated in provider consoles
- ✅ Build completes without errors (`npm run build`)
- ✅ Tests pass (`npm test`)
- ✅ No TypeScript errors (`npm run type-check`)
- ✅ Linting passes (`npm run lint`)

---

## Testing Build Locally

```bash
# Production build
npm run build

# Test production build locally
npm run start

# Open http://localhost:3000
```

---

## Post-Deployment

### Verify Deployment

1. Visit your deployed URL
2. Test OAuth login with both providers
3. Add a transaction to verify data persistence
4. Check browser console for errors

### Monitor Performance

- Vercel: Dashboard → Analytics
- Azure: Portal → Application Insights
- Next.js: use `@vercel/analytics` (included)

### Common Issues

**Blank page after login:**
- Check environment variables are set correctly
- Clear browser cache and cookies
- Check browser console for errors

**OAuth login fails:**
- Verify redirect URIs match deployment domain
- Check OAuth credentials in environment variables
- Ensure provider APIs are enabled

**Data not persisting:**
- If no database configured, data stored locally (development only)
- For production, configure database in environment variables

---

## Rollback

### Vercel

1. Go to Deployments tab
2. Find previous deployment
3. Click "Promote to Production"

### Azure

1. Go to Static Web App
2. Deployments section
3. Select previous deployment
4. Click "Activate"

---

**Last updated**: January 6, 2026
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
