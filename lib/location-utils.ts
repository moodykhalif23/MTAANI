// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Format distance for display
export function formatDistance(distance: number): string {
  if (distance < 0.1) {
    return "< 0.1 mi"
  } else if (distance < 1) {
    return `${distance.toFixed(1)} mi`
  } else {
    return `${distance.toFixed(1)} mi`
  }
}

// Mock coordinates for demo businesses and events
export const mockCoordinates: Record<number, { lat: number; lng: number }> = {
  1: { lat: 40.7589, lng: -73.9851 }, // The Coffee Corner
  2: { lat: 40.7505, lng: -73.9934 }, // Green Valley Fitness
  3: { lat: 40.7614, lng: -73.9776 }, // Bella's Italian Kitchen
  4: { lat: 40.7549, lng: -73.984 }, // Tech Repair Solutions
  5: { lat: 40.7282, lng: -74.0776 }, // Sunset Yoga Studio
  6: { lat: 40.758, lng: -73.9855 }, // Downtown Books & More
}

// Get coordinates for a business/event by ID
export function getCoordinates(id: number): { lat: number; lng: number } | null {
  return mockCoordinates[id] || null
}

// Add distance to business/event objects
export function addDistanceToItems<T extends { id: number }>(
  items: T[],
  userLat: number,
  userLng: number,
): (T & { calculatedDistance: number })[] {
  return items.map((item) => {
    const coords = getCoordinates(item.id)
    if (!coords) {
      return { ...item, calculatedDistance: Number.POSITIVE_INFINITY }
    }

    const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng)
    return { ...item, calculatedDistance: distance }
  })
}
