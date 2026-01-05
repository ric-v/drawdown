# OAuth Configuration Guide

To enable login with Google and Microsoft, you need to set up OAuth applications in their respective developer consoles and add the credentials to your `.env.local` file.

## 1. Environment Variables

Create or edit your `.env.local` file in the root directory and add the following keys:

```env
# Next Auth
AUTH_SECRET="your-random-secret-key-at-least-32-chars" # Run: openssl rand -base64 32
AUTH_URL="http://localhost:3000" # Or your production URL

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Microsoft Entra ID (Azure AD)
AUTH_MICROSOFT_ENTRA_ID_ID="your-application-client-id"
AUTH_MICROSOFT_ENTRA_ID_SECRET="your-client-secret-value"
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID="common" # Use 'common' for multi-tenant (personal accounts), or your tenant ID
```

## 2. Google Setup (Google Cloud Console)

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., "Daily Portfolio Tracker").
3.  Go to **APIs & Services** > **Credentials**.
4.  Click **Create Credentials** > **OAuth client ID**.
5.  Select **Web application**.
6.  Set **Authorized redirect URIs** to:
    *   `http://localhost:3000/api/auth/callback/google`
    *   `https://your-production-domain.com/api/auth/callback/google`
7.  Copy the **Client ID** and **Client Secret** to your `.env.local`.
8.  **Important**: Go to **APIs & Services** > **Library**, search for "Google Drive API", and **Enable** it.

## 3. Microsoft Setup (Azure Portal)

1.  Go to [Azure Portal](https://portal.azure.com/).
2.  Search for **App registrations** service.
3.  Click **New registration**.
    *   **Name**: Drawdown
    *   **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts (e.g. Skype, Xbox). **(Crucial for personal use)**
    *   **Redirect URI**: Web -> `http://localhost:3000/api/auth/callback/microsoft-entra-id`
4.  Click **Register**.
5.  Copy the **Application (client) ID** to your `.env.local` as `AUTH_MICROSOFT_ENTRA_ID_ID`.
6.  Go to **Certificates & secrets** (sidebar).
7.  Click **New client secret**. Add a description and expiry.
8.  Copy the **Value** (not the ID) immediately to your `.env.local` as `AUTH_MICROSOFT_ENTRA_ID_SECRET`.
9.  Go to **API Permissions** (sidebar).
    *   Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**.
    *   Search/Select: `Files.ReadWrite` (and ensure `User.Read` is there).
    *   Click **Add permissions**.

## 4. Run the App

Restart your development server to load the new environment variables:

```bash
npm run dev
```
