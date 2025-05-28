"use client"

import { useEffect, useState } from "react"
import { useOffline } from "@/hooks/use-offline"
import { notificationManager } from "@/lib/notification-manager"

// Mock data for demonstration
const mockBusinesses = [
  { id: "1", name: "Local Coffee Shop", category: "Food & Drink" },
  { id: "2", name: "Community Bookstore", category: "Retail" },
  { id: "3", name: "Neighborhood Gym", category: "Fitness" },
]

const mockEvents = [
  { id: "1", name: "Community Market", category: "Market" },
  { id: "2", name: "Local Music Festival", category: "Entertainment" },
  { id: "3", name: "Neighborhood Cleanup", category: "Community" },
]

export function SyncManager() {
  const { isOnline } = useOffline()
  const [lastSyncTime, setLastSyncTime] = useState<number>(0)
  const [previousBusinesses, setPreviousBusinesses] = useState(mockBusinesses)
  const [previousEvents, setPreviousEvents] = useState(mockEvents)

  useEffect(() => {
    if (!isOnline) return

    const syncNewContent = async () => {
      try {
        // Simulate fetching new data
        const currentTime = Date.now()

        // Only sync if it's been more than 5 minutes since last sync
        if (currentTime - lastSyncTime < 5 * 60 * 1000) return

        // Simulate new businesses (randomly add new ones)
        const newBusinesses = [...mockBusinesses]
        if (Math.random() > 0.7) {
          newBusinesses.push({
            id: `new-${currentTime}`,
            name: "New Local Business",
            category: "Services",
          })
        }

        // Simulate new events
        const newEvents = [...mockEvents]
        if (Math.random() > 0.8) {
          newEvents.push({
            id: `new-event-${currentTime}`,
            name: "New Community Event",
            category: "Community",
          })
        }

        // Check for new content and notify
        await notificationManager.compareAndNotify(previousBusinesses, newBusinesses, "businesses")
        await notificationManager.compareAndNotify(previousEvents, newEvents, "events")

        // Update state
        setPreviousBusinesses(newBusinesses)
        setPreviousEvents(newEvents)
        setLastSyncTime(currentTime)

        console.log("Content sync completed")
      } catch (error) {
        console.error("Error syncing content:", error)
      }
    }

    // Sync immediately when coming online
    syncNewContent()

    // Set up periodic sync every 10 minutes
    const syncInterval = setInterval(syncNewContent, 10 * 60 * 1000)

    return () => clearInterval(syncInterval)
  }, [isOnline, lastSyncTime, previousBusinesses, previousEvents])

  // Listen for service worker messages
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_NEW_CONTENT") {
        console.log("Received sync request from service worker")
        // Trigger content sync
        setLastSyncTime(0) // Reset to force immediate sync
      }
    }

    navigator.serviceWorker.addEventListener("message", handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage)
    }
  }, [])

  return null // This component doesn't render anything
}
