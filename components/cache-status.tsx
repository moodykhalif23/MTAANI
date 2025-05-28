"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Trash2, Download } from "lucide-react"
import { offlineCache } from "@/lib/offline-cache"
import { useOffline } from "@/hooks/use-offline"

export function CacheStatus() {
  const [cacheStats, setCacheStats] = useState({
    businesses: 0,
    events: 0,
    searches: 0,
    totalSize: 0,
  })
  const [loading, setLoading] = useState(true)
  const { isOnline } = useOffline()

  useEffect(() => {
    loadCacheStats()
  }, [])

  const loadCacheStats = async () => {
    try {
      setLoading(true)
      const stats = await offlineCache.getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error("Failed to load cache stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    try {
      await offlineCache.clearExpiredCache()
      await loadCacheStats()
    } catch (error) {
      console.error("Failed to clear cache:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading cache information...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Offline Cache
          <Badge variant={isOnline ? "default" : "secondary"}>{isOnline ? "Online" : "Offline"}</Badge>
        </CardTitle>
        <CardDescription>Cached data for offline browsing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{cacheStats.businesses}</div>
            <div className="text-sm text-gray-600">Businesses</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{cacheStats.events}</div>
            <div className="text-sm text-gray-600">Events</div>
          </div>
        </div>

        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{cacheStats.searches}</div>
          <div className="text-sm text-gray-600">Cached Searches</div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearCache} className="flex-1">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Old Cache
          </Button>
          <Button variant="outline" size="sm" onClick={loadCacheStats} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Refresh Stats
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">Cache automatically clears data older than 7 days</div>
      </CardContent>
    </Card>
  )
}
