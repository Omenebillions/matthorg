
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function HomePage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold">
          <span className="text-blue-600">Matth</span><span className="text-gray-800">Org</span>
        </div>
        <nav>
          {user ? (
            <Link href="/dashboard" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Login
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gray-50">
          <div className="container mx-auto px-6 py-20 text-center">
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
              The All-In-One Platform to <span className="text-blue-600">Run Your Business</span>
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Centralize staff, tasks, sales, and projects. Streamline your operations and boost productivity.
            </p>
            <div className="mt-8">
              <Link href={user ? "/dashboard" : "/login"} className="px-10 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800">Everything you need, in one place</h2>
            <p className="text-lg text-gray-600 mt-2">Focus on your business, we'll handle the rest.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-blue-500 mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A6.995 6.995 0 005.02 9.02" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Staff Management</h3>
              <p className="text-gray-600">Easily manage your team, assign roles, and track performance all from one dashboard.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-blue-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Tasks & Projects</h3>
              <p className="text-gray-600">Create, assign, and track tasks and projects with real-time progress updates.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-blue-500 mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Sales & Revenue</h3>
              <p className="text-gray-600">Monitor your sales, track revenue, and get insights into your financial performance.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="text-lg font-bold">
              <span className="text-blue-400">MattH</span><span className="text-gray-200">org</span>
            </div>
            <p className="text-gray-400">&copy; {new Date().getFullYear()} MatthOrg. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
