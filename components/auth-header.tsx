"use client"
import Link from "next/link"
import Image from "next/image"
import { User, LogOut, Settings, Building, Calendar, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

export function AuthHeader() {
  const { user, logout } = useAuth()

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="destructive" className="text-xs">
            Admin
          </Badge>
        )
      case "business_owner":
        return (
          <Badge variant="secondary" className="text-xs">
            Business
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative h-20 w-20 md:h-24 md:w-24 p-2 rounded-2xl bg-gradient-to-br from-[#0A558C]/10 to-[#0A558C]/5 group-hover:from-[#0A558C]/20 group-hover:to-[#0A558C]/10 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <Image
                  src="/mtaani-high-resolution-logo-transparent.png"
                  alt="Mtaani"
                  fill
                  className="object-contain p-1 filter drop-shadow-sm"
                  priority
                />
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/businesses"
              className="text-sm font-medium text-gray-700 hover:text-[#0A558C] transition-colors duration-200"
            >
              Businesses
            </Link>
            <Link
              href="/events"
              className="text-sm font-medium text-gray-700 hover:text-[#0A558C] transition-colors duration-200"
            >
              Events
            </Link>
            <Link
              href="/calendar"
              className="text-sm font-medium text-gray-700 hover:text-[#0A558C] transition-colors duration-200"
            >
              Calendar
            </Link>
            <Link
              href="/community"
              className="text-sm font-medium text-gray-700 hover:text-[#0A558C] transition-colors duration-200"
            >
              Community
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/subscription" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Subscription</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "business_owner" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/business/dashboard" className="cursor-pointer">
                          <Building className="mr-2 h-4 w-4" />
                          <span>Business Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/business/pricing" className="cursor-pointer">
                          <Crown className="mr-2 h-4 w-4" />
                          <span>Pricing Plans</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/submit-event" className="cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Create Event</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role !== "business_owner" && (
                    <DropdownMenuItem asChild>
                      <Link href="/submit-business" className="cursor-pointer">
                        <Building className="mr-2 h-4 w-4" />
                        <span>List Your Business</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-[#0A558C] hover:bg-blue-50">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    size="sm"
                    className="bg-[#0A558C] hover:bg-[#084b7c] text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
