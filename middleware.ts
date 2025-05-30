import { NextRequest, NextResponse } from 'next/server'
import { subscriptionMiddleware } from './lib/subscription-middleware'
import { verifyAccessToken, extractTokenFromHeader } from './lib/jwt'

// Define protected routes and their requirements
const protectedRoutes = {
  // Business dashboard routes
  '/business/dashboard': { requiredFeature: 'analyticsBasic' as const },
  '/business/menu': { requiredFeature: 'digitalMenu' as const },

  // Analytics routes
  '/business/analytics': { requiredFeature: 'analyticsBasic' as const },
  '/business/analytics/advanced': { requiredFeature: 'analyticsAdvanced' as const },

  // Enterprise features
  '/business/loyalty': { requiredFeature: 'loyaltyPrograms' as const },
  '/business/api': { requiredFeature: 'apiAccess' as const, allowTrial: false },
  '/business/branding': { requiredFeature: 'customBranding' as const },

  // Admin routes (require authentication but not subscription)
  '/admin': { requiresAuth: true },

  // Settings that require active subscription
  '/settings/subscription': { requiresAuth: true }
} as const

// Routes that require authentication but no specific subscription
const authRequiredRoutes = [
  '/business',
  '/settings',
  '/profile'
]

// Public routes that don't require any authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/verify',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/businesses',
  '/events',
  '/community',
  '/calendar'
]

// Helper function to check JWT authentication
async function checkJWTAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean
  userId?: string
  role?: string
  sessionId?: string
}> {
  // Check for access token in Authorization header
  const authHeader = request.headers.get('authorization')
  const accessToken = extractTokenFromHeader(authHeader)

  if (accessToken) {
    const tokenResult = verifyAccessToken(accessToken)
    if (tokenResult.valid) {
      return {
        isAuthenticated: true,
        userId: tokenResult.payload.userId,
        role: tokenResult.payload.role,
        sessionId: tokenResult.payload.sessionId
      }
    }
  }

  // Check for session cookie as fallback
  const sessionCookie = request.cookies.get('mtaani_session')
  if (sessionCookie) {
    // In production, validate session against database/Redis
    // For now, just check if cookie exists
    return {
      isAuthenticated: true,
      userId: 'session_user', // Would be retrieved from session store
      role: 'user' // Would be retrieved from session store
    }
  }

  return { isAuthenticated: false }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes (except subscription APIs)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/subscription/'))
  ) {
    return NextResponse.next()
  }

  // Check if route is public
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Check for specific protected routes
  for (const [route, config] of Object.entries(protectedRoutes)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      console.log(`Protecting route ${pathname} with config:`, config)

      if ('requiredFeature' in config) {
        return await subscriptionMiddleware(request, {
          requiredFeature: config.requiredFeature,
          allowTrial: 'allowTrial' in config ? config.allowTrial : true,
          redirectUrl: '/pricing'
        })
      }

      if (config.requiresAuth) {
        // JWT-based auth check
        const authResult = await checkJWTAuth(request)

        if (!authResult.isAuthenticated) {
          console.warn('Unauthorized access attempt to protected route:', pathname)
          return NextResponse.redirect(new URL('/auth/login', request.url))
        }
      }

      break
    }
  }

  // Check for general auth-required routes
  if (authRequiredRoutes.some(route => pathname.startsWith(route))) {
    const authResult = await checkJWTAuth(request)

    if (!authResult.isAuthenticated) {
      console.warn('Unauthorized access attempt to auth-required route:', pathname)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Rate limiting for subscription API endpoints
  if (pathname.startsWith('/api/subscription/')) {
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // In production, implement proper rate limiting with Redis or similar
    // For now, just log the request
    console.log('Subscription API access:', {
      ip,
      pathname,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    })

    // Add security headers for API routes
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
