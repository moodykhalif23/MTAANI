"use client"

import { useState } from "react"
import { MapPin, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGeolocation } from "@/hooks/use-geolocation"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LocationButtonProps {
  onLocationUpdate: (lat: number, lng: number) => void
  onLocationClear: () => void
  isActive: boolean
}

export function LocationButton({ onLocationUpdate, onLocationClear, isActive }: LocationButtonProps) {
  const { getCurrentPosition, clearLocation, loading, error, isLocationAvailable, latitude, longitude } =
    useGeolocation()
  const [showError, setShowError] = useState(false)

  const handleLocationClick = () => {
    if (isActive && isLocationAvailable) {
      // Clear location
      clearLocation()
      onLocationClear()
      setShowError(false)
    } else {
      // Get location
      getCurrentPosition()
      setShowError(false)
    }
  }

  // Update parent when location is available
  if (isLocationAvailable && latitude && longitude && !isActive) {
    onLocationUpdate(latitude, longitude)
  }

  // Show error if location failed
  if (error && !showError) {
    setShowError(true)
  }

  return (
    <div className="space-y-2">
      <Button
        variant={isActive ? "default" : "outline"}
        onClick={handleLocationClick}
        disabled={loading}
        className={`h-12 ${
          isActive ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 hover:border-blue-400"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : isActive ? (
          <X className="h-4 w-4 mr-2" />
        ) : (
          <MapPin className="h-4 w-4 mr-2" />
        )}
        {loading ? "Getting Location..." : isActive ? "Clear Location" : "Near Me"}
      </Button>

      {showError && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
