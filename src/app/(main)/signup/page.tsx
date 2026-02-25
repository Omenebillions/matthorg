"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    industry: "",
    other_industry: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const industries = [
    "Technology", "Finance", "Education", "Healthcare",
    "Entertainment", "Construction", "Agriculture",
    "Transportation", "Manufacturing", "Retail", "Other",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const generateSubdomain = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const finalIndustry = form.industry === "Other" ? form.other_industry : form.industry;
      const slug = generateSubdomain(form.company_name);
      
      console.log("📝 Signup attempt with:", {
        email: form.email,
        company: form.company_name,
        slug: slug
      });

      // 1️⃣ Create Supabase Auth User with Metadata
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            company_name: form.company_name,
            organization_slug: slug,
          },
          emailRedirectTo: process.env.NODE_ENV === 'production'
            ? 'https://matthorg.vercel.app/auth/callback'
            : 'http://localhost:3000/auth/callback'
        }
      });

      if (error) throw new Error(error.message);
      
      const userId = data.user?.id;
      if (!userId) throw new Error("User creation failed.");
      
      console.log("✅ User created:", userId);

      // 2️⃣ Insert Organization with detailed error logging
      console.log("🏢 Creating organization:", {
        user_id: userId,
        name: form.company_name,
        industry: finalIndustry,
        subdomain: slug,
      });

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          user_id: userId,
          name: form.company_name,
          industry: finalIndustry,
          subdomain: slug,
        })
        .select()
        .single();

      if (orgError) {
        console.error("🔥 FULL ORG ERROR:", {
          message: orgError.message,
          code: orgError.code,
          details: orgError.details,
          hint: orgError.hint
        });
        
        // Show specific error to user
        if (orgError.code === '23505') {
          throw new Error(`Company name "${form.company_name}" is already taken. Please choose another.`);
        } else if (orgError.code === '42501') {
          throw new Error("Permission denied. Please check database permissions.");
        } else if (orgError.code === '23502') {
          throw new Error("Missing required field. Please contact support.");
        } else if (orgError.code === '42P01') {
          throw new Error("Database table not found. Please contact support.");
        } else {
          throw new Error(`Organization setup failed: ${orgError.message}`);
        }
      }

      console.log("✅ Organization created:", org.id);

      // 3️⃣ Insert Staff Profile
      const allPermissions = [
        "task:create", "task:assign", "task:view",
        "inventory:add", "inventory:view",
        "sales:view", "expenses:add", "expenses:view",
        "staff:add", "staff:view",
      ];

      console.log("👤 Creating staff profile for user:", userId);

      const { error: staffError } = await supabase.from("staff_profiles").insert({
        id: userId,
        name: form.name,
        email: form.email,
        role: "ceo",
        permissions: allPermissions,
        organization_id: org.id,
      });

      if (staffError) {
        console.error("🔥 STAFF ERROR:", staffError);
        throw new Error(`Profile setup failed: ${staffError.message}`);
      }

      console.log("✅ Staff profile created successfully");

      // 4️⃣ Success!
      setError(""); // Clear any errors
      alert("Account created! Please check your email to verify your account before logging in.");
      
      // Redirect to login page
      router.push("/login?message=Please verify your email");
      
    } catch (err: any) {
      console.error("❌ Signup error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-500 blur-3xl z-0"
        />

        <div className="relative z-10">
          <motion.img
            src="/logo.png"
            alt="MatthOrg Logo"
            className="w-24 h-24 mx-auto mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          <h2 className="text-center text-2xl font-extrabold mb-6 text-gray-900">
            Create Your MatthOrg Account
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <input
              name="company_name"
              placeholder="Company Name"
              value={form.company_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <select
              name="industry"
              value={form.industry}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">Select Industry</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>

            {form.industry === "Other" && (
              <input
                name="other_industry"
                placeholder="Specify Industry"
                value={form.other_industry}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              />
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className={`w-full py-3 font-semibold bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}