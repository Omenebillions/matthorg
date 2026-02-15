"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SignupPage() {
  const [company, setCompany] = useState("");

  // Clean company name for the wildcard preview
  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, "") || "your-org";

  return (
    <div style={{ 
      backgroundColor: "#FFFFFF", 
      minHeight: "100vh", 
      color: "#111827", 
      fontFamily: "Inter, system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      position: "relative"
    }}>
      {/* Webflow Dot Grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
        maskImage: "linear-gradient(to bottom, white, transparent)",
        zIndex: 0,
        pointerEvents: "none"
      }} />

      <nav style={{ padding: "32px", position: "relative", zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit" }}>
          <img src="/logo.png" alt="Logo" style={{ height: "28px" }} />
          <span style={{ fontWeight: "800", fontSize: "1.1rem" }}>MatthOrg</span>
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
            <h1 style={{ fontSize: "2rem", fontWeight: "900", letterSpacing: "-0.04em", marginBottom: "8px" }}>
              Create your Workspace
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
              Set up your dedicated enterprise environment.
            </p>
          </div>

          <form style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* COMPANY NAME & WILDCARD PREVIEW */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#374151" }}>Company Name</label>
              <input 
                type="text" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #e5e7eb", outline: "none", fontSize: "15px" }} 
              />
              <div style={{ 
                marginTop: "8px", padding: "8px 12px", borderRadius: "8px", 
                backgroundColor: "#f8fafc", border: "1px dashed #e2e8f0",
                fontSize: "12px", color: "#64748b", fontWeight: "500"
              }}>
                Your URL: <span style={{ color: "#3b82f6" }}>{slug}.matthorg.com</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>First Name</label>
                <input type="text" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Last Name</label>
                <input type="text" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Work Email</label>
              <input type="email" style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #e5e7eb" }} />
            </div>

            <button style={{ 
              marginTop: "10px", padding: "16px", borderRadius: "12px", border: "none", 
              backgroundColor: "#111827", color: "white", fontWeight: "700", cursor: "pointer"
            }}>
              Launch Workspace
            </button>
          </form>
        </motion.div>
      </main>

      <footer style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
        "Pause for the day" — your intelligence portal awaits.
      </footer>
    </div>
  );
}