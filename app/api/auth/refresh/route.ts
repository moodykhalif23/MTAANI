import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, generateTokenPair, generateSessionId } from '@/lib/jwt'
import { securityAudit } from '@/lib/security-audit'

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
  tokenVersion?: number
}

// Mock user database - in production, use a real database
const users: Record<string, User> = {
  '1': {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'user',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO',
    verified: true,
    loginAttempts: 0,
    createdAt: new Date(),
    tokenVersion: 1
  },
  '2': {
    id: '2',
    email: 'business@example.com',
    name: 'Jane Smith',
    role: 'business_owner',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO',
    verified: true,
    loginAttempts: 0,
    createdAt: new Date(),
    tokenVersion: 1
  },
  '3': {
    id: '3',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO',
    verified: true,
    loginAttempts: 0,
    createdAt: new Date(),
    tokenVersion: 1
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
    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get refresh token from cookie
    const refreshTokenCookie = request.cookies.get('mtaani_refresh_token')
    
    if (!refreshTokenCookie) {
      securityAudit.logEvent(
        'invalid_token',
        'medium',
        'Refresh token request without token',
        {},
        undefined,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      )
    }

    // Verify refresh token
    const tokenResult = verifyRefreshToken(refreshTokenCookie.value)
    
    if (!tokenResult.valid) {
      securityAudit.logEvent(
        'invalid_token',
        'high',
        'Invalid refresh token used',
        { 
          expired: tokenResult.expired,
          hasPayload: !!tokenResult.payload.userId
        },
        tokenResult.payload.userId,
        clientIP,
        userAgent
      )

      // Clear invalid refresh token
      const response = NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )

      response.cookies.set('mtaani_refresh_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      })

      return response
    }

    const { userId, sessionId, tokenVersion } = tokenResult.payload

    // Find user
    const user = Object.values(users).find(u => u.id === userId)
    
    if (!user) {
      securityAudit.logEvent(
        'invalid_token',
        'high',
        'Refresh token for non-existent user',
        { userId },
        userId,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Check token version (for token invalidation)
    if (user.tokenVersion && tokenVersion !== user.tokenVersion) {
      securityAudit.logEvent(
        'invalid_token',
        'high',
        'Refresh token with invalid version',
        { 
          userId,
          expectedVersion: user.tokenVersion,
          providedVersion: tokenVersion
        },
        userId,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Token has been invalidated' },
        { status: 401 }
      )
    }

    // Check if session exists
    const session = activeSessions.get(sessionId)
    
    if (!session || session.userId !== userId) {
      securityAudit.logEvent(
        'invalid_token',
        'high',
        'Refresh token for invalid session',
        { userId, sessionId },
        userId,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      securityAudit.logEvent(
        'subscription_access',
        'high',
        'Refresh token attempt on locked account',
        { userId },
        userId,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Account is temporarily locked' },
        { status: 423 }
      )
    }

    // Update session activity
    session.lastActivity = new Date()

    // Generate new token pair
    const newSessionId = generateSessionId()
    const tokenPair = generateTokenPair(
      user.id, 
      user.email, 
      user.role, 
      newSessionId,
      user.tokenVersion || 1
    )

    // Update session with new session ID
    activeSessions.delete(sessionId)
    activeSessions.set(newSessionId, {
      ...session,
      sessionId: newSessionId,
      lastActivity: new Date()
    })

    // Log successful token refresh
    securityAudit.logEvent(
      'subscription_access',
      'low',
      'Token refreshed successfully',
      { 
        userId,
        oldSessionId: sessionId,
        newSessionId
      },
      userId,
      clientIP,
      userAgent
    )

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        lastLogin: user.lastLogin
      },
      accessToken: tokenPair.accessToken,
      expiresIn: tokenPair.expiresIn
    })

    // Set new refresh token cookie
    response.cookies.set('mtaani_refresh_token', tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokenPair.refreshExpiresIn,
      path: '/'
    })

    // Update session cookie
    response.cookies.set('mtaani_session', newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
    
    securityAudit.logEvent(
      'subscription_access',
      'high',
      'Token refresh endpoint error',
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

// GET endpoint to check refresh token validity
export async function GET(request: NextRequest) {
  try {
    const refreshTokenCookie = request.cookies.get('mtaani_refresh_token')
    
    if (!refreshTokenCookie) {
      return NextResponse.json({ valid: false, reason: 'No refresh token' })
    }

    const tokenResult = verifyRefreshToken(refreshTokenCookie.value)
    
    if (!tokenResult.valid) {
      return NextResponse.json({ 
        valid: false, 
        reason: tokenResult.expired ? 'Token expired' : 'Invalid token'
      })
    }

    const { userId, sessionId } = tokenResult.payload
    
    // Check if user exists
    const user = Object.values(users).find(u => u.id === userId)
    if (!user) {
      return NextResponse.json({ valid: false, reason: 'User not found' })
    }

    // Check if session exists
    const session = activeSessions.get(sessionId)
    if (!session || session.userId !== userId) {
      return NextResponse.json({ valid: false, reason: 'Session not found' })
    }

    return NextResponse.json({ 
      valid: true,
      userId,
      sessionId,
      expiresAt: tokenResult.payload.exp ? new Date(tokenResult.payload.exp * 1000) : null
    })

  } catch (error) {
    console.error('Refresh token check error:', error)
    return NextResponse.json({ valid: false, reason: 'Internal error' })
  }
}
