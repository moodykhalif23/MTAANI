"use client"

import { useState } from "react"
import { CreditCard, Download, Calendar, Settings, Clock, AlertTriangle, XCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import { SubscriptionManager } from "@/components/subscription-manager"
import { useSubscription } from "@/hooks/use-subscription"
import Link from "next/link"

export default function SubscriptionSettingsPage() {
  const {
    businessProfile,
    isLoading,
    planDetails,
    subscription,
    currentPlan,
    isOnTrial,
    trialDaysLeft,
    cancelSubscription,
    reactivateSubscription,
  } = useSubscription()

  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false)

  const handleCancelSubscription = async () => {
    setIsProcessingSubscription(true)
    try {
      await cancelSubscription()
    } finally {
      setIsProcessingSubscription(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setIsProcessingSubscription(true)
    try {
      await reactivateSubscription()
    } finally {
      setIsProcessingSubscription(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <AuthHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <AuthHeader />

      {/* Header */}
      <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[#0A558C]">Subscription Settings</h1>
                {subscription && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={subscription.status === "active" ? "default" :
                               subscription.status === "trialing" ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {subscription.status.toUpperCase()}
                    </Badge>
                    {subscription.cancelAtPeriodEnd && (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        CANCELLING
                      </Badge>
                    )}
                    {isOnTrial && (
                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                        <Clock className="h-3 w-3 mr-1" />
                        TRIAL
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <p className="text-gray-600">Manage your subscription, billing, and plan features</p>
            </div>
            <Link href="/pricing">
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Trial Status Alert */}
        {isOnTrial && trialDaysLeft > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4" />
            <AlertTitle className="text-orange-800">Trial Active - {trialDaysLeft} Days Remaining</AlertTitle>
            <AlertDescription className="text-orange-700">
              You have {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in your {currentPlan} trial.
              <Link href="/pricing" className="font-medium underline ml-1">
                Upgrade now
              </Link> to continue using premium features after your trial ends.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Subscription */}
            <SubscriptionManager showUpgradePrompts={false} />

            {/* Subscription Management */}
            {subscription && currentPlan !== "starter" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Subscription Management
                  </CardTitle>
                  <CardDescription>
                    Manage your subscription status and billing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscription.cancelAtPeriodEnd ? (
                    <div className="space-y-4">
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-orange-800">Subscription Cancelling</AlertTitle>
                        <AlertDescription className="text-orange-700">
                          Your subscription will end on {subscription.currentPeriodEnd.toLocaleDateString()}.
                          You&apos;ll lose access to premium features after this date.
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={handleReactivateSubscription}
                        disabled={isProcessingSubscription}
                        className="w-full"
                      >
                        {isProcessingSubscription ? (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                            Reactivating...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reactivate Subscription
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-2">Cancel Subscription</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          You can cancel your subscription at any time. You&apos;ll continue to have access
                          to premium features until the end of your current billing period.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={handleCancelSubscription}
                          disabled={isProcessingSubscription}
                          className="w-full"
                        >
                          {isProcessingSubscription ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Subscription
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Billing History
                </CardTitle>
                <CardDescription>
                  View and download your past invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock billing history */}
                  {[
                    { date: "2024-01-01", amount: "$29.00", status: "Paid", plan: "Professional" },
                    { date: "2023-12-01", amount: "$29.00", status: "Paid", plan: "Professional" },
                    { date: "2023-11-01", amount: "$29.00", status: "Paid", plan: "Professional" },
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.plan} Plan</p>
                          <p className="text-sm text-gray-600">{invoice.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{invoice.amount}</p>
                          <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Manage your payment information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-gray-600">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="outline">
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/pricing">
                  <Button className="w-full justify-start" variant="outline">
                    Compare Plans
                  </Button>
                </Link>
                <Link href="/business/dashboard">
                  <Button className="w-full justify-start" variant="outline">
                    View Dashboard
                  </Button>
                </Link>
                <Button className="w-full justify-start" variant="outline">
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            {/* Usage Summary */}
            {businessProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>Usage Summary</CardTitle>
                  <CardDescription>Current period usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Business Photos</span>
                    <span className="text-sm font-medium">
                      {businessProfile.usage.photosUsed} / {
                        planDetails.features.businessPhotos === "unlimited"
                          ? "∞"
                          : planDetails.features.businessPhotos
                      }
                    </span>
                  </div>

                  {planDetails.features.digitalMenu && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Menu Items</span>
                      <span className="text-sm font-medium">{businessProfile.usage.menuItemsCount}</span>
                    </div>
                  )}

                  {planDetails.features.appointmentBooking && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Appointments</span>
                      <span className="text-sm font-medium">{businessProfile.usage.appointmentsThisMonth}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Have questions about your subscription or need assistance?
                </p>
                <Button className="w-full" variant="outline">
                  Contact Support
                </Button>
                <Button className="w-full" variant="outline">
                  View Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
