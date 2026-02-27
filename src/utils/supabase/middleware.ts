import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Initialize the response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const hostname = request.headers.get('host') || ''
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1')
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
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...sharedOptions })
        },
        remove(name: string, options: CookieOptions) {
          const sharedOptions = {
            ...options,
            domain: cookieDomain,
            path: '/',
          }
          request.cookies.set({ name, value: '', ...sharedOptions })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...sharedOptions })
        },
      },
    }
  )

  // 1. Refresh session / get current user
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Domain & Subdomain detection
  const url = request.nextUrl.clone()
  const path = url.pathname

  const isBaseDomain = 
    hostname === 'mthorg.com' || 
    hostname === 'www.mthorg.com' || 
    hostname === 'localhost:3000'

  const subdomain = isBaseDomain ? null : hostname.split('.')[0]

  // Early return for assets/api/auth
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/auth') ||
    path.includes('.')
  ) {
    return response
  }

  // 3. Auth Protection
  // If not logged in and trying to access dashboard/settings, redirect to login
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/settings'))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(loginUrl)
  }

  // If logged in and trying to access login/signup, redirect to dashboard
  if (user && (path === '/login' || path === '/signup')) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // 4. Subdomain Rewrite (The 404 Fix)
  if (subdomain && subdomain !== 'www') {
    // 🛑 CRITICAL: Do NOT rewrite for login, signup, or if already prefixed
    // This allows tidy.mthorg.com/login to resolve to src/app/login/page.tsx
    if (
      path.startsWith('/login') || 
      path.startsWith('/signup') || 
      path.startsWith(`/${subdomain}`)
    ) {
      return response
    }

    // Internally route to the [subdomain] folder
    // e.g., tidy.mthorg.com/dashboard -> src/app/[subdomain]/dashboard/page.tsx
    url.pathname = `/${subdomain}${path}`
    const rewriteResponse = NextResponse.rewrite(url)

    // Copy cookies to the rewrite response so user stays logged in
    response.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie.name, cookie.value)
    })

    return rewriteResponse
  }

  return response
}