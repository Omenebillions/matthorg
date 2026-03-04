'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRightIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

// Counter component
const Counter = ({ end, duration = 2.5 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const endVal = end;
    const increment = endVal / (duration * 60); // ~60fps
    const timer = setInterval(() => {
      start += increment;
      setCount(Math.min(Math.floor(start), endVal));
      if (start >= endVal) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count.toLocaleString()}+</span>;
};

// Testimonial data
const testimonials = [
  {
    quote: "MatthOrg transformed how we manage our construction projects. We've cut administrative time by 60%.",
    author: "Sarah Chen",
    role: "CEO, BuildRight Construction",
    avatar: "/avatars/woman-1.jpg",
    rating: 5,
  },
  {
    quote: "The inventory and sales tracking alone paid for itself in the first month. Incredible ROI.",
    author: "Michael Okafor",
    role: "Owner, Lagos Fresh Market",
    avatar: "/avatars/man-1.jpg",
    rating: 5,
  },
  {
    quote: "Finally, a system that understands dog breeding businesses. The litter tracking is genius.",
    author: "Dr. Emily Watson",
    role: "Director, Pawsome Kennels",
    avatar: "/avatars/woman-2.jpg",
    rating: 5,
  },
];

// Feature data
const features = [
  {
    title: "Financials",
    description: "Automated revenue tracking, expense management, and predictive analytics.",
    icon: ChartBarIcon,
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Workflows",
    description: "Drag-and-drop automation builder with conditional logic and approvals.",
    icon: ClockIcon,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Clock-In",
    description: "Location-aware attendance with geofencing and biometric options.",
    icon: ShieldCheckIcon,
    color: "from-purple-500 to-pink-600",
  },
  {
    title: "Task Manager",
    description: "Enterprise-grade project management with Gantt charts and dependencies.",
    icon: CheckCircleIcon,
    color: "from-amber-500 to-orange-600",
  },
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative overflow-x-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <Image 
                  src="/logo.png" 
                  alt="MatthOrg" 
                  width={40} 
                  height={40} 
                  className="rounded-xl"
                />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                MatthOrg
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-10">
              <Link href="/features" className="text-gray-700 hover:text-gray-900 font-medium transition">
                Features
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 font-medium transition">
                Pricing
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium transition">
                About
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium transition">
                Sign in
              </Link>
              <Link href="/signup">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="sr-only">Open menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t"
            >
              <div className="px-6 py-8 space-y-6">
                <Link href="/features" className="block text-lg font-medium text-gray-900 hover:text-blue-600" onClick={() => setMenuOpen(false)}>
                  Features
                </Link>
                <Link href="/pricing" className="block text-lg font-medium text-gray-900 hover:text-blue-600" onClick={() => setMenuOpen(false)}>
                  Pricing
                </Link>
                <Link href="/about" className="block text-lg font-medium text-gray-900 hover:text-blue-600" onClick={() => setMenuOpen(false)}>
                  About
                </Link>
                <Link href="/login" className="block text-lg font-medium text-gray-900 hover:text-blue-600" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)}>
                  <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold">
                    Get Started
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold mb-8"
              >
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                Trusted by 5,000+ businesses worldwide
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-8"
              >
                The all-in-one platform
                <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  built for growing businesses
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl"
              >
                Unified workflows, financials, inventory, team management, and AI-powered insights — all in one clean system.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-5"
              >
                <Link href="/signup">
                  <button className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 flex items-center gap-3">
                    Start Your Free Trial
                    <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>

                <button className="px-10 py-5 bg-white border-2 border-gray-300 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all">
                  Watch Demo
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-3 gap-8 mt-16"
              >
                <div>
                  <p className="text-4xl md:text-5xl font-bold text-gray-900">
                    <Counter end={5000} />
                  </p>
                  <p className="text-gray-600 mt-2">Active Users</p>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl font-bold text-gray-900">
                    <Counter end={100} />M
                  </p>
                  <p className="text-gray-600 mt-2">Transactions Processed</p>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl font-bold text-gray-900">99.9%</p>
                  <p className="text-gray-600 mt-2">Uptime</p>
                </div>
              </motion.div>
            </div>

            {/* Right - Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
                <Image
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  alt="Dashboard Preview"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-8 right-8 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-gray-100"
                >
                  <p className="text-sm font-semibold text-green-600">+42% revenue this month</p>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 5, delay: 1, ease: "easeInOut" }}
                  className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-gray-100"
                >
                  <p className="text-sm font-semibold text-blue-600">128 tasks completed today</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything your business needs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools built for scale — from startups to growing enterprises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Loved by business owners
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of companies scaling smarter with MatthOrg
            </p>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-3xl p-10 md:p-12 shadow-xl border border-gray-100"
              >
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[current].rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-3xl">★</span>
                  ))}
                </div>

                <p className="text-2xl md:text-3xl text-gray-800 font-medium text-center italic mb-10">
                  "{testimonials[current].quote}"
                </p>

                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {testimonials[current].avatar}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xl text-gray-900">{testimonials[current].author}</p>
                    <p className="text-gray-600">{testimonials[current].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex justify-center gap-3 mt-10">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i === current 
                      ? 'bg-blue-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold mb-8"
          >
            Ready to transform your business?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl opacity-90 mb-12 max-w-3xl mx-auto"
          >
            Join thousands of growing companies using MatthOrg to scale smarter.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <Link href="/signup">
              <button className="px-10 py-6 bg-white text-blue-700 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all">
                Start Free Trial →
              </button>
            </Link>
            <button className="px-10 py-6 bg-transparent border-2 border-white rounded-2xl font-bold text-xl hover:bg-white/10 transition-all">
              Contact Sales
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 text-lg opacity-80"
          >
            No credit card required • 14-day free trial
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Image src="/logo.png" alt="MatthOrg" width={40} height={40} className="rounded-xl" />
                <span className="text-2xl font-bold text-white">MatthOrg</span>
              </div>
              <p className="text-gray-400">
                The intelligence portal for modern businesses.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link href="/features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition">Integrations</Link></li>
                <li><Link href="/changelog" className="hover:text-white transition">Changelog</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link href="/about" className="hover:text-white transition">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition">Careers</Link></li>
                <li><Link href="/press" className="hover:text-white transition">Press</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white transition">Security</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p>© 2026 MatthOrg, Inc. All rights reserved.</p>
            <div className="flex gap-8 mt-6 md:mt-0">
              <Link href="#" className="hover:text-white transition">Twitter</Link>
              <Link href="#" className="hover:text-white transition">LinkedIn</Link>
              <Link href="#" className="hover:text-white transition">GitHub</Link>
              <Link href="#" className="hover:text-white transition">YouTube</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}