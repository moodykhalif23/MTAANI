import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { OfflineIndicator } from "@/components/offline-indicator"
import { NotificationPermission } from "@/components/notification-permission"
import { SyncManager } from "@/components/sync-manager"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mtaani - Local Community Platform",
  description: "Connect with local businesses, discover events, and build community relationships",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <OfflineIndicator />
          <NotificationPermission />
          <SyncManager />
        </AuthProvider>
      </body>
    </html>
  )
}
