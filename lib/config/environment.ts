import { z } from 'zod'

// Environment validation schema
const environmentSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),

  // CouchDB
  COUCHDB_HOST: z.string().min(1),
  COUCHDB_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  COUCHDB_PROTOCOL: z.enum(['http', 'https']),
  COUCHDB_USERNAME: z.string().min(1),
  COUCHDB_PASSWORD: z.string().min(8),
  COUCHDB_DATABASE: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security
  SECURITY_VALIDATION_TOKEN: z.string().min(32),
  INTERNAL_API_KEY: z.string().min(32),
  ADMIN_API_KEY: z.string().min(32),
  ADMIN_DASHBOARD_TOKEN: z.string().min(32),

  // Optional SSL
  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),
  SSL_CA_PATH: z.string().optional(),

  // Optional Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).optional(),
  SMTP_SECURE: z.string().transform(val => val === 'true').optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // Optional AWS
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Optional Monitoring
  SENTRY_DSN: z.string().url().optional(),
  DATADOG_API_KEY: z.string().optional(),

  // Optional External Services
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),

  // Feature Flags
  FEATURE_BUSINESS_TOOLS: z.string().transform(val => val === 'true').default('true'),
  FEATURE_EVENT_MANAGEMENT: z.string().transform(val => val === 'true').default('true'),
  FEATURE_SUBSCRIPTION_SYSTEM: z.string().transform(val => val === 'true').default('true'),
  FEATURE_API_GATEWAY: z.string().transform(val => val === 'true').default('true'),
  FEATURE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),

  // Development
  DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  MOCK_DATA_ENABLED: z.string().transform(val => val === 'true').default('false'),
})

export type Environment = z.infer<typeof environmentSchema>

// Validate environment variables
export function validateEnvironment(): Environment {
  try {
    return environmentSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      
      console.error('❌ Environment validation failed:')
      console.error(missingVars)
      console.error('\n📋 Required environment variables:')
      console.error('- COUCHDB_HOST, COUCHDB_USERNAME, COUCHDB_PASSWORD')
      console.error('- JWT_SECRET (min 32 characters)')
      console.error('- SECURITY_VALIDATION_TOKEN (min 32 characters)')
      console.error('- INTERNAL_API_KEY, ADMIN_API_KEY, ADMIN_DASHBOARD_TOKEN')
      console.error('\n💡 Copy .env.production to .env.local and fill in the values')
      
      process.exit(1)
    }
    throw error
  }
}

// Get validated environment
export const env = validateEnvironment()

// Environment-specific configurations
export const config = {
  app: {
    name: 'Mtaani',
    version: '1.0.0',
    url: env.NEXT_PUBLIC_APP_URL,
    apiUrl: env.NEXT_PUBLIC_API_URL,
    environment: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    debugMode: env.DEBUG_MODE,
  },

  database: {
    host: env.COUCHDB_HOST,
    port: env.COUCHDB_PORT,
    protocol: env.COUCHDB_PROTOCOL,
    username: env.COUCHDB_USERNAME,
    password: env.COUCHDB_PASSWORD,
    database: env.COUCHDB_DATABASE,
    url: `${env.COUCHDB_PROTOCOL}://${env.COUCHDB_HOST}:${env.COUCHDB_PORT}`,
    maxRetries: 3,
    timeout: 30000,
  },

  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  security: {
    validationToken: env.SECURITY_VALIDATION_TOKEN,
    internalApiKey: env.INTERNAL_API_KEY,
    adminApiKey: env.ADMIN_API_KEY,
    adminDashboardToken: env.ADMIN_DASHBOARD_TOKEN,
  },

  ssl: {
    certPath: env.SSL_CERT_PATH,
    keyPath: env.SSL_KEY_PATH,
    caPath: env.SSL_CA_PATH,
    enabled: !!(env.SSL_CERT_PATH && env.SSL_KEY_PATH),
  },

  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    enabled: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD),
  },

  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    s3Bucket: env.AWS_S3_BUCKET,
    enabled: !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY),
  },

  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    datadogApiKey: env.DATADOG_API_KEY,
    sentryEnabled: !!env.SENTRY_DSN,
    datadogEnabled: !!env.DATADOG_API_KEY,
  },

  features: {
    businessTools: env.FEATURE_BUSINESS_TOOLS,
    eventManagement: env.FEATURE_EVENT_MANAGEMENT,
    subscriptionSystem: env.FEATURE_SUBSCRIPTION_SYSTEM,
    apiGateway: env.FEATURE_API_GATEWAY,
    analytics: env.FEATURE_ANALYTICS,
  },

  external: {
    googleMapsApiKey: env.GOOGLE_MAPS_API_KEY,
    twilioAccountSid: env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: env.TWILIO_AUTH_TOKEN,
  },
}

// Configuration validation
export function validateConfiguration() {
  const errors: string[] = []

  // Check critical configurations
  if (config.app.isProduction) {
    if (!config.ssl.enabled && config.database.protocol === 'http') {
      errors.push('Production environment should use HTTPS for database connections')
    }

    if (config.auth.jwtSecret.length < 64) {
      errors.push('JWT secret should be at least 64 characters in production')
    }

    if (!config.monitoring.sentryEnabled) {
      console.warn('⚠️  Warning: Sentry monitoring is not configured for production')
    }

    if (!config.email.enabled) {
      console.warn('⚠️  Warning: Email service is not configured')
    }
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:')
    errors.forEach(error => console.error(`- ${error}`))
    process.exit(1)
  }

  console.log('✅ Configuration validation passed')
  console.log(`🚀 Starting ${config.app.name} in ${config.app.environment} mode`)
  
  if (config.app.isProduction) {
    console.log(`🌐 App URL: ${config.app.url}`)
    console.log(`🗄️  Database: ${config.database.host}:${config.database.port}`)
    console.log(`🔒 SSL: ${config.ssl.enabled ? 'Enabled' : 'Disabled'}`)
    console.log(`📧 Email: ${config.email.enabled ? 'Enabled' : 'Disabled'}`)
    console.log(`☁️  AWS: ${config.aws.enabled ? 'Enabled' : 'Disabled'}`)
    console.log(`📊 Monitoring: ${config.monitoring.sentryEnabled ? 'Enabled' : 'Disabled'}`)
  }
}

// Export for use in other modules
export default config
