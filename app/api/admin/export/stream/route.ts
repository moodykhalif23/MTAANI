import { NextRequest, NextResponse } from 'next/server'
import { businessService } from '@/lib/services/business-service'
import { eventService } from '@/lib/services/event-service'
import { withSecurity } from '@/lib/middleware/api-security'
import { securityAudit } from '@/lib/security-audit'

// GET /api/admin/export/stream - Streaming export for large datasets
export async function GET(request: NextRequest) {
  return withSecurity(request, {
    adminOnly: true,
    rateLimit: {
      requests: 5,
      windowMs: 60 * 60 * 1000 // 1 hour - limited for streaming
    }
  }, async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const format = searchParams.get('format') || 'csv'
    const batchSize = parseInt(searchParams.get('batchSize') || '100')

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
    const validTypes = ['businesses', 'events']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid export type for streaming', validTypes },
        { status: 400 }
      )
    }

    // Log streaming export start
    securityAudit.logEvent(
      'admin_access',
      'low',
      `Admin streaming export started: ${type}`,
      { type, format, batchSize },
      'admin',
      clientIP,
      userAgent
    )

    try {
      // Create a readable stream
      const stream = new ReadableStream({
        async start(controller) {
          let skip = 0
          let totalExported = 0
          let hasMore = true

          // Send CSV headers first
          if (format === 'csv') {
            const headers = getCSVHeaders(type)
            controller.enqueue(new TextEncoder().encode(headers + '\n'))
          } else if (format === 'json') {
            controller.enqueue(new TextEncoder().encode('{"data":['))
          }

          while (hasMore) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let result: { success: boolean; businesses?: any[]; events?: any[] }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let data: any[] = []

              // Fetch batch based on type
              switch (type) {
                case 'businesses':
                  result = await businessService.findBusinesses({}, {
                    limit: batchSize,
                    skip
                  })
                  if (result.success && result.businesses) {
                    data = result.businesses
                  }
                  break

                case 'events':
                  result = await eventService.findEvents({}, {
                    limit: batchSize,
                    skip
                  })
                  if (result.success && result.events) {
                    data = result.events
                  }
                  break
              }

              // Check if we have more data
              hasMore = data.length === batchSize

              // Process and send batch
              if (data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                  const item = data[i]
                  let line = ''

                  if (format === 'csv') {
                    line = generateCSVRow(item, type)
                  } else if (format === 'json') {
                    if (totalExported > 0) {
                      line = ','
                    }
                    line += JSON.stringify(sanitizeForExport(item, type))
                  }

                  controller.enqueue(new TextEncoder().encode(line + '\n'))
                  totalExported++
                }
              }

              skip += batchSize

              // Add a small delay to prevent overwhelming the database
              await new Promise(resolve => setTimeout(resolve, 10))

            } catch (error) {
              console.error('Streaming export batch error:', error)
              hasMore = false
            }
          }

          // Close JSON array if needed
          if (format === 'json') {
            controller.enqueue(new TextEncoder().encode(']}'))
          }

          // Log completion
          securityAudit.logEvent(
            'admin_access',
            'low',
            `Admin streaming export completed: ${type}`,
            { type, format, totalExported },
            'admin',
            clientIP,
            userAgent
          )

          controller.close()
        },

        cancel() {
          console.log('Streaming export cancelled')
        }
      })

      // Determine content type and filename
      const contentType = format === 'json' ? 'application/json' : 'text/csv'
      const fileExtension = format === 'json' ? 'json' : 'csv'
      const filename = `${type}_stream_export_${new Date().toISOString().split('T')[0]}.${fileExtension}`

      return new NextResponse(stream, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
          'Transfer-Encoding': 'chunked'
        }
      })

    } catch (error) {
      console.error('Streaming export error:', error)

      // Log streaming export error
      securityAudit.logEvent(
        'admin_access',
        'medium',
        'Admin streaming export failed',
        {
          type,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        'admin',
        clientIP,
        userAgent
      )

      return NextResponse.json(
        { error: 'Streaming export failed' },
        { status: 500 }
      )
    }
  })
}

// Helper function to get CSV headers
function getCSVHeaders(type: string): string {
  switch (type) {
    case 'businesses':
      return 'ID,Name,Category,Subcategory,Status,Email,Phone,Address,County,Town,Rating,Review Count,Verified,Created At,Updated At'
    case 'events':
      return 'ID,Title,Description,Category,Status,Organizer Name,Organizer Email,Start Date,End Date,Location,Created At,Updated At'
    default:
      return 'ID,Data'
  }
}

// Helper function to generate CSV row
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateCSVRow(item: Record<string, any>, type: string): string {
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

    default:
      row.push(item._id || '', JSON.stringify(item))
  }

  return row.join(',')
}

// Helper function to sanitize data for export
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeForExport(item: Record<string, any>, type: string): Record<string, any> {
  switch (type) {
    case 'businesses':
      return {
        id: item._id,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        status: item.status,
        contact: {
          email: item.contact?.email,
          phone: item.contact?.phone,
          website: item.contact?.website
        },
        location: {
          address: item.location?.address,
          county: item.location?.county,
          town: item.location?.town,
          coordinates: item.location?.coordinates
        },
        stats: {
          rating: item.stats?.rating,
          reviewCount: item.stats?.reviewCount
        },
        verified: item.verification?.status === 'verified',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }

    case 'events':
      return {
        id: item._id,
        title: item.title,
        description: item.description,
        category: item.category,
        status: item.status,
        organizer: {
          name: item.organizer?.name,
          email: item.organizer?.email
        },
        schedule: {
          startDate: item.schedule?.startDate,
          endDate: item.schedule?.endDate
        },
        location: {
          address: item.location?.address
        },
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }

    default:
      return item
  }
}
