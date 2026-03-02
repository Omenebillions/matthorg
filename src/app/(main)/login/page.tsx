// /home/user/matthorg/src/app/(main)/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState("");
  const [branding, setBranding] = useState({
    logo: "/logo.png",      // Default logo
    name: "MatthOrg",       // Default name
  });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Detect subdomain and fetch branding on page load
  useEffect(() => {
    const loadBranding = async () => {
      const host = window.location.hostname;
      let subdomain = null;

      // Check if we're on a subdomain (e.g., tidy.mthorg.com)
      if (host.endsWith(".mthorg.com") && host !== "mthorg.com" && host !== "www.mthorg.com") {
        subdomain = host.replace(".mthorg.com", "");
      }

      // If on localhost, check for ?subdomain= param for testing
      if (host === "localhost" || host === "127.0.0.1") {
        const params = new URLSearchParams(window.location.search);
        subdomain = params.get("subdomain");
      }

      // Fetch organization details if we have a subdomain
      if (subdomain) {
        const { data } = await supabase
          .from("organizations")
          .select("name, logo_url")
          .eq("subdomain", subdomain)
          .maybeSingle();

        if (data) {
          setBranding({
            logo: data.logo_url || "/logo.png",
            name: data.name,
          });
        }
      }

      setLoading(false);
    };

    loadBranding();
  }, [supabase]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  // Handle login submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setError("");

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Successful login - redirect to dashboard
      router.push("/dashboard");
      router.refresh();

    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setAuthenticating(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-xl mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src={branding.logo}
              alt={`${branding.name} logo`}
              width={80}
              height={80}
              className="rounded-xl shadow-md object-contain"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.src = "/logo.png";
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sign in to {branding.name}
          </h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={authenticating}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {authenticating ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Forgot password link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* Sign up link */}
        <p className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline font-medium">
            Sign up
          </a>
        </p>
      </motion.div>
    </div>
  );
}