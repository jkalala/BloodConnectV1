import { createI18nMiddleware } from "next-international/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from '@supabase/supabase-js'

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "fr", "pt", "sw"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
})

import { checkRateLimit, RATE_LIMITS, createRateLimitKey } from './lib/rate-limiting'
import { logSecurityEvent, SecurityEventType, RiskLevel } from './lib/security-monitoring'

async function verifyAuthentication(request: NextRequest): Promise<{ user: any; session: any } | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return null
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Get auth token from cookie or authorization header
    const authHeader = request.headers.get('authorization')
    const authCookie = request.cookies.get('sb-access-token')?.value
    
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authCookie
    
    if (!token) {
      return null
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }
    
    return { user, session: { access_token: token } }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Apply rate limiting to all requests
  const rateLimitKey = createRateLimitKey(request)
  const rateLimitResult = await checkRateLimit(rateLimitKey, RATE_LIMITS.API_GENERAL)
  
  if (!rateLimitResult.success) {
    // Log rate limit violation
    await logSecurityEvent({
      event_type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      risk_level: RiskLevel.MEDIUM,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip,
      user_agent: request.headers.get('user-agent'),
      endpoint: pathname,
      method: request.method,
      details: {
        limit: rateLimitResult.limit,
        hits: rateLimitResult.totalHits,
        retryAfter: rateLimitResult.retryAfter
      }
    })
    
    return NextResponse.json(
      { 
        success: false,
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        }
      },
      { 
        status: 429, 
        headers: { 
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        } 
      }
    )
  }
  
  // API route protection
  if (pathname.startsWith('/api/')) {
    // Public API routes that don't require authentication
    const publicRoutes = [
      '/api/health',
      '/api/public'
    ]
    
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
    
    if (!isPublicRoute) {
      const auth = await verifyAuthentication(request)
      
      if (!auth) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // Clone the request to add headers
      const response = NextResponse.next()
      response.headers.set('x-user-id', auth.user.id)
      response.headers.set('x-user-email', auth.user.email || '')
      return response
    }
  }
  
  // Apply i18n middleware to all other requests
  const i18nResponse = I18nMiddleware(request)
  
  // Add security headers to all responses
  if (i18nResponse instanceof NextResponse) {
    i18nResponse.headers.set('X-DNS-Prefetch-Control', 'on')
    i18nResponse.headers.set('X-XSS-Protection', '1; mode=block')
    i18nResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
    i18nResponse.headers.set('X-Content-Type-Options', 'nosniff')
    i18nResponse.headers.set('Referrer-Policy', 'origin-when-cross-origin')
    i18nResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  return i18nResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 