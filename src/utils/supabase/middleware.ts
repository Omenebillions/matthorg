import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
            request: { headers: request.headers },
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
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...sharedOptions })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()
  const path = url.pathname

  const isBaseDomain = 
    hostname === 'mthorg.com' || 
    hostname === 'www.mthorg.com' || 
    hostname === 'localhost:3000'

  const subdomain = isBaseDomain ? null : hostname.split('.')[0].toLowerCase()

  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/auth') ||
    path.includes('.')
  ) {
    return response
  }

  // 3. Auth Protection & Main Domain Redirect
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/settings'))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(loginUrl)
  }

  // ✨ NEW LOGIC: If logged in on WWW, redirect to their tenant subdomain
  if (user && path.startsWith('/dashboard') && isBaseDomain) {
    const { data: staff } = await supabase
      .from('staff_profiles')
      .select('organizations!organization_id(subdomain)')
      .eq('id', user.id)
      .maybeSingle() as any;

    const targetSub = staff?.organizations?.subdomain?.toLowerCase();

    if (targetSub && targetSub !== 'www') {
      const tenantUrl = new URL(path, request.url);
      tenantUrl.hostname = `${targetSub}.mthorg.com`;
      return NextResponse.redirect(tenantUrl);
    }
  }

  if (user && (path === '/login' || path === '/signup')) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // 4. Subdomain Rewrite
  if (subdomain && subdomain !== 'www') {
    if (
      path.startsWith('/login') || 
      path.startsWith('/signup') || 
      path.startsWith(`/${subdomain}`)
    ) {
      return response
    }

    url.pathname = `/${subdomain}${path}`
    const rewriteResponse = NextResponse.rewrite(url)

    response.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie.name, cookie.value)
    })

    return rewriteResponse
  }

  return response
}