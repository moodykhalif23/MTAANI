import { couchdb } from '../couchdb'
import config from '../config/environment'
import { UserDocument } from '../models'
import { hashPassword, verifyPassword } from '../password'
import { securityAudit } from '../security-audit'

export class UserService {
  private readonly dbName = config.database.database || 'mtaani'

  private databaseChecked = false

  private async ensureDatabase(): Promise<void> {
    if (this.databaseChecked) return
    const exists = await couchdb.databaseExists(this.dbName)
    if (!exists) {
      await couchdb.createDatabase(this.dbName)
      try { await couchdb.createIndex(this.dbName, ['type', 'email']) } catch {}
      try { await couchdb.createIndex(this.dbName, ['type', 'isDeleted']) } catch {}
    }
    this.databaseChecked = true
  }

  // Create a new user
  async createUser(userData: {
    email: string
    name: string
    password: string
    role: 'user' | 'business_owner' | 'admin'
    registrationIP: string
    registrationUserAgent: string
  }): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      await this.ensureDatabase()
      // Check if user already exists
      const existingUser = await this.findUserByEmail(userData.email)
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' }
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password)

      // Create user document
      const userDoc: Omit<UserDocument, '_id' | '_rev' | 'createdAt' | 'updatedAt'> = {
        type: 'user',
        email: userData.email.toLowerCase(),
        name: userData.name.trim(),
        role: userData.role,
        passwordHash,
        verified: false,
        loginAttempts: 0,
        version: 1,
        isDeleted: false,
        profile: {
          preferences: {
            notifications: {
              email: true,
              sms: false,
              push: true
            },
            language: 'en',
            timezone: 'Africa/Nairobi'
          }
        },
        security: {
          tokenVersion: 1,
          twoFactorEnabled: false,
          lastPasswordChange: new Date().toISOString()
        },
        metadata: {
          registrationIP: userData.registrationIP,
          registrationUserAgent: userData.registrationUserAgent
        }
      }

      const response = await couchdb.createDocument(this.dbName, userDoc)

      if (response.ok) {
        // Log user creation
        securityAudit.logEvent(
          'signup',
          'low',
          'User account created',
          { email: userData.email, role: userData.role },
          response.id,
          userData.registrationIP,
          userData.registrationUserAgent
        )

        return { success: true, userId: response.id }
      }

      return { success: false, error: 'Failed to create user' }
    } catch (error) {
      console.error('User creation error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Find user by email
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    try {
      await this.ensureDatabase()
      const result = await couchdb.find<UserDocument>(this.dbName, {
        type: 'user',
        email: email.toLowerCase(),
        isDeleted: false
      }, {
        limit: 1
      })

      return result.docs.length > 0 ? result.docs[0] : null
    } catch (error) {
      console.error('Find user by email error:', error)
      return null
    }
  }

  // Find user by ID
  async findUserById(userId: string): Promise<UserDocument | null> {
    try {
      await this.ensureDatabase()
      const user = await couchdb.getDocument<UserDocument>(this.dbName, userId)
      return user.isDeleted ? null : user
    } catch (error) {
      console.error('Find user by ID error:', error)
      return null
    }
  }

  // Authenticate user
  async authenticateUser(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; user?: UserDocument; error?: string }> {
    try {
      await this.ensureDatabase()
      const user = await this.findUserByEmail(email)

      if (!user) {
        securityAudit.logEvent(
          'login',
          'medium',
          'Login attempt with non-existent email',
          { email },
          undefined,
          ipAddress,
          userAgent
        )
        return { success: false, error: 'Invalid email or password' }
      }

      // Check if account is locked
      if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
        securityAudit.logEvent(
          'login',
          'high',
          'Login attempt on locked account',
          { email, userId: user._id },
          user._id,
          ipAddress,
          userAgent
        )
        return { success: false, error: 'Account is temporarily locked' }
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash)

      if (!isPasswordValid) {
        // Increment login attempts
        await this.incrementLoginAttempts(user)

        securityAudit.logEvent(
          'login',
          'medium',
          'Failed login attempt',
          { email, attempts: user.loginAttempts + 1 },
          user._id,
          ipAddress,
          userAgent
        )

        return { success: false, error: 'Invalid email or password' }
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(user, ipAddress, userAgent)

      securityAudit.logEvent(
        'login',
        'low',
        'Successful login',
        { email },
        user._id,
        ipAddress,
        userAgent
      )

      return { success: true, user }
    } catch (error) {
      console.error('Authentication error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Update user
  async updateUser(
    userId: string,
    updates: Partial<UserDocument>,
    updatedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureDatabase()
      const user = await this.findUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const updatedUser: UserDocument = {
        ...user,
        ...updates,
        version: user.version + 1,
        updatedBy
      }

      const response = await couchdb.updateDocument(this.dbName, updatedUser)
      return { success: response.ok }
    } catch (error) {
      console.error('User update error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Soft delete user
  async deleteUser(
    userId: string,
    deletedBy: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureDatabase()
      const user = await this.findUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const deletedUser: UserDocument = {
        ...user,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy,
        version: user.version + 1
      }

      const response = await couchdb.updateDocument(this.dbName, deletedUser)

      if (response.ok) {
        securityAudit.logEvent(
          'user_deletion',
          'medium',
          'User account deleted',
          { userId, deletedBy, reason },
          userId
        )
      }

      return { success: response.ok }
    } catch (error) {
      console.error('User deletion error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Verify email
  async verifyEmail(
    userId: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureDatabase()
      const user = await this.findUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      if (user.verified) {
        return { success: false, error: 'Email already verified' }
      }

      if (!user.emailVerificationToken || user.emailVerificationToken !== token) {
        return { success: false, error: 'Invalid verification token' }
      }

      if (user.emailVerificationExpires && new Date() > new Date(user.emailVerificationExpires)) {
        return { success: false, error: 'Verification token has expired' }
      }

      const verifiedUser: UserDocument = {
        ...user,
        verified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
        version: user.version + 1,
        metadata: {
          ...user.metadata,
          emailVerifiedAt: new Date().toISOString()
        }
      }

      const response = await couchdb.updateDocument(this.dbName, verifiedUser)
      return { success: response.ok }
    } catch (error) {
      console.error('Email verification error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Change password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureDatabase()
      const user = await this.findUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash)
      if (!isCurrentPasswordValid) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword)

      const updatedUser: UserDocument = {
        ...user,
        passwordHash: newPasswordHash,
        version: user.version + 1,
        security: {
          ...user.security,
          tokenVersion: user.security.tokenVersion + 1, // Invalidate all tokens
          lastPasswordChange: new Date().toISOString()
        }
      }

      const response = await couchdb.updateDocument(this.dbName, updatedUser)

      if (response.ok) {
        securityAudit.logEvent(
          'password_change',
          'medium',
          'Password changed successfully',
          { userId },
          userId
        )
      }

      return { success: response.ok }
    } catch (error) {
      console.error('Password change error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Private helper methods
  private async incrementLoginAttempts(user: UserDocument): Promise<void> {
    try {
      await this.ensureDatabase()
      const attempts = user.loginAttempts + 1
      const shouldLock = attempts >= 5 // Lock after 5 failed attempts

      const updatedUser: UserDocument = {
        ...user,
        loginAttempts: attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : user.lockedUntil, // 30 minutes
        version: user.version + 1
      }

      await couchdb.updateDocument(this.dbName, updatedUser)
    } catch (error) {
      console.error('Increment login attempts error:', error)
    }
  }

  private async resetLoginAttempts(
    user: UserDocument,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      await this.ensureDatabase()
      const updatedUser: UserDocument = {
        ...user,
        loginAttempts: 0,
        lockedUntil: undefined,
        lastLogin: new Date().toISOString(),
        version: user.version + 1,
        metadata: {
          ...user.metadata,
          lastLoginIP: ipAddress,
          lastLoginUserAgent: userAgent
        }
      }

      await couchdb.updateDocument(this.dbName, updatedUser)
    } catch (error) {
      console.error('Reset login attempts error:', error)
    }
  }
}

// Export singleton instance
export const userService = new UserService()
