"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState("");

  const [branding, setBranding] = useState({
    logo: "/logo.png",
    name: "MatthOrg",
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const extractSubdomain = () => {
      const host = window.location.hostname;
      if (host.includes("localhost") || host.includes("127.0.0.1")) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("subdomain") || null;
      }
      if (host.endsWith(".mthorg.com")) {
        const sub = host.replace(".mthorg.com", "");
        return sub === "www" ? null : sub;
      }
      return null;
    };

    const sub = extractSubdomain();
    setSubdomain(sub);
    if (sub) {
      fetchOrganizationBranding(sub);
    } else {
      setLoading(false);
    }
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
          logo: data.logo_url || "/logo.png",
          name: data.name,
        });
      }
    } catch (err) {
      console.error("Failed to fetch branding:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setError("");

    try {
      // 1. Call Edge Function for authentication
      const response = await fetch(
        "https://hflueseqjgdfeykbqmyd.supabase.co/functions/v1/tenant-auth-proxy",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }

      // 2. Set Supabase session
      const sessionData = result.session || result;

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
      });

      if (sessionError) throw sessionError;

      // 3. Redirect logic
      if (subdomain && subdomain !== "www") {
        router.push("/dashboard");
      } else {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Explicitly join using !organization_id to resolve PGRST201 error
          // Cast to 'any' to handle the dynamic join property in TypeScript
          const { data: staff, error: staffError } = await supabase
            .from("staff_profiles")
            .select(`
              user_id,
              organizations!organization_id (
                subdomain
              )
            `)
            .eq("user_id", user.id)
            .single() as any;

          if (staffError) throw staffError;

          // Extract subdomain from the single joined object
          const targetSub = staff?.organizations?.subdomain;

          if (targetSub) {
            // Use window.location for cross-domain redirect
            window.location.href = `https://${targetSub}.mthorg.com/dashboard`;
          } else {
            router.push("/dashboard");
          }
        } else {
          throw new Error("No authenticated user after login");
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid credentials or server error");
    } finally {
      setAuthenticating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white"
      >
        <div className="text-center mb-8">
          <Image
            src={branding.logo}
            alt="Organization Logo"
            width={80}
            height={80}
            className="mx-auto rounded-xl shadow-sm object-contain"
          />
          <h1 className="text-2xl font-bold mt-4">
            {subdomain !== null
              ? `Sign in to ${branding.name}`
              : "Sign in to MatthOrg"}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={authenticating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {authenticating ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}