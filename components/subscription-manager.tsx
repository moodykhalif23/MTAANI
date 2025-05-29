"use client"

import { useState } from "react"
import { Crown, CreditCard, Calendar, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSubscription } from "@/hooks/use-subscription"
import Link from "next/link"

interface SubscriptionManagerProps {
  showUpgradePrompts?: boolean
  compact?: boolean
}

export function SubscriptionManager({ showUpgradePrompts = true, compact = false }: SubscriptionManagerProps) {
  const {
    subscription,
    businessProfile,
    isLoading,
    currentPlan,
    planDetails,
    isOnTrial,
    trialDaysLeft,
    cancelSubscription,
    reactivateSubscription
  } = useSubscription()

  const [isProcessing, setIsProcessing] = useState(false)

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            No Subscription Found
          </CardTitle>
          <CardDescription className="text-red-600">
            Please contact support or start a new subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/pricing">View Plans</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleCancelSubscription = async () => {
    setIsProcessing(true)
    try {
      await cancelSubscription()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setIsProcessing(true)
    try {
      await reactivateSubscription()
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = () => {
    switch (subscription.status) {
      case "active": return "bg-green-500"
      case "trial": return "bg-blue-500"
      case "cancelled": return "bg-red-500"
      case "past_due": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = () => {
    if (isOnTrial) return `Trial (${trialDaysLeft} days left)`
    if (subscription.cancelAtPeriodEnd) return "Cancelled (active until period end)"
    return subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)
  }

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
              <div>
                <p className="font-medium">{planDetails.name} Plan</p>
                <p className="text-sm text-gray-600">{getStatusText()}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing">Manage</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                currentPlan === "enterprise" ? "from-purple-500 to-purple-600" :
                currentPlan === "professional" ? "from-blue-500 to-blue-600" :
                "from-gray-500 to-gray-600"
              } flex items-center justify-center`}>
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{planDetails.name} Plan</CardTitle>
                <CardDescription>{planDetails.description}</CardDescription>
              </div>
            </div>
            <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
              {getStatusText()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trial Alert */}
          {isOnTrial && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Your trial expires in {trialDaysLeft} days.
                <Link href="/pricing" className="ml-1 underline font-medium">
                  Upgrade now to continue using premium features.
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Cancellation Alert */}
          {subscription.cancelAtPeriodEnd && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Your subscription will end on {subscription.currentPeriodEnd.toLocaleDateString()}.
                <Button
                  variant="link"
                  className="ml-1 p-0 h-auto text-red-800 underline"
                  onClick={handleReactivateSubscription}
                  disabled={isProcessing}
                >
                  Reactivate subscription
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Billing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Current Period</p>
              <p className="text-sm text-gray-600">
                {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Next Billing</p>
              <p className="text-sm text-gray-600">
                {subscription.cancelAtPeriodEnd ? "No upcoming billing" : subscription.currentPeriodEnd.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Usage Information */}
          {businessProfile && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Usage This Period</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Business Photos</span>
                    <span>
                      {businessProfile.usage.photosUsed} / {
                        planDetails.features.businessPhotos === "unlimited"
                          ? "∞"
                          : planDetails.features.businessPhotos
                      }
                    </span>
                  </div>
                  {typeof planDetails.features.businessPhotos === "number" && (
                    <Progress
                      value={(businessProfile.usage.photosUsed / planDetails.features.businessPhotos) * 100}
                      className="h-2"
                    />
                  )}
                </div>

                {planDetails.features.digitalMenu && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Menu Items</span>
                      <span>{businessProfile.usage.menuItemsCount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link href="/pricing">
                <CreditCard className="h-4 w-4 mr-2" />
                Change Plan
              </Link>
            </Button>

            {currentPlan !== "starter" && !subscription.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            )}

            <Button variant="outline" asChild>
              <Link href="/business/dashboard">
                <Calendar className="h-4 w-4 mr-2" />
                View Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Prompts */}
      {showUpgradePrompts && currentPlan === "starter" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Unlock More Features
            </CardTitle>
            <CardDescription className="text-blue-700">
              Upgrade to Professional to access analytics, menu management, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <h5 className="font-medium text-blue-900">Professional Features:</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Analytics Dashboard</li>
                  <li>• Digital Menu Management</li>
                  <li>• Appointment Booking</li>
                  <li>• Review Management</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-blue-900">Enterprise Features:</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Loyalty Programs</li>
                  <li>• Custom Branding</li>
                  <li>• API Access</li>
                  <li>• Dedicated Support</li>
                </ul>
              </div>
            </div>
            <Button asChild>
              <Link href="/pricing">
                Upgrade Now
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
