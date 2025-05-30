import { NextRequest, NextResponse } from 'next/server'
import { businessService } from '@/lib/services/business-service'
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/jwt'
import { securityAudit } from '@/lib/security-audit'

// GET /api/businesses/[id] - Get business by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Find business
    const business = await businessService.findBusinessById(businessId)

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Update view count
    await businessService.updateBusinessStats(businessId, 'views')

    // Log business view for analytics
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    securityAudit.logEvent(
      'business_view',
      'low',
      'Business profile viewed',
      { businessId, businessName: business.name },
      undefined,
      clientIP,
      request.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      success: true,
      data: {
        business: {
          id: business._id,
          name: business.name,
          description: business.description,
          category: business.category,
          subcategory: business.subcategory,
          status: business.status,
          verified: business.verification.status === 'verified',
          verification: business.verification,
          contact: business.contact,
          location: business.location,
          hours: business.hours,
          media: business.media,
          services: business.services,
          menu: business.menu,
          stats: business.stats,
          createdAt: business.createdAt,
          updatedAt: business.updatedAt
        }
      }
    })

  } catch (error) {
    console.error('Get business error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get business'
      },
      { status: 500 }
    )
  }
}

// PUT /api/businesses/[id] - Update business or admin actions
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id
    const body = await request.json()
    const { action, adminToken, rejectionReason } = body

    // Check if this is an admin action
    if (action && adminToken) {
      // Verify admin access
      const expectedAdminToken = process.env.ADMIN_DASHBOARD_TOKEN || process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_TOKEN || 'dev_admin_dashboard_token_2024_secure'
      if (adminToken !== expectedAdminToken) {
        return NextResponse.json(
          { error: 'Unauthorized - admin access required' },
          { status: 401 }
        )
      }

      // Find business
      const business = await businessService.findBusinessById(businessId)
      if (!business) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        )
      }

      // Get client info for logging
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      // Handle admin actions
      switch (action) {
        case 'approve':
          const approveResult = await businessService.updateBusinessStatus(businessId, 'approved')
          if (approveResult.success) {
            securityAudit.logEvent(
              'business_approved',
              'low',
              'Business approved by admin',
              { businessId, businessName: business.name },
              'admin',
              clientIP,
              userAgent
            )
            return NextResponse.json({
              success: true,
              message: 'Business approved successfully',
              data: { business: approveResult.business }
            })
          }
          break

        case 'reject':
          const rejectResult = await businessService.updateBusinessStatus(businessId, 'rejected', rejectionReason)
          if (rejectResult.success) {
            securityAudit.logEvent(
              'business_rejected',
              'low',
              'Business rejected by admin',
              { businessId, businessName: business.name, reason: rejectionReason },
              'admin',
              clientIP,
              userAgent
            )
            return NextResponse.json({
              success: true,
              message: 'Business rejected',
              data: { business: rejectResult.business }
            })
          }
          break

        default:
          return NextResponse.json(
            { error: 'Invalid action. Use "approve" or "reject"' },
            { status: 400 }
          )
      }
    }

    // Regular business update (non-admin)
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

    // Find business
    const business = await businessService.findBusinessById(businessId)

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check ownership or admin role
    if (business.ownerId !== userId && tokenResult.payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to update this business' },
        { status: 403 }
      )
    }

    // Parse request body
    const updates = await request.json()

    // Remove fields that shouldn't be updated directly
    delete updates._id
    delete updates._rev
    delete updates.type
    delete updates.ownerId
    delete updates.createdAt
    delete updates.createdBy
    delete updates.version
    delete updates.isDeleted

    // Update business
    const result = await businessService.updateBusiness(businessId, updates, userId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Get updated business
    const updatedBusiness = await businessService.findBusinessById(businessId)

    return NextResponse.json({
      success: true,
      data: {
        business: {
          id: updatedBusiness!._id,
          name: updatedBusiness!.name,
          description: updatedBusiness!.description,
          category: updatedBusiness!.category,
          subcategory: updatedBusiness!.subcategory,
          status: updatedBusiness!.status,
          verified: updatedBusiness!.verification.status === 'verified',
          verification: updatedBusiness!.verification,
          contact: updatedBusiness!.contact,
          location: updatedBusiness!.location,
          hours: updatedBusiness!.hours,
          media: updatedBusiness!.media,
          services: updatedBusiness!.services,
          menu: updatedBusiness!.menu,
          stats: updatedBusiness!.stats,
          createdAt: updatedBusiness!.createdAt,
          updatedAt: updatedBusiness!.updatedAt
        }
      },
      message: 'Business updated successfully'
    })

  } catch (error) {
    console.error('Business update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update business'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/businesses/[id] - Delete business
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id

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

    // Find business
    const business = await businessService.findBusinessById(businessId)

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check ownership or admin role
    if (business.ownerId !== userId && tokenResult.payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to delete this business' },
        { status: 403 }
      )
    }

    // Get deletion reason from query params
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason')

    // Delete business (soft delete)
    const result = await businessService.deleteBusiness(businessId, userId, reason || undefined)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Business deleted successfully'
    })

  } catch (error) {
    console.error('Business deletion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete business'
      },
      { status: 500 }
    )
  }
}
