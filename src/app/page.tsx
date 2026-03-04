"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// Stats counter component
const Counter = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count.toLocaleString()}+</span>;
};

// Testimonial carousel
const TestimonialCarousel = () => {
  const testimonials = [
    {
      quote: "MatthOrg transformed how we manage our construction projects. We've cut administrative time by 60%.",
      author: "Sarah Chen",
      role: "CEO, BuildRight Construction",
      avatar: "👩‍💼",
      rating: 5
    },
    {
      quote: "The inventory and sales tracking alone paid for itself in the first month. Incredible ROI.",
      author: "Michael Okafor",
      role: "Owner, Lagos Fresh Market",
      avatar: "👨‍💼",
      rating: 5
    },
    {
      quote: "Finally, a system that understands dog breeding businesses. The litter tracking is genius.",
      author: "Dr. Emily Watson",
      role: "Director, Pawsome Kennels",
      avatar: "👩‍⚕️",
      rating: 5
    }
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="relative h-64 md:h-48">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute inset-0"
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex mb-2">
              {[...Array(testimonials[current].rating)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-xl">★</span>
              ))}
            </div>
            <p className="text-lg text-gray-700 italic mb-4">"{testimonials[current].quote}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
                {testimonials[current].avatar}
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{testimonials[current].author}</p>
                <p className="text-sm text-gray-500">{testimonials[current].role}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Dots */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current ? 'w-6 bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Feature card with image
const FeatureCard = ({ 
  title, 
  desc, 
  icon, 
  image, 
  color,
  index 
}: { 
  title: string; 
  desc: string; 
  icon: string; 
  image: string;
  color: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -8 }}
    className="bg-white rounded-3xl border overflow-hidden shadow-lg hover:shadow-xl transition-all"
  >
    <div className={`h-48 bg-gradient-to-br ${color} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute bottom-4 left-4 text-4xl bg-white/20 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover mix-blend-overlay"
      />
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      <Link href="/features" className="mt-4 inline-flex items-center text-blue-600 text-sm font-semibold hover:gap-2 transition-all">
        Learn more <span className="text-lg ml-1">→</span>
      </Link>
    </div>
  </motion.div>
);

// Industry card
const IndustryCard = ({ name, icon, color }: { name: string; icon: string; color: string }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`bg-gradient-to-br ${color} p-6 rounded-xl text-white cursor-pointer`}
  >
    <div className="text-3xl mb-2">{icon}</div>
    <h4 className="font-semibold">{name}</h4>
  </motion.div>
);

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="relative"
        >
          {/* Animated rings */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-blue-400 rounded-full blur-xl"
          />
          <div className="relative bg-white p-8 rounded-3xl shadow-2xl">
            <Image
              src="/logo.png"
              alt="MatthOrg"
              width={120}
              height={120}
              priority
              className="relative z-10"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden font-sans bg-white text-gray-900">
      {/* Animated background gradient */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 40%, rgba(59,130,246,0.1) 0%, transparent 50%)`,
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-20">
          
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-lg" />
            </motion.div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              MatthOrg
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-gray-600 hover:text-gray-900 font-medium transition">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium transition">
              About
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition">
              Sign in
            </Link>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Free
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden z-[60] p-2" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className={`w-6 h-0.5 bg-gray-900 mb-1.5 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <div className={`w-6 h-0.5 bg-gray-900 mb-1.5 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <div className={`w-6 h-0.5 bg-gray-900 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="md:hidden fixed inset-0 bg-white z-50 pt-20"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="flex flex-col h-full p-6">
                <div className="flex flex-col gap-4">
                  <Link 
                    href="/features" 
                    className="text-xl font-semibold py-3 border-b border-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link 
                    href="/pricing" 
                    className="text-xl font-semibold py-3 border-b border-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link 
                    href="/about" 
                    className="text-xl font-semibold py-3 border-b border-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link 
                    href="/login" 
                    className="text-xl font-semibold py-3 border-b border-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                </div>
                
                <div className="mt-auto pb-10">
                  <Link href="/signup" onClick={() => setMenuOpen(false)}>
                    <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg">
                      Get Started Free
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-semibold mb-6 border border-blue-100">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                🚀 Trusted by 5,000+ businesses
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6">
                The intelligence portal{' '}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  built for scale.
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                Unified workflows, financials, and team management in one clean system. 
                Your entire business, powered by AI.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-12">
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all text-lg"
                  >
                    Start your workspace →
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-gray-900 border-2 rounded-xl font-bold hover:shadow-lg transition-all text-lg flex items-center gap-2"
                >
                  <span>▶</span> Watch Demo
                </motion.button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-3xl font-bold text-gray-900"><Counter end={5000} /></p>
                  <p className="text-sm text-gray-500">Active Users</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900"><Counter end={100} />M</p>
                  <p className="text-sm text-gray-500">Transactions</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900"><Counter end={99.9} />%</p>
                  <p className="text-sm text-gray-500">Uptime</p>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/dashboard-preview.png"
                  alt="Dashboard Preview"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
                
                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-lg"
                >
                  <p className="text-sm font-semibold">📈 +32% this month</p>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, delay: 1 }}
                  className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg"
                >
                  <p className="text-sm font-semibold">✅ 128 tasks completed</p>
                </motion.div>
              </div>

              {/* Trust badges */}
              <div className="flex justify-center gap-8 mt-8 opacity-60">
                <span className="text-xl font-bold text-gray-400">Trusted by</span>
                <span className="text-xl font-bold text-gray-400">TechCrunch</span>
                <span className="text-xl font-bold text-gray-400">Forbes</span>
                <span className="text-xl font-bold text-gray-400">Wired</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Built for every industry</h2>
            <p className="text-xl text-gray-600">From dog breeding to construction, we've got you covered</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <IndustryCard name="Construction" icon="🏗️" color="from-orange-500 to-red-500" />
            <IndustryCard name="Dog Breeding" icon="🐕" color="from-blue-500 to-cyan-500" />
            <IndustryCard name="Retail" icon="🛍️" color="from-green-500 to-emerald-500" />
            <IndustryCard name="Healthcare" icon="🏥" color="from-purple-500 to-pink-500" />
            <IndustryCard name="Restaurants" icon="🍽️" color="from-yellow-500 to-orange-500" />
            <IndustryCard name="Real Estate" icon="🏠" color="from-indigo-500 to-blue-500" />
            <IndustryCard name="Logistics" icon="🚚" color="from-red-500 to-pink-500" />
            <IndustryCard name="Agriculture" icon="🌾" color="from-green-600 to-lime-500" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Everything you need to scale</h2>
            <p className="text-xl text-gray-600">Powerful features that grow with your business</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              index={0}
              title="Financials"
              desc="Automated revenue tracking, expense management, and predictive analytics with real-time insights."
              icon="💰"
              image="/features/finance.jpg"
              color="from-green-500 to-emerald-600"
            />
            <FeatureCard
              index={1}
              title="Workflows"
              desc="Drag-and-drop automation builder with conditional logic, approvals, and custom triggers."
              icon="⚙️"
              image="/features/workflow.jpg"
              color="from-blue-500 to-cyan-600"
            />
            <FeatureCard
              index={2}
              title="Clock-In"
              desc="Location-aware attendance with geofencing, biometric options, and timesheet automation."
              icon="📍"
              image="/features/clockin.jpg"
              color="from-purple-500 to-pink-600"
            />
            <FeatureCard
              index={3}
              title="Task Manager"
              desc="Enterprise-grade project management with Gantt charts, dependencies, and team collaboration."
              icon="📅"
              image="/features/tasks.jpg"
              color="from-orange-500 to-red-600"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Loved by business owners</h2>
            <p className="text-xl text-gray-600">Join thousands of satisfied customers</p>
          </motion.div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-12 text-center text-white shadow-2xl"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to transform your business?</h2>
            <p className="text-xl mb-8 opacity-90">Join 5,000+ businesses already scaling with MatthOrg</p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all text-lg"
                >
                  Get Started Free →
                </motion.button>
              </Link>
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold hover:bg-white/10 transition-all text-lg">
                Contact Sales
              </button>
            </div>

            <p className="text-sm mt-6 opacity-75">No credit card required • 14-day free trial</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-lg" />
                <span className="font-bold text-white text-lg">MatthOrg</span>
              </div>
              <p className="text-sm">The intelligence portal for modern businesses.</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
                <li><Link href="/changelog" className="hover:text-white">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/press" className="hover:text-white">Press</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; 2026 MatthOrg, Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-white">Twitter</Link>
              <Link href="#" className="hover:text-white">LinkedIn</Link>
              <Link href="#" className="hover:text-white">GitHub</Link>
              <Link href="#" className="hover:text-white">YouTube</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}