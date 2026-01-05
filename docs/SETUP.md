# 🚀 Setup Guide

Complete setup instructions for the Drawdown Portfolio Tracker.

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Google Cloud Console account
- Microsoft Azure account (optional, for Microsoft login)

---

## 1. Initial Setup

### Clone and Install

```bash
git clone <your-repo-url>
cd daily-portfolio-tracker
npm install
```

---

## 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Next Auth
AUTH_SECRET="your-random-secret-key-at-least-32-chars" # Run: openssl rand -base64 32
AUTH_URL="http://localhost:3000" # Or your production URL

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Microsoft Entra ID (Azure AD) - Optional
AUTH_MICROSOFT_ENTRA_ID_ID="your-application-client-id"
AUTH_MICROSOFT_ENTRA_ID_SECRET="your-client-secret-value"
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID="common" # Use 'common' for multi-tenant
```

### Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

---

## 3. Google OAuth Setup

### Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Daily Portfolio Tracker")
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Set **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to `.env.local`

### Enable Google Drive API (Required)

1. Go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click **Enable**

**Why:** The application uses Google Drive to store trade data files.

---

## 4. Microsoft OAuth Setup (Optional)

### Azure Portal Configuration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for **App registrations**
3. Click **New registration**
   - **Name**: Drawdown
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Web → `http://localhost:3000/api/auth/callback/microsoft-entra-id`
4. Click **Register**
5. Copy **Application (client) ID** to `.env.local` as `AUTH_MICROSOFT_ENTRA_ID_ID`

### Create Client Secret

1. Go to **Certificates & secrets** (sidebar)
2. Click **New client secret**
3. Add description and expiry period
4. **Copy the Value immediately** to `.env.local` as `AUTH_MICROSOFT_ENTRA_ID_SECRET`
   - ⚠️ The secret value is only shown once!

### API Permissions

1. Go to **API Permissions** (sidebar)
2. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
3. Add these permissions:
   - `User.Read` (should be there by default)
   - `Files.ReadWrite` (for OneDrive storage)
4. Click **Add permissions**

---

## 5. Run the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Verify Setup

### Checklist

- ✅ Application loads without errors
- ✅ Login with Google works
- ✅ Login with Microsoft works (if configured)
- ✅ User profile displays after login
- ✅ Can add daily P&L entries
- ✅ Dashboard shows portfolio metrics

---

## Common Issues

### "Missing required environment variables" error

**Solution:** Ensure all required variables in `.env.local` are set:
- `AUTH_SECRET`
- `AUTH_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Restart the development server after adding variables.

### "Invalid redirect URI" error

**Solution:** Check that redirect URIs in Google/Microsoft console exactly match:
- Development: `http://localhost:3000/api/auth/callback/{provider}`
- Production: `https://your-domain.com/api/auth/callback/{provider}`

### Google Drive API not working

**Solution:** Enable Google Drive API in Google Cloud Console:
1. **APIs & Services** > **Library**
2. Search "Google Drive API"
3. Click **Enable**

---

## Next Steps

- [Deploy to Production](./DEPLOYMENT.md)
- [Review Security Settings](./SECURITY.md)
- [Learn How to Use the App](./USER_GUIDE.md)
