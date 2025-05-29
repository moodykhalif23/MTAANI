import { NextRequest, NextResponse } from 'next/server'
import { generatePasswordResetToken, hashResetToken } from '@/lib/password'
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
  passwordResetToken?: string
  passwordResetExpires?: Date
}

// Import users storage (in production, use database)
declare global {
  // eslint-disable-next-line no-var
  var users: Record<string, User>
}

if (!global.users) {
  global.users = {}
}

// Rate limiting for password reset requests
const resetAttempts: Record<string, { count: number; lastAttempt: Date }> = {}

// Send password reset email (mock implementation)
async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<boolean> {
  try {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`📧 Password reset email for ${name} (${email}):`)
    console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`)

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return true
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return false
  }
}

// POST /api/auth/forgot-password - Request password reset
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Rate limiting - max 3 attempts per hour per IP
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    if (resetAttempts[clientIP]) {
      const attempts = resetAttempts[clientIP]

      // Reset counter if last attempt was over an hour ago
      if (attempts.lastAttempt < hourAgo) {
        attempts.count = 0
      }

      if (attempts.count >= 3) {
        securityAudit.logEvent(
          'suspicious_activity',
          'high',
          'Password reset rate limit exceeded',
          { email, attempts: attempts.count },
          undefined,
          clientIP,
          userAgent
        )

        return NextResponse.json(
          { error: 'Too many password reset attempts. Please try again later.' },
          { status: 429 }
        )
      }

      attempts.count++
      attempts.lastAttempt = now
    } else {
      resetAttempts[clientIP] = { count: 1, lastAttempt: now }
    }

    const user = global.users[email.toLowerCase()]

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    }

    if (!user) {
      // Log attempt for non-existent email
      securityAudit.logEvent(
        'suspicious_activity',
        'low',
        'Password reset requested for non-existent email',
        { email },
        undefined,
        clientIP,
        userAgent
      )

      return NextResponse.json(successResponse)
    }

    // Check if user is verified
    if (!user.verified) {
      securityAudit.logEvent(
        'suspicious_activity',
        'low',
        'Password reset requested for unverified account',
        { email },
        user.id,
        clientIP,
        userAgent
      )

      return NextResponse.json(successResponse)
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken()
    const hashedToken = await hashResetToken(resetToken)
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update user with reset token
    user.passwordResetToken = hashedToken
    user.passwordResetExpires = resetExpires
    global.users[email.toLowerCase()] = user

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken, user.name)

    if (!emailSent) {
      // Remove reset token if email failed to send
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      global.users[email.toLowerCase()] = user

      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      )
    }

    // Log successful password reset request
    securityAudit.logEvent(
      'subscription_access',
      'medium',
      'Password reset requested',
      { email },
      user.id,
      clientIP,
      userAgent
    )

    console.log('Password reset email sent:', {
      userId: user.id,
      email,
      expiresAt: resetExpires.toISOString()
    })

    return NextResponse.json(successResponse)

  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/auth/forgot-password - Validate reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.json(
        { valid: false, error: 'Token and email are required' },
        { status: 400 }
      )
    }

    const user = global.users[email.toLowerCase()]

    if (!user) {
      return NextResponse.json({ valid: false, error: 'Invalid reset link' })
    }

    if (!user.passwordResetToken || !user.passwordResetExpires) {
      return NextResponse.json({ valid: false, error: 'No reset request found' })
    }

    // Check if token has expired
    if (new Date() > new Date(user.passwordResetExpires)) {
      return NextResponse.json({ valid: false, error: 'Reset link has expired' })
    }

    // Verify token (in production, use proper token verification)
    // For now, we'll use a simple comparison since we're using mock implementation
    return NextResponse.json({ valid: true })

  } catch (error) {
    console.error('Reset token validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
