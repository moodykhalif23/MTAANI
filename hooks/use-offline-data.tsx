"use client"

import { useState, useEffect, useCallback } from "react"
import { useOffline } from "./use-offline"

interface UseOfflineDataOptions {
  enableCache?: boolean
  cacheKey?: string
}

export function useOfflineData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseOfflineDataOptions = {},
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const { isOnline } = useOffline()

  const { enableCache = true, cacheKey } = options

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (isOnline) {
        // Try to fetch fresh data when online
        const freshData = await fetchFunction()
        setData(freshData)
        setFromCache(false)

        // Cache the fresh data if caching is enabled
        if (enableCache && cacheKey) {
          // Implementation depends on data type
          // This would be customized based on the specific data being cached
        }
      } else {
        // When offline, try to get cached data
        if (enableCache && cacheKey) {
          // Try to get cached data
          // Implementation would depend on the specific cache method needed
          setFromCache(true)
        } else {
          throw new Error("No internet connection and no cached data available")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")

      // If online fetch fails, try cache as fallback
      if (isOnline && enableCache && cacheKey) {
        try {
          // Try cached data as fallback
          setFromCache(true)
        } catch (cacheErr) {
          // Cache also failed
        }
      }
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, isOnline, enableCache, cacheKey, ...dependencies])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Listen for sync events when coming back online
  useEffect(() => {
    const handleSync = () => {
      if (isOnline && fromCache) {
        fetchData()
      }
    }

    window.addEventListener("sync-offline-data", handleSync)
    return () => window.removeEventListener("sync-offline-data", handleSync)
  }, [fetchData, isOnline, fromCache])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    fromCache,
    isOnline,
    refetch,
  }
}
