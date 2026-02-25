import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. Initial Supabase Response Setup
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Refresh the session (important for Auth)
  await supabase.auth.getUser();

  // 3. SUBDOMAIN ROUTING LOGIC
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";
  
  const isMainDomain = hostname === "matthorg.com" || hostname === "localhost:3000";

  // 4. Handle API routes first - let them pass through
  if (url.pathname.startsWith('/api')) {
    return supabaseResponse;
  }

  // 5. Handle static files - let them pass through
  if (url.pathname.includes('.') || url.pathname.startsWith('/_next')) {
    return supabaseResponse;
  }

  // 6. If it's a subdomain (e.g., acme.matthorg.com)
  if (!isMainDomain) {
    
    // ✅ REWRITE EXCEPTION: Login/Signup go to the (main) folder group
    if (url.pathname === "/login" || url.pathname === "/signup") {
      url.pathname = `/(main)${url.pathname}`; // Points to app/(main)/login or /signup
      
      const rewriteResponse = NextResponse.rewrite(url);
      
      // Preserve cookies in the rewrite
      supabaseResponse.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie.name, cookie.value);
      });
      
      return rewriteResponse;
    }

    // ✅ DEFAULT: Rewrite all other subdomain traffic to the [subdomain] dynamic folder
    // Using literal "[subdomain]" so Next.js matches the folder name
    url.pathname = `/[subdomain]${url.pathname}`;
    
    const rewriteResponse = NextResponse.rewrite(url);
    
    // Preserve cookies in the rewrite
    supabaseResponse.cookies.getAll().forEach(cookie => {
      rewriteResponse.cookies.set(cookie.name, cookie.value);
    });
    
    return rewriteResponse;
  }

  // 7. Return default response for main domain
  return supabaseResponse;
}
