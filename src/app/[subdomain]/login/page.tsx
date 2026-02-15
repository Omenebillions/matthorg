
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function BrandedLoginPage({ params }: { params: { subdomain: string } }) {
  const supabase = await createClient();

  // Fetch organization based on subdomain
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('name, logo_url')
    .eq('subdomain', params.subdomain)
    .single();

  if (orgError || !organization) {
    // You can create a specific [subdomain]/not-found page
    // or redirect to a generic not-found page
    notFound();
  }

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

    // On successful login, the middleware will handle redirecting to the dashboard
    // for now, we'll just refresh the page.
    return redirect('/dashboard'); 
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          {organization.logo_url && (
            <Image 
              src={organization.logo_url} 
              alt={`${organization.name} Logo`} 
              width={100}
              height={100}
              className="mx-auto mb-4 rounded-full object-cover"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-800">Welcome to {organization.name}</h1>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>

        <form className="space-y-6" action={handleSignIn}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" name="email" id="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" id="password" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Sign In</button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-500">
          Powered by <Link href="https://matthorg.com" className="font-medium text-blue-600 hover:text-blue-500">MatthOrg</Link>
        </p>
      </div>
    </div>
  );
}
