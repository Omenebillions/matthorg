import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') || '*'
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type, authorization, x-client-info, apikey, x-requested-with',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
      },
    })
  }

  // 2. Run Supabase session logic (gets the response from your updateSession function)
  const response = await updateSession(request)

  // 3. Add security headers to the response
  if (response) {
    // Security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // ✅ UPDATED: Add connect-src to allow Supabase and DeepSeek API calls
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.deepseek.com;"
    )
    
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
    
    // Remove sensitive headers
    response.headers.delete('X-Powered-By')
    
    // 4. Add CORS headers to the final response (your existing code)
    const origin = request.headers.get('origin')
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Vary', 'Origin')
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}