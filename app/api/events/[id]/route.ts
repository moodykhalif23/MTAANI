import { NextRequest, NextResponse } from 'next/server'
import { securityAudit } from '@/lib/security-audit'

// This would import from the same storage as the main events route
// In production, this would be a database service
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

// Import the same storage (in production, use database)
declare global {
  // eslint-disable-next-line no-var
  var eventsStorage: Event[]
}

if (!global.eventsStorage) {
  global.eventsStorage = []
}

// GET /api/events/[id] - Get specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const event = global.eventsStorage.find(e => e.id === eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if user can view this event
    const { searchParams } = new URL(request.url)
    const adminToken = searchParams.get('adminToken')

    if (event.status !== 'approved') {
      // Only admin can view non-approved events
      const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN || 'dev_admin_token_789'
      if (adminToken !== expectedAdminToken) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: { event }
    })

  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id] - Update event status (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    const body = await request.json()
    const { action, adminToken, rejectionReason } = body

    // Verify admin access
    const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN || 'dev_admin_token_789'
    if (adminToken !== expectedAdminToken) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const eventIndex = global.eventsStorage.findIndex(e => e.id === eventId)

    if (eventIndex === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const event = global.eventsStorage[eventIndex]

    // Get client information for logging
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    switch (action) {
      case 'approve':
        event.status = 'approved'
        event.approvedAt = new Date().toISOString()

        // Log approval
        securityAudit.logEvent(
          'event_approved',
          'low',
          'Event approved by admin',
          {
            eventId,
            title: event.title,
            organizerEmail: event.organizerEmail
          },
          'admin',
          clientIP,
          userAgent
        )

        console.log('Event approved:', { eventId, title: event.title })

        return NextResponse.json({
          success: true,
          message: 'Event approved successfully',
          data: { event }
        })

      case 'reject':
        event.status = 'rejected'
        event.rejectedAt = new Date().toISOString()
        event.rejectionReason = rejectionReason || 'No reason provided'

        // Log rejection
        securityAudit.logEvent(
          'event_rejected',
          'low',
          'Event rejected by admin',
          {
            eventId,
            title: event.title,
            organizerEmail: event.organizerEmail,
            reason: event.rejectionReason
          },
          'admin',
          clientIP,
          userAgent
        )

        console.log('Event rejected:', {
          eventId,
          title: event.title,
          reason: event.rejectionReason
        })

        return NextResponse.json({
          success: true,
          message: 'Event rejected',
          data: { event }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "approve" or "reject"' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Delete event (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    const { searchParams } = new URL(request.url)
    const adminToken = searchParams.get('adminToken')

    // Verify admin access
    const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN || 'dev_admin_token_789'
    if (adminToken !== expectedAdminToken) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const eventIndex = global.eventsStorage.findIndex(e => e.id === eventId)

    if (eventIndex === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const event = global.eventsStorage[eventIndex]
    global.eventsStorage.splice(eventIndex, 1)

    // Log deletion
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    securityAudit.logEvent(
      'event_deleted',
      'medium',
      'Event deleted by admin',
      {
        eventId,
        title: event.title,
        organizerEmail: event.organizerEmail
      },
      'admin',
      clientIP,
      userAgent
    )

    console.log('Event deleted:', { eventId, title: event.title })

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
