"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const [branding, setBranding] = useState({
    logo: "/logos/matthorg-logo.png",
    name: "MatthOrg"
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false
  });

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  useEffect(() => {
    const extractSubdomain = () => {
      const host = window.location.hostname;

      // Localhost handling
      if (host === "localhost" || host === "127.0.0.1") {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("subdomain") || null;
      }

      if (host.endsWith(".matthorg.com")) {
        return host.replace(".matthorg.com", "");
      }

      if (host === "matthorg.com" || host === "www.matthorg.com") return null;

      return null;
    };

    const sub = extractSubdomain();
    setSubdomain(sub);

    if (sub && sub !== "www") fetchOrganizationBranding(sub);
    else setLoading(false);
  }, []);

  const fetchOrganizationBranding = async (sub: string) => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("name, logo_url")
        .eq("subdomain", sub)
        .single();

      if (error) throw error;

      if (data) {
        setBranding({
          logo: data.logo_url || "/logos/matthorg-logo.png",
          name: data.name
        });
      }
    } catch (err) {
      console.error("Failed to fetch branding:", err);
      // fallback to default branding
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError("");
    setResetSuccess(false);
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email first");
      return;
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (!error) {
      setResetSuccess(true);
      setError("");
    } else {
      setError(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setError("");
    setResetSuccess(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      // Handle "remember me" - extend session
      if (formData.remember) {
        await supabase.auth.updateUser({
          data: { remember_me: true }
        });
      }

      // Redirect logic
      if (subdomain && subdomain !== "www") router.push("/dashboard");
      else {
        const { data: staff } = await supabase
          .from("staff_profiles")
          .select("organizations(subdomain)")
          .eq("id", data.user.id)
          .single();

        // ✅ Fix: organizations is an array, take first element
        const userSubdomain = staff?.organizations?.[0]?.subdomain;
        if (userSubdomain)
          window.location.href = `https://${userSubdomain}.matthorg.com/dashboard`;
        else router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleDemoAccess = () => {
    if (subdomain && subdomain !== "www") {
      setFormData({
        email: `demo@${subdomain}.com`,
        password: "demo123",
        remember: false
      });
    } else {
      setFormData({
        email: "demo@matthorg.com",
        password: "demo123",
        remember: false
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-pulse">
          <div className="w-32 h-32 bg-gray-200 rounded-2xl mb-4"></div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src={branding.logo}
              alt={`${branding.name} Logo`}
              width={80}
              height={80}
              className="rounded-xl shadow-md"
              onError={(e) => (e.currentTarget.src = "/logos/matthorg-logo.png")}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {subdomain && subdomain !== "www"
              ? `Sign in to ${branding.name}`
              : "Sign in to MatthOrg"}
          </h1>
          {subdomain && subdomain !== "www" && (
            <p className="text-sm text-gray-500 mt-1">{subdomain}.matthorg.com</p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          {resetSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm"
            >
              Password reset email sent! Check your inbox.
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="name@company.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:underline focus:outline-none"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={authenticating}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 hover:bg-blue-700 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {authenticating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : "Sign In"}
          </button>
        </form>

        {subdomain && subdomain !== "www" && (
          <div className="mt-4 text-center">
            <button
              onClick={handleDemoAccess}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Having trouble? Try demo credentials
            </button>
          </div>
        )}

        {!subdomain || subdomain === "www" ? (
          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-blue-600 hover:underline"
            >
              Start your free trial
            </a>
          </p>
        ) : (
          <p className="mt-8 text-center text-xs text-gray-400">
            Secure login powered by MatthOrg
          </p>
        )}
      </motion.div>
    </div>
  );
}