import { securityAudit } from '../security-audit'

// Rate limit configurations for different endpoint types
export const RATE_LIMITS = {
  // Public endpoints
  public: {
    requests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP'
  },
  
  // Authentication endpoints
  auth: {
    requests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts'
  },
  
  // API endpoints
  api: {
    requests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'API rate limit exceeded'
  },
  
  // Admin endpoints
  admin: {
    requests: 500,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Admin API rate limit exceeded'
  },
  
  // File upload endpoints
  upload: {
    requests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Upload rate limit exceeded'
  },
  
  // Subscription endpoints
  subscription: {
    requests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Subscription API rate limit exceeded'
  }
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalRequests: number
}

export class RateLimitService {
  private static store = new Map<string, RateLimitEntry>()
  private static cleanupInterval: NodeJS.Timeout | null = null

  // Initialize cleanup interval
  static initialize() {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 5 * 60 * 1000) // Cleanup every 5 minutes
    }
  }

  // Cleanup expired entries
  static cleanup() {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`Rate limit cleanup: removed ${cleaned} expired entries`)
    }
  }

  // Check rate limit for a specific identifier
  static checkLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    category: string = 'general'
  ): RateLimitResult {
    const now = Date.now()
    const windowStart = now - windowMs
    const resetTime = now + windowMs
    
    // Get or create entry
    let entry = this.store.get(identifier)
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime,
        firstRequest: now
      }
      this.store.set(identifier, entry)
      
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
        totalRequests: 1
      }
    }
    
    // Check if within window
    if (entry.firstRequest < windowStart) {
      // Reset the window
      entry = {
        count: 1,
        resetTime,
        firstRequest: now
      }
      this.store.set(identifier, entry)
      
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
        totalRequests: 1
      }
    }
    
    // Increment count
    entry.count++
    this.store.set(identifier, entry)
    
    const allowed = entry.count <= limit
    const remaining = Math.max(0, limit - entry.count)
    
    // Log if limit exceeded
    if (!allowed) {
      securityAudit.logEvent(
        'suspicious_activity',
        'medium',
        'Rate limit exceeded',
        {
          identifier,
          category,
          count: entry.count,
          limit,
          windowMs
        }
      )
    }
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      totalRequests: entry.count
    }
  }

  // Check rate limit by IP address
  static checkByIP(
    ip: string,
    limitType: keyof typeof RATE_LIMITS = 'public'
  ): RateLimitResult {
    const config = RATE_LIMITS[limitType]
    return this.checkLimit(
      `ip:${ip}:${limitType}`,
      config.requests,
      config.windowMs,
      limitType
    )
  }

  // Check rate limit by user ID
  static checkByUser(
    userId: string,
    limitType: keyof typeof RATE_LIMITS = 'api'
  ): RateLimitResult {
    const config = RATE_LIMITS[limitType]
    return this.checkLimit(
      `user:${userId}:${limitType}`,
      config.requests,
      config.windowMs,
      limitType
    )
  }

  // Check rate limit by API key
  static checkByApiKey(
    apiKey: string,
    customLimit?: number,
    customWindow?: number
  ): RateLimitResult {
    const config = RATE_LIMITS.api
    return this.checkLimit(
      `apikey:${apiKey}`,
      customLimit || config.requests,
      customWindow || config.windowMs,
      'api_key'
    )
  }

  // Check rate limit by endpoint
  static checkByEndpoint(
    endpoint: string,
    identifier: string,
    limitType: keyof typeof RATE_LIMITS = 'api'
  ): RateLimitResult {
    const config = RATE_LIMITS[limitType]
    return this.checkLimit(
      `endpoint:${endpoint}:${identifier}`,
      config.requests,
      config.windowMs,
      `endpoint_${limitType}`
    )
  }

  // Get current usage for an identifier
  static getUsage(identifier: string): {
    count: number
    resetTime: number
    timeRemaining: number
  } | null {
    const entry = this.store.get(identifier)
    if (!entry) {
      return null
    }
    
    const now = Date.now()
    return {
      count: entry.count,
      resetTime: entry.resetTime,
      timeRemaining: Math.max(0, entry.resetTime - now)
    }
  }

  // Reset rate limit for an identifier (admin function)
  static reset(identifier: string): boolean {
    return this.store.delete(identifier)
  }

  // Get all active rate limits (admin function)
  static getAllLimits(): Array<{
    identifier: string
    count: number
    resetTime: number
    timeRemaining: number
  }> {
    const now = Date.now()
    const results: Array<{
      identifier: string
      count: number
      resetTime: number
      timeRemaining: number
    }> = []
    
    for (const [identifier, entry] of this.store.entries()) {
      if (entry.resetTime > now) {
        results.push({
          identifier,
          count: entry.count,
          resetTime: entry.resetTime,
          timeRemaining: entry.resetTime - now
        })
      }
    }
    
    return results.sort((a, b) => b.count - a.count)
  }

  // Check multiple rate limits at once
  static checkMultiple(
    checks: Array<{
      identifier: string
      limit: number
      windowMs: number
      category?: string
    }>
  ): {
    allowed: boolean
    results: RateLimitResult[]
    failedCheck?: string
  } {
    const results: RateLimitResult[] = []
    
    for (const check of checks) {
      const result = this.checkLimit(
        check.identifier,
        check.limit,
        check.windowMs,
        check.category
      )
      
      results.push(result)
      
      if (!result.allowed) {
        return {
          allowed: false,
          results,
          failedCheck: check.identifier
        }
      }
    }
    
    return {
      allowed: true,
      results
    }
  }

  // Get rate limit headers for HTTP responses
  static getHeaders(result: RateLimitResult, limitType: keyof typeof RATE_LIMITS): Record<string, string> {
    const config = RATE_LIMITS[limitType]
    
    return {
      'X-RateLimit-Limit': config.requests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      'X-RateLimit-Window': Math.ceil(config.windowMs / 1000).toString()
    }
  }
}

// Initialize the service
RateLimitService.initialize()

// Export singleton instance
export const rateLimitService = RateLimitService
