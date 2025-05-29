import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionPlan } from '@/lib/subscription-types'

interface UsageData {
  userId: string
  plan: SubscriptionPlan
  photosUsed: number
  apiCallsUsed: number
  menuItemsUsed: number
  appointmentsUsed: number
  lastUpdated: string
}

interface UsageUpdateRequest {
  userId: string
  feature: 'photos' | 'apiCalls' | 'menuItems' | 'appointments'
  increment: number
  securityToken: string
}

// Mock usage storage - in production, use a database
const usageStorage: Record<string, UsageData> = {
  '1': {
    userId: '1',
    plan: 'professional',
    photosUsed: 3,
    apiCallsUsed: 150,
    menuItemsUsed: 25,
    appointmentsUsed: 12,
    lastUpdated: new Date().toISOString()
  }
}

// Subscription limits based on plan
const USAGE_LIMITS = {
  starter: {
    photos: 5,
    apiCalls: 0, // No API access
    menuItems: 0, // No menu management
    appointments: 0 // No appointment booking
  },
  professional: {
    photos: Infinity, // Unlimited
    apiCalls: 0, // No API access in professional
    menuItems: Infinity, // Unlimited
    appointments: Infinity // Unlimited
  },
  enterprise: {
    photos: Infinity, // Unlimited
    apiCalls: 10000, // 10k API calls per month
    menuItems: Infinity, // Unlimited
    appointments: Infinity // Unlimited
  }
}

function validateUsageLimit(plan: SubscriptionPlan, feature: keyof typeof USAGE_LIMITS.starter, currentUsage: number): boolean {
  const limit = USAGE_LIMITS[plan][feature]
  return currentUsage < limit
}

function getUsageLimit(plan: SubscriptionPlan, feature: keyof typeof USAGE_LIMITS.starter): number {
  return USAGE_LIMITS[plan][feature]
}

// GET endpoint to retrieve usage data
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

  // Verify security token (in production, validate JWT)
  const expectedToken = process.env.SECURITY_VALIDATION_TOKEN || 'dev_token_123'
  if (securityToken !== expectedToken) {
    console.warn(`Invalid security token for usage request: ${userId}`)
    return NextResponse.json(
      { error: 'Invalid security token' },
      { status: 401 }
    )
  }

  const usage = usageStorage[userId]

  if (!usage) {
    return NextResponse.json(
      { error: 'Usage data not found' },
      { status: 404 }
    )
  }

  // Calculate limits for current plan
  const limits = {
    photos: getUsageLimit(usage.plan, 'photos'),
    apiCalls: getUsageLimit(usage.plan, 'apiCalls'),
    menuItems: getUsageLimit(usage.plan, 'menuItems'),
    appointments: getUsageLimit(usage.plan, 'appointments')
  }

  // Calculate remaining usage
  const remaining = {
    photos: limits.photos === Infinity ? Infinity : Math.max(0, limits.photos - usage.photosUsed),
    apiCalls: limits.apiCalls === Infinity ? Infinity : Math.max(0, limits.apiCalls - usage.apiCallsUsed),
    menuItems: limits.menuItems === Infinity ? Infinity : Math.max(0, limits.menuItems - usage.menuItemsUsed),
    appointments: limits.appointments === Infinity ? Infinity : Math.max(0, limits.appointments - usage.appointmentsUsed)
  }

  return NextResponse.json({
    usage: {
      photosUsed: usage.photosUsed,
      apiCallsUsed: usage.apiCallsUsed,
      menuItemsUsed: usage.menuItemsUsed,
      appointmentsUsed: usage.appointmentsUsed
    },
    limits,
    remaining,
    plan: usage.plan,
    lastUpdated: usage.lastUpdated
  })
}

// POST endpoint to update usage
export async function POST(request: NextRequest) {
  try {
    const body: UsageUpdateRequest = await request.json()
    const { userId, feature, increment, securityToken } = body

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

    // Get current usage
    let usage = usageStorage[userId]

    if (!usage) {
      // Create new usage record
      usage = {
        userId,
        plan: 'starter', // Default plan
        photosUsed: 0,
        apiCallsUsed: 0,
        menuItemsUsed: 0,
        appointmentsUsed: 0,
        lastUpdated: new Date().toISOString()
      }
    }

    // Calculate new usage
    const currentUsage = usage[`${feature}Used` as keyof UsageData] as number
    const newUsage = currentUsage + increment

    // Check if the new usage would exceed limits
    if (!validateUsageLimit(usage.plan, feature, newUsage)) {
      const limit = getUsageLimit(usage.plan, feature)
      return NextResponse.json(
        {
          error: 'Usage limit exceeded',
          feature,
          currentUsage,
          limit,
          plan: usage.plan,
          upgradeRequired: true
        },
        { status: 402 } // Payment Required
      )
    }

    // Update usage
    (usage as Record<string, unknown>)[`${feature}Used`] = newUsage
    usage.lastUpdated = new Date().toISOString()
    usageStorage[userId] = usage

    // Log usage update for audit
    console.log(`Usage updated for user ${userId}:`, {
      feature,
      oldUsage: currentUsage,
      newUsage,
      increment,
      plan: usage.plan,
      timestamp: new Date().toISOString(),
      ip: request.ip || 'unknown'
    })

    return NextResponse.json({
      success: true,
      feature,
      newUsage,
      limit: getUsageLimit(usage.plan, feature),
      remaining: getUsageLimit(usage.plan, feature) === Infinity
        ? Infinity
        : Math.max(0, getUsageLimit(usage.plan, feature) - newUsage)
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
