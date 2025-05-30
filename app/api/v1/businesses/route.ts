import { NextRequest, NextResponse } from 'next/server'
import { businessService } from '@/lib/services/business-service'
import { withSecurity } from '@/lib/middleware/api-security'
import { apiKeyService } from '@/lib/services/api-key-service'

// GET /api/v1/businesses - Public API for external integrations
export async function GET(request: NextRequest) {
  return withSecurity(request, {
    requireApiKey: true,
    permissions: ['api:read', 'api:*'],
    rateLimit: {
      requests: 1000,
      windowMs: 60 * 60 * 1000 // 1 hour
    },
    allowedOrigins: ['*']
  }, async (request: NextRequest, context: { apiKey?: string; rateLimit?: { remaining: number; resetTime: number } }) => {
    try {
      const { searchParams } = new URL(request.url)

      // Extract and validate parameters
      const query = searchParams.get('q')
      const category = searchParams.get('category')
      const county = searchParams.get('county')
      const town = searchParams.get('town')
      // verified parameter is not used since external API only returns verified businesses
      const lat = searchParams.get('lat')
      const lng = searchParams.get('lng')
      const radius = searchParams.get('radius')
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 for external API
      const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0)

      // Build search criteria
      const searchCriteria: {
        limit: number
        skip: number
        query?: string
        category?: string
        county?: string
        town?: string
        verified?: boolean
        coordinates?: [number, number]
        radius?: number
      } = {
        limit,
        skip,
        verified: true // External API only returns verified businesses
      }

      if (query) searchCriteria.query = query
      if (category) searchCriteria.category = category
      if (county) searchCriteria.county = county
      if (town) searchCriteria.town = town

      // Add geolocation if provided
      if (lat && lng) {
        const latitude = parseFloat(lat)
        const longitude = parseFloat(lng)

        if (!isNaN(latitude) && !isNaN(longitude)) {
          searchCriteria.coordinates = [longitude, latitude]

          if (radius) {
            const radiusKm = parseFloat(radius)
            if (!isNaN(radiusKm) && radiusKm > 0) {
              searchCriteria.radius = Math.min(radiusKm, 50) // Max 50km for external API
            }
          }
        }
      }

      // Search businesses
      const result = await businessService.searchBusinesses(searchCriteria)

      // Update API key usage
      if (context.apiKey) {
        await apiKeyService.updateUsage(
          context.apiKey,
          request.headers.get('x-forwarded-for') || 'unknown',
          '/api/v1/businesses'
        )
      }

      // Transform data for external API (limited fields)
      const externalBusinesses = result.businesses.map(business => ({
        id: business._id,
        name: business.name,
        description: business.description,
        category: business.category,
        subcategory: business.subcategory,
        verified: business.verification.status === 'verified',
        contact: {
          email: business.contact.email,
          phone: business.contact.phone,
          website: business.contact.website
        },
        location: {
          address: business.location.address,
          county: business.location.county,
          town: business.location.town,
          coordinates: business.location.coordinates
        },
        hours: business.hours,
        rating: business.stats.rating,
        reviewCount: business.stats.reviewCount,
        // Don't expose internal fields like ownerId, verification details, etc.
      }))

      return NextResponse.json({
        success: true,
        version: '1.0',
        data: {
          businesses: externalBusinesses,
          pagination: {
            total: result.total,
            limit,
            skip,
            hasMore: result.total > skip + limit
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          apiVersion: 'v1',
          rateLimit: {
            remaining: context.rateLimit?.remaining,
            resetTime: context.rateLimit?.resetTime
          }
        }
      })

    } catch (error) {
      console.error('External API businesses search error:', error)
      return NextResponse.json(
        {
          success: false,
          version: '1.0',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal error occurred'
          }
        },
        { status: 500 }
      )
    }
  })
}

// POST /api/v1/businesses - Create business via external API
export async function POST(request: NextRequest) {
  return withSecurity(request, {
    requireApiKey: true,
    permissions: ['api:write', 'api:*'],
    rateLimit: {
      requests: 100,
      windowMs: 60 * 60 * 1000 // 1 hour
    },
    allowedOrigins: ['*']
  }, async (request: NextRequest, context: { apiKey?: string }) => {
    try {
      const body = await request.json()
      const {
        name,
        description,
        category,
        subcategory,
        email,
        phone,
        website,
        address,
        county,
        town,
        coordinates
      } = body

      // Validate required fields
      const requiredFields = ['name', 'description', 'category', 'email', 'phone', 'address', 'county', 'town', 'coordinates']
      const missingFields = requiredFields.filter(field => !body[field])

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            success: false,
            version: '1.0',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Missing required fields',
              details: { missingFields }
            }
          },
          { status: 400 }
        )
      }

      // Validate coordinates
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        return NextResponse.json(
          {
            success: false,
            version: '1.0',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Coordinates must be an array of [longitude, latitude]'
            }
          },
          { status: 400 }
        )
      }

      const [longitude, latitude] = coordinates
      if (typeof longitude !== 'number' || typeof latitude !== 'number') {
        return NextResponse.json(
          {
            success: false,
            version: '1.0',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Coordinates must be numbers'
            }
          },
          { status: 400 }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            version: '1.0',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid email format'
            }
          },
          { status: 400 }
        )
      }

      // Create business (external API submissions are pending by default)
      const result = await businessService.createBusiness({
        ownerId: 'external_api', // Special identifier for API submissions
        name: name.trim(),
        description: description.trim(),
        category,
        subcategory,
        email: email.toLowerCase(),
        phone: phone.trim(),
        website: website?.trim(),
        address: address.trim(),
        county,
        town,
        coordinates: [longitude, latitude]
      })

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            version: '1.0',
            error: {
              code: 'CREATION_ERROR',
              message: result.error || 'Failed to create business'
            }
          },
          { status: 400 }
        )
      }

      // Update API key usage
      if (context.apiKey) {
        await apiKeyService.updateUsage(
          context.apiKey,
          request.headers.get('x-forwarded-for') || 'unknown',
          '/api/v1/businesses'
        )
      }

      return NextResponse.json({
        success: true,
        version: '1.0',
        data: {
          businessId: result.businessId,
          status: 'pending_approval',
          message: 'Business submitted successfully and is pending approval'
        },
        meta: {
          timestamp: new Date().toISOString(),
          apiVersion: 'v1'
        }
      }, { status: 201 })

    } catch (error) {
      console.error('External API business creation error:', error)
      return NextResponse.json(
        {
          success: false,
          version: '1.0',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal error occurred'
          }
        },
        { status: 500 }
      )
    }
  })
}
