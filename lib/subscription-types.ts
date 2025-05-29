export type SubscriptionPlan = "starter" | "professional" | "enterprise"

export type SubscriptionStatus = "active" | "inactive" | "trialing" | "cancelled" | "past_due"

export interface SubscriptionFeatures {
  // Basic Features
  basicListing: boolean
  contactInfo: boolean
  businessPhotos: number | "unlimited"
  customerReviews: "view_only" | "manage" | "advanced"

  // Professional Features
  analyticsBasic: boolean
  analyticsAdvanced: boolean
  digitalMenu: boolean
  appointmentBooking: boolean
  socialMediaIntegration: boolean
  emailNotifications: boolean
  reviewManagement: boolean
  priorityListing: boolean

  // Enterprise Features
  loyaltyPrograms: boolean
  customBranding: boolean
  apiAccess: boolean
  multiLocation: boolean
  dedicatedSupport: boolean
  customFeatures: boolean
  advancedMarketing: boolean

  // Support Level
  supportLevel: "community" | "priority" | "dedicated"
}

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan
  name: string
  description: string
  price: {
    monthly: number
    annual: number
  }
  features: SubscriptionFeatures
  limitations: string[]
  recommended: boolean
  trialDays: number
}

export interface UserSubscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEnd?: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BusinessProfile {
  id: string
  userId: string
  businessName: string
  subscription: UserSubscription
  features: SubscriptionFeatures
  usage: {
    photosUsed: number
    menuItemsCount: number
    appointmentsThisMonth: number
    apiCallsThisMonth: number
  }
}

// Subscription Plan Configurations
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanDetails> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for small businesses getting started",
    price: {
      monthly: 0,
      annual: 0
    },
    features: {
      basicListing: true,
      contactInfo: true,
      businessPhotos: 5,
      customerReviews: "view_only",
      analyticsBasic: false,
      analyticsAdvanced: false,
      digitalMenu: false,
      appointmentBooking: false,
      socialMediaIntegration: false,
      emailNotifications: false,
      reviewManagement: false,
      priorityListing: false,
      loyaltyPrograms: false,
      customBranding: false,
      apiAccess: false,
      multiLocation: false,
      dedicatedSupport: false,
      customFeatures: false,
      advancedMarketing: false,
      supportLevel: "community"
    },
    limitations: [
      "Limited to 5 business photos",
      "Cannot respond to reviews",
      "No analytics dashboard",
      "No appointment booking",
      "Community support only"
    ],
    recommended: false,
    trialDays: 0
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "Ideal for growing businesses that want more features",
    price: {
      monthly: 3900, // KES 3,900 (~$29 USD)
      annual: 39000  // KES 39,000 (~$290 USD) - 2 months free
    },
    features: {
      basicListing: true,
      contactInfo: true,
      businessPhotos: "unlimited",
      customerReviews: "manage",
      analyticsBasic: true,
      analyticsAdvanced: false,
      digitalMenu: true,
      appointmentBooking: true,
      socialMediaIntegration: true,
      emailNotifications: true,
      reviewManagement: true,
      priorityListing: true,
      loyaltyPrograms: false,
      customBranding: false,
      apiAccess: false,
      multiLocation: false,
      dedicatedSupport: false,
      customFeatures: false,
      advancedMarketing: false,
      supportLevel: "priority"
    },
    limitations: [],
    recommended: true,
    trialDays: 14
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For established businesses needing advanced tools",
    price: {
      monthly: 13300, // KES 13,300 (~$99 USD)
      annual: 133000  // KES 133,000 (~$990 USD) - 2 months free
    },
    features: {
      basicListing: true,
      contactInfo: true,
      businessPhotos: "unlimited",
      customerReviews: "advanced",
      analyticsBasic: true,
      analyticsAdvanced: true,
      digitalMenu: true,
      appointmentBooking: true,
      socialMediaIntegration: true,
      emailNotifications: true,
      reviewManagement: true,
      priorityListing: true,
      loyaltyPrograms: true,
      customBranding: true,
      apiAccess: true,
      multiLocation: true,
      dedicatedSupport: true,
      customFeatures: true,
      advancedMarketing: true,
      supportLevel: "dedicated"
    },
    limitations: [],
    recommended: false,
    trialDays: 14
  }
}

// Feature checking utilities
export function hasFeature(plan: SubscriptionPlan, feature: keyof SubscriptionFeatures): boolean {
  const planDetails = SUBSCRIPTION_PLANS[plan]
  const featureValue = planDetails.features[feature]

  if (typeof featureValue === 'boolean') {
    return featureValue
  }

  if (typeof featureValue === 'number') {
    return featureValue > 0
  }

  if (typeof featureValue === 'string') {
    return featureValue !== 'view_only' && featureValue !== 'community'
  }

  return false
}

export function canUploadPhotos(plan: SubscriptionPlan, currentCount: number): boolean {
  const planDetails = SUBSCRIPTION_PLANS[plan]
  const photoLimit = planDetails.features.businessPhotos

  if (photoLimit === "unlimited") return true
  if (typeof photoLimit === 'number') return currentCount < photoLimit

  return false
}

export function getPhotoLimit(plan: SubscriptionPlan): number | "unlimited" {
  return SUBSCRIPTION_PLANS[plan].features.businessPhotos
}

export function getPlanPrice(plan: SubscriptionPlan, isAnnual: boolean = false): number {
  const planDetails = SUBSCRIPTION_PLANS[plan]
  return isAnnual ? planDetails.price.annual : planDetails.price.monthly
}

// Security and validation interfaces
export interface SubscriptionValidationResult {
  isValid: boolean
  hasAccess: boolean
  reason?: string
  expiresAt?: Date
}

export interface PaymentVerification {
  paymentId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  verifiedAt?: Date
  provider: 'mpesa' | 'card' | 'bank_transfer'
}

export interface SubscriptionSecurityCheck {
  userId: string
  plan: SubscriptionPlan
  feature: keyof SubscriptionFeatures
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

// Enhanced subscription interface with security fields
export interface SecureUserSubscription extends UserSubscription {
  paymentVerification?: PaymentVerification
  lastSecurityCheck?: Date
  accessToken?: string // Server-generated token for API access
  usageQuota: {
    photosUsed: number
    apiCallsUsed: number
    menuItemsUsed: number
    appointmentsUsed: number
  }
  securityFlags: {
    requiresPaymentVerification: boolean
    suspiciousActivity: boolean
    manualReview: boolean
  }
}

// Utility functions for security
export function formatKenyaShillings(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function validateSubscriptionAccess(
  subscription: UserSubscription | null,
  feature: keyof SubscriptionFeatures
): SubscriptionValidationResult {
  if (!subscription) {
    return {
      isValid: false,
      hasAccess: false,
      reason: 'No active subscription found'
    }
  }

  // Check if subscription is active
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return {
      isValid: false,
      hasAccess: false,
      reason: 'Subscription is not active',
      expiresAt: subscription.currentPeriodEnd
    }
  }

  // Check if subscription has expired
  if (new Date() > subscription.currentPeriodEnd) {
    return {
      isValid: false,
      hasAccess: false,
      reason: 'Subscription has expired',
      expiresAt: subscription.currentPeriodEnd
    }
  }

  // Check if trial has expired
  if (subscription.trialEnd && new Date() > subscription.trialEnd && subscription.status === 'trialing') {
    return {
      isValid: false,
      hasAccess: false,
      reason: 'Trial period has expired',
      expiresAt: subscription.trialEnd
    }
  }

  // Check if plan has the required feature
  const hasFeatureAccess = hasFeature(subscription.plan, feature)

  return {
    isValid: true,
    hasAccess: hasFeatureAccess,
    reason: hasFeatureAccess ? undefined : `Feature not available in ${subscription.plan} plan`,
    expiresAt: subscription.currentPeriodEnd
  }
}

export function getAnnualSavings(plan: SubscriptionPlan): number {
  const planDetails = SUBSCRIPTION_PLANS[plan]
  const monthlyCost = planDetails.price.monthly * 12
  const annualCost = planDetails.price.annual
  return Math.max(0, monthlyCost - annualCost)
}

export function isTrialEligible(plan: SubscriptionPlan): boolean {
  return SUBSCRIPTION_PLANS[plan].trialDays > 0
}

export function getTrialDays(plan: SubscriptionPlan): number {
  return SUBSCRIPTION_PLANS[plan].trialDays
}
