import { NextRequest, NextResponse } from 'next/server'
import { generateTokenPair, generateSessionId } from '@/lib/jwt'
import { userService } from '@/lib/services/user-service'
import { securityConfig } from '@/lib/security-config'

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
// Password hash for 'secret123' - in production, these would be stored securely in database
const defaultPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO'

const users: Record<string, User> = {
  'user@example.com': {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'user',
    passwordHash: defaultPasswordHash,
    verified: true,
    loginAttempts: 0,
    createdAt: new Date()
  },
  'business@example.com': {
    id: '2',
    email: 'business@example.com',
    name: 'Jane Smith',
    role: 'business_owner',
    passwordHash: defaultPasswordHash,
    verified: true,
    loginAttempts: 0,
    createdAt: new Date()
  },
  'admin@example.com': {
    id: '3',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    passwordHash: defaultPasswordHash,
    verified: true,
    loginAttempts: 0,
    createdAt: new Date()
  }
}

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

    // Authenticate user using CouchDB service
    const authResult = await userService.authenticateUser(email, password, clientIP, userAgent)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user!

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
    const tokenPair = generateTokenPair(user._id!, user.email, user.role, sessionId)

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

    const user = Object.values(users).find(u => u.id === session.userId)

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
