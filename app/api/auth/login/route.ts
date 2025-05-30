import { NextRequest, NextResponse } from 'next/server'
import { generateTokenPair, generateSessionId } from '@/lib/jwt'
import { userService } from '@/lib/services/user-service'
import { securityConfig } from '@/lib/security-config'
import { securityAudit } from '@/lib/security-audit'
import bcrypt from 'bcryptjs'

interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'business_owner' | 'admin'
  passwordHash: string
  verified: boolean
  loginAttempts: number
  lockedUntil?: Date
  lastLogin?: Date
  createdAt: Date
}

// Mock user database - in production, use CouchDB with userService
// Password hash for 'secret123' - generated with bcrypt salt rounds 12
const adminPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO'

// Get admin credentials from environment variables
const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@mtaani.dev'
const adminName = process.env.DEFAULT_ADMIN_NAME || 'Mtaani Administrator'

console.log('Admin email from env:', adminEmail)
console.log('Admin name from env:', adminName)

const users: Record<string, User> = {
  [adminEmail]: {
    id: 'admin_001',
    email: adminEmail,
    name: adminName,
    role: 'admin',
    passwordHash: adminPasswordHash,
    verified: true,
    loginAttempts: 0,
    createdAt: new Date()
  }
}

console.log('Mock users initialized:', Object.keys(users))

// Session storage - in production, use Redis or database
const activeSessions = new Map<string, {
  userId: string
  sessionId: string
  createdAt: Date
  lastActivity: Date
  ipAddress: string
  userAgent: string
}>()

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password, rememberMe = false } = body

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate input
    if (!email || !password) {
      securityAudit.logEvent(
        'subscription_access',
        'medium',
        'Login attempt with missing credentials',
        { email, hasPassword: !!password },
        undefined,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if we should use mock users only (for development)
    const useMockUsersOnly = process.env.USE_MOCK_USERS_ONLY === 'true'
    let user: { _id?: string; email: string; name: string; role: string; verified: boolean; lastLogin?: Date } | null = null
    let authSuccess = false

    // Try mock users first if flag is set, otherwise try CouchDB first
    if (useMockUsersOnly) {
      console.log('Using mock users only for authentication')
    } else {
      try {
        const authResult = await userService.authenticateUser(email, password, clientIP, userAgent)
        if (authResult.success && authResult.user) {
          user = {
            _id: authResult.user._id,
            email: authResult.user.email,
            name: authResult.user.name,
            role: authResult.user.role,
            verified: authResult.user.verified,
            lastLogin: authResult.user.lastLogin ? new Date(authResult.user.lastLogin) : undefined
          }
          authSuccess = true
        }
      } catch (error) {
        console.log('CouchDB authentication failed, trying mock users:', error)
      }
    }

    // Try mock users if CouchDB failed or if using mock users only
    if (!authSuccess) {
      console.log('Available mock users:', Object.keys(users))
      console.log('Looking for mock user:', email)

      const mockUser = users[email]
      console.log('Mock user found:', !!mockUser)

      if (mockUser) {
        // For development, allow both bcrypt verification and plain text comparison
        let isValidPassword = false

        try {
          // Try bcrypt first
          isValidPassword = await bcrypt.compare(password, mockUser.passwordHash)
          console.log('Bcrypt verification result:', isValidPassword)
        } catch (error) {
          console.log('Bcrypt verification failed:', error)
        }

        if (!isValidPassword && password === 'secret123') {
          isValidPassword = true
          console.log('Plain text password verification successful')
        }

        if (isValidPassword) {
          user = {
            _id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
            verified: mockUser.verified,
            lastLogin: mockUser.lastLogin
          }
          authSuccess = true

          securityAudit.logEvent(
            'subscription_access',
            'low',
            'Successful login using mock user',
            { email, role: mockUser.role },
            mockUser.id,
            clientIP,
            userAgent
          )
        }
      }
    }

    if (!authSuccess || !user) {
      securityAudit.logEvent(
        'subscription_access',
        'medium',
        'Failed login attempt',
        { email },
        undefined,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (securityConfig.authentication.requireEmailVerification && !user.verified) {
      return NextResponse.json(
        {
          error: 'Please verify your email address before logging in',
          requiresVerification: true
        },
        { status: 403 }
      )
    }

    // Generate session
    const sessionId = generateSessionId()
    const tokenPair = generateTokenPair(user._id!, user.email, user.role as 'user' | 'business_owner' | 'admin', sessionId)

    // Store session
    activeSessions.set(sessionId, {
      userId: user._id!,
      sessionId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: clientIP,
      userAgent
    })

    // Set HTTP-only cookie for refresh token
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        lastLogin: user.lastLogin
      },
      accessToken: tokenPair.accessToken,
      expiresIn: tokenPair.expiresIn
    })

    // Set refresh token as HTTP-only cookie
    response.cookies.set('mtaani_refresh_token', tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokenPair.refreshExpiresIn,
      path: '/'
    })

    // Set session cookie
    response.cookies.set('mtaani_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)

    securityAudit.logEvent(
      'subscription_access',
      'high',
      'Login endpoint error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      undefined,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check login status
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('mtaani_session')

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false })
    }

    const session = activeSessions.get(sessionCookie.value)

    if (!session) {
      return NextResponse.json({ authenticated: false })
    }

    // Update last activity
    session.lastActivity = new Date()

    // Try to find user in mock users first, then in CouchDB
    let user = Object.values(users).find(u => u.id === session.userId)

    if (!user) {
      // Try to find in CouchDB if not in mock users
      try {
        const couchUser = await userService.findUserById(session.userId)
        if (couchUser) {
          user = {
            id: couchUser._id!,
            email: couchUser.email,
            name: couchUser.name,
            role: couchUser.role,
            verified: couchUser.verified,
            loginAttempts: 0,
            createdAt: new Date(),
            passwordHash: '',
            lastLogin: couchUser.lastLogin ? new Date(couchUser.lastLogin) : undefined
          }
        }
      } catch (error) {
        console.log('Could not find user in CouchDB:', error)
      }
    }

    if (!user) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        lastLogin: user.lastLogin
      },
      session: {
        id: session.sessionId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }
    })

  } catch (error) {
    console.error('Login status check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
