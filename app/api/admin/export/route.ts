import { NextRequest, NextResponse } from 'next/server'
import { businessService } from '@/lib/services/business-service'
import { eventService } from '@/lib/services/event-service'
import { apiKeyService } from '@/lib/services/api-key-service'
import { withSecurity } from '@/lib/middleware/api-security'
import { securityAudit } from '@/lib/security-audit'



// CSV generation helper function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateCSV(data: Record<string, any>[], type: string): string {
  if (data.length === 0) {
    return `No ${type} data available\n`
  }

  let headers: string[] = []
  let csvContent = ''

  // Define headers based on data type
  switch (type) {
    case 'businesses':
      headers = ['ID', 'Name', 'Category', 'Subcategory', 'Status', 'Email', 'Phone', 'Address', 'County', 'Town', 'Rating', 'Review Count', 'Verified', 'Created At', 'Updated At']
      break
    case 'events':
      headers = ['ID', 'Title', 'Description', 'Category', 'Status', 'Organizer Name', 'Organizer Email', 'Start Date', 'End Date', 'Location', 'Created At', 'Updated At']
      break
    case 'api-keys':
      headers = ['Key ID', 'Name', 'Description', 'Status', 'Permissions', 'Total Requests', 'Last Used', 'Created By', 'Created At']
      break
    case 'security-events':
      headers = ['ID', 'Event Type', 'Severity', 'Description', 'User ID', 'IP Address', 'User Agent', 'Timestamp', 'Resolved']
      break
    default:
      // Auto-generate headers from first object
      headers = Object.keys(data[0] || {})
  }

  // Add headers
  csvContent = headers.join(',') + '\n'

  // Add data rows
  data.forEach(item => {
    const row: string[] = []

    switch (type) {
      case 'businesses':
        row.push(
          item._id || '',
          `"${(item.name || '').replace(/"/g, '""')}"`,
          item.category || '',
          item.subcategory || '',
          item.status || '',
          item.contact?.email || '',
          item.contact?.phone || '',
          `"${(item.location?.address || '').replace(/"/g, '""')}"`,
          item.location?.county || '',
          item.location?.town || '',
          item.stats?.rating?.toString() || '0',
          item.stats?.reviewCount?.toString() || '0',
          item.verification?.status === 'verified' ? 'Yes' : 'No',
          item.createdAt || '',
          item.updatedAt || ''
        )
        break

      case 'events':
        row.push(
          item._id || '',
          `"${(item.title || '').replace(/"/g, '""')}"`,
          `"${(item.description || '').replace(/"/g, '""')}"`,
          item.category || '',
          item.status || '',
          `"${(item.organizer?.name || '').replace(/"/g, '""')}"`,
          item.organizer?.email || '',
          item.schedule?.startDate || '',
          item.schedule?.endDate || '',
          `"${(item.location?.address || '').replace(/"/g, '""')}"`,
          item.createdAt || '',
          item.updatedAt || ''
        )
        break

      case 'api-keys':
        row.push(
          item.keyId || '',
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.description || '').replace(/"/g, '""')}"`,
          item.status || '',
          `"${(item.permissions || []).join('; ')}"`,
          item.usage?.totalRequests?.toString() || '0',
          item.usage?.lastUsed || '',
          item.createdBy || '',
          item.createdAt || ''
        )
        break

      case 'security-events':
        row.push(
          item.id || '',
          item.eventType || '',
          item.severity || '',
          `"${(item.description || '').replace(/"/g, '""')}"`,
          item.userId || '',
          item.ipAddress || '',
          `"${(item.userAgent || '').replace(/"/g, '""')}"`,
          item.timestamp?.toISOString() || '',
          item.resolved ? 'Yes' : 'No'
        )
        break

      default:
        // Auto-generate row from object values
        headers.forEach(header => {
          const value = item[header]
          if (typeof value === 'string') {
            row.push(`"${value.replace(/"/g, '""')}"`)
          } else if (value !== null && value !== undefined) {
            row.push(value.toString())
          } else {
            row.push('')
          }
        })
    }

    csvContent += row.join(',') + '\n'
  })

  return csvContent
}

// GET /api/admin/export - Export data with enhanced features
export async function GET(request: NextRequest) {
  return withSecurity(request, {
    adminOnly: true,
    rateLimit: {
      requests: 10,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  }, async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type')
      const format = (searchParams.get('format') || 'csv') as 'csv' | 'json' | 'excel'
      const limit = parseInt(searchParams.get('limit') || '1000')
      const skip = parseInt(searchParams.get('skip') || '0')
      const fields = searchParams.get('fields')?.split(',')

      // Get client info for logging
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      if (!type) {
        return NextResponse.json(
          { error: 'Export type is required' },
          { status: 400 }
        )
      }

      // Validate export type
      const validTypes = ['businesses', 'events', 'subscriptions', 'api-keys', 'security-events']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          {
            error: 'Invalid export type',
            validTypes
          },
          { status: 400 }
        )
      }

      // Log export attempt
      securityAudit.logEvent(
        'admin_access',
        'low',
        `Admin data export requested: ${type}`,
        {
          type,
          format,
          limit,
          skip,
          fields: fields?.length || 'all'
        },
        'admin',
        clientIP,
        userAgent
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: Record<string, any>[] = []
      let filename = ''
      let totalRecords = 0

      // Fetch data based on type
      switch (type) {
        case 'businesses':
          try {
            const result = await businessService.findBusinesses({}, { limit, skip })
            if (!result.success || !result.businesses) {
              throw new Error('Failed to fetch businesses from database')
            }
            data = result.businesses
            totalRecords = result.total || data.length
            filename = `businesses_export_${new Date().toISOString().split('T')[0]}`
          } catch (error) {
            console.error('Error exporting businesses:', error)
            return NextResponse.json(
              { error: 'Failed to export businesses data' },
              { status: 500 }
            )
          }
          break

        case 'events':
          try {
            const result = await eventService.findEvents({}, { limit, skip })
            if (!result.success || !result.events) {
              throw new Error('Failed to fetch events from database')
            }
            data = result.events
            totalRecords = result.total || data.length
            filename = `events_export_${new Date().toISOString().split('T')[0]}`
          } catch (error) {
            console.error('Error exporting events:', error)
            return NextResponse.json(
              { error: 'Failed to export events data' },
              { status: 500 }
            )
          }
          break

        case 'subscriptions':
          try {
            // Get all subscriptions (this would need to be implemented in subscription service)
            data = [] // Placeholder - implement subscription listing
            totalRecords = data.length
            filename = `subscriptions_export_${new Date().toISOString().split('T')[0]}`
          } catch (error) {
            console.error('Error exporting subscriptions:', error)
            return NextResponse.json(
              { error: 'Failed to export subscriptions data' },
              { status: 500 }
            )
          }
          break

        case 'api-keys':
          try {
            const result = await apiKeyService.listAPIKeys({}, { limit, skip })
            if (!result.success || !result.keys) {
              throw new Error('Failed to fetch API keys from database')
            }
            data = result.keys
            totalRecords = data.length
            filename = `api_keys_export_${new Date().toISOString().split('T')[0]}`
          } catch (error) {
            console.error('Error exporting API keys:', error)
            return NextResponse.json(
              { error: 'Failed to export API keys data' },
              { status: 500 }
            )
          }
          break

        case 'security-events':
          try {
            const events = securityAudit.getEvents({ limit })
            data = events
            totalRecords = events.length
            filename = `security_events_export_${new Date().toISOString().split('T')[0]}`
          } catch (error) {
            console.error('Error exporting security events:', error)
            return NextResponse.json(
              { error: 'Failed to export security events data' },
              { status: 500 }
            )
          }
          break

        default:
          return NextResponse.json(
            { error: 'Invalid export type' },
            { status: 400 }
          )
      }

      // Apply field filtering if specified
      if (fields && fields.length > 0) {
        data = data.map(item => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const filtered: Record<string, any> = {}
          fields.forEach(field => {
            if (item[field] !== undefined) {
              filtered[field] = item[field]
            }
          })
          return filtered
        })
      }

      // Generate export based on format
      let content: string
      let contentType: string
      let fileExtension: string

      switch (format) {
        case 'json':
          content = JSON.stringify({
            data,
            meta: {
              total: totalRecords,
              exported: data.length,
              exportedAt: new Date().toISOString(),
              type,
              format
            }
          }, null, 2)
          contentType = 'application/json'
          fileExtension = 'json'
          break

        case 'csv':
        default:
          content = generateCSV(data, type)
          contentType = 'text/csv'
          fileExtension = 'csv'
          break
      }

      // Log successful export
      securityAudit.logEvent(
        'admin_access',
        'low',
        `Admin data export completed: ${type}`,
        {
          type,
          format,
          recordsExported: data.length,
          totalRecords
        },
        'admin',
        clientIP,
        userAgent
      )

      // Return file
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
          'Cache-Control': 'no-cache',
          'X-Total-Records': totalRecords.toString(),
          'X-Exported-Records': data.length.toString()
        }
      })

    } catch (error) {
      console.error('Export error:', error)

      // Log export failure
      securityAudit.logEvent(
        'admin_access',
        'medium',
        'Admin data export failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        'admin',
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      )

      return NextResponse.json(
        { error: 'Internal server error during export' },
        { status: 500 }
      )
    }
  })
}
