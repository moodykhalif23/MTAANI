#!/usr/bin/env node

/**
 * Environment Setup Script for Mtaani Platform
 * This script helps generate secure environment variables
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// Generate a secure random string
function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length)
}

// Generate JWT secrets
function generateJWTSecrets() {
  return {
    JWT_SECRET: generateSecureSecret(64),
    JWT_REFRESH_SECRET: generateSecureSecret(64)
  }
}

// Generate security tokens
function generateSecurityTokens() {
  return {
    SECURITY_VALIDATION_TOKEN: generateSecureSecret(32),
    ADMIN_DASHBOARD_TOKEN: generateSecureSecret(32),
    ADMIN_RESET_TOKEN: generateSecureSecret(32)
  }
}

// Generate database credentials
function generateDatabaseCredentials() {
  return {
    COUCHDB_PASSWORD: generateSecureSecret(24),
    COUCHDB_ADMIN_PASSWORD: generateSecureSecret(24)
  }
}

// Environment templates
const environments = {
  development: {
    NODE_ENV: 'development',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_NAME: 'Mtaani',

    // CouchDB
    COUCHDB_HOST: 'localhost',
    COUCHDB_PORT: '5984',
    COUCHDB_PROTOCOL: 'http',
    COUCHDB_USERNAME: 'mtaani_app',
    COUCHDB_DATABASE: 'mtaani_dev',
    COUCHDB_ADMIN_USERNAME: 'admin',

    // Security
    BCRYPT_SALT_ROUNDS: '12',
    RATE_LIMIT_ENABLED: 'false',
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX_REQUESTS: '1000',

    // Email (Development)
    EMAIL_PROVIDER: 'console',
    SENDGRID_FROM_EMAIL: 'dev@mtaani.local',
    SENDGRID_FROM_NAME: 'Mtaani Dev',

    // Payment (Sandbox)
    MPESA_ENVIRONMENT: 'sandbox',
    MPESA_CALLBACK_URL: 'http://localhost:3000/api/payments/mpesa/callback',

    // Storage
    STORAGE_PROVIDER: 'local',
    UPLOAD_DIR: './uploads',
    MAX_FILE_SIZE: '10485760',

    // CORS
    ALLOWED_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000',
    CORS_ENABLED: 'true',
    ENABLE_SECURITY_HEADERS: 'true',
    ENABLE_RATE_LIMITING: 'false',

    // Logging
    LOG_LEVEL: 'debug',
    LOG_RETENTION_DAYS: '7',
    ENABLE_DEBUG_LOGS: 'true',

    // Feature flags
    ENABLE_EMAIL_VERIFICATION: 'false',
    ENABLE_MFA: 'false',
    ENABLE_GEO_BLOCKING: 'false',
    ENABLE_PAYMENT_VERIFICATION: 'false',
    ENABLE_USAGE_LIMITS: 'false',

    // Development only
    DISABLE_AUTH_FOR_TESTING: 'false',
    MOCK_PAYMENT_PROVIDER: 'true',
    SKIP_EMAIL_VERIFICATION: 'true'
  },

  production: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://mtaani.com',
    NEXT_PUBLIC_APP_NAME: 'Mtaani',

    // CouchDB
    COUCHDB_HOST: 'couchdb.mtaani.com',
    COUCHDB_PORT: '6984',
    COUCHDB_PROTOCOL: 'https',
    COUCHDB_USERNAME: 'mtaani_prod',
    COUCHDB_DATABASE: 'mtaani_prod',
    COUCHDB_ADMIN_USERNAME: 'admin',

    // Security
    BCRYPT_SALT_ROUNDS: '12',
    RATE_LIMIT_ENABLED: 'true',
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX_REQUESTS: '100',

    // Email (Production)
    EMAIL_PROVIDER: 'sendgrid',
    SENDGRID_FROM_EMAIL: 'noreply@mtaani.com',
    SENDGRID_FROM_NAME: 'Mtaani Platform',

    // Payment (Production)
    MPESA_ENVIRONMENT: 'production',
    MPESA_CALLBACK_URL: 'https://mtaani.com/api/payments/mpesa/callback',

    // Storage
    STORAGE_PROVIDER: 's3',
    AWS_S3_BUCKET_NAME: 'mtaani-uploads',
    AWS_S3_REGION: 'us-east-1',

    // CORS
    ALLOWED_ORIGINS: 'https://mtaani.com,https://www.mtaani.com',
    CORS_ENABLED: 'true',
    ENABLE_SECURITY_HEADERS: 'true',
    ENABLE_RATE_LIMITING: 'true',

    // Logging
    LOG_LEVEL: 'warn',
    LOG_RETENTION_DAYS: '90',
    ENABLE_DEBUG_LOGS: 'false',

    // Feature flags
    ENABLE_EMAIL_VERIFICATION: 'true',
    ENABLE_MFA: 'true',
    ENABLE_GEO_BLOCKING: 'true',
    ENABLE_PAYMENT_VERIFICATION: 'true',
    ENABLE_USAGE_LIMITS: 'true',

    // Production only
    DISABLE_AUTH_FOR_TESTING: 'false',
    MOCK_PAYMENT_PROVIDER: 'false',
    SKIP_EMAIL_VERIFICATION: 'false'
  }
}

// Generate environment file
function generateEnvFile(environment = 'development') {
  console.log(`🔧 Generating ${environment} environment file...`)

  const config = environments[environment]
  if (!config) {
    console.error(`❌ Unknown environment: ${environment}`)
    process.exit(1)
  }

  // Generate secure secrets
  const jwtSecrets = generateJWTSecrets()
  const securityTokens = generateSecurityTokens()
  const dbCredentials = generateDatabaseCredentials()

  // Combine all configuration
  const envConfig = {
    ...config,
    ...jwtSecrets,
    ...securityTokens,
    ...dbCredentials
  }

  // Generate .env file content
  let envContent = `# Mtaani Platform Environment Variables - ${environment.toUpperCase()}\n`
  envContent += `# Generated on ${new Date().toISOString()}\n`
  envContent += `# DO NOT COMMIT THIS FILE TO VERSION CONTROL\n\n`

  // Group related variables
  const groups = {
    'APPLICATION SETTINGS': ['NODE_ENV', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_APP_NAME'],
    'JWT AUTHENTICATION': ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'JWT_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN'],
    'COUCHDB DATABASE': ['COUCHDB_HOST', 'COUCHDB_PORT', 'COUCHDB_PROTOCOL', 'COUCHDB_USERNAME', 'COUCHDB_PASSWORD', 'COUCHDB_DATABASE', 'COUCHDB_ADMIN_USERNAME', 'COUCHDB_ADMIN_PASSWORD'],
    'SECURITY CONFIGURATION': ['SECURITY_VALIDATION_TOKEN', 'ADMIN_DASHBOARD_TOKEN', 'ADMIN_RESET_TOKEN', 'BCRYPT_SALT_ROUNDS', 'RATE_LIMIT_ENABLED', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX_REQUESTS'],
    'EMAIL SERVICE': ['EMAIL_PROVIDER', 'SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL', 'SENDGRID_FROM_NAME'],
    'PAYMENT PROVIDERS': ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_BUSINESS_SHORT_CODE', 'MPESA_PASSKEY', 'MPESA_ENVIRONMENT', 'MPESA_CALLBACK_URL'],
    'FILE STORAGE': ['STORAGE_PROVIDER', 'UPLOAD_DIR', 'MAX_FILE_SIZE', 'AWS_S3_BUCKET_NAME', 'AWS_S3_REGION'],
    'CORS & SECURITY': ['ALLOWED_ORIGINS', 'CORS_ENABLED', 'ENABLE_SECURITY_HEADERS', 'ENABLE_RATE_LIMITING'],
    'LOGGING & DEBUGGING': ['LOG_LEVEL', 'LOG_RETENTION_DAYS', 'ENABLE_DEBUG_LOGS'],
    'FEATURE FLAGS': ['ENABLE_EMAIL_VERIFICATION', 'ENABLE_MFA', 'ENABLE_GEO_BLOCKING', 'ENABLE_PAYMENT_VERIFICATION', 'ENABLE_USAGE_LIMITS']
  }

  Object.entries(groups).forEach(([groupName, keys]) => {
    envContent += `# ${groupName}\n`
    keys.forEach(key => {
      if (envConfig[key] !== undefined) {
        envContent += `${key}=${envConfig[key]}\n`
      }
    })
    envContent += '\n'
  })

  // Add placeholder values for external services
  envContent += `# EXTERNAL SERVICES (Add your own keys)\n`
  envContent += `SENDGRID_API_KEY=your_sendgrid_api_key_here\n`
  envContent += `MPESA_CONSUMER_KEY=your_mpesa_consumer_key\n`
  envContent += `MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret\n`
  envContent += `MPESA_PASSKEY=your_mpesa_passkey\n`
  envContent += `GOOGLE_MAPS_API_KEY=your_google_maps_api_key\n`
  envContent += `AWS_S3_ACCESS_KEY_ID=your_aws_access_key\n`
  envContent += `AWS_S3_SECRET_ACCESS_KEY=your_aws_secret_key\n`

  // Write to file (always use .env.local for easier management)
  const filename = '.env.local'
  const filepath = path.join(process.cwd(), filename)

  fs.writeFileSync(filepath, envContent)

  console.log(`✅ Environment file generated: ${filename}`)
  console.log(`🔐 Generated secure secrets:`)
  console.log(`   - JWT Secret: ${jwtSecrets.JWT_SECRET.substring(0, 8)}...`)
  console.log(`   - Security Tokens: ${Object.keys(securityTokens).length} tokens`)
  console.log(`   - Database Passwords: Generated`)
  console.log(`\n⚠️  IMPORTANT:`)
  console.log(`   - Add your external service API keys to ${filename}`)
  console.log(`   - Never commit this file to version control`)
  console.log(`   - Keep these secrets secure`)

  return filepath
}

// CLI interface
function main() {
  const args = process.argv.slice(2)
  const environment = args[0] || 'development'

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔧 Mtaani Environment Setup Script

Usage: node scripts/setup-env.js [environment]

Environments:
  development  Generate .env.local with development settings (default)
  production   Generate .env.local with production settings

Options:
  --help, -h   Show this help message

Examples:
  node scripts/setup-env.js
  node scripts/setup-env.js development
  node scripts/setup-env.js production

Note: Always generates .env.local for easier management
`)
    return
  }

  try {
    generateEnvFile(environment)
  } catch (error) {
    console.error(`❌ Error generating environment file:`, error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { generateEnvFile, generateJWTSecrets, generateSecurityTokens }
