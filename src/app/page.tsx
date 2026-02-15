"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ 
      backgroundColor: "#FFFFFF", 
      minHeight: "100vh", 
      color: "#111827", 
      fontFamily: "Inter, system-ui, sans-serif",
      position: "relative",
      overflowX: "hidden"
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

      {/* Navigation */}
      <nav style={{ 
        position: "fixed", top: 0, width: "100%", zIndex: 50, 
        backgroundColor: "rgba(255, 255, 255, 0.8)", 
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f3f4f6" 
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}>
            <img src="/logo.png" alt="MatthOrg Logo" style={{ height: "32px", width: "auto" }} />
            <span style={{ fontSize: "1.2rem", fontWeight: "800", letterSpacing: "-0.5px" }}>MatthOrg</span>
          </Link>
          
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link href="/login" style={{ textDecoration: "none", color: "#4b5563", fontSize: "14px", fontWeight: "600", transition: "color 0.2s" }}>
              Sign in
            </Link>
            <Link href="/signup" style={{ textDecoration: "none" }}>
              <button style={{ 
                backgroundColor: "#111827", color: "white", padding: "10px 24px", 
                borderRadius: "8px", fontWeight: "600", border: "none", cursor: "pointer",
                transition: "transform 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: "180px", paddingBottom: "100px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px" }}>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              display: "inline-flex", padding: "6px 16px", borderRadius: "100px", 
              backgroundColor: "#f3f4f6", color: "#374151", fontSize: "13px", fontWeight: "600", marginBottom: "32px",
              border: "1px solid #e5e7eb"
            }}>
            ✨ The new standard for business operations
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", fontWeight: "900", lineHeight: "1.1", marginBottom: "24px", letterSpacing: "-0.04em" }}
          >
            The intelligence portal <br />
            <span style={{ 
              background: "linear-gradient(90deg, #3b82f6, #2563eb)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent" 
            }}>built for scale.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{ fontSize: "1.25rem", color: "#4b5563", maxWidth: "600px", margin: "0 auto 48px", lineHeight: "1.6" }}
          >
            Unified workflows, financials, and team management in one clean, professional environment for modern enterprises.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link href="/signup">
              <button style={{ 
                padding: "18px 36px", fontSize: "1rem", fontWeight: "700", borderRadius: "12px",
                backgroundColor: "#3b82f6", color: "white", border: "none", cursor: "pointer",
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
                transition: "all 0.2s"
              }}>
                Start your workspace
              </button>
            </Link>
            <button style={{ 
              padding: "18px 36px", fontSize: "1rem", fontWeight: "700", borderRadius: "12px",
              backgroundColor: "white", color: "#111827", border: "1px solid #e5e7eb", cursor: "pointer"
            }}>
              Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 120px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {[
            { title: "Financials", desc: "Automated revenue tracking and predictive analysis.", icon: "💰" },
            { title: "Workflows", desc: "Drag-and-drop automation for complex logic.", icon: "⚙️" },
            { title: "Clock-In", desc: "Location-aware attendance and HR tracking.", icon: "📍" },
            { title: "Task Manager", desc: "Enterprise project management at lightning speed.", icon: "📅" }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)" }}
              style={{ 
                padding: "40px", borderRadius: "24px", backgroundColor: "#FFFFFF",
                border: "1px solid #f3f4f6", transition: "all 0.3s ease"
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "20px" }}>{item.icon}</div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "12px", letterSpacing: "-0.02em" }}>{item.title}</h3>
              <p style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: "1.6" }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Minimal Footer */}
      <footer style={{ 
        textAlign: "center", padding: "60px", backgroundColor: "#f9fafb", 
        borderTop: "1px solid #f3f4f6", color: "#9ca3af", fontSize: "14px" 
      }}>
        <div style={{ marginBottom: "20px" }}>
          <img src="/logo.png" alt="Logo" style={{ height: "24px", filter: "grayscale(1)", opacity: 0.5 }} />
        </div>
        <p>&copy; 2026 MatthOrg, Inc. All rights reserved.</p>
        <div style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "20px" }}>
          <Link href="#" style={{ color: "inherit", textDecoration: "none" }}>Privacy</Link>
          <Link href="#" style={{ color: "inherit", textDecoration: "none" }}>Terms</Link>
          <Link href="#" style={{ color: "inherit", textDecoration: "none" }}>Contact</Link>
        </div>
      </footer>
    </div>
  );
}