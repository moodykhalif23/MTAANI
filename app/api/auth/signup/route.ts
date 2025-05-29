import { NextRequest, NextResponse } from 'next/server'
import { generateTokenPair, generateSessionId } from '@/lib/jwt'
import { hashPassword, validatePasswordStrength, isPasswordCompromised } from '@/lib/password'
import { securityAudit } from '@/lib/security-audit'
import { securityConfig } from '@/lib/security-config'

interface SignupRequest {
  name: string
  email: string
  password: string
  role?: 'user' | 'business_owner'
  agreeToTerms: boolean
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
  emailVerificationToken?: string
  emailVerificationExpires?: Date
}

// Mock user database - in production, use a real database
const users: Record<string, User> = {}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Generate email verification token
function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// Send verification email (mock implementation)
async function sendVerificationEmail(email: string, token: string, name: string): Promise<boolean> {
  try {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`📧 Verification email for ${name} (${email}):`)
    console.log(`Verification link: ${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`)
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return true
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json()
    const { name, email, password, role = 'user', agreeToTerms } = body

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate input
    if (!name || !email || !password) {
      securityAudit.logEvent(
        'subscription_access',
        'medium',
        'Signup attempt with missing fields',
        { name: !!name, email: !!email, password: !!password },
        undefined,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate terms agreement
    if (!agreeToTerms) {
      return NextResponse.json(
        { error: 'You must agree to the terms and conditions' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if user already exists
    if (users[email.toLowerCase()]) {
      securityAudit.logEvent(
        'subscription_access',
        'medium',
        'Signup attempt with existing email',
        { email },
        undefined,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
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
    if (isPasswordCompromised(password)) {
      return NextResponse.json(
        { error: 'This password has been found in data breaches. Please choose a different password.' },
        { status: 400 }
      )
    }

    // Validate name
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 50 characters' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['user', 'business_owner'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    try {
      // Hash password
      const passwordHash = await hashPassword(password)

      // Generate verification token
      const verificationToken = generateVerificationToken()
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const newUser: User = {
        id: userId,
        email: email.toLowerCase(),
        name: name.trim(),
        role,
        passwordHash,
        verified: !securityConfig.authentication.requireEmailVerification,
        loginAttempts: 0,
        createdAt: new Date(),
        emailVerificationToken: securityConfig.authentication.requireEmailVerification ? verificationToken : undefined,
        emailVerificationExpires: securityConfig.authentication.requireEmailVerification ? verificationExpires : undefined
      }

      // Store user
      users[email.toLowerCase()] = newUser

      // Send verification email if required
      if (securityConfig.authentication.requireEmailVerification) {
        const emailSent = await sendVerificationEmail(email, verificationToken, name)
        
        if (!emailSent) {
          // Remove user if email failed to send
          delete users[email.toLowerCase()]
          
          return NextResponse.json(
            { error: 'Failed to send verification email. Please try again.' },
            { status: 500 }
          )
        }
      }

      // Log successful signup
      securityAudit.logEvent(
        'subscription_access',
        'low',
        'Successful user signup',
        { 
          email, 
          role, 
          requiresVerification: securityConfig.authentication.requireEmailVerification 
        },
        userId,
        clientIP,
        userAgent
      )

      // If email verification is not required, log them in immediately
      if (!securityConfig.authentication.requireEmailVerification) {
        const sessionId = generateSessionId()
        const tokenPair = generateTokenPair(newUser.id, newUser.email, newUser.role, sessionId)

        const response = NextResponse.json({
          success: true,
          message: 'Account created successfully',
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            verified: newUser.verified
          },
          accessToken: tokenPair.accessToken,
          expiresIn: tokenPair.expiresIn,
          requiresVerification: false
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

        return response
      }

      // Return success response for email verification flow
      return NextResponse.json({
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          verified: newUser.verified
        },
        requiresVerification: true
      })

    } catch (error) {
      console.error('Password hashing error:', error)
      
      securityAudit.logEvent(
        'subscription_access',
        'high',
        'Signup password hashing failed',
        { email, error: error instanceof Error ? error.message : 'Unknown error' },
        undefined,
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Signup error:', error)
    
    securityAudit.logEvent(
      'subscription_access',
      'high',
      'Signup endpoint error',
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

// GET endpoint to check email availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({
        available: false,
        reason: 'Invalid email format'
      })
    }

    const exists = !!users[email.toLowerCase()]

    return NextResponse.json({
      available: !exists,
      reason: exists ? 'Email already registered' : 'Email available'
    })

  } catch (error) {
    console.error('Email check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
