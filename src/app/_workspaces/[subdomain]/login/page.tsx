import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function BrandedLoginPage({ params }: { params: { subdomain: string } }) {
  const supabase = await createClient();

  // Fetch organization based on subdomain
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('name, logo_url, brand_color, slug')
    .eq('subdomain', params.subdomain)
    .single();

  if (orgError || !organization) {
    notFound();
  }

  // Get brand color or default to blue
  const brandColor = organization.brand_color || 'blue';
  const brandColorClass = `text-${brandColor}-600`;
  const brandBgClass = `bg-${brandColor}-600`;
  const brandHoverClass = `hover:bg-${brandColor}-700`;

  const handleSignIn = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect(`/${params.subdomain}/login?error=Invalid credentials`);
    }

    return redirect('/dashboard'); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">MatthOrg</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            {/* Organization Branding */}
            <div className="text-center mb-8">
              {organization.logo_url && (
                <div className="mb-4">
                  <div className="w-20 h-20 mx-auto rounded-xl border border-gray-200 overflow-hidden bg-white p-2 shadow-sm">
                    <Image 
                      src={organization.logo_url} 
                      alt={`${organization.name} Logo`} 
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to {organization.name}
              </h1>
              <p className="text-gray-500 text-sm">
                Sign in to continue to your workspace
              </p>
            </div>

            <form className="space-y-5" action={handleSignIn}>
              {/* Error Message from URL */}
              {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('error') && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">
                    {new URLSearchParams(window.location.search).get('error')}
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  required 
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  required 
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link 
                    href={`/${params.subdomain}/forgot-password`}
                    className={`font-medium ${brandColorClass} hover:${brandColorClass}/80`}
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div className="mt-6">
                <button 
                  type="submit"
                  className={`w-full py-2.5 px-4 ${brandBgClass} hover:${brandHoverClass} text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${brandColor}-500 transition-colors`}
                >
                  Sign In
                </button>
              </div>
            </form>

            {/* Powered by link */}
            <p className="mt-6 text-center text-xs text-gray-400">
              Secure workspace powered by{' '}
              <Link 
                href="https://matthorg.com" 
                className="font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                MatthOrg
              </Link>
            </p>
          </div>

          {/* Back to main site link */}
          <div className="mt-4 text-center">
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to MatthOrg
            </Link>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} MatthOrg, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}