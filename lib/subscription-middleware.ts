import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionPlan, validateSubscriptionAccess, SubscriptionFeatures } from './subscription-types'

interface SubscriptionMiddlewareOptions {
  requiredFeature?: keyof SubscriptionFeatures
  requiredPlan?: SubscriptionPlan
  allowTrial?: boolean
  redirectUrl?: string
}

interface UserSession {
  userId: string
  plan: SubscriptionPlan
  status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'cancelled'
  securityToken: string
  currentPeriodEnd: Date
  trialEnd?: Date
}

// Secure session validation
async function validateUserSession(request: NextRequest): Promise<UserSession | null> {
  try {
    // In production, this would validate JWT tokens or session cookies
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('mtaani_session')
    
    if (!authHeader && !sessionCookie) {
      return null
    }

    // For demo, extract user info from header or cookie
    // In production, validate against secure session store
    const userId = authHeader?.replace('Bearer ', '') || sessionCookie?.value
    
    if (!userId) {
      return null
    }

    // Simulate secure session lookup
    // In production, this would query your database
    const mockSession: UserSession = {
      userId: '1',
      plan: 'professional',
      status: 'active',
      securityToken: 'secure_token_123',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trialEnd: undefined
    }

    return mockSession
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

// Server-side subscription validation
async function validateSubscriptionOnServer(
  session: UserSession,
  feature?: keyof SubscriptionFeatures
): Promise<{ isValid: boolean; hasAccess: boolean; reason?: string }> {
  
  // Convert session to subscription format
  const subscription = {
    id: session.userId,
    userId: session.userId,
    plan: session.plan,
    status: session.status,
    currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    currentPeriodEnd: session.currentPeriodEnd,
    trialEnd: session.trialEnd,
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  if (!feature) {
    // Just check if subscription is valid
    return {
      isValid: subscription.status === 'active' || subscription.status === 'trialing',
      hasAccess: true
    }
  }

  return validateSubscriptionAccess(subscription, feature)
}

// Main middleware function
export async function subscriptionMiddleware(
  request: NextRequest,
  options: SubscriptionMiddlewareOptions = {}
): Promise<NextResponse | null> {
  
  const { requiredFeature, requiredPlan, allowTrial = true, redirectUrl = '/pricing' } = options

  try {
    // Validate user session
    const session = await validateUserSession(request)
    
    if (!session) {
      console.warn('Unauthorized access attempt:', {
        url: request.url,
        ip: request.ip,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Check subscription validity
    const validation = await validateSubscriptionOnServer(session, requiredFeature)
    
    if (!validation.isValid) {
      console.warn('Invalid subscription access attempt:', {
        userId: session.userId,
        plan: session.plan,
        feature: requiredFeature,
        reason: validation.reason,
        url: request.url,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    if (!validation.hasAccess) {
      console.warn('Insufficient subscription access:', {
        userId: session.userId,
        plan: session.plan,
        feature: requiredFeature,
        reason: validation.reason,
        url: request.url,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // Check specific plan requirement
    if (requiredPlan) {
      const planHierarchy = { starter: 0, professional: 1, enterprise: 2 }
      const userPlanLevel = planHierarchy[session.plan]
      const requiredPlanLevel = planHierarchy[requiredPlan]
      
      if (userPlanLevel < requiredPlanLevel) {
        console.warn('Insufficient plan level:', {
          userId: session.userId,
          userPlan: session.plan,
          requiredPlan,
          url: request.url,
          timestamp: new Date().toISOString()
        })
        
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
    }

    // Check trial restrictions
    if (!allowTrial && session.status === 'trialing') {
      console.warn('Trial access denied:', {
        userId: session.userId,
        plan: session.plan,
        feature: requiredFeature,
        url: request.url,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // Log successful access for audit
    console.log('Subscription access granted:', {
      userId: session.userId,
      plan: session.plan,
      feature: requiredFeature,
      url: request.url,
      timestamp: new Date().toISOString()
    })

    // Add security headers
    const response = NextResponse.next()
    response.headers.set('X-Subscription-Plan', session.plan)
    response.headers.set('X-Subscription-Status', session.status)
    response.headers.set('X-User-Id', session.userId)
    
    return response

  } catch (error) {
    console.error('Subscription middleware error:', error)
    return NextResponse.redirect(new URL('/error', request.url))
  }
}

// Helper functions for specific feature checks
export const requiresProfessionalPlan = (request: NextRequest) =>
  subscriptionMiddleware(request, { requiredPlan: 'professional' })

export const requiresEnterprisePlan = (request: NextRequest) =>
  subscriptionMiddleware(request, { requiredPlan: 'enterprise' })

export const requiresAnalytics = (request: NextRequest) =>
  subscriptionMiddleware(request, { requiredFeature: 'analyticsBasic' })

export const requiresAPIAccess = (request: NextRequest) =>
  subscriptionMiddleware(request, { requiredFeature: 'apiAccess', allowTrial: false })

export const requiresDigitalMenu = (request: NextRequest) =>
  subscriptionMiddleware(request, { requiredFeature: 'digitalMenu' })
