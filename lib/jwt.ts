import jwt from 'jsonwebtoken'
import { securityConfig } from './security-config'

export interface JWTPayload {
  userId: string
  email: string
  role: 'user' | 'business_owner' | 'admin'
  sessionId: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  sessionId: string
  tokenVersion: number
  iat?: number
  exp?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
}

export interface DecodedToken {
  payload: JWTPayload
  expired: boolean
  valid: boolean
}

// JWT Secret keys
const JWT_SECRET = securityConfig.authentication.jwtSecret
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}_refresh`

// Token expiration times
const ACCESS_TOKEN_EXPIRY = securityConfig.authentication.jwtExpiresIn
const REFRESH_TOKEN_EXPIRY = securityConfig.authentication.refreshTokenExpiresIn

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'mtaani-app',
    audience: 'mtaani-users'
  })
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'mtaani-app',
    audience: 'mtaani-users'
  })
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(
  userId: string,
  email: string,
  role: 'user' | 'business_owner' | 'admin',
  sessionId: string,
  tokenVersion: number = 1
): TokenPair {
  const accessToken = generateAccessToken({
    userId,
    email,
    role,
    sessionId
  })

  const refreshToken = generateRefreshToken({
    userId,
    sessionId,
    tokenVersion
  })

  return {
    accessToken,
    refreshToken,
    expiresIn: getTokenExpirySeconds(ACCESS_TOKEN_EXPIRY),
    refreshExpiresIn: getTokenExpirySeconds(REFRESH_TOKEN_EXPIRY)
  }
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'mtaani-app',
      audience: 'mtaani-users'
    }) as JWTPayload

    return {
      payload: decoded,
      expired: false,
      valid: true
    }
  } catch (error) {
    const isExpired = error instanceof jwt.TokenExpiredError

    // Try to decode without verification to get payload for expired tokens
    let payload: JWTPayload | null = null
    try {
      payload = jwt.decode(token) as JWTPayload
    } catch {
      // Token is completely invalid
    }

    return {
      payload: payload || {} as JWTPayload,
      expired: isExpired,
      valid: false
    }
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): {
  payload: RefreshTokenPayload
  expired: boolean
  valid: boolean
} {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET, {
      issuer: 'mtaani-app',
      audience: 'mtaani-users'
    }) as RefreshTokenPayload

    return {
      payload: decoded,
      expired: false,
      valid: true
    }
  } catch (error) {
    const isExpired = error instanceof jwt.TokenExpiredError

    let payload: RefreshTokenPayload | null = null
    try {
      payload = jwt.decode(token) as RefreshTokenPayload
    } catch {
      // Token is completely invalid
    }

    return {
      payload: payload || {} as RefreshTokenPayload,
      expired: isExpired,
      valid: false
    }
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return parts[1]
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Convert time string to seconds
 */
function getTokenExpirySeconds(timeString: string): number {
  const unit = timeString.slice(-1)
  const value = parseInt(timeString.slice(0, -1))

  switch (unit) {
    case 's': return value
    case 'm': return value * 60
    case 'h': return value * 60 * 60
    case 'd': return value * 24 * 60 * 60
    default: return 3600 // Default to 1 hour
  }
}

/**
 * Check if token is about to expire (within 5 minutes)
 */
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    if (!decoded.exp) return true

    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = decoded.exp - now

    return timeUntilExpiry < 300 // 5 minutes
  } catch {
    return true
  }
}

/**
 * Get token expiry date
 */
export function getTokenExpiry(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    if (!decoded.exp) return null

    return new Date(decoded.exp * 1000)
  } catch {
    return null
  }
}

/**
 * Validate JWT secret strength
 */
export function validateJWTSecret(): { valid: boolean; message: string } {
  if (!JWT_SECRET || JWT_SECRET === '') {
    return {
      valid: false,
      message: 'JWT secret is required and cannot be empty. Please set JWT_SECRET in your environment variables.'
    }
  }

  if (JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
    return {
      valid: false,
      message: 'JWT secret must be changed from default value'
    }
  }

  if (JWT_SECRET.length < 32) {
    return {
      valid: false,
      message: 'JWT secret must be at least 32 characters long'
    }
  }

  return {
    valid: true,
    message: 'JWT secret is valid'
  }
}

// Validate JWT secret on module load
const secretValidation = validateJWTSecret()
if (!secretValidation.valid) {
  console.warn(`⚠️ JWT Security Warning: ${secretValidation.message}`)
}
