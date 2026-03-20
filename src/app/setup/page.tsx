// /home/user/matthorg/src/app/setup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    custom_subdomain: "",
    industry: "",
  });
  
  // Subdomain suggestions
  const [subdomainSuggestions, setSubdomainSuggestions] = useState<string[]>([]);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Get email from session storage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signup_email');
    if (!storedEmail) {
      router.push('/signup');
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  // Industry list
  const industries = [
    "Technology", "Finance", "Education", "Healthcare", "Retail",
    "Construction", "Agriculture", "Transportation", "Manufacturing",
    "Dog Breeding", "Real Estate", "Restaurant", "Consulting"
  ];

  // Filter industries
  const filteredIndustries = industries.filter(ind => 
    ind.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate subdomain from company name
  const generateSubdomain = (name: string) => {
    if (!name) return '';
    return name.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
  };

  // Check subdomain availability
  useEffect(() => {
    const checkSubdomain = async () => {
      const subdomainToCheck = formData.custom_subdomain || generateSubdomain(formData.company_name);
      
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
  }, [formData.company_name, formData.custom_subdomain]);

  // Generate suggestions
  useEffect(() => {
    if (!formData.company_name) {
      setSubdomainSuggestions([]);
      return;
    }

    const base = generateSubdomain(formData.company_name);
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
  }, [formData.company_name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const slug = formData.custom_subdomain || generateSubdomain(formData.company_name);
      
      if (slug.length < 3) {
        throw new Error("Subdomain must be at least 3 characters.");
      }

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          user_id: user.id,
          name: formData.company_name,
          industry: formData.industry,
          subdomain: slug,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create staff profile
      const { error: staffError } = await supabase
        .from("staff_profiles")
        .insert({
          id: user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: email,
          role: "ceo",
          permissions: [
            "task:create", "task:assign", "task:view",
            "inventory:add", "inventory:view",
            "sales:view", "expenses:add", "expenses:view",
            "staff:add", "staff:view",
          ],
          organization_id: org.id,
        });

      if (staffError) throw staffError;

      // Clear session storage
      sessionStorage.removeItem('signup_email');
      
      // Success! Redirect to dashboard
      router.push("/dashboard");
      
    } catch (err: any) {
      console.error("Setup error:", err);
      setError(err.message || "Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  const generatedSubdomain = formData.custom_subdomain || generateSubdomain(formData.company_name);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Workspace</h1>
          <p className="text-gray-500 mt-2">Set up your organization details</p>
          <p className="text-sm text-gray-400 mt-1">Account: {email}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Your business name"
              required
            />
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Workspace URL <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={formData.custom_subdomain}
                onChange={(e) => setFormData({...formData, custom_subdomain: e.target.value})}
                placeholder={generatedSubdomain || "your-company"}
                className="flex-1 px-4 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-400"
              />
              <span className="px-4 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                .mthorg.com
              </span>
            </div>

            {/* Suggestions */}
            {subdomainSuggestions.length > 0 && !formData.custom_subdomain && (
              <div className="flex flex-wrap gap-2 mt-2">
                {subdomainSuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setFormData({...formData, custom_subdomain: suggestion})}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Availability */}
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

          {/* Industry */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search or select industry"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              required
            />
            
            {showDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredIndustries.map(industry => (
                  <div
                    key={industry}
                    onClick={() => {
                      setFormData({...formData, industry});
                      setSearchTerm(industry);
                      setShowDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    {industry}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || subdomainAvailable === false}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Creating workspace..." : "Complete Setup"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}