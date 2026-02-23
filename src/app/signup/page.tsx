"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    industry: "",
    other_industry: "",
  });

  const industries = [
    "Technology",
    "Finance",
    "Education",
    "Healthcare",
    "Entertainment",
    "Construction",
    "Agriculture",
    "Transportation",
    "Manufacturing",
    "Retail",
    "Other",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateSubdomain = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalIndustry =
      form.industry === "Other" ? form.other_industry : form.industry;

    const subdomain = generateSubdomain(form.company_name);

    // 1️⃣ Create Supabase Auth User
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) return alert(error.message);

    const userId = data.user?.id;
    if (!userId) return alert("User creation failed.");

    // 2️⃣ Insert Organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        user_id: userId,
        name: form.company_name,
        industry: finalIndustry,
        subdomain: subdomain + ".matthorg.com",
      })
      .select()
      .single();

    if (orgError) return alert(orgError.message);
    if (!org?.id) return alert("Organization creation failed.");

    // 3️⃣ Insert Staff Profile for CEO/Admin
    const allPermissions = [
      "task:create",
      "task:assign",
      "task:view",
      "inventory:add",
      "inventory:view",
      "sales:view",
      "expenses:add",
      "expenses:view",
      "staff:add",
      "staff:view",
    ];

    const { error: staffError } = await supabase.from("staff_profiles").insert({
      id: userId,
      name: form.name,
      email: form.email,
      role: "ceo", // first user is CEO
      permissions: allPermissions,
      organization_id: org.id,
    });

    if (staffError) return alert(staffError.message);

    alert(
      `Account created successfully!\nYou are the CEO of ${form.company_name}.\nYour subdomain: ${subdomain}.matthorg.com`
    );
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden"
      >
        {/* Background Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-500 blur-3xl z-0"
        />

        <div className="relative z-10">
          {/* Logo */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <input
              name="company_name"
              placeholder="Company Name"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <select
              name="industry"
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
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              />
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 font-semibold bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Sign Up
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