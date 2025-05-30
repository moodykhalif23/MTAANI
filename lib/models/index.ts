import { CouchDBDocument } from '../couchdb'

// Base interfaces for all document types
export interface BaseDocument extends CouchDBDocument {
  version: number
  isDeleted: boolean
  deletedAt?: string
  deletedBy?: string
}

// User Document
export interface UserDocument extends BaseDocument {
  type: 'user'
  email: string
  name: string
  role: 'user' | 'business_owner' | 'admin'
  passwordHash: string
  verified: boolean
  loginAttempts: number
  lockedUntil?: string
  lastLogin?: string
  emailVerificationToken?: string
  emailVerificationExpires?: string
  passwordResetToken?: string
  passwordResetExpires?: string
  profile: {
    avatar?: string
    phone?: string
    location?: {
      county: string
      town: string
      coordinates?: [number, number] // [longitude, latitude]
    }
    preferences: {
      notifications: {
        email: boolean
        sms: boolean
        push: boolean
      }
      language: string
      timezone: string
    }
  }
  security: {
    tokenVersion: number
    twoFactorEnabled: boolean
    twoFactorSecret?: string
    backupCodes?: string[]
    lastPasswordChange: string
    securityQuestions?: Array<{
      question: string
      answerHash: string
    }>
  }
  metadata: {
    registrationIP: string
    registrationUserAgent: string
    lastLoginIP?: string
    lastLoginUserAgent?: string
    emailVerifiedAt?: string
    phoneVerifiedAt?: string
  }
}

// Business Document
export interface BusinessDocument extends BaseDocument {
  type: 'business'
  ownerId: string // Reference to UserDocument
  name: string
  description: string
  category: string
  subcategory?: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  verification: {
    status: 'pending' | 'verified' | 'rejected'
    verifiedAt?: string
    verifiedBy?: string
    documents: Array<{
      type: 'license' | 'permit' | 'certificate' | 'id'
      url: string
      uploadedAt: string
      status: 'pending' | 'approved' | 'rejected'
    }>
  }
  contact: {
    email: string
    phone: string
    website?: string
    socialMedia?: {
      facebook?: string
      twitter?: string
      instagram?: string
      linkedin?: string
    }
  }
  location: {
    address: string
    county: string
    town: string
    coordinates: [number, number] // [longitude, latitude]
    serviceAreas: string[] // Counties/towns they serve
  }
  hours: {
    [key: string]: { // monday, tuesday, etc.
      open: string // "09:00"
      close: string // "17:00"
      closed: boolean
    }
  }
  media: {
    logo?: string
    coverImage?: string
    gallery: Array<{
      url: string
      caption?: string
      uploadedAt: string
      type: 'image' | 'video'
    }>
  }
  services: Array<{
    id: string
    name: string
    description: string
    price?: {
      amount: number
      currency: string
      type: 'fixed' | 'hourly' | 'daily' | 'negotiable'
    }
    duration?: number // in minutes
    category: string
  }>
  menu?: Array<{
    id: string
    name: string
    description: string
    price: number
    currency: string
    category: string
    available: boolean
    ingredients?: string[]
    allergens?: string[]
    image?: string
  }>
  stats: {
    views: number
    clicks: number
    calls: number
    directions: number
    bookings: number
    rating: number
    reviewCount: number
    lastUpdated: string
  }
}

// Subscription Document
export interface SubscriptionDocument extends BaseDocument {
  type: 'subscription'
  userId: string
  businessId?: string
  plan: 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'inactive' | 'trialing' | 'cancelled' | 'past_due'
  billing: {
    interval: 'monthly' | 'annual'
    amount: number
    currency: string
    nextBillingDate: string
    lastBillingDate?: string
    paymentMethodId?: string
  }
  trial: {
    isTrialing: boolean
    trialStart?: string
    trialEnd?: string
    trialDays: number
  }
  usage: {
    photosUsed: number
    apiCallsUsed: number
    menuItemsUsed: number
    appointmentsUsed: number
    storageUsed: number // in bytes
    lastResetDate: string
  }
  limits: {
    photos: number
    apiCalls: number
    menuItems: number
    appointments: number
    storage: number // in bytes
  }
  features: {
    [key: string]: boolean | number | string
  }
  payment: {
    provider: 'mpesa' | 'stripe' | 'paypal'
    customerId?: string
    subscriptionId?: string
    lastPaymentId?: string
    lastPaymentStatus?: string
    failedPaymentAttempts: number
  }
  cancellation?: {
    cancelledAt: string
    cancelledBy: string
    reason?: string
    effectiveDate: string
    refundAmount?: number
  }
}

// Review Document
export interface ReviewDocument extends BaseDocument {
  type: 'review'
  businessId: string
  userId: string
  rating: number // 1-5
  title?: string
  content: string
  photos?: string[]
  response?: {
    content: string
    respondedAt: string
    respondedBy: string
  }
  status: 'published' | 'pending' | 'flagged' | 'removed'
  moderation: {
    flagCount: number
    flagReasons: string[]
    moderatedAt?: string
    moderatedBy?: string
    moderationReason?: string
  }
  metadata: {
    ipAddress: string
    userAgent: string
    verified: boolean // verified purchase/visit
    helpful: number // helpful votes
    notHelpful: number // not helpful votes
  }
}

// Event Document
export interface EventDocument extends BaseDocument {
  type: 'event'
  organizerId: string // User or Business ID
  title: string
  description: string
  longDescription: string
  category: string
  subcategory?: string
  status: 'pending_approval' | 'approved' | 'rejected' | 'draft' | 'published' | 'cancelled' | 'completed'
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  organizer: {
    name: string
    email: string
    phone: string
    website?: string
  }
  schedule: {
    startDate: string
    endDate: string
    startTime: string
    endTime: string
    timezone: string
    recurring?: {
      type: 'daily' | 'weekly' | 'monthly' | 'yearly'
      interval: number
      endDate?: string
      occurrences?: number
    }
  }
  location: {
    type: 'physical' | 'virtual' | 'hybrid'
    venue?: string
    address?: string
    coordinates?: [number, number]
    virtualLink?: string
    virtualPlatform?: string
  }
  pricing: {
    type: 'free' | 'paid'
    amount?: number
    currency?: string
    earlyBird?: {
      amount: number
      endDate: string
    }
  }
  capacity: {
    max: number
    current: number
    waitlist: number
  }
  media: {
    coverImage?: string
    gallery: string[]
    videos: string[]
  }
  registration: {
    required: boolean
    deadline?: string
    fields: Array<{
      name: string
      type: 'text' | 'email' | 'phone' | 'select' | 'checkbox'
      required: boolean
      options?: string[]
    }>
  }
  tags: string[]
  stats: {
    views: number
    interested: number
    attending: number
    shares: number
  }
}

// Booking/Appointment Document
export interface BookingDocument extends BaseDocument {
  type: 'booking'
  businessId: string
  userId: string
  serviceId?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  schedule: {
    date: string
    startTime: string
    endTime: string
    timezone: string
  }
  details: {
    service: string
    notes?: string
    specialRequests?: string
    participants: number
  }
  contact: {
    name: string
    email: string
    phone: string
  }
  pricing: {
    amount: number
    currency: string
    deposit?: number
    paid: boolean
    paymentMethod?: string
    paymentId?: string
  }
  cancellation?: {
    cancelledAt: string
    cancelledBy: 'user' | 'business'
    reason?: string
    refundAmount?: number
    refundStatus?: 'pending' | 'processed' | 'denied'
  }
  reminders: Array<{
    type: 'email' | 'sms' | 'push'
    sentAt: string
    status: 'sent' | 'delivered' | 'failed'
  }>
}

// Security Audit Document
export interface SecurityAuditDocument extends BaseDocument {
  type: 'security_audit'
  userId?: string
  sessionId?: string
  eventType: 'login' | 'logout' | 'signup' | 'password_change' | 'subscription_access' | 'payment' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata: {
    ipAddress: string
    userAgent: string
    location?: {
      country: string
      city: string
      coordinates?: [number, number]
    }
    device?: {
      type: 'desktop' | 'mobile' | 'tablet'
      os: string
      browser: string
    }
    [key: string]: unknown
  }
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  resolution?: string
}

// Session Document
export interface SessionDocument extends BaseDocument {
  type: 'session'
  userId: string
  sessionId: string
  status: 'active' | 'expired' | 'revoked'
  device: {
    type: 'desktop' | 'mobile' | 'tablet'
    os: string
    browser: string
    userAgent: string
  }
  location: {
    ipAddress: string
    country?: string
    city?: string
    coordinates?: [number, number]
  }
  activity: {
    lastActivity: string
    loginAt: string
    logoutAt?: string
    pageViews: number
    actions: number
  }
  security: {
    tokenVersion: number
    refreshTokenHash: string
    expiresAt: string
    revokedAt?: string
    revokedBy?: string
    revokedReason?: string
  }
}

// Union type for all documents
export type MtaaniDocument =
  | UserDocument
  | BusinessDocument
  | SubscriptionDocument
  | ReviewDocument
  | EventDocument
  | BookingDocument
  | SecurityAuditDocument
  | SessionDocument

// Type guards
export function isUserDocument(doc: MtaaniDocument): doc is UserDocument {
  return doc.type === 'user'
}

export function isBusinessDocument(doc: MtaaniDocument): doc is BusinessDocument {
  return doc.type === 'business'
}

export function isSubscriptionDocument(doc: MtaaniDocument): doc is SubscriptionDocument {
  return doc.type === 'subscription'
}

export function isReviewDocument(doc: MtaaniDocument): doc is ReviewDocument {
  return doc.type === 'review'
}

export function isEventDocument(doc: MtaaniDocument): doc is EventDocument {
  return doc.type === 'event'
}

export function isBookingDocument(doc: MtaaniDocument): doc is BookingDocument {
  return doc.type === 'booking'
}

export function isSecurityAuditDocument(doc: MtaaniDocument): doc is SecurityAuditDocument {
  return doc.type === 'security_audit'
}

export function isSessionDocument(doc: MtaaniDocument): doc is SessionDocument {
  return doc.type === 'session'
}
