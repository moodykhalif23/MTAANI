import { couchdb } from '../lib/couchdb'

const mockBusinesses = [
  { id: '1', name: 'Local Coffee Shop', category: 'Food & Drink' },
  { id: '2', name: 'Community Bookstore', category: 'Retail' },
  { id: '3', name: 'Neighborhood Gym', category: 'Fitness' },
]

const mockEvents = [
  { id: '1', name: 'Community Market', category: 'Market' },
  { id: '2', name: 'Local Music Festival', category: 'Entertainment' },
  { id: '3', name: 'Neighborhood Cleanup', category: 'Community' },
]

async function migrateBusinesses() {
  const docs = mockBusinesses.map(biz => ({
    _id: `business:${biz.id}`,
    type: 'business',
    name: biz.name,
    category: biz.category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
  }))
  const result = await couchdb.bulkDocs('mtaani', docs)
  console.log('Businesses migration result:', result)
}

async function migrateEvents() {
  const docs = mockEvents.map(evt => ({
    _id: `event:${evt.id}`,
    type: 'event',
    title: evt.name,
    category: evt.category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
  }))
  const result = await couchdb.bulkDocs('mtaani', docs)
  console.log('Events migration result:', result)
}

async function main() {
  await migrateBusinesses()
  await migrateEvents()
  console.log('Migration complete!')
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
