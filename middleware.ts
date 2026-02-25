// /home/user/matthorg/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
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

  // Refresh session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const path = url.pathname

  const isProduction = process.env.NODE_ENV === 'production'
  
  // Identify Subdomain
  let subdomain = null
  let isSubdomain = false

  if (isProduction) {
    // Production: subdomain.matthorg.com
    if (hostname.endsWith('.matthorg.com') && hostname !== 'matthorg.com') {
      subdomain = hostname.replace('.matthorg.com', '')
      isSubdomain = true
    }
  } else {
    // Localhost development
    if (hostname.includes('.localhost')) {
      subdomain = hostname.split('.')[0]
      isSubdomain = true
    } else {
      // Allow testing via query param
      const urlSubdomain = url.searchParams.get('subdomain')
      if (urlSubdomain) {
        subdomain = urlSubdomain
        isSubdomain = true
      }
    }
  }

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/auth/callback', '/reset-password']
  const isPublicPath = publicPaths.includes(path) || 
    path.startsWith('/_next') || 
    path.includes('.') ||
    path.startsWith('/api')

  // 🚀 REDIRECT LOGGED-IN USERS AWAY FROM LOGIN/SIGNUP
  if (user && (path === '/login' || path === '/signup')) {
    if (isSubdomain) {
      // Already on subdomain - send to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      // On main domain - fetch their org and redirect
      const { data: staff } = await supabase
        .from('staff_profiles')
        .select(`
          organizations (
            subdomain
          )
        `)
        .eq('id', user.id)
        .maybeSingle()
      
      // 🔥 FIX: Handle both object and array responses
      let orgSubdomain = null
      
      if (staff?.organizations) {
        // If it's an array, get first item
        if (Array.isArray(staff.organizations)) {
          orgSubdomain = staff.organizations[0]?.subdomain
        } else {
          // If it's an object, access directly
          orgSubdomain = (staff.organizations as any).subdomain
        }
      }
      
      if (orgSubdomain) {
        if (isProduction) {
          return NextResponse.redirect(
            new URL(`https://${orgSubdomain}.matthorg.com/dashboard`, request.url)
          )
        } else {
          return NextResponse.redirect(
            new URL(`/?subdomain=${orgSubdomain}`, request.url)
          )
        }
      }
      // Fallback if no org found
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Auth Guard - Redirect to login if not authenticated on protected routes
  if (!isPublicPath && !user) {
    if (isSubdomain) {
      // Subdomain users go to main domain login with context
      const loginUrl = isProduction
        ? `https://matthorg.com/login?redirect=${encodeURIComponent(path)}&subdomain=${subdomain}`
        : `/login?redirect=${encodeURIComponent(path)}&subdomain=${subdomain}`
      return NextResponse.redirect(new URL(loginUrl, request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // SUBDOMAIN REWRITE RULES - Aligned with folder structure
  if (isSubdomain) {
    // SPECIAL CASE: Login/Signup go to (main) group
    if (path === '/login' || path === '/signup') {
      url.pathname = `/(main)${path}`
      const rewriteResponse = NextResponse.rewrite(url)
      
      // Preserve cookies
      response.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie.name, cookie.value)
      })
      
      return rewriteResponse
    }
    
    // DEFAULT: All other subdomain traffic goes to [subdomain] dynamic folder
    url.pathname = `/[subdomain]${path}`
    const rewriteResponse = NextResponse.rewrite(url)
    
    // Preserve cookies
    response.cookies.getAll().forEach(cookie => {
      rewriteResponse.cookies.set(cookie.name, cookie.value)
    })
    
    return rewriteResponse
  }

  // MAIN DOMAIN - No rewrites needed
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}