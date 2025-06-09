"use client"

import { useEffect, useState } from "react"
import { useOffline } from "@/hooks/use-offline"
import { notificationManager } from "@/lib/notification-manager"

export function SyncManager() {
  const { isOnline } = useOffline()
  const [lastSyncTime, setLastSyncTime] = useState<number>(0)
  const [previousBusinesses, setPreviousBusinesses] = useState([])
  const [previousEvents, setPreviousEvents] = useState([])

  useEffect(() => {
    if (!isOnline) return

    const syncNewContent = async () => {
      try {
        const currentTime = Date.now()
        if (currentTime - lastSyncTime < 5 * 60 * 1000) return

        const [businessesRes, eventsRes] = await Promise.all([
          fetch('/api/businesses?limit=100'),
          fetch('/api/events?limit=100'),
        ])
        const businessesData = businessesRes.ok ? (await businessesRes.json()).data?.businesses || [] : []
        const eventsData = eventsRes.ok ? (await eventsRes.json()).data?.events || [] : []

        await notificationManager.compareAndNotify(previousBusinesses, businessesData, "businesses")
        await notificationManager.compareAndNotify(previousEvents, eventsData, "events")

        setPreviousBusinesses(businessesData)
        setPreviousEvents(eventsData)
        setLastSyncTime(currentTime)
        console.log("Content sync completed")
      } catch (error) {
        console.error("Error syncing content:", error)
      }
    }

    syncNewContent()
    const syncInterval = setInterval(syncNewContent, 10 * 60 * 1000)

    return () => clearInterval(syncInterval)
  }, [isOnline, lastSyncTime, previousBusinesses, previousEvents])

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_NEW_CONTENT") {
        console.log("Received sync request from service worker")
        setLastSyncTime(0) 
      }
    }

    navigator.serviceWorker.addEventListener("message", handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage)
    }
  }, [])

  return null 
}
