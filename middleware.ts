import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. Handle CORS preflight requests early (critical for browser → Edge Function / API calls)
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') || '*'
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type, authorization, x-client-info, apikey, x-requested-with',
        'Access-Control-Max-Age': '86400', // Cache preflight 24 hours
        'Vary': 'Origin',
      },
    })
  }

  // 2. Run Supabase session + subdomain logic
  const response = await updateSession(request)

  // 3. Add CORS headers to the final response (for non-preflight requests)
  const origin = request.headers.get('origin')
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Vary', 'Origin')
  }

  return response
}

export const config = {
  matcher: [
    // Run on everything except static assets, images, etc.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}