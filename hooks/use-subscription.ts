"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  SubscriptionPlan, 
  SubscriptionStatus, 
  UserSubscription, 
  BusinessProfile,
  SUBSCRIPTION_PLANS,
  hasFeature,
  canUploadPhotos,
  getPhotoLimit,
  getPlanPrice,
  isTrialEligible
} from "@/lib/subscription-types"

interface UseSubscriptionReturn {
  // Current subscription state
  subscription: UserSubscription | null
  businessProfile: BusinessProfile | null
  isLoading: boolean
  error: string | null
  
  // Feature checking
  hasFeature: (feature: keyof import("@/lib/subscription-types").SubscriptionFeatures) => boolean
  canUploadPhotos: (currentCount: number) => boolean
  getPhotoLimit: () => number | "unlimited"
  
  // Plan information
  currentPlan: SubscriptionPlan
  planDetails: typeof SUBSCRIPTION_PLANS[SubscriptionPlan]
  isOnTrial: boolean
  trialDaysLeft: number
  
  // Actions
  upgradePlan: (newPlan: SubscriptionPlan, isAnnual?: boolean) => Promise<boolean>
  downgradePlan: (newPlan: SubscriptionPlan) => Promise<boolean>
  cancelSubscription: () => Promise<boolean>
  reactivateSubscription: () => Promise<boolean>
  startTrial: (plan: SubscriptionPlan) => Promise<boolean>
  
  // Billing
  updatePaymentMethod: (paymentMethodId: string) => Promise<boolean>
  getUpcomingInvoice: () => Promise<any>
  getBillingHistory: () => Promise<any[]>
  
  // Usage tracking
  refreshUsage: () => Promise<void>
  checkUsageLimit: (feature: string) => boolean
}

// Mock data for development - replace with actual API calls
const mockSubscription: UserSubscription = {
  id: "sub_123",
  userId: "user_123",
  plan: "starter",
  status: "active",
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  cancelAtPeriodEnd: false,
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockBusinessProfile: BusinessProfile = {
  id: "business_123",
  userId: "user_123",
  businessName: "Sample Business",
  subscription: mockSubscription,
  features: SUBSCRIPTION_PLANS.starter.features,
  usage: {
    photosUsed: 3,
    menuItemsCount: 0,
    appointmentsThisMonth: 0,
    apiCallsThisMonth: 0
  }
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize subscription data
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        setIsLoading(true)
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
        setSubscription(mockSubscription)
        setBusinessProfile(mockBusinessProfile)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subscription")
      } finally {
        setIsLoading(false)
      }
    }

    loadSubscription()
  }, [])

  // Feature checking functions
  const checkHasFeature = useCallback((feature: keyof import("@/lib/subscription-types").SubscriptionFeatures) => {
    if (!subscription) return false
    return hasFeature(subscription.plan, feature)
  }, [subscription])

  const checkCanUploadPhotos = useCallback((currentCount: number) => {
    if (!subscription) return false
    return canUploadPhotos(subscription.plan, currentCount)
  }, [subscription])

  const getPhotoLimitForPlan = useCallback(() => {
    if (!subscription) return 0
    return getPhotoLimit(subscription.plan)
  }, [subscription])

  // Plan information
  const currentPlan = subscription?.plan || "starter"
  const planDetails = SUBSCRIPTION_PLANS[currentPlan]
  
  const isOnTrial = subscription?.trialEnd ? new Date() < subscription.trialEnd : false
  const trialDaysLeft = subscription?.trialEnd 
    ? Math.max(0, Math.ceil((subscription.trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  // Action functions
  const upgradePlan = useCallback(async (newPlan: SubscriptionPlan, isAnnual: boolean = false): Promise<boolean> => {
    try {
      setIsLoading(true)
      // TODO: Implement actual upgrade logic
      console.log(`Upgrading to ${newPlan} (${isAnnual ? 'annual' : 'monthly'})`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update subscription
      if (subscription) {
        const updatedSubscription = {
          ...subscription,
          plan: newPlan,
          updatedAt: new Date()
        }
        setSubscription(updatedSubscription)
        
        // Update business profile features
        if (businessProfile) {
          setBusinessProfile({
            ...businessProfile,
            subscription: updatedSubscription,
            features: SUBSCRIPTION_PLANS[newPlan].features
          })
        }
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upgrade plan")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [subscription, businessProfile])

  const downgradePlan = useCallback(async (newPlan: SubscriptionPlan): Promise<boolean> => {
    try {
      setIsLoading(true)
      // TODO: Implement actual downgrade logic
      console.log(`Downgrading to ${newPlan}`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to downgrade plan")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      // TODO: Implement actual cancellation logic
      console.log("Cancelling subscription")
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (subscription) {
        setSubscription({
          ...subscription,
          cancelAtPeriodEnd: true,
          updatedAt: new Date()
        })
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel subscription")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [subscription])

  const reactivateSubscription = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      // TODO: Implement actual reactivation logic
      console.log("Reactivating subscription")
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (subscription) {
        setSubscription({
          ...subscription,
          cancelAtPeriodEnd: false,
          status: "active",
          updatedAt: new Date()
        })
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate subscription")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [subscription])

  const startTrial = useCallback(async (plan: SubscriptionPlan): Promise<boolean> => {
    try {
      if (!isTrialEligible(plan)) {
        throw new Error("This plan is not eligible for a trial")
      }
      
      setIsLoading(true)
      // TODO: Implement actual trial start logic
      console.log(`Starting trial for ${plan}`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + SUBSCRIPTION_PLANS[plan].trialDays)
      
      const trialSubscription: UserSubscription = {
        id: "trial_" + Date.now(),
        userId: "user_123",
        plan,
        status: "trial",
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnd,
        trialEnd,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setSubscription(trialSubscription)
      
      if (businessProfile) {
        setBusinessProfile({
          ...businessProfile,
          subscription: trialSubscription,
          features: SUBSCRIPTION_PLANS[plan].features
        })
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start trial")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [businessProfile])

  const updatePaymentMethod = useCallback(async (paymentMethodId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      // TODO: Implement payment method update
      console.log(`Updating payment method: ${paymentMethodId}`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment method")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getUpcomingInvoice = useCallback(async () => {
    // TODO: Implement upcoming invoice retrieval
    return null
  }, [])

  const getBillingHistory = useCallback(async () => {
    // TODO: Implement billing history retrieval
    return []
  }, [])

  const refreshUsage = useCallback(async () => {
    try {
      // TODO: Implement usage refresh
      console.log("Refreshing usage data")
    } catch (err) {
      console.error("Failed to refresh usage:", err)
    }
  }, [])

  const checkUsageLimit = useCallback((feature: string): boolean => {
    if (!businessProfile) return false
    
    // TODO: Implement usage limit checking based on feature
    switch (feature) {
      case "photos":
        const photoLimit = getPhotoLimit(currentPlan)
        return photoLimit === "unlimited" || businessProfile.usage.photosUsed < photoLimit
      case "menuItems":
        return true // No limit for now
      case "appointments":
        return true // No limit for now
      case "apiCalls":
        return currentPlan !== "starter" // API access only for paid plans
      default:
        return true
    }
  }, [businessProfile, currentPlan])

  return {
    subscription,
    businessProfile,
    isLoading,
    error,
    hasFeature: checkHasFeature,
    canUploadPhotos: checkCanUploadPhotos,
    getPhotoLimit: getPhotoLimitForPlan,
    currentPlan,
    planDetails,
    isOnTrial,
    trialDaysLeft,
    upgradePlan,
    downgradePlan,
    cancelSubscription,
    reactivateSubscription,
    startTrial,
    updatePaymentMethod,
    getUpcomingInvoice,
    getBillingHistory,
    refreshUsage,
    checkUsageLimit
  }
}
