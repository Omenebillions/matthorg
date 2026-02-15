
import Link from 'next/link';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default function Signup({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const signUp = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const organizationName = formData.get('organization_name') as string;
    const supabase = createClient();

    // Sign up the new user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return redirect(`/signup?message=${signUpError.message}`);
    }

    if (!user) {
        return redirect('/signup?message=Could not create user');
    }

    // Create the new organization
    const { data: newOrg, error: newOrgError } = await supabase
      .from('organizations')
      .insert([{ name: organizationName }])
      .select('id')
      .single();

    if (newOrgError || !newOrg) {
      return redirect(`/signup?message=Could not create organization: ${newOrgError?.message}`);
    }

    // Use the admin client to update user metadata with the owner role and org ID
    const { error: adminError } = await supabase.auth.admin.updateUserById(
      user.id,
      { app_metadata: { 'organization_id': newOrg.id, 'role': 'owner' } }
    );

    if (adminError) {
      return redirect(`/signup?message=Could not assign admin role: ${adminError.message}`);
    }
    
    // Also, create a public profile for the user
    const { error: profileError } = await supabase.from('profiles').insert([
        { id: user.id, organization_id: newOrg.id, email: user.email },
    ]);

    if (profileError) {
        return redirect(`/signup?message=Could not create user profile: ${profileError.message}`);
    }

    // Redirect to login with a success message, prompting them to log in.
    return redirect('/login?message=Account created successfully! Please log in to continue.');
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{' '}
        Back
      </Link>

      <div className="flex-1 flex flex-col w-full justify-center gap-2 animate-in text-foreground">
        <div className="text-center mb-4">
            <h1 className="text-3xl font-bold">Create Your Organization</h1>
            <p className="text-gray-600">Sign up to get started and become the owner of your organization.</p>
        </div>
        <form
            className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
            action={signUp}
        >
            <label className="text-md" htmlFor="organization_name">
            Organization Name
            </label>
            <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="organization_name"
            placeholder="Your Company Inc."
            required
            />
            <label className="text-md" htmlFor="email">
            Email
            </label>
            <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            />
            <label className="text-md" htmlFor="password">
            Password
            </label>
            <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            />
            <button className="bg-blue-600 rounded-md px-4 py-2 text-white mb-2">
            Sign Up
            </button>
            <Link href="/login" className="border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2 text-center">
                Already have an account? Sign In
            </Link>
            {searchParams?.message && (
            <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
                {searchParams.message}
            </p>
            )}
        </form>
      </div>
    </div>
  );
}
