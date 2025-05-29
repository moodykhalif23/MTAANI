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

export default function PricingPage() {
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
      description: "For established businesses needing advanced tools",
      price: { monthly: 13300, annual: 133000 },
      icon: Crown,
      color: "from-purple-500 to-purple-600",
      features: [
        "Everything in Professional",
        "Loyalty programs management",
        "Advanced analytics & reporting",
        "Custom branding options",
        "API access for integrations",
        "Multi-location management",
        "Advanced marketing tools",
        "Dedicated account manager",
        "Priority customer support",
        "Custom feature requests"
      ],
      limitations: [],
      recommended: false,
      cta: "Go Enterprise",
      ctaVariant: "default" as const
    }
  ]

  const businessTools = [
    {
      name: "Digital Menu Management",
      description: "Create and manage your digital menu or product catalog with real-time updates",
      availableIn: ["Professional", "Enterprise"],
      icon: "📋"
    },
    {
      name: "Analytics Dashboard",
      description: "Track customer engagement, views, and business performance metrics",
      availableIn: ["Professional", "Enterprise"],
      icon: "📊"
    },
    {
      name: "Appointment Booking",
      description: "Let customers book appointments directly through your business listing",
      availableIn: ["Professional", "Enterprise"],
      icon: "📅"
    },
    {
      name: "Review Management",
      description: "Respond to customer reviews and manage your online reputation",
      availableIn: ["Professional", "Enterprise"],
      icon: "⭐"
    },
    {
      name: "Loyalty Programs",
      description: "Create and manage customer loyalty programs to increase retention",
      availableIn: ["Enterprise"],
      icon: "🎁"
    },
    {
      name: "API Access",
      description: "Integrate with your existing systems using our comprehensive API",
      availableIn: ["Enterprise"],
      icon: "🔌"
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
              Grow Your Business with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Mtaani</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Choose the perfect plan to showcase your business, connect with customers,
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
              {isAnnual && (
                <Badge variant="secondary" className="ml-2">
                  Save 2 months free
                </Badge>
              )}
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

      {/* Business Tools Section */}
      <div className="bg-white/50 backdrop-blur py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Business Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access professional tools designed to help your business thrive in the digital age
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {businessTools.map((tool, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="text-4xl mb-3">{tool.icon}</div>
                  <CardTitle className="text-xl">{tool.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tool.availableIn.map((plan) => (
                      <Badge
                        key={plan}
                        variant={plan === "Enterprise" ? "default" : "secondary"}
                        className={plan === "Enterprise" ? "bg-purple-600" : ""}
                      >
                        {plan}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Compare All Features
          </h2>
          <p className="text-xl text-gray-600">
            See exactly what&apos;s included in each plan
          </p>
        </div>

        <div className="max-w-6xl mx-auto overflow-x-auto">
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Starter</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 bg-blue-50">Professional</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { feature: "Business Listing", starter: true, professional: true, enterprise: true },
                  { feature: "Contact Information", starter: true, professional: true, enterprise: true },
                  { feature: "Business Photos", starter: "5 photos", professional: "Unlimited", enterprise: "Unlimited" },
                  { feature: "Customer Reviews", starter: "View only", professional: "Manage & Respond", enterprise: "Manage & Respond" },
                  { feature: "Analytics Dashboard", starter: false, professional: true, enterprise: true },
                  { feature: "Digital Menu/Catalog", starter: false, professional: true, enterprise: true },
                  { feature: "Appointment Booking", starter: false, professional: true, enterprise: true },
                  { feature: "Social Media Integration", starter: false, professional: true, enterprise: true },
                  { feature: "Email Notifications", starter: false, professional: true, enterprise: true },
                  { feature: "Loyalty Programs", starter: false, professional: false, enterprise: true },
                  { feature: "Custom Branding", starter: false, professional: false, enterprise: true },
                  { feature: "API Access", starter: false, professional: false, enterprise: true },
                  { feature: "Priority Support", starter: false, professional: true, enterprise: true },
                  { feature: "Multi-location Management", starter: false, professional: false, enterprise: true },
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                    <td className="py-4 px-6 text-center">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-600">{row.starter}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center bg-blue-50/50">
                      {typeof row.professional === 'boolean' ? (
                        row.professional ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-600">{row.professional}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof row.enterprise === 'boolean' ? (
                        row.enterprise ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-600">{row.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white/50 backdrop-blur py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                question: "Can I upgrade or downgrade my plan anytime?",
                answer: "Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing cycle."
              },
              {
                question: "Is there a free trial for paid plans?",
                answer: "Yes, we offer a 14-day free trial for both Professional and Enterprise plans. No credit card required to start."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, debit cards, and bank transfers. All payments are processed securely."
              },
              {
                question: "Can I cancel my subscription anytime?",
                answer: "Absolutely. You can cancel your subscription at any time from your account settings. Your access continues until the end of your billing period."
              }
            ].map((faq, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
