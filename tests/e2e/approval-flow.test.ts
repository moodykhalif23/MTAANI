import assert from 'node:assert'
import http from 'node:http'

// Helper to perform HTTP requests against local Next.js server
function request(method: string, path: string, options: { headers?: Record<string, string>, body?: any } = {}): Promise<{ status: number, json: any }> {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'
  const url = new URL(path, baseUrl)

  const payload = options.body ? JSON.stringify(options.body) : undefined
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {})

  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers }, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null
          resolve({ status: res.statusCode || 0, json })
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function run() {
  const adminToken = process.env.ADMIN_DASHBOARD_TOKEN || process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_TOKEN || 'dev_admin_dashboard_token_2024_secure'

  // 1) Create a business via API-key endpoint to avoid user auth dependency
  const apiKey = process.env.TEST_API_KEY || process.env.INTERNAL_API_KEY || process.env.ADMIN_API_KEY || 'admin_api_key_dev_456'

  const businessPayload = {
    name: `Test Biz ${Date.now()}`,
    description: 'Great services',
    category: 'services',
    subcategory: 'general',
    email: `biz${Date.now()}@example.com`,
    phone: '+254700000000',
    address: '123 Test Street',
    county: 'Nairobi',
    town: 'Nairobi',
    coordinates: [36.8219, -1.2921]
  }

  const businessHeaders: Record<string, string> = { 'x-api-key': apiKey, 'Authorization': `Bearer ${apiKey}` }
  const businessRes = await request('POST', '/api/v1/businesses', { headers: businessHeaders, body: businessPayload })

  assert.ok(businessRes.status === 201, `Business creation failed ${businessRes.status} using key ${apiKey.slice(0,8)}...: ${JSON.stringify(businessRes.json)}`)

  const businessId = businessRes.json?.data?.business?.id || businessRes.json?.data?.businessId
  assert.ok(businessId, 'No businessId returned')

  // 2) Approve the business via admin endpoint
  const approveBizRes = await request('PUT', `/api/businesses/${businessId}`, { body: { action: 'approve', adminToken } })
  assert.ok(approveBizRes.status === 200, `Business approval failed ${approveBizRes.status}: ${JSON.stringify(approveBizRes.json)}`)

  // 3) Create an event (can be anonymous)
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const eventPayload = {
    title: `Test Event ${Date.now()}`,
    category: 'community',
    description: 'Awesome event',
    longDescription: 'Long event description',
    date,
    startTime: '10:00',
    endTime: '12:00',
    location: 'Test Venue',
    address: '123 Venue Street',
    maxAttendees: 50,
    ticketPrice: 0,
    isFree: true,
    organizerName: 'Tester',
    organizerEmail: `event${Date.now()}@example.com`,
    organizerPhone: '+254711111111',
    tags: ['test'],
    images: [],
    requiresRegistration: false
  }

  const eventRes = await request('POST', '/api/events', { body: eventPayload })
  assert.ok(eventRes.status === 201, `Event creation failed ${eventRes.status}: ${JSON.stringify(eventRes.json)}`)
  const eventId = eventRes.json?.data?.eventId
  assert.ok(eventId, 'No eventId returned')

  // 4) Approve the event
  const approveEventRes = await request('PUT', `/api/events/${eventId}`, { body: { action: 'approve', adminToken } })
  assert.ok(approveEventRes.status === 200, `Event approval failed ${approveEventRes.status}: ${JSON.stringify(approveEventRes.json)}`)

  // 5) Verify business appears in public listings (GET /api/businesses filters public approved/active)
  const listBizRes = await request('GET', '/api/businesses')
  assert.ok(listBizRes.status === 200, `Business list failed ${listBizRes.status}: ${JSON.stringify(listBizRes.json)}`)
  const businesses = listBizRes.json?.data?.businesses || []
  const foundBiz = businesses.find((b: any) => b.id === businessId)
  assert.ok(foundBiz, 'Approved business not found in listings')

  // 6) Verify event appears in public events (GET /api/events returns approved only)
  const listEventRes = await request('GET', '/api/events')
  assert.ok(listEventRes.status === 200, `Events list failed ${listEventRes.status}: ${JSON.stringify(listEventRes.json)}`)
  const events = listEventRes.json?.data?.events || []
  const foundEvent = events.find((e: any) => e.id === eventId)
  assert.ok(foundEvent, 'Approved event not found in listings')

  console.log('E2E approval flow passed:', { businessId, eventId })
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})


