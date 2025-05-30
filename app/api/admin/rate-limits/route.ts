import { NextRequest, NextResponse } from 'next/server'
import { rateLimitService } from '@/lib/services/rate-limit-service'
import { withSecurity } from '@/lib/middleware/api-security'

// GET /api/admin/rate-limits - Get current rate limit status
export async function GET(request: NextRequest) {
  return withSecurity(request, {
    adminOnly: true,
    rateLimit: {
      requests: 100,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  }, async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const identifier = searchParams.get('identifier')

      if (identifier) {
        // Get specific rate limit status
        const usage = rateLimitService.getUsage(identifier)

        if (!usage) {
          return NextResponse.json({
            success: true,
            data: {
              identifier,
              status: 'no_limits',
              message: 'No active rate limits for this identifier'
            }
          })
        }

        return NextResponse.json({
          success: true,
          data: {
            identifier,
            count: usage.count,
            resetTime: usage.resetTime,
            timeRemaining: usage.timeRemaining,
            resetIn: Math.ceil(usage.timeRemaining / 1000) + ' seconds'
          }
        })
      } else {
        // Get all active rate limits
        const allLimits = rateLimitService.getAllLimits()

        return NextResponse.json({
          success: true,
          data: {
            activeLimits: allLimits.length,
            limits: allLimits.slice(0, 100), // Limit to first 100 for performance
            summary: {
              totalActive: allLimits.length,
              topOffenders: allLimits.slice(0, 10).map(limit => ({
                identifier: limit.identifier,
                count: limit.count,
                timeRemaining: Math.ceil(limit.timeRemaining / 1000) + ' seconds'
              }))
            }
          }
        })
      }

    } catch (error) {
      console.error('Get rate limits error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/admin/rate-limits - Reset rate limits
export async function DELETE(request: NextRequest) {
  return withSecurity(request, {
    adminOnly: true,
    rateLimit: {
      requests: 20,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  }, async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const identifier = searchParams.get('identifier')
      const action = searchParams.get('action') // 'reset' or 'cleanup'

      if (!identifier && action !== 'cleanup') {
        return NextResponse.json(
          { error: 'identifier is required unless action is cleanup' },
          { status: 400 }
        )
      }

      if (action === 'cleanup') {
        // Cleanup expired entries
        rateLimitService.cleanup()
        return NextResponse.json({
          success: true,
          message: 'Rate limit cleanup completed'
        })
      }

      if (identifier) {
        // Reset specific identifier
        const reset = rateLimitService.reset(identifier)

        if (reset) {
          return NextResponse.json({
            success: true,
            message: `Rate limit reset for ${identifier}`
          })
        } else {
          return NextResponse.json({
            success: true,
            message: `No active rate limit found for ${identifier}`
          })
        }
      }

      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )

    } catch (error) {
      console.error('Reset rate limits error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

// POST /api/admin/rate-limits/test - Test rate limiting
export async function POST(request: NextRequest) {
  return withSecurity(request, {
    adminOnly: true,
    rateLimit: {
      requests: 50,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  }, async (request: NextRequest) => {
    try {
      const body = await request.json()
      const { identifier, limit, windowMs, category } = body

      if (!identifier || !limit || !windowMs) {
        return NextResponse.json(
          { error: 'Missing required fields: identifier, limit, windowMs' },
          { status: 400 }
        )
      }

      // Test the rate limit
      const result = rateLimitService.checkLimit(
        `test:${identifier}`,
        limit,
        windowMs,
        category || 'test'
      )

      return NextResponse.json({
        success: true,
        data: {
          identifier: `test:${identifier}`,
          allowed: result.allowed,
          remaining: result.remaining,
          resetTime: result.resetTime,
          totalRequests: result.totalRequests,
          limit,
          windowMs,
          resetIn: Math.ceil((result.resetTime - Date.now()) / 1000) + ' seconds'
        }
      })

    } catch (error) {
      console.error('Test rate limit error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
