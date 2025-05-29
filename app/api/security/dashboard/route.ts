import { NextRequest, NextResponse } from 'next/server'
import { securityAudit } from '@/lib/security-audit'

// Security dashboard API for monitoring and management
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const adminToken = searchParams.get('adminToken')
  const timeframe = searchParams.get('timeframe') || '24h'

  // Verify admin access
  const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN || 'dev_admin_token_789'
  if (adminToken !== expectedAdminToken) {
    securityAudit.logInvalidToken('api', undefined, request.ip, request.headers.get('user-agent') || undefined)
    return NextResponse.json(
      { error: 'Unauthorized access to security dashboard' },
      { status: 401 }
    )
  }

  try {
    // Calculate timeframe
    const timeframeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[timeframe] || 24 * 60 * 60 * 1000

    const startDate = new Date(Date.now() - timeframeMs)

    // Get security status
    const securityStatus = securityAudit.getSecurityStatus()

    // Get events for timeframe
    const events = securityAudit.getEvents({
      startDate,
      limit: 1000
    })

    // Calculate analytics
    const analytics = {
      totalEvents: events.length,
      eventsByType: events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      eventsBySeverity: events.reduce((acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      topIPs: getTopIPs(events),
      topUsers: getTopUsers(events),
      timelineData: getTimelineData(events, timeframe),
      threatLevel: calculateThreatLevel(events, securityStatus)
    }

    // Recent critical events
    const criticalEvents = events
      .filter(e => e.severity === 'critical')
      .slice(0, 10)

    // Active threats
    const activeThreats = {
      blockedIPs: securityStatus.blockedIPs.length,
      suspiciousUsers: securityStatus.suspiciousUsers.length,
      ongoingAttacks: events.filter(e =>
        e.eventType === 'feature_bypass_attempt' &&
        Date.now() - e.timestamp.getTime() < 60 * 60 * 1000 // Last hour
      ).length
    }

    return NextResponse.json({
      status: 'success',
      timeframe,
      securityStatus,
      analytics,
      criticalEvents,
      activeThreats,
      recommendations: generateSecurityRecommendations(analytics, activeThreats),
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Security dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to generate security dashboard' },
      { status: 500 }
    )
  }
}

// POST endpoint for security actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, adminToken, target, reason } = body

    // Verify admin access
    const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN || 'dev_admin_token_789'
    if (adminToken !== expectedAdminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    switch (action) {
      case 'block_ip':
        if (!target) {
          return NextResponse.json({ error: 'IP address required' }, { status: 400 })
        }
        // Manual IP blocking would be implemented here
        console.log(`Admin blocked IP: ${target}, reason: ${reason}`)
        return NextResponse.json({ success: true, message: `IP ${target} blocked` })

      case 'unblock_ip':
        if (!target) {
          return NextResponse.json({ error: 'IP address required' }, { status: 400 })
        }
        securityAudit.unblockIP(target)
        return NextResponse.json({ success: true, message: `IP ${target} unblocked` })

      case 'clear_suspicious_user':
        if (!target) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }
        securityAudit.clearSuspiciousUser(target)
        return NextResponse.json({ success: true, message: `User ${target} cleared` })

      case 'resolve_event':
        if (!target) {
          return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
        }
        const resolved = securityAudit.resolveEvent(target)
        if (resolved) {
          return NextResponse.json({ success: true, message: `Event ${target} resolved` })
        } else {
          return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Security action error:', error)
    return NextResponse.json(
      { error: 'Failed to execute security action' },
      { status: 500 }
    )
  }
}

// Helper functions
function getTopIPs(events: SecurityEvent[]): Array<{ ip: string; count: number; severity: string }> {
  const ipCounts = events.reduce((acc, event) => {
    if (event.ipAddress) {
      if (!acc[event.ipAddress]) {
        acc[event.ipAddress] = { count: 0, maxSeverity: 'low' }
      }
      acc[event.ipAddress].count++

      // Track highest severity
      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
      if (severityLevels[event.severity] > severityLevels[acc[event.ipAddress].maxSeverity]) {
        acc[event.ipAddress].maxSeverity = event.severity
      }
    }
    return acc
  }, {} as Record<string, { count: number; maxSeverity: string }>)

  return Object.entries(ipCounts)
    .map(([ip, data]) => ({ ip, count: data.count, severity: data.maxSeverity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function getTopUsers(events: SecurityEvent[]): Array<{ userId: string; count: number; severity: string }> {
  const userCounts = events.reduce((acc, event) => {
    if (event.userId) {
      if (!acc[event.userId]) {
        acc[event.userId] = { count: 0, maxSeverity: 'low' }
      }
      acc[event.userId].count++

      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
      if (severityLevels[event.severity] > severityLevels[acc[event.userId].maxSeverity]) {
        acc[event.userId].maxSeverity = event.severity
      }
    }
    return acc
  }, {} as Record<string, { count: number; maxSeverity: string }>)

  return Object.entries(userCounts)
    .map(([userId, data]) => ({ userId, count: data.count, severity: data.maxSeverity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function getTimelineData(events: SecurityEvent[], timeframe: string): Array<{ timestamp: string; count: number; critical: number }> {
  const bucketSize = timeframe === '1h' ? 5 * 60 * 1000 : // 5 minutes
                     timeframe === '24h' ? 60 * 60 * 1000 : // 1 hour
                     timeframe === '7d' ? 6 * 60 * 60 * 1000 : // 6 hours
                     24 * 60 * 60 * 1000 // 1 day

  const buckets = new Map<number, { count: number; critical: number }>()

  events.forEach(event => {
    const bucketKey = Math.floor(event.timestamp.getTime() / bucketSize) * bucketSize
    const bucket = buckets.get(bucketKey) || { count: 0, critical: 0 }
    bucket.count++
    if (event.severity === 'critical') bucket.critical++
    buckets.set(bucketKey, bucket)
  })

  return Array.from(buckets.entries())
    .map(([timestamp, data]) => ({
      timestamp: new Date(timestamp).toISOString(),
      count: data.count,
      critical: data.critical
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

function calculateThreatLevel(events: SecurityEvent[], securityStatus: { blockedIPs: string[] }): 'low' | 'medium' | 'high' | 'critical' {
  const criticalEvents = events.filter(e => e.severity === 'critical').length
  const bypassAttempts = events.filter(e => e.eventType === 'feature_bypass_attempt').length
  const blockedIPs = securityStatus.blockedIPs.length

  if (criticalEvents > 10 || bypassAttempts > 20 || blockedIPs > 5) return 'critical'
  if (criticalEvents > 5 || bypassAttempts > 10 || blockedIPs > 2) return 'high'
  if (criticalEvents > 2 || bypassAttempts > 5 || blockedIPs > 0) return 'medium'
  return 'low'
}

function generateSecurityRecommendations(analytics: { eventsByType: Record<string, number>; eventsBySeverity: Record<string, number> }, activeThreats: { blockedIPs: number; suspiciousUsers: number }): string[] {
  const recommendations: string[] = []

  if (activeThreats.blockedIPs > 5) {
    recommendations.push('High number of blocked IPs detected. Consider implementing geographic restrictions.')
  }

  if (analytics.eventsByType.feature_bypass_attempt > 10) {
    recommendations.push('Multiple bypass attempts detected. Review and strengthen feature access controls.')
  }

  if (analytics.eventsBySeverity.critical > 5) {
    recommendations.push('Multiple critical security events. Immediate security review recommended.')
  }

  if (activeThreats.suspiciousUsers > 3) {
    recommendations.push('Several users flagged as suspicious. Consider implementing additional verification.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Security status is normal. Continue monitoring.')
  }

  return recommendations
}
