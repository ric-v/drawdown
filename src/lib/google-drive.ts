import pako from 'pako'
import { drive } from '@googleapis/drive'
import { OAuth2Client } from 'google-auth-library'

const PORTFOLIO_FILE_NAME = 'drawdown-portfolio.json.gz'

export interface PortfolioData {
  dailyPnL: any[]
  fundTransactions: any[]
  initialCapital: number
  lastUpdated: string
}

/**
 * Compress data using gzip
 */
function compressData(data: any): Buffer {
  const jsonString = JSON.stringify(data)
  const compressed = pako.gzip(jsonString)
  return Buffer.from(compressed)
}

/**
 * Decompress gzip data
 */
function decompressData(buffer: Buffer): any {
  const decompressed = pako.ungzip(buffer, { to: 'string' })
  return JSON.parse(decompressed)
}

/**
 * Get authenticated Drive client
 */
async function getDriveClient(accessToken: string) {
  const oauth2Client = new OAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return drive({
    version: 'v3',
    auth: oauth2Client
  })
}

/**
 * Find portfolio file in Google Drive
 */
export async function findPortfolioFile(accessToken: string): Promise<string | null> {
  const drive = await getDriveClient(accessToken)
  
  const response = await drive.files.list({
    q: `name='${PORTFOLIO_FILE_NAME}' and trashed=false`,
    spaces: 'drive',
    fields: 'files(id, name, modifiedTime)',
    pageSize: 1
  })

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id || null
  }

  return null
}

/**
 * Read portfolio data from Google Drive
 */
export async function readPortfolioData(accessToken: string): Promise<PortfolioData | null> {
  try {
    const fileId = await findPortfolioFile(accessToken)
    
    if (!fileId) {
      return null
    }

    const drive = await getDriveClient(accessToken)
    
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    }, {
      responseType: 'arraybuffer'
    })

    const buffer = Buffer.from(response.data as ArrayBuffer)
    return decompressData(buffer)
  } catch (error) {
    console.error('Error reading from Google Drive:', error)
    throw error
  }
}

/**
 * Create new portfolio file in Google Drive
 */
export async function createPortfolioFile(
  accessToken: string,
  data: PortfolioData
): Promise<string> {
  const drive = await getDriveClient(accessToken)
  const compressed = compressData(data)

  const response = await drive.files.create({
    requestBody: {
      name: PORTFOLIO_FILE_NAME,
      mimeType: 'application/gzip'
    },
    media: {
      mimeType: 'application/gzip',
      body: require('stream').Readable.from(compressed)
    },
    fields: 'id'
  })

  return response.data.id || ''
}

/**
 * Update existing portfolio file in Google Drive
 */
export async function updatePortfolioFile(
  accessToken: string,
  fileId: string,
  data: PortfolioData
): Promise<void> {
  const drive = await getDriveClient(accessToken)
  const compressed = compressData(data)

  await drive.files.update({
    fileId,
    media: {
      mimeType: 'application/gzip',
      body: require('stream').Readable.from(compressed)
    }
  })
}

/**
 * Save portfolio data to Google Drive (create or update)
 */
export async function savePortfolioData(
  accessToken: string,
  data: PortfolioData
): Promise<void> {
  const fileId = await findPortfolioFile(accessToken)
  
  if (fileId) {
    await updatePortfolioFile(accessToken, fileId, data)
  } else {
    await createPortfolioFile(accessToken, data)
  }
}

/**
 * Delete portfolio file from Google Drive
 */
export async function deletePortfolioFile(accessToken: string): Promise<void> {
  const fileId = await findPortfolioFile(accessToken)
  
  if (fileId) {
    const drive = await getDriveClient(accessToken)
    await drive.files.delete({ fileId })
  }
}

/**
 * Get initial empty portfolio data
 */
export function getEmptyPortfolioData(): PortfolioData {
  return {
    dailyPnL: [],
    fundTransactions: [],
    initialCapital: 100000,
    lastUpdated: new Date().toISOString()
  }
}
