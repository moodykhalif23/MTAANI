"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Clock,
  Star,
  Share2,
  Heart,
  WaypointsIcon as Directions,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import ReviewSystem from "@/components/review-system"
import Link from "next/link"

// Mock data - in real app, this would come from props or API
const businessData = {
  id: 1,
  name: "The Coffee Corner",
  category: "Café",
  rating: 4.8,
  reviews: 124,
  priceRange: "$$",
  location: "123 Main St, Downtown",
  phone: "(555) 123-4567",
  website: "coffeecorner.com",
  email: "hello@coffeecorner.com",
  hours: {
    monday: "6:00 AM - 8:00 PM",
    tuesday: "6:00 AM - 8:00 PM",
    wednesday: "6:00 AM - 8:00 PM",
    thursday: "6:00 AM - 8:00 PM",
    friday: "6:00 AM - 8:00 PM",
    saturday: "7:00 AM - 9:00 PM",
    sunday: "7:00 AM - 9:00 PM",
  },
  description:
    "Artisan coffee and fresh pastries in the heart of the city. Known for our signature roasts and cozy atmosphere perfect for work or casual meetings.",
  features: ["WiFi", "Pet Friendly", "Outdoor Seating", "Takeout", "Parking Available"],
  images: [
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
  ],
  menu: [
    { category: "Coffee", items: ["Espresso", "Americano", "Cappuccino", "Latte", "Cold Brew"] },
    { category: "Pastries", items: ["Croissant", "Muffin", "Danish", "Scone"] },
    { category: "Sandwiches", items: ["BLT", "Club", "Grilled Cheese", "Panini"] },
  ],
}

const reviewsData = [
  {
    id: 1,
    user: { name: "Sarah Johnson", verified: true },
    rating: 5,
    comment:
      "Amazing coffee and friendly staff! The atmosphere is perfect for working or catching up with friends. Highly recommend the lavender latte!",
    date: "2 days ago",
    helpful: 12,
    notHelpful: 1,
  },
  {
    id: 2,
    user: { name: "Mike Chen", verified: false },
    rating: 4,
    comment:
      "Great coffee and pastries. The WiFi is reliable and the place isn't too noisy. Only downside is it can get crowded during lunch hours.",
    date: "1 week ago",
    helpful: 8,
    notHelpful: 0,
  },
  {
    id: 3,
    user: { name: "Emma Davis", verified: true },
    rating: 5,
    comment: "Best coffee in town! The baristas really know their craft. The outdoor seating is a nice touch too.",
    date: "2 weeks ago",
    helpful: 15,
    notHelpful: 2,
  },
]

export default function BusinessDetailPage({ params }: { params: { id: string } }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [business, setBusiness] = useState(businessData) // Start with fallback data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch business data from API
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/businesses/${params.id}`)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.business) {
            // Transform API data to match component expectations
            const apiBusiness = data.data.business
            setBusiness({
              id: apiBusiness.id,
              name: apiBusiness.name,
              category: apiBusiness.category,
              rating: apiBusiness.stats?.rating || 0,
              reviews: apiBusiness.stats?.reviews || 0,
              priceRange: "$$", // Default or from business data
              location: apiBusiness.location?.address || "Address not available",
              phone: apiBusiness.contact?.phone || "Phone not available",
              website: apiBusiness.contact?.website || "",
              email: apiBusiness.contact?.email || "",
              hours: apiBusiness.hours || businessData.hours, // Fallback to default hours
              description: apiBusiness.description || "No description available",
              features: apiBusiness.services || businessData.features, // Use services as features
              images: apiBusiness.media?.gallery || businessData.images,
              menu: businessData.menu // Keep default menu for now
            })
          }
        } else {
          setError('Failed to load business details')
        }
      } catch (err) {
        console.error('Error fetching business:', err)
        setError('Failed to load business details')
        // Keep using fallback data
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [params.id])

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />

      {/* Breadcrumb Header */}
      <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/businesses">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Businesses
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsFavorited(!isFavorited)}>
                <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
              <img
                src={business.images[selectedImage] || "/placeholder.svg"}
                alt={business.name}
                className="object-cover w-full h-full"
              />
              <div className="absolute bottom-4 left-4 flex gap-2">
                {business.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-3 h-3 rounded-full ${selectedImage === index ? "bg-white" : "bg-white/60"}`}
                  />
                ))}
              </div>
              <Button className="absolute bottom-4 right-4" variant="secondary">
                <Camera className="h-4 w-4 mr-2" />
                View All Photos
              </Button>
            </div>

            <div className="flex gap-2 mb-4">
              {business.images.slice(1, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index + 1)}
                  className="aspect-video w-24 overflow-hidden rounded border-2 border-transparent hover:border-primary transition-colors"
                >
                  <img src={image || "/placeholder.svg"} alt="" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{business.category}</Badge>
                  <Badge variant="outline">{business.priceRange}</Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2 text-[#0A558C]">{business.name}</h1>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{business.rating}</span>
                  <span className="text-muted-foreground">({business.reviews} reviews)</span>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">{business.description}</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[#0A558C]" />
                <span>{business.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#0A558C]" />
                <a href={`tel:${business.phone}`} className="hover:text-[#0A558C] transition-colors">
                  {business.phone}
                </a>
              </div>
              {business.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-[#0A558C]" />
                  <a
                    href={`https://${business.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0A558C] transition-colors"
                  >
                    {business.website}
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button className="w-full bg-[#0A558C] hover:bg-[#084b7c]">
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
              <Button variant="outline" className="w-full border-[#0A558C] text-[#0A558C] hover:bg-blue-50">
                <Directions className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{business.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {business.features.map((feature) => (
                        <Badge key={feature} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Popular Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {["Signature Latte", "Fresh Croissant", "Artisan Sandwich", "Cold Brew"].map((item) => (
                        <div key={item} className="flex items-center gap-3 p-3 border rounded-lg">
                          <img
                            src="/placeholder.svg?height=60&width=60"
                            alt={item}
                            className="w-15 h-15 object-cover rounded"
                          />
                          <div>
                            <h4 className="font-medium">{item}</h4>
                            <p className="text-sm text-muted-foreground">Popular choice</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(business.hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize font-medium">{day}</span>
                          <span className="text-muted-foreground">{hours}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="menu" className="mt-8">
            <div className="space-y-6">
              {business.menu.map((section) => (
                <Card key={section.category}>
                  <CardHeader>
                    <CardTitle>{section.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {section.items.map((item) => (
                        <div key={item} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{item}</h4>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-8">
            <ReviewSystem
              businessId={business.id}
              reviews={reviewsData}
              averageRating={business.rating}
              totalReviews={business.reviews}
            />
          </TabsContent>

          <TabsContent value="info" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-medium mb-1">Address</div>
                    <div className="text-muted-foreground">{business.location}</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Phone</div>
                    <div className="text-muted-foreground">{business.phone}</div>
                  </div>
                  {business.website && (
                    <div>
                      <div className="font-medium mb-1">Website</div>
                      <div className="text-muted-foreground">{business.website}</div>
                    </div>
                  )}
                  <div>
                    <div className="font-medium mb-1">Email</div>
                    <div className="text-muted-foreground">{business.email}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features & Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {business.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  )
}
