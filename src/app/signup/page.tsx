"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
// Note: In a production app, these should be in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SignupPage() {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Real-time wildcard slug generation
  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, "") || "your-org";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Check if the workspace slug is already taken
      // Requires a 'workspaces' table with a 'slug' column
      const { data: existingWorkspace, error: checkError } = await supabase
        .from('workspaces')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();

      if (existingWorkspace) {
        setMessage({ type: "error", text: "This company name is already registered." });
        setLoading(false);
        return;
      }

      // 2. Trigger Supabase Auth Signup
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            company_name: company,
            workspace_slug: slug,
          },
        },
      });

      if (signUpError) throw signUpError;

      setMessage({ 
        type: "success", 
        text: "Success! Please check your email to confirm and activate your workspace." 
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      backgroundColor: "#FFFFFF", 
      minHeight: "100vh", 
      color: "#111827", 
      fontFamily: "Inter, system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Webflow Dot Grid Background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
        maskImage: "linear-gradient(to bottom, white, transparent)",
        zIndex: 0,
        pointerEvents: "none"
      }} />

      {/* Header */}
      <nav style={{ padding: "32px", position: "relative", zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit" }}>
          <img src="/logo.png" alt="Logo" style={{ height: "28px" }} />
          <span style={{ fontWeight: "900", fontSize: "1.2rem", letterSpacing: "-0.5px" }}>MatthOrg</span>
        </Link>
      </nav>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 1 }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            width: "100%", maxWidth: "480px", 
            backgroundColor: "white", padding: "48px", borderRadius: "32px", 
            border: "1px solid #f3f4f6", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontSize: "2.2rem", fontWeight: "900", letterSpacing: "-0.05em", marginBottom: "8px" }}>
              Launch Workspace
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
              Enterprise intelligence for your team.
            </p>
          </div>

          <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Company / Wildcard Section */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#374151" }}>Company Name</label>
              <input 
                required
                type="text" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #e5e7eb", outline: "none", fontSize: "15px", transition: "border-color 0.2s" }} 
              />
              <div style={{ 
                marginTop: "10px", padding: "10px 14px", borderRadius: "10px", 
                backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1",
                fontSize: "12px", color: "#475569", fontWeight: "600"
              }}>
                Portal URL: <span style={{ color: "#2563eb" }}>{slug}.matthorg.com</span>
              </div>
            </div>

            {/* Email Section */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#374151" }}>Work Email</label>
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #e5e7eb", outline: "none", fontSize: "15px" }} 
              />
            </div>

            {/* Password Section */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#374151" }}>Password</label>
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #e5e7eb", outline: "none", fontSize: "15px" }} 
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              style={{ 
                marginTop: "10px", padding: "16px", borderRadius: "12px", border: "none", 
                backgroundColor: loading ? "#94a3b8" : "#111827", color: "white", 
                fontWeight: "700", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", transition: "all 0.2s"
              }}
            >
              {loading ? "Verifying..." : "Create Workspace"}
            </button>

            {message.text && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  textAlign: "center", padding: "12px", borderRadius: "10px", fontSize: "14px", fontWeight: "500",
                  backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
                  color: message.type === "error" ? "#ef4444" : "#166534",
                  border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`
                }}
              >
                {message.text}
              </motion.div>
            )}
          </form>

          <div style={{ marginTop: "32px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              Already have an account? <Link href="/login" style={{ color: "#2563eb", fontWeight: "700", textDecoration: "none" }}>Sign in</Link>
            </p>
          </div>
        </motion.div>
      </main>

      <footer style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
        "Pause for the day" — your secure portal is ready when you are.
      </footer>
    </div>
  );
}