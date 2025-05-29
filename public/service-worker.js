// Service Worker for handling push notifications and offline caching

// Cache name for offline assets
const CACHE_NAME = "mtaani-offline-v1"

// Assets to cache on install
const STATIC_ASSETS = ["/", "/offline", "/mtaani-high-resolution-logo-transparent.png", "/images/mtaani-badge.png"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting()),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME
            })
            .map((name) => {
              return caches.delete(name)
            }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return

  // Skip browser-sync and analytics requests
  const url = new URL(event.request.url)
  if (
    url.hostname.includes("browser-sync") ||
    url.hostname.includes("google-analytics") ||
    url.pathname.includes("chrome-extension")
  ) {
    return
  }

  // Network-first strategy for API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request)
      }),
    )
    return
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone()

          // Cache the fetched response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If both cache and network fail, show offline page
          if (event.request.headers.get("Accept").includes("text/html")) {
            return caches.match("/offline")
          }

          // Return default offline image for image requests
          if (event.request.headers.get("Accept").includes("image")) {
            return caches.match("/images/offline-image.png")
          }

          // Return empty response for other requests
          return new Response("", { status: 408, statusText: "Request timed out." })
        })
    }),
  )
})

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const title = data.title || "Mtaani Update"
    const options = {
      body: data.body || "Something new is happening in your community!",
      icon: data.icon || "/images/mtaani-logo.png",
      badge: data.badge || "/images/mtaani-badge.png",
      data: data.data || {},
      actions: data.actions || [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
      tag: data.tag || "mtaani-notification",
      requireInteraction: data.requireInteraction || false,
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (error) {
    console.error("Error showing push notification:", error)
  }
})

// Notification click event - handle user interaction with notifications
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  // Handle notification click based on action
  if (event.action === "view") {
    const data = event.notification.data
    let url = "/"

    // Determine URL based on notification type
    if (data && data.type) {
      if (data.type === "businesses" && data.items && data.items.length > 0) {
        url = "/businesses"
      } else if (data.type === "events" && data.items && data.items.length > 0) {
        url = "/events"
      } else if (data.itemId) {
        url = `/${data.type}/${data.itemId}`
      }
    }

    // Open or focus the appropriate window
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus()
          }
        }

        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      }),
    )
  }
})

// Sync event - handle background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-new-content") {
    event.waitUntil(syncNewContent())
  }
})

// Function to sync new content when back online
async function syncNewContent() {
  try {
    // Get all windows/tabs
    const clients = await self.clients.matchAll({ type: "window" })

    // Send message to all clients to check for new content
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_NEW_CONTENT",
        timestamp: Date.now(),
      })
    })

    return true
  } catch (error) {
    console.error("Error syncing new content:", error)
    return false
  }
}
