import { couchdb } from '../couchdb'
import { SubscriptionDocument } from '../models'
import { securityAudit } from '../security-audit'
import { SubscriptionPlan } from '../subscription-types'

export class SubscriptionService {
  private readonly dbName = 'mtaani'

  // Create a new subscription
  async createSubscription(subscriptionData: {
    userId: string
    businessId?: string
    plan: SubscriptionPlan
    billingInterval: 'monthly' | 'annual'
    amount: number
    currency: string
    paymentMethodId?: string
    isTrialing?: boolean
    trialDays?: number
  }): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      const now = new Date()
      const trialEnd = subscriptionData.isTrialing
        ? new Date(now.getTime() + (subscriptionData.trialDays || 14) * 24 * 60 * 60 * 1000)
        : undefined

      // Create subscription document
      const subscriptionDoc: Omit<SubscriptionDocument, '_id' | '_rev' | 'createdAt' | 'updatedAt'> = {
        type: 'subscription',
        userId: subscriptionData.userId,
        businessId: subscriptionData.businessId,
        plan: subscriptionData.plan,
        status: subscriptionData.isTrialing ? 'trialing' : 'active',
        billing: {
          interval: subscriptionData.billingInterval,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency,
          nextBillingDate: trialEnd ? trialEnd.toISOString() : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          paymentMethodId: subscriptionData.paymentMethodId
        },
        trial: {
          isTrialing: subscriptionData.isTrialing || false,
          trialStart: subscriptionData.isTrialing ? now.toISOString() : undefined,
          trialEnd: trialEnd?.toISOString(),
          trialDays: subscriptionData.trialDays || 0
        },
        usage: {
          photosUsed: 0,
          apiCallsUsed: 0,
          menuItemsUsed: 0,
          appointmentsUsed: 0,
          storageUsed: 0,
          lastResetDate: now.toISOString()
        },
        limits: this.getPlanLimits(subscriptionData.plan),
        version: 1,
        isDeleted: false
      }

      const response = await couchdb.createDocument(this.dbName, subscriptionDoc)

      if (response.ok) {
        // Log subscription creation
        securityAudit.logEvent(
          'subscription_access',
          'low',
          'Subscription created',
          {
            plan: subscriptionData.plan,
            userId: subscriptionData.userId,
            businessId: subscriptionData.businessId,
            isTrialing: subscriptionData.isTrialing
          },
          subscriptionData.userId
        )

        return { success: true, subscriptionId: response.id }
      }

      return { success: false, error: 'Failed to create subscription' }
    } catch (error) {
      console.error('Subscription creation error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Find subscription by user ID
  async findSubscriptionByUserId(userId: string): Promise<SubscriptionDocument | null> {
    try {
      const result = await couchdb.find<SubscriptionDocument>(this.dbName, {
        type: 'subscription',
        userId,
        isDeleted: false
      }, {
        limit: 1,
        sort: [{ createdAt: 'desc' }]
      })

      return result.docs.length > 0 ? result.docs[0] : null
    } catch (error) {
      console.error('Find subscription by user ID error:', error)
      return null
    }
  }

  // Find subscription by business ID
  async findSubscriptionByBusinessId(businessId: string): Promise<SubscriptionDocument | null> {
    try {
      const result = await couchdb.find<SubscriptionDocument>(this.dbName, {
        type: 'subscription',
        businessId,
        isDeleted: false
      }, {
        limit: 1,
        sort: [{ createdAt: 'desc' }]
      })

      return result.docs.length > 0 ? result.docs[0] : null
    } catch (error) {
      console.error('Find subscription by business ID error:', error)
      return null
    }
  }

  // Update subscription usage
  async updateUsage(
    subscriptionId: string,
    feature: 'photos' | 'apiCalls' | 'menuItems' | 'appointments' | 'storage',
    increment: number
  ): Promise<{ success: boolean; withinLimits: boolean; error?: string }> {
    try {
      const subscription = await couchdb.getDocument<SubscriptionDocument>(this.dbName, subscriptionId)

      if (!subscription || subscription.isDeleted) {
        return { success: false, withinLimits: false, error: 'Subscription not found' }
      }

      // Calculate new usage
      const currentUsage = subscription.usage[`${feature}Used` as keyof typeof subscription.usage] as number
      const newUsage = currentUsage + increment
      const limit = subscription.limits[feature]

      // Check if within limits
      const withinLimits = limit === Infinity || newUsage <= limit

      if (!withinLimits) {
        return { success: false, withinLimits: false, error: 'Usage limit exceeded' }
      }

      // Update usage
      const updatedSubscription: SubscriptionDocument = {
        ...subscription,
        usage: {
          ...subscription.usage,
          [`${feature}Used`]: newUsage
        },
        version: subscription.version + 1
      }

      const response = await couchdb.updateDocument(this.dbName, updatedSubscription)

      return { success: response.ok, withinLimits: true }
    } catch (error) {
      console.error('Update usage error:', error)
      return { success: false, withinLimits: false, error: 'Internal server error' }
    }
  }

  // Upgrade subscription plan
  async upgradeSubscription(
    subscriptionId: string,
    newPlan: SubscriptionPlan,
    newAmount: number,
    paymentMethodId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await couchdb.getDocument<SubscriptionDocument>(this.dbName, subscriptionId)

      if (!subscription || subscription.isDeleted) {
        return { success: false, error: 'Subscription not found' }
      }

      const updatedSubscription: SubscriptionDocument = {
        ...subscription,
        plan: newPlan,
        limits: this.getPlanLimits(newPlan),
        billing: {
          ...subscription.billing,
          amount: newAmount,
          paymentMethodId: paymentMethodId || subscription.billing.paymentMethodId
        },
        version: subscription.version + 1
      }

      const response = await couchdb.updateDocument(this.dbName, updatedSubscription)

      if (response.ok) {
        securityAudit.logEvent(
          'plan_upgrade',
          'low',
          'Subscription plan upgraded',
          {
            subscriptionId,
            oldPlan: subscription.plan,
            newPlan,
            userId: subscription.userId
          },
          subscription.userId
        )
      }

      return { success: response.ok }
    } catch (error) {
      console.error('Upgrade subscription error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Cancel subscription
  async cancelSubscription(
    subscriptionId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await couchdb.getDocument<SubscriptionDocument>(this.dbName, subscriptionId)

      if (!subscription || subscription.isDeleted) {
        return { success: false, error: 'Subscription not found' }
      }

      const updatedSubscription: SubscriptionDocument = {
        ...subscription,
        status: 'cancelled',
        version: subscription.version + 1
      }

      const response = await couchdb.updateDocument(this.dbName, updatedSubscription)

      if (response.ok) {
        securityAudit.logEvent(
          'subscription_access',
          'medium',
          'Subscription cancelled',
          {
            subscriptionId,
            plan: subscription.plan,
            userId: subscription.userId,
            cancelledBy,
            reason
          },
          subscription.userId
        )
      }

      return { success: response.ok }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get plan limits
  private getPlanLimits(plan: SubscriptionPlan) {
    const limits = {
      starter: {
        photos: 5,
        apiCalls: 0,
        menuItems: 0,
        appointments: 0,
        storage: 100 * 1024 * 1024 // 100MB
      },
      professional: {
        photos: Infinity,
        apiCalls: 0,
        menuItems: Infinity,
        appointments: Infinity,
        storage: 1024 * 1024 * 1024 // 1GB
      },
      enterprise: {
        photos: Infinity,
        apiCalls: 10000,
        menuItems: Infinity,
        appointments: Infinity,
        storage: 10 * 1024 * 1024 * 1024 // 10GB
      }
    }

    return limits[plan]
  }

  // Validate subscription access
  async validateAccess(
    userId: string,
    feature: string,
    businessId?: string
  ): Promise<{
    isValid: boolean
    hasAccess: boolean
    subscription?: SubscriptionDocument
    reason?: string
  }> {
    try {
      // Find subscription by business ID first, then user ID
      let subscription = businessId
        ? await this.findSubscriptionByBusinessId(businessId)
        : await this.findSubscriptionByUserId(userId)

      if (!subscription) {
        // Create default starter subscription for new users
        const createResult = await this.createSubscription({
          userId,
          businessId,
          plan: 'starter',
          billingInterval: 'monthly',
          amount: 0,
          currency: 'KES',
          isTrialing: true,
          trialDays: 14
        })

        if (createResult.success && createResult.subscriptionId) {
          subscription = await couchdb.getDocument<SubscriptionDocument>(this.dbName, createResult.subscriptionId)
        }
      }

      if (!subscription) {
        return {
          isValid: false,
          hasAccess: false,
          reason: 'No subscription found'
        }
      }

      // Check subscription status
      if (subscription.status === 'cancelled' || subscription.status === 'past_due') {
        return {
          isValid: true,
          hasAccess: false,
          subscription,
          reason: `Subscription is ${subscription.status}`
        }
      }

      // Check trial expiration
      if (subscription.trial.isTrialing && subscription.trial.trialEnd) {
        const trialEnd = new Date(subscription.trial.trialEnd)
        if (trialEnd < new Date()) {
          return {
            isValid: true,
            hasAccess: false,
            subscription,
            reason: 'Trial period expired'
          }
        }
      }

      return {
        isValid: true,
        hasAccess: true,
        subscription
      }
    } catch (error) {
      console.error('Validate access error:', error)
      return {
        isValid: false,
        hasAccess: false,
        reason: 'Internal server error'
      }
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService()
