import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. Handle CORS preflight requests. This is crucial for allowing cross-origin
  // API calls from the browser to your Next.js server/edge functions.
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') || '*'
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'content-type, authorization, x-client-info, apikey, x-requested-with',
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
        Vary: 'Origin',
      },
    })
  }

  // 2. Run the Supabase session management logic. This will refresh the user's
  // auth token and perform the auth guard check.
  const response = await updateSession(request)

  // 3. Add CORS headers to the final response for all non-preflight requests.
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
    // This matcher ensures the middleware runs on all routes except for
    // static assets, image optimization files, and other static resources.
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
