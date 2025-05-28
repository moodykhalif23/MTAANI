"use client"

import { useState } from "react"
import { ArrowLeft, Upload, MapPin, Phone, Globe, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function SubmitBusinessPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Basic Information
    businessName: "",
    category: "",
    description: "",
    longDescription: "",

    // Contact Information
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",

    // Business Hours
    hours: {
      monday: { open: "", close: "", closed: false },
      tuesday: { open: "", close: "", closed: false },
      wednesday: { open: "", close: "", closed: false },
      thursday: { open: "", close: "", closed: false },
      friday: { open: "", close: "", closed: false },
      saturday: { open: "", close: "", closed: false },
      sunday: { open: "", close: "", closed: false },
    },

    // Additional Details
    priceRange: "",
    features: [],
    images: [],
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
  })

  const categories = [
    "Restaurant",
    "Café",
    "Retail",
    "Services",
    "Health & Fitness",
    "Entertainment",
    "Professional Services",
    "Beauty & Wellness",
    "Automotive",
    "Home & Garden",
    "Education",
    "Real Estate",
  ]

  const availableFeatures = [
    "WiFi",
    "Parking",
    "Pet Friendly",
    "Wheelchair Accessible",
    "Outdoor Seating",
    "Takeout",
    "Delivery",
    "Credit Cards Accepted",
    "Cash Only",
    "Reservations",
    "Live Music",
    "Happy Hour",
  ]

  const steps = [
    { number: 1, title: "Basic Information", description: "Tell us about your business" },
    { number: 2, title: "Contact & Location", description: "How can customers reach you?" },
    { number: 3, title: "Hours & Details", description: "When are you open?" },
    { number: 4, title: "Photos & Final Details", description: "Showcase your business" },
  ]

  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }))
  }

  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value,
        },
      },
    }))
  }

  const handleSubmit = () => {
    // Handle form submission
    console.log("Submitting business:", formData)
    // In real app, this would make an API call
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/businesses">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Businesses
                </Button>
              </Link>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <Link href="/" className="font-bold hover:text-blue-600 transition-colors">
                  LocalHub
                </Link>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Business</h1>
            <p className="text-lg text-gray-600">Join our community and connect with local customers</p>
          </div>

          <div className="mb-6">
            <Progress value={progress} className="h-2 bg-blue-100" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mb-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all ${
                    currentStep >= step.number
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {step.number}
                </div>
                <div className="text-center mt-2">
                  <div
                    className={`text-sm font-medium ${currentStep >= step.number ? "text-blue-600" : "text-gray-400"}`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
            <CardContent className="p-8">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-6 text-gray-900">Basic Information</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                        Business Name *
                      </Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                        placeholder="Enter your business name"
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                        Category *
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category.toLowerCase()}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Short Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of your business (1-2 sentences)"
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="longDescription" className="text-sm font-medium text-gray-700">
                        Detailed Description
                      </Label>
                      <Textarea
                        id="longDescription"
                        value={formData.longDescription}
                        onChange={(e) => setFormData((prev) => ({ ...prev, longDescription: e.target.value }))}
                        placeholder="Tell customers more about your business, services, and what makes you special"
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-6 text-gray-900">Contact & Location</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        Street Address *
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="123 Main Street"
                          className="pl-10 mt-1 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                          City *
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                          className="mt-1 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                          State *
                        </Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                          placeholder="State"
                          className="mt-1 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                          ZIP Code *
                        </Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
                          placeholder="12345"
                          className="mt-1 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="(555) 123-4567"
                          className="pl-10 mt-1 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="business@example.com"
                          className="pl-10 mt-1 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                        Website
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                          placeholder="www.yourbusiness.com"
                          className="pl-10 mt-1 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-6 text-gray-900">Business Hours & Details</h2>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-4 block">Business Hours</Label>
                      <div className="space-y-3">
                        {Object.entries(formData.hours).map(([day, hours]) => (
                          <div key={day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                            <div className="w-20 text-sm font-medium capitalize text-gray-700">{day}</div>
                            <div className="flex items-center gap-2 flex-1">
                              <Checkbox
                                checked={hours.closed}
                                onCheckedChange={(checked) => handleHoursChange(day, "closed", checked)}
                                className="border-gray-300"
                              />
                              <span className="text-sm text-gray-600">Closed</span>
                            </div>
                            {!hours.closed && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="time"
                                  value={hours.open}
                                  onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                                  className="w-32 border-gray-300"
                                />
                                <span className="text-gray-500">to</span>
                                <Input
                                  type="time"
                                  value={hours.close}
                                  onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                                  className="w-32 border-gray-300"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Price Range</Label>
                      <Select
                        value={formData.priceRange}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, priceRange: value }))}
                      >
                        <SelectTrigger className="mt-1 border-gray-300">
                          <SelectValue placeholder="Select price range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="$">$ - Budget Friendly</SelectItem>
                          <SelectItem value="$$">$$ - Moderate</SelectItem>
                          <SelectItem value="$$$">$$$ - Upscale</SelectItem>
                          <SelectItem value="$$$$">$$$$ - Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Features & Amenities</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableFeatures.map((feature) => (
                          <div key={feature} className="flex items-center space-x-2">
                            <Checkbox
                              checked={formData.features.includes(feature)}
                              onCheckedChange={() => handleFeatureToggle(feature)}
                              className="border-gray-300"
                            />
                            <label className="text-sm text-gray-700">{feature}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-6 text-gray-900">Photos & Final Details</h2>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Business Photos</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">Drag photos here or click to upload</p>
                        <p className="text-sm text-gray-500">Upload up to 10 photos. JPG, PNG up to 10MB each.</p>
                        <Button variant="outline" className="mt-4 border-gray-300 hover:border-blue-400">
                          Choose Files
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Selected Features</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.features.map((feature) => (
                          <Badge
                            key={feature}
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 border-blue-200"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-800">
                        Your business listing will be reviewed by our team and published within 24-48 hours. You'll
                        receive an email confirmation once it's live.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="border-gray-300 hover:border-blue-400"
                >
                  Previous
                </Button>

                {currentStep < steps.length ? (
                  <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                    Submit Listing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
