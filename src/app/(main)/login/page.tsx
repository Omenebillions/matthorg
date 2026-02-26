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

  // ⚡️ Fix: Branding spelling
  const [branding, setBranding] = useState({
    logo: "/logos/matthorg-logo.png",
    name: "MthOrg"
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false
  });

  useEffect(() => {
    const extractSubdomain = () => {
      const host = window.location.hostname;

      // Localhost handling
      if (host === "localhost" || host === "127.0.0.1") {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("subdomain") || null;
      }

      // ⚡️ Fix: Domain spelling (mthorg.com)
      if (host.endsWith(".mthorg.com")) {
        return host.replace(".mthorg.com", "");
      }

      if (host === "mthorg.com" || host === "www.mthorg.com") return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      // ⚡️ Fix: Use user_id for staff_profiles and handle organization relation
      const { data: staff, error: staffError } = await supabase
        .from("staff_profiles")
        .select(`
          organization_id,
          organizations (
            subdomain
          )
        `)
        .eq("user_id", data.user.id)
        .single();

      if (staffError) throw staffError;

      // ✅ Fix: Correctly access the subdomain from the joined record
      const userSubdomain = (staff?.organizations as any)?.subdomain;

      if (subdomain) {
        // If already on a subdomain, just go to dashboard
        router.push("/dashboard");
      } else if (userSubdomain) {
        // If on main domain, redirect to their specific subdomain
        window.location.href = `https://${userSubdomain}.mthorg.com/dashboard`;
      } else {
        router.push("/dashboard");
      }

    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setAuthenticating(false);
    }
  };

  // ... (keeping the rest of your UI/JSX identical)
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-white">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
       {/* (Your existing JSX remains exactly the same) */}
       {/* Use branding.name and branding.logo as before */}
       <form onSubmit={handleSubmit} className="space-y-4">
          <input name="email" type="email" value={formData.email} onChange={handleChange} required className="..." />
          <input name="password" type="password" value={formData.password} onChange={handleChange} required className="..." />
          <button type="submit" disabled={authenticating} className="...">
            {authenticating ? "Signing in..." : "Sign In"}
          </button>
       </form>
    </div>
  );
}