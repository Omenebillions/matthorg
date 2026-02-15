"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ProfessionalHome() {
  return (
    <div style={{ backgroundColor: "#050505", minHeight: "100vh", color: "white", fontFamily: "sans-serif" }}>
      {/* Navigation */}
      <nav style={{ 
        position: "fixed", top: 0, width: "100%", zIndex: 50, 
        backgroundColor: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)" 
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", height: "80px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              width: "35px", height: "35px", borderRadius: "8px", 
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" 
            }}>M</div>
            <span style={{ fontSize: "1.25rem", fontWeight: "bold", letterSpacing: "-0.5px" }}>MatthOrg</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>Sign in</button>
            <button style={{ 
              backgroundColor: "white", color: "black", padding: "10px 20px", 
              borderRadius: "20px", fontWeight: "600", border: "none", cursor: "pointer" 
            }}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: "160px", paddingBottom: "80px", textAlign: "center", position: "relative" }}>
        {/* Subtle Background Glow */}
        <div style={{ 
          position: "absolute", top: "0", left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "400px", backgroundColor: "rgba(59, 130, 246, 0.1)",
          filter: "blur(100px)", borderRadius: "100%", zIndex: 0
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", padding: "0 20px" }}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              display: "inline-block", padding: "5px 15px", borderRadius: "20px", 
              backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)",
              color: "#60a5fa", fontSize: "12px", fontWeight: "bold", marginBottom: "20px"
            }}>
            ENTERPRISE INTELLIGENCE PORTAL
          </motion.div>

          <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", fontWeight: "800", lineHeight: "1.1", marginBottom: "20px" }}>
            The Operating System for <br />
            <span style={{ color: "#60a5fa" }}>Modern Business</span>
          </h1>

          <p style={{ fontSize: "1.25rem", color: "#9ca3af", maxWidth: "700px", margin: "0 auto 40px", lineHeight: "1.6" }}>
            A unified portal to orchestrate your workflow, financials, and talent management 
            in one secure, professional environment.
          </p>

          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ 
              padding: "15px 40px", fontSize: "1rem", fontWeight: "bold", borderRadius: "10px",
              backgroundColor: "#2563eb", color: "white", border: "none", cursor: "pointer",
              boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)"
            }}>Start Free Trial</button>
            <button style={{ 
              padding: "15px 40px", fontSize: "1rem", fontWeight: "bold", borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer"
            }}>Watch Demo</button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
          {[
            { title: "Unified Operations", desc: "Orchestrate workflows across all departments with intelligent automation.", color: "#3b82f6" },
            { title: "Financial Intelligence", desc: "Real-time revenue tracking and automated financial reporting.", color: "#8b5cf6" },
            { title: "Talent Management", desc: "Complete HR lifecycle management from recruitment to payroll.", color: "#10b981" }
          ].map((feature, i) => (
            <div key={i} style={{ 
              padding: "40px", borderRadius: "20px", backgroundColor: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <div style={{ width: "40px", height: "5px", backgroundColor: feature.color, marginBottom: "20px", borderRadius: "10px" }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "15px" }}>{feature.title}</h3>
              <p style={{ color: "#9ca3af", lineHeight: "1.6" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "40px", borderTop: "1px solid rgba(255,255,255,0.05)", color: "#4b5563", fontSize: "14px" }}>
        &copy; 2026 MatthOrg, Inc. All rights reserved.
      </footer>
    </div>
  );
}