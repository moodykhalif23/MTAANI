import { NextRequest, NextResponse } from 'next/server'
import { businessService } from '@/lib/services/business-service'
import { eventService } from '@/lib/services/event-service'
import { apiKeyService } from '@/lib/services/api-key-service'
import { rateLimitService } from '@/lib/services/rate-limit-service'
import { withSecurity } from '@/lib/middleware/api-security'
import { securityAudit } from '@/lib/security-audit'

// GET /api/admin/dashboard - Comprehensive admin dashboard data
export async function GET(request: NextRequest) {
  return withSecurity(request, {
    adminOnly: true,
    rateLimit: {
      requests: 60,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  }, async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const timeframe = searchParams.get('timeframe') || '24h' // 24h, 7d, 30d

      // Get client info for logging
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      // Calculate date range based on timeframe
      const now = new Date()
      let startDate: Date

      switch (timeframe) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '24h':
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
      }

      // Fetch all dashboard data in parallel
      const [
        businessesResult,
        eventsResult,
        securityEvents,
        securityMetrics,
        rateLimits,
        apiKeysResult
      ] = await Promise.allSettled([
        // Businesses data
        businessService.findBusinesses({}, { limit: 1000, skip: 0 }),

        // Events data
        eventService.findEvents({}, { limit: 1000, skip: 0 }),

        // Security events
        Promise.resolve(securityAudit.getEvents({
          startDate,
          limit: 100
        })),

        // Security metrics
        Promise.resolve(securityAudit.getMetrics()),

        // Rate limits
        Promise.resolve(rateLimitService.getAllLimits()),

        // API keys
        apiKeyService.listAPIKeys({}, { limit: 100, skip: 0 })
      ])

      // Process businesses data
      const businesses = businessesResult.status === 'fulfilled' && businessesResult.value.success
        ? businessesResult.value.businesses || []
        : []

      const businessStats = {
        total: businesses.length,
        pending: businesses.filter(b => b.status === 'pending').length,
        approved: businesses.filter(b => b.status === 'approved').length,
        rejected: businesses.filter(b => b.status === 'rejected').length,
        verified: businesses.filter(b => b.verification?.status === 'verified').length,
        byCategory: businesses.reduce((acc: Record<string, number>, b) => {
          acc[b.category] = (acc[b.category] || 0) + 1
          return acc
        }, {}),
        recentSubmissions: businesses
          .filter(b => new Date(b.createdAt) >= startDate)
          .length
      }

      // Process events data
      const events = eventsResult.status === 'fulfilled' && eventsResult.value.success
        ? eventsResult.value.events || []
        : []

      const eventStats = {
        total: events.length,
        pending_approval: events.filter(e => e.status === 'pending_approval').length,
        approved: events.filter(e => e.status === 'approved').length,
        rejected: events.filter(e => e.status === 'rejected').length,
        published: events.filter(e => e.status === 'published').length,
        byCategory: events.reduce((acc: Record<string, number>, e) => {
          acc[e.category] = (acc[e.category] || 0) + 1
          return acc
        }, {}),
        recentSubmissions: events
          .filter(e => new Date(e.createdAt) >= startDate)
          .length
      }

      // Process security data
      const securityEventsData = securityEvents.status === 'fulfilled' ? securityEvents.value : []
      const securityMetricsData = securityMetrics.status === 'fulfilled' ? securityMetrics.value : {
        totalEvents: 0,
        criticalEvents: 0,
        suspiciousActivities: 0,
        bypassAttempts: 0,
        lastUpdated: new Date()
      }

      const securityStats = {
        ...securityMetricsData,
        recentEvents: securityEventsData.length,
        eventsByType: securityEventsData.reduce((acc: Record<string, number>, e) => {
          acc[e.eventType] = (acc[e.eventType] || 0) + 1
          return acc
        }, {}),
        eventsBySeverity: securityEventsData.reduce((acc: Record<string, number>, e) => {
          acc[e.severity] = (acc[e.severity] || 0) + 1
          return acc
        }, {}),
        topIPs: securityEventsData
          .filter(e => e.ipAddress)
          .reduce((acc: Record<string, number>, e) => {
            acc[e.ipAddress!] = (acc[e.ipAddress!] || 0) + 1
            return acc
          }, {}),
        recentCritical: securityEventsData
          .filter(e => e.severity === 'critical')
          .slice(0, 5)
      }

      // Process rate limits data
      const rateLimitsData = rateLimits.status === 'fulfilled' ? rateLimits.value : []
      const rateLimitStats = {
        activeRateLimits: rateLimitsData.length,
        topOffenders: rateLimitsData.slice(0, 10).map(limit => ({
          identifier: limit.identifier,
          count: limit.count,
          timeRemaining: Math.ceil(limit.timeRemaining / 1000)
        }))
      }

      // Process API keys data
      const apiKeys = apiKeysResult.status === 'fulfilled' && apiKeysResult.value.success
        ? apiKeysResult.value.keys || []
        : []

      const apiKeyStats = {
        total: apiKeys.length,
        active: apiKeys.filter(k => k.status === 'active').length,
        inactive: apiKeys.filter(k => k.status === 'inactive').length,
        revoked: apiKeys.filter(k => k.status === 'revoked').length,
        totalRequests: apiKeys.reduce((sum, k) => sum + (k.usage?.totalRequests || 0), 0),
        recentlyUsed: apiKeys
          .filter(k => k.usage?.lastUsed && new Date(k.usage.lastUsed) >= startDate)
          .length
      }

      // System health indicators
      const systemHealth = {
        status: 'healthy', // This could be determined by various factors
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected', // This could be checked dynamically
          security: securityStats.criticalEvents === 0 ? 'secure' : 'alert',
          rateLimiting: rateLimitStats.activeRateLimits < 100 ? 'normal' : 'high_load'
        }
      }

      // Recent activity summary
      const recentActivity = [
        ...businesses.slice(0, 5).map(b => ({
          type: 'business',
          action: 'submitted',
          item: b.name,
          timestamp: b.createdAt,
          status: b.status
        })),
        ...events.slice(0, 5).map(e => ({
          type: 'event',
          action: 'submitted',
          item: e.title,
          timestamp: e.createdAt,
          status: e.status
        })),
        ...securityEventsData.slice(0, 5).map(s => ({
          type: 'security',
          action: s.eventType,
          item: s.description,
          timestamp: s.timestamp.toISOString(),
          severity: s.severity
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)

      // Log dashboard access
      securityAudit.logEvent(
        'admin_access',
        'low',
        'Admin dashboard accessed',
        { timeframe },
        'admin',
        clientIP,
        userAgent
      )

      return NextResponse.json({
        success: true,
        data: {
          overview: {
            businesses: businessStats,
            events: eventStats,
            security: securityStats,
            apiKeys: apiKeyStats,
            rateLimits: rateLimitStats
          },
          systemHealth,
          recentActivity,
          timeframe,
          generatedAt: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('Admin dashboard error:', error)

      // Log dashboard error
      securityAudit.logEvent(
        'admin_access',
        'medium',
        'Admin dashboard error',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'admin',
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      )

      return NextResponse.json(
        { error: 'Failed to load dashboard data' },
        { status: 500 }
      )
    }
  })
}
