"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Image from "next/image"
import { Search, MapPin, Filter, Star, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LocationButton } from "@/components/location-button"
import { OfflineIndicator } from "@/components/offline-indicator"
import { addDistanceToItems } from "@/lib/location-utils"
import { offlineCache } from "@/lib/offline-cache"
import { useOffline } from "@/hooks/use-offline"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"

interface Business {
  id: number
  name: string
  category: string
  rating: number
  reviews: number
  image: string
  location: string
  phone: string
  website: string
  hours: string
  description: string
  tags: string[]
  distance: string
  priceRange: string
  calculatedDistance?: number | null
}

export default function BusinessesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [fromCache, setFromCache] = useState(false)
  const { isOnline } = useOffline()

  const mockBusinesses = useMemo(() => [
    {
      id: 1,
      name: "The Coffee Corner",
      category: "Café",
      rating: 4.8,
      reviews: 124,
      image: "/placeholder.svg?height=200&width=300",
      location: "123 Main St, Downtown",
      phone: "(555) 123-4567",
      website: "coffeecorner.com",
      hours: "Mon-Fri 6AM-8PM, Sat-Sun 7AM-9PM",
      description:
        "Artisan coffee and fresh pastries in the heart of the city. Known for our signature roasts and cozy atmosphere.",
      tags: ["Coffee", "Pastries", "WiFi", "Pet Friendly"],
      distance: "0.2 miles",
      priceRange: "$$",
    },
    {
      id: 2,
      name: "Green Valley Fitness",
      category: "Gym",
      rating: 4.6,
      reviews: 89,
      image: "/placeholder.svg?height=200&width=300",
      location: "456 Oak Ave, Westside",
      phone: "(555) 234-5678",
      website: "greenvalleyfitness.com",
      hours: "Mon-Fri 5AM-11PM, Sat-Sun 6AM-10PM",
      description: "Modern fitness center with personal training services and state-of-the-art equipment.",
      tags: ["Gym", "Personal Training", "Classes", "Parking"],
      distance: "1.1 miles",
      priceRange: "$$$",
    },
    {
      id: 3,
      name: "Bella's Italian Kitchen",
      category: "Restaurant",
      rating: 4.9,
      reviews: 203,
      image: "/placeholder.svg?height=200&width=300",
      location: "789 Pine St, Little Italy",
      phone: "(555) 345-6789",
      website: "bellasitalian.com",
      hours: "Tue-Sun 5PM-10PM, Closed Mondays",
      description: "Authentic Italian cuisine with family recipes passed down through generations.",
      tags: ["Italian", "Family Owned", "Wine Bar", "Reservations"],
      distance: "0.8 miles",
      priceRange: "$$$",
    },
    {
      id: 4,
      name: "Tech Repair Solutions",
      category: "Services",
      rating: 4.7,
      reviews: 67,
      image: "/placeholder.svg?height=200&width=300",
      location: "321 Elm St, Tech District",
      phone: "(555) 456-7890",
      website: "techrepairsolutions.com",
      hours: "Mon-Fri 9AM-6PM, Sat 10AM-4PM",
      description: "Professional computer and smartphone repair services with same-day turnaround.",
      tags: ["Computer Repair", "Phone Repair", "Data Recovery", "Warranty"],
      distance: "1.5 miles",
      priceRange: "$$",
    },
    {
      id: 5,
      name: "Sunset Yoga Studio",
      category: "Health & Fitness",
      rating: 4.8,
      reviews: 156,
      image: "/placeholder.svg?height=200&width=300",
      location: "654 Beach Blvd, Oceanside",
      phone: "(555) 567-8901",
      website: "sunsetyoga.com",
      hours: "Mon-Sun 6AM-9PM",
      description: "Peaceful yoga studio offering various classes for all skill levels with ocean views.",
      tags: ["Yoga", "Meditation", "Ocean View", "Beginner Friendly"],
      distance: "2.3 miles",
      priceRange: "$$",
    },
    {
      id: 6,
      name: "Downtown Books & More",
      category: "Retail",
      rating: 4.5,
      reviews: 92,
      image: "/placeholder.svg?height=200&width=300",
      location: "987 Central Ave, Downtown",
      phone: "(555) 678-9012",
      website: "downtownbooks.com",
      hours: "Mon-Sat 9AM-8PM, Sun 11AM-6PM",
      description: "Independent bookstore with curated selection and cozy reading nooks.",
      tags: ["Books", "Local Authors", "Events", "Coffee"],
      distance: "0.4 miles",
      priceRange: "$",
    },
  ], [])

  const [page, setPage] = useState(1)
  const displayedBusinesses = useMemo(() => businesses.slice(0, page * 25), [businesses, page])
  const displayedBusinessesWithDistance = useMemo(() => {
    if (userLocation) {
      return addDistanceToItems(displayedBusinesses, userLocation.lat, userLocation.lng)
    }
    return displayedBusinesses.map((business) => ({ ...business, calculatedDistance: null }))
  }, [displayedBusinesses, userLocation])
  const loadMoreBusinesses = () => setPage((prev) => prev + 1)

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true)

      if (isOnline) {
        // Make real API call to fetch businesses
        const params = new URLSearchParams()
        if (userLocation) {
          params.append('lat', userLocation.lat.toString())
          params.append('lng', userLocation.lng.toString())
          params.append('radius', '10') // 10km radius
        }
        if (selectedCategory && selectedCategory !== 'all') {
          params.append('category', selectedCategory)
        }
        params.append('limit', '50')

        const response = await fetch(`/api/businesses?${params.toString()}`)

        if (response.ok) {
          const data = await response.json()
          const businessList = data.data?.businesses || []
          setBusinesses(businessList)
          setFromCache(false)

          // Cache the fresh data
          await offlineCache.cacheBusinesses(businessList as Array<Record<string, unknown>>, userLocation || undefined)
        } else {
          throw new Error('Failed to fetch businesses')
        }
      } else {
        // Load from cache when offline
        const cachedBusinesses = await offlineCache.getCachedBusinesses(userLocation || undefined)
        setBusinesses(cachedBusinesses as unknown as Business[])
        setFromCache(true)
      }
    } catch (error) {
      console.error("Failed to load businesses:", error)

      // Fallback to cache if online request fails
      if (isOnline) {
        try {
          const cachedBusinesses = await offlineCache.getCachedBusinesses(userLocation || undefined)
          setBusinesses(cachedBusinesses as unknown as Business[])
          setFromCache(true)
        } catch (cacheError) {
          console.error("Cache fallback failed:", cacheError)
          // If all else fails, show mock data as last resort
          setBusinesses(mockBusinesses)
          setFromCache(false)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [isOnline, userLocation, selectedCategory, mockBusinesses])

  // Load businesses data (online or cached)
  useEffect(() => {
    loadBusinesses()
  }, [loadBusinesses])

  // Load cached user location on mount
  useEffect(() => {
    loadCachedLocation()
  }, [])

  const loadCachedLocation = async () => {
    try {
      const cachedLocation = await offlineCache.getCachedUserLocation()
      if (cachedLocation) {
        setUserLocation(cachedLocation)
      }
    } catch (error) {
      console.error("Failed to load cached location:", error)
    }
  }

  // Add calculated distances when user location is available
  const businessesWithDistance = useMemo(() => {
    if (userLocation) {
      return addDistanceToItems(businesses, userLocation.lat, userLocation.lng)
    }
    return businesses.map((business) => ({ ...business, calculatedDistance: null }))
  }, [businesses, userLocation])

  const filteredBusinesses = businessesWithDistance.filter((business) => {
    const matchesSearch =
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || business.category.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating
      case "reviews":
        return b.reviews - a.reviews
      case "distance":
        if (userLocation && a.calculatedDistance !== null && b.calculatedDistance !== null) {
          return a.calculatedDistance - b.calculatedDistance
        }
        return Number.parseFloat(a.distance) - Number.parseFloat(b.distance)
      case "name":
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const handleLocationUpdate = async (lat: number, lng: number) => {
    setUserLocation({ lat, lng })
    setSortBy("distance") // Auto-sort by distance when location is enabled

    // Cache the user location
    try {
      await offlineCache.cacheUserLocation({ lat, lng })
    } catch (error) {
      console.error("Failed to cache user location:", error)
    }
  }

  const handleLocationClear = () => {
    setUserLocation(null)
    setSortBy("rating") // Reset to default sort
  }

  // Cache search results
  useEffect(() => {
    if (searchQuery && filteredBusinesses.length > 0) {
      offlineCache.cacheSearchResults(searchQuery, filteredBusinesses as Array<Record<string, unknown>>, userLocation || undefined)
    }
  }, [searchQuery, filteredBusinesses, userLocation])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <OfflineIndicator />
      <AuthHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#0A558C]">
            Local Businesses
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Discover amazing local businesses in your community</p>
          {userLocation && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
              <Navigation className="h-4 w-4" />
              <span>Showing businesses near your location</span>
            </div>
          )}
          {fromCache && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-orange-600">
              <span>Showing cached results {!isOnline && "(offline)"}</span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search businesses..."
                className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <LocationButton
              onLocationUpdate={handleLocationUpdate}
              onLocationClear={handleLocationClear}
              isActive={userLocation !== null}
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="restaurant">Restaurants</SelectItem>
                <SelectItem value="café">Cafés</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="gym">Health & Fitness</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="distance">{userLocation ? "Nearest First" : "Distance"}</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-12 border-gray-300 hover:border-blue-400">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Businesses</SheetTitle>
                  <SheetDescription>Refine your search with additional filters</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Price Range</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="price-1" />
                        <label htmlFor="price-1" className="text-sm">
                          $ - Budget Friendly
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="price-2" />
                        <label htmlFor="price-2" className="text-sm">
                          $$ - Moderate
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="price-3" />
                        <label htmlFor="price-3" className="text-sm">
                          $$$ - Upscale
                        </label>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Features</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="wifi" />
                        <label htmlFor="wifi" className="text-sm">
                          WiFi
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="parking" />
                        <label htmlFor="parking" className="text-sm">
                          Parking
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="pet-friendly" />
                        <label htmlFor="pet-friendly" className="text-sm">
                          Pet Friendly
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {sortedBusinesses.length} of {businesses.length} businesses
              {userLocation && " near you"}
              {fromCache && " (cached)"}
            </p>
            <div className="hidden lg:flex items-center space-x-4">
              <span className="text-sm text-gray-600">Quick Filters:</span>
              <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 hover:text-blue-800">
                Open Now
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 hover:text-blue-800">
                Highly Rated
              </Badge>
              {userLocation && (
                <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 hover:text-blue-800">
                  Within 1 Mile
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-gray-200 animate-pulse" />
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Business Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 xl:gap-5">
            {displayedBusinessesWithDistance.slice(0, 25).map((business) => (
              <Card
                key={business.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow bg-white/90 backdrop-blur p-2 md:p-3 text-xs md:text-sm rounded-lg"
              >
                <div className="aspect-[4/3] relative overflow-hidden rounded mb-1">
                  <Image src={business.image || "/placeholder.svg"} alt={business.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <CardHeader className="pb-1 px-0">
                  <CardTitle className="text-xs md:text-sm font-semibold group-hover:text-[#0A558C] mb-0.5 truncate">{business.name}</CardTitle>
                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600">
                    <MapPin className="h-3 w-3 text-[#0A558C]" />
                    <span>{business.location}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-0 pt-0 pb-1">
                  <CardDescription className="mb-1 text-[10px] md:text-xs text-gray-600 line-clamp-2">{business.description}</CardDescription>
                  <div className="flex items-center justify-between text-[10px] md:text-xs">
                    <span>{business.reviews} reviews</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{business.rating}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {!loading && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              disabled={!isOnline}
              onClick={loadMoreBusinesses}
            >
              {isOnline ? "Load More Businesses" : "More content available online"}
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
