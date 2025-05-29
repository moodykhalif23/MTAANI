import { alertSystem } from './alert-system'

interface SecurityEvent {
  id: string
  timestamp: Date
  userId?: string
  eventType: 'subscription_access' | 'plan_upgrade' | 'payment_attempt' | 'feature_bypass_attempt' | 'usage_limit_exceeded' | 'invalid_token' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  resolved: boolean
}

interface SecurityMetrics {
  totalEvents: number
  criticalEvents: number
  suspiciousActivities: number
  bypassAttempts: number
  lastUpdated: Date
}

// In-memory storage for demo - in production, use a secure database
const securityEvents: SecurityEvent[] = []
const securityMetrics: SecurityMetrics = {
  totalEvents: 0,
  criticalEvents: 0,
  suspiciousActivities: 0,
  bypassAttempts: 0,
  lastUpdated: new Date()
}

// Security event logger
export class SecurityAudit {
  private static instance: SecurityAudit
  private alertThresholds = {
    bypassAttempts: 5, // Alert after 5 bypass attempts
    suspiciousActivity: 10, // Alert after 10 suspicious activities
    criticalEvents: 3, // Alert after 3 critical events
    invalidTokens: 10, // Alert after 10 invalid token attempts
    usageLimitViolations: 15, // Alert after 15 usage violations
    rapidRequests: 50 // Alert after 50 requests in 1 minute from same IP
  }

  private ipRequestCounts: Map<string, { count: number; lastReset: number }> = new Map()
  private userActivityPatterns: Map<string, { lastActivity: number; requestCount: number }> = new Map()
  private blockedIPs: Set<string> = new Set()
  private suspiciousUsers: Set<string> = new Set()

  static getInstance(): SecurityAudit {
    if (!SecurityAudit.instance) {
      SecurityAudit.instance = new SecurityAudit()
    }
    return SecurityAudit.instance
  }

  // Log a security event with enhanced monitoring
  logEvent(
    eventType: SecurityEvent['eventType'],
    severity: SecurityEvent['severity'],
    description: string,
    metadata: Record<string, unknown> = {},
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    // Check for blocked IPs
    if (ipAddress && this.blockedIPs.has(ipAddress)) {
      console.warn(`🚫 Blocked IP ${ipAddress} attempted access`)
      return
    }

    // Track IP request patterns
    if (ipAddress) {
      this.trackIPActivity(ipAddress)
    }

    // Track user activity patterns
    if (userId) {
      this.trackUserActivity(userId)
    }

    const event: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date(),
      userId,
      eventType,
      severity,
      description,
      metadata: {
        ...metadata,
        isBlocked: ipAddress ? this.blockedIPs.has(ipAddress) : false,
        isSuspiciousUser: userId ? this.suspiciousUsers.has(userId) : false,
        requestPattern: this.getRequestPattern(ipAddress, userId)
      },
      ipAddress,
      userAgent,
      resolved: false
    }

    securityEvents.push(event)
    this.updateMetrics(event)
    this.checkAlertThresholds()
    this.analyzeSecurityPatterns(event)

    // Enhanced logging with context
    console.log(`[SECURITY ${severity.toUpperCase()}] ${eventType}: ${description}`, {
      userId,
      ipAddress,
      metadata: event.metadata,
      timestamp: event.timestamp.toISOString()
    })

    // Real-time threat response
    if (severity === 'critical') {
      this.sendCriticalAlert(event)
      this.triggerSecurityResponse(event)
    }

    // Send alert through alert system
    if (severity === 'critical' || severity === 'high') {
      alertSystem.sendSecurityAlert(
        eventType,
        severity,
        description,
        metadata,
        userId,
        ipAddress
      ).catch(error => console.error('Failed to send security alert:', error))
    }
  }

  // Log subscription access attempts
  logSubscriptionAccess(
    userId: string,
    feature: string,
    plan: string,
    success: boolean,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.logEvent(
      'subscription_access',
      success ? 'low' : 'medium',
      success ? 'Subscription access granted' : 'Subscription access denied',
      {
        feature,
        plan,
        success,
        reason
      },
      userId,
      ipAddress,
      userAgent
    )
  }

  // Log plan upgrade attempts
  logPlanUpgrade(
    userId: string,
    fromPlan: string,
    toPlan: string,
    success: boolean,
    paymentId?: string,
    amount?: number,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.logEvent(
      'plan_upgrade',
      success ? 'low' : 'medium',
      success ? 'Plan upgrade successful' : 'Plan upgrade failed',
      {
        fromPlan,
        toPlan,
        success,
        paymentId,
        amount
      },
      userId,
      ipAddress,
      userAgent
    )
  }

  // Log potential bypass attempts
  logBypassAttempt(
    userId: string,
    feature: string,
    plan: string,
    attemptType: 'client_manipulation' | 'token_tampering' | 'direct_access',
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.logEvent(
      'feature_bypass_attempt',
      'high',
      'Potential feature bypass attempt detected',
      {
        feature,
        plan,
        attemptType
      },
      userId,
      ipAddress,
      userAgent
    )
  }

  // Log usage limit exceeded
  logUsageLimitExceeded(
    userId: string,
    feature: string,
    plan: string,
    currentUsage: number,
    limit: number,
    ipAddress?: string
  ): void {
    this.logEvent(
      'usage_limit_exceeded',
      'medium',
      'Usage limit exceeded',
      {
        feature,
        plan,
        currentUsage,
        limit
      },
      userId,
      ipAddress
    )
  }

  // Log invalid token usage
  logInvalidToken(
    tokenType: 'security' | 'payment' | 'api',
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.logEvent(
      'invalid_token',
      'high',
      'Invalid token detected',
      {
        tokenType
      },
      userId,
      ipAddress,
      userAgent
    )
  }

  // Get security events with filtering
  getEvents(
    filters: {
      userId?: string
      eventType?: SecurityEvent['eventType']
      severity?: SecurityEvent['severity']
      startDate?: Date
      endDate?: Date
      limit?: number
    } = {}
  ): SecurityEvent[] {
    let filteredEvents = [...securityEvents]

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === filters.userId)
    }

    if (filters.eventType) {
      filteredEvents = filteredEvents.filter(event => event.eventType === filters.eventType)
    }

    if (filters.severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === filters.severity)
    }

    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= filters.startDate!)
    }

    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= filters.endDate!)
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    if (filters.limit) {
      filteredEvents = filteredEvents.slice(0, filters.limit)
    }

    return filteredEvents
  }

  // Get security metrics
  getMetrics(): SecurityMetrics {
    return { ...securityMetrics }
  }

  // Mark event as resolved
  resolveEvent(eventId: string): boolean {
    const event = securityEvents.find(e => e.id === eventId)
    if (event) {
      event.resolved = true
      return true
    }
    return false
  }

  // Update metrics
  private updateMetrics(event: SecurityEvent): void {
    securityMetrics.totalEvents++
    securityMetrics.lastUpdated = new Date()

    if (event.severity === 'critical') {
      securityMetrics.criticalEvents++
    }

    if (event.eventType === 'feature_bypass_attempt') {
      securityMetrics.bypassAttempts++
    }

    if (event.eventType === 'suspicious_activity') {
      securityMetrics.suspiciousActivities++
    }
  }

  // Check if alert thresholds are exceeded
  private checkAlertThresholds(): void {
    const recentEvents = this.getEvents({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    })

    const recentBypassAttempts = recentEvents.filter(e => e.eventType === 'feature_bypass_attempt').length
    const recentSuspiciousActivities = recentEvents.filter(e => e.eventType === 'suspicious_activity').length
    const recentCriticalEvents = recentEvents.filter(e => e.severity === 'critical').length

    if (recentBypassAttempts >= this.alertThresholds.bypassAttempts) {
      this.sendAlert('High number of bypass attempts detected in the last 24 hours', 'critical')
    }

    if (recentSuspiciousActivities >= this.alertThresholds.suspiciousActivity) {
      this.sendAlert('High number of suspicious activities detected in the last 24 hours', 'high')
    }

    if (recentCriticalEvents >= this.alertThresholds.criticalEvents) {
      this.sendAlert('Multiple critical security events detected in the last 24 hours', 'critical')
    }
  }

  // Send critical alert
  private sendCriticalAlert(event: SecurityEvent): void {
    console.error('🚨 CRITICAL SECURITY ALERT 🚨', {
      eventId: event.id,
      description: event.description,
      userId: event.userId,
      metadata: event.metadata,
      timestamp: event.timestamp.toISOString()
    })

    // In production, integrate with:
    // - Slack/Discord webhooks
    // - Email alerts
    // - SMS notifications
    // - Security monitoring services (Datadog, Sentry, etc.)
  }

  // Send general alert
  private sendAlert(message: string, severity: 'high' | 'critical'): void {
    console.warn(`🔔 SECURITY ALERT [${severity.toUpperCase()}]: ${message}`)

    // In production, send to monitoring service
  }

  // Enhanced monitoring methods
  private trackIPActivity(ipAddress: string): void {
    const now = Date.now()
    const current = this.ipRequestCounts.get(ipAddress) || { count: 0, lastReset: now }

    // Reset counter every minute
    if (now - current.lastReset > 60000) {
      current.count = 1
      current.lastReset = now
    } else {
      current.count++
    }

    this.ipRequestCounts.set(ipAddress, current)

    // Check for rapid requests
    if (current.count > this.alertThresholds.rapidRequests) {
      this.blockIP(ipAddress, 'Rapid request pattern detected')
    }
  }

  private trackUserActivity(userId: string): void {
    const now = Date.now()
    const current = this.userActivityPatterns.get(userId) || { lastActivity: now, requestCount: 0 }

    // Reset daily counter
    if (now - current.lastActivity > 24 * 60 * 60 * 1000) {
      current.requestCount = 1
    } else {
      current.requestCount++
    }

    current.lastActivity = now
    this.userActivityPatterns.set(userId, current)

    // Flag suspicious users
    if (current.requestCount > 1000) { // More than 1000 requests per day
      this.suspiciousUsers.add(userId)
      this.logEvent('suspicious_activity', 'high', 'Unusual user activity pattern', {
        requestCount: current.requestCount,
        timeframe: '24h'
      }, userId)
    }
  }

  private getRequestPattern(ipAddress?: string, userId?: string): {
    ipRequests: number
    userRequests: number
    isBlocked: boolean
    isSuspicious: boolean
  } {
    return {
      ipRequests: ipAddress ? this.ipRequestCounts.get(ipAddress)?.count || 0 : 0,
      userRequests: userId ? this.userActivityPatterns.get(userId)?.requestCount || 0 : 0,
      isBlocked: ipAddress ? this.blockedIPs.has(ipAddress) : false,
      isSuspicious: userId ? this.suspiciousUsers.has(userId) : false
    }
  }

  private analyzeSecurityPatterns(event: SecurityEvent): void {
    // Pattern analysis for advanced threat detection
    const recentEvents = this.getEvents({
      startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      userId: event.userId
    })

    // Check for coordinated attacks
    if (event.ipAddress) {
      const ipEvents = recentEvents.filter(e => e.ipAddress === event.ipAddress)
      if (ipEvents.length > 20) {
        this.logEvent('suspicious_activity', 'critical', 'Coordinated attack pattern detected', {
          ipAddress: event.ipAddress,
          eventCount: ipEvents.length,
          timeframe: '1h'
        }, event.userId, event.ipAddress)
      }
    }

    // Check for privilege escalation attempts
    if (event.eventType === 'feature_bypass_attempt') {
      const bypassAttempts = recentEvents.filter(e => e.eventType === 'feature_bypass_attempt')
      if (bypassAttempts.length >= 3) {
        this.suspiciousUsers.add(event.userId!)
        this.logEvent('suspicious_activity', 'critical', 'Multiple bypass attempts detected', {
          attempts: bypassAttempts.length,
          timeframe: '1h'
        }, event.userId, event.ipAddress)
      }
    }
  }

  private triggerSecurityResponse(event: SecurityEvent): void {
    // Automated security responses
    if (event.ipAddress && event.severity === 'critical') {
      // Temporarily block IP for critical events
      this.blockIP(event.ipAddress, `Critical security event: ${event.description}`)
    }

    if (event.userId && event.eventType === 'feature_bypass_attempt') {
      // Flag user for manual review
      this.suspiciousUsers.add(event.userId)
      this.logEvent('suspicious_activity', 'high', 'User flagged for manual review', {
        reason: 'Multiple bypass attempts',
        originalEvent: event.id
      }, event.userId, event.ipAddress)
    }

    // In production, trigger additional responses:
    // - Notify security team
    // - Increase monitoring for related IPs/users
    // - Trigger CAPTCHA challenges
    // - Require additional authentication
  }

  private blockIP(ipAddress: string, reason: string): void {
    this.blockedIPs.add(ipAddress)
    console.warn(`🚫 IP ${ipAddress} blocked: ${reason}`)

    // In production, update firewall rules or rate limiting
    // Set automatic unblock after a period (e.g., 1 hour)
    setTimeout(() => {
      this.blockedIPs.delete(ipAddress)
      console.log(`✅ IP ${ipAddress} unblocked after timeout`)
    }, 60 * 60 * 1000) // 1 hour
  }

  // Public methods for security management
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress)
  }

  isUserSuspicious(userId: string): boolean {
    return this.suspiciousUsers.has(userId)
  }

  unblockIP(ipAddress: string): void {
    this.blockedIPs.delete(ipAddress)
    console.log(`✅ IP ${ipAddress} manually unblocked`)
  }

  clearSuspiciousUser(userId: string): void {
    this.suspiciousUsers.delete(userId)
    console.log(`✅ User ${userId} cleared from suspicious list`)
  }

  getSecurityStatus(): {
    blockedIPs: string[]
    suspiciousUsers: string[]
    recentEvents: SecurityEvent[]
    metrics: SecurityMetrics
  } {
    return {
      blockedIPs: Array.from(this.blockedIPs),
      suspiciousUsers: Array.from(this.suspiciousUsers),
      recentEvents: this.getEvents({ limit: 50 }),
      metrics: this.getMetrics()
    }
  }
}

// Export singleton instance
export const securityAudit = SecurityAudit.getInstance()
