import pako from 'pako'

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
 * Find portfolio file in OneDrive
 */
export async function findPortfolioFile(accessToken: string): Promise<any | null> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${PORTFOLIO_FILE_NAME}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (response.ok) {
      return await response.json()
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * Read portfolio data from OneDrive
 */
export async function readPortfolioData(accessToken: string): Promise<PortfolioData | null> {
  try {
    const file = await findPortfolioFile(accessToken)
    
    if (!file) {
      return null
    }

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return decompressData(buffer)
  } catch (error) {
    console.error('Error reading from OneDrive:', error)
    throw error
  }
}

/**
 * Create or update portfolio file in OneDrive
 */
export async function savePortfolioData(
  accessToken: string,
  data: PortfolioData
): Promise<void> {
  const compressed = compressData(data)

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${PORTFOLIO_FILE_NAME}:/content`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/gzip'
      },
      body: new Uint8Array(compressed)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to save to OneDrive: ${error}`)
  }
}

/**
 * Delete portfolio file from OneDrive
 */
export async function deletePortfolioFile(accessToken: string): Promise<void> {
  const file = await findPortfolioFile(accessToken)
  
  if (file) {
    await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
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
