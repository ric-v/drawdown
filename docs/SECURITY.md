# 🔐 Security Overview

OAuth implementation and security best practices for the Drawdown Portfolio Tracker.

---

## Authentication Architecture

The application uses **NextAuth.js v5** with Google and Microsoft OAuth providers.

### Key Components

- **auth.ts**: Core authentication configuration
- **auth.config.ts**: Route protection middleware
- **app/layout.tsx**: Login screen fallback for unauthenticated users
- **API routes**: Individual session checks per endpoint

---

## OAuth Providers

### Google OAuth
- **Scope**: `openid email profile https://www.googleapis.com/auth/drive.file`
- **Access Type**: `offline` (enables refresh tokens)
- **Prompt**: `consent` (ensures user sees permissions)
- **Use Case**: Primary login method + Google Drive storage

### Microsoft Entra ID
- **Scope**: `openid email profile User.Read Files.ReadWrite`
- **Tenant**: `common` (supports personal and organizational accounts)
- **Use Case**: Alternative login option + OneDrive storage

---

## Session Management

### Configuration

```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // Update every 24 hours
}
```

### Session Contents

- `user.id` - Unique user identifier
- `user.name` - Full name
- `user.email` - Email address
- `user.image` - Profile picture URL
- `accessToken` - OAuth access token (for API calls)
- `refreshToken` - OAuth refresh token
- `provider` - Authentication provider (`google` or `microsoft-entra-id`)
- `expiresAt` - Token expiration timestamp

---

## Token Refresh Mechanism

### Why Token Refresh is Important

OAuth access tokens typically expire after 1 hour. Without refresh, users would need to re-login every hour.

### Implementation

The application automatically refreshes expired tokens:

1. **Detection**: Checks token expiration before each API call
2. **Refresh**: Exchanges refresh token for new access token
3. **Update**: Stores new token in session
4. **Fallback**: Forces re-login if refresh fails

### Google Token Refresh

```typescript
const response = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: process.env.AUTH_GOOGLE_ID!,
    client_secret: process.env.AUTH_GOOGLE_SECRET!,
    grant_type: 'refresh_token',
    refresh_token: token.refreshToken,
  }),
})
```

### Microsoft Token Refresh

```typescript
const response = await fetch(
  `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/oauth2/v2.0/token`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    }),
  }
)
```

---

## Route Protection

### Three-Layer Security

1. **Middleware Protection** (auth.config.ts)
   - Runs before every request
   - Redirects unauthenticated users
   - Excludes public routes: `/terms`, `/privacy`, `/api/auth`

2. **Layout Protection** (app/layout.tsx)
   - Server-side session check
   - Renders `LoginScreen` for unauthenticated users
   - Provides UI fallback if middleware bypassed

3. **API Protection** (API routes)
   - Per-endpoint session validation
   - Returns `401 Unauthorized` for invalid sessions
   - Individual security control per endpoint

### Example API Protection

```typescript
import { auth } from "@/auth"

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Protected logic here
}
```

---

## Security Fixes Applied

### Critical Issues Resolved

✅ **AUTH_SECRET Configuration**
- Added environment variable validation at startup
- Configured session signing with `AUTH_SECRET`
- Added proper JWT expiration settings

✅ **Token Refresh Implementation**
- Automatic refresh for both Google and Microsoft
- Token expiration tracking
- Error handling for refresh failures

✅ **Route Protection**
- Modern NextAuth.js v5 approach using `auth()` function
- Three-layer security (middleware, layout, API)
- Proper redirect handling

✅ **TypeScript Type Safety**
- Removed all `@ts-ignore` comments
- Added proper module augmentation for Session and JWT types
- Extended interfaces with OAuth properties

✅ **Middleware Deprecation Fix**
- Removed deprecated `middleware.ts` convention
- Implemented `auth.config.ts` following NextAuth.js v5 best practices
- No build warnings

✅ **Email Access Control**
- Restricted access to specific email domains (optional)
- Environment-based email whitelisting
- Sign-in callback validation

---

## Environment Variable Security

### Required Variables

All required variables are validated at startup:

```typescript
const requiredEnvVars = [
  'AUTH_SECRET',
  'AUTH_URL',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET'
]

const missingVars = requiredEnvVars.filter(v => !process.env[v])
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
}
```

### Never Commit to Git

Add to `.gitignore`:

```
.env.local
.env*.local
```

### Vercel Environment Variables

Set in Vercel Dashboard:
1. Go to Project Settings > Environment Variables
2. Add all variables from `.env.local`
3. Set for Production, Preview, and Development environments
4. Redeploy after adding variables

---

## Production Checklist

### Before Deployment

- [ ] Generate strong `AUTH_SECRET` (min 32 characters)
- [ ] Set production `AUTH_URL` (e.g., `https://your-domain.com`)
- [ ] Update OAuth redirect URIs in Google/Microsoft consoles
- [ ] Add production domain to authorized JavaScript origins
- [ ] Enable Google Drive API
- [ ] Test login/logout flows
- [ ] Verify token refresh works
- [ ] Check session expiration handling
- [ ] Test route protection on all pages
- [ ] Validate API endpoint security

### OAuth Console Configuration

**Google Cloud Console:**
- Authorized JavaScript origins: `https://your-domain.com`
- Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`

**Microsoft Azure:**
- Redirect URI: `https://your-domain.com/api/auth/callback/microsoft-entra-id`
- Enable "Access tokens" and "ID tokens" in Authentication settings

---

## Security Best Practices

### Implemented

✅ HTTPS only in production (enforced by Vercel)
✅ Secure session cookies with `httpOnly` flag
✅ JWT signing with strong secret
✅ Token refresh for long-lived sessions
✅ Environment variable validation
✅ Route protection at multiple levels
✅ API endpoint authentication
✅ TypeScript type safety

### Recommended

- Enable email domain restriction for private deployments
- Implement rate limiting on API endpoints
- Add CSRF protection for state-changing operations
- Monitor session activity and failed login attempts
- Regularly rotate client secrets (annually)
- Review and audit OAuth permissions periodically

---

## OAuth Scopes Explained

### Google Scopes

| Scope | Purpose |
|-------|---------|
| `openid` | Basic OpenID Connect authentication |
| `email` | Access user's email address |
| `profile` | Access user's name and profile picture |
| `https://www.googleapis.com/auth/drive.file` | Access files created by this app only (not all files) |

### Microsoft Scopes

| Scope | Purpose |
|-------|---------|
| `openid` | Basic OpenID Connect authentication |
| `email` | Access user's email address |
| `profile` | Access user's profile information |
| `User.Read` | Read user profile from Microsoft Graph |
| `Files.ReadWrite` | Read and write files in OneDrive (app folder) |

---

## Troubleshooting

### "Invalid token" or "Token expired" errors

**Solution:** Token refresh should handle this automatically. If persistent:
1. Clear browser cookies
2. Sign out and sign in again
3. Check refresh token is being stored correctly

### Session not persisting after refresh

**Solution:**
1. Verify `AUTH_SECRET` is set correctly
2. Check browser is accepting cookies
3. Ensure `session.strategy` is set to `"jwt"`

### "Redirect URI mismatch" error

**Solution:**
1. Check `AUTH_URL` matches your current domain
2. Verify redirect URIs in OAuth console exactly match
3. Include protocol (http:// or https://)
4. Check for trailing slashes

---

## Next Steps

- [Deploy to Production](./DEPLOYMENT.md)
- [Setup Guide](./SETUP.md)
- [User Guide](./USER_GUIDE.md)
