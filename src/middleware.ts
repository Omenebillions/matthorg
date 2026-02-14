
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// This is your root domain. Subdomains will be extracted from this.
// For local development, this might be 'localhost:3000'
// In production, it should be your actual domain like 'matthorg.com'
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'matthorg.com';

// These paths are exempt from the middleware logic
const EXCLUDED_PATHS = ['/register', '/api'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 1. Create a response object that we can work with
  // This allows us to set headers and cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Handle session updates for Supabase authentication
  // This keeps the user's session fresh
  await updateSession(request, response);

  // 3. Clone the URL and get the hostname
  const url = request.nextUrl.clone();
  const hostname = url.hostname;
  
  // 4. Check for and exclude static files, images, etc.
  // This regex matches for file extensions and avoids rewriting them.
  if (/\.(.*)$/.test(pathname)) {
    return response; // Serve the file directly
  }

  // 5. Check if the path is one of the hardcoded excluded paths
  if (EXCLUDED_PATHS.some(p => pathname.startsWith(p))) {
      return response; // Let the request pass through unmodified
  }

  // 6. Determine the effective domain and extract the subdomain
  // This handles both production domains and Vercel preview URLs
  const effectiveHost = host.replace(`.${ROOT_DOMAIN}`, '');
  const isSubdomainRequest = effectiveHost !== host;

  // 7. Rewrite the URL based on the subdomain
  if (isSubdomainRequest && effectiveHost !== 'www') {
    // It's a valid subdomain request
    console.log(`Rewriting URL for subdomain: ${effectiveHost}. New path: /${effectiveHost}${pathname}`);
    url.pathname = `/${effectiveHost}${pathname}`;
    return NextResponse.rewrite(url, response);
  }

  // 8. If it's the root domain, let it pass through to the main site
  // This serves the marketing page, /login, /register, etc.
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
