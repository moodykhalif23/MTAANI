import { NotificationSettings } from "@/components/notification-settings"
import { AuthHeader } from "@/components/auth-header"

export default function NotificationsSettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>
        <div className="space-y-6">
          <NotificationSettings />

          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h2 className="text-lg font-medium mb-4">About Notifications</h2>
            <p className="text-slate-600 mb-4">
              Mtaani uses notifications to keep you informed about new businesses and events in your community,
              especially when you come back online after being disconnected.
            </p>
            <h3 className="font-medium text-slate-800 mb-2">How it works:</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>When you go offline, we track what content you&apos;ve already seen</li>
              <li>When you come back online, we check for new businesses and events</li>
              <li>If we find new content, we&apos;ll send you a notification (based on your preferences)</li>
              <li>You can click the notification to view the new content</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
