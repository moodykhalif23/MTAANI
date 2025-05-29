import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/jwt'
import { securityAudit } from '@/lib/security-audit'

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

    // Get session from cookie
    const sessionCookie = request.cookies.get('mtaani_session')
    
    // Get access token from header
    const authHeader = request.headers.get('authorization')
    const accessToken = extractTokenFromHeader(authHeader)

    let userId: string | undefined
    let sessionId: string | undefined

    // Try to get user info from access token
    if (accessToken) {
      const tokenResult = verifyAccessToken(accessToken)
      if (tokenResult.valid) {
        userId = tokenResult.payload.userId
        sessionId = tokenResult.payload.sessionId
      }
    }

    // Try to get session info from cookie
    if (sessionCookie) {
      const session = activeSessions.get(sessionCookie.value)
      if (session) {
        userId = userId || session.userId
        sessionId = sessionId || session.sessionId
        
        // Remove session from active sessions
        activeSessions.delete(sessionCookie.value)
      }
    }

    // Log logout event
    securityAudit.logEvent(
      'subscription_access',
      'low',
      'User logout',
      { 
        sessionId,
        hasAccessToken: !!accessToken,
        hasSessionCookie: !!sessionCookie
      },
      userId,
      clientIP,
      userAgent
    )

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear cookies
    response.cookies.set('mtaani_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    response.cookies.set('mtaani_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    
    securityAudit.logEvent(
      'subscription_access',
      'medium',
      'Logout endpoint error',
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

// GET endpoint to logout from all devices
export async function GET(request: NextRequest) {
  try {
    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get access token from header
    const authHeader = request.headers.get('authorization')
    const accessToken = extractTokenFromHeader(authHeader)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      )
    }

    // Verify token
    const tokenResult = verifyAccessToken(accessToken)
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = tokenResult.payload.userId

    // Remove all sessions for this user
    let removedSessions = 0
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.userId === userId) {
        activeSessions.delete(sessionId)
        removedSessions++
      }
    }

    // Log logout from all devices
    securityAudit.logEvent(
      'subscription_access',
      'medium',
      'Logout from all devices',
      { 
        userId,
        removedSessions
      },
      userId,
      clientIP,
      userAgent
    )

    // Create response
    const response = NextResponse.json({
      success: true,
      message: `Logged out from ${removedSessions} devices`,
      removedSessions
    })

    // Clear cookies
    response.cookies.set('mtaani_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    response.cookies.set('mtaani_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Logout all devices error:', error)
    
    securityAudit.logEvent(
      'subscription_access',
      'medium',
      'Logout all devices endpoint error',
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
