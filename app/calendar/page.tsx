"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon, MapPin, Clock, Users, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function EventCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState("month")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Sample events data
  const events = [
    {
      id: 1,
      title: "Summer Music Festival",
      date: "2024-07-15",
      time: "6:00 PM",
      category: "Music",
      location: "Central Park",
      attendees: 245,
      color: "bg-blue-500",
    },
    {
      id: 2,
      title: "Local Farmers Market",
      date: "2024-07-13",
      time: "8:00 AM",
      category: "Community",
      location: "Main Street",
      attendees: 89,
      color: "bg-green-500",
    },
    {
      id: 3,
      title: "Art Gallery Opening",
      date: "2024-07-18",
      time: "6:00 PM",
      category: "Arts",
      location: "Downtown Gallery",
      attendees: 34,
      color: "bg-purple-500",
    },
    {
      id: 4,
      title: "Business Networking",
      date: "2024-07-20",
      time: "7:00 PM",
      category: "Business",
      location: "Chamber of Commerce",
      attendees: 67,
      color: "bg-orange-500",
    },
    {
      id: 5,
      title: "Community Yoga",
      date: "2024-07-16",
      time: "7:00 AM",
      category: "Health",
      location: "Riverside Park",
      attendees: 28,
      color: "bg-teal-500",
    },
    {
      id: 6,
      title: "Food Truck Rally",
      date: "2024-07-22",
      time: "11:00 AM",
      category: "Food",
      location: "City Hall Plaza",
      attendees: 156,
      color: "bg-red-500",
    },
  ]

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "music", label: "Music" },
    { value: "community", label: "Community" },
    { value: "arts", label: "Arts" },
    { value: "business", label: "Business" },
    { value: "health", label: "Health" },
    { value: "food", label: "Food" },
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    if (!date) return []
    const dateString = date.toISOString().split("T")[0]
    return events.filter((event) => {
      const eventDate = event.date
      const matchesDate = eventDate === dateString
      const matchesCategory = selectedCategory === "all" || event.category.toLowerCase() === selectedCategory
      return matchesDate && matchesCategory
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const days = getDaysInMonth(currentDate)
  const today = new Date()

  const filteredEvents = events.filter(
    (event) => selectedCategory === "all" || event.category.toLowerCase() === selectedCategory,
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <AuthHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#0A558C]">
              Event Calendar
            </h1>
            <p className="text-xl text-gray-600">Discover upcoming events in your community</p>
          </div>

          <Tabs value={view} onValueChange={setView} className="w-full">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
              <TabsList className="grid w-full lg:w-auto grid-cols-2 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger
                  value="month"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
                >
                  Month View
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
                >
                  List View
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-blue-500">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={goToToday}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  Today
                </Button>
              </div>
            </div>

            <TabsContent value="month">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
                <CardHeader className="border-b bg-gradient-to-r from-[#0A558C] to-[#084b7c] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        {filteredEvents.length} events this month
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth("prev")}
                        className="text-white hover:bg-white/20"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth("next")}
                        className="text-white hover:bg-white/20"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 border-b bg-gray-50">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="p-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7">
                    {days.map((day, index) => {
                      const dayEvents = day ? getEventsForDate(day) : []
                      const isToday = day && day.toDateString() === today.toDateString()
                      const isCurrentMonth = day && day.getMonth() === currentDate.getMonth()

                      return (
                        <div
                          key={index}
                          className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                            !isCurrentMonth ? "bg-gray-50" : "bg-white hover:bg-gray-50"
                          } transition-colors`}
                        >
                          {day && (
                            <>
                              <div
                                className={`text-sm font-medium mb-1 ${
                                  isToday
                                    ? "w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center"
                                    : isCurrentMonth
                                      ? "text-gray-900"
                                      : "text-gray-400"
                                }`}
                              >
                                {day.getDate()}
                              </div>
                              <div className="space-y-1">
                                {dayEvents.slice(0, 2).map((event) => (
                                  <Link key={event.id} href={`/events/${event.id}`}>
                                    <div
                                      className={`text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 transition-opacity ${event.color}`}
                                    >
                                      <div className="font-medium truncate">{event.title}</div>
                                      <div className="opacity-90">{event.time}</div>
                                    </div>
                                  </Link>
                                ))}
                                {dayEvents.length > 2 && (
                                  <div className="text-xs text-gray-500 font-medium">+{dayEvents.length - 2} more</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="list">
              <div className="space-y-6">
                {filteredEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEvents.map((event) => (
                      <Card
                        key={event.id}
                        className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group bg-white/80 backdrop-blur border-0 shadow-lg"
                      >
                        <div className={`h-2 ${event.color}`} />
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors leading-tight mb-2">
                                {event.title}
                              </CardTitle>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                {event.category}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">
                              {new Date(event.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span>{event.time}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span className="truncate">{event.location}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>{event.attendees} attending</span>
                          </div>

                          <div className="pt-3">
                            <Link href={`/events/${event.id}`}>
                              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12 bg-white/80 backdrop-blur border-0 shadow-lg">
                    <CardContent>
                      <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
                      <p className="text-gray-600 mb-6">There are no events matching your current filters.</p>
                      <Link href="/submit-event">
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                          Create an Event
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  )
}
