"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const features = [
  {
    title: "Unified Operations",
    description:
      "Orchestrate workflows across departments with our intelligent automation engine. Seamlessly connect HR, finance, and operations in real-time.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    gradient: "from-blue-600 to-cyan-600"
  },
  {
    title: "Financial Intelligence",
    description:
      "Real-time revenue tracking, automated financial workflows, and predictive analytics to optimize your business performance across all tenants.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    gradient: "from-purple-600 to-pink-600"
  },
  {
    title: "Workflow Automation",
    description:
      "Design complex business processes, automate task allocation, and track milestones with our visual workflow builder and real-time analytics.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    gradient: "from-amber-500 to-orange-600"
  },
  {
    title: "Multi-Tenant Architecture",
    description:
      "Secure, isolated environments for each organization with centralized management, custom branding, and granular access controls.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    gradient: "from-emerald-600 to-teal-600"
  },
  {
    title: "HR & Talent Management",
    description:
      "Comprehensive workforce management from recruitment to performance tracking, with automated onboarding and development workflows.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" />
      </svg>
    ),
    gradient: "from-red-600 to-rose-600"
  },
  {
    title: "Project Intelligence",
    description:
      "End-to-end project lifecycle management with resource allocation, timeline tracking, and automated milestone notifications.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    gradient: "from-indigo-600 to-blue-600"
  }
];

const stats = [
  { label: "Active Organizations", value: "500+" },
  { label: "Processes Automated", value: "10K+" },
  { label: "Data Processed", value: "2.5M+" },
  { label: "Avg. Efficiency Gain", value: "47%" }
];

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.1], [0, 8]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A]">
      {/* Premium Header */}
      <motion.header 
        style={{ opacity: headerOpacity, backdropFilter: `blur(${headerBlur}px)` }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80"
      >
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-70" />
                <div className="relative w-full h-full bg-[#0A0A0A] rounded-xl border border-white/10 flex items-center justify-center">
                  <span className="text-xl font-bold bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent">M</span>
                </div>
              </div>
              <span className="text-xl font-semibold text-white">MatthOrg</span>
            </div>
            
            <nav className="flex items-center space-x-8">
              <Link href="/features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/solutions" className="text-sm text-gray-300 hover:text-white transition-colors">
                Solutions
              </Link>
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/enterprise" className="text-sm text-gray-300 hover:text-white transition-colors">
                Enterprise
              </Link>
              <div className="flex items-center space-x-4 pl-6 border-l border-white/10">
                <Link
                  href="/login"
                  className="text-sm text-white hover:text-gray-300 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/dashboard"
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="relative px-5 py-2.5 bg-[#0A0A0A] rounded-lg border border-white/10 text-sm font-medium text-white group-hover:border-white/20 transition-colors">
                    Get Started
                  </div>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[#0A0A0A]">
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-indigo-600/20 via-transparent to-transparent blur-3xl" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
                Introducing MatthOrg Enterprise 2.0
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8"
            >
              <span className="text-white">The Operating System for</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Modern Business
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
            >
              Unify operations, finance, HR, and workflow automation in a single, 
              intelligent platform built for multi-tenant enterprises.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/dashboard"
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold group-hover:scale-105 transition-transform">
                  Start Free Trial
                </div>
              </Link>
              
              <Link
                href="/demo"
                className="px-8 py-4 bg-white/5 border border-white/10 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors"
              >
                Watch Demo
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
            >
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-32 bg-[#0A0A0A] border-t border-white/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything your enterprise needs
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A unified platform that adapts to your organization's unique workflows and requirements.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10"
                  style={{ background: `linear-gradient(to right, ${feature.gradient})` }}
                />
                <div className="relative p-8 bg-[#0F0F0F] border border-white/5 rounded-2xl hover:border-white/10 transition-all group-hover:translate-y-[-2px]">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} p-0.5 mb-6`}>
                    <div className="w-full h-full bg-[#0F0F0F] rounded-[10px] flex items-center justify-center text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-purple-600/10 to-transparent" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to transform your operations?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Join hundreds of organizations that have streamlined their business with MatthOrg.
            </p>
            <Link
              href="/dashboard"
              className="relative group inline-block"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="relative px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold text-lg group-hover:scale-105 transition-transform">
                Get started today
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="border-t border-white/5 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">M</span>
                </div>
                <span className="text-lg font-semibold text-white">MatthOrg</span>
              </div>
              <p className="text-sm text-gray-500">
                The intelligent operating system for modern enterprises.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-sm text-gray-500 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/solutions" className="text-sm text-gray-500 hover:text-white transition-colors">Solutions</Link></li>
                <li><Link href="/pricing" className="text-sm text-gray-500 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/enterprise" className="text-sm text-gray-500 hover:text-white transition-colors">Enterprise</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm text-gray-500 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-sm text-gray-500 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="text-sm text-gray-500 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-sm text-gray-500 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/security" className="text-sm text-gray-500 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} MatthOrg, Inc. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
