"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Share2,
  MessageSquare,
  Clock,
  Star,
  Download,
  Edit,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function EventManagePage() {
  const [selectedEvent, setSelectedEvent] = useState("summer-festival")

  // Mock data for event analytics
  const eventStats = {
    totalAttendees: 487,
    attendeesChange: 23.5,
    registrations: 542,
    registrationsChange: 18.2,
    shares: 156,
    sharesChange: 45.8,
    engagement: 78,
    engagementChange: 12.1,
    revenue: 12450,
    revenueChange: 28.7,
  }

  const registrationData = [
    { day: "Day 1", registrations: 45 },
    { day: "Day 2", registrations: 67 },
    { day: "Day 3", registrations: 89 },
    { day: "Day 4", registrations: 123 },
    { day: "Day 5", registrations: 98 },
    { day: "Day 6", registrations: 76 },
    { day: "Day 7", registrations: 44 },
  ]

  const attendeeData = [
    { week: "Week 1", confirmed: 120, pending: 45 },
    { week: "Week 2", confirmed: 180, pending: 32 },
    { week: "Week 3", confirmed: 245, pending: 28 },
    { week: "Week 4", confirmed: 320, pending: 22 },
    { week: "Current", confirmed: 487, pending: 55 },
  ]

  const demographicsData = [
    { name: "18-25", value: 35, color: "#0088FE" },
    { name: "26-35", value: 28, color: "#00C49F" },
    { name: "36-45", value: 22, color: "#FFBB28" },
    { name: "46+", value: 15, color: "#FF8042" },
  ]

  const trafficSources = [
    { name: "Social Media", value: 45, color: "#0088FE" },
    { name: "Direct Link", value: 25, color: "#00C49F" },
    { name: "Email Campaign", value: 20, color: "#FFBB28" },
    { name: "Word of Mouth", value: 10, color: "#FF8042" },
  ]

  const recentFeedback = [
    {
      id: 1,
      attendee: "Sarah Johnson",
      rating: 5,
      comment: "Amazing event! Great organization and fantastic lineup.",
      date: "2 hours ago",
      verified: true,
    },
    {
      id: 2,
      attendee: "Mike Chen",
      rating: 4,
      comment: "Really enjoyed the event. Food trucks were a nice touch.",
      date: "5 hours ago",
      verified: true,
    },
    {
      id: 3,
      attendee: "Emma Davis",
      rating: 5,
      comment: "Best community event I've attended. Will definitely come next year!",
      date: "1 day ago",
      verified: false,
    },
  ]

  const topPerformers = [
    { name: "Main Stage Performance", engagement: 95, attendees: 450 },
    { name: "Food Truck Area", engagement: 87, attendees: 380 },
    { name: "Kids Zone", engagement: 82, attendees: 120 },
    { name: "Vendor Booths", engagement: 76, attendees: 290 },
  ]

  const myEvents = [
    {
      id: "summer-festival",
      name: "Summer Music Festival",
      date: "July 15, 2024",
      status: "active",
      attendees: 487,
      capacity: 500,
    },
    {
      id: "food-fair",
      name: "Local Food Fair",
      date: "August 20, 2024",
      status: "upcoming",
      attendees: 234,
      capacity: 300,
    },
    {
      id: "art-walk",
      name: "Community Art Walk",
      date: "June 10, 2024",
      status: "completed",
      attendees: 156,
      capacity: 200,
    },
  ]

  const StatCard = ({ title, value, change, icon: Icon, prefix = "", suffix = "" }) => (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {prefix}
              {typeof value === "number" ? value.toLocaleString() : value}
              {suffix}
            </p>
            <div className="flex items-center mt-1">
              {change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${change > 0 ? "text-green-600" : "text-red-600"}`}>
                {Math.abs(change)}% from last event
              </span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Analytics</h1>
              <p className="text-gray-600">Track your event performance and attendee engagement</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Event Selector */}
        <div className="mb-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">My Events</h2>
                <Button size="sm">Create New Event</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {myEvents.map((event) => (
                  <Card
                    key={event.id}
                    className={`cursor-pointer transition-all ${
                      selectedEvent === event.id ? "ring-2 ring-blue-500 shadow-md" : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedEvent(event.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{event.name}</h3>
                        <Badge
                          variant={
                            event.status === "active"
                              ? "default"
                              : event.status === "upcoming"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{event.date}</p>
                      <div className="flex justify-between text-sm">
                        <span>{event.attendees} attendees</span>
                        <span>{Math.round((event.attendees / event.capacity) * 100)}% capacity</span>
                      </div>
                      <Progress value={(event.attendees / event.capacity) * 100} className="mt-2 h-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Attendees"
            value={eventStats.totalAttendees}
            change={eventStats.attendeesChange}
            icon={Users}
          />
          <StatCard
            title="Registrations"
            value={eventStats.registrations}
            change={eventStats.registrationsChange}
            icon={Calendar}
          />
          <StatCard title="Social Shares" value={eventStats.shares} change={eventStats.sharesChange} icon={Share2} />
          <StatCard
            title="Engagement Rate"
            value={eventStats.engagement}
            change={eventStats.engagementChange}
            icon={MessageSquare}
            suffix="%"
          />
          <StatCard
            title="Revenue"
            value={eventStats.revenue}
            change={eventStats.revenueChange}
            icon={TrendingUp}
            prefix="$"
          />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Registration Trends */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Registration Trends</CardTitle>
                  <CardDescription>Daily registration activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={registrationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="registrations" stroke="#0A558C" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Attendee Growth */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Attendee Growth</CardTitle>
                  <CardDescription>Confirmed vs pending attendees</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendeeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="confirmed" fill="#0A558C" />
                      <Bar dataKey="pending" fill="#94A3B8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Demographics */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Age Demographics</CardTitle>
                  <CardDescription>Attendee age distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={demographicsData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
                        {demographicsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {demographicsData.map((demo, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: demo.color }} />
                          <span className="text-sm">{demo.name}</span>
                        </div>
                        <span className="text-sm font-medium">{demo.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Traffic Sources */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Registration Sources</CardTitle>
                  <CardDescription>How people found your event</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trafficSources.map((source, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{source.name}</span>
                          <span>{source.value}%</span>
                        </div>
                        <Progress value={source.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Top Performing Areas</CardTitle>
                  <CardDescription>Most popular event sections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformers.map((performer, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{performer.name}</span>
                          <span>{performer.engagement}%</span>
                        </div>
                        <Progress value={performer.engagement} className="h-2" />
                        <div className="text-xs text-gray-500">{performer.attendees} attendees</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendees" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Attendee List</CardTitle>
                  <CardDescription>Registered participants</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Sarah Johnson", email: "sarah@example.com", status: "confirmed", checkedIn: true },
                      { name: "Mike Chen", email: "mike@example.com", status: "confirmed", checkedIn: true },
                      { name: "Emma Davis", email: "emma@example.com", status: "pending", checkedIn: false },
                      { name: "John Smith", email: "john@example.com", status: "confirmed", checkedIn: false },
                    ].map((attendee, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{attendee.name}</p>
                            <p className="text-sm text-gray-600">{attendee.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={attendee.status === "confirmed" ? "default" : "secondary"}>
                            {attendee.status}
                          </Badge>
                          {attendee.checkedIn && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Checked In
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Check-in Analytics</CardTitle>
                  <CardDescription>Real-time attendance tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">342</div>
                      <div className="text-sm text-gray-600">Checked In</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">145</div>
                      <div className="text-sm text-gray-600">Not Yet</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Check-in Rate</span>
                      <span>70%</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>

                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Peak check-in time was 6:30 PM with 45 attendees checking in within 15 minutes.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Social Media Engagement</CardTitle>
                  <CardDescription>Event social media performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">156</div>
                      <div className="text-sm text-gray-600">Shares</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">89</div>
                      <div className="text-sm text-gray-600">Comments</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">234</div>
                      <div className="text-sm text-gray-600">Likes</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Facebook Reach</span>
                        <span>2,340</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Instagram Engagement</span>
                        <span>1,890</span>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Twitter Mentions</span>
                        <span>456</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Event Page Analytics</CardTitle>
                  <CardDescription>Website and page performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">3,456</div>
                      <div className="text-sm text-gray-600">Page Views</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">2:34</div>
                      <div className="text-sm text-gray-600">Avg. Time</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Conversion Rate</span>
                        <span>15.7%</span>
                      </div>
                      <Progress value={15.7} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Bounce Rate</span>
                        <span>32%</span>
                      </div>
                      <Progress value={32} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Mobile Traffic</span>
                        <span>68%</span>
                      </div>
                      <Progress value={68} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Recent Feedback</CardTitle>
                    <CardDescription>What attendees are saying</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentFeedback.map((feedback) => (
                        <div key={feedback.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{feedback.attendee}</span>
                              {feedback.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{feedback.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">{feedback.comment}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Feedback Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">4.7</div>
                      <div className="flex justify-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < 4.7 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">Based on 89 reviews</p>
                    </div>

                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-sm w-8">{stars}★</span>
                          <Progress
                            value={stars === 5 ? 72 : stars === 4 ? 18 : stars === 3 ? 7 : stars === 2 ? 2 : 1}
                            className="flex-1 h-2"
                          />
                          <span className="text-sm text-gray-500 w-8">
                            {stars === 5 ? "72%" : stars === 4 ? "18%" : stars === 3 ? "7%" : stars === 2 ? "2%" : "1%"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Event Insights</CardTitle>
                  <CardDescription>AI-powered recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Your event had 23% higher attendance than similar events in your area. Consider hosting more
                      frequent events.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      Peak attendance was between 7-9 PM. Schedule key activities during these hours for maximum
                      engagement.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Share2 className="h-4 w-4" />
                    <AlertDescription>
                      Social media posts with event photos received 45% more engagement. Share more visual content next
                      time.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Success Metrics</CardTitle>
                  <CardDescription>How your event performed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Attendance Rate</span>
                      <span>Excellent</span>
                    </div>
                    <Progress value={90} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">487 attended out of 542 registered (90%)</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Satisfaction Score</span>
                      <span>Outstanding</span>
                    </div>
                    <Progress value={94} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">4.7/5 average rating</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Social Engagement</span>
                      <span>Very Good</span>
                    </div>
                    <Progress value={78} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">156 shares, 234 likes, 89 comments</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>ROI</span>
                      <span>Good</span>
                    </div>
                    <Progress value={68} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">$12,450 revenue vs $8,200 costs</p>
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
