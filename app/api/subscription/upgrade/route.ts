import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionPlan, SUBSCRIPTION_PLANS, getPlanPrice } from '@/lib/subscription-types'
import { subscriptionService } from '@/lib/services/subscription-service'
import { securityAudit } from '@/lib/security-audit'

interface UpgradeRequest {
  userId: string
  businessId?: string
  newPlan: SubscriptionPlan
  isAnnual: boolean
  paymentMethodId?: string
  securityToken: string
}

interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'failed'
  clientSecret?: string
}

// Mock payment processing - in production, integrate with M-Pesa, Stripe, etc.
async function processPayment(
  amount: number,
  currency: string
): Promise<PaymentIntent> {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // For demo purposes, randomly succeed or fail
  const success = Math.random() > 0.1 // 90% success rate

  return {
    id: `pi_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    amount,
    currency,
    status: success ? 'succeeded' : 'failed',
    clientSecret: success ? `pi_secret_${Date.now()}` : undefined
  }
}

// Validate that the upgrade is legitimate
function validateUpgrade(currentPlan: SubscriptionPlan, newPlan: SubscriptionPlan): boolean {
  const planHierarchy = { starter: 0, professional: 1, enterprise: 2 }
  return planHierarchy[newPlan] > planHierarchy[currentPlan]
}

export async function POST(request: NextRequest) {
  try {
    const body: UpgradeRequest = await request.json()
    const { userId, businessId, newPlan, isAnnual, paymentMethodId, securityToken } = body

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate required fields
    if (!userId || !newPlan || !securityToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate plan exists
    if (!SUBSCRIPTION_PLANS[newPlan]) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      )
    }

    // Verify security token
    const expectedToken = process.env.SECURITY_VALIDATION_TOKEN || 'dev_token_123'
    if (securityToken !== expectedToken) {
      console.warn(`Unauthorized upgrade attempt for user ${userId}`)
      securityAudit.logEvent(
        'invalid_token',
        'medium',
        'Unauthorized subscription upgrade attempt',
        { userId, newPlan },
        userId,
        clientIP,
        userAgent
      )
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current subscription from database
    const currentSubscription = businessId
      ? await subscriptionService.findSubscriptionByBusinessId(businessId)
      : await subscriptionService.findSubscriptionByUserId(userId)

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Validate upgrade path
    if (!validateUpgrade(currentSubscription.plan, newPlan)) {
      return NextResponse.json(
        { error: 'Invalid upgrade path' },
        { status: 400 }
      )
    }

    // Calculate amount to charge
    const amount = getPlanPrice(newPlan, isAnnual)

    // For free plan, no payment needed
    if (amount === 0) {
      // Upgrade to free plan directly
      const upgradeResult = await subscriptionService.upgradeSubscription(
        currentSubscription._id!,
        newPlan,
        amount
      )

      if (!upgradeResult.success) {
        return NextResponse.json(
          { error: upgradeResult.error || 'Failed to upgrade subscription' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Upgraded to free plan',
          newPlan,
          paymentRequired: false
        }
      )
    }

    // Process payment for paid plans
    const paymentIntent = await processPayment(amount, 'KES')

    if (paymentIntent.status !== 'succeeded') {
      // Log failed payment
      securityAudit.logEvent(
        'payment_attempt',
        'medium',
        'Subscription upgrade payment failed',
        {
          userId,
          newPlan,
          amount,
          paymentId: paymentIntent.id,
          paymentStatus: paymentIntent.status
        },
        userId,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        {
          error: 'Payment failed',
          paymentStatus: paymentIntent.status,
          paymentId: paymentIntent.id
        },
        { status: 402 }
      )
    }

    // Update subscription in database
    const upgradeResult = await subscriptionService.upgradeSubscription(
      currentSubscription._id!,
      newPlan,
      amount,
      paymentMethodId || paymentIntent.id
    )

    if (!upgradeResult.success) {
      return NextResponse.json(
        { error: upgradeResult.error || 'Failed to upgrade subscription' },
        { status: 400 }
      )
    }

    // Log successful upgrade
    securityAudit.logEvent(
      'plan_upgrade',
      'low',
      'Subscription upgraded successfully',
      {
        userId,
        fromPlan: currentSubscription.plan,
        toPlan: newPlan,
        amount,
        currency: 'KES',
        paymentId: paymentIntent.id,
        isAnnual
      },
      userId,
      clientIP,
      userAgent
    )

    console.log(`Subscription upgrade completed:`, {
      userId,
      fromPlan: currentSubscription.plan,
      toPlan: newPlan,
      amount,
      currency: 'KES',
      paymentId: paymentIntent.id,
      timestamp: new Date().toISOString(),
      ip: clientIP,
      userAgent
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription upgraded successfully',
      newPlan,
      paymentId: paymentIntent.id,
      amount,
      currency: 'KES',
      paymentRequired: true,
      paymentVerified: true
    })

  } catch (error) {
    console.error('Subscription upgrade error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to get upgrade pricing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const plan = searchParams.get('plan') as SubscriptionPlan
  const isAnnual = searchParams.get('annual') === 'true'

  if (!plan || !SUBSCRIPTION_PLANS[plan]) {
    return NextResponse.json(
      { error: 'Invalid plan' },
      { status: 400 }
    )
  }

  const planDetails = SUBSCRIPTION_PLANS[plan]
  const price = getPlanPrice(plan, isAnnual)

  return NextResponse.json({
    plan,
    planDetails,
    price,
    currency: 'KES',
    isAnnual,
    formattedPrice: new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price)
  })
}
