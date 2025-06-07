"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users,
  Building2,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Shield,
  DollarSign,
  Activity,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Bell,
  Zap,
  Database,
  Server,
  Wifi,
  HardDrive,
  CreditCard,
  Target,
  Gauge,
  AlertCircle,
  CheckSquare,
  RefreshCw,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart as RechartsLineChart, Line } from "recharts"


// Admin token for API calls
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_TOKEN || process.env.ADMIN_DASHBOARD_TOKEN || 'dev_admin_dashboard_token_2024_secure'

interface PendingBusiness {
  id: string
  name: string
  category: string
  status: string
  contact: {
    email: string
  }
  createdAt: string
}

interface PendingEvent {
  id: string
  title: string
  category: string
  status: string
  organizerEmail: string
  submittedAt: string
}

interface SecurityData {
  activeThreats?: {
    blockedIPs?: number
    suspiciousUsers?: number
  }
  analytics?: {
    eventsByType?: {
      feature_bypass_attempt?: number
    }
    threatLevel?: string
  }
  criticalEvents?: Array<{
    eventType: string
    details: string
    timestamp: string
    severity: string
  }>
}

interface SystemHealth {
  uptime?: number
  responseTime?: number
  errorRate?: number
  activeConnections?: number
  memoryUsage?: number
  cpuUsage?: number
  diskUsage?: number
  databaseConnections?: number
}

interface RevenueData {
  month: string
  revenue: number
  subscriptions: number
  businesses: number
}

interface BusinessData {
  id: string
  name: string
  category: string
  status: string
  contact: {
    email: string
  }
  createdAt: string
  location?: {
    county?: string
  }
  stats?: {
    rating?: number
    reviewCount?: number
  }
  verification?: {
    status?: string
  }
}

interface EventData {
  id: string
  title: string
  category: string
  status: string
  organizerEmail: string
  submittedAt: string
  startDate?: string
  createdAt: string
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [pendingBusinesses, setPendingBusinesses] = useState<PendingBusiness[]>([])
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [securityData, setSecurityData] = useState<SecurityData | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [allBusinesses, setAllBusinesses] = useState<BusinessData[]>([])
  const [allEvents, setAllEvents] = useState<EventData[]>([])

  // Fetch pending submissions
  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true)

      // Fetch pending businesses
      const businessResponse = await fetch(`/api/businesses?status=pending_approval&adminToken=${ADMIN_TOKEN}`)
      if (businessResponse.ok) {
        const businessData = await businessResponse.json()
        setPendingBusinesses(businessData.data?.businesses || [])
      } else {
        console.error('Failed to fetch pending businesses:', businessResponse.status)
      }

      // Fetch pending events
      const eventResponse = await fetch(`/api/events?status=pending_approval&adminToken=${ADMIN_TOKEN}`)
      if (eventResponse.ok) {
        const eventData = await eventResponse.json()
        setPendingEvents(eventData.data?.events || [])
      } else {
        console.error('Failed to fetch pending events:', eventResponse.status)
      }
    } catch (error) {
      console.error('Error fetching pending submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all businesses for management
  const fetchAllBusinesses = async () => {
    try {
      const response = await fetch(`/api/businesses?adminToken=${ADMIN_TOKEN}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        setAllBusinesses(data.data?.businesses || [])
      }
    } catch (error) {
      console.error('Error fetching all businesses:', error)
    }
  }

  // Fetch all events for management
  const fetchAllEvents = async () => {
    try {
      const response = await fetch(`/api/events?adminToken=${ADMIN_TOKEN}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        setAllEvents(data.data?.events || [])
      }
    } catch (error) {
      console.error('Error fetching all events:', error)
    }
  }

  // Handle business approval/rejection
  const handleBusinessAction = async (businessId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/businesses/${businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminToken: ADMIN_TOKEN
        })
      })

      if (response.ok) {
        // Refresh the businesses lists
        fetchPendingSubmissions()
        fetchAllBusinesses()
      } else {
        console.error('Failed to update business status')
        alert('Failed to update business status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating business:', error)
    }
  }

  // Handle event approval/rejection
  const handleEventAction = async (eventId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminToken: ADMIN_TOKEN
        })
      })

      if (response.ok) {
        // Refresh the events lists
        fetchPendingSubmissions()
        fetchAllEvents()
      } else {
        console.error('Failed to update event status')
        alert('Failed to update event status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Error updating event. Please try again.')
    }
  }

  // Fetch security dashboard data
  const fetchSecurityData = async () => {
    try {
      const response = await fetch(`/api/security/dashboard?adminToken=${ADMIN_TOKEN}&timeframe=24h`)
      if (response.ok) {
        const data = await response.json()
        setSecurityData(data)
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    }
  }

  // Fetch system health data
  const fetchSystemHealth = async () => {
    try {
      // Mock system health data - in real app, this would come from monitoring APIs
      const healthData = {
        uptime: 99.9,
        responseTime: 145,
        errorRate: 0.02,
        activeConnections: 1247,
        memoryUsage: 68,
        cpuUsage: 42,
        diskUsage: 35,
        databaseConnections: 89
      }
      setSystemHealth(healthData)
    } catch (error) {
      console.error('Error fetching system health:', error)
    }
  }

  // Fetch revenue analytics
  const fetchRevenueData = async () => {
    try {
      // Mock revenue data - in real app, this would come from payment APIs
      const revenue = [
        { month: "Jan", revenue: 125000, subscriptions: 45, businesses: 234 },
        { month: "Feb", revenue: 142000, subscriptions: 52, businesses: 267 },
        { month: "Mar", revenue: 158000, subscriptions: 61, businesses: 298 },
        { month: "Apr", revenue: 167000, subscriptions: 68, businesses: 324 },
        { month: "May", revenue: 189000, subscriptions: 74, businesses: 356 },
        { month: "Jun", revenue: 203000, subscriptions: 82, businesses: 389 },
      ]
      setRevenueData(revenue)
    } catch (error) {
      console.error('Error fetching revenue data:', error)
    }
  }

  // Export functionality
  const exportData = async (type: 'businesses' | 'events' | 'users' | 'reviews') => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}&adminToken=${ADMIN_TOKEN}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Export failed:', response.status)
        alert('Export failed. Please try again.')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    }
  }

  // Add business functionality
  const handleAddBusiness = () => {
    // For now, redirect to business submission page
    window.open('/submit-business', '_blank')
  }

  // Add user functionality
  const handleAddUser = () => {
    // For now, redirect to signup page
    window.open('/auth/signup', '_blank')
  }

  // View site functionality
  const handleViewSite = () => {
    window.open('/', '_blank')
  }

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchPendingSubmissions(),
      fetchAllBusinesses(),
      fetchAllEvents(),
      fetchSecurityData(),
      fetchSystemHealth(),
      fetchRevenueData()
    ])
    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshAllData()
  }, [refreshAllData])

  const stats = {
    totalBusinesses: 1247,
    totalEvents: 89,
    totalUsers: 15234,
    pendingReviews: 23,
    monthlyGrowth: 12.5,
    activeUsers: 8934,
    pendingBusinesses: pendingBusinesses.length,
    pendingEvents: pendingEvents.length,
    totalRevenue: 203000,
    activeSubscriptions: 82,
    securityThreats: securityData?.activeThreats?.blockedIPs || 0,
    systemUptime: systemHealth?.uptime || 99.9,
    avgResponseTime: systemHealth?.responseTime || 145,
    errorRate: systemHealth?.errorRate || 0.02
  }

  const recentReviews = [
    {
      id: 1,
      business: "The Coffee Corner",
      reviewer: "Mike Wilson",
      rating: 5,
      comment: "Amazing coffee and great atmosphere!",
      date: "2024-01-15",
      status: "pending",
    },
    {
      id: 2,
      business: "Bella's Italian Kitchen",
      reviewer: "Emma Davis",
      rating: 4,
      comment: "Great food but service was slow.",
      date: "2024-01-14",
      status: "approved",
    },
  ]

  const recentUsers = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      joinDate: "2024-01-15",
      status: "active",
      businessesListed: 2,
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      joinDate: "2024-01-14",
      status: "active",
      businessesListed: 0,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-[#0A558C]" />
                <h1 className="text-xl font-bold text-[#0A558C]">Mtaani Admin Dashboard</h1>
              </div>
              <Badge variant="outline" className="text-xs">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshAllData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewSite}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportData('businesses')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBusinesses.toLocaleString()}</div>
                  <p className="text-xs text-green-600">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
                  <p className="text-xs text-green-600">+{stats.monthlyGrowth}% from last month</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-green-600">+18% from last month</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.systemUptime}%</div>
                  <p className="text-xs text-green-600">Excellent performance</p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                  <p className="text-xs text-green-600">+15% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Security Threats</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.securityThreats}</div>
                  <p className="text-xs text-red-600">Blocked IPs</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
                  <p className="text-xs text-green-600">Excellent performance</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Business Approvals</CardTitle>
                  <CardDescription>Businesses waiting for approval ({stats.pendingBusinesses})</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-4 text-muted-foreground">Loading...</div>
                    ) : pendingBusinesses.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">No pending business approvals</div>
                    ) : (
                      pendingBusinesses.map((business) => (
                        <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{business.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {business.category} • {new Date(business.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {business.contact.email}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBusinessAction(business.id, 'approve')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBusinessAction(business.id, 'reject')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Event Approvals</CardTitle>
                  <CardDescription>Events waiting for approval ({stats.pendingEvents})</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-4 text-muted-foreground">Loading...</div>
                    ) : pendingEvents.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">No pending event approvals</div>
                    ) : (
                      pendingEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {event.category} • {new Date(event.submittedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {event.organizerEmail}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEventAction(event.id, 'approve')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEventAction(event.id, 'reject')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              {/* Revenue Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Revenue Trends
                    </CardTitle>
                    <CardDescription>Monthly revenue and subscription growth</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [
                          name === 'revenue' ? `KES ${value.toLocaleString()}` : value,
                          name === 'revenue' ? 'Revenue' : 'Subscriptions'
                        ]} />
                        <Bar dataKey="revenue" fill="#0A558C" />
                        <Bar dataKey="subscriptions" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Business Growth
                    </CardTitle>
                    <CardDescription>New business registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="businesses" stroke="#0A558C" strokeWidth={3} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* User Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Business Owners</span>
                        <span className="font-medium">2,847</span>
                      </div>
                      <Progress value={65} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Regular Users</span>
                        <span className="font-medium">12,387</span>
                      </div>
                      <Progress value={85} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Premium Users</span>
                        <span className="font-medium">1,234</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Conversion Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Trial to Paid</span>
                          <span className="font-medium">23.5%</span>
                        </div>
                        <Progress value={23.5} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Visitor to Signup</span>
                          <span className="font-medium">8.2%</span>
                        </div>
                        <Progress value={8.2} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Business Approval Rate</span>
                          <span className="font-medium">94.1%</span>
                        </div>
                        <Progress value={94.1} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Platform Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Daily Active Users</span>
                        <span className="font-medium text-green-600">+12%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Business Searches</span>
                        <span className="font-medium text-green-600">+8%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Event Views</span>
                        <span className="font-medium text-green-600">+15%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Review Submissions</span>
                        <span className="font-medium text-red-600">-3%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <div className="space-y-6">
              {/* Security Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{securityData?.activeThreats?.blockedIPs || 0}</div>
                    <p className="text-xs text-red-600">Active blocks</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Suspicious Users</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{securityData?.activeThreats?.suspiciousUsers || 0}</div>
                    <p className="text-xs text-yellow-600">Under monitoring</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bypass Attempts</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{securityData?.analytics?.eventsByType?.feature_bypass_attempt || 0}</div>
                    <p className="text-xs text-orange-600">Last 24h</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{securityData?.analytics?.threatLevel || 'Low'}</div>
                    <p className="text-xs text-green-600">Current status</p>
                  </CardContent>
                </Card>
              </div>

              {/* Security Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Recent Security Events
                  </CardTitle>
                  <CardDescription>Critical security events requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {securityData?.criticalEvents && securityData.criticalEvents.length > 0 ? (
                      securityData.criticalEvents.slice(0, 5).map((event, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <div>
                              <h4 className="font-medium">{event.eventType}</h4>
                              <p className="text-sm text-muted-foreground">
                                {event.details} • {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive">{event.severity}</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p>No critical security events detected</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <div className="space-y-6">
              {/* System Health */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemHealth?.cpuUsage || 0}%</div>
                    <Progress value={systemHealth?.cpuUsage || 0} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemHealth?.memoryUsage || 0}%</div>
                    <Progress value={systemHealth?.memoryUsage || 0} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemHealth?.diskUsage || 0}%</div>
                    <Progress value={systemHealth?.diskUsage || 0} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemHealth?.activeConnections || 0}</div>
                    <p className="text-xs text-muted-foreground">Current connections</p>
                  </CardContent>
                </Card>
              </div>

              {/* System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      System Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Uptime</span>
                        <span className="font-medium text-green-600">{systemHealth?.uptime || 99.9}%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Response Time</span>
                        <span className="font-medium">{systemHealth?.responseTime || 145}ms</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Error Rate</span>
                        <span className="font-medium text-green-600">{systemHealth?.errorRate || 0.02}%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Database Connections</span>
                        <span className="font-medium">{systemHealth?.databaseConnections || 89}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5" />
                      Service Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">API Gateway</span>
                        <Badge variant="default" className="bg-green-500">Operational</Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Database</span>
                        <Badge variant="default" className="bg-green-500">Operational</Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Payment Gateway</span>
                        <Badge variant="default" className="bg-green-500">Operational</Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Email Service</span>
                        <Badge variant="default" className="bg-green-500">Operational</Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">File Storage</span>
                        <Badge variant="default" className="bg-green-500">Operational</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Event Management</h2>
              <Button onClick={() => window.open('/submit-event', '_blank')}>Add Event</Button>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search events..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending_approval">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => exportData('events')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Loading events...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : allEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No events found. Events will appear here once they are submitted.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allEvents
                      .filter(event =>
                        statusFilter === 'all' || event.status === statusFilter
                      )
                      .filter(event =>
                        searchTerm === '' ||
                        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        event.organizerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>{event.category}</TableCell>
                          <TableCell>{event.organizerEmail}</TableCell>
                          <TableCell>
                            {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                event.status === 'approved' ? 'default' :
                                event.status === 'pending_approval' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {event.status === 'pending_approval' ? 'Pending' :
                               event.status === 'approved' ? 'Approved' :
                               'Rejected'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => window.open(`/events/${event.id}`, '_blank')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                {event.status === 'pending_approval' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleEventAction(event.id, 'approve')}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEventAction(event.id, 'reject')}>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="businesses" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Business Management</h2>
              <Button onClick={handleAddBusiness}>Add Business</Button>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search businesses..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => exportData('businesses')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Loading businesses...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : allBusinesses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No businesses found. Businesses will appear here once they are submitted.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allBusinesses
                      .filter(business =>
                        statusFilter === 'all' || business.status === statusFilter
                      )
                      .filter(business =>
                        searchTerm === '' ||
                        business.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        business.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((business) => (
                        <TableRow key={business.id}>
                          <TableCell className="font-medium">{business.name}</TableCell>
                          <TableCell>{business.category}</TableCell>
                          <TableCell>{business.contact?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                business.status === 'active' ? 'default' :
                                business.status === 'pending' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {business.status === 'active' ? 'Active' :
                               business.status === 'pending' ? 'Pending' :
                               business.status === 'inactive' ? 'Inactive' :
                               'Suspended'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {business.stats?.rating ? `${business.stats.rating}/5` : 'No ratings'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => window.open(`/business/${business.id}`, '_blank')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                {business.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleBusinessAction(business.id, 'approve')}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBusinessAction(business.id, 'reject')}>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Review Management</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => exportData('reviews')}
                >
                  Export Reviews
                </Button>
                <Button>Approve All</Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Manage and moderate user reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{review.business}</h4>
                          <p className="text-sm text-muted-foreground">
                            By {review.reviewer} • {review.date}
                          </p>
                        </div>
                        <Badge variant={review.status === "pending" ? "secondary" : "default"}>{review.status}</Badge>
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
                      <p className="text-sm mb-3">{review.comment}</p>
                      {review.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">User Management</h2>
              <Button onClick={handleAddUser}>Add User</Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Businesses</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.joinDate}</TableCell>
                      <TableCell>
                        <Badge variant="default">{user.status}</Badge>
                      </TableCell>
                      <TableCell>{user.businessesListed}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
