import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/jwt'
import { securityAudit } from '@/lib/security-audit'
import { eventService } from '@/lib/services/event-service'

// GET /api/events - Get events (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const adminToken = searchParams.get('adminToken')

    const skip = parseInt(searchParams.get('skip') || '0')

    // Admin access check for sensitive data
    const isAdminRequest = adminToken === (process.env.ADMIN_DASHBOARD_TOKEN || process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_TOKEN || 'dev_admin_dashboard_token_2024_secure')

    // Build filters
    const filters: Record<string, unknown> = {}

    if (status && isAdminRequest) {
      filters.status = status
    } else if (!isAdminRequest) {
      // Public requests only see approved events
      filters.status = 'approved'
    }

    if (category) {
      filters.category = category
    }

    // Get events from database
    const result = await eventService.findEvents(filters, { limit, skip })

    if (!result.success) {
      // Graceful fallback for public requests: return empty list instead of error
      if (!isAdminRequest) {
        console.warn('Events API fallback: returning empty list due to backend error for public request')
        return NextResponse.json({
          success: true,
          data: {
            events: [],
            total: 0,
            limit,
            skip
          },
          warning: 'Events temporarily unavailable'
        })
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch events' },
        { status: 500 }
      )
    }

    // Log the request
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    securityAudit.logEvent(
      'api_access',
      'low',
      'Events API accessed',
      {
        status,
        category,
        limit,
        skip,
        isAdmin: isAdminRequest,
        resultCount: result.events?.length || 0
      },
      undefined,
      clientIP,
      request.headers.get('user-agent') || 'unknown'
    )

    // Transform events for API response
    const transformedEvents = result.events?.map(event => ({
      id: event._id,
      title: event.title,
      category: event.category,
      description: event.description,
      longDescription: event.longDescription,
      startDate: event.schedule.startDate,
      endDate: event.schedule.endDate,
      startTime: event.schedule.startTime,
      endTime: event.schedule.endTime,
      location: event.location.venue,
      address: event.location.address,
      maxAttendees: event.capacity.max,
      ticketPrice: event.pricing.amount || 0,
      isFree: event.pricing.type === 'free',
      organizerName: event.organizer.name,
      organizerEmail: event.organizer.email,
      organizerPhone: event.organizer.phone,
      website: event.organizer.website,
      tags: event.tags,
      images: event.media.gallery,
      requiresRegistration: event.registration.required,
      status: event.status,
      submittedAt: event.createdAt,
      approvedAt: event.approvedAt,
      rejectedAt: event.rejectedAt,
      rejectionReason: event.rejectionReason
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        events: transformedEvents,
        total: result.total || 0,
        limit,
        skip
      }
    })

  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create a new event submission
export async function POST(request: NextRequest) {
  try {
    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Parse request body
    const body = await request.json()
    const {
      title,
      category,
      description,
      longDescription,
      date,
      startTime,
      endTime,
      location,
      address,
      maxAttendees,
      ticketPrice,
      isFree,
      organizerName,
      organizerEmail,
      organizerPhone,
      website,
      tags,
      images,
      requiresRegistration,
      ageRestriction,
      specialRequirements
    } = body

    // Validate required fields
    const requiredFields = {
      title: title?.trim(),
      category,
      description: description?.trim(),
      date,
      startTime,
      location: location?.trim(),
      organizerName: organizerName?.trim(),
      organizerEmail: organizerEmail?.trim()
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value)
      .map(([key]) => key)

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(organizerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate date (must be in the future)
    const eventDate = new Date(date)
    if (eventDate <= new Date()) {
      return NextResponse.json(
        { error: 'Event date must be in the future' },
        { status: 400 }
      )
    }

    // Optional: Check for authentication (events can be submitted by anonymous users)
    let organizerId: string = 'anonymous'
    const authHeader = request.headers.get('authorization')
    const accessToken = extractTokenFromHeader(authHeader)

    if (accessToken) {
      const tokenResult = verifyAccessToken(accessToken)
      if (tokenResult.valid) {
        organizerId = tokenResult.payload.userId
      }
    }

    // Create event using service
    const result = await eventService.createEvent({
      organizerId,
      title: title.trim(),
      category,
      description: description.trim(),
      longDescription: longDescription?.trim() || '',
      startDate: date,
      endDate: date, // For now, single day events
      startTime,
      endTime: endTime || '',
      location: location.trim(),
      address: address?.trim() || '',
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
      pricing: {
        type: isFree ? 'free' : 'paid',
        amount: isFree ? undefined : parseFloat(ticketPrice || '0'),
        currency: 'KES'
      },
      organizerName: organizerName.trim(),
      organizerEmail: organizerEmail.toLowerCase(),
      organizerPhone: organizerPhone?.trim() || '',
      website: website?.trim(),
      tags: tags || [],
      images: images || [],
      requiresRegistration: requiresRegistration ?? false,
      ageRestriction: ageRestriction?.trim(),
      specialRequirements: specialRequirements?.trim()
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create event' },
        { status: 400 }
      )
    }

    // Log security event
    securityAudit.logEvent(
      'event_creation',
      'low',
      'New event submitted for approval',
      {
        eventId: result.eventId,
        title: title.trim(),
        category,
        organizerEmail: organizerEmail.toLowerCase()
      },
      organizerId,
      clientIP,
      userAgent
    )

    console.log('Event submitted successfully:', {
      eventId: result.eventId,
      title: title.trim(),
      organizerId,
      submittedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      data: {
        eventId: result.eventId,
        status: 'pending_approval',
        message: 'Event submitted successfully and is pending approval'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
