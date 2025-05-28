"use client"

import { useState } from "react"
import { ArrowLeft, Upload, Calendar, Clock, MapPin, Users, DollarSign, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function SubmitEventPage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    longDescription: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    address: "",
    maxAttendees: "",
    ticketPrice: "",
    isFree: true,
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
    website: "",
    tags: [],
    images: [],
    requiresRegistration: false,
    ageRestriction: "",
    specialRequirements: "",
  })

  const categories = [
    "Music",
    "Arts & Culture",
    "Business & Professional",
    "Community",
    "Sports & Fitness",
    "Food & Drink",
    "Education",
    "Health & Wellness",
    "Technology",
    "Family & Kids",
    "Charity & Fundraising",
    "Other",
  ]

  const availableTags = [
    "Family Friendly",
    "Outdoor",
    "Indoor",
    "Food & Drinks",
    "Live Music",
    "Networking",
    "Educational",
    "Free Event",
    "Paid Event",
    "Workshop",
    "Competition",
    "Charity",
    "Local Artists",
    "Interactive",
  ]

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handleSubmit = () => {
    console.log("Submitting event:", formData)
    // Handle form submission
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/events">
                <Button variant="ghost" size="sm" className="hover:bg-purple-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Events
                </Button>
              </Link>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded bg-purple-600 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <Link href="/" className="font-bold hover:text-purple-600 transition-colors">
                  LocalHub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Create an Event</h1>
            <p className="text-xl text-gray-600">Share your event with the local community</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
                <CardContent className="p-8 space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-purple-600" />
                        Event Details
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                          Event Title *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter your event title"
                          className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                          <SelectTrigger className="mt-1 border-gray-300 focus:border-purple-500">
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
                          placeholder="Brief description of your event (1-2 sentences)"
                          className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="longDescription" className="text-sm font-medium text-gray-700">
                          Detailed Description *
                        </Label>
                        <Textarea
                          id="longDescription"
                          value={formData.longDescription}
                          onChange={(e) => setFormData((prev) => ({ ...prev, longDescription: e.target.value }))}
                          placeholder="Provide more details about your event, schedule, what to expect..."
                          className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          rows={5}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                        <Clock className="h-6 w-6 text-purple-600" />
                        Date & Time
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                          Event Date *
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                          className="mt-1 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">
                          Start Time *
                        </Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                          className="mt-1 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">
                          End Time *
                        </Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                          className="mt-1 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-purple-600" />
                        Location
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                          Venue Name *
                        </Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                          placeholder="e.g., Central Park Amphitheater"
                          className="mt-1 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                          Full Address *
                        </Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="123 Main Street, City, State, ZIP"
                          className="mt-1 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Capacity & Pricing */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-purple-600" />
                        Capacity & Pricing
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxAttendees" className="text-sm font-medium text-gray-700">
                          Maximum Attendees
                        </Label>
                        <Input
                          id="maxAttendees"
                          type="number"
                          value={formData.maxAttendees}
                          onChange={(e) => setFormData((prev) => ({ ...prev, maxAttendees: e.target.value }))}
                          placeholder="100"
                          className="mt-1 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Ticket Price</Label>
                        <div className="mt-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={formData.isFree}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  isFree: checked,
                                  ticketPrice: checked ? "" : prev.ticketPrice,
                                }))
                              }
                              className="border-gray-300"
                            />
                            <span className="text-sm text-gray-700">Free Event</span>
                          </div>
                          {!formData.isFree && (
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                type="number"
                                value={formData.ticketPrice}
                                onChange={(e) => setFormData((prev) => ({ ...prev, ticketPrice: e.target.value }))}
                                placeholder="25.00"
                                className="pl-10 border-gray-300 focus:border-purple-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Organizer Information */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                        <User className="h-6 w-6 text-purple-600" />
                        Organizer Information
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="organizerName" className="text-sm font-medium text-gray-700">
                          Organizer Name *
                        </Label>
                        <Input
                          id="organizerName"
                          value={formData.organizerName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, organizerName: e.target.value }))}
                          placeholder="Your name or organization"
                          className="mt-1 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="organizerEmail" className="text-sm font-medium text-gray-700">
                            Email *
                          </Label>
                          <Input
                            id="organizerEmail"
                            type="email"
                            value={formData.organizerEmail}
                            onChange={(e) => setFormData((prev) => ({ ...prev, organizerEmail: e.target.value }))}
                            placeholder="organizer@example.com"
                            className="mt-1 border-gray-300 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="organizerPhone" className="text-sm font-medium text-gray-700">
                            Phone
                          </Label>
                          <Input
                            id="organizerPhone"
                            value={formData.organizerPhone}
                            onChange={(e) => setFormData((prev) => ({ ...prev, organizerPhone: e.target.value }))}
                            placeholder="(555) 123-4567"
                            className="mt-1 border-gray-300 focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900">Additional Details</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Event Tags</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {availableTags.map((tag) => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.tags.includes(tag)}
                                onCheckedChange={() => handleTagToggle(tag)}
                                className="border-gray-300"
                              />
                              <label className="text-sm text-gray-700">{tag}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Event Images</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 mb-1">Upload event photos</p>
                          <p className="text-sm text-gray-500">JPG, PNG up to 5MB each</p>
                          <Button variant="outline" className="mt-3 border-gray-300 hover:border-purple-400">
                            Choose Files
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-gray-900">Event Preview</CardTitle>
                    <CardDescription>How your event will appear to users</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{formData.title || "Event Title"}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formData.description || "Event description will appear here..."}
                      </p>
                    </div>

                    {formData.date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(formData.date).toLocaleDateString()}
                      </div>
                    )}

                    {formData.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {formData.location}
                      </div>
                    )}

                    <div className="text-lg font-semibold text-purple-600">
                      {formData.isFree ? "Free" : formData.ticketPrice ? `$${formData.ticketPrice}` : "Price TBD"}
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Alert className="border-purple-200 bg-purple-50">
                  <AlertDescription className="text-purple-800">
                    Your event will be reviewed and published within 24 hours. You'll receive a confirmation email.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                  size="lg"
                >
                  Submit Event
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
