import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getSession()

  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl
  const path = url.pathname
  
  const rootDomain = process.env.NODE_ENV === 'production' 
    ? 'matthorg.com' 
    : 'localhost:3000'

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/sign-up', '/auth/callback']
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith('/_next') || path.includes('.')
  )

  // Allow access to public paths
  if (isPublicPath) {
    return response
  }

  // Get the user session to check authentication
  const { data: { session } } = await supabase.auth.getSession()

  // If user is not logged in and trying to access protected route, redirect to login
  if (!session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(redirectUrl)
  }

  // For now, comment out the subdomain rewrite until you're ready to implement workspaces
  /*
  const subdomain = hostname.replace(`.${rootDomain}`, '')
  
  // Handle subdomain routing for authenticated users
  if (subdomain && hostname !== rootDomain && subdomain !== 'www' && subdomain !== 'localhost:3000') {
    return NextResponse.rewrite(new URL(`/_workspaces/${subdomain}${url.pathname}`, request.url))
  }
  */

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}