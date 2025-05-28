"use client"

import { useState } from "react"
import { ArrowLeft, MapPin, Calendar, Clock, Users, Share2, Heart, Ticket, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import ReviewSystem from "@/components/review-system"
import Link from "next/link"

// Mock data - in real app, this would come from props or API
const eventData = {
  id: 1,
  title: "Summer Music Festival",
  category: "Music",
  date: "July 15, 2024",
  time: "6:00 PM - 11:00 PM",
  location: "Central Park Amphitheater",
  address: "100 Park Ave, Downtown",
  attendees: 245,
  maxAttendees: 500,
  price: "Free",
  image: "/placeholder.svg?height=400&width=800",
  organizer: {
    name: "City Events Committee",
    avatar: "/placeholder.svg?height=40&width=40",
    verified: true,
    description:
      "Official city events organizing committee dedicated to bringing quality entertainment to our community.",
  },
  description:
    "Join us for an evening of live music featuring local bands and artists. Food trucks and vendors will be available throughout the event. This family-friendly festival celebrates our local music scene and brings the community together for an unforgettable night.",
  longDescription:
    "The Summer Music Festival is our annual celebration of local talent and community spirit. This year's lineup features over 12 local bands across multiple genres, from indie rock to folk acoustic. The event takes place at our beautiful Central Park Amphitheater with state-of-the-art sound systems and lighting.\n\nFood trucks will offer diverse cuisine options, and local vendors will showcase handmade crafts and artwork. Free parking is available, and the venue is accessible for individuals with disabilities.\n\nSchedule:\n- 6:00 PM: Gates open, vendors and food trucks available\n- 7:00 PM: Opening act - Local Folk Trio\n- 8:00 PM: Main stage performances begin\n- 10:30 PM: Headline act - Thunder Valley Band\n- 11:00 PM: Event concludes",
  tags: ["Outdoor", "Family Friendly", "Live Music", "Food Trucks", "Free Event"],
  images: [
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
  ],
  lineup: [
    { name: "Thunder Valley Band", time: "10:30 PM", genre: "Rock" },
    { name: "Acoustic Dreams", time: "9:00 PM", genre: "Folk" },
    { name: "City Lights", time: "8:00 PM", genre: "Indie" },
    { name: "Local Folk Trio", time: "7:00 PM", genre: "Folk" },
  ],
  amenities: ["Free Parking", "Accessible Venue", "Food Trucks", "Vendor Booths", "Restrooms", "First Aid Station"],
}

const eventReviews = [
  {
    id: 1,
    user: { name: "Jessica Martinez", verified: true },
    rating: 5,
    comment: "Amazing event! Great music, good food, and wonderful atmosphere. Perfect family event.",
    date: "Last year",
    helpful: 24,
    notHelpful: 1,
  },
  {
    id: 2,
    user: { name: "David Thompson", verified: false },
    rating: 4,
    comment: "Really enjoyed the music and food trucks. Gets crowded but that's expected for a free event.",
    date: "Last year",
    helpful: 18,
    notHelpful: 2,
  },
]

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [isRegistered, setIsRegistered] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  const attendeePercentage = (eventData.attendees / eventData.maxAttendees) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/events">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Events
                </Button>
              </Link>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary-foreground" />
                </div>
                <Link href="/" className="font-bold hover:text-primary transition-colors">
                  LocalHub
                </Link>
              </div>
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
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
              <img
                src={eventData.image || "/placeholder.svg"}
                alt={eventData.title}
                className="object-cover w-full h-full"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-primary text-primary-foreground">{eventData.category}</Badge>
              </div>
            </div>
          </div>

          <div>
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{eventData.title}</h1>
                <p className="text-muted-foreground">{eventData.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>{eventData.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{eventData.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{eventData.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
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
              <Button className="w-full" size="lg" onClick={() => setIsRegistered(!isRegistered)}>
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
                        <div key={index} className="aspect-video overflow-hidden rounded border">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Event photo ${index + 1}`}
                            className="object-cover w-full h-full"
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
    </div>
  )
}
