import { NextRequest, NextResponse } from 'next/server'
import { businessService } from '@/lib/services/business-service'
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/jwt'
import { securityAudit } from '@/lib/security-audit'

// GET /api/businesses - Search and list businesses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract search parameters
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const county = searchParams.get('county')
    const town = searchParams.get('town')
    const verified = searchParams.get('verified') === 'true'
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = parseInt(searchParams.get('skip') || '0')

    // Build search criteria
    const searchCriteria: any = {
      limit: Math.min(limit, 100), // Max 100 results
      skip: Math.max(skip, 0)
    }

    if (query) searchCriteria.query = query
    if (category) searchCriteria.category = category
    if (county) searchCriteria.county = county
    if (town) searchCriteria.town = town
    if (verified) searchCriteria.verified = true

    // Add geolocation if provided
    if (lat && lng) {
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lng)
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        searchCriteria.coordinates = [longitude, latitude]
        
        if (radius) {
          const radiusKm = parseFloat(radius)
          if (!isNaN(radiusKm) && radiusKm > 0) {
            searchCriteria.radius = Math.min(radiusKm, 100) // Max 100km radius
          }
        }
      }
    }

    // Search businesses
    const result = await businessService.searchBusinesses(searchCriteria)

    // Log search for analytics
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    securityAudit.logEvent(
      'business_search',
      'low',
      'Business search performed',
      { 
        query, 
        category, 
        county, 
        resultsCount: result.businesses.length 
      },
      undefined,
      clientIP,
      request.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      success: true,
      data: {
        businesses: result.businesses.map(business => ({
          id: business._id,
          name: business.name,
          description: business.description,
          category: business.category,
          subcategory: business.subcategory,
          status: business.status,
          verified: business.verification.status === 'verified',
          contact: business.contact,
          location: business.location,
          hours: business.hours,
          media: {
            logo: business.media.logo,
            coverImage: business.media.coverImage,
            gallery: business.media.gallery.slice(0, 5) // Limit gallery items
          },
          stats: {
            rating: business.stats.rating,
            reviewCount: business.stats.reviewCount
          },
          createdAt: business.createdAt,
          updatedAt: business.updatedAt
        })),
        total: result.total,
        limit,
        skip
      }
    })

  } catch (error) {
    console.error('Business search error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search businesses' 
      },
      { status: 500 }
    )
  }
}

// POST /api/businesses - Create a new business
export async function POST(request: NextRequest) {
  try {
    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const accessToken = extractTokenFromHeader(authHeader)
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const tokenResult = verifyAccessToken(accessToken)
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = tokenResult.payload.userId

    // Parse request body
    const body = await request.json()
    const {
      name,
      description,
      category,
      subcategory,
      email,
      phone,
      address,
      county,
      town,
      coordinates
    } = body

    // Validate required fields
    if (!name || !description || !category || !email || !phone || !address || !county || !town) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate coordinates
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return NextResponse.json(
        { error: 'Valid coordinates [longitude, latitude] are required' },
        { status: 400 }
      )
    }

    const [longitude, latitude] = coordinates
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      return NextResponse.json(
        { error: 'Coordinates must be numbers' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create business
    const result = await businessService.createBusiness({
      ownerId: userId,
      name: name.trim(),
      description: description.trim(),
      category,
      subcategory,
      email: email.toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      county,
      town,
      coordinates: [longitude, latitude]
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Get the created business
    const business = await businessService.findBusinessById(result.businessId!)

    return NextResponse.json({
      success: true,
      data: {
        business: {
          id: business!._id,
          name: business!.name,
          description: business!.description,
          category: business!.category,
          subcategory: business!.subcategory,
          status: business!.status,
          verification: business!.verification,
          contact: business!.contact,
          location: business!.location,
          hours: business!.hours,
          media: business!.media,
          services: business!.services,
          stats: business!.stats,
          createdAt: business!.createdAt,
          updatedAt: business!.updatedAt
        }
      },
      message: 'Business created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Business creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create business' 
      },
      { status: 500 }
    )
  }
}
