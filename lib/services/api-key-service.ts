import { couchdb } from '../couchdb'
import { securityAudit } from '../security-audit'
import { randomBytes, createHash } from 'crypto'

export interface APIKeyDocument {
  _id?: string
  _rev?: string
  type: 'api_key'
  keyId: string
  hashedKey: string
  name: string
  description?: string
  permissions: string[]
  rateLimit: {
    requests: number
    windowMs: number
  }
  usage: {
    totalRequests: number
    lastUsed?: string
    lastIP?: string
  }
  restrictions: {
    allowedIPs?: string[]
    allowedDomains?: string[]
    allowedEndpoints?: string[]
  }
  status: 'active' | 'inactive' | 'revoked'
  expiresAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  version: number
  isDeleted: boolean
}

export class APIKeyService {
  private readonly dbName = 'mtaani'

  // Generate a new API key
  generateAPIKey(): { keyId: string; apiKey: string; hashedKey: string } {
    const keyId = `ak_${Date.now()}_${randomBytes(8).toString('hex')}`
    const apiKey = `mtaani_${randomBytes(32).toString('hex')}`
    const hashedKey = createHash('sha256').update(apiKey).digest('hex')

    return { keyId, apiKey, hashedKey }
  }

  // Create a new API key
  async createAPIKey(keyData: {
    name: string
    description?: string
    permissions: string[]
    rateLimit?: {
      requests: number
      windowMs: number
    }
    restrictions?: {
      allowedIPs?: string[]
      allowedDomains?: string[]
      allowedEndpoints?: string[]
    }
    expiresAt?: string
    createdBy: string
  }): Promise<{ success: boolean; apiKey?: string; keyId?: string; error?: string }> {
    try {
      const { keyId, apiKey, hashedKey } = this.generateAPIKey()

      const apiKeyDoc: Omit<APIKeyDocument, '_id' | '_rev'> = {
        type: 'api_key',
        keyId,
        hashedKey,
        name: keyData.name,
        description: keyData.description,
        permissions: keyData.permissions,
        rateLimit: keyData.rateLimit || {
          requests: 1000,
          windowMs: 60 * 60 * 1000 // 1 hour
        },
        usage: {
          totalRequests: 0
        },
        restrictions: keyData.restrictions || {},
        status: 'active',
        expiresAt: keyData.expiresAt,
        createdBy: keyData.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        isDeleted: false
      }

      const response = await couchdb.createDocument(this.dbName, apiKeyDoc)

      if (response.ok) {
        securityAudit.logEvent(
          'api_key_created',
          'low',
          'API key created',
          {
            keyId,
            name: keyData.name,
            permissions: keyData.permissions,
            createdBy: keyData.createdBy
          },
          keyData.createdBy
        )

        return { success: true, apiKey, keyId }
      }

      return { success: false, error: 'Failed to create API key' }
    } catch (error) {
      console.error('API key creation error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Validate an API key
  async validateAPIKey(apiKey: string): Promise<{
    valid: boolean
    keyData?: APIKeyDocument
    error?: string
  }> {
    try {
      if (!apiKey || !apiKey.startsWith('mtaani_')) {
        return { valid: false, error: 'Invalid API key format' }
      }

      const hashedKey = createHash('sha256').update(apiKey).digest('hex')

      const result = await couchdb.find<APIKeyDocument>(this.dbName, {
        type: 'api_key',
        hashedKey,
        isDeleted: false
      }, { limit: 1 })

      if (result.docs.length === 0) {
        return { valid: false, error: 'API key not found' }
      }

      const keyData = result.docs[0]

      // Check if key is active
      if (keyData.status !== 'active') {
        return { valid: false, error: `API key is ${keyData.status}` }
      }

      // Check if key has expired
      if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
        return { valid: false, error: 'API key has expired' }
      }

      return { valid: true, keyData }
    } catch (error) {
      console.error('API key validation error:', error)
      return { valid: false, error: 'Internal server error' }
    }
  }

  // Update API key usage
  async updateUsage(
    keyId: string,
    clientIP: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await couchdb.find<APIKeyDocument>(this.dbName, {
        type: 'api_key',
        keyId,
        isDeleted: false
      }, { limit: 1 })

      if (result.docs.length === 0) {
        return { success: false, error: 'API key not found' }
      }

      const keyData = result.docs[0]
      const updatedKey: APIKeyDocument = {
        ...keyData,
        usage: {
          totalRequests: keyData.usage.totalRequests + 1,
          lastUsed: new Date().toISOString(),
          lastIP: clientIP
        },
        updatedAt: new Date().toISOString(),
        version: keyData.version + 1
      }

      const response = await couchdb.updateDocument(this.dbName, updatedKey)
      return { success: response.ok }
    } catch (error) {
      console.error('API key usage update error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Revoke an API key
  async revokeAPIKey(
    keyId: string,
    revokedBy: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await couchdb.find<APIKeyDocument>(this.dbName, {
        type: 'api_key',
        keyId,
        isDeleted: false
      }, { limit: 1 })

      if (result.docs.length === 0) {
        return { success: false, error: 'API key not found' }
      }

      const keyData = result.docs[0]
      const updatedKey: APIKeyDocument = {
        ...keyData,
        status: 'revoked',
        updatedAt: new Date().toISOString(),
        version: keyData.version + 1
      }

      const response = await couchdb.updateDocument(this.dbName, updatedKey)

      if (response.ok) {
        securityAudit.logEvent(
          'api_key_revoked',
          'medium',
          'API key revoked',
          {
            keyId,
            name: keyData.name,
            revokedBy,
            reason
          },
          revokedBy
        )
      }

      return { success: response.ok }
    } catch (error) {
      console.error('API key revocation error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // List API keys
  async listAPIKeys(
    filters: {
      status?: 'active' | 'inactive' | 'revoked'
      createdBy?: string
    } = {},
    options: { limit?: number; skip?: number } = {}
  ): Promise<{ success: boolean; keys?: Omit<APIKeyDocument, 'hashedKey'>[]; error?: string }> {
    try {
      const selector: Record<string, unknown> = {
        type: 'api_key',
        isDeleted: false,
        ...filters
      }

      const result = await couchdb.find<APIKeyDocument>(this.dbName, selector, {
        limit: options.limit || 50,
        skip: options.skip || 0,
        sort: [{ createdAt: 'desc' }]
      })

      // Remove sensitive data
      const sanitizedKeys = result.docs.map(key => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hashedKey, ...sanitizedKey } = key
        return sanitizedKey
      })

      return { success: true, keys: sanitizedKeys }
    } catch (error) {
      console.error('List API keys error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Check permissions
  hasPermission(permissions: string[], required: string[]): boolean {
    // Admin permissions grant access to everything
    if (permissions.includes('admin:*') || permissions.includes('*')) {
      return true
    }

    // Check specific permissions
    return required.some(req => {
      // Exact match
      if (permissions.includes(req)) {
        return true
      }

      // Wildcard match (e.g., 'api:*' matches 'api:read')
      return permissions.some(perm => {
        if (perm.endsWith(':*')) {
          const prefix = perm.slice(0, -1)
          return req.startsWith(prefix)
        }
        return false
      })
    })
  }

  // Check IP restrictions
  checkIPRestriction(allowedIPs: string[] | undefined, clientIP: string): boolean {
    if (!allowedIPs || allowedIPs.length === 0) {
      return true // No restrictions
    }

    return allowedIPs.includes(clientIP) || allowedIPs.includes('*')
  }

  // Check domain restrictions
  checkDomainRestriction(allowedDomains: string[] | undefined, origin: string): boolean {
    if (!allowedDomains || allowedDomains.length === 0) {
      return true // No restrictions
    }

    if (!origin) {
      return false
    }

    try {
      const domain = new URL(origin).hostname
      return allowedDomains.includes(domain) || allowedDomains.includes('*')
    } catch {
      return false
    }
  }

  // Check endpoint restrictions
  checkEndpointRestriction(allowedEndpoints: string[] | undefined, endpoint: string): boolean {
    if (!allowedEndpoints || allowedEndpoints.length === 0) {
      return true // No restrictions
    }

    return allowedEndpoints.some(allowed => {
      if (allowed.endsWith('*')) {
        const prefix = allowed.slice(0, -1)
        return endpoint.startsWith(prefix)
      }
      return endpoint === allowed
    })
  }

  // Get API key statistics
  async getKeyStatistics(keyId: string): Promise<{
    success: boolean
    stats?: {
      totalRequests: number
      lastUsed?: string
      lastIP?: string
      createdAt: string
      status: string
      daysActive: number
    }
    error?: string
  }> {
    try {
      const result = await couchdb.find<APIKeyDocument>(this.dbName, {
        type: 'api_key',
        keyId,
        isDeleted: false
      }, { limit: 1 })

      if (result.docs.length === 0) {
        return { success: false, error: 'API key not found' }
      }

      const keyData = result.docs[0]
      const createdAt = new Date(keyData.createdAt)
      const now = new Date()
      const daysActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

      return {
        success: true,
        stats: {
          totalRequests: keyData.usage.totalRequests,
          lastUsed: keyData.usage.lastUsed,
          lastIP: keyData.usage.lastIP,
          createdAt: keyData.createdAt,
          status: keyData.status,
          daysActive
        }
      }
    } catch (error) {
      console.error('Get API key statistics error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
}

// Export singleton instance
export const apiKeyService = new APIKeyService()
