# ✨ Advanced Features

Advanced functionality and integrations for the Drawdown Portfolio Tracker.

---

## Google Drive Integration

### Overview

The application can use Google Drive as storage for your trading data files, offering an alternative to traditional databases.

### Why Google Drive?

✅ **Zero Database Costs**: No need for paid database services
✅ **Data Ownership**: Files stored in your Google Drive
✅ **Easy Backup**: Built-in Google Drive backup and versioning
✅ **Cross-Platform**: Access from any device
✅ **Privacy**: Data stays in your personal cloud storage

### Configuration Status

The Google OAuth is already configured with the correct scope:

```typescript
scope: "openid email profile https://www.googleapis.com/auth/drive.file"
```

**Key Points:**
- `drive.file` scope: Only accesses files created by this app (not all your files)
- `offline` access: Enables refresh tokens for long-lived sessions
- `consent` prompt: Users see and approve permissions

---

## Implementation Guide

### 1. Install Google APIs Client

```bash
npm install googleapis
```

### 2. Create Drive Utility Functions

Create `lib/google-drive.ts`:

```typescript
import { google } from 'googleapis'

export async function createTradeFile(
  accessToken: string,
  fileName: string,
  fileContent: object
) {
  const drive = google.drive({
    version: 'v3',
    auth: new google.auth.OAuth2Client({
      credentials: { access_token: accessToken }
    })
  })

  const file = new (require('stream').Readable)()
  file.push(JSON.stringify(fileContent))
  file.push(null)

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'application/json'
    },
    media: {
      mimeType: 'application/json',
      body: file
    }
  })

  return response.data.id
}

export async function readTradeFile(
  accessToken: string,
  fileId: string
) {
  const drive = google.drive({
    version: 'v3',
    auth: new google.auth.OAuth2Client({
      credentials: { access_token: accessToken }
    })
  })

  const response = await drive.files.get({
    fileId,
    alt: 'media'
  })

  return response.data
}

export async function updateTradeFile(
  accessToken: string,
  fileId: string,
  fileContent: object
) {
  const drive = google.drive({
    version: 'v3',
    auth: new google.auth.OAuth2Client({
      credentials: { access_token: accessToken }
    })
  })

  const file = new (require('stream').Readable)()
  file.push(JSON.stringify(fileContent))
  file.push(null)

  const response = await drive.files.update({
    fileId,
    media: {
      mimeType: 'application/json',
      body: file
    }
  })

  return response.data
}

export async function listTradeFiles(
  accessToken: string,
  query?: string
) {
  const drive = google.drive({
    version: 'v3',
    auth: new google.auth.OAuth2Client({
      credentials: { access_token: accessToken }
    })
  })

  const response = await drive.files.list({
    q: query || "trashed=false and mimeType='application/json'",
    spaces: 'drive',
    fields: 'files(id, name, createdTime, modifiedTime, size)',
    orderBy: 'modifiedTime desc'
  })

  return response.data.files || []
}

export async function deleteTradeFile(
  accessToken: string,
  fileId: string
) {
  const drive = google.drive({
    version: 'v3',
    auth: new google.auth.OAuth2Client({
      credentials: { access_token: accessToken }
    })
  })

  await drive.files.delete({ fileId })
}
```

### 3. Update API Routes

Example: Update `app/api/portfolio/route.ts` to use Google Drive:

```typescript
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { 
  createTradeFile, 
  readTradeFile, 
  listTradeFiles,
  updateTradeFile 
} from "@/lib/google-drive"

const PORTFOLIO_FILE_NAME = 'drawdown-portfolio.json'

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session || !session.accessToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Find existing portfolio file
    const files = await listTradeFiles(
      session.accessToken,
      `name='${PORTFOLIO_FILE_NAME}'`
    )

    if (files.length === 0) {
      // Create new file if doesn't exist
      const initialData = {
        dailyPnL: [],
        initialCapital: 100000,
        lastUpdated: new Date().toISOString()
      }
      
      const fileId = await createTradeFile(
        session.accessToken,
        PORTFOLIO_FILE_NAME,
        initialData
      )
      
      return NextResponse.json({
        ...initialData,
        fileId
      })
    }

    // Read existing file
    const fileData = await readTradeFile(
      session.accessToken,
      files[0].id!
    )

    return NextResponse.json({
      ...fileData,
      fileId: files[0].id
    })
  } catch (error) {
    console.error('Error accessing Google Drive:', error)
    return NextResponse.json(
      { error: 'Failed to access portfolio data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session || !session.accessToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    
    // Find existing file
    const files = await listTradeFiles(
      session.accessToken,
      `name='${PORTFOLIO_FILE_NAME}'`
    )

    if (files.length === 0) {
      // Create new file
      const newData = {
        dailyPnL: [body],
        initialCapital: body.initialCapital || 100000,
        lastUpdated: new Date().toISOString()
      }
      
      const fileId = await createTradeFile(
        session.accessToken,
        PORTFOLIO_FILE_NAME,
        newData
      )
      
      return NextResponse.json({ success: true, fileId })
    }

    // Update existing file
    const existingData = await readTradeFile(
      session.accessToken,
      files[0].id!
    )

    const updatedData = {
      ...existingData,
      dailyPnL: [...existingData.dailyPnL, body],
      lastUpdated: new Date().toISOString()
    }

    await updateTradeFile(
      session.accessToken,
      files[0].id!,
      updatedData
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating Google Drive:', error)
    return NextResponse.json(
      { error: 'Failed to update portfolio data' },
      { status: 500 }
    )
  }
}
```

### 4. Handle Token Refresh

The token refresh is already implemented in `auth.ts`, ensuring long-lived access to Google Drive.

---

## Data Structure

### Portfolio File Format

```json
{
  "dailyPnL": [
    {
      "id": "uuid-1",
      "date": "2024-12-08",
      "amount": 2400,
      "notes": "Good trading day"
    },
    {
      "id": "uuid-2",
      "date": "2024-12-09",
      "amount": -8000,
      "notes": "Stopped out"
    }
  ],
  "initialCapital": 100000,
  "lastUpdated": "2024-12-11T10:30:00.000Z",
  "version": "1.0"
}
```

---

## Benefits vs. Database

### Google Drive Storage

**Pros:**
- ✅ Free (15GB included with Google account)
- ✅ User owns and controls data
- ✅ Built-in versioning and recovery
- ✅ No server-side database management
- ✅ Works well for personal use

**Cons:**
- ⚠️ Slower than dedicated databases
- ⚠️ API rate limits (per-user quotas)
- ⚠️ Not suitable for high-traffic apps
- ⚠️ Requires OAuth for each user

### Traditional Database

**Pros:**
- ✅ Faster queries
- ✅ Better for multi-user apps
- ✅ Advanced features (joins, aggregations)
- ✅ Better scalability

**Cons:**
- ⚠️ Monthly costs (unless free tier)
- ⚠️ Server-side management required
- ⚠️ Migration and backup complexity
- ⚠️ Data privacy concerns

---

## Use Cases

### Google Drive is Perfect For:

- 📊 Personal portfolio tracking
- 📊 Single-user applications
- 📊 Privacy-focused use cases
- 📊 Small data volumes (<1MB)
- 📊 Infrequent updates (daily entries)

### Database is Better For:

- 🏢 Multi-user SaaS applications
- 🏢 Real-time data requirements
- 🏢 Large data volumes (>10MB)
- 🏢 Complex queries and analytics
- 🏢 High-frequency updates

---

## Microsoft OneDrive Alternative

If using Microsoft login, you can use OneDrive instead:

### OneDrive Utility Functions

```typescript
export async function createOneDriveFile(
  accessToken: string,
  fileName: string,
  fileContent: object
) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fileContent)
    }
  )

  return await response.json()
}

export async function readOneDriveFile(
  accessToken: string,
  fileName: string
) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  return await response.json()
}
```

---

## Security Considerations

### Access Tokens

- ✅ Stored in JWT session (encrypted)
- ✅ Automatic refresh when expired
- ✅ Never exposed to client
- ✅ Scoped to app-created files only

### Data Privacy

- ✅ Files created in user's personal Drive
- ✅ Only this app can access these files
- ✅ User can revoke access anytime
- ✅ No data stored on your servers

### Best Practices

- 🔒 Always validate session before API calls
- 🔒 Handle token refresh failures gracefully
- 🔒 Implement error handling for Drive API
- 🔒 Add retry logic for rate limit errors
- 🔒 Log access errors for debugging

---

## Migration Path

### From File System to Google Drive

1. **Read existing data** from `data/portfolio-data.json`
2. **Create Google Drive file** with migration script
3. **Upload historical data** to user's Drive
4. **Switch API routes** to use Drive utilities
5. **Test thoroughly** with backup data

### Migration Script Example

```typescript
import fs from 'fs'
import { createTradeFile } from '@/lib/google-drive'

async function migrateToGoogleDrive(accessToken: string) {
  // Read local file
  const localData = JSON.parse(
    fs.readFileSync('data/portfolio-data.json', 'utf-8')
  )

  // Create in Google Drive
  const fileId = await createTradeFile(
    accessToken,
    'drawdown-portfolio.json',
    localData
  )

  console.log(`Migration complete! File ID: ${fileId}`)
}
```

---

## Testing

### Local Testing

1. Ensure Google Drive API is enabled
2. Login with Google account
3. Add a daily P&L entry
4. Check your Google Drive for `drawdown-portfolio.json`
5. Edit the entry and verify file updates
6. Test with token expiration (wait 1 hour)

### Error Scenarios

- ✅ Handle network failures
- ✅ Handle Drive API errors (quota, permissions)
- ✅ Handle token refresh failures
- ✅ Handle file not found errors
- ✅ Handle concurrent update conflicts

---

## Next Steps

- [Setup Guide](./SETUP.md) - Configure OAuth for Drive access
- [Security Overview](./SECURITY.md) - Understand token management
- [Deployment Guide](./DEPLOYMENT.md) - Deploy with Drive integration
- [User Guide](./USER_GUIDE.md) - How users interact with the app
