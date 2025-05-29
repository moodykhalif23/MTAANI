"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  Search,
  MapPin,
  Calendar,
  Star,
  Users,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Dumbbell,
  Utensils,
  ShoppingBag,
  Briefcase,
  Music,
  Palette,
  Stethoscope,

} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import Link from "next/link"

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
  },
]

export default function HomePage() {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)
  const carouselRef = useRef<NodeJS.Timeout | null>(null)

  const categories = [
    {
      name: "Restaurants",
      icon: Utensils,
      count: "240+",
      color: "bg-red-500",
      description: "Local dining experiences",
    },
    { name: "Cafés", icon: Coffee, count: "85+", color: "bg-amber-500", description: "Coffee shops & bakeries" },
    { name: "Fitness", icon: Dumbbell, count: "45+", color: "bg-green-500", description: "Gyms & wellness centers" },
    { name: "Shopping", icon: ShoppingBag, count: "180+", color: "bg-purple-500", description: "Retail & boutiques" },
    { name: "Services", icon: Briefcase, count: "320+", color: "bg-blue-500", description: "Professional services" },
    { name: "Healthcare", icon: Stethoscope, count: "95+", color: "bg-teal-500", description: "Medical & wellness" },
    { name: "Entertainment", icon: Music, count: "65+", color: "bg-pink-500", description: "Fun & recreation" },
    { name: "Arts", icon: Palette, count: "40+", color: "bg-indigo-500", description: "Creative & cultural" },
  ]

  const MAX_FEATURED_ITEMS = 12;

  const featuredBusinesses = allFeaturedBusinesses.slice(0, MAX_FEATURED_ITEMS);
  const featuredEvents = allFeaturedEvents.slice(0, MAX_FEATURED_ITEMS);

  // Carousel auto-scroll functionality
  useEffect(() => {
    if (!isCarouselPaused) {
      carouselRef.current = setInterval(() => {
        setCurrentCategoryIndex((prevIndex) => (prevIndex === categories.length - 4 ? 0 : prevIndex + 1))
      }, 3000)
    }

    return () => {
      if (carouselRef.current) {
        clearInterval(carouselRef.current)
      }
    }
  }, [isCarouselPaused, categories.length])

  const handleCategoryClick = (index: number) => {
    setIsCarouselPaused(true)
    setCurrentCategoryIndex(index)
    // Resume after 5 seconds
    setTimeout(() => setIsCarouselPaused(false), 5000)
  }

  const nextCategory = () => {
    setIsCarouselPaused(true)
    setCurrentCategoryIndex((prevIndex) => (prevIndex === categories.length - 4 ? 0 : prevIndex + 1))
    setTimeout(() => setIsCarouselPaused(false), 5000)
  }

  const prevCategory = () => {
    setIsCarouselPaused(true)
    setCurrentCategoryIndex((prevIndex) => (prevIndex === 0 ? categories.length - 4 : prevIndex - 1))
    setTimeout(() => setIsCarouselPaused(false), 5000)
  }

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

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row gap-3 p-3 bg-white rounded-2xl shadow-2xl border border-gray-100 backdrop-blur">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search businesses, events, or services..."
                  className="pl-12 border-0 focus-visible:ring-0 text-lg h-14 bg-transparent"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Enter your location..."
                  className="pl-12 border-0 focus-visible:ring-0 text-lg h-14 bg-transparent"
                />
              </div>
              <Button
                size="lg"
                className="px-8 h-14 bg-[#0A558C] hover:bg-[#084b7c] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Search
              </Button>
            </div>
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

      {/* Categories Carousel Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 text-gray-900">Browse by Category</h3>
            <p className="text-lg text-gray-600">Explore local businesses and services by category</p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Carousel Container */}
            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentCategoryIndex * 25}%)` }}
              >
                {categories.map((category, index) => {
                  const IconComponent = category.icon
                  return (
                    <div key={index} className="w-1/4 flex-shrink-0 px-3" onClick={() => handleCategoryClick(index)}>
                      <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white/90 backdrop-blur h-full">
                        <CardContent className="p-6 text-center">
                          <div
                            className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                          >
                            <IconComponent className="h-8 w-8 text-white" />
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#0A558C] transition-colors">
                            {category.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                          <Badge variant="secondary" className="bg-blue-100 text-[#0A558C] font-semibold">
                            {category.count}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur border-gray-200 hover:bg-white hover:shadow-lg z-10"
              onClick={prevCategory}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur border-gray-200 hover:bg-white hover:shadow-lg z-10"
              onClick={nextCategory}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Carousel Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: categories.length - 3 }).map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentCategoryIndex ? "bg-[#0A558C] scale-110" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  onClick={() => handleCategoryClick(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses & Events Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredBusinesses.map((business) => (
                  <Card
                    key={business.id}
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur relative"
                  >
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
                        ⭐ Featured
                      </Badge>
                    </div>
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={business.image || "/placeholder.svg"}
                        alt={business.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-[#0A558C] transition-colors duration-200 mb-2">
                            {business.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 text-[#0A558C]" />
                            <span className="text-sm font-medium">{business.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-gray-900">{business.rating}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <CardDescription className="mb-4 text-gray-600 leading-relaxed">
                        {business.description}
                      </CardDescription>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 font-medium">{business.reviews} reviews</span>
                        <Link href={`/businesses/${business.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-[#0A558C] hover:bg-blue-50 hover:border-blue-300"
                          >
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur relative"
                  >
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                        🎉 Featured
                      </Badge>
                    </div>
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl group-hover:text-[#0A558C] transition-colors duration-200 mb-3">
                        {event.title}
                      </CardTitle>
                      <div className="flex items-center gap-6 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#0A558C]" />
                          <span className="text-sm font-medium">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#0A558C]" />
                          <span className="text-sm font-medium">{event.time}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin className="h-4 w-4 text-[#0A558C]" />
                        <span className="text-sm font-medium">{event.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 font-medium">{event.attendees} attending</span>
                        </div>
                        <div className="text-sm font-semibold text-[#0A558C]">{event.price}</div>
                      </div>
                      <div className="mt-4">
                        <Link href={`/events/${event.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-blue-200 text-[#0A558C] hover:bg-blue-50 hover:border-blue-300"
                          >
                            Learn More
                          </Button>
                        </Link>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredBusinesses.map((business) => (
                  <Card
                    key={business.id}
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={business.image || "/placeholder.svg"}
                        alt={business.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Badge className="absolute top-4 left-4 bg-white/95 text-gray-800 font-medium shadow-lg border-0 hover:bg-white">
                        {business.category}
                      </Badge>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-[#0A558C] transition-colors duration-200 mb-2">
                            {business.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 text-[#0A558C]" />
                            <span className="text-sm font-medium">{business.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-gray-900">{business.rating}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4 text-gray-600 leading-relaxed">
                        {business.description}
                      </CardDescription>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 font-medium">{business.reviews} reviews</span>
                        <Link href={`/businesses/${business.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-[#0A558C] hover:bg-blue-50 hover:border-blue-300"
                          >
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl group-hover:text-[#0A558C] transition-colors duration-200 mb-3">
                        {event.title}
                      </CardTitle>
                      <div className="flex items-center gap-6 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#0A558C]" />
                          <span className="text-sm font-medium">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#0A558C]" />
                          <span className="text-sm font-medium">{event.time}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin className="h-4 w-4 text-[#0A558C]" />
                        <span className="text-sm font-medium">{event.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 font-medium">{event.attendees} attending</span>
                        </div>
                        <div className="text-sm font-semibold text-[#0A558C]">{event.price}</div>
                      </div>
                      <div className="mt-4">
                        <Link href={`/events/${event.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-blue-200 text-[#0A558C] hover:bg-blue-50 hover:border-blue-300"
                          >
                            Learn More
                          </Button>
                        </Link>
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
