"use client"

import { useState } from "react"
import { Bell, BellOff, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/hooks/use-notifications"

export function NotificationPermission() {
  const {
    isSupported,
    isPushSupported,
    isInitialized,
    permission,
    preferences,
    requestPermission,
    updatePreferences,
    showTestNotification,
  } = useNotifications()

  const [showSettings, setShowSettings] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  if (!isSupported) return null

  if (permission === "granted" && preferences.enabled && !showSettings) return null

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    try {
      await requestPermission()
    } finally {
      setIsRequesting(false)
    }
  }

  const handleTestNotification = async () => {
    await showTestNotification()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {permission === "granted" ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <CardTitle className="text-sm">Notifications</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isPushSupported && (
                <Badge variant="secondary" className="text-xs">
                  Basic Only
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {permission === "default" && (
            <>
              <CardDescription className="text-sm">
                Get notified about new businesses and events in your area
              </CardDescription>
              <Button onClick={handleRequestPermission} disabled={isRequesting} className="w-full" size="sm">
                {isRequesting ? "Requesting..." : "Enable Notifications"}
              </Button>
            </>
          )}

          {permission === "denied" && (
            <CardDescription className="text-sm text-red-600">
              Notifications are blocked. Enable them in your browser settings to get updates.
            </CardDescription>
          )}

          {permission === "granted" && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled" className="text-sm">
                  Enable notifications
                </Label>
                <Switch
                  id="notifications-enabled"
                  checked={preferences.enabled}
                  onCheckedChange={(enabled) => updatePreferences({ enabled })}
                />
              </div>

              {showSettings && preferences.enabled && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-businesses" className="text-xs">
                      New businesses
                    </Label>
                    <Switch
                      id="new-businesses"
                      checked={preferences.newBusinesses}
                      onCheckedChange={(newBusinesses) => updatePreferences({ newBusinesses })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-events" className="text-xs">
                      New events
                    </Label>
                    <Switch
                      id="new-events"
                      checked={preferences.newEvents}
                      onCheckedChange={(newEvents) => updatePreferences({ newEvents })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="nearby-alerts" className="text-xs">
                      Nearby alerts
                    </Label>
                    <Switch
                      id="nearby-alerts"
                      checked={preferences.nearbyAlerts}
                      onCheckedChange={(nearbyAlerts) => updatePreferences({ nearbyAlerts })}
                    />
                  </div>

                  <Button variant="outline" size="sm" onClick={handleTestNotification} className="w-full text-xs">
                    Test Notification
                  </Button>
                </div>
              )}
            </>
          )}

          {!isInitialized && permission === "granted" && (
            <CardDescription className="text-xs text-amber-600">
              Notifications available in basic mode only (HTTPS required for full features)
            </CardDescription>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
