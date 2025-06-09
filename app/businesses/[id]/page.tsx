"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
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

interface BusinessHours {
  [key: string]: string;
}

interface MenuItem {
  category: string;
  items: string[];
}

interface Business {
  id: number;
  name: string;
  category: string;
  stats?: {
    rating: number;
    reviews: number;
  };
  priceRange: string;
  location: {
    address: string;
  };
  contact: {
    phone: string;
    website?: string;
    email: string;
  };
  hours: BusinessHours;
  description: string;
  services: string[];
  media?: {
    gallery: string[];
  };
  menu: MenuItem[];
}

export default function BusinessDetailPage({ params }: { params: { id: string } }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await fetch(`/api/businesses/${params.id}`)
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.business) {
            const businessData: Business = {
              id: parseInt(data.data.business.id),
              name: data.data.business.name,
              category: data.data.business.category,
              stats: {
                rating: data.data.business.stats?.rating || 0,
                reviews: data.data.business.stats?.reviews || 0
              },
              priceRange: data.data.business.priceRange || "$$",
              location: {
                address: data.data.business.location?.address || "Address not available"
              },
              contact: {
                phone: data.data.business.contact?.phone || "Phone not available",
                website: data.data.business.contact?.website || undefined,
                email: data.data.business.contact?.email || ""
              },
              hours: data.data.business.hours || {},
              description: data.data.business.description || "No description available",
              services: data.data.business.services || [],
              media: {
                gallery: data.data.business.media?.gallery || []
              },
              menu: data.data.business.menu || []
            }
            setBusiness(businessData)
          } else {
            setBusiness(null)
          }
        } else {
          setBusiness(null)
        }      } catch {
        setBusiness(null)
      }
    }

    fetchBusiness()
  }, [params.id])

  if (!business) {
    return null
  }

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
              <Image
                src={business.media?.gallery[selectedImage] || "/placeholder.svg"}
                alt={business.name}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-4 left-4 flex gap-2">
                {(business.media?.gallery || []).map((_, index) => (
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
              {(business.media?.gallery || []).slice(1, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index + 1)}
                  className="aspect-video w-24 overflow-hidden rounded border-2 border-transparent hover:border-primary transition-colors relative"
                >
                  <Image src={image || "/placeholder.svg"} alt="" fill className="object-cover" />
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
                  <span className="font-medium">{business.stats?.rating}</span>
                  <span className="text-muted-foreground">({business.stats?.reviews} reviews)</span>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">{business.description}</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[#0A558C]" />
                <span>{business.location.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#0A558C]" />
                <a href={`tel:${business.contact.phone}`} className="hover:text-[#0A558C] transition-colors">
                  {business.contact.phone}
                </a>
              </div>
              {business.contact.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-[#0A558C]" />
                  <a
                    href={`https://${business.contact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0A558C] transition-colors"
                  >
                    {business.contact.website}
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
                      {business.services.map((service) => (
                        <Badge key={service} variant="outline">
                          {service}
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
                          <div className="w-15 h-15 relative rounded overflow-hidden">
                            <Image
                              src="/placeholder.svg?height=60&width=60"
                              alt={item}
                              fill
                              className="object-cover"
                            />
                          </div>
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
              reviews={[]}
              averageRating={business.stats?.rating || 0}
              totalReviews={business.stats?.reviews || 0}
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
                    <div className="text-muted-foreground">{business.location.address}</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Phone</div>
                    <div className="text-muted-foreground">{business.contact.phone}</div>
                  </div>
                  {business.contact.website && (
                    <div>
                      <div className="font-medium mb-1">Website</div>
                      <div className="text-muted-foreground">{business.contact.website}</div>
                    </div>
                  )}
                  <div>
                    <div className="font-medium mb-1">Email</div>
                    <div className="text-muted-foreground">{business.contact.email}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features & Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {business.services.map((service) => (
                      <div key={service} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm">{service}</span>
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
