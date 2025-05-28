"use client"

import { useState } from "react"
import {
  MapPin,
  Users,
  MessageSquare,
  Calendar,
  Star,
  TrendingUp,
  Heart,
  Share2,
  Search,
  Filter,
  Plus,
  Clock,
  Eye,
  ThumbsUp,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("discussions")
  const [searchQuery, setSearchQuery] = useState("")

  const discussions = [
    {
      id: 1,
      title: "Best coffee shops for remote work?",
      author: {
        name: "Sarah Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
      },
      category: "Recommendations",
      replies: 23,
      likes: 45,
      views: 234,
      timeAgo: "2 hours ago",
      excerpt:
        "Looking for coffee shops with reliable WiFi and quiet atmosphere for working remotely. Any suggestions?",
      tags: ["Coffee", "Remote Work", "WiFi"],
    },
    {
      id: 2,
      title: "New restaurant opening on Main Street",
      author: {
        name: "Mike Chen",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: false,
      },
      category: "News",
      replies: 12,
      likes: 28,
      views: 156,
      timeAgo: "4 hours ago",
      excerpt:
        "Spotted construction finishing up at the old bookstore location. Looks like it's going to be a Thai restaurant!",
      tags: ["Restaurant", "Main Street", "Thai Food"],
    },
    {
      id: 3,
      title: "Community garden volunteer opportunities",
      author: {
        name: "Emma Davis",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
      },
      category: "Volunteer",
      replies: 8,
      likes: 19,
      views: 89,
      timeAgo: "6 hours ago",
      excerpt: "The downtown community garden is looking for volunteers to help with the summer planting season.",
      tags: ["Volunteer", "Garden", "Community"],
    },
    {
      id: 4,
      title: "Lost dog near Riverside Park",
      author: {
        name: "David Wilson",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: false,
      },
      category: "Lost & Found",
      replies: 15,
      likes: 67,
      views: 445,
      timeAgo: "8 hours ago",
      excerpt: "Golden retriever named Max went missing yesterday evening. Last seen near the playground area.",
      tags: ["Lost Pet", "Riverside Park", "Golden Retriever"],
    },
  ]

  const localNews = [
    {
      id: 1,
      title: "City Council Approves New Bike Lane Project",
      summary: "The new bike lanes will connect downtown to the university district, improving safety for cyclists.",
      timeAgo: "1 day ago",
      category: "Transportation",
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: 2,
      title: "Annual Summer Festival Planning Underway",
      summary: "Organizers are seeking local vendors and performers for this year's biggest community event.",
      timeAgo: "2 days ago",
      category: "Events",
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: 3,
      title: "New Public Library Branch Opens",
      summary: "The westside branch features modern study spaces, maker lab, and expanded children's section.",
      timeAgo: "3 days ago",
      category: "Education",
      image: "/placeholder.svg?height=100&width=150",
    },
  ]

  const communityStats = [
    { label: "Active Members", value: "15,234", icon: Users, color: "text-blue-600" },
    { label: "Discussions", value: "2,847", icon: MessageSquare, color: "text-green-600" },
    { label: "Local Events", value: "89", icon: Calendar, color: "text-purple-600" },
    { label: "Business Reviews", value: "5,692", icon: Star, color: "text-yellow-600" },
  ]

  const categories = [
    "All Categories",
    "Recommendations",
    "News",
    "Events",
    "Lost & Found",
    "Volunteer",
    "Buy & Sell",
    "General Discussion",
  ]

  const filteredDiscussions = discussions.filter((discussion) => {
    const matchesSearch =
      discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
              >
                LocalHub
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                href="/businesses"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                Businesses
              </Link>
              <Link
                href="/events"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                Events
              </Link>
              <Link
                href="/calendar"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                Calendar
              </Link>
              <Link href="/community" className="text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                Community
              </Link>
            </nav>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                Sign In
              </Button>
              <Link href="/submit-business">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  List Your Business
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Community Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect with your neighbors, share local insights, and stay informed about what's happening in your
            community
          </p>

          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {communityStats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100"
              >
                <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <TabsList className="grid w-full lg:w-auto grid-cols-3 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger
                value="discussions"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Discussions
              </TabsTrigger>
              <TabsTrigger
                value="news"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Local News
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="discussions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Discussions */}
              <div className="lg:col-span-2 space-y-6">
                {filteredDiscussions.map((discussion) => (
                  <Card
                    key={discussion.id}
                    className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={discussion.author.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{discussion.author.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">{discussion.author.name}</span>
                              {discussion.author.verified && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                  Verified
                                </Badge>
                              )}
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">{discussion.timeAgo}</span>
                            </div>
                            <CardTitle className="text-xl mb-2 hover:text-blue-600 transition-colors cursor-pointer">
                              {discussion.title}
                            </CardTitle>
                            <CardDescription className="text-gray-600 leading-relaxed">
                              {discussion.excerpt}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {discussion.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {discussion.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{discussion.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{discussion.replies} replies</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{discussion.views} views</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Heart className="h-4 w-4 mr-1" />
                            Like
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">Popular Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        "Local Restaurants",
                        "Community Events",
                        "Lost & Found",
                        "Recommendations",
                        "Volunteer Opportunities",
                      ].map((topic) => (
                        <div
                          key={topic}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <span className="text-sm font-medium text-gray-700">{topic}</span>
                          <Badge variant="secondary" className="text-xs">
                            {Math.floor(Math.random() * 50) + 10}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">Community Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Be respectful and kind to all members</li>
                      <li>• Keep discussions relevant to our local community</li>
                      <li>• No spam or self-promotion without context</li>
                      <li>• Help keep our community safe and welcoming</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="news">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localNews.map((article) => (
                <Card
                  key={article.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={article.image || "/placeholder.svg"}
                      alt={article.title}
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-4 left-4 bg-white/95 text-gray-800">{article.category}</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg hover:text-blue-600 transition-colors cursor-pointer">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">{article.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{article.timeAgo}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Read More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <div className="max-w-2xl mx-auto">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl">Create a New Post</CardTitle>
                  <CardDescription>
                    Share something with your community - ask questions, share news, or start a discussion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title">Post Title</Label>
                    <Input id="title" placeholder="What would you like to discuss?" className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map((category) => (
                          <SelectItem key={category} value={category.toLowerCase()}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Share your thoughts, ask questions, or provide information..."
                      className="mt-1 min-h-[120px]"
                    />
                  </div>

                  <div>
                    <Label>Tags (optional)</Label>
                    <Input placeholder="Add tags separated by commas" className="mt-1" />
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      Publish Post
                    </Button>
                    <Button variant="outline">Save Draft</Button>
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
