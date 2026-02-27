import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Determine domain for cookies (shared wildcard in prod, none in local)
  const isLocal = request.headers.get('host')?.includes('localhost')
  const cookieDomain = isLocal ? undefined : '.mthorg.com'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          const sharedOptions = {
            ...options,
            domain: cookieDomain,
            path: '/',
            secure: !isLocal,
            sameSite: 'lax' as const,
          }
          request.cookies.set({ name, value, ...sharedOptions })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...sharedOptions })
        },
        remove(name: string, options: CookieOptions) {
          const sharedOptions = {
            ...options,
            domain: cookieDomain,
            path: '/',
          }
          request.cookies.set({ name, value: '', ...sharedOptions })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...sharedOptions })
        },
      },
    }
  )

  // Refresh session / get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Domain & subdomain detection
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const path = url.pathname

  const isMainDomain =
    hostname === 'mthorg.com' ||
    hostname === 'www.mthorg.com' ||
    isLocal

  const subdomain = isMainDomain ? null : hostname.split('.')[0]

  // Early return for static / API / auth routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/auth') ||
    path.includes('.')
  ) {
    return response
  }

  // 1. Protect dashboard/settings routes
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/settings'))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Redirect logged-in users away from login/signup
  if (user && (path === '/login' || path === '/signup')) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // 3. Subdomain rewrite (only if on a tenant subdomain)
  if (subdomain) {
    // Prevent rewrite loops
    if (path.startsWith(`/${subdomain}`)) {
      return response
    }

    // Rewrite to internal dynamic route: tidy.mthorg.com/dashboard → /tidy/dashboard
    url.pathname = `/${subdomain}${path}`
    const rewriteResponse = NextResponse.rewrite(url)

    // Sync all cookies to the rewritten response
    response.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return rewriteResponse
  }

  return response
}