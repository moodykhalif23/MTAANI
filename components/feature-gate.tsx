"use client"

import { ReactNode, useState, useEffect } from "react"
import { Lock, Crown, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSubscription } from "@/hooks/use-subscription"
import { SubscriptionPlan } from "@/lib/subscription-types"
import Link from "next/link"

interface FeatureGateProps {
  children: ReactNode
  feature: keyof import("@/lib/subscription-types").SubscriptionFeatures
  requiredPlan?: SubscriptionPlan
  fallback?: ReactNode
  showUpgrade?: boolean
  upgradeTitle?: string
  upgradeDescription?: string
  className?: string
}

export function FeatureGate({
  children,
  feature,
  requiredPlan,
  fallback,
  showUpgrade = true,
  upgradeTitle,
  upgradeDescription,
  className
}: FeatureGateProps) {
  const { hasFeatureSync, currentPlan, isOnTrial, trialDaysLeft } = useSubscription()
  const [serverValidated, setServerValidated] = useState<boolean | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Use sync version for immediate UI response, then validate with server
  const hasAccess = hasFeatureSync(feature)

  // Perform server-side validation on mount and when feature changes
  useEffect(() => {
    let isMounted = true

    const validateWithServer = async () => {
      setIsValidating(true)
      try {
        const { hasFeature } = useSubscription()
        const serverResult = await hasFeature(feature)

        if (isMounted) {
          setServerValidated(serverResult)

          // If server validation differs from client, log security warning
          if (serverResult !== hasAccess) {
            console.warn('Client-server validation mismatch:', {
              feature,
              clientResult: hasAccess,
              serverResult,
              currentPlan,
              timestamp: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.error('Server validation failed:', error)
        if (isMounted) {
          setServerValidated(hasAccess) // Fallback to client validation
        }
      } finally {
        if (isMounted) {
          setIsValidating(false)
        }
      }
    }

    validateWithServer()

    return () => {
      isMounted = false
    }
  }, [feature, hasAccess, currentPlan])

  // Use server validation result if available, otherwise fall back to client
  const finalHasAccess = serverValidated !== null ? serverValidated : hasAccess

  // If user has access, render children
  if (finalHasAccess) {
    return <>{children}</>
  }

  // Show loading state during server validation
  if (isValidating && serverValidated === null) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  // If showUpgrade is false, render nothing
  if (!showUpgrade) {
    return null
  }

  // Determine required plan if not specified
  const getRequiredPlan = (): SubscriptionPlan => {
    if (requiredPlan) return requiredPlan

    // Basic feature mapping
    const enterpriseFeatures = ['loyaltyPrograms', 'customBranding', 'apiAccess', 'multiLocation', 'dedicatedSupport']
    const professionalFeatures = ['analyticsBasic', 'digitalMenu', 'appointmentBooking', 'reviewManagement']

    if (enterpriseFeatures.includes(feature)) return 'enterprise'
    if (professionalFeatures.includes(feature)) return 'professional'

    return 'professional' // Default to professional for most features
  }

  const targetPlan = getRequiredPlan()
  const planName = targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)

  const getIcon = () => {
    switch (targetPlan) {
      case 'enterprise': return Crown
      case 'professional': return Zap
      default: return Lock
    }
  }

  const getColor = () => {
    switch (targetPlan) {
      case 'enterprise': return 'from-purple-500 to-purple-600'
      case 'professional': return 'from-blue-500 to-blue-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const IconComponent = getIcon()

  return (
    <div className={className}>
      <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50">
        <CardHeader className="text-center">
          <div className={`w-16 h-16 bg-gradient-to-br ${getColor()} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl">
            {upgradeTitle || `${planName} Feature`}
          </CardTitle>
          <CardDescription>
            {upgradeDescription || `This feature requires a ${planName} subscription or higher.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {/* Trial notification */}
          {isOnTrial && (
            <Alert className="border-blue-200 bg-blue-50">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                You have {trialDaysLeft} days left in your trial. Upgrade to keep access to this feature.
              </AlertDescription>
            </Alert>
          )}

          {/* Feature benefits */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">What you'll get:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {targetPlan === 'professional' && (
                <>
                  <li>• Advanced analytics dashboard</li>
                  <li>• Digital menu management</li>
                  <li>• Appointment booking system</li>
                  <li>• Review management tools</li>
                </>
              )}
              {targetPlan === 'enterprise' && (
                <>
                  <li>• Everything in Professional</li>
                  <li>• Loyalty programs</li>
                  <li>• Custom branding options</li>
                  <li>• API access</li>
                  <li>• Dedicated support</li>
                </>
              )}
            </ul>
          </div>

          {/* Upgrade buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/pricing">
                Upgrade to {planName}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">
                View All Plans
              </Link>
            </Button>
          </div>

          {/* Current plan badge */}
          <div className="pt-4 border-t">
            <Badge variant="outline" className="text-xs">
              Current: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific feature gates for common use cases
export function AnalyticsGate({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <FeatureGate
      feature="analyticsBasic"
      requiredPlan="professional"
      upgradeTitle="Analytics Dashboard"
      upgradeDescription="Get insights into your business performance with detailed analytics."
      className={className}
    >
      {children}
    </FeatureGate>
  )
}

export function MenuManagementGate({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <FeatureGate
      feature="digitalMenu"
      requiredPlan="professional"
      upgradeTitle="Digital Menu Management"
      upgradeDescription="Create and manage your digital menu with real-time updates."
      className={className}
    >
      {children}
    </FeatureGate>
  )
}

export function AppointmentBookingGate({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <FeatureGate
      feature="appointmentBooking"
      requiredPlan="professional"
      upgradeTitle="Appointment Booking"
      upgradeDescription="Let customers book appointments directly through your listing."
      className={className}
    >
      {children}
    </FeatureGate>
  )
}

export function LoyaltyProgramsGate({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <FeatureGate
      feature="loyaltyPrograms"
      requiredPlan="enterprise"
      upgradeTitle="Loyalty Programs"
      upgradeDescription="Create and manage customer loyalty programs to increase retention."
      className={className}
    >
      {children}
    </FeatureGate>
  )
}

export function APIAccessGate({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <FeatureGate
      feature="apiAccess"
      requiredPlan="enterprise"
      upgradeTitle="API Access"
      upgradeDescription="Integrate with your existing systems using our comprehensive API."
      className={className}
    >
      {children}
    </FeatureGate>
  )
}

// Usage limit gate for features with quotas
interface UsageLimitGateProps {
  children: ReactNode
  feature: string
  currentUsage: number
  limit: number | "unlimited"
  featureName: string
  className?: string
}

export function UsageLimitGate({
  children,
  feature,
  currentUsage,
  limit,
  featureName,
  className
}: UsageLimitGateProps) {
  const { checkUsageLimit } = useSubscription()

  const hasUsageLeft = checkUsageLimit(feature)

  if (hasUsageLeft) {
    return <>{children}</>
  }

  return (
    <div className={className}>
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl text-yellow-900">
            {featureName} Limit Reached
          </CardTitle>
          <CardDescription className="text-yellow-800">
            You've used {currentUsage} of {limit === "unlimited" ? "unlimited" : limit} {featureName.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/pricing">
              Upgrade for More {featureName}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
