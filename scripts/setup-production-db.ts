#!/usr/bin/env tsx

import { CouchDBClient } from '../lib/couchdb'
import { config } from '../lib/config/environment'

interface DatabaseSetupConfig {
  name: string
  security?: {
    admins?: { names?: string[]; roles?: string[] }
    members?: { names?: string[]; roles?: string[] }
  }
  indexes?: Array<{
    name: string
    fields: string[]
    type?: 'json' | 'text'
  }>
}

const databases: DatabaseSetupConfig[] = [
  {
    name: config.database.database,
    security: {
      admins: {
        names: [config.database.username],
        roles: ['admin']
      },
      members: {
        names: [config.database.username],
        roles: ['user']
      }
    },
    indexes: [
      // Business indexes
      { name: 'business-type-status', fields: ['type', 'status'] },
      { name: 'business-category', fields: ['type', 'category'] },
      { name: 'business-location', fields: ['type', 'location.county', 'location.town'] },
      { name: 'business-owner', fields: ['type', 'ownerId'] },
      { name: 'business-created', fields: ['type', 'createdAt'] },
      
      // Event indexes
      { name: 'event-type-status', fields: ['type', 'status'] },
      { name: 'event-category', fields: ['type', 'category'] },
      { name: 'event-organizer', fields: ['type', 'organizerId'] },
      { name: 'event-dates', fields: ['type', 'schedule.startDate'] },
      { name: 'event-created', fields: ['type', 'createdAt'] },
      
      // Subscription indexes
      { name: 'subscription-user', fields: ['type', 'userId'] },
      { name: 'subscription-business', fields: ['type', 'businessId'] },
      { name: 'subscription-plan', fields: ['type', 'plan'] },
      { name: 'subscription-status', fields: ['type', 'status'] },
      
      // API Key indexes
      { name: 'apikey-type-status', fields: ['type', 'status'] },
      { name: 'apikey-created-by', fields: ['type', 'createdBy'] },
      
      // User indexes
      { name: 'user-email', fields: ['type', 'email'] },
      { name: 'user-role', fields: ['type', 'role'] },
      { name: 'user-status', fields: ['type', 'status'] },
      
      // General indexes
      { name: 'type-created', fields: ['type', 'createdAt'] },
      { name: 'type-updated', fields: ['type', 'updatedAt'] },
      { name: 'deleted-filter', fields: ['type', 'isDeleted'] }
    ]
  }
]

class ProductionDatabaseSetup {
  private client: CouchDBClient

  constructor() {
    this.client = new CouchDBClient({
      host: config.database.host,
      port: config.database.port,
      protocol: config.database.protocol,
      username: config.database.username,
      password: config.database.password,
      database: config.database.database,
      maxRetries: 3,
      timeout: 30000
    })
  }

  async setup(): Promise<void> {
    console.log('🚀 Starting production database setup...')
    console.log(`📍 Target: ${config.database.protocol}://${config.database.host}:${config.database.port}`)
    
    try {
      // Test connection
      await this.testConnection()
      
      // Setup databases
      for (const dbConfig of databases) {
        await this.setupDatabase(dbConfig)
      }
      
      console.log('✅ Production database setup completed successfully!')
      
    } catch (error) {
      console.error('❌ Database setup failed:', error)
      process.exit(1)
    }
  }

  private async testConnection(): Promise<void> {
    console.log('🔍 Testing database connection...')
    
    try {
      // Test basic connectivity by trying to get server info
      const response = await fetch(`${config.database.protocol}://${config.database.host}:${config.database.port}/`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.database.username}:${config.database.password}`).toString('base64')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status} ${response.statusText}`)
      }
      
      const info = await response.json()
      console.log(`✅ Connected to CouchDB ${info.version}`)
      console.log(`📊 Server: ${info.vendor?.name || 'CouchDB'}`)
      
    } catch (error) {
      console.error('❌ Connection test failed:', error)
      throw error
    }
  }

  private async setupDatabase(dbConfig: DatabaseSetupConfig): Promise<void> {
    console.log(`\n📁 Setting up database: ${dbConfig.name}`)
    
    try {
      // Check if database exists
      const exists = await this.client.databaseExists(dbConfig.name)
      
      if (!exists) {
        console.log(`  📝 Creating database: ${dbConfig.name}`)
        await this.client.createDatabase(dbConfig.name)
        console.log(`  ✅ Database created: ${dbConfig.name}`)
      } else {
        console.log(`  ℹ️  Database already exists: ${dbConfig.name}`)
      }
      
      // Set security
      if (dbConfig.security) {
        console.log(`  🔒 Setting database security...`)
        await this.client.setSecurity(dbConfig.name, dbConfig.security)
        console.log(`  ✅ Security configured`)
      }
      
      // Create indexes
      if (dbConfig.indexes) {
        console.log(`  📇 Creating indexes...`)
        
        for (const index of dbConfig.indexes) {
          try {
            await this.client.createIndex(
              dbConfig.name,
              index.fields,
              index.name,
              index.type
            )
            console.log(`    ✅ Index created: ${index.name}`)
          } catch (error: any) {
            if (error.message?.includes('already exists')) {
              console.log(`    ℹ️  Index already exists: ${index.name}`)
            } else {
              console.warn(`    ⚠️  Failed to create index ${index.name}:`, error.message)
            }
          }
        }
      }
      
      console.log(`  ✅ Database setup completed: ${dbConfig.name}`)
      
    } catch (error) {
      console.error(`  ❌ Failed to setup database ${dbConfig.name}:`, error)
      throw error
    }
  }

  async verifySetup(): Promise<void> {
    console.log('\n🔍 Verifying database setup...')
    
    try {
      for (const dbConfig of databases) {
        const exists = await this.client.databaseExists(dbConfig.name)
        if (!exists) {
          throw new Error(`Database ${dbConfig.name} was not created`)
        }
        console.log(`  ✅ ${dbConfig.name}: OK`)
      }
      
      console.log('✅ All databases verified successfully!')
      
    } catch (error) {
      console.error('❌ Database verification failed:', error)
      throw error
    }
  }

  async createBackupUser(): Promise<void> {
    console.log('\n👤 Creating backup user...')
    
    try {
      // This would create a dedicated backup user with read-only access
      // Implementation depends on your CouchDB setup
      console.log('ℹ️  Backup user creation should be done manually in CouchDB admin interface')
      console.log('📋 Recommended backup user permissions: read-only access to all databases')
      
    } catch (error) {
      console.warn('⚠️  Could not create backup user:', error)
    }
  }
}

// Main execution
async function main() {
  console.log('🏗️  Mtaani Production Database Setup')
  console.log('=====================================\n')
  
  // Validate environment
  if (!config.app.isProduction) {
    console.warn('⚠️  Warning: Not running in production mode')
    console.log('Set NODE_ENV=production for production setup\n')
  }
  
  const setup = new ProductionDatabaseSetup()
  
  try {
    await setup.setup()
    await setup.verifySetup()
    await setup.createBackupUser()
    
    console.log('\n🎉 Production database setup completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Test database connectivity from your application')
    console.log('2. Set up database backups')
    console.log('3. Configure monitoring and alerts')
    console.log('4. Review security settings')
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { ProductionDatabaseSetup }
