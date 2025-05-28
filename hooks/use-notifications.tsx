"use client"

import { useState, useEffect } from "react"
import { notificationManager } from "@/lib/notification-manager"

export type NotificationPreferences = {
  enabled: boolean
  newBusinesses: boolean
  newEvents: boolean
  businessUpdates: boolean
  eventUpdates: boolean
  nearbyAlerts: boolean
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    newBusinesses: true,
    newEvents: true,
    businessUpdates: false,
    eventUpdates: false,
    nearbyAlerts: true,
  })

  useEffect(() => {
    const initializeNotifications = async () => {
      // Check if notifications are supported
      const supported = notificationManager.isNotificationSupported()
      const pushSupported = notificationManager.isPushSupported()

      setIsSupported(supported)
      setIsPushSupported(pushSupported)

      if (supported) {
        // Get current permission status
        setPermission(Notification.permission)

        // Initialize notification manager
        try {
          await notificationManager.initialize()
          setIsInitialized(true)
        } catch (error) {
          console.error("Failed to initialize notifications:", error)
          setIsInitialized(false)
        }

        // Get saved preferences
        setPreferences(notificationManager.getPreferences())
      }
    }

    initializeNotifications()
  }, [])

  const requestPermission = async () => {
    if (!isSupported) return false

    try {
      const granted = await notificationManager.requestPermission()
      setPermission(Notification.permission)
      return granted
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      await notificationManager.updatePreferences(newPreferences)
      setPreferences({ ...preferences, ...newPreferences })
    } catch (error) {
      console.error("Error updating notification preferences:", error)
    }
  }

  const showTestNotification = async () => {
    if (permission !== "granted") return false

    try {
      return await notificationManager.showNotification("Test Notification", {
        body: "This is a test notification from Mtaani!",
        icon: "/images/mtaani-logo.png",
        tag: "test-notification",
      })
    } catch (error) {
      console.error("Error showing test notification:", error)
      return false
    }
  }

  return {
    isSupported,
    isPushSupported,
    isInitialized,
    permission,
    preferences,
    requestPermission,
    updatePreferences,
    showTestNotification,
  }
}
