import bcrypt from 'bcryptjs'
import { securityConfig } from './security-config'

const SALT_ROUNDS = securityConfig.dataProtection.saltRounds

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hashedPassword = await bcrypt.hash(password, salt)
    return hashedPassword
  } catch (error) {
    console.error('Password hashing failed:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Password verification failed:', error)
    return false
  }
}

/**
 * Validate password strength
 */
export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  score: number // 0-100
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else if (password.length >= 8) {
    score += 20
  }

  if (password.length >= 12) {
    score += 10
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 15
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 15
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 15
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    score += 15
  }

  // No common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i
  ]

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password))
  if (hasCommonPattern) {
    errors.push('Password contains common patterns and is not secure')
    score -= 20
  } else {
    score += 10
  }

  // Bonus for length
  if (password.length >= 16) {
    score += 10
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score))

  return {
    isValid: errors.length === 0,
    errors,
    score
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Check if password has been compromised (basic check)
 * In production, you might want to integrate with HaveIBeenPwned API
 */
export function isPasswordCompromised(password: string): boolean {
  const commonPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
    'iloveyou',
    'princess',
    'rockyou',
    '12345678'
  ]
  
  return commonPasswords.includes(password.toLowerCase())
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  
  return token
}

/**
 * Hash password reset token for storage
 */
export async function hashResetToken(token: string): Promise<string> {
  return await hashPassword(token)
}

/**
 * Verify password reset token
 */
export async function verifyResetToken(token: string, hashedToken: string): Promise<boolean> {
  return await verifyPassword(token, hashedToken)
}

/**
 * Get password strength description
 */
export function getPasswordStrengthDescription(score: number): {
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
  description: string
  color: string
} {
  if (score < 20) {
    return {
      level: 'very-weak',
      description: 'Very Weak',
      color: '#ff4444'
    }
  } else if (score < 40) {
    return {
      level: 'weak',
      description: 'Weak',
      color: '#ff8800'
    }
  } else if (score < 60) {
    return {
      level: 'fair',
      description: 'Fair',
      color: '#ffaa00'
    }
  } else if (score < 80) {
    return {
      level: 'good',
      description: 'Good',
      color: '#88cc00'
    }
  } else {
    return {
      level: 'strong',
      description: 'Strong',
      color: '#00aa00'
    }
  }
}
