import { couchdb } from '../couchdb'
import { BusinessDocument, EventDocument } from '../models'

export interface SearchIndex {
  _id?: string
  _rev?: string
  type: 'search_index'
  entityType: 'business' | 'event'
  entityId: string
  searchTerms: string[]
  keywords: string[]
  location: {
    county: string
    town: string
    coordinates?: [number, number]
  }
  category: string
  subcategory?: string
  popularity: number
  rating: number
  verified: boolean
  createdAt: string
  updatedAt: string
}

export interface SearchSuggestion {
  text: string
  type: 'business' | 'event' | 'category' | 'location' | 'keyword'
  count: number
  popularity: number
  category?: string
  location?: string
}

export interface SearchResult {
  id: string
  type: 'business' | 'event'
  title: string
  description: string
  category: string
  location: {
    county: string
    town: string
    address?: string
  }
  rating: number
  verified: boolean
  distance?: number
  relevanceScore: number
  matchedTerms: string[]
}

class SearchIndexService {
  private readonly dbName = 'mtaani'

  // Build search index for a business
  async indexBusiness(business: BusinessDocument): Promise<void> {
    try {
      const searchTerms = this.extractSearchTerms(business)
      const keywords = this.extractKeywords(business)

      const searchIndex: SearchIndex = {
        type: 'search_index',
        entityType: 'business',
        entityId: business._id!,
        searchTerms,
        keywords,
        location: {
          county: business.location.county,
          town: business.location.town,
          coordinates: business.location.coordinates
        },
        category: business.category,
        subcategory: business.subcategory,
        popularity: this.calculatePopularity(business),
        rating: business.stats?.rating || 0,
        verified: business.verification?.status === 'verified',
        createdAt: business.createdAt,
        updatedAt: new Date().toISOString()
      }

      // Use business ID as search index ID for easy updates
      const indexId = `search_index_business_${business._id}`
      await couchdb.upsert(this.dbName, indexId, searchIndex)
    } catch (error) {
      console.error('Error indexing business:', error)
    }
  }

  // Build search index for an event
  async indexEvent(event: EventDocument): Promise<void> {
    try {
      const searchTerms = this.extractEventSearchTerms(event)
      const keywords = this.extractEventKeywords(event)

      const searchIndex: SearchIndex = {
        type: 'search_index',
        entityType: 'event',
        entityId: event._id!,
        searchTerms,
        keywords,
        location: {
          county: event.location?.county || '',
          town: event.location?.town || '',
          coordinates: event.location?.coordinates
        },
        category: event.category,
        popularity: this.calculateEventPopularity(event),
        rating: 0, // Events don't have ratings yet
        verified: true, // All approved events are considered verified
        createdAt: event.createdAt,
        updatedAt: new Date().toISOString()
      }

      const indexId = `search_index_event_${event._id}`
      await couchdb.upsert(this.dbName, indexId, searchIndex)
    } catch (error) {
      console.error('Error indexing event:', error)
    }
  }

  // Advanced search with intelligent ranking
  async search(params: {
    query: string
    location?: { county?: string; town?: string; coordinates?: [number, number]; radius?: number }
    category?: string
    type?: 'business' | 'event' | 'all'
    verified?: boolean
    limit?: number
    skip?: number
  }): Promise<{ results: SearchResult[]; suggestions: SearchSuggestion[]; total: number }> {
    try {
      const { query, location, category, type = 'all', verified, limit = 20, skip = 0 } = params

      // Build search selector
      const selector: Record<string, unknown> = {
        type: 'search_index'
      }

      // Filter by entity type
      if (type !== 'all') {
        selector.entityType = type
      }

      // Filter by category
      if (category) {
        selector.category = category
      }

      // Filter by verification status
      if (verified !== undefined) {
        selector.verified = verified
      }

      // Location filtering
      if (location?.county) {
        selector['location.county'] = location.county
      }
      if (location?.town) {
        selector['location.town'] = location.town
      }

      // Text search using search terms and keywords
      if (query.trim()) {
        const searchQuery = query.toLowerCase().trim()
        selector.$or = [
          { searchTerms: { $elemMatch: { $regex: `(?i)${searchQuery}` } } },
          { keywords: { $elemMatch: { $regex: `(?i)${searchQuery}` } } }
        ]
      }

      // Execute search
      const searchResults = await couchdb.find<SearchIndex>(this.dbName, selector, {
        limit: limit + 10, // Get extra for ranking
        skip,
        sort: [
          { popularity: 'desc' },
          { rating: 'desc' },
          { verified: 'desc' },
          { updatedAt: 'desc' }
        ]
      })

      // Rank and score results
      const rankedResults = await this.rankSearchResults(searchResults.docs, query, location)

      // Generate suggestions
      const suggestions = await this.generateSuggestions(query, location, category)

      return {
        results: rankedResults.slice(0, limit),
        suggestions,
        total: searchResults.docs.length
      }
    } catch (error) {
      console.error('Search error:', error)
      return { results: [], suggestions: [], total: 0 }
    }
  }

  // Extract search terms from business
  private extractSearchTerms(business: BusinessDocument): string[] {
    const terms: string[] = []

    // Business name variations
    if (business.name) {
      terms.push(business.name.toLowerCase())
      terms.push(...business.name.toLowerCase().split(' '))
    }

    // Description keywords
    if (business.description) {
      const words = business.description.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
      terms.push(...words)
    }

    // Category and subcategory
    terms.push(business.category.toLowerCase())
    if (business.subcategory) {
      terms.push(business.subcategory.toLowerCase())
    }

    // Location terms
    terms.push(business.location.county.toLowerCase())
    terms.push(business.location.town.toLowerCase())
    if (business.location.address) {
      terms.push(...business.location.address.toLowerCase().split(' '))
    }

    // Services/tags if available
    if (business.services) {
      terms.push(...business.services.map(s => s.toLowerCase()))
    }

    return [...new Set(terms)].filter(term => term.length > 1)
  }

  // Extract keywords for better matching
  private extractKeywords(business: BusinessDocument): string[] {
    const keywords: string[] = []

    // Category-specific keywords
    const categoryKeywords = this.getCategoryKeywords(business.category)
    keywords.push(...categoryKeywords)

    // Business type keywords
    if (business.name) {
      const businessTypeKeywords = this.extractBusinessTypeKeywords(business.name)
      keywords.push(...businessTypeKeywords)
    }

    return [...new Set(keywords)]
  }

  // Get category-specific keywords for better search matching
  private getCategoryKeywords(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'restaurant': ['food', 'dining', 'eat', 'meal', 'cuisine', 'menu', 'chef'],
      'hotel': ['accommodation', 'stay', 'lodge', 'rooms', 'booking', 'hospitality'],
      'shop': ['store', 'retail', 'buy', 'purchase', 'shopping', 'goods'],
      'service': ['repair', 'fix', 'maintenance', 'professional', 'expert'],
      'health': ['medical', 'doctor', 'clinic', 'treatment', 'care', 'wellness'],
      'education': ['school', 'learning', 'training', 'course', 'teacher', 'study'],
      'entertainment': ['fun', 'leisure', 'activity', 'recreation', 'hobby'],
      'transport': ['travel', 'vehicle', 'ride', 'journey', 'commute'],
      'beauty': ['salon', 'spa', 'grooming', 'cosmetics', 'style', 'fashion']
    }

    return categoryMap[category.toLowerCase()] || []
  }

  // Calculate popularity score based on various factors
  private calculatePopularity(business: BusinessDocument): number {
    let score = 0

    // Rating contribution (0-50 points)
    if (business.stats?.rating) {
      score += (business.stats.rating / 5) * 50
    }

    // Review count contribution (0-30 points)
    if (business.stats?.reviewCount) {
      score += Math.min(business.stats.reviewCount * 2, 30)
    }

    // Verification bonus (20 points)
    if (business.verification?.status === 'verified') {
      score += 20
    }

    return Math.round(score)
  }

  // Extract search terms from events
  private extractEventSearchTerms(event: EventDocument): string[] {
    const terms: string[] = []

    if (event.title) {
      terms.push(event.title.toLowerCase())
      terms.push(...event.title.toLowerCase().split(' '))
    }

    if (event.description) {
      const words = event.description.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
      terms.push(...words)
    }

    terms.push(event.category.toLowerCase())

    if (event.location?.county) {
      terms.push(event.location.county.toLowerCase())
    }
    if (event.location?.town) {
      terms.push(event.location.town.toLowerCase())
    }

    return [...new Set(terms)].filter(term => term.length > 1)
  }

  // Extract keywords from events
  private extractEventKeywords(event: EventDocument): string[] {
    const keywords: string[] = []

    // Event type keywords
    const eventKeywords = this.getEventCategoryKeywords(event.category)
    keywords.push(...eventKeywords)

    return [...new Set(keywords)]
  }

  // Get event category keywords
  private getEventCategoryKeywords(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'music': ['concert', 'performance', 'band', 'artist', 'live', 'show'],
      'sports': ['game', 'match', 'tournament', 'competition', 'team', 'athletic'],
      'business': ['networking', 'conference', 'seminar', 'workshop', 'meeting'],
      'community': ['gathering', 'social', 'neighborhood', 'local', 'residents'],
      'education': ['workshop', 'training', 'seminar', 'class', 'learning'],
      'cultural': ['festival', 'celebration', 'tradition', 'heritage', 'art']
    }

    return categoryMap[category.toLowerCase()] || []
  }

  // Calculate event popularity
  private calculateEventPopularity(event: EventDocument): number {
    let score = 0

    // Future events get higher score
    if (event.schedule?.startDate) {
      const eventDate = new Date(event.schedule.startDate)
      const now = new Date()
      if (eventDate > now) {
        score += 30
      }
    }

    // Recent events get some score
    const createdDate = new Date(event.createdAt)
    const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreated < 7) {
      score += 20
    }

    return Math.round(score)
  }

  // Extract business type keywords from name
  private extractBusinessTypeKeywords(name: string): string[] {
    const keywords: string[] = []
    const lowerName = name.toLowerCase()

    const typePatterns = [
      { pattern: /(restaurant|cafe|eatery|diner|bistro)/, keywords: ['food', 'dining'] },
      { pattern: /(hotel|lodge|inn|resort)/, keywords: ['accommodation', 'stay'] },
      { pattern: /(shop|store|mart|market)/, keywords: ['shopping', 'retail'] },
      { pattern: /(clinic|hospital|pharmacy)/, keywords: ['medical', 'health'] },
      { pattern: /(salon|spa|barber)/, keywords: ['beauty', 'grooming'] },
      { pattern: /(garage|workshop|repair)/, keywords: ['automotive', 'repair'] }
    ]

    for (const { pattern, keywords: typeKeywords } of typePatterns) {
      if (pattern.test(lowerName)) {
        keywords.push(...typeKeywords)
      }
    }

    return keywords
  }

  // Rank search results based on relevance
  private async rankSearchResults(
    results: SearchIndex[],
    query: string,
    location?: { coordinates?: [number, number] }
  ): Promise<SearchResult[]> {
    const rankedResults: SearchResult[] = []

    for (const result of results) {
      // Get the actual entity data
      const entity = await this.getEntityData(result.entityType, result.entityId)
      if (!entity) continue

      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(result, query, location)

      // Find matched terms
      const matchedTerms = this.findMatchedTerms(result, query)

      const searchResult: SearchResult = {
        id: result.entityId,
        type: result.entityType,
        title: entity.name || entity.title,
        description: entity.description || '',
        category: result.category,
        location: {
          county: result.location.county,
          town: result.location.town,
          address: entity.location?.address
        },
        rating: result.rating,
        verified: result.verified,
        relevanceScore,
        matchedTerms
      }

      // Calculate distance if location provided
      if (location?.coordinates && result.location.coordinates) {
        searchResult.distance = this.calculateDistance(
          location.coordinates,
          result.location.coordinates
        )
      }

      rankedResults.push(searchResult)
    }

    // Sort by relevance score and other factors
    return rankedResults.sort((a, b) => {
      // Primary sort: relevance score
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }

      // Secondary sort: rating
      if (b.rating !== a.rating) {
        return b.rating - a.rating
      }

      // Tertiary sort: verification status
      if (b.verified !== a.verified) {
        return b.verified ? 1 : -1
      }

      // Final sort: distance (if available)
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }

      return 0
    })
  }

  // Calculate relevance score for ranking
  private calculateRelevanceScore(
    result: SearchIndex,
    query: string,
    location?: { coordinates?: [number, number] }
  ): number {
    let score = 0
    const queryLower = query.toLowerCase()

    // Exact name match gets highest score
    const exactMatches = result.searchTerms.filter(term =>
      term === queryLower || term.includes(queryLower)
    )
    score += exactMatches.length * 50

    // Keyword matches
    const keywordMatches = result.keywords.filter(keyword =>
      keyword.includes(queryLower) || queryLower.includes(keyword)
    )
    score += keywordMatches.length * 30

    // Partial matches
    const partialMatches = result.searchTerms.filter(term =>
      term.includes(queryLower) || queryLower.includes(term)
    )
    score += partialMatches.length * 20

    // Popularity bonus
    score += result.popularity * 0.5

    // Verification bonus
    if (result.verified) {
      score += 10
    }

    // Location proximity bonus
    if (location?.coordinates && result.location.coordinates) {
      const distance = this.calculateDistance(location.coordinates, result.location.coordinates)
      if (distance < 5) score += 20  // Within 5km
      else if (distance < 10) score += 10  // Within 10km
      else if (distance < 20) score += 5   // Within 20km
    }

    return Math.round(score)
  }

  // Find which terms matched the query
  private findMatchedTerms(result: SearchIndex, query: string): string[] {
    const queryLower = query.toLowerCase()
    const matched: string[] = []

    // Check search terms
    result.searchTerms.forEach(term => {
      if (term.includes(queryLower) || queryLower.includes(term)) {
        matched.push(term)
      }
    })

    // Check keywords
    result.keywords.forEach(keyword => {
      if (keyword.includes(queryLower) || queryLower.includes(keyword)) {
        matched.push(keyword)
      }
    })

    return [...new Set(matched)]
  }

  // Get entity data by type and ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getEntityData(type: 'business' | 'event', id: string): Promise<any> {
    try {
      const doc = await couchdb.get(this.dbName, id)
      return doc
    } catch (error) {
      console.error(`Error getting ${type} data:`, error)
      return null
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const [lat1, lon1] = coord1
    const [lat2, lon2] = coord2

    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Generate search suggestions
  private async generateSuggestions(): Promise<SearchSuggestion[]> {
    // This would be implemented to generate intelligent suggestions
    // based on popular searches, categories, locations, etc.
    return []
  }
}

export const searchIndexService = new SearchIndexService()
