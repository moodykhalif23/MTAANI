import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/jwt'
import { securityAudit } from '@/lib/security-audit'

// In-memory user storage (in production, use a database)
interface User {
  id: string
  email: string
  name: string
  role: "user" | "business_owner" | "admin"
  avatar?: string
  businessId?: string
  verified: boolean
  lastLogin?: Date
  createdAt: string
  updatedAt: string
}

// Global storage for users (replace with database in production)
declare global {
  // eslint-disable-next-line no-var
  var usersStorage: User[]
}

if (!global.usersStorage) {
  global.usersStorage = [
    // Default admin user for testing
    {
      id: 'admin_001',
      email: 'admin@mtaani.com',
      name: 'Admin User',
      role: 'admin',
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // Default test user
    {
      id: 'user_001',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

// GET /api/user/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    // Extract and verify access token
    const authHeader = request.headers.get('authorization')
    const accessToken = extractTokenFromHeader(authHeader)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      )
    }

    const tokenResult = verifyAccessToken(accessToken)
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = tokenResult.payload.userId

    // Find user in storage
    const user = global.usersStorage.find(u => u.id === userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user profile (exclude sensitive data)
    const { ...userProfile } = user

    return NextResponse.json({
      success: true,
      data: { user: userProfile }
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/user/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    // Extract and verify access token
    const authHeader = request.headers.get('authorization')
    const accessToken = extractTokenFromHeader(authHeader)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      )
    }

    const tokenResult = verifyAccessToken(accessToken)
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = tokenResult.payload.userId

    // Parse request body
    const body = await request.json()
    const { name, avatar, email } = body

    // Find user in storage
    const userIndex = global.usersStorage.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = global.usersStorage[userIndex]

    // Validate email format if provided
    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check if email is already taken
      const emailExists = global.usersStorage.some(u => u.email === email && u.id !== userId)
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters long' },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = {
      ...user,
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email.toLowerCase() }),
      ...(avatar !== undefined && { avatar }),
      updatedAt: new Date().toISOString()
    }

    global.usersStorage[userIndex] = updatedUser

    // Get client information for logging
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log profile update
    securityAudit.logEvent(
      'profile_updated',
      'low',
      'User profile updated',
      {
        userId,
        updatedFields: Object.keys(body),
        oldEmail: user.email,
        newEmail: updatedUser.email
      },
      userId,
      clientIP,
      userAgent
    )

    console.log('Profile updated successfully:', {
      userId,
      updatedFields: Object.keys(body),
      timestamp: updatedUser.updatedAt
    })

    // Return updated user profile (exclude sensitive data)
    const { ...userProfile } = updatedUser

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userProfile }
    })

  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/user/profile - Complete profile replacement (for admin use)
export async function PUT(request: NextRequest) {
  try {
    // Extract and verify access token
    const authHeader = request.headers.get('authorization')
    const accessToken = extractTokenFromHeader(authHeader)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      )
    }

    const tokenResult = verifyAccessToken(accessToken)
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = tokenResult.payload.userId
    const userRole = tokenResult.payload.role

    // Only admin can perform complete profile replacement
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { targetUserId, name, email, role, verified, avatar } = body

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      )
    }

    // Find target user in storage
    const userIndex = global.usersStorage.findIndex(u => u.id === targetUserId)

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    const user = global.usersStorage[userIndex]

    // Validate inputs
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check if email is already taken
      const emailExists = global.usersStorage.some(u => u.email === email && u.id !== targetUserId)
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    if (role && !['user', 'business_owner', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = {
      ...user,
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email.toLowerCase() }),
      ...(role !== undefined && { role }),
      ...(verified !== undefined && { verified }),
      ...(avatar !== undefined && { avatar }),
      updatedAt: new Date().toISOString()
    }

    global.usersStorage[userIndex] = updatedUser

    // Get client information for logging
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log admin profile update
    securityAudit.logEvent(
      'admin_profile_update',
      'medium',
      'Admin updated user profile',
      {
        adminId: userId,
        targetUserId,
        updatedFields: Object.keys(body),
        oldEmail: user.email,
        newEmail: updatedUser.email,
        oldRole: user.role,
        newRole: updatedUser.role
      },
      userId,
      clientIP,
      userAgent
    )

    console.log('Admin profile update:', {
      adminId: userId,
      targetUserId,
      updatedFields: Object.keys(body),
      timestamp: updatedUser.updatedAt
    })

    // Return updated user profile
    const { ...userProfile } = updatedUser

    return NextResponse.json({
      success: true,
      message: 'User profile updated successfully',
      data: { user: userProfile }
    })

  } catch (error) {
    console.error('Error in admin profile update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
