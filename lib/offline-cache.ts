// IndexedDB wrapper for offline data storage
class OfflineCache {
  private dbName = "mtaani-offline-cache"
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store for businesses
        if (!db.objectStoreNames.contains("businesses")) {
          const businessStore = db.createObjectStore("businesses", { keyPath: "id" })
          businessStore.createIndex("location", "location", { unique: false })
          businessStore.createIndex("category", "category", { unique: false })
          businessStore.createIndex("cached_at", "cached_at", { unique: false })
        }

        // Store for events
        if (!db.objectStoreNames.contains("events")) {
          const eventStore = db.createObjectStore("events", { keyPath: "id" })
          eventStore.createIndex("location", "location", { unique: false })
          eventStore.createIndex("category", "category", { unique: false })
          eventStore.createIndex("date", "date", { unique: false })
          eventStore.createIndex("cached_at", "cached_at", { unique: false })
        }

        // Store for user locations
        if (!db.objectStoreNames.contains("user_locations")) {
          const locationStore = db.createObjectStore("user_locations", { keyPath: "id" })
          locationStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        // Store for search results
        if (!db.objectStoreNames.contains("search_cache")) {
          const searchStore = db.createObjectStore("search_cache", { keyPath: "key" })
          searchStore.createIndex("location_hash", "location_hash", { unique: false })
          searchStore.createIndex("cached_at", "cached_at", { unique: false })
        }

        // Store for map tiles
        if (!db.objectStoreNames.contains("map_tiles")) {
          const tileStore = db.createObjectStore("map_tiles", { keyPath: "url" })
          tileStore.createIndex("zoom_level", "zoom_level", { unique: false })
          tileStore.createIndex("cached_at", "cached_at", { unique: false })
        }
      }
    })
  }

  async cacheBusinesses(businesses: any[], userLocation?: { lat: number; lng: number }): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["businesses"], "readwrite")
    const store = transaction.objectStore("businesses")

    const cachedAt = Date.now()
    const locationHash = userLocation ? `${userLocation.lat.toFixed(3)},${userLocation.lng.toFixed(3)}` : "global"

    for (const business of businesses) {
      const cachedBusiness = {
        ...business,
        cached_at: cachedAt,
        location_hash: locationHash,
      }
      await store.put(cachedBusiness)
    }
  }

  async cacheEvents(events: any[], userLocation?: { lat: number; lng: number }): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["events"], "readwrite")
    const store = transaction.objectStore("events")

    const cachedAt = Date.now()
    const locationHash = userLocation ? `${userLocation.lat.toFixed(3)},${userLocation.lng.toFixed(3)}` : "global"

    for (const event of events) {
      const cachedEvent = {
        ...event,
        cached_at: cachedAt,
        location_hash: locationHash,
      }
      await store.put(cachedEvent)
    }
  }

  async getCachedBusinesses(userLocation?: { lat: number; lng: number }): Promise<any[]> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["businesses"], "readonly")
    const store = transaction.objectStore("businesses")

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const businesses = request.result

        // Filter by location if provided (within reasonable distance)
        if (userLocation) {
          const filtered = businesses.filter((business) => {
            if (!business.location_hash || business.location_hash === "global") return true

            const [lat, lng] = business.location_hash.split(",").map(Number)
            const distance = this.calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
            return distance <= 10 // Within 10 miles
          })
          resolve(filtered)
        } else {
          resolve(businesses)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedEvents(userLocation?: { lat: number; lng: number }): Promise<any[]> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["events"], "readonly")
    const store = transaction.objectStore("events")

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const events = request.result

        // Filter by location if provided
        if (userLocation) {
          const filtered = events.filter((event) => {
            if (!event.location_hash || event.location_hash === "global") return true

            const [lat, lng] = event.location_hash.split(",").map(Number)
            const distance = this.calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
            return distance <= 10 // Within 10 miles
          })
          resolve(filtered)
        } else {
          resolve(events)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async cacheUserLocation(location: { lat: number; lng: number; accuracy?: number }): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["user_locations"], "readwrite")
    const store = transaction.objectStore("user_locations")

    const locationData = {
      id: "current",
      ...location,
      timestamp: Date.now(),
    }

    await store.put(locationData)
  }

  async getCachedUserLocation(): Promise<{ lat: number; lng: number; accuracy?: number } | null> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["user_locations"], "readonly")
    const store = transaction.objectStore("user_locations")

    return new Promise((resolve, reject) => {
      const request = store.get("current")
      request.onsuccess = () => {
        const result = request.result
        if (result && Date.now() - result.timestamp < 24 * 60 * 60 * 1000) {
          // 24 hours
          resolve({ lat: result.lat, lng: result.lng, accuracy: result.accuracy })
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async cacheSearchResults(query: string, results: any[], userLocation?: { lat: number; lng: number }): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["search_cache"], "readwrite")
    const store = transaction.objectStore("search_cache")

    const locationHash = userLocation ? `${userLocation.lat.toFixed(3)},${userLocation.lng.toFixed(3)}` : "global"
    const key = `${query.toLowerCase()}_${locationHash}`

    const searchData = {
      key,
      query,
      results,
      location_hash: locationHash,
      cached_at: Date.now(),
    }

    await store.put(searchData)
  }

  async getCachedSearchResults(query: string, userLocation?: { lat: number; lng: number }): Promise<any[] | null> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["search_cache"], "readonly")
    const store = transaction.objectStore("search_cache")

    const locationHash = userLocation ? `${userLocation.lat.toFixed(3)},${userLocation.lng.toFixed(3)}` : "global"
    const key = `${query.toLowerCase()}_${locationHash}`

    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => {
        const result = request.result
        if (result && Date.now() - result.cached_at < 60 * 60 * 1000) {
          // 1 hour
          resolve(result.results)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.init()

    const stores = ["businesses", "events", "search_cache", "map_tiles"]
    const expiration = Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days

    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore("store")
      const index = store.index("cached_at")

      const request = index.openCursor(IDBKeyRange.upperBound(expiration))
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }
    }
  }

  async getCacheStats(): Promise<{
    businesses: number
    events: number
    searches: number
    totalSize: number
  }> {
    if (!this.db) await this.init()

    const stats = {
      businesses: 0,
      events: 0,
      searches: 0,
      totalSize: 0,
    }

    // Count businesses
    const businessTransaction = this.db!.transaction(["businesses"], "readonly")
    const businessStore = businessTransaction.objectStore("businesses")
    stats.businesses = await new Promise((resolve) => {
      const request = businessStore.count()
      request.onsuccess = () => resolve(request.result)
    })

    // Count events
    const eventTransaction = this.db!.transaction(["events"], "readonly")
    const eventStore = eventTransaction.objectStore("events")
    stats.events = await new Promise((resolve) => {
      const request = eventStore.count()
      request.onsuccess = () => resolve(request.result)
    })

    // Count search cache
    const searchTransaction = this.db!.transaction(["search_cache"], "readonly")
    const searchStore = searchTransaction.objectStore("search_cache")
    stats.searches = await new Promise((resolve) => {
      const request = searchStore.count()
      request.onsuccess = () => resolve(request.result)
    })

    return stats
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export const offlineCache = new OfflineCache()
