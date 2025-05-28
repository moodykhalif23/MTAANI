"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CacheStatus } from "@/components/cache-status"
import { OfflineIndicator } from "@/components/offline-indicator"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <OfflineIndicator />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-xl text-gray-600">Manage your preferences and offline data</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CacheStatus />

            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your data and privacy preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Location Services</span>
                    <span className="text-sm text-green-600">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Offline Caching</span>
                    <span className="text-sm text-green-600">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytics</span>
                    <span className="text-sm text-gray-600">Disabled</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
