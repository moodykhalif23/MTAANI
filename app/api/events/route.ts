import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/jwt'
import { securityAudit } from '@/lib/security-audit'

// In-memory storage for events (in production, use a database)
interface Event {
  id: string
  title: string
  category: string
  description: string
  longDescription: string
  date: string
  startTime: string
  endTime: string
  location: string
  address: string
  maxAttendees: string
  ticketPrice: string
  isFree: boolean
  organizerName: string
  organizerEmail: string
  organizerPhone: string
  website: string
  tags: string[]
  images: string[]
  requiresRegistration: boolean
  ageRestriction: string
  specialRequirements: string
  status: 'pending_approval' | 'approved' | 'rejected'
  submittedAt: string
  submittedBy?: string
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
}

// In-memory storage (replace with database in production)
declare global {
  var eventsStorage: Event[]
}

if (!global.eventsStorage) {
  global.eventsStorage = []
}

// GET /api/events - Get events (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const adminToken = searchParams.get('adminToken')

    let filteredEvents = [...global.eventsStorage]

    // If admin token provided, show all events including pending
    if (adminToken) {
      const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN || 'dev_admin_token_789'
      if (adminToken !== expectedAdminToken) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      // Admin can see all events
    } else {
      // Public can only see approved events
      filteredEvents = filteredEvents.filter(event => event.status === 'approved')
    }

    // Apply filters
    if (status) {
      filteredEvents = filteredEvents.filter(event => event.status === status)
    }

    if (category) {
      filteredEvents = filteredEvents.filter(event => event.category === category)
    }

    // Apply limit
    filteredEvents = filteredEvents.slice(0, limit)

    // Sort by date (newest first)
    filteredEvents.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    return NextResponse.json({
      success: true,
      data: {
        events: filteredEvents,
        total: filteredEvents.length
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
      .filter(([_, value]) => !value)
      .map(([key, _]) => key)

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
    let submittedBy: string | undefined
    const authHeader = request.headers.get('authorization')
    const accessToken = extractTokenFromHeader(authHeader)

    if (accessToken) {
      const tokenResult = verifyAccessToken(accessToken)
      if (tokenResult.valid) {
        submittedBy = tokenResult.payload.userId
      }
    }

    // Create event
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const newEvent: Event = {
      id: eventId,
      title: title.trim(),
      category,
      description: description.trim(),
      longDescription: longDescription?.trim() || '',
      date,
      startTime,
      endTime: endTime || '',
      location: location.trim(),
      address: address?.trim() || '',
      maxAttendees: maxAttendees || '',
      ticketPrice: ticketPrice || '',
      isFree: isFree ?? true,
      organizerName: organizerName.trim(),
      organizerEmail: organizerEmail.toLowerCase(),
      organizerPhone: organizerPhone?.trim() || '',
      website: website?.trim() || '',
      tags: tags || [],
      images: images || [],
      requiresRegistration: requiresRegistration ?? false,
      ageRestriction: ageRestriction?.trim() || '',
      specialRequirements: specialRequirements?.trim() || '',
      status: 'pending_approval',
      submittedAt: new Date().toISOString(),
      submittedBy
    }

    // Store event
    global.eventsStorage.push(newEvent)

    // Log security event
    securityAudit.logEvent(
      'suspicious_activity',
      'low',
      'New event submitted for approval',
      {
        eventId,
        title: newEvent.title,
        category: newEvent.category,
        organizerEmail: newEvent.organizerEmail
      },
      submittedBy,
      clientIP,
      userAgent
    )

    console.log('Event submitted successfully:', {
      eventId,
      title: newEvent.title,
      submittedBy,
      submittedAt: newEvent.submittedAt
    })

    return NextResponse.json({
      success: true,
      data: {
        eventId,
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
