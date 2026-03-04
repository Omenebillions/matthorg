// /home/user/matthorg/src/app/(main)/signup/page.tsx
"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    company_name: "",
    custom_subdomain: "",
    industry: "",
    other_industry: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [subdomainSuggestions, setSubdomainSuggestions] = useState<string[]>([]);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const industries = [
    "Accounting & Tax",
    "Legal / Law Firm",
    "Consulting",
    "Marketing Agency",
    "Architecture",
    "Engineering",
    "Financial Services",
    "Healthcare / Medical",
    "Dental Practice",
    "Veterinary",
    "Pharmacy",
    "Fitness / Gym",
    "Yoga / Wellness",
    "Spa / Salon",
    "Physical Therapy",
    "Restaurant",
    "Cafe / Coffee Shop",
    "Bar / Nightclub",
    "Catering",
    "Bakery",
    "Food Truck",
    "Brewery / Distillery",
    "Retail Store",
    "E-commerce / Online Store",
    "Fashion / Clothing",
    "Electronics",
    "Furniture / Home Decor",
    "Grocery / Supermarket",
    "Auto Parts",
    "Dog Breeding",
    "Livestock / Ranch",
    "Poultry Farming",
    "Crop Farming",
    "Fishery / Aquaculture",
    "Pet Store",
    "Kennel / Boarding",
    "Construction",
    "Contracting",
    "Electrical",
    "Plumbing",
    "HVAC",
    "Landscaping",
    "Painting",
    "Roofing",
    "Real Estate Agency",
    "Property Management",
    "Rentals / Leasing",
    "Logistics / Trucking",
    "Delivery Service",
    "Taxi / Ride Share",
    "Moving Company",
    "Auto Repair / Mechanic",
    "Car Wash / Detailing",
    "School / Education",
    "Daycare / Preschool",
    "Tutoring",
    "Training Center",
    "Music Lessons",
    "Driving School",
    "Photography",
    "Videography",
    "Event Planning",
    "Wedding Services",
    "Music / Band",
    "Hair Salon",
    "Barber Shop",
    "Nail Salon",
    "Makeup Artist",
    "Cleaning Service",
    "Pest Control",
    "Handyman",
    "Home Security",
    "Software / Tech",
    "IT Services",
    "Web Development",
    "Digital Agency",
    "Non-profit / Charity",
    "Church / Religious",
    "Manufacturing",
    "Printing",
    "Fabrication",
    "Wholesale / Distribution",
    "Sports Club",
    "Fitness Center",
    "Golf Course",
    "Martial Arts",
    "Dance Studio",
    "Other (Please Specify)"
  ];

  const filteredIndustries = useMemo(() => {
    if (!searchTerm) return industries;
    return industries.filter(ind => 
      ind.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateSubdomain = (name: string) => {
    if (!name) return '';
    return name.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
  };

  useEffect(() => {
    const checkSubdomain = async () => {
      const subdomainToCheck = form.custom_subdomain || generateSubdomain(form.company_name);
      
      if (!subdomainToCheck || subdomainToCheck.length < 3) {
        setSubdomainAvailable(null);
        return;
      }

      setCheckingSubdomain(true);
      const { data } = await supabase
        .from('organizations')
        .select('subdomain')
        .eq('subdomain', subdomainToCheck)
        .maybeSingle();

      setSubdomainAvailable(!data);
      setCheckingSubdomain(false);
    };

    const timeout = setTimeout(checkSubdomain, 500);
    return () => clearTimeout(timeout);
  }, [form.company_name, form.custom_subdomain]);

  useEffect(() => {
    if (!form.company_name) {
      setSubdomainSuggestions([]);
      return;
    }

    const base = generateSubdomain(form.company_name);
    if (!base) return;

    const suggestions = [
      base,
      base + 'app',
      base + 'hub',
      base + 'workspace',
      base.slice(0, 15),
      base.replace(/-/g, ''),
    ].filter((v, i, a) => a.indexOf(v) === i);

    setSubdomainSuggestions(suggestions);
  }, [form.company_name]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const selectIndustry = (industry: string) => {
    setForm({ ...form, industry });
    setSearchTerm(industry);
    setShowDropdown(false);
  };

  const applySuggestion = (suggestion: string) => {
    setForm({ ...form, custom_subdomain: suggestion });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const finalIndustry = form.industry === "Other (Please Specify)" ? form.other_industry : form.industry;
      const slug = form.custom_subdomain || generateSubdomain(form.company_name);
      
      if (slug.length < 3) {
        throw new Error("Subdomain must be at least 3 characters.");
      }

      console.log("📝 Signup attempt with:", {
        email: form.email,
        company: form.company_name,
        slug: slug
      });

      // 1️⃣ Create Supabase Auth User
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.first_name,
            last_name: form.last_name,
            company_name: form.company_name,
          },
          emailRedirectTo: process.env.NODE_ENV === 'production'
            ? 'https://mthorg.com/auth/callback'
            : 'http://localhost:3000/auth/callback'
        }
      });

      if (signUpError) throw signUpError;
      
      const userId = data.user?.id;
      if (!userId) throw new Error("User creation failed.");
      
      console.log("✅ User created:", userId);

      // Get access token
      const accessToken = data.session?.access_token;
      
      if (!accessToken) {
        // Email confirmation is required
        console.log("⏳ Email confirmation required");
        setError("Please check your email to verify your account. After verification, you'll need to complete your organization setup.");
        setLoading(false);
        return;
      }

      // 2️⃣ Call Edge Function to create organization
      const edgeFunctionUrl = "https://hflueseqjgdfeykbqmyd.supabase.co/functions/v1/create-organization";
      
      console.log("🏢 Calling Edge Function to create organization:", {
        name: form.company_name,
        industry: finalIndustry,
        subdomain: slug,
      });

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.company_name,
          industry: finalIndustry,
          subdomain: slug,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Edge function error:", result);
        
        if (result.error?.includes('duplicate') || result.error?.includes('already exists')) {
          throw new Error(`The subdomain "${slug}.mthorg.com" is already taken. Please choose another.`);
        } else {
          throw new Error(result.error || result.details || "Failed to create organization");
        }
      }

      console.log("✅ Organization created:", result.organization);

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
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: "ceo",
        permissions: allPermissions,
        organization_id: result.organization.id,
      });

      if (staffError) {
        console.error("🔥 STAFF ERROR:", staffError);
        throw new Error(`Profile setup failed: ${staffError.message}`);
      }

      console.log("✅ Staff profile created successfully");

      // 4️⃣ Success!
      setError("");
      alert(`Account created! Welcome, ${form.first_name}! Your workspace is ready at https://${slug}.mthorg.com`);
      router.push("/login?message=Please verify your email");
      
    } catch (err: any) {
      console.error("❌ Signup error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatedSubdomain = form.custom_subdomain || generateSubdomain(form.company_name);

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
            <div className="grid grid-cols-2 gap-4">
              <input
                name="first_name"
                placeholder="First Name"
                value={form.first_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <input
                name="last_name"
                placeholder="Last Name"
                value={form.last_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>

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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Your Workspace URL
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="custom_subdomain"
                  value={form.custom_subdomain}
                  onChange={handleChange}
                  placeholder={generatedSubdomain || "your-company"}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <span className="px-4 py-3 bg-gray-50 border border-l-0 border-gray-200 rounded-r-xl text-gray-600">
                  .mthorg.com
                </span>
              </div>

              {subdomainSuggestions.length > 0 && !form.custom_subdomain && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {subdomainSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {generatedSubdomain && generatedSubdomain.length >= 3 && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  {checkingSubdomain ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-gray-500">Checking availability...</span>
                    </>
                  ) : subdomainAvailable === true ? (
                    <>
                      <span className="text-green-500">✓</span>
                      <span className="text-green-600">Available!</span>
                    </>
                  ) : subdomainAvailable === false ? (
                    <>
                      <span className="text-red-500">✗</span>
                      <span className="text-red-600">Already taken</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry <span className="text-gray-400">(search or select)</span>
              </label>
              <input
                type="text"
                placeholder="Type to search industries..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) {
                    setForm({ ...form, industry: "" });
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                required
              />
              
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredIndustries.length > 0 ? (
                      filteredIndustries.map((industry) => (
                        <div
                          key={industry}
                          onClick={() => selectIndustry(industry)}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                        >
                          {industry}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-gray-500 mb-2">No industries found</p>
                        <button
                          type="button"
                          onClick={() => selectIndustry("Other (Please Specify)")}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Select "Other" to specify
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {form.industry === "Other (Please Specify)" && (
              <input
                name="other_industry"
                placeholder="Please specify your industry"
                value={form.other_industry}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              />
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading || subdomainAvailable === false}
              className={`w-full py-3 font-semibold bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all ${
                loading || subdomainAvailable === false ? "opacity-50 cursor-not-allowed" : ""
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