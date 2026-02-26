import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. 🛡️ FIX CORS: Handle pre-flight OPTIONS requests
  // This prevents the browser from blocking requests between subdomains
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204 });
  }

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

  // 2. 🔄 Refresh session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // 3. 🌐 Identify Domain
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const path = url.pathname

  // Standardize on mthorg.com (single 't')
  const isMainDomain = hostname === "mthorg.com" || hostname === "www.mthorg.com" || hostname === "localhost:3000";
  
  let subdomain = null;
  if (!isMainDomain) {
    subdomain = hostname.split('.')[0];
  }

  // 4. ⚙️ Handle Static/API routes early
  if (path.startsWith('/_next') || path.includes('.') || path.startsWith('/api')) {
    return response;
  }

  // 5. 🚪 Auth Redirects for Login/Signup
  if (user && (path === '/login' || path === '/signup')) {
    // If logged in on a subdomain, go to dashboard
    if (subdomain) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // If on main domain, find where they belong
    const { data: staff } = await supabase
      .from('staff_profiles')
      .select('organizations(subdomain)')
      .eq('user_id', user.id)
      .maybeSingle();

    const orgSubdomain = (staff?.organizations as any)?.subdomain;
    if (orgSubdomain) {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      return NextResponse.redirect(new URL(`${protocol}://${orgSubdomain}.mthorg.com/dashboard`));
    }
  }

  // 6. 🔒 Protected Routes Guard
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/settings'))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 7. 🏗️ REWRITE LOGIC
  if (subdomain) {
    // Rewrite to /[subdomain] folder
    url.pathname = `/[subdomain]${path}`;
    
    const rewriteResponse = NextResponse.rewrite(url);
    
    // Sync cookies to the rewrite response so the user stays logged in
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