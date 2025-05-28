"use client"

import { useState } from "react"
import { CreditCard, Download, Calendar, AlertTriangle, CheckCircle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import { SubscriptionManager } from "@/components/subscription-manager"
import { useSubscription } from "@/hooks/use-subscription"
import Link from "next/link"

export default function SubscriptionSettingsPage() {
  const {
    subscription,
    businessProfile,
    isLoading,
    currentPlan,
    planDetails,
    isOnTrial,
    trialDaysLeft,
    upgradePlan,
    cancelSubscription,
    reactivateSubscription
  } = useSubscription()

  const [isUpgrading, setIsUpgrading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handleUpgrade = async (plan: string) => {
    setIsUpgrading(true)
    setSelectedPlan(plan)
    try {
      await upgradePlan(plan as any)
    } finally {
      setIsUpgrading(false)
      setSelectedPlan(null)
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
              <h1 className="text-3xl font-bold text-[#0A558C]">Subscription Settings</h1>
              <p className="text-gray-600 mt-2">Manage your subscription, billing, and plan features</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Subscription */}
            <SubscriptionManager showUpgradePrompts={false} />

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
