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
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const path = url.pathname

  // 1. Identify Subdomain
  const isMainDomain = hostname === "mthorg.com" || hostname === "www.mthorg.com" || hostname === "localhost:3000";
  let subdomain = null;
  if (!isMainDomain) {
    // Extract subdomain (e.g., "tidy" from "tidy.mthorg.com")
    subdomain = hostname.split('.')[0];
  }

  // 2. Handle Static/API routes
  if (path.startsWith('/_next') || path.includes('.') || path.startsWith('/api')) {
    return response;
  }

  // 3. Auth Redirect Logic for Login/Signup
  if (user && (path === '/login' || path === '/signup')) {
    // If they have a subdomain in URL, just go to dashboard
    if (subdomain) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Otherwise, find their org and send them to their subdomain
    const { data: staff } = await supabase
      .from('staff_profiles')
      .select('organizations(subdomain)')
      .eq('user_id', user.id) // Using user_id, not id
      .maybeSingle();

    const orgSubdomain = (staff?.organizations as any)?.subdomain;
    if (orgSubdomain) {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const rootDomain = process.env.NODE_ENV === 'production' ? 'mthorg.com' : 'localhost:3000';
      return NextResponse.redirect(new URL(`${protocol}://${orgSubdomain}.${rootDomain}/dashboard`));
    }
  }

  // 4. Auth Guard: Protected routes need a user
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/settings'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. Rewrite Logic - The key to making subdomains work
  if (subdomain) {
    // This rewrites tidy.mthorg.com/dashboard to /app/[subdomain]/dashboard/page.tsx
    url.pathname = `/[subdomain]${path}`;
    return NextResponse.rewrite(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}