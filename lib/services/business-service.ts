import { couchdb, generateDocId } from '../couchdb'
import { BusinessDocument } from '../models'
import { securityAudit } from '../security-audit'

export class BusinessService {
  private readonly dbName = 'mtaani'

  // Create a new business
  async createBusiness(businessData: {
    ownerId: string
    name: string
    description: string
    category: string
    subcategory?: string
    email: string
    phone: string
    address: string
    county: string
    town: string
    coordinates: [number, number]
  }): Promise<{ success: boolean; businessId?: string; error?: string }> {
    try {
      // Check if business name already exists for this owner
      const existingBusiness = await this.findBusinessByNameAndOwner(businessData.name, businessData.ownerId)
      if (existingBusiness) {
        return { success: false, error: 'Business with this name already exists' }
      }

      // Generate business ID
      const businessId = generateDocId('business', `${businessData.ownerId}-${businessData.name.toLowerCase().replace(/\s+/g, '-')}`)

      // Create business document
      const businessDoc: Omit<BusinessDocument, '_id' | '_rev' | 'createdAt' | 'updatedAt'> = {
        type: 'business',
        ownerId: businessData.ownerId,
        name: businessData.name.trim(),
        description: businessData.description.trim(),
        category: businessData.category,
        subcategory: businessData.subcategory,
        status: 'pending',
        verification: {
          status: 'pending',
          documents: []
        },
        contact: {
          email: businessData.email.toLowerCase(),
          phone: businessData.phone
        },
        location: {
          address: businessData.address,
          county: businessData.county,
          town: businessData.town,
          coordinates: businessData.coordinates,
          serviceAreas: [businessData.county]
        },
        hours: {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '17:00', closed: false },
          sunday: { open: '09:00', close: '17:00', closed: true }
        },
        media: {
          gallery: []
        },
        services: [],
        stats: {
          views: 0,
          clicks: 0,
          calls: 0,
          directions: 0,
          bookings: 0,
          rating: 0,
          reviewCount: 0,
          lastUpdated: new Date().toISOString()
        },
        version: 1,
        isDeleted: false,
        createdBy: businessData.ownerId
      }

      const response = await couchdb.createDocument(this.dbName, businessDoc)
      
      if (response.ok) {
        // Log business creation
        securityAudit.logEvent(
          'business_creation',
          'low',
          'Business profile created',
          { 
            businessName: businessData.name, 
            category: businessData.category,
            county: businessData.county 
          },
          businessData.ownerId
        )

        return { success: true, businessId: response.id }
      }

      return { success: false, error: 'Failed to create business' }
    } catch (error) {
      console.error('Business creation error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Find business by ID
  async findBusinessById(businessId: string): Promise<BusinessDocument | null> {
    try {
      const business = await couchdb.getDocument<BusinessDocument>(this.dbName, businessId)
      return business.isDeleted ? null : business
    } catch (error) {
      console.error('Find business by ID error:', error)
      return null
    }
  }

  // Find business by name and owner
  async findBusinessByNameAndOwner(name: string, ownerId: string): Promise<BusinessDocument | null> {
    try {
      const result = await couchdb.find<BusinessDocument>(this.dbName, {
        type: 'business',
        name: name.trim(),
        ownerId,
        isDeleted: false
      }, {
        limit: 1
      })

      return result.docs.length > 0 ? result.docs[0] : null
    } catch (error) {
      console.error('Find business by name and owner error:', error)
      return null
    }
  }

  // Find businesses by owner
  async findBusinessesByOwner(ownerId: string): Promise<BusinessDocument[]> {
    try {
      const result = await couchdb.find<BusinessDocument>(this.dbName, {
        type: 'business',
        ownerId,
        isDeleted: false
      }, {
        sort: [{ createdAt: 'desc' }]
      })

      return result.docs
    } catch (error) {
      console.error('Find businesses by owner error:', error)
      return []
    }
  }

  // Search businesses
  async searchBusinesses(criteria: {
    query?: string
    category?: string
    county?: string
    town?: string
    coordinates?: [number, number]
    radius?: number // in kilometers
    status?: 'active' | 'inactive' | 'pending'
    verified?: boolean
    limit?: number
    skip?: number
  }): Promise<{ businesses: BusinessDocument[]; total: number }> {
    try {
      const selector: any = {
        type: 'business',
        isDeleted: false
      }

      // Add filters
      if (criteria.category) {
        selector.category = criteria.category
      }

      if (criteria.county) {
        selector['location.county'] = criteria.county
      }

      if (criteria.town) {
        selector['location.town'] = criteria.town
      }

      if (criteria.status) {
        selector.status = criteria.status
      }

      if (criteria.verified !== undefined) {
        selector['verification.status'] = criteria.verified ? 'verified' : { $ne: 'verified' }
      }

      // Text search (simplified - in production, use full-text search)
      if (criteria.query) {
        selector.$or = [
          { name: { $regex: `(?i)${criteria.query}` } },
          { description: { $regex: `(?i)${criteria.query}` } },
          { category: { $regex: `(?i)${criteria.query}` } }
        ]
      }

      const result = await couchdb.find<BusinessDocument>(this.dbName, selector, {
        limit: criteria.limit || 20,
        skip: criteria.skip || 0,
        sort: [{ 'stats.rating': 'desc' }, { createdAt: 'desc' }]
      })

      // TODO: Implement geospatial filtering for coordinates and radius
      let filteredBusinesses = result.docs

      if (criteria.coordinates && criteria.radius) {
        filteredBusinesses = this.filterByDistance(
          result.docs,
          criteria.coordinates,
          criteria.radius
        )
      }

      return {
        businesses: filteredBusinesses,
        total: filteredBusinesses.length
      }
    } catch (error) {
      console.error('Search businesses error:', error)
      return { businesses: [], total: 0 }
    }
  }

  // Update business
  async updateBusiness(
    businessId: string,
    updates: Partial<BusinessDocument>,
    updatedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const business = await this.findBusinessById(businessId)
      if (!business) {
        return { success: false, error: 'Business not found' }
      }

      const updatedBusiness: BusinessDocument = {
        ...business,
        ...updates,
        version: business.version + 1,
        updatedBy,
        stats: {
          ...business.stats,
          lastUpdated: new Date().toISOString()
        }
      }

      const response = await couchdb.updateDocument(this.dbName, updatedBusiness)
      
      if (response.ok) {
        securityAudit.logEvent(
          'business_update',
          'low',
          'Business profile updated',
          { businessId, updatedBy },
          updatedBy
        )
      }

      return { success: response.ok }
    } catch (error) {
      console.error('Business update error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Update business stats
  async updateBusinessStats(
    businessId: string,
    statType: 'views' | 'clicks' | 'calls' | 'directions' | 'bookings',
    increment: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const business = await this.findBusinessById(businessId)
      if (!business) {
        return { success: false, error: 'Business not found' }
      }

      const updatedBusiness: BusinessDocument = {
        ...business,
        stats: {
          ...business.stats,
          [statType]: business.stats[statType] + increment,
          lastUpdated: new Date().toISOString()
        },
        version: business.version + 1
      }

      const response = await couchdb.updateDocument(this.dbName, updatedBusiness)
      return { success: response.ok }
    } catch (error) {
      console.error('Business stats update error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Verify business
  async verifyBusiness(
    businessId: string,
    verifiedBy: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const business = await this.findBusinessById(businessId)
      if (!business) {
        return { success: false, error: 'Business not found' }
      }

      const updatedBusiness: BusinessDocument = {
        ...business,
        verification: {
          ...business.verification,
          status,
          verifiedAt: status === 'verified' ? new Date().toISOString() : undefined,
          verifiedBy: status === 'verified' ? verifiedBy : undefined
        },
        status: status === 'verified' ? 'active' : 'pending',
        version: business.version + 1,
        updatedBy: verifiedBy
      }

      const response = await couchdb.updateDocument(this.dbName, updatedBusiness)
      
      if (response.ok) {
        securityAudit.logEvent(
          'business_verification',
          'medium',
          `Business ${status}`,
          { businessId, verifiedBy, reason },
          verifiedBy
        )
      }

      return { success: response.ok }
    } catch (error) {
      console.error('Business verification error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Soft delete business
  async deleteBusiness(
    businessId: string,
    deletedBy: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const business = await this.findBusinessById(businessId)
      if (!business) {
        return { success: false, error: 'Business not found' }
      }

      const deletedBusiness: BusinessDocument = {
        ...business,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy,
        status: 'inactive',
        version: business.version + 1
      }

      const response = await couchdb.updateDocument(this.dbName, deletedBusiness)
      
      if (response.ok) {
        securityAudit.logEvent(
          'business_deletion',
          'medium',
          'Business profile deleted',
          { businessId, deletedBy, reason },
          deletedBy
        )
      }

      return { success: response.ok }
    } catch (error) {
      console.error('Business deletion error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get businesses by category
  async getBusinessesByCategory(
    category: string,
    county?: string,
    limit: number = 20
  ): Promise<BusinessDocument[]> {
    try {
      const selector: any = {
        type: 'business',
        category,
        status: 'active',
        isDeleted: false
      }

      if (county) {
        selector['location.county'] = county
      }

      const result = await couchdb.find<BusinessDocument>(this.dbName, selector, {
        limit,
        sort: [{ 'stats.rating': 'desc' }, { 'stats.reviewCount': 'desc' }]
      })

      return result.docs
    } catch (error) {
      console.error('Get businesses by category error:', error)
      return []
    }
  }

  // Private helper methods
  private filterByDistance(
    businesses: BusinessDocument[],
    center: [number, number],
    radiusKm: number
  ): BusinessDocument[] {
    return businesses.filter(business => {
      const distance = this.calculateDistance(
        center,
        business.location.coordinates
      )
      return distance <= radiusKm
    })
  }

  private calculateDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const [lon1, lat1] = coord1
    const [lon2, lat2] = coord2
    
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

// Export singleton instance
export const businessService = new BusinessService()
