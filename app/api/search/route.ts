import { NextRequest, NextResponse } from 'next/server'
import { searchIndexService } from '@/lib/services/search-index-service'
import { withSecurity } from '@/lib/middleware/api-security'
import { securityAudit } from '@/lib/security-audit'

// GET /api/search - Advanced search with intelligent ranking and suggestions
export async function GET(request: NextRequest) {
  return withSecurity(request, {
    rateLimit: {
      requests: 200,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    allowedOrigins: ['*'] // Allow CORS for public API
  }, async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)

      // Extract search parameters
      const query = searchParams.get('q') || ''
      const type = searchParams.get('type') as 'business' | 'event' | 'all' || 'all'
      const category = searchParams.get('category') || undefined
      const county = searchParams.get('county') || undefined
      const town = searchParams.get('town') || undefined
      const verified = searchParams.get('verified') === 'true' ? true : undefined
      const lat = searchParams.get('lat')
      const lng = searchParams.get('lng')
      const radius = searchParams.get('radius')
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
      const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0)

      // Get client info for analytics
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      // Build location parameters
      const location: {
        county?: string
        town?: string
        coordinates?: [number, number]
        radius?: number
      } = {}

      if (county) location.county = county
      if (town) location.town = town
      if (lat && lng) {
        location.coordinates = [parseFloat(lat), parseFloat(lng)]
        if (radius) location.radius = parseFloat(radius)
      }

      // Perform advanced search
      const searchResults = await searchIndexService.search({
        query,
        location: Object.keys(location).length > 0 ? location : undefined,
        category,
        type,
        verified,
        limit,
        skip
      })

      // Log search for analytics
      securityAudit.logEvent(
        'search_query',
        'low',
        'Search performed',
        {
          query: query.substring(0, 100), // Limit query length in logs
          type,
          category,
          location: county || town || 'unknown',
          resultsCount: searchResults.results.length,
          hasLocation: !!location.coordinates
        },
        'anonymous',
        clientIP,
        userAgent
      )

      // Return results with metadata
      return NextResponse.json({
        success: true,
        data: {
          results: searchResults.results,
          suggestions: searchResults.suggestions,
          meta: {
            total: searchResults.total,
            returned: searchResults.results.length,
            query,
            type,
            category,
            location: location.coordinates ? {
              lat: location.coordinates[0],
              lng: location.coordinates[1],
              radius: location.radius
            } : undefined,
            timestamp: new Date().toISOString()
          }
        }
      })

    } catch (error) {
      console.error('Search API error:', error)

      // Log search error
      securityAudit.logEvent(
        'search_error',
        'medium',
        'Search API error occurred',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          query: request.url
        },
        'anonymous',
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      )

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SEARCH_ERROR',
            message: 'An error occurred while searching'
          }
        },
        { status: 500 }
      )
    }
  })
}

// GET /api/search/suggestions - Get search suggestions and autocomplete
export async function POST(request: NextRequest) {
  return withSecurity(request, {
    rateLimit: {
      requests: 500,
      windowMs: 15 * 60 * 1000 // 15 minutes - higher limit for suggestions
    },
    allowedOrigins: ['*']
  }, async (request: NextRequest) => {
    try {
      const body = await request.json()
      const { query = '', location, category, limit = 8 } = body

      // Get popular searches from recent search analytics
      const popularSearches = await getPopularSearches(location, category)

      // Get category suggestions
      const categorySuggestions = getCategorySuggestions(query)

      // Get location suggestions
      const locationSuggestions = getLocationSuggestions(query)

      // Combine and rank suggestions
      const allSuggestions = [
        ...popularSearches,
        ...categorySuggestions,
        ...locationSuggestions
      ].slice(0, limit)

      return NextResponse.json({
        success: true,
        data: {
          suggestions: allSuggestions,
          query,
          meta: {
            timestamp: new Date().toISOString()
          }
        }
      })

    } catch (error) {
      console.error('Search suggestions error:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUGGESTIONS_ERROR',
            message: 'An error occurred while getting suggestions'
          }
        },
        { status: 500 }
      )
    }
  })
}

// Helper function to get popular searches
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPopularSearches(location?: any, category?: string) {
  // This would query search analytics to get popular searches
  // For now, return static popular searches based on Kenyan context
  const popularSearches = [
    { id: 'pop-1', text: 'restaurants near me', type: 'keyword', count: 1250, popularity: 95 },
    { id: 'pop-2', text: 'hotels in Nairobi', type: 'keyword', count: 890, popularity: 88 },
    { id: 'pop-3', text: 'supermarkets', type: 'category', count: 756, popularity: 82 },
    { id: 'pop-4', text: 'pharmacies', type: 'category', count: 634, popularity: 78 },
    { id: 'pop-5', text: 'salons and spas', type: 'category', count: 523, popularity: 75 },
    { id: 'pop-6', text: 'car repair services', type: 'keyword', count: 445, popularity: 70 },
    { id: 'pop-7', text: 'schools in Mombasa', type: 'keyword', count: 389, popularity: 68 },
    { id: 'pop-8', text: 'banks and ATMs', type: 'category', count: 356, popularity: 65 }
  ]

  return popularSearches.filter(search => {
    if (category && search.type === 'category') {
      return search.text.toLowerCase().includes(category.toLowerCase())
    }
    return true
  }).slice(0, 4)
}

// Helper function to get category suggestions
function getCategorySuggestions(query: string) {
  const categories = [
    { name: 'Restaurants & Food', keywords: ['food', 'eat', 'restaurant', 'cafe', 'dining', 'meal'] },
    { name: 'Hotels & Accommodation', keywords: ['hotel', 'lodge', 'accommodation', 'stay', 'booking'] },
    { name: 'Shopping & Retail', keywords: ['shop', 'store', 'buy', 'retail', 'market', 'mall'] },
    { name: 'Health & Medical', keywords: ['health', 'medical', 'doctor', 'clinic', 'pharmacy', 'hospital'] },
    { name: 'Beauty & Wellness', keywords: ['beauty', 'salon', 'spa', 'barber', 'cosmetics', 'massage'] },
    { name: 'Automotive Services', keywords: ['car', 'garage', 'repair', 'mechanic', 'automotive', 'service'] },
    { name: 'Education & Training', keywords: ['education', 'school', 'training', 'course', 'university', 'college'] },
    { name: 'Entertainment & Events', keywords: ['entertainment', 'fun', 'leisure', 'activity', 'event', 'party'] },
    { name: 'Financial Services', keywords: ['bank', 'atm', 'money', 'loan', 'insurance', 'finance'] },
    { name: 'Transportation', keywords: ['transport', 'taxi', 'bus', 'travel', 'matatu', 'uber'] }
  ]

  if (!query || query.length < 2) return []

  const queryLower = query.toLowerCase()
  return categories
    .filter(cat =>
      cat.name.toLowerCase().includes(queryLower) ||
      cat.keywords.some(keyword =>
        keyword.includes(queryLower) || queryLower.includes(keyword)
      )
    )
    .map((cat, index) => ({
      id: `category-${index}`,
      text: cat.name,
      type: 'category' as const,
      popularity: 80 - index * 5
    }))
    .slice(0, 3)
}

// Helper function to get location suggestions
function getLocationSuggestions(query: string) {
  const locations = [
    // Major cities
    { name: 'Nairobi', type: 'city', popularity: 95 },
    { name: 'Mombasa', type: 'city', popularity: 88 },
    { name: 'Kisumu', type: 'city', popularity: 75 },
    { name: 'Nakuru', type: 'city', popularity: 70 },
    { name: 'Eldoret', type: 'city', popularity: 65 },

    // Counties
    { name: 'Nairobi County', type: 'county', popularity: 90 },
    { name: 'Mombasa County', type: 'county', popularity: 85 },
    { name: 'Kiambu County', type: 'county', popularity: 80 },
    { name: 'Machakos County', type: 'county', popularity: 75 },
    { name: 'Kajiado County', type: 'county', popularity: 70 },

    // Popular areas in Nairobi
    { name: 'Westlands', type: 'area', popularity: 85 },
    { name: 'CBD Nairobi', type: 'area', popularity: 82 },
    { name: 'Karen', type: 'area', popularity: 78 },
    { name: 'Kilimani', type: 'area', popularity: 75 },
    { name: 'Kasarani', type: 'area', popularity: 72 }
  ]

  if (!query || query.length < 2) return []

  const queryLower = query.toLowerCase()
  return locations
    .filter(location =>
      location.name.toLowerCase().includes(queryLower)
    )
    .map((location, index) => ({
      id: `location-${index}`,
      text: location.name,
      type: 'location' as const,
      popularity: location.popularity
    }))
    .slice(0, 3)
}
