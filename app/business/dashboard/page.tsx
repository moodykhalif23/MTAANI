"use client"

import React from "react"
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
import { TrendingUp, TrendingDown, Star, Calendar, Eye, MessageSquare, Phone, MapPin, Clock, Award, List, BookOpen, Heart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import { SubscriptionManager } from "@/components/subscription-manager"
import { AnalyticsGate } from "@/components/feature-gate"
import Link from "next/link"

// StatCard component for metrics
const StatCard = ({ title, value, change, icon: Icon, prefix = "", suffix = "" }: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  prefix?: string;
  suffix?: string;
}) => (
  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {prefix}
            {value}
            {suffix}
          </p>
          <div className="flex items-center mt-1">
            {change > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${change > 0 ? "text-green-600" : "text-red-600"}`}>
              {Math.abs(change)}% from last week
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

export default function BusinessDashboard() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <AuthHeader />

      {/* Dashboard Header */}
      <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0A558C]">Business Dashboard</h1>
              <p className="text-gray-600">Track your business performance and customer engagement</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Export Report</Button>
              <Link href="/business/pricing">
                <Button>View Plans</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Subscription Management */}
        <div className="mb-8">
          <SubscriptionManager />
        </div>

        {/* Key Metrics */}
        <AnalyticsGate>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Profile Views"
            value={0}
            change={0}
            icon={Eye}
          />
          <StatCard
            title="Customer Reviews"
            value={0}
            change={0}
            icon={MessageSquare}
          />
          <StatCard
            title="Average Rating"
            value={0}
            change={0}
            icon={Star}
            suffix="/5"
          />
          <StatCard
            title="Phone Calls"
            value={0}
            change={0}
            icon={Phone}
          />
          <StatCard
            title="Bookings"
            value={0}
            change={0}
            icon={Calendar}
          />
          </div>
        </AnalyticsGate>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="tools">Business Tools</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsGate>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Chart */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Revenue & Bookings</CardTitle>
                  <CardDescription>Monthly performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#0A558C" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Views Chart */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Profile Views</CardTitle>
                  <CardDescription>Daily views this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#0A558C" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Traffic Sources */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>Where your customers find you</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={[] as { value: number; color: string }[]} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
                        {( [] as { value: number; color: string }[] ).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {([] as { name: string; value: number; color: string }[]).map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                          <span className="text-sm">{source.name}</span>
                        </div>
                        <span className="text-sm font-medium">{source.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Score */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Performance Score</CardTitle>
                  <CardDescription>Overall business health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">85</div>
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Customer Satisfaction</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Response Rate</span>
                        <span>78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Profile Completeness</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/business/menu">
                    <Button className="w-full justify-start" variant="outline">
                      <List className="h-4 w-4 mr-2" />
                      Manage Menu
                    </Button>
                  </Link>
                  <Button className="w-full justify-start" variant="outline">
                    <MapPin className="h-4 w-4 mr-2" />
                    Update Business Hours
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Star className="h-4 w-4 mr-2" />
                    Respond to Reviews
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Bookings
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Award className="h-4 w-4 mr-2" />
                    Promote Business
                  </Button>
                </CardContent>
              </Card>
              </div>
            </AnalyticsGate>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Recent Reviews</CardTitle>
                    <CardDescription>Latest customer feedback</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {([] as { id: number; customer: string; verified: boolean; date: string; rating: number; comment: string }[]).map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{review.customer}</span>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{review.comment}</p>
                          <Button size="sm" variant="outline">
                            Reply
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Review Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#0A558C] mb-1">4.6</div>
                      <div className="flex justify-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < 4.6 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">Based on {0} reviews</p>
                    </div>

                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-sm w-8">{stars}★</span>
                          <Progress
                            value={stars === 5 ? 65 : stars === 4 ? 25 : stars === 3 ? 8 : 2}
                            className="flex-1 h-2"
                          />
                          <span className="text-sm text-gray-500 w-8">
                            {stars === 5 ? "65%" : stars === 4 ? "25%" : stars === 3 ? "8%" : "2%"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Upcoming Bookings</CardTitle>
                  <CardDescription>Your scheduled appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {([] as { id: number; customer: string; service: string; date: string; time: string; status: string }[]).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{booking.customer}</h4>
                          <p className="text-sm text-gray-600">{booking.service}</p>
                          <p className="text-sm text-gray-500">
                            {booking.date} at {booking.time}
                          </p>
                        </div>
                        <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Booking Analytics</CardTitle>
                  <CardDescription>Appointment trends and insights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-[#0A558C]">45</div>
                      <div className="text-sm text-gray-600">This Month</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">38</div>
                      <div className="text-sm text-gray-600">Last Month</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Peak Hours (2-4 PM)</span>
                        <span>35%</span>
                      </div>
                      <Progress value={35} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Weekend Bookings</span>
                        <span>28%</span>
                      </div>
                      <Progress value={28} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Repeat Customers</span>
                        <span>42%</span>
                      </div>
                      <Progress value={42} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="mt-6">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4 text-gray-900">Business Tools</h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Enhance your business with powerful tools designed to help you grow and connect with your community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center p-8 border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Appointment Booking System</h4>
                <p className="text-gray-600 leading-relaxed">
                  Manage bookings online, integrate with calendars, and send notifications to customers
                </p>
                <Link href="/submit-business">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-[#0A558C] hover:bg-blue-50 hover:border-blue-300 mt-4"
                  >
                    Get Started
                  </Button>
                </Link>
              </Card>

              <Card className="text-center p-8 border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <List className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Digital Menu/Catalog Management</h4>
                <p className="text-gray-600 leading-relaxed">
                  Easily manage your menu or catalog, update prices in real-time, and showcase your products online
                </p>
                <Link href="/business/pricing">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-[#0A558C] hover:bg-blue-50 hover:border-blue-300 mt-4"
                  >
                    View Plans
                  </Button>
                </Link>
              </Card>

              <Card className="text-center p-8 border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Loyalty Programs</h4>
                <p className="text-gray-600 leading-relaxed">
                  Retain customers with loyalty programs, track engagement, and reward your best customers
                </p>
                <Link href="/submit-business">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-[#0A558C] hover:bg-blue-50 hover:border-blue-300 mt-4"
                  >
                    Get Started
                  </Button>
                </Link>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Business Insights</CardTitle>
                  <CardDescription>AI-powered recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Your profile views increased by 25% after updating your business hours. Consider adding more
                      photos to boost engagement further.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Star className="h-4 w-4" />
                    <AlertDescription>
                      Customers frequently mention &quot;great coffee&quot; in reviews. Highlight your coffee specialties in your
                      description.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Most customer calls happen between 2-4 PM. Consider having extra staff during these peak hours.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Competitor Analysis</CardTitle>
                  <CardDescription>How you compare to similar businesses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Rating</span>
                      <span>Above Average</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">Your rating: 4.6 vs Industry: 4.2</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Response Rate</span>
                      <span>Good</span>
                    </div>
                    <Progress value={70} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">Your rate: 78% vs Industry: 65%</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Photo Count</span>
                      <span>Below Average</span>
                    </div>
                    <Progress value={40} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">Your photos: 8 vs Industry: 15</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>Update your business details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    Edit Business Profile
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Manage Photos
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Update Contact Info
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Business Hours
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    Notification Settings
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Privacy Settings
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Billing & Subscription
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    API Access
                  </Button>
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
