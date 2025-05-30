import { NextRequest, NextResponse } from 'next/server'
import { businessService } from '@/lib/services/business-service'
import { eventService } from '@/lib/services/event-service'
import { withSecurity } from '@/lib/middleware/api-security'
import { securityAudit } from '@/lib/security-audit'

interface AnalyticsData {
  timeSeries?: Array<{
    date: string
    count: number
    cumulative?: number
  }>
  categoryStats?: Record<string, {
    count: number
    approved: number
    pending: number
    rejected: number
    [key: string]: number
  }>
  geoStats?: Record<string, number>
  statusStats?: Record<string, number>
  [key: string]: unknown
}



// GET /api/admin/analytics - Detailed analytics and insights
export async function GET(request: NextRequest) {
  return withSecurity(request, {
    adminOnly: true,
    rateLimit: {
      requests: 30,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  }, async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const metric = searchParams.get('metric') || 'overview'
      const timeframe = searchParams.get('timeframe') || '30d'
      const granularity = searchParams.get('granularity') || 'day' // day, week, month

      // Get client info for logging
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      // Calculate date range
      const now = new Date()
      let startDate: Date
      const intervals: Date[] = []

      switch (timeframe) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        case '30d':
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }

      // Generate time intervals based on granularity
      const intervalMs = granularity === 'day' ? 24 * 60 * 60 * 1000 :
                        granularity === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                        30 * 24 * 60 * 60 * 1000 // month

      for (let date = new Date(startDate); date <= now; date = new Date(date.getTime() + intervalMs)) {
        intervals.push(new Date(date))
      }

      let analyticsData: AnalyticsData = {}

      switch (metric) {
        case 'businesses':
          analyticsData = await getBusinessAnalytics(startDate, intervals)
          break
        case 'events':
          analyticsData = await getEventAnalytics(startDate, intervals)
          break
        case 'security':
          analyticsData = await getSecurityAnalytics(startDate, intervals)
          break
        case 'growth':
          analyticsData = await getGrowthAnalytics(startDate, intervals)
          break
        case 'overview':
        default:
          analyticsData = await getOverviewAnalytics(startDate, intervals)
          break
      }

      // Log analytics access
      securityAudit.logEvent(
        'admin_access',
        'low',
        `Admin analytics accessed: ${metric}`,
        { metric, timeframe, granularity },
        'admin',
        clientIP,
        userAgent
      )

      return NextResponse.json({
        success: true,
        data: {
          metric,
          timeframe,
          granularity,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          intervals: intervals.length,
          analytics: analyticsData,
          generatedAt: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('Analytics error:', error)

      // Log analytics error
      securityAudit.logEvent(
        'admin_access',
        'medium',
        'Admin analytics error',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'admin',
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      )

      return NextResponse.json(
        { error: 'Failed to generate analytics' },
        { status: 500 }
      )
    }
  })
}

// Business analytics
async function getBusinessAnalytics(startDate: Date, intervals: Date[]) {
  try {
    const result = await businessService.findBusinesses({}, { limit: 10000, skip: 0 })
    const businesses = result.success ? result.businesses || [] : []

    // Time series data
    const timeSeries = intervals.map(date => {
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
      const count = businesses.filter(b => {
        const createdAt = new Date(b.createdAt)
        return createdAt >= date && createdAt < nextDate
      }).length

      return {
        date: date.toISOString().split('T')[0],
        count,
        cumulative: businesses.filter(b => new Date(b.createdAt) <= date).length
      }
    })

    // Category distribution
    const categoryStats = businesses.reduce((acc: Record<string, { count: number; approved: number; pending: number; rejected: number; [key: string]: number }>, b) => {
      if (!acc[b.category]) {
        acc[b.category] = { count: 0, approved: 0, pending: 0, rejected: 0 }
      }
      acc[b.category].count++
      if (acc[b.category][b.status] !== undefined) {
        acc[b.category][b.status]++
      }
      return acc
    }, {})

    // Geographic distribution
    const geoStats = businesses.reduce((acc: Record<string, number>, b) => {
      const county = b.location?.county || 'Unknown'
      acc[county] = (acc[county] || 0) + 1
      return acc
    }, {})

    // Status trends
    const statusStats = {
      total: businesses.length,
      approved: businesses.filter(b => b.status === 'approved').length,
      pending: businesses.filter(b => b.status === 'pending').length,
      rejected: businesses.filter(b => b.status === 'rejected').length,
      verified: businesses.filter(b => b.verification?.status === 'verified').length
    }

    return {
      timeSeries,
      categoryStats,
      geoStats,
      statusStats,
      averageRating: businesses.reduce((sum, b) => sum + (b.stats?.rating || 0), 0) / businesses.length || 0,
      totalReviews: businesses.reduce((sum, b) => sum + (b.stats?.reviewCount || 0), 0)
    }
  } catch (error) {
    console.error('Business analytics error:', error)
    return { error: 'Failed to generate business analytics' }
  }
}

// Event analytics
async function getEventAnalytics(startDate: Date, intervals: Date[]) {
  try {
    const result = await eventService.findEvents({}, { limit: 10000, skip: 0 })
    const events = result.success ? result.events || [] : []

    // Time series data
    const timeSeries = intervals.map(date => {
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
      const count = events.filter(e => {
        const createdAt = new Date(e.createdAt)
        return createdAt >= date && createdAt < nextDate
      }).length

      return {
        date: date.toISOString().split('T')[0],
        count,
        cumulative: events.filter(e => new Date(e.createdAt) <= date).length
      }
    })

    // Category distribution
    const categoryStats = events.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1
      return acc
    }, {})

    // Status distribution
    const statusStats = {
      total: events.length,
      pending_approval: events.filter(e => e.status === 'pending_approval').length,
      approved: events.filter(e => e.status === 'approved').length,
      rejected: events.filter(e => e.status === 'rejected').length,
      published: events.filter(e => e.status === 'published').length
    }

    return {
      timeSeries,
      categoryStats,
      statusStats,
      upcomingEvents: events.filter(e => {
        const startDate = new Date(e.schedule?.startDate || '')
        return startDate > new Date()
      }).length
    }
  } catch (error) {
    console.error('Event analytics error:', error)
    return { error: 'Failed to generate event analytics' }
  }
}

// Security analytics
async function getSecurityAnalytics(startDate: Date, intervals: Date[]) {
  try {
    const securityEvents = securityAudit.getEvents({ startDate, limit: 10000 })

    // Time series data
    const timeSeries = intervals.map(date => {
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
      const count = securityEvents.filter(e => {
        return e.timestamp >= date && e.timestamp < nextDate
      }).length

      return {
        date: date.toISOString().split('T')[0],
        count
      }
    })

    // Event type distribution
    const eventTypeStats = securityEvents.reduce((acc: Record<string, number>, e) => {
      acc[e.eventType] = (acc[e.eventType] || 0) + 1
      return acc
    }, {})

    // Severity distribution
    const severityStats = securityEvents.reduce((acc: Record<string, number>, e) => {
      acc[e.severity] = (acc[e.severity] || 0) + 1
      return acc
    }, {})

    // Top IPs
    const ipStats = securityEvents
      .filter(e => e.ipAddress)
      .reduce((acc: Record<string, number>, e) => {
        acc[e.ipAddress!] = (acc[e.ipAddress!] || 0) + 1
        return acc
      }, {})

    return {
      timeSeries,
      eventTypeStats,
      severityStats,
      topIPs: Object.entries(ipStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count })),
      totalEvents: securityEvents.length,
      criticalEvents: securityEvents.filter(e => e.severity === 'critical').length
    }
  } catch (error) {
    console.error('Security analytics error:', error)
    return { error: 'Failed to generate security analytics' }
  }
}

// Growth analytics
async function getGrowthAnalytics(startDate: Date, intervals: Date[]) {
  try {
    const [businessResult, eventResult] = await Promise.all([
      businessService.findBusinesses({}, { limit: 10000, skip: 0 }),
      eventService.findEvents({}, { limit: 10000, skip: 0 })
    ])

    const businesses = businessResult.success ? businessResult.businesses || [] : []
    const events = eventResult.success ? eventResult.events || [] : []

    // Combined growth metrics
    const growthData = intervals.map(date => {
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

      const newBusinesses = businesses.filter(b => {
        const createdAt = new Date(b.createdAt)
        return createdAt >= date && createdAt < nextDate
      }).length

      const newEvents = events.filter(e => {
        const createdAt = new Date(e.createdAt)
        return createdAt >= date && createdAt < nextDate
      }).length

      return {
        date: date.toISOString().split('T')[0],
        businesses: newBusinesses,
        events: newEvents,
        total: newBusinesses + newEvents
      }
    })

    // Calculate growth rates
    const totalBusinesses = businesses.length
    const totalEvents = events.length
    const previousPeriodBusinesses = businesses.filter(b =>
      new Date(b.createdAt) < new Date(startDate.getTime() - (Date.now() - startDate.getTime()))
    ).length
    const previousPeriodEvents = events.filter(e =>
      new Date(e.createdAt) < new Date(startDate.getTime() - (Date.now() - startDate.getTime()))
    ).length

    const businessGrowthRate = previousPeriodBusinesses > 0
      ? ((totalBusinesses - previousPeriodBusinesses) / previousPeriodBusinesses) * 100
      : 0

    const eventGrowthRate = previousPeriodEvents > 0
      ? ((totalEvents - previousPeriodEvents) / previousPeriodEvents) * 100
      : 0

    return {
      timeSeries: growthData,
      growthRates: {
        businesses: businessGrowthRate,
        events: eventGrowthRate
      },
      totals: {
        businesses: totalBusinesses,
        events: totalEvents
      }
    }
  } catch (error) {
    console.error('Growth analytics error:', error)
    return { error: 'Failed to generate growth analytics' }
  }
}

// Overview analytics
async function getOverviewAnalytics(startDate: Date, intervals: Date[]) {
  try {
    const [businessAnalytics, eventAnalytics, securityAnalytics] = await Promise.all([
      getBusinessAnalytics(startDate, intervals),
      getEventAnalytics(startDate, intervals),
      getSecurityAnalytics(startDate, intervals)
    ])

    return {
      businesses: businessAnalytics,
      events: eventAnalytics,
      security: securityAnalytics,
      summary: {
        totalBusinesses: businessAnalytics.statusStats?.total || 0,
        totalEvents: eventAnalytics.statusStats?.total || 0,
        securityEvents: securityAnalytics.totalEvents || 0,
        criticalSecurityEvents: securityAnalytics.criticalEvents || 0
      }
    }
  } catch (error) {
    console.error('Overview analytics error:', error)
    return { error: 'Failed to generate overview analytics' }
  }
}
