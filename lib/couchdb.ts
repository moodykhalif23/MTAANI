// CouchDB Configuration
export interface CouchDBConfig {
  host: string
  port: number
  protocol: 'http' | 'https'
  username: string
  password: string
  database: string
  maxRetries: number
  timeout: number
}

// Base document interface for CouchDB
export interface CouchDBDocument {
  _id?: string
  _rev?: string
  type: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

// CouchDB Response interfaces
export interface CouchDBResponse {
  ok: boolean
  id: string
  rev: string
}

export interface CouchDBError {
  error: string
  reason: string
  status?: number
}

export interface CouchDBViewResponse<T> {
  total_rows: number
  offset: number
  rows: Array<{
    id: string
    key: unknown
    value: unknown
    doc?: T
  }>
}

export interface CouchDBBulkResponse {
  ok: boolean
  id: string
  rev: string
  error?: string
  reason?: string
}

// CouchDB Client Class
export class CouchDBClient {
  private config: CouchDBConfig
  private baseUrl: string
  private authHeader: string

  constructor(config: CouchDBConfig) {
    this.config = config
    this.baseUrl = `${config.protocol}://${config.host}:${config.port}`
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`
  }

  // Generic HTTP request method
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
    path: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const requestHeaders = {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(this.config.timeout)
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body)
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`CouchDB Error: ${response.status} - ${errorData.reason || response.statusText}`)
        }

        // HEAD requests don't return a body
        if (method === 'HEAD') {
          return undefined as T
        }

        return await response.json()
      } catch (error) {
        lastError = error as Error

        if (attempt < this.config.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Unknown CouchDB error')
  }

  // Database operations
  async createDatabase(dbName: string): Promise<{ ok: boolean }> {
    return this.request('PUT', `/${dbName}`)
  }

  async deleteDatabase(dbName: string): Promise<{ ok: boolean }> {
    return this.request('DELETE', `/${dbName}`)
  }

  async databaseExists(dbName: string): Promise<boolean> {
    try {
      await this.request<void>('HEAD', `/${dbName}`)
      return true
    } catch {
      return false
    }
  }

  // Document operations
  async getDocument<T extends CouchDBDocument>(
    dbName: string,
    docId: string,
    rev?: string
  ): Promise<T> {
    const path = rev ? `/${dbName}/${docId}?rev=${rev}` : `/${dbName}/${docId}`
    return this.request('GET', path)
  }

  async createDocument<T extends CouchDBDocument>(
    dbName: string,
    doc: Omit<T, '_id' | '_rev'>
  ): Promise<CouchDBResponse> {
    const docWithTimestamps = {
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return this.request('POST', `/${dbName}`, docWithTimestamps)
  }

  async updateDocument<T extends CouchDBDocument>(
    dbName: string,
    doc: T
  ): Promise<CouchDBResponse> {
    if (!doc._id || !doc._rev) {
      throw new Error('Document must have _id and _rev for updates')
    }

    const docWithTimestamp = {
      ...doc,
      updatedAt: new Date().toISOString()
    }

    return this.request('PUT', `/${dbName}/${doc._id}`, docWithTimestamp)
  }

  async deleteDocument(
    dbName: string,
    docId: string,
    rev: string
  ): Promise<CouchDBResponse> {
    return this.request('DELETE', `/${dbName}/${docId}?rev=${rev}`)
  }

  // Bulk operations
  async bulkDocs<T extends CouchDBDocument>(
    dbName: string,
    docs: Array<Partial<T>>
  ): Promise<CouchDBBulkResponse[]> {
    const docsWithTimestamps = docs.map(doc => ({
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    return this.request('POST', `/${dbName}/_bulk_docs`, {
      docs: docsWithTimestamps
    })
  }

  // View operations
  async queryView<T>(
    dbName: string,
    designDoc: string,
    viewName: string,
    options: {
      key?: unknown
      keys?: unknown[]
      startkey?: unknown
      endkey?: unknown
      limit?: number
      skip?: number
      descending?: boolean
      include_docs?: boolean
      reduce?: boolean
      group?: boolean
    } = {}
  ): Promise<CouchDBViewResponse<T>> {
    const queryParams = new URLSearchParams()

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value))
        } else {
          queryParams.append(key, value.toString())
        }
      }
    })

    const path = `/${dbName}/_design/${designDoc}/_view/${viewName}?${queryParams.toString()}`
    return this.request('GET', path)
  }

  // Find operations (Mango queries)
  async find<T>(
    dbName: string,
    selector: Record<string, unknown>,
    options: {
      fields?: string[]
      sort?: Array<{ [key: string]: 'asc' | 'desc' }>
      limit?: number
      skip?: number
      use_index?: string
    } = {}
  ): Promise<{ docs: T[]; warning?: string; execution_stats?: Record<string, unknown> }> {
    return this.request('POST', `/${dbName}/_find`, {
      selector,
      ...options
    })
  }

  // Index operations
  async createIndex(
    dbName: string,
    fields: string[],
    name?: string,
    type: 'json' | 'text' = 'json'
  ): Promise<{ result: string; id: string; name: string }> {
    return this.request('POST', `/${dbName}/_index`, {
      index: {
        fields
      },
      name,
      type
    })
  }

  // Security operations
  async setSecurity(
    dbName: string,
    security: {
      admins?: { names?: string[]; roles?: string[] }
      members?: { names?: string[]; roles?: string[] }
    }
  ): Promise<{ ok: boolean }> {
    return this.request('PUT', `/${dbName}/_security`, security)
  }

  // Replication
  async replicate(
    source: string,
    target: string,
    options: {
      continuous?: boolean
      filter?: string
      doc_ids?: string[]
    } = {}
  ): Promise<Record<string, unknown>> {
    return this.request('POST', '/_replicate', {
      source,
      target,
      ...options
    })
  }
}

// Default CouchDB configuration
const defaultConfig: CouchDBConfig = {
  host: process.env.COUCHDB_HOST || 'localhost',
  port: parseInt(process.env.COUCHDB_PORT || '5984'),
  protocol: (process.env.COUCHDB_PROTOCOL as 'http' | 'https') || 'http',
  username: process.env.COUCHDB_USERNAME || 'admin',
  password: process.env.COUCHDB_PASSWORD || 'password',
  database: process.env.COUCHDB_DATABASE || 'mtaani',
  maxRetries: 3,
  timeout: 30000
}

// Export singleton instance
export const couchdb = new CouchDBClient(defaultConfig)

// Utility functions
export function generateDocId(type: string, identifier?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return identifier ? `${type}:${identifier}` : `${type}:${timestamp}:${random}`
}

export function parseDocId(docId: string): { type: string; identifier?: string } {
  const parts = docId.split(':')
  return {
    type: parts[0],
    identifier: parts.slice(1).join(':')
  }
}

export function validateDocument<T extends CouchDBDocument>(doc: T): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!doc.type) {
    errors.push('Document must have a type field')
  }

  if (!doc.createdAt) {
    errors.push('Document must have a createdAt field')
  }

  if (!doc.updatedAt) {
    errors.push('Document must have an updatedAt field')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
