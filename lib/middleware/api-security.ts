import { NextRequest, NextResponse } from 'next/server'
import { securityAudit } from '../security-audit'

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// API key storage (in production, use database)
const apiKeys = new Map<string, {
  id: string
  name: string
  permissions: string[]
  rateLimit: number
  isActive: boolean
  createdAt: string
  lastUsed?: string
}>()

// Initialize default API keys
apiKeys.set(process.env.INTERNAL_API_KEY || 'internal_api_key_dev_123', {
  id: 'internal_001',
  name: 'Internal Services',
  permissions: ['internal:*'],
  rateLimit: 10000, // 10k requests per hour
  isActive: true,
  createdAt: new Date().toISOString()
})

apiKeys.set(process.env.ADMIN_API_KEY || 'admin_api_key_dev_456', {
  id: 'admin_001',
  name: 'Admin Dashboard',
  permissions: ['admin:*', 'internal:*'],
  rateLimit: 5000, // 5k requests per hour
  isActive: true,
  createdAt: new Date().toISOString()
})

export interface SecurityConfig {
  requireAuth?: boolean
  requireApiKey?: boolean
  adminOnly?: boolean
  rateLimit?: {
    requests: number
    windowMs: number
  }
  allowedOrigins?: string[]
  permissions?: string[]
}

export class APISecurityMiddleware {
  // Rate limiting
  static checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number = 3600000 // 1 hour default
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const key = `${identifier}:${Math.floor(now / windowMs)}`

    const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs }

    if (current.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime }
    }

    current.count++
    rateLimitStore.set(key, current)

    // Cleanup old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }

    return {
      allowed: true,
      remaining: limit - current.count,
      resetTime: current.resetTime
    }
  }

  // API key validation
  static validateApiKey(apiKey: string): {
    valid: boolean
    keyData?: {
      isActive: boolean
      permissions: string[]
      rateLimit: number
      lastUsed?: string
    }
    error?: string
  } {
    if (!apiKey) {
      return { valid: false, error: 'API key required' }
    }

    const keyData = apiKeys.get(apiKey)
    if (!keyData) {
      return { valid: false, error: 'Invalid API key' }
    }

    if (!keyData.isActive) {
      return { valid: false, error: 'API key is inactive' }
    }

    // Update last used
    keyData.lastUsed = new Date().toISOString()
    apiKeys.set(apiKey, keyData)

    return { valid: true, keyData }
  }

  // Permission checking
  static hasPermission(permissions: string[], required: string[]): boolean {
    if (permissions.includes('admin:*') || permissions.includes('internal:*')) {
      return true
    }

    return required.some(req =>
      permissions.includes(req) ||
      permissions.some(perm => perm.endsWith(':*') && req.startsWith(perm.slice(0, -1)))
    )
  }

  // CORS handling
  static handleCORS(request: NextRequest, allowedOrigins: string[] = []): NextResponse | null {
    const origin = request.headers.get('origin')
    const method = request.method

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })

      if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }

      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
      response.headers.set('Access-Control-Max-Age', '86400')

      return response
    }

    return null
  }

  // Main security middleware
  static async secure(
    request: NextRequest,
    config: SecurityConfig = {}
  ): Promise<{
    allowed: boolean
    response?: NextResponse
    context?: {
      userId?: string
      apiKey?: string
      permissions?: string[]
    }
  }> {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const path = new URL(request.url).pathname

    try {
      // Handle CORS
      if (config.allowedOrigins) {
        const corsResponse = this.handleCORS(request, config.allowedOrigins)
        if (corsResponse) {
          return { allowed: true, response: corsResponse }
        }
      }

      // Rate limiting
      if (config.rateLimit) {
        const identifier = clientIP
        const rateCheck = this.checkRateLimit(
          identifier,
          config.rateLimit.requests,
          config.rateLimit.windowMs
        )

        if (!rateCheck.allowed) {
          securityAudit.logEvent(
            'suspicious_activity',
            'high',
            'Rate limit exceeded',
            { path, identifier, limit: config.rateLimit.requests },
            undefined,
            clientIP,
            userAgent
          )

          const response = NextResponse.json(
            {
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil((rateCheck.resetTime - Date.now()) / 1000)
            },
            { status: 429 }
          )

          response.headers.set('X-RateLimit-Limit', config.rateLimit.requests.toString())
          response.headers.set('X-RateLimit-Remaining', rateCheck.remaining.toString())
          response.headers.set('X-RateLimit-Reset', rateCheck.resetTime.toString())

          return { allowed: false, response }
        }
      }

      const context: {
        userId?: string
        apiKey?: string
        permissions?: string[]
      } = {}

      // API key validation
      if (config.requireApiKey) {
        const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

        const keyValidation = this.validateApiKey(apiKey || '')
        if (!keyValidation.valid) {
          securityAudit.logEvent(
            'invalid_token',
            'medium',
            'Invalid API key access attempt',
            { path, apiKey: apiKey?.substring(0, 8) + '...' },
            undefined,
            clientIP,
            userAgent
          )

          return {
            allowed: false,
            response: NextResponse.json(
              { error: keyValidation.error },
              { status: 401 }
            )
          }
        }

        context.apiKey = apiKey
        context.permissions = keyValidation.keyData.permissions

        // Check permissions
        if (config.permissions && !this.hasPermission(context.permissions, config.permissions)) {
          return {
            allowed: false,
            response: NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        // Rate limit by API key
        const apiRateCheck = this.checkRateLimit(
          `api:${apiKey}`,
          keyValidation.keyData.rateLimit
        )

        if (!apiRateCheck.allowed) {
          return {
            allowed: false,
            response: NextResponse.json(
              {
                error: 'API key rate limit exceeded',
                retryAfter: Math.ceil((apiRateCheck.resetTime - Date.now()) / 1000)
              },
              { status: 429 }
            )
          }
        }
      }

      // Admin-only check
      if (config.adminOnly) {
        const adminToken = request.headers.get('x-admin-token') ||
                          new URL(request.url).searchParams.get('adminToken')

        const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN ||
                                  process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_TOKEN ||
                                  'dev_admin_dashboard_token_2024_secure'

        if (adminToken !== expectedAdminToken) {
          securityAudit.logEvent(
            'invalid_token',
            'high',
            'Unauthorized admin access attempt',
            { path },
            undefined,
            clientIP,
            userAgent
          )

          return {
            allowed: false,
            response: NextResponse.json(
              { error: 'Admin access required' },
              { status: 403 }
            )
          }
        }
      }

      // Log successful access
      securityAudit.logEvent(
        'api_access',
        'low',
        'API access granted',
        {
          path,
          hasApiKey: !!context.apiKey,
          permissions: context.permissions
        },
        context.userId,
        clientIP,
        userAgent
      )

      return { allowed: true, context }

    } catch (error) {
      console.error('Security middleware error:', error)

      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Security validation failed' },
          { status: 500 }
        )
      }
    }
  }
}

// Helper function for easy middleware usage
export async function withSecurity(
  request: NextRequest,
  config: SecurityConfig,
  handler: (request: NextRequest, context: {
    userId?: string
    apiKey?: string
    permissions?: string[]
  }) => Promise<NextResponse>
): Promise<NextResponse> {
  const securityResult = await APISecurityMiddleware.secure(request, config)

  if (!securityResult.allowed) {
    return securityResult.response!
  }

  return handler(request, securityResult.context || {})
}
