"use client"

import { useNotifications, type NotificationPreferences } from "@/hooks/use-notifications"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, Building, Calendar, MapPin, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotificationSettings() {
  const { isSupported, permission, preferences, requestPermission, updatePreferences } = useNotifications()

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn&apos;t support notifications. Try using a modern browser like Chrome, Firefox, or Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (permission !== "granted") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Enable Notifications
          </CardTitle>
          <CardDescription>Get notified about new businesses and events when you come back online.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={requestPermission} className="w-full">
            Enable Notifications
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleToggleAll = (enabled: boolean) => {
    updatePreferences({ enabled })
  }

  const handleTogglePreference = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferences({ [key]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={handleToggleAll}
            aria-label="Toggle all notifications"
          />
        </CardTitle>
        <CardDescription>Customize which notifications you receive when coming back online.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-500" />
              <Label htmlFor="new-businesses" className="text-sm font-medium">
                New Businesses
              </Label>
            </div>
            <Switch
              id="new-businesses"
              checked={preferences.enabled && preferences.newBusinesses}
              onCheckedChange={(checked) => handleTogglePreference("newBusinesses", checked)}
              disabled={!preferences.enabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <Label htmlFor="new-events" className="text-sm font-medium">
                New Events
              </Label>
            </div>
            <Switch
              id="new-events"
              checked={preferences.enabled && preferences.newEvents}
              onCheckedChange={(checked) => handleTogglePreference("newEvents", checked)}
              disabled={!preferences.enabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-slate-500" />
              <Label htmlFor="business-updates" className="text-sm font-medium">
                Business Updates
              </Label>
            </div>
            <Switch
              id="business-updates"
              checked={preferences.enabled && preferences.businessUpdates}
              onCheckedChange={(checked) => handleTogglePreference("businessUpdates", checked)}
              disabled={!preferences.enabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-slate-500" />
              <Label htmlFor="event-updates" className="text-sm font-medium">
                Event Updates
              </Label>
            </div>
            <Switch
              id="event-updates"
              checked={preferences.enabled && preferences.eventUpdates}
              onCheckedChange={(checked) => handleTogglePreference("eventUpdates", checked)}
              disabled={!preferences.enabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              <Label htmlFor="nearby-alerts" className="text-sm font-medium">
                Nearby Alerts
              </Label>
            </div>
            <Switch
              id="nearby-alerts"
              checked={preferences.enabled && preferences.nearbyAlerts}
              onCheckedChange={(checked) => handleTogglePreference("nearbyAlerts", checked)}
              disabled={!preferences.enabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
