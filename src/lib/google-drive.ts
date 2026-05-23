import pako from 'pako'
import { drive } from '@googleapis/drive'
import { OAuth2Client } from 'google-auth-library'
import { UserSettings } from '@/types/settings'

const PORTFOLIO_FILE_NAME = 'drawdown-portfolio.json.gz'
const SETTINGS_FILE_NAME = 'drawdown-settings.json.gz'

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
export async function findPortfolioFile(accessToken: string): Promise<any | null> {
  const drive = await getDriveClient(accessToken)
  
  try {
    const response = await drive.files.list({
      q: `name='${PORTFOLIO_FILE_NAME}' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, size, createdTime, modifiedTime)',
      pageSize: 1
    })

    if (response.data.files && response.data.files.length > 0) {
      const file = response.data.files[0]
      console.log('Found portfolio file:', file.id, file.name)
      return file
    }
  } catch (error: any) {
    console.error('Error finding portfolio file:', error.message)
    // Return null if we can't find the file, which will trigger creation of a new one
    return null
  }

  return null
}

/**
 * Find settings file in Google Drive
 */
export async function findSettingsFile(accessToken: string): Promise<any | null> {
  const drive = await getDriveClient(accessToken)
  
  const response = await drive.files.list({
    q: `name='${SETTINGS_FILE_NAME}' and trashed=false`,
    spaces: 'drive',
    fields: 'files(id, name, size, createdTime, modifiedTime)',
    pageSize: 1
  })

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0]
  }

  return null
}
export async function readPortfolioData(accessToken: string): Promise<PortfolioData | null> {
  try {
    const file = await findPortfolioFile(accessToken)
    
    if (!file || !file.id) {
      return null
    }

    const drive = await getDriveClient(accessToken)
    
    const response = await drive.files.get({
      fileId: file.id,
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

  try {
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

    const fileId = response.data.id || ''
    console.log('Created new portfolio file:', fileId, PORTFOLIO_FILE_NAME)
    return fileId
  } catch (error: any) {
    console.error('Error creating portfolio file:', error.message)
    throw error
  }
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

  try {
    await drive.files.update({
      fileId,
      media: {
        mimeType: 'application/gzip',
        body: require('stream').Readable.from(compressed)
      }
    })
  } catch (error: any) {
    // If file not found (404), throw error to trigger fallback to create new file
    if (error.code === 404 || error.status === 404) {
      throw new Error(`File not found: ${JSON.stringify(error.response?.data || error.message)}`)
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Save portfolio data to Google Drive (create or update)
 */
export async function savePortfolioData(
  accessToken: string,
  data: PortfolioData
): Promise<void> {
  const file = await findPortfolioFile(accessToken)
  
  if (file && file.id) {
    try {
      await updatePortfolioFile(accessToken, file.id, data)
    } catch (error: any) {
      // If update fails due to file not found, create new file
      if (error.message.includes('File not found')) {
        console.log('Portfolio file not found during update, creating new file')
        await createPortfolioFile(accessToken, data)
      } else {
        throw error
      }
    }
  } else {
    await createPortfolioFile(accessToken, data)
  }
}

/**
 * Delete portfolio file from Google Drive
 */
export async function deletePortfolioFile(accessToken: string): Promise<void> {
  const file = await findPortfolioFile(accessToken)
  
  if (file && file.id) {
    const drive = await getDriveClient(accessToken)
    await drive.files.delete({ fileId: file.id })
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

/**
 * Read settings data from Google Drive
 */
export async function readSettingsData(accessToken: string): Promise<UserSettings | null> {
  try {
    const file = await findSettingsFile(accessToken)
    
    if (!file || !file.id) {
      return null
    }

    const drive = await getDriveClient(accessToken)
    
    const response = await drive.files.get({
      fileId: file.id,
      alt: 'media'
    }, {
      responseType: 'arraybuffer'
    })

    const buffer = Buffer.from(response.data as ArrayBuffer)
    return decompressData(buffer)
  } catch (error) {
    console.error('Error reading settings from Google Drive:', error)
    throw error
  }
}

/**
 * Create new settings file in Google Drive
 */
export async function createSettingsFile(
  accessToken: string,
  data: UserSettings
): Promise<string> {
  const drive = await getDriveClient(accessToken)
  const compressed = compressData(data)

  const response = await drive.files.create({
    requestBody: {
      name: SETTINGS_FILE_NAME,
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
 * Update existing settings file in Google Drive
 */
export async function updateSettingsFile(
  accessToken: string,
  fileId: string,
  data: UserSettings
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
 * Save settings data to Google Drive (create or update)
 */
export async function writeSettingsData(
  accessToken: string,
  data: UserSettings
): Promise<void> {
  const file = await findSettingsFile(accessToken)
  
  if (file && file.id) {
    await updateSettingsFile(accessToken, file.id, data)
  } else {
    await createSettingsFile(accessToken, data)
  }
}