"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, MapPin, Calendar, Clock, Users, Share2, Heart, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LocationButton } from "@/components/location-button"
import { addDistanceToItems, formatDistance } from "@/lib/location-utils"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()

        if (selectedCategory && selectedCategory !== 'all') {
          params.append('category', selectedCategory)
        }
        params.append('limit', '50')

        const response = await fetch(`/api/events?${params.toString()}`)

        if (response.ok) {
          const data = await response.json()
          const eventList = data.data?.events || []

          // Transform API data to match component expectations
          const transformedEvents = eventList.map((event: any) => ({
            id: event.id,
            title: event.title,
            category: event.category,
            date: new Date(event.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}`,
            location: event.location,
            address: event.address || event.location,
            attendees: Math.floor(Math.random() * 200) + 10, // Simulated for now
            maxAttendees: event.maxAttendees ? parseInt(event.maxAttendees) : null,
            price: event.isFree ? 'Free' : (event.ticketPrice || 'TBD'),
            image: event.images?.[0] || "/placeholder.svg?height=200&width=400",
            organizer: {
              name: event.organizerName,
              avatar: "/placeholder.svg?height=40&width=40",
            },
            description: event.description,
            tags: event.tags || [],
            featured: Math.random() > 0.7, // Random featured status for now
          }))

          setEvents(transformedEvents)
        } else {
          throw new Error('Failed to fetch events')
        }
      } catch (err) {
        console.error('Error fetching events:', err)
        setError('Failed to load events')
        // Fallback to empty array
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [selectedCategory])

  // Add calculated distances when user location is available
  const eventsWithDistance = useMemo(() => {
    if (userLocation) {
      return addDistanceToItems(events, userLocation.lat, userLocation.lng)
    }
    return events.map((event) => ({ ...event, calculatedDistance: null }))
  }, [userLocation])

  const filteredEvents = eventsWithDistance.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || event.category.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const featuredEvents = filteredEvents.filter((event) => event.featured)
  const regularEvents = filteredEvents.filter((event) => !event.featured)

  // Sort events by distance when location is available
  const sortEventsByDistance = (eventList: typeof filteredEvents) => {
    if (userLocation) {
      return [...eventList].sort((a, b) => {
        if (a.calculatedDistance !== null && b.calculatedDistance !== null) {
          return a.calculatedDistance - b.calculatedDistance
        }
        return 0
      })
    }
    return eventList
  }

  const handleLocationUpdate = (lat: number, lng: number) => {
    setUserLocation({ lat, lng })
  }

  const handleLocationClear = () => {
    setUserLocation(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <AuthHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#0A558C]">
            Discover Local Events
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            From community gatherings to professional networking, find events that bring our community together
          </p>
          {userLocation && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
              <Navigation className="h-4 w-4" />
              <span>Showing events near your location</span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events..."
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
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="arts">Arts</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="food">Food</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="When" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredEvents.length} events
              {userLocation && " near you"}
            </p>
            <div className="hidden lg:flex items-center space-x-4">
              <span className="text-sm text-gray-600">Quick Filters:</span>
              <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 hover:text-blue-800">
                Free Events
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 hover:text-blue-800">
                This Weekend
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 hover:text-blue-800">
                Family Friendly
              </Badge>
              {userLocation && (
                <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 hover:text-blue-800">
                  Within 5 Miles
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger
              value="featured"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
            >
              Featured Events
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
            >
              All Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="featured">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading events...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Error loading events</h3>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : featuredEvents.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {sortEventsByDistance(featuredEvents).map((event) => (
                  <Card
                    key={event.id}
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                          Featured
                        </Badge>
                        <Badge variant="secondary" className="bg-white/95 text-gray-800 shadow-lg">
                          {event.category}
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4 flex gap-2">
                        {userLocation && event.calculatedDistance !== null && (
                          <Badge className="bg-green-500 text-white shadow-lg">
                            {formatDistance(event.calculatedDistance)}
                          </Badge>
                        )}
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 hover:bg-white">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 hover:bg-white">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-200 mb-3">
                            {event.title}
                          </CardTitle>
                          <div className="flex items-center gap-6 text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">{event.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-semibold text-blue-600">{event.price}</div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <CardDescription className="line-clamp-2 text-gray-600 leading-relaxed">
                        {event.description}
                      </CardDescription>

                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{event.location}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{event.organizer.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600 font-medium">{event.organizer.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="h-4 w-4 text-blue-500" />
                          {event.attendees} attending
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {event.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-gray-300 text-gray-700">
                            {tag}
                          </Badge>
                        ))}
                        {event.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                            +{event.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                          Register
                        </Button>
                        <Link href={`/events/${event.id}`}>
                          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                            Learn More
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">No featured events found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading events...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Error loading events</h3>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortEventsByDistance(filteredEvents).map((event) => (
                <Card
                  key={event.id}
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-white/95 text-gray-800 shadow-lg">
                        {event.category}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-2">
                      {userLocation && event.calculatedDistance !== null && (
                        <Badge className="bg-green-500 text-white shadow-lg">
                          {formatDistance(event.calculatedDistance)}
                        </Badge>
                      )}
                      {event.featured && (
                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors duration-200 mb-3">
                      {event.title}
                    </CardTitle>
                    <div className="flex items-center gap-6 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{event.time.split(" - ")[0]}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <CardDescription className="line-clamp-2 text-gray-600 leading-relaxed">
                      {event.description}
                    </CardDescription>

                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium truncate">{event.location}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-4 w-4 text-blue-500" />
                        {event.attendees} attending
                      </div>
                      <div className="text-sm font-semibold text-blue-600">{event.price}</div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Register
                      </Button>
                      <Link href={`/events/${event.id}`}>
                        <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">No events found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
          >
            Load More Events
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
