"use client"

import Image from "next/image"
import {
  MapPin,
  Calendar,
  Star,
  Users,
  TrendingUp
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import { AdvancedSearchInput } from "@/components/search/advanced-search-input"
import { useAdvancedSearch } from "@/hooks/use-advanced-search"
import { CategoryBrowser } from "@/components/category-browser"
import { useRouter } from "next/navigation"

const allFeaturedBusinesses = [
  {
    id: 1,
    name: "The Coffee Corner",
    category: "Café",
    rating: 4.8,
    reviews: 124,
    image: "/placeholder.svg?height=200&width=300",
    location: "Downtown",
    description: "Artisan coffee and fresh pastries in the heart of the city",
    featured: true,
    type: "business",
  },
  {
    id: 2,
    name: "Green Valley Fitness",
    category: "Gym",
    rating: 4.6,
    reviews: 89,
    image: "/placeholder.svg?height=200&width=300",
    location: "Westside",
    description: "Modern fitness center with personal training services",
    featured: true,
    type: "business",
  },
  {
    id: 3,
    name: "Bella's Italian Kitchen",
    category: "Restaurant",
    rating: 4.9,
    reviews: 203,
    image: "/placeholder.svg?height=200&width=300",
    location: "Little Italy",
    description: "Authentic Italian cuisine with family recipes",
    featured: true,
    type: "business",
  },
  {
    id: 4,
    name: "Sushi Place",
    category: "Restaurant",
    rating: 4.7,
    reviews: 150,
    image: "/placeholder.svg?height=200&width=300",
    location: "Downtown",
    description: "Fresh sushi and Japanese dishes",
    featured: true,
    type: "business",
  },
  {
    id: 5,
    name: "Pasta House",
    category: "Restaurant",
    rating: 4.6,
    reviews: 90,
    image: "/placeholder.svg?height=200&width=300",
    location: "Little Italy",
    description: "Homemade pasta and Italian delicacies",
    featured: true,
    type: "business",
  },
  {
    id: 6,
    name: "Burger Joint",
    category: "Restaurant",
    rating: 4.5,
    reviews: 200,
    image: "/placeholder.svg?height=200&width=300",
    location: "Uptown",
    description: "Juicy burgers and classic American diner fare",
    featured: true,
    type: "business",
  },
  {
    id: 7,
    name: "Taco Spot",
    category: "Restaurant",
    rating: 4.8,
    reviews: 120,
    image: "/placeholder.svg?height=200&width=300",
    location: "Eastside",
    description: "Delicious tacos and Mexican street food",
    featured: true,
    type: "business",
  },
  {
    id: 8,
    name: "Veggie Delight",
    category: "Restaurant",
    rating: 4.7,
    reviews: 80,
    image: "/placeholder.svg?height=200&width=300",
    location: "Westside",
    description: "Healthy vegetarian and vegan options",
    featured: true,
    type: "business",
  },
  {
    id: 9,
    name: "Steakhouse",
    category: "Restaurant",
    rating: 4.9,
    reviews: 110,
    image: "/placeholder.svg?height=200&width=300",
    location: "Downtown",
    description: "Premium steaks and fine dining experience",
    featured: true,
    type: "business",
  },
  {
    id: 10,
    name: "Seafood Shack",
    category: "Restaurant",
    rating: 4.6,
    reviews: 95,
    image: "/placeholder.svg?height=200&width=300",
    location: "Harborside",
    description: "Fresh seafood and waterfront views",
    featured: true,
    type: "business",
  },
  {
    id: 11,
    name: "Dessert Oasis",
    category: "Café",
    rating: 4.8,
    reviews: 130,
    image: "/placeholder.svg?height=200&width=300",
    location: "Downtown",
    description: "Delectable desserts and coffee",
    featured: true,
    type: "business",
  },
  {
    id: 12,
    name: "Bagel Bakery",
    category: "Café",
    rating: 4.7,
    reviews: 70,
    image: "/placeholder.svg?height=200&width=300",
    location: "Midtown",
    description: "Freshly baked bagels and spreads",
    featured: true,
    type: "business",
  },
]

const allFeaturedEvents = [
  {
    id: 1,
    title: "Summer Music Festival",
    date: "July 15, 2024",
    time: "6:00 PM",
    location: "Central Park",
    attendees: 245,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "Free",
    description: "A vibrant summer music festival with live bands and food trucks.",
  },
  {
    id: 2,
    title: "Art Gallery Opening",
    date: "July 18, 2024",
    time: "6:00 PM",
    location: "Downtown Gallery",
    attendees: 34,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "Free",
    description: "Experience the latest works from local artists at the gallery opening.",
  },
  {
    id: 3,
    title: "Food Truck Rally",
    date: "July 22, 2024",
    time: "11:00 AM",
    location: "City Hall Plaza",
    attendees: 156,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "Free Entry",
    description: "Savor delicious dishes from the city's best food trucks.",
  },
  {
    id: 4,
    title: "Wine Tasting Evening",
    date: "July 25, 2024",
    time: "5:00 PM",
    location: "Vineyard Estate",
    attendees: 85,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "$20",
    description: "Enjoy a selection of fine wines and gourmet appetizers.",
  },
  {
    id: 5,
    title: "Charity Run",
    date: "August 1, 2024",
    time: "7:00 AM",
    location: "City Sports Complex",
    attendees: 300,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "Free",
    description: "Join us for a fun run to support local charities.",
  },
  {
    id: 6,
    title: "Outdoor Movie Night",
    date: "August 5, 2024",
    time: "8:00 PM",
    location: "Community Park",
    attendees: 120,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "Free",
    description: "Watch a classic movie under the stars with your neighbors.",
  },
  {
    id: 7,
    title: "Food Festival",
    date: "August 10, 2024",
    time: "12:00 PM",
    location: "Downtown Street",
    attendees: 500,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "Varies",
    description: "Indulge in a variety of cuisines at the annual food festival.",
  },
  {
    id: 8,
    title: "Art in the Park",
    date: "August 15, 2024",
    time: "10:00 AM",
    location: "Central Park",
    attendees: 75,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "Free",
    description: "Explore local art and meet the artists in a beautiful park setting.",
  },
  {
    id: 9,
    title: "Live Concert",
    date: "August 20, 2024",
    time: "7:00 PM",
    location: "City Arena",
    attendees: 200,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "$30",
    description: "Enjoy a live performance by a popular band at the city arena.",
  },
  {
    id: 10,
    title: "Theater Play: A Midsummer Night's Dream",
    date: "August 25, 2024",
    time: "6:00 PM",
    location: "Downtown Theater",
    attendees: 150,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "$25",
    description: "Experience Shakespeare's classic play in a charming outdoor setting.",
  },
  {
    id: 11,
    title: "Photography Exhibition",
    date: "September 1, 2024",
    time: "5:00 PM",
    location: "Art Gallery",
    attendees: 60,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "Free",
    description: "Discover stunning photographs by local and national photographers.",
  },
  {
    id: 12,
    title: "Cooking Class: Italian Cuisine",
    date: "September 5, 2024",
    time: "3:00 PM",
    location: "Culinary School",
    attendees: 20,
    image: "/placeholder.svg?height=150&width=200",
    featured: true,
    type: "event",
    price: "$50",
    description: "Learn to cook authentic Italian dishes with a professional chef.",
  },
]

export default function HomePage() {
  const router = useRouter()
  const { suggestions, isLoading, recentSearches, popularSearches } = useAdvancedSearch({
    enableSuggestions: true,
    enableCache: true,
    debounceMs: 300
  })

  const handleHeroSearch = (query: string, filters?: { location?: string; category?: string; type?: string }) => {
    const searchParams = new URLSearchParams({
      q: query,
      ...(filters?.location && { location: filters.location }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.type && { type: filters.type })
    })

    router.push(`/search?${searchParams.toString()}`)
  }

  const featuredBusinesses = allFeaturedBusinesses.length >= 20 ? allFeaturedBusinesses.slice(0, 20) : [
    ...allFeaturedBusinesses,
    ...Array.from({ length: 20 - allFeaturedBusinesses.length }, (_, i) => ({
      id: 1000 + i,
      name: `Business ${i + 1 + allFeaturedBusinesses.length}`,
      category: "Business",
      rating: 4.5,
      reviews: 0,
      image: "/placeholder.svg?height=200&width=300",
      location: "-",
      description: "Featured business placeholder.",
      featured: true,
      type: "business",
    }))
  ]
  const featuredEvents = allFeaturedEvents.length >= 20 ? allFeaturedEvents.slice(0, 20) : [
    ...allFeaturedEvents,
    ...Array.from({ length: 20 - allFeaturedEvents.length }, (_, i) => ({
      id: 2000 + i,
      title: `Event ${i + 1 + allFeaturedEvents.length}`,
      date: "TBD",
      time: "TBD",
      location: "-",
      attendees: 0,
      image: "/placeholder.svg?height=150&width=200",
      featured: true,
      type: "event",
      price: "Free",
      description: "Featured event placeholder."
    }))
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <AuthHeader />

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-[#0A558C] leading-tight">
            Discover Your Local Community
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect with local businesses, discover exciting events, and build meaningful relationships in your
            neighborhood.
          </p>

          {/* Advanced Search Bar */}
          <div className="max-w-4xl mx-auto mb-12">
            <AdvancedSearchInput
              placeholder="Search businesses, events, or services..."
              onSearch={handleHeroSearch}
              showLocationInput={true}
              suggestions={suggestions.map((s, index) => ({
                id: `suggestion-${index}`,
                text: s.text,
                type: s.type,
                count: s.count,
                popularity: s.popularity,
                category: s.category,
                location: s.location
              }))}
              isLoading={isLoading}
              recentSearches={recentSearches}
              popularSearches={popularSearches.map(s => s.text)}
              className="w-full"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="text-4xl font-bold text-[#0A558C] mb-2">1,200+</div>
              <div className="text-gray-600 font-medium">Local Businesses</div>
            </div>
            <div className="text-center p-6 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="text-4xl font-bold text-[#0A558C] mb-2">350+</div>
              <div className="text-gray-600 font-medium">Monthly Events</div>
            </div>
            <div className="text-center p-6 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="text-4xl font-bold text-[#0A558C] mb-2">15K+</div>
              <div className="text-gray-600 font-medium">Community Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Categories Section */}
      <CategoryBrowser
        onCategorySelect={(category) => {
          router.push(`/search?category=${category.id}&type=${category.type}`)
        }}
        className="mb-8" // Reduced margin below for tighter section transition
      />

      {/* Featured Businesses & Events Section */}
      <section className="py-12 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-4 text-gray-900">Featured This Week</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover premium local businesses and exciting upcoming events handpicked by our community
            </p>
          </div>

          <Tabs defaultValue="businesses" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger
                  value="businesses"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
                >
                  <TrendingUp className="h-4 w-4" />
                  Featured Businesses
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
                >
                  <Calendar className="h-4 w-4" />
                  Featured Events
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="businesses">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {featuredBusinesses.map((business) => (
                  <Card key={business.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow bg-white/90 backdrop-blur p-3 md:p-4 text-xs md:text-sm rounded-lg">
                    <div className="aspect-[4/3] relative overflow-hidden rounded mb-2">
                      <Image src={business.image || "/placeholder.svg"} alt={business.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <CardHeader className="pb-2 px-0">
                      <CardTitle className="text-sm md:text-base font-semibold group-hover:text-[#0A558C] mb-1 truncate">{business.name}</CardTitle>
                      <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600">
                        <MapPin className="h-3 w-3 text-[#0A558C]" />
                        <span>{business.location}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-0 pt-0 pb-2">
                      <CardDescription className="mb-1 text-[10px] md:text-xs text-gray-600 line-clamp-2">{business.description}</CardDescription>
                      <div className="flex items-center justify-between text-[10px] md:text-xs">
                        <span>{business.reviews} reviews</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{business.rating}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {featuredEvents.map((event) => (
                  <Card key={event.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow bg-white/90 backdrop-blur p-2 md:p-3 text-xs md:text-sm rounded-lg">
                    <div className="aspect-[4/3] relative overflow-hidden rounded mb-1">
                      <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <CardHeader className="pb-1 px-0">
                      <CardTitle className="text-xs md:text-sm font-semibold group-hover:text-[#0A558C] mb-0.5 truncate">{event.title}</CardTitle>
                      <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600">
                        <Calendar className="h-3 w-3 text-[#0A558C]" />
                        <span>{event.date}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-0 pt-0 pb-1">
                      {event.description && (
                        <CardDescription className="mb-1 text-[10px] md:text-xs text-gray-600 line-clamp-2">{event.description}</CardDescription>
                      )}
                      <div className="flex items-center justify-between text-[10px] md:text-xs">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3 text-gray-400" />{event.attendees} attending</span>
                        <span className="font-semibold text-[#0A558C]">{event.price}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>



      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="businesses" className="w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
              <div className="text-center md:text-left">
                <h3 className="text-3xl font-bold mb-3 text-gray-900">Explore Local</h3>
                <p className="text-lg text-gray-600">Discover what makes your community special</p>
              </div>
              <TabsList className="grid w-full md:w-auto grid-cols-2 mt-6 md:mt-0 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger
                  value="businesses"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
                >
                  <TrendingUp className="h-4 w-4" />
                  Businesses
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
                >
                  <Calendar className="h-4 w-4" />
                  Events
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="businesses">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {featuredBusinesses.map((business) => (
                  <Card key={business.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow bg-white/90 backdrop-blur p-3 md:p-4 text-xs md:text-sm rounded-lg">
                    <div className="aspect-[4/3] relative overflow-hidden rounded mb-2">
                      <Image src={business.image || "/placeholder.svg"} alt={business.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <CardHeader className="pb-2 px-0">
                      <CardTitle className="text-sm md:text-base font-semibold group-hover:text-[#0A558C] mb-1 truncate">{business.name}</CardTitle>
                      <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600">
                        <MapPin className="h-3 w-3 text-[#0A558C]" />
                        <span>{business.location}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-0 pt-0 pb-2">
                      <CardDescription className="mb-1 text-[10px] md:text-xs text-gray-600 line-clamp-2">{business.description}</CardDescription>
                      <div className="flex items-center justify-between text-[10px] md:text-xs">
                        <span>{business.reviews} reviews</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{business.rating}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {featuredEvents.map((event) => (
                  <Card key={event.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow bg-white/90 backdrop-blur p-2 md:p-3 text-xs md:text-sm rounded-lg">
                    <div className="aspect-[4/3] relative overflow-hidden rounded mb-1">
                      <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <CardHeader className="pb-1 px-0">
                      <CardTitle className="text-xs md:text-sm font-semibold group-hover:text-[#0A558C] mb-0.5 truncate">{event.title}</CardTitle>
                      <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600">
                        <Calendar className="h-3 w-3 text-[#0A558C]" />
                        <span>{event.date}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-0 pt-0 pb-1">
                      {event.description && (
                        <CardDescription className="mb-1 text-[10px] md:text-xs text-gray-600 line-clamp-2">{event.description}</CardDescription>
                      )}
                      <div className="flex items-center justify-between text-[10px] md:text-xs">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3 text-gray-400" />{event.attendees} attending</span>
                        <span className="font-semibold text-[#0A558C]">{event.price}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4 text-gray-900">Join Our Community</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Connect with neighbors, share recommendations, and stay updated on local happenings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0A558C] to-[#0A558C] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Connect</h4>
              <p className="text-gray-600 leading-relaxed">
                Build relationships with local business owners and community members
              </p>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Review</h4>
              <p className="text-gray-600 leading-relaxed">
                Share your experiences and help others discover great local spots
              </p>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Discover</h4>
              <p className="text-gray-600 leading-relaxed">
                Stay informed about upcoming events and new business openings
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
