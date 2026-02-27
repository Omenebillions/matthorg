"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

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
    const fetchBranding = async () => {
      // Check if we are on a subdomain to show the logo
      const host = window.location.hostname;
      let sub = null;

      if (!host.includes("localhost") && host.endsWith(".mthorg.com")) {
        sub = host.replace(".mthorg.com", "").replace("www.", "");
      }

      if (sub) {
        const { data } = await supabase
          .from("organizations")
          .select("name, logo_url")
          .eq("subdomain", sub)
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

    fetchBranding();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setError("");

    try {
      // 1. Auth via Edge Function
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
      if (!response.ok) throw new Error(result.error || "Login failed");

      // 2. Set Session
      const sessionData = result.session || result;
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
      });

      if (sessionError) throw sessionError;

      // 3. THE WIN: Send everyone to the universal stable dashboard
      router.push("/dashboard");
      router.refresh(); 

    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setAuthenticating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white">
        <div className="text-center mb-8">
          <Image src={branding.logo} alt="Logo" width={80} height={80} className="mx-auto rounded-xl object-contain" />
          <h1 className="text-2xl font-bold mt-4">Sign in to {branding.name}</h1>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email Address"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={authenticating}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400"
          >
            {authenticating ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}