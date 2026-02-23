"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Simulate logo preload
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500); // 1.5s preload
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <motion.img
          src="/logo.png"
          alt="MatthOrg Logo"
          className="h-20 w-auto"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden font-sans bg-white text-gray-900 min-h-screen">
      
      {/* Animated Dot Grid Background */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
        animate={{ backgroundPosition: ["0 0", "32px 32px"] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 h-20">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="MatthOrg Logo" className="h-8 w-auto" />
            <span className="font-extrabold text-lg tracking-tight">MatthOrg</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="text-gray-600 font-semibold hover:text-gray-900 transition">
              Sign in
            </Link>
            <Link href="/signup">
              <button className="bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-transform">
                Get Started
              </button>
            </Link>
          </div>

          {/* Hamburger Menu */}
          <button className="md:hidden z-50" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="w-6 h-0.5 bg-gray-900 mb-1 transition-transform" style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <div className="w-6 h-0.5 bg-gray-900 mb-1 transition-opacity" style={{ opacity: menuOpen ? 0 : 1 }} />
            <div className="w-6 h-0.5 bg-gray-900 transition-transform" style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="md:hidden bg-white w-full absolute top-20 left-0 shadow-md flex flex-col gap-4 p-6 border-t border-gray-200"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Link href="/login" className="text-gray-700 font-semibold py-2 border-b border-gray-100">
                Sign in
              </Link>
              <Link href="/signup">
                <button className="w-full bg-gray-900 text-white py-2 rounded-lg font-semibold">
                  Get Started
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 text-center relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex px-4 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold mb-6 border border-gray-200"
        >
          ✨ The new standard for business operations
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6"
        >
          The intelligence portal <br />
          <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            built for scale.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="max-w-xl mx-auto text-gray-600 text-lg mb-12 leading-relaxed"
        >
          Unified workflows, financials, and team management in one clean, professional environment for modern enterprises.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link href="/signup">
            <button className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
              Start your workspace
            </button>
          </Link>
          <button className="px-10 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold hover:shadow-md transition-all">
            Watch Demo
          </button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: "Financials", desc: "Automated revenue tracking and predictive analysis.", icon: "💰" },
          { title: "Workflows", desc: "Drag-and-drop automation for complex logic.", icon: "⚙️" },
          { title: "Clock-In", desc: "Location-aware attendance and HR tracking.", icon: "📍" },
          { title: "Task Manager", desc: "Enterprise project management at lightning speed.", icon: "📅" }
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)" }}
            className="bg-white p-10 rounded-3xl border border-gray-200 transition-all"
          >
            <div className="text-4xl mb-5">{item.icon}</div>
            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
            <p className="text-gray-500 text-sm">{item.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center py-16 bg-gray-50 border-t border-gray-200 text-gray-400 text-sm px-6">
        <div className="mb-4">
          <img src="/logo.png" alt="Logo" className="h-6 w-auto mx-auto opacity-50 filter grayscale" />
        </div>
        <p>&copy; 2026 MatthOrg, Inc. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="#" className="hover:text-gray-600">Privacy</Link>
          <Link href="#" className="hover:text-gray-600">Terms</Link>
          <Link href="#" className="hover:text-gray-600">Contact</Link>
        </div>
      </footer>
    </div>
  );
}