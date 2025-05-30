import { NextRequest, NextResponse } from 'next/server'
import { securityAudit } from '@/lib/security-audit'
import { subscriptionService } from '@/lib/services/subscription-service'

// In production, this would be stored in a secure database
const getSecurityToken = () => process.env.SECURITY_VALIDATION_TOKEN || 'dev_token_123'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, businessId, feature, securityToken } = body

    // Get client IP address
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Validate required fields
    if (!userId || !feature) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, feature' },
        { status: 400 }
      )
    }

    // Verify security token to prevent tampering
    const expectedToken = getSecurityToken()
    if (securityToken !== expectedToken) {
      securityAudit.logEvent(
        'invalid_token',
        'medium',
        'Invalid security token for subscription validation',
        { userId, feature },
        userId,
        clientIP,
        request.headers.get('user-agent') || 'unknown'
      )

      return NextResponse.json(
        {
          isValid: false,
          hasAccess: false,
          reason: 'Invalid security token',
          requiresAuth: true
        },
        { status: 401 }
      )
    }

    // Get user's subscription from database
    const validationResult = await subscriptionService.validateAccess(userId, feature, businessId)

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          isValid: false,
          hasAccess: false,
          reason: validationResult.reason || 'Subscription validation failed',
          requiresAuth: true
        },
        { status: 404 }
      )
    }

    if (!validationResult.hasAccess) {
      // Log access denial
      securityAudit.logEvent(
        'subscription_access',
        'medium',
        'Subscription access denied',
        {
          userId,
          feature,
          reason: validationResult.reason,
          plan: validationResult.subscription?.plan
        },
        userId,
        clientIP,
        request.headers.get('user-agent') || 'unknown'
      )

      return NextResponse.json(
        {
          isValid: true,
          hasAccess: false,
          reason: validationResult.reason,
          requiresPayment: validationResult.reason?.includes('trial') || validationResult.reason?.includes('cancelled'),
          plan: validationResult.subscription?.plan,
          status: validationResult.subscription?.status
        },
        { status: 402 }
      )
    }

    // Log successful access
    securityAudit.logEvent(
      'subscription_access',
      'low',
      'Subscription access granted',
      {
        userId,
        feature,
        plan: validationResult.subscription?.plan,
        status: validationResult.subscription?.status
      },
      userId,
      clientIP,
      request.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      isValid: true,
      hasAccess: true,
      plan: validationResult.subscription?.plan,
      status: validationResult.subscription?.status,
      serverVerified: true,
      checkedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Subscription validation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        isValid: false,
        hasAccess: false
      },
      { status: 500 }
    )
  }
}

// GET endpoint for checking subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const businessId = searchParams.get('businessId')
    const securityToken = searchParams.get('token')

    if (!userId || !securityToken) {
      return NextResponse.json(
        { error: 'Missing userId or security token' },
        { status: 400 }
      )
    }

    // Verify security token
    const expectedToken = getSecurityToken()
    if (securityToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid security token' },
        { status: 401 }
      )
    }

    // Get subscription from database
    const subscription = businessId
      ? await subscriptionService.findSubscriptionByBusinessId(businessId)
      : await subscriptionService.findSubscriptionByUserId(userId)

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      plan: subscription.plan,
      status: subscription.status,
      paymentVerified: subscription.billing.paymentMethodId ? true : false,
      currentPeriodEnd: subscription.billing.nextBillingDate,
      trialEnd: subscription.trial.trialEnd,
      isTrialing: subscription.trial.isTrialing,
      usage: subscription.usage,
      limits: subscription.limits,
      serverVerified: true
    })

  } catch (error) {
    console.error('Get subscription status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
