import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/services/subscription-service'
import { securityAudit } from '@/lib/security-audit'

interface UsageUpdateRequest {
  userId: string
  businessId?: string
  feature: 'photos' | 'apiCalls' | 'menuItems' | 'appointments' | 'storage'
  increment: number
  securityToken: string
}





// GET endpoint to retrieve usage data
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
    const expectedToken = process.env.SECURITY_VALIDATION_TOKEN || 'dev_token_123'
    if (securityToken !== expectedToken) {
      console.warn(`Invalid security token for usage request: ${userId}`)
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
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Calculate remaining usage
    const remaining = {
      photos: subscription.limits.photos === Infinity ? Infinity : Math.max(0, subscription.limits.photos - subscription.usage.photosUsed),
      apiCalls: subscription.limits.apiCalls === Infinity ? Infinity : Math.max(0, subscription.limits.apiCalls - subscription.usage.apiCallsUsed),
      menuItems: subscription.limits.menuItems === Infinity ? Infinity : Math.max(0, subscription.limits.menuItems - subscription.usage.menuItemsUsed),
      appointments: subscription.limits.appointments === Infinity ? Infinity : Math.max(0, subscription.limits.appointments - subscription.usage.appointmentsUsed),
      storage: subscription.limits.storage === Infinity ? Infinity : Math.max(0, subscription.limits.storage - subscription.usage.storageUsed)
    }

    return NextResponse.json({
      usage: subscription.usage,
      limits: subscription.limits,
      remaining,
      plan: subscription.plan,
      status: subscription.status,
      lastUpdated: subscription.usage.lastResetDate
    })

  } catch (error) {
    console.error('Get usage data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to update usage
export async function POST(request: NextRequest) {
  try {
    const body: UsageUpdateRequest = await request.json()
    const { userId, businessId, feature, increment, securityToken } = body

    // Validate required fields
    if (!userId || !feature || increment === undefined || !securityToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify security token
    const expectedToken = process.env.SECURITY_VALIDATION_TOKEN || 'dev_token_123'
    if (securityToken !== expectedToken) {
      console.warn(`Invalid security token for usage update: ${userId}`)
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
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Update usage using service
    const result = await subscriptionService.updateUsage(subscription._id!, feature, increment)

    if (!result.success) {
      if (!result.withinLimits) {
        // Log usage limit exceeded
        securityAudit.logEvent(
          'usage_limit_exceeded',
          'medium',
          'Usage limit exceeded',
          {
            userId,
            businessId,
            feature,
            increment,
            plan: subscription.plan
          },
          userId,
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json(
          {
            error: 'Usage limit exceeded',
            feature,
            currentUsage: subscription.usage[`${feature}Used` as keyof typeof subscription.usage],
            limit: subscription.limits[feature],
            plan: subscription.plan,
            upgradeRequired: true
          },
          { status: 402 } // Payment Required
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update usage' },
        { status: 400 }
      )
    }

    // Get updated subscription for response
    const updatedSubscription = businessId
      ? await subscriptionService.findSubscriptionByBusinessId(businessId)
      : await subscriptionService.findSubscriptionByUserId(userId)

    const currentUsage = updatedSubscription?.usage[`${feature}Used` as keyof typeof updatedSubscription.usage] || 0
    const limit = updatedSubscription?.limits[feature] || 0

    // Log successful usage update
    console.log(`Usage updated for user ${userId}:`, {
      feature,
      newUsage: currentUsage,
      increment,
      plan: updatedSubscription?.plan,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      feature,
      newUsage: currentUsage,
      limit,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - (currentUsage as number))
    })

  } catch (error) {
    console.error('Usage update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT endpoint to reset usage (for testing or monthly resets)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, securityToken, adminToken } = body

    // Require admin token for usage resets
    if (adminToken !== 'admin_reset_token_456') {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      )
    }

    if (!userId || !securityToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const usage = usageStorage[userId]

    if (!usage) {
      return NextResponse.json(
        { error: 'Usage data not found' },
        { status: 404 }
      )
    }

    // Reset usage counters
    usage.photosUsed = 0
    usage.apiCallsUsed = 0
    usage.menuItemsUsed = 0
    usage.appointmentsUsed = 0
    usage.lastUpdated = new Date().toISOString()

    console.log(`Usage reset for user ${userId} by admin`)

    return NextResponse.json({
      success: true,
      message: 'Usage counters reset',
      userId
    })

  } catch (error) {
    console.error('Usage reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
