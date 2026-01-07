# ✨ Features Guide

Complete feature documentation for Drawdown portfolio tracker.

## Core Features

### 📊 KPI Dashboard

Real-time portfolio performance metrics displayed as interactive cards:

- **Total P&L** - Overall profit/loss with percentage returns
- **Win Rate** - Percentage of profitable trading days
- **Average Win/Loss** - Mean profit per profitable day vs. mean loss
- **Current Equity** - Present portfolio value
- **Max Drawdown** - Largest peak-to-trough decline
- **Profit Factor** - Ratio of gross profit to gross loss
- **Expectancy** - Average profit/loss per trade
- **Current Streak** - Consecutive winning or losing days

**Color Coding:**
- 🟢 Emerald Green: Positive values
- 🔴 Rose Red: Negative values
- ⚪ Gray: Neutral values

### 📈 Equity Curve Chart

Interactive chart visualization powered by Recharts:

- **Real-time Updates**: Automatically reflects new transactions
- **Hover Tooltips**: Detailed P&L information on hover
- **Responsive Design**: Adapts to all screen sizes
- **Gradient Fill**: Professional Bloomberg-style appearance

### 📋 Transaction Management

Comprehensive transaction tracking and editing:

- **Add Transactions**: Quick entry of new daily P&L entries
- **Edit Transactions**: Modify existing entries
- **Delete Transactions**: Remove incorrect entries
- **Color-coded**: Green for wins, red for losses

**Supported Fields:**
- Date (YYYY-MM-DD format)
- P&L Amount (in INR)
- Timestamps

### 💰 Fund Management

Track capital deposits and withdrawals:

- **Add Deposits**: Record capital additions
- **Add Withdrawals**: Record capital removals
- **Fund History**: Complete fund flow tracking
- **Equity Impact**: Affects initial capital baseline

### 📅 Performance Calendar

Visual daily performance representation:

- **Heatmap**: Color-coded profitable vs. losing days
- **Date Selection**: Click dates to view details
- **Month Navigation**: Browse different time periods
- **Summary Statistics**: Monthly P&L totals

### 🔐 Authentication & Security

Professional OAuth implementation:

**Supported Providers:**
- ✅ Google OAuth 2.0
- ✅ Microsoft Entra ID (Azure AD)

**Features:**
- Secure session management (NextAuth.js)
- Automatic token refresh
- CSRF protection
- Secure cookie handling

### ☁️ Cloud Storage Integration

**Google Drive Integration:**
- Store trading data files in Google Drive
- Automatic backups and versioning
- Cross-device access
- Data ownership and privacy

**Microsoft OneDrive Integration:**
- Alternative cloud storage option
- SharePoint integration (optional)

### 📱 Responsive Design

Optimized for all devices:

- **Desktop**: Full-featured interface
- **Tablet**: Optimized layout with touch support
- **Mobile**: Simplified interface with essential features
- **Dark Mode**: Default theme (Bloomberg terminal aesthetic)

## Advanced Features

### Performance Metrics

**Calculated Metrics:**

- Win Rate (%) = (profitDays / totalDays) * 100
- Profit Factor = grossProfit / |grossLoss|
- Expectancy = totalPnL / totalDays
- Max Drawdown = (peakEquity - troughEquity) / peakEquity
- Current Streak = consecutive winning/losing days

### API Endpoints

**Portfolio Operations:**
- `GET /api/portfolio` - Fetch all portfolio data
- `POST /api/portfolio` - Add new transaction
- `DELETE /api/portfolio` - Clear all transactions
- `PUT /api/portfolio/[id]` - Update transaction

**Equity Curve:**
- `GET /api/portfolio/equity` - Get equity points

**Fund Management:**
- `GET /api/portfolio/funds` - Get fund transactions
- `POST /api/portfolio/funds` - Add fund transaction

## User Management

**User Profile:**
- Display name
- Email address
- Profile picture
- Secure account settings

**Session Management:**
- Automatic logout after 30 days of inactivity
- Multi-device session tracking
- Sign out functionality

## How to Use

### Adding Daily P&L

1. Navigate to the dashboard
2. Click "Add Transaction"
3. Enter date, P&L amount
4. Click "Save"
5. Chart updates automatically

### Fund Management

1. Click "Fund Management" section
2. Add deposits when capital is added
3. Add withdrawals when capital is removed
4. Maintains accurate equity calculations

### Viewing Performance

1. Dashboard KPIs update in real-time
2. Equity curve shows cumulative performance
3. Calendar view shows daily wins/losses
4. Hover on chart for detailed information

---

**Last updated**: January 6, 2026
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
