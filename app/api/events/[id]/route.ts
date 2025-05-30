import { NextRequest, NextResponse } from 'next/server'
import { securityAudit } from '@/lib/security-audit'
import { eventService } from '@/lib/services/event-service'

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

    const event = await eventService.findEventById(eventId)

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
      const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN || process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_TOKEN || 'dev_admin_dashboard_token_2024_secure'
      if (adminToken !== expectedAdminToken) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }
    }

    // Transform event for API response
    const transformedEvent = {
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
    }

    return NextResponse.json({
      success: true,
      data: { event: transformedEvent }
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
    const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN || process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_TOKEN || 'dev_admin_dashboard_token_2024_secure'
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

    // Get client information for logging
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    switch (action) {
      case 'approve':
        const approveResult = await eventService.updateEventStatus(eventId, 'approved')

        if (!approveResult.success) {
          return NextResponse.json(
            { error: approveResult.error || 'Failed to approve event' },
            { status: 400 }
          )
        }

        // Log approval
        securityAudit.logEvent(
          'suspicious_activity',
          'low',
          'Event approved by admin',
          {
            eventId,
            title: approveResult.event?.title,
            organizerEmail: approveResult.event?.organizer?.email
          },
          'admin',
          clientIP,
          userAgent
        )

        console.log('Event approved:', { eventId, title: approveResult.event?.title })

        return NextResponse.json({
          success: true,
          message: 'Event approved successfully',
          data: { event: approveResult.event }
        })

      case 'reject':
        const rejectResult = await eventService.updateEventStatus(eventId, 'rejected', rejectionReason)

        if (!rejectResult.success) {
          return NextResponse.json(
            { error: rejectResult.error || 'Failed to reject event' },
            { status: 400 }
          )
        }

        // Log rejection
        securityAudit.logEvent(
          'suspicious_activity',
          'low',
          'Event rejected by admin',
          {
            eventId,
            title: rejectResult.event?.title,
            organizerEmail: rejectResult.event?.organizer?.email,
            reason: rejectionReason
          },
          'admin',
          clientIP,
          userAgent
        )

        console.log('Event rejected:', {
          eventId,
          title: rejectResult.event?.title,
          reason: rejectionReason
        })

        return NextResponse.json({
          success: true,
          message: 'Event rejected',
          data: { event: rejectResult.event }
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
    const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN || process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_TOKEN || 'dev_admin_dashboard_token_2024_secure'
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

    // Get event details before deletion for logging
    const event = await eventService.findEventById(eventId)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Delete event using service
    const result = await eventService.deleteEvent(eventId, 'admin', 'Deleted by admin')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete event' },
        { status: 400 }
      )
    }

    // Log deletion
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    securityAudit.logEvent(
      'suspicious_activity',
      'medium',
      'Event deleted by admin',
      {
        eventId,
        title: event.title,
        organizerEmail: event.organizer?.email
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
