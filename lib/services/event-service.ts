import { couchdb } from '../couchdb'
import config from '../config/environment'
import { EventDocument } from '../models'
import { securityAudit } from '../security-audit'

export class EventService {
  private readonly dbName = config.database.database || 'mtaani'

  private databaseChecked = false

  private async ensureDatabase(): Promise<void> {
    if (this.databaseChecked) return
    const exists = await couchdb.databaseExists(this.dbName)
    if (!exists) {
      await couchdb.createDatabase(this.dbName)
      // Create essential indexes used by queries
      try {
        await couchdb.createIndex(this.dbName, ['type', 'isDeleted'])
      } catch {}
      try {
        await couchdb.createIndex(this.dbName, ['type', 'isDeleted', 'schedule.startDate'])
      } catch {}
      try {
        await couchdb.createIndex(this.dbName, ['type', 'status', 'isDeleted'])
      } catch {}
      try {
        await couchdb.createIndex(this.dbName, ['type', 'category', 'status', 'isDeleted'])
      } catch {}
    }
    this.databaseChecked = true
  }

  // Create a new event
  async createEvent(eventData: {
    organizerId: string
    title: string
    category: string
    description: string
    longDescription: string
    startDate: string
    endDate: string
    startTime: string
    endTime: string
    location: string
    address: string
    maxAttendees?: number
    pricing: {
      type: 'free' | 'paid'
      amount?: number
      currency?: string
    }
    organizerName: string
    organizerEmail: string
    organizerPhone: string
    website?: string
    tags: string[]
    images: string[]
    requiresRegistration: boolean
    ageRestriction?: string
    specialRequirements?: string
  }): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      await this.ensureDatabase()
      // Create event document
      const eventDoc: Omit<EventDocument, '_id' | '_rev' | 'createdAt' | 'updatedAt'> = {
        type: 'event',
        organizerId: eventData.organizerId,
        title: eventData.title.trim(),
        category: eventData.category,
        description: eventData.description.trim(),
        longDescription: eventData.longDescription.trim(),
        status: 'pending_approval',
        schedule: {
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          timezone: 'Africa/Nairobi'
        },
        location: {
          venue: eventData.location,
          address: eventData.address,
          coordinates: [0, 0] // Will be geocoded later
        },
        organizer: {
          name: eventData.organizerName,
          email: eventData.organizerEmail,
          phone: eventData.organizerPhone,
          website: eventData.website
        },
        pricing: eventData.pricing,
        capacity: {
          max: eventData.maxAttendees || 0,
          current: 0,
          waitlist: 0
        },
        media: {
          gallery: eventData.images,
          videos: []
        },
        registration: {
          required: eventData.requiresRegistration,
          fields: []
        },
        tags: eventData.tags,
        stats: {
          views: 0,
          interested: 0,
          attending: 0,
          shares: 0
        },
        version: 1,
        isDeleted: false
      }

      const response = await couchdb.createDocument(this.dbName, eventDoc)

      if (response.ok) {
        // Log event creation
        securityAudit.logEvent(
          'event_creation',
          'low',
          'Event created',
          {
            eventTitle: eventData.title,
            category: eventData.category,
            organizerEmail: eventData.organizerEmail
          },
          eventData.organizerId
        )

        return { success: true, eventId: response.id }
      }

      return { success: false, error: 'Failed to create event' }
    } catch (error) {
      console.error('Event creation error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Find event by ID
  async findEventById(eventId: string): Promise<EventDocument | null> {
    try {
      await this.ensureDatabase()
      const event = await couchdb.getDocument<EventDocument>(this.dbName, eventId)
      return event.isDeleted ? null : event
    } catch (error) {
      console.error('Find event by ID error:', error)
      return null
    }
  }

  // Find events with filters
  async findEvents(
    filters: {
      status?: string
      category?: string
      organizerId?: string
      startDate?: string
      endDate?: string
    } = {},
    options: { limit?: number; skip?: number } = {}
  ): Promise<{ success: boolean; events?: EventDocument[]; total?: number; error?: string }> {
    try {
      await this.ensureDatabase()
      const selector: Record<string, unknown> = {
        type: 'event',
        isDeleted: false,
        ...filters
      }

      const result = await couchdb.find<EventDocument>(this.dbName, selector, {
        limit: options.limit || 50,
        skip: options.skip || 0,
        sort: [{ 'schedule.startDate': 'desc' }]
      })

      return {
        success: true,
        events: result.docs,
        total: result.docs.length
      }
    } catch (error) {
      console.error('Find events error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Update event status (for admin approval/rejection)
  async updateEventStatus(
    eventId: string,
    status: 'approved' | 'rejected' | 'pending_approval',
    reason?: string
  ): Promise<{ success: boolean; event?: EventDocument; error?: string }> {
    try {
      await this.ensureDatabase()
      const event = await this.findEventById(eventId)
      if (!event) {
        return { success: false, error: 'Event not found' }
      }

      const updatedEvent: EventDocument = {
        ...event,
        status,
        version: event.version + 1,
        updatedAt: new Date().toISOString()
      }

      // Add approval/rejection metadata
      if (status === 'approved') {
        updatedEvent.approvedAt = new Date().toISOString()
      } else if (status === 'rejected') {
        updatedEvent.rejectedAt = new Date().toISOString()
        if (reason) {
          updatedEvent.rejectionReason = reason
        }
      }

      const response = await couchdb.updateDocument(this.dbName, updatedEvent)

      if (response.ok) {
        return { success: true, event: updatedEvent }
      }

      return { success: false, error: 'Failed to update event status' }
    } catch (error) {
      console.error('Update event status error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get public events (approved only)
  async getPublicEvents(
    filters: {
      category?: string
      location?: string
      startDate?: string
      endDate?: string
    } = {},
    options: { limit?: number; skip?: number } = {}
  ): Promise<EventDocument[]> {
    try {
      await this.ensureDatabase()
      const selector: Record<string, unknown> = {
        type: 'event',
        status: 'approved',
        isDeleted: false,
        ...filters
      }

      const result = await couchdb.find<EventDocument>(this.dbName, selector, {
        limit: options.limit || 20,
        skip: options.skip || 0,
        sort: [{ 'schedule.startDate': 'asc' }]
      })

      return result.docs
    } catch (error) {
      console.error('Get public events error:', error)
      return []
    }
  }

  // Soft delete event
  async deleteEvent(
    eventId: string,
    deletedBy: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureDatabase()
      const event = await this.findEventById(eventId)
      if (!event) {
        return { success: false, error: 'Event not found' }
      }

      const deletedEvent: EventDocument = {
        ...event,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy,
        status: 'rejected',
        version: event.version + 1
      }

      const response = await couchdb.updateDocument(this.dbName, deletedEvent)

      if (response.ok) {
        securityAudit.logEvent(
          'event_deletion',
          'medium',
          'Event deleted',
          { eventId, deletedBy, reason },
          deletedBy
        )
      }

      return { success: response.ok }
    } catch (error) {
      console.error('Event deletion error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
}

// Export singleton instance
export const eventService = new EventService()
