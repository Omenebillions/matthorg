// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cache for subdomain lookups (in-memory, per instance)
const subdomainCache = new Map<string, string | null>();

function getSubdomain(hostname: string): string | null {
  if (subdomainCache.has(hostname)) {
    return subdomainCache.get(hostname)!;
  }

  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isMainDomain = isLocal ||
    hostname === 'mthorg.com' ||
    hostname === 'www.mthorg.com' ||
    hostname === 'app.mthorg.com';

  const subdomain = isMainDomain ? null : hostname.split('.')[0];
  subdomainCache.set(hostname, subdomain);
  return subdomain;
}

function forceSharedCookies(res: NextResponse) {
  const cookies = res.cookies.getAll();
  cookies.forEach(cookie => {
    // Target Supabase auth cookies specifically - updated for @supabase/ssr
    if (cookie.name.startsWith('sb-') && (cookie.name.endsWith('-auth-token') || cookie.name.includes('-auth-token'))) {
      res.cookies.set({
        ...cookie,
        domain: '.mthorg.com',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  });
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create Supabase client using @supabase/ssr
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // This is called when setting cookies (e.g., on sign in)
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session / get user
  const { data: { user } } = await supabase.auth.getUser();

  // Extract hostname & subdomain
  const hostname = req.headers.get('host') || '';
  const url = req.nextUrl.clone();
  const path = url.pathname;

  const subdomain = getSubdomain(hostname);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') || '*';
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'authorization, content-type, x-client-info, apikey, x-subdomain');
    res.headers.set('Access-Control-Max-Age', '86400');
    res.headers.set('Vary', 'Origin');
    return res;
  }

  // Early return for static/API/auth/callback routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/auth') ||
    path.includes('.') ||
    path.startsWith('/auth/callback')
  ) {
    forceSharedCookies(res);
    return res;
  }

  // Redirect tenant root to dashboard
  if (subdomain && path === '/') {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Subdomain rewrite
  if (subdomain) {
    if (path.startsWith(`/${subdomain}`)) {
      forceSharedCookies(res);
      return res; // prevent loop
    }

    url.pathname = `/${subdomain}${path}`;
    const rewriteRes = NextResponse.rewrite(url);

    // Sync and force shared cookies
    forceSharedCookies(rewriteRes);
    res.cookies.getAll().forEach(c => rewriteRes.cookies.set(c));

    return rewriteRes;
  }

  // Protect dashboard/settings
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/settings'))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in from auth pages
  if (user && (path === '/login' || path === '/signup')) {
    const redirectTo = req.nextUrl.searchParams.get('redirectTo') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  // Pass subdomain header
  if (subdomain) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-subdomain', subdomain);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Ensure cookies are shared on all responses
  forceSharedCookies(res);
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};