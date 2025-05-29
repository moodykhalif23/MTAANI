// Notification Manager for handling push notifications
class NotificationManager {
  private vapidPublicKey = "BLVYgI-HyS-GDpr5H9U3OqPCp_LRBJWvO8-F-GpYg9tP-q6CSiWKIxlnQeVFwIWsO6LwxdWJoZHr_YOXQxm80QA"
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private notificationPermission: NotificationPermission = "default"
  private isSecureContext = false
  private userPreferences: {
    enabled: boolean
    newBusinesses: boolean
    newEvents: boolean
    businessUpdates: boolean
    eventUpdates: boolean
    nearbyAlerts: boolean
  } = {
    enabled: true,
    newBusinesses: true,
    newEvents: true,
    businessUpdates: false,
    eventUpdates: false,
    nearbyAlerts: true,
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.notificationPermission = Notification.permission
      this.isSecureContext = window.isSecureContext || window.location.hostname === "localhost"
      this.loadPreferences()
    }
  }

  async initialize(): Promise<void> {
    if (!this.isSecureContext) {
      console.log("Notifications require HTTPS or localhost")
      return
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notifications not supported")
      return
    }

    try {
      // Check if service worker is already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration()

      if (existingRegistration) {
        this.serviceWorkerRegistration = existingRegistration
      } else {
        // Register service worker only in secure context
        this.serviceWorkerRegistration = await navigator.serviceWorker.register("/service-worker.js", {
          scope: "/",
        })
      }

      // Update permission status
      this.notificationPermission = Notification.permission

      // Subscribe to push if permission granted and enabled in preferences
      if (this.notificationPermission === "granted" && this.userPreferences.enabled) {
        await this.subscribeToPush()
      }

      console.log("Notification system initialized")
    } catch (error) {
      console.error("Error initializing notification system:", error)
      // Fallback to basic notifications without service worker
      this.serviceWorkerRegistration = null
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.notificationPermission = permission

      if (permission === "granted" && this.isSecureContext) {
        await this.subscribeToPush()
        return true
      }
      return permission === "granted"
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isSecureContext || !this.serviceWorkerRegistration) {
      console.log("Push notifications require HTTPS and service worker")
      return null
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      })

      // Here you would send the subscription to your server
      console.log("Push subscription successful:", subscription)

      return subscription
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error)
      return null
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) return false

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        console.log("Successfully unsubscribed from push notifications")
        return true
      }

      return false
    } catch (error) {
      console.error("Error unsubscribing from push:", error)
      return false
    }
  }

  async updatePreferences(preferences: Partial<typeof this.userPreferences>): Promise<void> {
    this.userPreferences = { ...this.userPreferences, ...preferences }

    // Save preferences to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("notification_preferences", JSON.stringify(this.userPreferences))
    }

    // If notifications are disabled, unsubscribe from push
    if (!this.userPreferences.enabled) {
      await this.unsubscribeFromPush()
    } else if (this.notificationPermission === "granted" && this.isSecureContext) {
      // If enabled and permission granted, ensure subscription
      await this.subscribeToPush()
    }
  }

  getPreferences(): typeof this.userPreferences {
    return { ...this.userPreferences }
  }

  isNotificationSupported(): boolean {
    return "Notification" in window
  }

  isPushSupported(): boolean {
    return this.isSecureContext && "serviceWorker" in navigator && "PushManager" in window
  }

  private loadPreferences(): void {
    if (typeof window !== "undefined") {
      const savedPrefs = localStorage.getItem("notification_preferences")
      if (savedPrefs) {
        try {
          this.userPreferences = { ...this.userPreferences, ...JSON.parse(savedPrefs) }
        } catch {
          console.error("Error parsing saved notification preferences")
        }
      }
    }
  }

  async showNotification(title: string, options: NotificationOptions): Promise<boolean> {
    // Try service worker notification first
    if (this.serviceWorkerRegistration && this.notificationPermission === "granted") {
      try {
        await this.serviceWorkerRegistration.showNotification(title, options)
        return true
      } catch (error) {
        console.error("Error showing service worker notification:", error)
      }
    }

    // Fallback to basic notification
    if (this.notificationPermission === "granted" && "Notification" in window) {
      try {
        new Notification(title, options)
        return true
      } catch (error) {
        console.error("Error showing basic notification:", error)
      }
    }

    return false
  }

  async compareAndNotify(oldData: Array<{ id: string; name: string }>, newData: Array<{ id: string; name: string }>, type: "businesses" | "events"): Promise<void> {
    if (!this.userPreferences.enabled || this.notificationPermission !== "granted") return

    // Skip if specific notification type is disabled
    if (type === "businesses" && !this.userPreferences.newBusinesses) return
    if (type === "events" && !this.userPreferences.newEvents) return

    // Find new items
    const oldIds = new Set(oldData.map((item) => item.id))
    const newItems = newData.filter((item) => !oldIds.has(item.id))

    if (newItems.length === 0) return

    // Show notification for new items
    const title =
      type === "businesses"
        ? `${newItems.length} New Local ${newItems.length === 1 ? "Business" : "Businesses"}`
        : `${newItems.length} New ${newItems.length === 1 ? "Event" : "Events"}`

    const options: NotificationOptions = {
      body:
        type === "businesses"
          ? `Discover ${newItems.length} new local ${newItems.length === 1 ? "business" : "businesses"} in your area`
          : `Check out ${newItems.length} new ${newItems.length === 1 ? "event" : "events"} happening near you`,
      icon: "/images/mtaani-logo.png",
      badge: "/images/mtaani-badge.png",
      tag: `new-${type}-${Date.now()}`,
      data: {
        type,
        items: newItems.slice(0, 5).map((item) => ({ id: item.id, name: item.name })),
        timestamp: Date.now(),
      },
      requireInteraction: false, // Set to false for better compatibility
    }

    await this.showNotification(title, options)
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  }
}

export const notificationManager = new NotificationManager()
