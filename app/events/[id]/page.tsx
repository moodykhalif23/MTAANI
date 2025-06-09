"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowLeft, MapPin, Calendar, Clock, Users, Share2, Heart, Ticket, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import ReviewSystem from "@/components/review-system"
import Link from "next/link"

interface Organizer {
  name: string
  avatar?: string
  verified: boolean
  description: string
}

interface LineupAct {
  name: string
  role?: string
  genre?: string
  time?: string
}

interface Event {
  id: number 
  title: string
  description: string
  longDescription: string
  category: string
  image?: string
  date: string
  time: string
  location: string
  address: string
  attendees: number
  maxAttendees: number
  price: string
  organizer: Organizer
  tags: string[]
  images: string[]
  lineup: LineupAct[]
  amenities: string[]
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [isRegistered, setIsRegistered] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [eventData, setEventData] = useState<Event | null>(null)
  const [eventReviews, setEventReviews] = useState<Array<{
    id: number
    user: {
      name: string
      avatar?: string
      verified: boolean
    }
    rating: number
    comment: string
    date: string
    helpful: number
    notHelpful: number
    images?: string[]
  }>>([])

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setEventData({
            ...data.data?.event,
            id: parseInt(data.data?.event?.id, 10)
          } as Event)
          setEventReviews(data.data?.reviews || [])
        }      } catch {
        setEventData(null)
        setEventReviews([])
      }
    }
    fetchEvent()
  }, [params.id])

  if (!eventData) return null

  const attendeePercentage = eventData.maxAttendees ? (eventData.attendees / eventData.maxAttendees) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />

      {/* Breadcrumb Header */}
      <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/events">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Events
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
                src={eventData.image || "/placeholder.svg"}
                alt={eventData.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-primary text-primary-foreground">{eventData.category}</Badge>
              </div>
            </div>
          </div>

          <div>
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-[#0A558C]">{eventData.title}</h1>
                <p className="text-muted-foreground">{eventData.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[#0A558C]" />
                  <span>{eventData.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[#0A558C]" />
                  <span>{eventData.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#0A558C]" />
                  <span>{eventData.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#0A558C]" />
                  <span>{eventData.attendees} attending</span>
                </div>
              </div>

              {/* Attendee Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Event Capacity</span>
                  <span>
                    {eventData.attendees}/{eventData.maxAttendees}
                  </span>
                </div>
                <Progress value={attendeePercentage} className="h-2" />
              </div>

              {/* Price */}
              <div className="text-center py-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{eventData.price}</div>
                <div className="text-sm text-muted-foreground">Admission</div>
              </div>

              {/* Register Button */}
              <Button className="w-full bg-[#0A558C] hover:bg-[#084b7c]" size="lg" onClick={() => setIsRegistered(!isRegistered)}>
                <Ticket className="h-4 w-4 mr-2" />
                {isRegistered ? "Registered ✓" : "Register for Event"}
              </Button>

              {/* Organizer */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={eventData.organizer.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{eventData.organizer.name}</span>
                        {eventData.organizer.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">Event Organizer</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="lineup">Lineup</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      {eventData.longDescription.split("\n").map((paragraph, index) => (
                        <p key={index} className="mb-4 text-muted-foreground whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {eventData.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {eventData.images.map((image, index) => (
                        <div key={index} className="aspect-video overflow-hidden rounded border relative">
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`Event photo ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="font-medium mb-1">Date & Time</div>
                      <div className="text-muted-foreground">{eventData.date}</div>
                      <div className="text-muted-foreground">{eventData.time}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Location</div>
                      <div className="text-muted-foreground">{eventData.location}</div>
                      <div className="text-muted-foreground">{eventData.address}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Organizer</div>
                      <div className="text-muted-foreground">{eventData.organizer.name}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lineup" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Event Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eventData.lineup.map((act, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{act.name}</h4>
                          <p className="text-sm text-muted-foreground">{act.genre}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{act.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-8">
            <ReviewSystem eventId={eventData.id} reviews={eventReviews} averageRating={4.5} totalReviews={42} />
          </TabsContent>

          <TabsContent value="info" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organizer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={eventData.organizer.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{eventData.organizer.name}</span>
                        {eventData.organizer.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{eventData.organizer.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Amenities & Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {eventData.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm">{amenity}</span>
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
