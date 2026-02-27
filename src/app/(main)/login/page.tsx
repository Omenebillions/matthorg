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
    logo: "/logo.png",
    name: "MatthOrg"
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false
  });

  useEffect(() => {
    const extractSubdomain = () => {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("subdomain") || null;
      }
      if (host.endsWith(".mthorg.com")) return host.replace(".mthorg.com", "");
      return null;
    };

    const sub = extractSubdomain();
    setSubdomain(sub);
    if (sub && sub !== "www") fetchOrganizationBranding(sub);
    else setLoading(false);
  }, []);

  const fetchOrganizationBranding = async (sub: string) => {
    try {
      const { data } = await supabase.from("organizations").select("name, logo_url").eq("subdomain", sub).single();
      if (data) setBranding({ logo: data.logo_url || "/logo.png", name: data.name });
    } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError("");
  };

  // --- THE NEW LOGIN HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setError("");

    try {
      // 1. CALL THE EDGE FUNCTION PROXY
      const response = await fetch('https://hflueseqjgdfeykbqmyd.supabase.co/functions/v1/tenant-auth-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login failed");

      // 2. LOGIC FOR REDIRECTION
      if (subdomain && subdomain !== "www") {
        // We are already on a subdomain, just go to dashboard
        router.push("/dashboard");
      } else {
        // We are on www, we need to find the user's subdomain to move them
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: staff } = await supabase
            .from("staff_profiles")
            .select("organizations(subdomain)")
            .eq("id", user.id)
            .single();

          const targetSub = staff?.organizations?.[0]?.subdomain;
          if (targetSub) {
            window.location.href = `https://${targetSub}.mthorg.com/dashboard`;
          } else {
            router.push("/dashboard");
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setAuthenticating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-white">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white">
        <div className="text-center mb-8">
          <Image src={branding.logo} alt="Logo" width={80} height={80} className="mx-auto rounded-xl shadow-md" />
          <h1 className="text-2xl font-bold mt-4">{subdomain ? `Sign in to ${branding.name}` : "Sign in to MatthOrg"}</h1>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="email" type="email" placeholder="Email" required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
          <input name="password" type="password" placeholder="Password" required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
          <button type="submit" disabled={authenticating} className="w-full py-2 bg-blue-600 text-white rounded-lg">
            {authenticating ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}