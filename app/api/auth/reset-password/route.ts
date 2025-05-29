import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, validatePasswordStrength, isPasswordCompromised, verifyResetToken } from '@/lib/password'
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
  var users: Record<string, User>
}

if (!global.users) {
  global.users = {}
}

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, newPassword, confirmPassword } = body

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate input
    if (!token || !email || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
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

    const user = global.users[email.toLowerCase()]
    
    if (!user) {
      securityAudit.logEvent(
        'suspicious_activity',
        'medium',
        'Password reset attempted for non-existent user',
        { email, token: token.substring(0, 8) + '...' },
        undefined,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Invalid reset link' },
        { status: 400 }
      )
    }

    // Check if reset token exists and hasn't expired
    if (!user.passwordResetToken || !user.passwordResetExpires) {
      securityAudit.logEvent(
        'suspicious_activity',
        'medium',
        'Password reset attempted without valid token',
        { email, userId: user.id },
        user.id,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > new Date(user.passwordResetExpires)) {
      securityAudit.logEvent(
        'suspicious_activity',
        'low',
        'Expired password reset token used',
        { email, userId: user.id, expiredAt: user.passwordResetExpires },
        user.id,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Reset link has expired. Please request a new password reset.' },
        { status: 400 }
      )
    }

    // Verify the reset token
    const isValidToken = await verifyResetToken(token, user.passwordResetToken)
    if (!isValidToken) {
      securityAudit.logEvent(
        'suspicious_activity',
        'high',
        'Invalid password reset token used',
        { email, userId: user.id, token: token.substring(0, 8) + '...' },
        user.id,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Invalid reset link' },
        { status: 400 }
      )
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          passwordErrors: passwordValidation.errors,
          passwordScore: passwordValidation.score
        },
        { status: 400 }
      )
    }

    // Check for compromised password
    if (isPasswordCompromised(newPassword)) {
      return NextResponse.json(
        { error: 'This password has been found in data breaches. Please choose a different password.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update user with new password and clear reset token
    user.passwordHash = newPasswordHash
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.loginAttempts = 0 // Reset login attempts
    user.lockedUntil = undefined // Unlock account if it was locked
    global.users[email.toLowerCase()] = user

    // Log successful password reset
    securityAudit.logEvent(
      'subscription_access',
      'medium',
      'Password reset completed successfully',
      { email, userId: user.id },
      user.id,
      clientIP,
      userAgent
    )

    console.log('Password reset successful:', {
      userId: user.id,
      email,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/auth/reset-password - Validate reset token (same as forgot-password GET)
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

    // Verify token
    const isValidToken = await verifyResetToken(token, user.passwordResetToken)
    if (!isValidToken) {
      return NextResponse.json({ valid: false, error: 'Invalid reset link' })
    }

    return NextResponse.json({ 
      valid: true,
      email: user.email,
      name: user.name
    })

  } catch (error) {
    console.error('Reset token validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
