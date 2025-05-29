// Comprehensive security configuration for Mtaani subscription system

export interface SecurityConfig {
  // Rate limiting
  rateLimiting: {
    enabled: boolean
    windowMs: number // Time window in milliseconds
    maxRequests: number // Max requests per window
    skipSuccessfulRequests: boolean
    skipFailedRequests: boolean
    standardHeaders: boolean
    legacyHeaders: boolean
  }

  // Authentication
  authentication: {
    jwtSecret: string
    jwtExpiresIn: string
    refreshTokenExpiresIn: string
    maxLoginAttempts: number
    lockoutDuration: number // in milliseconds
    requireEmailVerification: boolean
    enableMFA: boolean
  }

  // Subscription security
  subscription: {
    serverValidationRequired: boolean
    clientValidationFallback: boolean
    paymentVerificationRequired: boolean
    usageLimitEnforcement: boolean
    trialLimitations: boolean
    gracePeriodDays: number
  }

  // Monitoring and alerting
  monitoring: {
    enabled: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
    retentionDays: number
    realTimeAlerts: boolean
    alertThresholds: {
      bypassAttempts: number
      invalidTokens: number
      usageViolations: number
      rapidRequests: number
      criticalEvents: number
    }
  }

  // IP and user blocking
  blocking: {
    autoBlockEnabled: boolean
    blockDuration: number // in milliseconds
    maxWarnings: number
    whitelistedIPs: string[]
    blacklistedIPs: string[]
    geoBlocking: {
      enabled: boolean
      allowedCountries: string[]
      blockedCountries: string[]
    }
  }

  // Payment security
  payment: {
    fraudDetection: boolean
    velocityChecks: boolean
    amountLimits: {
      daily: number
      monthly: number
    }
    requireCVV: boolean
    require3DS: boolean
    webhookValidation: boolean
  }

  // API security
  api: {
    corsEnabled: boolean
    allowedOrigins: string[]
    requireApiKey: boolean
    rateLimitByApiKey: boolean
    requestSizeLimit: string
    timeoutMs: number
  }

  // Data protection
  dataProtection: {
    encryptSensitiveData: boolean
    hashPasswords: boolean
    saltRounds: number
    dataRetentionDays: number
    anonymizeAfterDays: number
    gdprCompliance: boolean
  }
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  rateLimiting: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    standardHeaders: true,
    legacyHeaders: false
  },

  authentication: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MS || '1800000'), // 30 minutes
    requireEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    enableMFA: process.env.ENABLE_MFA === 'true'
  },

  subscription: {
    serverValidationRequired: true,
    clientValidationFallback: true,
    paymentVerificationRequired: true,
    usageLimitEnforcement: true,
    trialLimitations: true,
    gracePeriodDays: 3
  },

  monitoring: {
    enabled: true,
    logLevel: 'info',
    retentionDays: 90,
    realTimeAlerts: true,
    alertThresholds: {
      bypassAttempts: 5,
      invalidTokens: 10,
      usageViolations: 15,
      rapidRequests: 50,
      criticalEvents: 3
    }
  },

  blocking: {
    autoBlockEnabled: true,
    blockDuration: 60 * 60 * 1000, // 1 hour
    maxWarnings: 3,
    whitelistedIPs: [],
    blacklistedIPs: [],
    geoBlocking: {
      enabled: false,
      allowedCountries: ['KE', 'UG', 'TZ', 'RW'], // East Africa
      blockedCountries: []
    }
  },

  payment: {
    fraudDetection: true,
    velocityChecks: true,
    amountLimits: {
      daily: 100000, // KES 100,000
      monthly: 500000 // KES 500,000
    },
    requireCVV: true,
    require3DS: true,
    webhookValidation: true
  },

  api: {
    corsEnabled: process.env.CORS_ENABLED === 'true',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'https://mtaani.com',
      'https://www.mtaani.com'
    ],
    requireApiKey: process.env.REQUIRE_API_KEY === 'true',
    rateLimitByApiKey: process.env.ENABLE_RATE_LIMITING === 'true',
    requestSizeLimit: process.env.REQUEST_SIZE_LIMIT || '10mb',
    timeoutMs: parseInt(process.env.API_TIMEOUT_MS || '30000')
  },

  dataProtection: {
    encryptSensitiveData: process.env.ENCRYPT_SENSITIVE_DATA !== 'false',
    hashPasswords: process.env.HASH_PASSWORDS !== 'false',
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '365'),
    anonymizeAfterDays: parseInt(process.env.ANONYMIZE_AFTER_DAYS || '1095'), // 3 years
    gdprCompliance: process.env.GDPR_COMPLIANCE !== 'false'
  }
}

// Environment-specific configurations
export const getSecurityConfig = (): SecurityConfig => {
  const env = process.env.NODE_ENV || 'development'

  switch (env) {
    case 'production':
      return {
        ...defaultSecurityConfig,
        monitoring: {
          ...defaultSecurityConfig.monitoring,
          logLevel: 'warn',
          retentionDays: 365
        },
        authentication: {
          ...defaultSecurityConfig.authentication,
          requireEmailVerification: true,
          enableMFA: true
        },
        blocking: {
          ...defaultSecurityConfig.blocking,
          geoBlocking: {
            enabled: true,
            allowedCountries: ['KE', 'UG', 'TZ', 'RW'],
            blockedCountries: ['CN', 'RU', 'KP'] // High-risk countries
          }
        }
      }

    case 'staging':
      return {
        ...defaultSecurityConfig,
        monitoring: {
          ...defaultSecurityConfig.monitoring,
          logLevel: 'debug',
          retentionDays: 30
        },
        authentication: {
          ...defaultSecurityConfig.authentication,
          requireEmailVerification: false
        }
      }

    case 'development':
    default:
      return {
        ...defaultSecurityConfig,
        rateLimiting: {
          ...defaultSecurityConfig.rateLimiting,
          enabled: false // Disable for development
        },
        monitoring: {
          ...defaultSecurityConfig.monitoring,
          logLevel: 'debug',
          retentionDays: 7
        },
        authentication: {
          ...defaultSecurityConfig.authentication,
          requireEmailVerification: false,
          maxLoginAttempts: 10 // More lenient for development
        },
        blocking: {
          ...defaultSecurityConfig.blocking,
          autoBlockEnabled: false
        }
      }
  }
}

// Security headers configuration
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
}

// Validation functions
export const validateSecurityConfig = (config: Partial<SecurityConfig>): string[] => {
  const errors: string[] = []

  if (!config.authentication?.jwtSecret || config.authentication.jwtSecret === '') {
    errors.push('JWT secret is required and cannot be empty')
  } else if (config.authentication.jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
    errors.push('JWT secret must be changed from default value')
  } else if (config.authentication.jwtSecret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long')
  }

  if (config.rateLimiting?.maxRequests && config.rateLimiting.maxRequests < 10) {
    errors.push('Rate limit max requests should be at least 10')
  }

  if (config.monitoring?.retentionDays && config.monitoring.retentionDays < 7) {
    errors.push('Log retention should be at least 7 days')
  }

  if (config.dataProtection?.saltRounds && config.dataProtection.saltRounds < 10) {
    errors.push('Salt rounds should be at least 10 for security')
  }

  return errors
}

// Export the active configuration
export const securityConfig = getSecurityConfig()

// Validate configuration on import
const configErrors = validateSecurityConfig(securityConfig)
if (configErrors.length > 0) {
  console.warn('⚠️ Security configuration warnings:')
  configErrors.forEach(error => console.warn(`  - ${error}`))
}
