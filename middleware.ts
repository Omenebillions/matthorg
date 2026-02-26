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

  // 1. Refresh session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // 2. Identify Domain - CORRECTED to mthorg.com
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const path = url.pathname

  // ✅ FIXED: Using mthorg.com (your actual domain)
  const isMainDomain = hostname === "mthorg.com" || hostname === "www.mthorg.com" || hostname === "localhost:3000";
  
  let subdomain = null;
  if (!isMainDomain) {
    subdomain = hostname.split('.')[0];
  }

  // 3. Handle Static/API routes
  if (path.startsWith('/_next') || path.includes('.') || path.startsWith('/api')) {
    return response;
  }

  // 4. Auth Redirects for Login/Signup
  if (user && (path === '/login' || path === '/signup')) {
    if (subdomain) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    const { data: staff } = await supabase
      .from('staff_profiles')
      .select('organizations(subdomain)')
      .eq('user_id', user.id)
      .maybeSingle();

    const orgSubdomain = (staff?.organizations as any)?.subdomain;
    if (orgSubdomain) {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const rootDomain = isMainDomain ? hostname : 'mthorg.com';
      return NextResponse.redirect(new URL(`${protocol}://${orgSubdomain}.${rootDomain}/dashboard`));
    }
  }

  // 5. Protected Routes Guard
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/settings'))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 6. REWRITE LOGIC - The magic that makes subdomains work
  if (subdomain) {
    // This transforms tidy.mthorg.com/dashboard -> /app/[subdomain]/dashboard
    url.pathname = `/[subdomain]${path}`;
    
    const rewriteResponse = NextResponse.rewrite(url);
    
    // Copy cookies to keep user logged in
    response.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie.name, cookie.value);
    });
    
    return rewriteResponse;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}