"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { isTokenExpiringSoon } from "./jwt"

interface User {
  id: string
  email: string
  name: string
  role: "user" | "business_owner" | "admin"
  avatar?: string
  businessId?: string
  verified: boolean
  lastLogin?: Date
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string, role?: string, agreeToTerms?: boolean) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>
  logout: () => Promise<void>
  logoutAllDevices: () => Promise<void>
  loading: boolean
  updateProfile: (data: Partial<User>) => Promise<boolean>
  refreshToken: () => Promise<boolean>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user has a valid session
        const response = await fetch('/api/auth/login', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          if (data.authenticated && data.user) {
            setUser(data.user)

            // Try to refresh token to get access token
            await refreshToken()
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!accessToken || !user) return

    const checkTokenExpiry = () => {
      if (isTokenExpiringSoon(accessToken)) {
        refreshToken()
      }
    }

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000)

    return () => clearInterval(interval)
  }, [accessToken, user])

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        setAccessToken(data.accessToken)
        return { success: true }
      } else {
        return {
          success: false,
          error: data.error || 'Login failed'
        }
      }
    } catch (error) {
      console.error("Login failed:", error)
      return {
        success: false,
        error: 'Network error. Please try again.'
      }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: string = "user",
    agreeToTerms: boolean = true
  ): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          name,
          role: role as 'user' | 'business_owner',
          agreeToTerms
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (!data.requiresVerification) {
          // User is logged in immediately
          setUser(data.user)
          setAccessToken(data.accessToken)
        }

        return {
          success: true,
          requiresVerification: data.requiresVerification
        }
      } else {
        return {
          success: false,
          error: data.error || 'Signup failed'
        }
      }
    } catch (error) {
      console.error("Signup failed:", error)
      return {
        success: false,
        error: 'Network error. Please try again.'
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        }
      })
    } catch (error) {
      console.error("Logout request failed:", error)
    } finally {
      // Clear local state regardless of API call result
      setUser(null)
      setAccessToken(null)
    }
  }

  const logoutAllDevices = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        }
      })
    } catch (error) {
      console.error("Logout all devices request failed:", error)
    } finally {
      // Clear local state regardless of API call result
      setUser(null)
      setAccessToken(null)
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          setAccessToken(data.accessToken)
          return true
        }
      }

      // If refresh fails, clear auth state
      setUser(null)
      setAccessToken(null)
      return false
    } catch (error) {
      console.error("Token refresh failed:", error)
      setUser(null)
      setAccessToken(null)
      return false
    }
  }

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!user || !accessToken) return false

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.user) {
          setUser(result.data.user)
          return true
        }
      }

      return false
    } catch (error) {
      console.error("Profile update failed:", error)
      return false
    }
  }

  const isAuthenticated = !!user && !!accessToken

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      login,
      signup,
      logout,
      logoutAllDevices,
      loading,
      updateProfile,
      refreshToken,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
