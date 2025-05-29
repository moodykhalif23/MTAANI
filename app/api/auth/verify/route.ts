import { NextRequest, NextResponse } from 'next/server'
import { generateTokenPair, generateSessionId } from '@/lib/jwt'
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
  emailVerificationToken?: string
  emailVerificationExpires?: Date
}

// Import users storage from signup route (in production, use database)
declare global {
  var users: Record<string, User>
}

if (!global.users) {
  global.users = {}
}

// GET /api/auth/verify - Verify email with token from URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user by token
    let user: User | null = null
    let userEmail: string | null = null

    if (email) {
      // If email is provided, look up user directly
      const foundUser = global.users[email.toLowerCase()]
      if (foundUser && foundUser.emailVerificationToken === token) {
        user = foundUser
        userEmail = email.toLowerCase()
      }
    } else {
      // Search all users for the token
      for (const [email, userData] of Object.entries(global.users)) {
        if (userData.emailVerificationToken === token) {
          user = userData
          userEmail = email
          break
        }
      }
    }

    if (!user || !userEmail) {
      securityAudit.logEvent(
        'suspicious_activity',
        'medium',
        'Invalid email verification token used',
        { token: token.substring(0, 8) + '...', email },
        undefined,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (user.verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (user.emailVerificationExpires && new Date() > new Date(user.emailVerificationExpires)) {
      securityAudit.logEvent(
        'suspicious_activity',
        'low',
        'Expired email verification token used',
        { email: userEmail, expiredAt: user.emailVerificationExpires },
        user.id,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new verification email.' },
        { status: 400 }
      )
    }

    // Verify the user
    user.verified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    global.users[userEmail] = user

    // Log successful verification
    securityAudit.logEvent(
      'subscription_access',
      'low',
      'Email verification successful',
      { email: userEmail },
      user.id,
      clientIP,
      userAgent
    )

    // Generate tokens and log the user in
    const sessionId = generateSessionId()
    const tokenPair = generateTokenPair(user.id, user.email, user.role, sessionId)

    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully! You are now logged in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified
      },
      accessToken: tokenPair.accessToken,
      expiresIn: tokenPair.expiresIn
    })

    // Set cookies
    response.cookies.set('mtaani_refresh_token', tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokenPair.refreshExpiresIn,
      path: '/'
    })

    response.cookies.set('mtaani_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    console.log('Email verification successful:', {
      userId: user.id,
      email: userEmail,
      timestamp: new Date().toISOString()
    })

    return response

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/auth/verify - Resend verification email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = global.users[email.toLowerCase()]
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists and is unverified, a verification email has been sent.'
      })
    }

    if (user.verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15)
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    user.emailVerificationToken = verificationToken
    user.emailVerificationExpires = verificationExpires
    global.users[email.toLowerCase()] = user

    // Send verification email (mock implementation)
    try {
      console.log(`📧 Verification email resent for ${user.name} (${email}):`)
      console.log(`Verification link: ${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    // Log verification email resent
    securityAudit.logEvent(
      'subscription_access',
      'low',
      'Verification email resent',
      { email },
      user.id,
      clientIP,
      userAgent
    )

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
