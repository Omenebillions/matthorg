import React, { useState, useEffect, useMemo } from 'react';
import { User, BusinessProfile, PublicProfessionalProfile, Lead } from '../types';
import {
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronRight,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  Send,
  Building,
} from 'lucide-react';
import { LegalModal, LegalDocType } from './LegalModal';
import { ProfessionalProfileModal } from './homepage/ProfessionalProfileModal';
import { QuickRequestModal } from './homepage/QuickRequestModal';
import { fetchPublicProfessionals } from '../lib/db';
import { POPULAR_LOCATIONS } from '../data/marketplaceData';

interface LandingPageProps {
  business: BusinessProfile;
  currentUser: User;
  onOpenNewQuote: (withAI?: boolean) => void;
  onOpenNewInvoice: () => void;
  onEnterApp: () => void;
  onPromptLogin: () => void;
  onNewLeadCreated?: (lead: Lead) => void;
  onNavigateBusiness?: () => void;
}

// 8 Popular Service Categories with High-Quality Photography
const POPULAR_SERVICES = [
  {
    id: 'solar_power',
    name: 'Solar & Power',
    query: 'Solar',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    alt: 'Solar technician installing renewable energy panels',
  },
  {
    id: 'cctv_security',
    name: 'CCTV & Security',
    query: 'CCTV',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    alt: 'Technician installing security and surveillance system',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    query: 'Electrical',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    alt: 'Licensed electrician working on modern wiring installation',
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    query: 'Plumbing',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
    alt: 'Plumbing professional assembling modern copper piping',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    query: 'Cleaning',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    alt: 'Professional deep cleaning team sanitizing a modern interior',
  },
  {
    id: 'construction',
    name: 'Construction',
    query: 'Construction',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    alt: 'Project contractor and architect reviewing architectural build plans',
  },
  {
    id: 'repairs_maintenance',
    name: 'Repairs & Maintenance',
    query: 'Repairs',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
    alt: 'Technician carrying out precision maintenance and mechanical repairs',
  },
  {
    id: 'it_technology',
    name: 'IT & Technology',
    query: 'IT',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    alt: 'Network engineer and IT specialist configuring network connectivity',
  },
];

export function LandingPage({
  business,
  currentUser,
  onOpenNewQuote,
  onOpenNewInvoice,
  onEnterApp,
  onPromptLogin,
  onNewLeadCreated,
  onNavigateBusiness,
}: LandingPageProps) {
  // Navigation & Mobile Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Business navigation helper (/business)
  const handleGoToBusiness = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigateBusiness) {
      onNavigateBusiness();
    } else {
      try {
        window.history.pushState({}, '', '/business');
      } catch {
        // ignore
      }
      onEnterApp();
    }
  };

  // Modals
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalDocType>('privacy');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestPrefillService, setRequestPrefillService] = useState('');
  const [requestPrefillCategory, setRequestPrefillCategory] = useState('');
  const [requestPrefillLocation, setRequestPrefillLocation] = useState('');
  const [requestTargetProfessional, setRequestTargetProfessional] = useState<PublicProfessionalProfile | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<PublicProfessionalProfile | null>(null);

  // Search & Filtering State
  const [professionals, setProfessionals] = useState<PublicProfessionalProfile[]>([]);
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Load Real Verified Professionals from Database
  useEffect(() => {
    let isMounted = true;
    setIsLoadingProfessionals(true);
    fetchPublicProfessionals({ randomize: true })
      .then((data) => {
        if (isMounted) {
          setProfessionals(data || []);
          setIsLoadingProfessionals(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingProfessionals(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleShuffleProfessionals = () => {
    setProfessionals((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  // Filtered Professionals List (strictly factual)
  const filteredProfessionals = useMemo(() => {
    return professionals.filter((prof) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = prof.business_name.toLowerCase().includes(q);
        const matchSpec = (prof.specialization || '').toLowerCase().includes(q);
        const matchInd = (prof.industry || '').toLowerCase().includes(q);
        const matchTag = (prof.tagline || '').toLowerCase().includes(q);
        const matchServ = (prof.categories_offered || []).some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchSpec && !matchInd && !matchTag && !matchServ) {
          return false;
        }
      }

      if (selectedLocation.trim()) {
        const locTarget = selectedLocation.toLowerCase().trim();
        const inCity = (prof.city || '').toLowerCase().includes(locTarget);
        const inState = (prof.state || '').toLowerCase().includes(locTarget);
        const inServed = (prof.locations_served || []).some((loc) => loc.toLowerCase().includes(locTarget));
        if (!inCity && !inState && !inServed) {
          return false;
        }
      }

      return true;
    });
  }, [professionals, searchQuery, selectedLocation]);

  const handleLaunchRequest = (
    serviceName = '',
    category = '',
    location = '',
    targetProfessional: PublicProfessionalProfile | null = null
  ) => {
    setRequestPrefillService(serviceName || searchQuery);
    setRequestPrefillCategory(category);
    setRequestPrefillLocation(location || selectedLocation);
    setRequestTargetProfessional(targetProfessional);
    setIsRequestModalOpen(true);
  };

  const handleCategoryClick = (serviceQuery: string, serviceName: string) => {
    setSearchQuery(serviceQuery);
    const directoryEl = document.getElementById('find-professionals');
    if (directoryEl) {
      directoryEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const directoryEl = document.getElementById('find-professionals');
    if (directoryEl) {
      directoryEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openLegal = (type: LegalDocType) => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#0B192C] selection:text-white antialiased">
      {/* ========================================================================= */}
      {/* 1. NAVIGATION                                                             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-[#0B192C] p-0.5 flex items-center justify-center shadow-md transition-transform group-hover:scale-105 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="MatthOrg Logo"
                  className="w-full h-full object-cover rounded-[10px]"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-[#0B192C]">
                  MatthOrg
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#64748B] -mt-1 hidden sm:block">
                  Service Marketplace
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#334155]">
            <a
              href="#find-professionals"
              className="hover:text-[#0B192C] transition-colors py-1"
            >
              Find Professionals
            </a>
            <button
              type="button"
              onClick={() => handleLaunchRequest()}
              className="hover:text-[#0B192C] transition-colors py-1 cursor-pointer"
            >
              Post a Request
            </button>
            <a
              href="/business"
              onClick={handleGoToBusiness}
              className="hover:text-[#0B192C] transition-colors py-1 font-semibold text-[#0B192C] inline-flex items-center gap-1"
            >
              <span>For Businesses &rarr;</span>
            </a>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={onPromptLogin}
              className="px-4 py-2 text-sm font-medium text-[#334155] hover:text-[#0B192C] transition-colors cursor-pointer"
            >
              Log In
            </button>
            <a
              href="/business"
              onClick={handleGoToBusiness}
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#0B192C] text-white hover:bg-[#1E3E62] shadow-sm transition-all duration-200 cursor-pointer inline-flex items-center gap-1"
            >
              <span>Grow My Business</span>
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#334155] hover:text-[#0B192C] hover:bg-[#F1F5F9] focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E2E8F0] bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <a
              href="#find-professionals"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[#334155] hover:text-[#0B192C]"
            >
              Find Professionals
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLaunchRequest();
              }}
              className="block w-full text-left py-2 text-base font-medium text-[#334155] hover:text-[#0B192C]"
            >
              Post a Request
            </button>
            <a
              href="/business"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleGoToBusiness(e);
              }}
              className="block py-2 text-base font-semibold text-[#0B192C] hover:text-[#1E3E62] flex items-center justify-between"
            >
              <span>For Businesses &rarr;</span>
            </a>
            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onPromptLogin();
                }}
                className="w-full py-2.5 text-center rounded-xl text-sm font-semibold border border-[#CBD5E1] text-[#334155]"
              >
                Log In
              </button>
              <a
                href="/business"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleGoToBusiness(e);
                }}
                className="w-full py-2.5 text-center rounded-xl text-sm font-semibold bg-[#0B192C] text-white block"
              >
                Grow My Business
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO & SEARCH SECTION (Large Photography + Dual Clear Paths)           */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left: Headline, Search & Two Primary Paths */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#0B192C] leading-[1.08]">
                Get More Customers.
                <br />
                <span className="text-[#1E3E62]">Get More Done.</span>
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-[#475569] max-w-xl font-normal leading-relaxed">
                Find trusted professionals or get your next customer.
              </p>

              {/* Large Search Interface */}
              <div className="mt-8 p-3 sm:p-4 bg-white rounded-3xl shadow-xl shadow-[#0B192C]/5 border border-[#E2E8F0]">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 flex items-center">
                    <Search className="w-5 h-5 text-[#94A3B8] absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="What do you need help with?"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] text-sm sm:text-base text-[#0F172A] placeholder-[#94A3B8] border border-transparent focus:border-[#0B192C] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Location Input (Free-form Town and State, No Limits) */}
                  <div className="relative sm:w-60 flex items-center">
                    <MapPin className="w-4 h-4 text-[#94A3B8] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      placeholder="Town & State (e.g. Ikeja, Lagos)"
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] border border-transparent focus:border-[#0B192C] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-[#0B192C] hover:bg-[#1E3E62] text-white font-semibold text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Two Primary Paths */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Path 1: I Need a Service */}
                <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-all">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#64748B]">
                    For Customers
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-[#0B192C]">
                    I need a service
                  </h3>
                  <p className="mt-1 text-sm text-[#64748B] leading-snug">
                    Find someone who can get it done or post your service request.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleLaunchRequest(searchQuery, '', selectedLocation)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B192C] hover:underline cursor-pointer"
                    >
                      Request a Service &rarr;
                    </button>
                    <span className="text-[#CBD5E1]">|</span>
                    <a
                      href="#find-professionals"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#0B192C]"
                    >
                      Browse Directory
                    </a>
                  </div>
                </div>

                {/* Path 2: I Run a Business */}
                <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-all">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#64748B]">
                    For Businesses
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-[#0B192C]">
                    I run a business
                  </h3>
                  <p className="mt-1 text-sm text-[#64748B] leading-snug">
                    Find customers. Manage your sales. Get paid.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={onEnterApp}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B192C] hover:underline cursor-pointer"
                    >
                      Grow My Business &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Right: Large High-Quality Image of Real Professional Doing Useful Work */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="overflow-hidden rounded-3xl shadow-2xl border border-[#E2E8F0] bg-white aspect-[4/5] relative group">
                  <img
                    src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80"
                    alt="Professional technician at work installing electrical systems"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    loading="eager"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/80 via-transparent to-transparent" />
                  
                  {/* Image Micro-Badge / Caption */}
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified Professionals</span>
                    </div>
                    <p className="text-base font-semibold leading-snug">
                      Someone can help you get the job done.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. POPULAR SERVICES (Large Image Tiles — 8 Core Categories)               */}
      {/* ========================================================================= */}
      <section className="py-16 md:py-24 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C]">
              What do you need help with?
            </h2>
            <p className="mt-3 text-base text-[#475569]">
              Explore verified service categories and connect with experienced professionals.
            </p>
          </div>

          {/* 8 Large Image Tiles */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {POPULAR_SERVICES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryClick(category.query, category.name)}
                className="group relative overflow-hidden rounded-3xl aspect-[4/3] bg-[#0B192C] text-left shadow-sm hover:shadow-xl transition-all duration-300 border border-[#E2E8F0] cursor-pointer"
              >
                {/* Background Image with Zoom */}
                <img
                  src={category.image}
                  alt={category.alt}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-90"
                  loading="lazy"
                />

                {/* Gradient for Text Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/90 via-[#0B192C]/30 to-transparent" />

                {/* Category Label + Arrow */}
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
                  <span className="text-lg font-bold tracking-tight drop-shadow-sm">
                    {category.name}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:text-[#0B192C] transition-colors">
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FIND PROFESSIONALS SECTION                                             */}
      {/* ========================================================================= */}
      <section id="find-professionals" className="py-16 md:py-24 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Registered Businesses on MatthOrg</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C]">
                Registered Professionals & Businesses
              </h2>
              <p className="mt-2 text-base text-[#475569]">
                Showing registered commercial service businesses and certified technical specialists.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleShuffleProfessionals}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#CBD5E1] hover:border-[#0B192C] text-xs font-bold text-[#0B192C] shadow-xs hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>Shuffle / Randomize</span>
              </button>

              {(searchQuery || selectedLocation) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('');
                  }}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#0B192C] underline cursor-pointer"
                >
                  Clear filter ({searchQuery ? `"${searchQuery}"` : ''}{searchQuery && selectedLocation ? ' in ' : ''}{selectedLocation ? `"${selectedLocation}"` : ''})
                </button>
              )}
            </div>
          </div>

          {/* Directory Cards or Service Request State */}
          {filteredProfessionals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfessionals.slice(0, 6).map((prof) => {
                const isVerified =
                  prof.business_verified ||
                  prof.phone_verified ||
                  prof.identity_verified ||
                  prof.service_verified;

                return (
                  <div
                    key={prof.id}
                    className="flex flex-col justify-between p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all group"
                  >
                    <div>
                      {/* Image / Logo Header */}
                      <div className="flex items-start gap-4 mb-4">
                        {prof.logo ? (
                          <img
                            src={prof.logo}
                            alt={prof.business_name}
                            className="w-14 h-14 rounded-2xl object-cover border border-[#E2E8F0] shadow-sm shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-[#0B192C] text-white flex items-center justify-center font-bold text-lg shrink-0">
                            {prof.business_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-[#0B192C] truncate group-hover:text-[#1E3E62] transition-colors">
                            {prof.business_name}
                          </h3>
                          <p className="text-xs font-semibold text-[#64748B] truncate">
                            {prof.specialization || prof.industry || 'Service Professional'}
                          </p>
                          <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{prof.city ? `${prof.city}, ${prof.state}` : prof.state || 'Local & Remote'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Tagline / Services */}
                      {prof.tagline && (
                        <p className="text-sm text-[#475569] line-clamp-2 mb-4 leading-relaxed">
                          {prof.tagline}
                        </p>
                      )}

                      {/* Verified Badge */}
                      {isVerified && (
                        <div className="mb-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProfessional(prof)}
                        className="text-xs font-bold text-[#0B192C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleLaunchRequest(
                            prof.specialization || prof.business_name,
                            prof.industry,
                            prof.city ? `${prof.city}, ${prof.state}` : prof.state,
                            prof
                          )
                        }
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F1F5F9] hover:bg-[#0B192C] text-[#334155] hover:text-white transition-colors cursor-pointer"
                      >
                        Request Quote
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State: Bring up request form directly instead of telling customer to join */
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-[#E2E8F0] shadow-sm max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#0B192C]/5 text-[#0B192C] flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7 text-[#0B192C]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B192C]">
                {searchQuery ? `Looking for help with "${searchQuery}"?` : 'Need someone who can get it done?'}
              </h3>
              <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                {selectedLocation
                  ? `No direct listings in "${selectedLocation}" right now. Submit your service request and available professionals will reach out with quotes.`
                  : `Can't find a listed professional yet? Post your service request and let available professionals come to you.`}
              </p>
              
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleLaunchRequest(searchQuery, '', selectedLocation)}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-bold bg-[#0B192C] text-white hover:bg-[#1E3E62] shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Request This Service</span>
                </button>

                {(searchQuery || selectedLocation) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedLocation('');
                    }}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-full text-sm font-semibold border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. POST A REQUEST SECTION (Large Visual CTA + 3 Simple Steps)             */}
      {/* ========================================================================= */}
      <section id="post-request" className="py-16 md:py-24 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 lg:p-16 rounded-3xl bg-[#0B192C] text-white relative overflow-hidden shadow-2xl">
            {/* Background Texture / Subtle Gradient */}
            <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-[#1E3E62]/40 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
              {/* Left Column: Heading & 3 Steps */}
              <div className="lg:col-span-7">
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  Can't find what you need?
                </h2>
                <p className="mt-4 text-base sm:text-lg text-[#94A3B8] max-w-lg leading-relaxed">
                  Tell us what you need and let relevant professionals come to you.
                </p>

                {/* 3 Simple Steps */}
                <div className="mt-8 space-y-4 max-w-md">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 text-white font-bold text-sm flex items-center justify-center shrink-0 border border-white/20">
                      1
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        Tell us what you need
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Describe your job, your location, and your timeline.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 text-white font-bold text-sm flex items-center justify-center shrink-0 border border-white/20">
                      2
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        Get matched with professionals
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Relevant verified providers review your project.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 text-white font-bold text-sm flex items-center justify-center shrink-0 border border-white/20">
                      3
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        Choose who to work with
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Compare quotes, review credentials, and select the right fit.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-10">
                  <button
                    type="button"
                    onClick={() => handleLaunchRequest()}
                    className="px-8 py-4 rounded-full text-base font-bold bg-white text-[#0B192C] hover:bg-[#F1F5F9] shadow-lg transition-all duration-200 cursor-pointer inline-flex items-center gap-3"
                  >
                    <span>Post a Request</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Strong Consultation Photography */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-[4/3] sm:aspect-[16/11]">
                  <img
                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80"
                    alt="Customer discussing project plans with a professional contractor"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BUSINESS OWNER SECTION (Workflow + Real Interface Mockup)             */}
      {/* ========================================================================= */}
      <section id="for-businesses" className="py-16 md:py-24 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase tracking-widest font-bold text-[#64748B]">
              Built for Modern Service Businesses
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B192C]">
              Grow your business with MatthOrg.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#475569] leading-relaxed">
              Find leads, manage opportunities, send quotations, invoice customers and get paid — all in one place.
            </p>

            {/* Core Workflow Visual */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold text-[#0B192C]">
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#CBD5E1] shadow-xs">
                Leads
              </span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#CBD5E1] shadow-xs">
                Deals
              </span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#CBD5E1] shadow-xs">
                Quotations
              </span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#CBD5E1] shadow-xs">
                Invoices
              </span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-3.5 py-1.5 rounded-full bg-[#0B192C] text-white shadow-xs">
                Payments
              </span>
            </div>

            <p className="mt-4 text-sm font-medium text-[#64748B]">
              Follow up. Close more business. Keep everything organized.
            </p>
          </div>

          {/* Product / Dashboard Mockup from Actual Interface */}
          <div className="mt-12 max-w-5xl mx-auto rounded-3xl overflow-hidden border border-[#E2E8F0] bg-white shadow-xl">
            {/* Mockup Window Header */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-semibold text-[#64748B]">
                  MatthOrg Workspace — Sales Pipeline
                </span>
              </div>
              <span className="text-xs font-medium text-[#94A3B8]">
                Real-Time Operations
              </span>
            </div>

            {/* Genuine MatthOrg Operational Pipeline Overview */}
            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-[#F8FAFC]">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-[#0B192C] text-white flex items-center justify-center text-xs font-extrabold mb-3">
                    01
                  </div>
                  <h4 className="text-sm font-bold text-[#0B192C]">
                    Verified Business Directory
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                    CAC registration, verified specialization, and operating coverage are listed for commercial and residential clients.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Public & Searchable</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold mb-3">
                    02
                  </div>
                  <h4 className="text-sm font-bold text-[#0B192C]">
                    Direct Client Quote Request
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                    Clients specify project scope, timeline, budget, and location directly to your company profile.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
                  <Send className="w-3.5 h-3.5" />
                  <span>Direct Delivery</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-extrabold mb-3">
                    03
                  </div>
                  <h4 className="text-sm font-bold text-[#0B192C]">
                    Private Dashboard Lead
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                    Inquiries appear in your workspace in real-time. Paid plans unlock verified phone and direct WhatsApp contact.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Instant Dispatch</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-extrabold mb-3">
                    04
                  </div>
                  <h4 className="text-sm font-bold text-[#0B192C]">
                    Matthew AI Closing
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                    Matthew AI drafts compliant quotations, follows up leads, and helps close corporate contracts faster.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Business Development AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleGoToBusiness}
              className="px-8 py-3.5 rounded-full text-sm font-semibold bg-[#0B192C] text-white hover:bg-[#1E3E62] shadow-sm transition-all cursor-pointer"
            >
              Grow My Business
            </button>
            <button
              type="button"
              onClick={handleGoToBusiness}
              className="px-6 py-3.5 rounded-full text-sm font-medium text-[#334155] hover:text-[#0B192C] hover:bg-white transition-colors cursor-pointer"
            >
              See How It Works &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. MATTHEW SECTION (Compact Sales AI Preview — Explicitly Labeled Demo)   */}
      {/* ========================================================================= */}
      <section id="matthew" className="py-16 md:py-24 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B192C]/5 text-[#0B192C] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sales Intelligence</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C]">
            Matthew — MatthOrg's Business Development AI
          </h2>

          <p className="mt-3 text-base text-[#475569] max-w-2xl mx-auto leading-relaxed">
            Matthew helps you understand your sales pipeline, identify opportunities and decide what to do next.
          </p>

          {/* Compact UI Preview (Labeled Demo) */}
          <div className="mt-8 max-w-xl mx-auto text-left p-6 sm:p-7 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-md relative">
            {/* Demo Label Badge */}
            <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-[#E2E8F0] text-[#64748B] text-[10px] uppercase font-bold tracking-wider">
              Example
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#0B192C] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                M
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B192C]">Matthew</h4>
                <p className="text-[11px] text-[#64748B]">Business Development AI</p>
              </div>
            </div>

            <p className="text-sm text-[#334155] leading-relaxed">
              You have leads that haven't been followed up recently. I found the highest-priority opportunities and prepared the next actions.
            </p>

            <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs text-[#64748B]">
                3 follow-ups suggested today
              </span>
              <button
                type="button"
                onClick={onEnterApp}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B192C] text-white hover:bg-[#1E3E62] transition-colors cursor-pointer"
              >
                Review Follow-ups
              </button>
            </div>
          </div>

          {/* Matthew CTA */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoToBusiness}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0B192C] hover:underline cursor-pointer"
            >
              <span>See How Matthew Works</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SIMPLE FOOTER                                                          */}
      {/* ========================================================================= */}
      <footer className="bg-[#0B192C] text-white py-14 border-t border-[#1E3E62]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Column 1: Brand & Tagline */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center font-black text-base overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="MatthOrg Logo"
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  MatthOrg
                </span>
              </div>
              <p className="text-sm text-[#94A3B8] max-w-sm leading-relaxed">
                Get More Customers. Get More Done. Built for modern service businesses and customers worldwide.
              </p>
            </div>

            {/* Column 2: Marketplace */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] mb-3">
                Marketplace
              </h4>
              <ul className="space-y-2 text-sm text-[#94A3B8]">
                <li>
                  <a href="#find-professionals" className="hover:text-white transition-colors">
                    Find Professionals
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleLaunchRequest()}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Post a Request
                  </button>
                </li>
                <li>
                  <a
                    href="/business"
                    onClick={handleGoToBusiness}
                    className="hover:text-white transition-colors"
                  >
                    For Businesses
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform & Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] mb-3">
                Company & Legal
              </h4>
              <ul className="space-y-2 text-sm text-[#94A3B8]">
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('privacy')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('terms')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('security')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Security
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onPromptLogin}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Account Login
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#1E3E62] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
            <p>
              © {new Date().getFullYear()} MatthOrg Technologies. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => openLegal('privacy')}
                className="hover:text-white transition-colors"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => openLegal('terms')}
                className="hover:text-white transition-colors"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={handleGoToBusiness}
                className="font-bold text-white hover:underline cursor-pointer"
              >
                Open Workspace &rarr;
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODALS (Preserving Existing Flows)                                        */}
      {/* ========================================================================= */}
      {/* 1. Verified Professional Profile Modal */}
      <ProfessionalProfileModal
        professional={selectedProfessional}
        isOpen={Boolean(selectedProfessional)}
        onClose={() => setSelectedProfessional(null)}
        onRequestQuote={(prof) => {
          handleLaunchRequest(
            prof.specialization || prof.business_name,
            prof.industry,
            prof.city ? `${prof.city}, ${prof.state}` : prof.state,
            prof
          );
        }}
      />

      {/* 2. Customer Quick Request Modal */}
      <QuickRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setRequestTargetProfessional(null);
        }}
        prefilledService={requestPrefillService}
        prefilledCategory={requestPrefillCategory}
        prefilledLocation={requestPrefillLocation}
        targetProfessional={requestTargetProfessional}
        onSuccessSubmit={(newLead) => {
          if (onNewLeadCreated) {
            onNewLeadCreated(newLead);
          }
        }}
      />

      {/* 3. Legal Documents Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        type={legalModalType}
      />
    </div>
  );
}
