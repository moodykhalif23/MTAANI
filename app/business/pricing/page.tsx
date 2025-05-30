"use client"

import { useState } from "react"
import { Check, Crown, ArrowRight, Users, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function BusinessPricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small businesses getting started",
      price: { monthly: 0, annual: 0 },
      icon: Users,
      color: "from-gray-500 to-gray-600",
      features: [
        "Basic business listing",
        "Contact information display",
        "Up to 5 business photos",
        "Customer reviews (view only)",
        "Basic business hours",
        "Location on map",
        "Mobile-responsive listing"
      ],
      limitations: [
        "No analytics dashboard",
        "No menu management",
        "No appointment booking",
        "Limited customer engagement"
      ],
      recommended: false,
      cta: "Get Started Free",
      ctaVariant: "outline" as const
    },
    {
      name: "Professional",
      description: "Ideal for growing businesses that want more features",
      price: { monthly: 3900, annual: 39000 },
      icon: BarChart3,
      color: "from-blue-500 to-blue-600",
      features: [
        "Everything in Starter",
        "Digital menu/catalog management",
        "Advanced analytics dashboard",
        "Review management & responses",
        "Appointment booking system",
        "Social media integration",
        "Email notifications",
        "Customer insights",
        "Performance metrics",
        "Priority listing placement"
      ],
      limitations: [],
      recommended: true,
      cta: "Start Professional",
      ctaVariant: "default" as const
    },
    {
      name: "Enterprise",
      description: "For established businesses with advanced needs",
      price: { monthly: 9900, annual: 99000 },
      icon: Crown,
      color: "from-purple-500 to-purple-600",
      features: [
        "Everything in Professional",
        "Custom branding & themes",
        "Advanced API access",
        "Multi-location management",
        "Loyalty program tools",
        "Advanced reporting & analytics",
        "Priority customer support",
        "Custom integrations",
        "White-label solutions",
        "Dedicated account manager"
      ],
      limitations: [],
      recommended: false,
      cta: "Contact Sales",
      ctaVariant: "outline" as const
    }
  ]



  const getPrice = (plan: typeof plans[0]) => {
    if (plan.price.monthly === 0) return "Free"
    const price = isAnnual ? plan.price.annual : plan.price.monthly
    const period = isAnnual ? "year" : "month"
    const formattedPrice = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
    return `${formattedPrice}/${period}`
  }

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.price.monthly === 0) return null
    const monthlyCost = plan.price.monthly * 12
    const annualCost = plan.price.annual
    const savings = monthlyCost - annualCost
    const formattedSavings = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(savings)
    return savings > 0 ? `Save ${formattedSavings}/year` : null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <AuthHeader />

      {/* Hero Section */}
      <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Business Plan
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> on Mtaani</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Select the perfect plan to showcase your business, connect with customers,
              and access powerful tools that drive growth in your local community.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Label htmlFor="billing-toggle" className="text-sm font-medium">
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="billing-toggle" className="text-sm font-medium">
                Annual
              </Label>
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                Save up to 20%
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon
            return (
              <Card
                key={plan.name}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  plan.recommended
                    ? "ring-2 ring-blue-500 shadow-xl scale-105"
                    : "hover:shadow-lg"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <CardHeader className={`text-center ${plan.recommended ? "pt-12" : "pt-6"}`}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-gray-900">
                      {getPrice(plan)}
                    </div>
                    {isAnnual && getSavings(plan) && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        {getSavings(plan)}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                  <Button
                    className={`w-full mb-6 ${plan.recommended ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.ctaVariant}
                    size="lg"
                    asChild
                  >
                    <Link href={plan.name === "Starter" ? "/submit-business" : "/business-registration"}>
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      What&apos;s included:
                    </h4>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Footer />
    </div>
  )
}
