#!/usr/bin/env tsx

/**
 * Search Index Builder Script
 * 
 * This script builds the search index for all businesses and events in the database.
 * It should be run:
 * - After initial data import
 * - Periodically to refresh the search index
 * - When search algorithm changes
 * 
 * Usage:
 * npm run build-search-index
 * or
 * tsx scripts/build-search-index.ts
 */

import { couchdb } from '../lib/couchdb'
import { searchIndexService } from '../lib/services/search-index-service'
import { BusinessDocument, EventDocument } from '../lib/models'

interface IndexStats {
  businessesProcessed: number
  eventsProcessed: number
  businessesIndexed: number
  eventsIndexed: number
  errors: number
  startTime: number
  endTime?: number
}

class SearchIndexBuilder {
  private stats: IndexStats = {
    businessesProcessed: 0,
    eventsProcessed: 0,
    businessesIndexed: 0,
    eventsIndexed: 0,
    errors: 0,
    startTime: Date.now()
  }

  async buildIndex(options: {
    rebuildAll?: boolean
    batchSize?: number
    onlyType?: 'business' | 'event'
  } = {}) {
    const { rebuildAll = false, batchSize = 50, onlyType } = options

    console.log('🔍 Starting search index build...')
    console.log(`Options: rebuildAll=${rebuildAll}, batchSize=${batchSize}, onlyType=${onlyType || 'all'}`)

    try {
      // Clear existing index if rebuilding all
      if (rebuildAll) {
        await this.clearSearchIndex()
      }

      // Index businesses
      if (!onlyType || onlyType === 'business') {
        await this.indexBusinesses(batchSize)
      }

      // Index events
      if (!onlyType || onlyType === 'event') {
        await this.indexEvents(batchSize)
      }

      this.stats.endTime = Date.now()
      this.printStats()

    } catch (error) {
      console.error('❌ Search index build failed:', error)
      process.exit(1)
    }
  }

  private async clearSearchIndex() {
    console.log('🗑️  Clearing existing search index...')
    
    try {
      // Find all search index documents
      const result = await couchdb.find('mtaani', {
        type: 'search_index'
      }, {
        limit: 1000,
        fields: ['_id', '_rev']
      })

      if (result.docs.length > 0) {
        console.log(`Found ${result.docs.length} existing search index documents`)
        
        // Delete in batches
        const batchSize = 50
        for (let i = 0; i < result.docs.length; i += batchSize) {
          const batch = result.docs.slice(i, i + batchSize)
          const deletePromises = batch.map(doc => 
            couchdb.delete('mtaani', doc._id!, doc._rev!)
          )
          
          await Promise.allSettled(deletePromises)
          console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(result.docs.length / batchSize)}`)
        }
      }

      console.log('✅ Search index cleared')
    } catch (error) {
      console.warn('⚠️  Warning: Could not clear search index:', error)
    }
  }

  private async indexBusinesses(batchSize: number) {
    console.log('🏢 Indexing businesses...')

    let skip = 0
    let hasMore = true

    while (hasMore) {
      try {
        // Fetch batch of businesses
        const result = await couchdb.find<BusinessDocument>('mtaani', {
          type: 'business',
          isDeleted: false
        }, {
          limit: batchSize,
          skip,
          sort: [{ createdAt: 'desc' }]
        })

        if (result.docs.length === 0) {
          hasMore = false
          break
        }

        // Index each business
        const indexPromises = result.docs.map(async (business) => {
          try {
            this.stats.businessesProcessed++
            await searchIndexService.indexBusiness(business)
            this.stats.businessesIndexed++
            
            if (this.stats.businessesProcessed % 10 === 0) {
              process.stdout.write(`\r📊 Businesses: ${this.stats.businessesProcessed} processed, ${this.stats.businessesIndexed} indexed`)
            }
          } catch (error) {
            this.stats.errors++
            console.error(`\n❌ Error indexing business ${business._id}:`, error)
          }
        })

        await Promise.allSettled(indexPromises)
        skip += batchSize

        // Check if we got fewer results than requested (end of data)
        if (result.docs.length < batchSize) {
          hasMore = false
        }

      } catch (error) {
        console.error('❌ Error fetching businesses batch:', error)
        this.stats.errors++
        break
      }
    }

    console.log(`\n✅ Business indexing complete: ${this.stats.businessesIndexed}/${this.stats.businessesProcessed} indexed`)
  }

  private async indexEvents(batchSize: number) {
    console.log('📅 Indexing events...')

    let skip = 0
    let hasMore = true

    while (hasMore) {
      try {
        // Fetch batch of events
        const result = await couchdb.find<EventDocument>('mtaani', {
          type: 'event',
          isDeleted: false
        }, {
          limit: batchSize,
          skip,
          sort: [{ createdAt: 'desc' }]
        })

        if (result.docs.length === 0) {
          hasMore = false
          break
        }

        // Index each event
        const indexPromises = result.docs.map(async (event) => {
          try {
            this.stats.eventsProcessed++
            await searchIndexService.indexEvent(event)
            this.stats.eventsIndexed++
            
            if (this.stats.eventsProcessed % 10 === 0) {
              process.stdout.write(`\r📊 Events: ${this.stats.eventsProcessed} processed, ${this.stats.eventsIndexed} indexed`)
            }
          } catch (error) {
            this.stats.errors++
            console.error(`\n❌ Error indexing event ${event._id}:`, error)
          }
        })

        await Promise.allSettled(indexPromises)
        skip += batchSize

        // Check if we got fewer results than requested (end of data)
        if (result.docs.length < batchSize) {
          hasMore = false
        }

      } catch (error) {
        console.error('❌ Error fetching events batch:', error)
        this.stats.errors++
        break
      }
    }

    console.log(`\n✅ Event indexing complete: ${this.stats.eventsIndexed}/${this.stats.eventsProcessed} indexed`)
  }

  private printStats() {
    const duration = this.stats.endTime! - this.stats.startTime
    const durationSeconds = Math.round(duration / 1000)

    console.log('\n📊 Search Index Build Statistics:')
    console.log('=====================================')
    console.log(`⏱️  Duration: ${durationSeconds}s`)
    console.log(`🏢 Businesses: ${this.stats.businessesIndexed}/${this.stats.businessesProcessed} indexed`)
    console.log(`📅 Events: ${this.stats.eventsIndexed}/${this.stats.eventsProcessed} indexed`)
    console.log(`✅ Total Indexed: ${this.stats.businessesIndexed + this.stats.eventsIndexed}`)
    console.log(`❌ Errors: ${this.stats.errors}`)
    
    if (this.stats.errors === 0) {
      console.log('\n🎉 Search index build completed successfully!')
    } else {
      console.log('\n⚠️  Search index build completed with errors')
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const options: any = {}

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--rebuild-all':
      case '-r':
        options.rebuildAll = true
        break
      case '--batch-size':
      case '-b':
        options.batchSize = parseInt(args[++i]) || 50
        break
      case '--only-businesses':
        options.onlyType = 'business'
        break
      case '--only-events':
        options.onlyType = 'event'
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
        break
    }
  }

  const builder = new SearchIndexBuilder()
  await builder.buildIndex(options)
}

function printHelp() {
  console.log(`
Search Index Builder

Usage: tsx scripts/build-search-index.ts [options]

Options:
  -r, --rebuild-all      Clear existing index and rebuild from scratch
  -b, --batch-size N     Process N items at a time (default: 50)
  --only-businesses      Index only businesses
  --only-events          Index only events
  -h, --help             Show this help message

Examples:
  tsx scripts/build-search-index.ts                    # Incremental index build
  tsx scripts/build-search-index.ts --rebuild-all      # Full rebuild
  tsx scripts/build-search-index.ts --only-businesses  # Index only businesses
  tsx scripts/build-search-index.ts -b 100             # Use batch size of 100
`)
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
}

export { SearchIndexBuilder }
