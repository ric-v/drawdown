
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"

// Validate required environment variables at startup (only in non-build context)
const validateEnvVars = () => {
    // Skip validation in build time or when explicitly disabled
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_RUNTIME !== 'edge') {
        const requiredEnvVars = ['AUTH_SECRET', 'AUTH_URL', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET']
        const missingVars = requiredEnvVars.filter(v => !process.env[v])
        if (missingVars.length > 0) {
            console.error(`Missing required environment variables: ${missingVars.join(', ')}`)
        }
    }
}

// Type declarations for extended session and JWT
declare module "next-auth" {
    interface Session {
        accessToken?: string
        refreshToken?: string
        provider?: string
        expiresAt?: number
    }

    interface JWT {
        accessToken?: string
        refreshToken?: string
        provider?: string
        expiresAt?: number
        accessTokenError?: string
    }
}

// Allowed email addresses (empty array means all authenticated users allowed)
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS 
    ? process.env.ALLOWED_EMAILS.split(',').map(e => e.trim().toLowerCase())
    : []

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.AUTH_SECRET || 'development-secret-key',
    basePath: "/api/auth",
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // Update every 24 hours
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60,
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/drive.file",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || 'common',
            authorization: {
                params: {
                    scope: "openid profile email offline_access User.Read",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Log successful sign-in attempt
            console.log(`User sign-in attempt: ${user.email} via ${account?.provider}`)
            
            // Check email allowlist if configured
            if (ALLOWED_EMAILS.length > 0) {
                const userEmail = user.email?.toLowerCase() || ''
                if (!ALLOWED_EMAILS.includes(userEmail)) {
                    console.warn(`Sign-in blocked: ${user.email} not in allowlist`)
                    return false
                }
            }
            
            return true
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token || undefined
                token.provider = account.provider
                // Store token expiration time
                token.expiresAt = (account.expires_at || Math.floor(Date.now() / 1000) + 3600) * 1000
            }

            // Check if token has expired and refresh if needed
            if (token.expiresAt && typeof token.expiresAt === 'number' && Date.now() >= token.expiresAt - 60000) {
                // Token is expired or about to expire, attempt refresh
                try {
                    if (token.provider === 'google' && token.refreshToken) {
                        const response = await fetch('https://oauth2.googleapis.com/token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                client_id: process.env.AUTH_GOOGLE_ID!,
                                client_secret: process.env.AUTH_GOOGLE_SECRET!,
                                grant_type: 'refresh_token',
                                refresh_token: token.refreshToken as string,
                            }),
                        })

                        const tokens = await response.json()

                        if (!response.ok) {
                            throw new Error(`Token refresh failed: ${tokens.error || 'unknown error'}`)
                        }

                        return {
                            ...token,
                            accessToken: tokens.access_token,
                            expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
                            refreshToken: tokens.refresh_token || token.refreshToken,
                        }
                    } else if (token.provider === 'microsoft-entra-id' && token.refreshToken) {
                        const tenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || 'common'
                        const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
                                client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
                                grant_type: 'refresh_token',
                                refresh_token: token.refreshToken as string,
                                scope: 'openid profile email offline_access User.Read',
                            }),
                        })

                        const tokens = await response.json()

                        if (!response.ok) {
                            throw new Error(`Token refresh failed: ${tokens.error || 'unknown error'}`)
                        }

                        return {
                            ...token,
                            accessToken: tokens.access_token,
                            expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
                            refreshToken: tokens.refresh_token || token.refreshToken,
                        }
                    }
                } catch (error) {
                    console.error('Token refresh failed:', error)
                    token.accessTokenError = 'RefreshAccessTokenError'
                    return token
                }
            }

            return token
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string | undefined
            session.refreshToken = token.refreshToken as string | undefined
            session.provider = token.provider as string | undefined
            session.expiresAt = token.expiresAt as number | undefined
            
            // If there was a token refresh error, clear the session
            if (token.accessTokenError) {
                return null as any
            }
            
            return session
        },
    },
    pages: {
        signIn: '/',
        error: '/',
    },
})
