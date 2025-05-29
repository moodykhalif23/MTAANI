"use client"

import { useOffline } from "@/hooks/use-offline"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"

export function OfflineIndicator() {
  const { isOnline, isOffline, wasOffline } = useOffline()

  if (isOnline && !wasOffline) return null

  return (
    <div className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto">
      {isOffline ? (
        <Alert className="bg-orange-50 border-orange-200 text-orange-800">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You&apos;re offline. Showing cached content.</span>
          </AlertDescription>
        </Alert>
      ) : wasOffline ? (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <Wifi className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Back online! Syncing latest data...</span>
            <RefreshCw className="h-4 w-4 animate-spin" />
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
