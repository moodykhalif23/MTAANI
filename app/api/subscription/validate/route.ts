import { NextRequest, NextResponse } from 'next/server'
import { validateSubscriptionAccess, SubscriptionPlan, SubscriptionStatus } from '@/lib/subscription-types'
import { securityAudit } from '@/lib/security-audit'

// This would typically connect to your database
// For now, we'll use a secure mock that validates against server-side data
interface ServerSubscriptionData {
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd: string
  trialEnd?: string
  paymentVerified: boolean
  lastPaymentDate?: string
  securityToken: string
}

// In production, this would be stored in a secure database
const getSecurityToken = () => process.env.SECURITY_VALIDATION_TOKEN || 'dev_token_123'

const serverSubscriptions: Record<string, ServerSubscriptionData> = {
  '1': {
    userId: '1',
    plan: 'professional',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paymentVerified: true,
    lastPaymentDate: new Date().toISOString(),
    securityToken: getSecurityToken()
  },
  '2': {
    userId: '2',
    plan: 'starter',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paymentVerified: false,
    securityToken: getSecurityToken()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, feature, securityToken } = body

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

    // Get user's subscription from secure server storage
    const serverSubscription = serverSubscriptions[userId]

    if (!serverSubscription) {
      return NextResponse.json(
        {
          isValid: false,
          hasAccess: false,
          reason: 'No subscription found',
          requiresAuth: true
        },
        { status: 404 }
      )
    }

    // Verify security token to prevent tampering
    if (serverSubscription.securityToken !== securityToken) {
      securityAudit.logInvalidToken(
        'security',
        userId,
        clientIP,
        request.headers.get('user-agent') || undefined
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

    // Verify payment status for paid plans
    if (serverSubscription.plan !== 'starter' && !serverSubscription.paymentVerified) {
      return NextResponse.json(
        {
          isValid: false,
          hasAccess: false,
          reason: 'Payment verification required',
          requiresPayment: true
        },
        { status: 402 }
      )
    }

    // Convert server data to subscription format for validation
    const subscription = {
      id: serverSubscription.userId,
      userId: serverSubscription.userId,
      plan: serverSubscription.plan,
      status: serverSubscription.status,
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(serverSubscription.currentPeriodEnd),
      trialEnd: serverSubscription.trialEnd ? new Date(serverSubscription.trialEnd) : undefined,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Perform server-side validation
    const validationResult = validateSubscriptionAccess(subscription, feature)

    // Log security check with audit system
    securityAudit.logSubscriptionAccess(
      userId,
      feature,
      serverSubscription.plan,
      validationResult.isValid && validationResult.hasAccess,
      validationResult.reason,
      clientIP,
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json({
      ...validationResult,
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
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const securityToken = searchParams.get('token')

  if (!userId || !securityToken) {
    return NextResponse.json(
      { error: 'Missing userId or security token' },
      { status: 400 }
    )
  }

  const serverSubscription = serverSubscriptions[userId]

  if (!serverSubscription || serverSubscription.securityToken !== securityToken) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    plan: serverSubscription.plan,
    status: serverSubscription.status,
    paymentVerified: serverSubscription.paymentVerified,
    currentPeriodEnd: serverSubscription.currentPeriodEnd,
    trialEnd: serverSubscription.trialEnd,
    serverVerified: true
  })
}
