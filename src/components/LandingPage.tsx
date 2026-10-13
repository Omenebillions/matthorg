import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, BusinessProfile, PublicProfessionalProfile, Lead, MatchedProfessionalCandidate, CustomerRequest } from '../types';
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
  FileText,
  CreditCard,
  Clock,
  Send,
  Briefcase,
  Users,
  Repeat,
  Check,
  Phone,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { LegalModal, LegalDocType } from './LegalModal';
import { ProfessionalProfileModal } from './homepage/ProfessionalProfileModal';
import { QuickRequestModal } from './homepage/QuickRequestModal';
import { CustomerRequestTrackerModal } from './CustomerRequestTrackerModal';
import { fetchPublicProfessionals, createCustomerRequest, matchProfessionalsForRequest } from '../lib/db';
import { calculateIntentScore } from '../data/marketplaceData';

export interface LandingPageProps {
  business: BusinessProfile;
  currentUser: User;
  initialService?: string;
  initialLocation?: string;
  onOpenNewQuote: (withAI?: boolean) => void;
  onOpenNewInvoice: () => void;
  onEnterApp: () => void;
  onPromptLogin: () => void;
  onPromptRegister?: () => void;
  onNewLeadCreated?: (lead: Lead) => void;
  onNavigateBusiness?: () => void;
  onNavigateBlog?: (slug?: string) => void;
  onNavigateServices?: (serviceSlug?: string, locationSlug?: string) => void;
  onNavigateLocations?: (locationSlug?: string) => void;
}

// 8 Popular Service Categories with Verified, High-Reliability Image Assets & Fallbacks
const POPULAR_SERVICES = [
  {
    id: 'solar_power',
    name: 'Solar & Power',
    query: 'Solar installation',
    image: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=800&q=80',
    alt: 'Solar technician installing renewable energy panels',
  },
  {
    id: 'cctv_security',
    name: 'CCTV & Security',
    query: 'CCTV installation',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    alt: 'Technician installing security and surveillance system',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    query: 'Electrician',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
    alt: 'Licensed electrician working on modern wiring installation',
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    query: 'Plumber',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    alt: 'Plumbing professional assembling piping',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    query: 'Cleaning',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
    alt: 'Professional deep cleaning team sanitizing a modern interior',
  },
  {
    id: 'construction',
    name: 'Construction',
    query: 'Construction',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
    alt: 'Contractor and builder reviewing construction plans on site',
  },
  {
    id: 'ac_repairs',
    name: 'AC & Repairs',
    query: 'AC repair',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    alt: 'HVAC technician carrying out precision AC maintenance and repair',
  },
  {
    id: 'it_services',
    name: 'IT Services',
    query: 'IT services',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    alt: 'Network engineer and IT specialist configuring technology systems',
  },
];

const SERVICE_CHIPS = [
  'Solar installation',
  'Electrician',
  'Plumber',
  'CCTV installation',
  'Cleaning',
  'Internet installation',
  'AC repair',
  'Construction',
  'IT services',
];

const LOCATION_CHIPS = ['Lagos', 'Abuja', 'Port Harcourt', 'Ikeja', 'Lekki'];

export function LandingPage({
  business,
  currentUser,
  initialService = '',
  initialLocation = '',
  onOpenNewQuote,
  onOpenNewInvoice,
  onEnterApp,
  onPromptLogin,
  onPromptRegister,
  onNewLeadCreated,
  onNavigateBusiness,
  onNavigateBlog,
  onNavigateServices,
  onNavigateLocations,
}: LandingPageProps) {
  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Request form state (Customer First)
  const [service, setService] = useState(() => {
    if (initialService) return initialService;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('service') || params.get('s') || '';
    } catch {
      return '';
    }
  });

  const [location, setLocation] = useState(() => {
    if (initialLocation) return initialLocation;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('location') || params.get('l') || '';
    } catch {
      return '';
    }
  });

  const [whatsapp, setWhatsapp] = useState('');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');

  // Search & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(true);
  const [submissionResult, setSubmissionResult] = useState<{
    reference: string;
    service: string;
    location: string;
    matchedCandidates: MatchedProfessionalCandidate[];
    hasClosest: boolean;
  } | null>(null);

  // Professionals data from DB
  const [professionals, setProfessionals] = useState<PublicProfessionalProfile[]>([]);
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<PublicProfessionalProfile | null>(null);

  // Quick Request Modal fallback / manual modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestPrefillService, setRequestPrefillService] = useState('');
  const [requestPrefillLocation, setRequestPrefillLocation] = useState('');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalDocType>('privacy');

  // Customer Request Tracker state
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [trackerActiveRef, setTrackerActiveRef] = useState<string | null>(null);
  const [trackerActiveRequest, setTrackerActiveRequest] = useState<CustomerRequest | null>(null);
  const [trackerActiveMatches, setTrackerActiveMatches] = useState<MatchedProfessionalCandidate[]>([]);

  const heroFormRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load registered professionals
  useEffect(() => {
    let isMounted = true;
    setIsLoadingProfessionals(true);
    fetchPublicProfessionals({ randomize: false })
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

  // Update when props change (e.g. from SEO navigation)
  useEffect(() => {
    if (initialService) setService(initialService);
    if (initialLocation) setLocation(initialLocation);
  }, [initialService, initialLocation]);

  // Sync authenticated user details if available
  useEffect(() => {
    if (currentUser?.name && !customerName) {
      setCustomerName(currentUser.name);
    }
  }, [currentUser]);

  // Navigate to business workspace
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

  // Compute matched candidates using the rules-based matching engine
  const activeMatchedCandidates = useMemo(() => {
    const sTerm = (submissionResult?.service || service).trim();
    const lTerm = (submissionResult?.location || location).trim();

    if (!sTerm && !lTerm) return [];

    return matchProfessionalsForRequest(
      {
        service: sTerm,
        location: lTerm,
      },
      professionals
    );
  }, [professionals, submissionResult, service, location]);

  // Handle Main Request Form Submit
  const handleGetProfessionals = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmissionError(null);

    if (!service.trim()) {
      setSubmissionError('Please enter or select what service you need.');
      return;
    }

    if (!location.trim()) {
      setSubmissionError('Please enter or select where you need the service.');
      return;
    }

    if (!consentGiven) {
      setSubmissionError('Please confirm consent to be contacted by verified professionals regarding this job.');
      return;
    }

    setIsSubmitting(true);
    setIsSubmitSuccess(false);

    const effectiveName = customerName.trim() || currentUser?.name || 'Valued Customer';
    const effectivePhone = whatsapp.trim() || 'WhatsApp Pending';

    try {
      // 1. Authoritative request persistence in backend (persisted to Supabase with schema verification)
      const persisted = await createCustomerRequest({
        customer_name: effectiveName,
        phone: effectivePhone,
        whatsapp: whatsapp.trim() || undefined,
        email: currentUser?.email || undefined,
        location: location.trim(),
        service_required: service.trim(),
        service_category: 'General Service',
        timeline: 'within_7_days',
        status: 'Open',
        user_id: currentUser?.id,
        consent_given: consentGiven,
        details: `Customer request submitted via MatthOrg homepage for ${service.trim()} in ${location.trim()}. WhatsApp: ${whatsapp.trim() || 'Not provided'}.`,
      });

      const refCode = persisted.request_number;

      // 2. Compute intent & create Lead for the business workflow
      const { score, level } = calculateIntentScore({
        service_required: service.trim(),
        phone: effectivePhone,
        whatsapp: whatsapp.trim(),
        location: location.trim(),
        timeline: 'within_7_days',
        is_verified: true,
        notes: `Homepage request #${refCode} for ${service.trim()} in ${location.trim()}`,
      });

      const newLead: Lead = {
        id: `lead_req_${Date.now()}`,
        lead_number: refCode,
        customer_name: effectiveName,
        phone: effectivePhone,
        whatsapp: whatsapp.trim() || effectivePhone,
        email: currentUser?.email || undefined,
        location: location.trim(),
        service_required: service.trim(),
        service_category: 'Service Request',
        budget_formatted: 'Negotiable / Quote requested',
        timeline: 'within_7_days',
        source: 'marketplace',
        source_name: 'MatthOrg Customer Request',
        status: 'New',
        intent_score: score,
        intent_level: level,
        is_verified: true,
        verified_at: new Date().toISOString(),
        freshness: 'active',
        freshness_label: '🔥 Active — submitted just now',
        is_locked: false,
        notes: `Service required: ${service.trim()} in ${location.trim()}. WhatsApp: ${whatsapp.trim() || 'None'}. Consent confirmed: Yes.`,
        customer_request_id: persisted.id,
        created_at: new Date().toISOString(),
      };

      if (onNewLeadCreated) {
        onNewLeadCreated(newLead);
      }

      // 3. Execute authoritative rules-based professional matching
      const matches = matchProfessionalsForRequest(
        {
          service: service.trim(),
          location: location.trim(),
        },
        professionals
      );

      setSubmissionResult({
        reference: refCode,
        service: service.trim(),
        location: location.trim(),
        matchedCandidates: matches,
        hasClosest: matches.length > 0,
      });

      // Save into customer tracking state for immediate live progress monitoring
      setTrackerActiveRequest(persisted);
      setTrackerActiveRef(refCode);
      setTrackerActiveMatches(matches);

      try {
        localStorage.setItem(`matthorg_request_matches_${persisted.id}`, JSON.stringify(matches));
        localStorage.setItem('matthorg_latest_tracking_ref', refCode);
      } catch {
        // ignore
      }

      // Subtle checkmark transition animation on the submit button
      setIsSubmitSuccess(true);
      setSubmissionError(null);

      // Scroll to confirmation/results area after visual checkmark transition
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 700);

      // Auto-reset success button label after 4 seconds
      setTimeout(() => {
        setIsSubmitSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error('Request persistence error:', err);
      // Truthful error state: Do not fake successful persistence if database failed!
      setIsSubmitSuccess(false);
      setSubmissionError(
        err?.message || 'We could not connect to the database to register your request. Please check your network and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset success feedback if user modifies input fields
  useEffect(() => {
    if (isSubmitSuccess) {
      setIsSubmitSuccess(false);
    }
  }, [service, location, whatsapp]);

  const handleSelectServiceCategory = (categoryQuery: string) => {
    setService(categoryQuery);
    if (heroFormRef.current) {
      heroFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleLaunchModalRequest = (s = '', l = '') => {
    setRequestPrefillService(s || service);
    setRequestPrefillLocation(l || location);
    setIsRequestModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-[#0B192C] font-sans antialiased selection:bg-[#0B192C] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HEADER & NAVIGATION                                                    */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E9F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
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
            <span className="text-xl font-extrabold tracking-tight text-[#0B192C]">
              MATTHORG
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569]">
            <a
              href="#request-service"
              className="hover:text-[#0B192C] transition-colors py-1"
            >
              Find Professionals
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#0B192C] transition-colors py-1"
            >
              How It Works
            </a>
            <a
              href="#for-businesses"
              className="hover:text-[#0B192C] transition-colors py-1 font-semibold text-[#0B192C]"
            >
              For Businesses
            </a>
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsTrackerModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-[#0B192C] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
              title="Track existing request reference"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Track Request</span>
            </button>
            <button
              type="button"
              onClick={onPromptLogin}
              className="px-4 py-2 text-sm font-semibold text-[#475569] hover:text-[#0B192C] transition-colors cursor-pointer"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={handleGoToBusiness}
              className="px-5 py-2.5 rounded-full text-sm font-bold bg-[#0B192C] text-white hover:bg-[#1E3E62] shadow-sm transition-all duration-200 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>GROW MY BUSINESS</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#0B192C] hover:bg-[#F1F5F9] focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E5E9F0] bg-white px-5 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <a
              href="#request-service"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-base font-semibold text-[#0B192C]"
            >
              Find Professionals
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-base font-semibold text-[#0B192C]"
            >
              How It Works
            </a>
            <a
              href="#for-businesses"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-base font-semibold text-[#0B192C]"
            >
              For Businesses
            </a>
            <div className="pt-4 border-t border-[#E5E9F0] flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsTrackerModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-[#0B192C] bg-slate-100 flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Track My Request</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onPromptLogin();
                }}
                className="w-full py-3 text-center rounded-xl text-sm font-semibold border border-[#CBD5E1] text-[#0B192C]"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleGoToBusiness(e);
                }}
                className="w-full py-3 text-center rounded-xl text-sm font-bold bg-[#0B192C] text-white"
              >
                GROW MY BUSINESS
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO — CUSTOMER FIRST ("Get what you need done.")                       */}
      {/* ========================================================================= */}
      <section id="request-service" className="pt-12 pb-16 sm:pt-20 sm:pb-24 bg-[#FAFBFD] border-b border-[#E5E9F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center" ref={heroFormRef}>
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#0B192C] leading-[1.08]">
            Get what you need done.
          </h1>

          {/* Supporting Text */}
          <p className="mt-5 text-lg sm:text-xl text-[#475569] max-w-2xl mx-auto font-normal leading-relaxed">
            Tell us what service you need and where you need it. MatthOrg helps connect you with professionals who can get the job done.
          </p>

          {/* Main Request Form */}
          <div className="mt-10 max-w-3xl mx-auto text-left">
            <form
              onSubmit={handleGetProfessionals}
              className="p-6 sm:p-8 bg-white rounded-3xl shadow-xl shadow-[#0B192C]/5 border border-[#E2E8F0] space-y-6"
            >
              {/* SERVICE Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-2">
                  Service
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="What service do you need?"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F8FAFC] text-[#0B192C] text-base placeholder-[#94A3B8] border border-[#E2E8F0] focus:border-[#0B192C] focus:bg-white focus:outline-none transition-all shadow-xs"
                    required
                  />
                </div>

                {/* Service Examples / Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#64748B]">Examples:</span>
                  {SERVICE_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setService(chip)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        service.toLowerCase() === chip.toLowerCase()
                          ? 'bg-[#0B192C] text-white font-semibold'
                          : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* LOCATION Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where do you need it?"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F8FAFC] text-[#0B192C] text-base placeholder-[#94A3B8] border border-[#E2E8F0] focus:border-[#0B192C] focus:bg-white focus:outline-none transition-all shadow-xs"
                    required
                  />
                </div>

                {/* Location Examples / Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#64748B]">Examples:</span>
                  {LOCATION_CHIPS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        location.toLowerCase() === loc.toLowerCase()
                          ? 'bg-[#0B192C] text-white font-semibold'
                          : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* WHATSAPP NUMBER Field (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
                    WhatsApp number (optional)
                  </label>
                  <span className="text-[11px] font-medium text-[#64748B]">Optional</span>
                </div>
                <div className="relative">
                  <Phone className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. 0801 234 5678"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] text-[#0B192C] text-base placeholder-[#94A3B8] border border-[#E2E8F0] focus:border-[#0B192C] focus:bg-white focus:outline-none transition-all shadow-xs"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#64748B]">
                  Add your WhatsApp number so we can notify you when professionals respond.
                </p>
              </div>

              {/* Consent & Communication Agreement */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="customer-request-consent"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0B192C] focus:ring-[#0B192C] cursor-pointer"
                />
                <label
                  htmlFor="customer-request-consent"
                  className="text-xs text-[#64748B] leading-relaxed cursor-pointer select-none"
                >
                  I agree to be contacted by verified service professionals on WhatsApp or phone regarding this request.
                </label>
              </div>

              {/* Truthful Submission Error Notification */}
              {submissionError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="font-bold block">Submission Notice</strong>
                    <span className="text-[11px] leading-relaxed">{submissionError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetProfessionals}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry
                  </button>
                </div>
              )}

              {/* PRIMARY ACTION BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-live="polite"
                  className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base tracking-wide transition-all duration-300 ease-out shadow-lg flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-85 ${
                    isSubmitSuccess
                      ? 'bg-emerald-600 hover:bg-emerald-600 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/25 scale-[1.01]'
                      : 'bg-[#0B192C] hover:bg-[#1E3E62] text-white hover:shadow-xl active:scale-[0.99]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="tracking-wide">SEARCHING PROFESSIONALS...</span>
                    </>
                  ) : isSubmitSuccess ? (
                    <div className="flex items-center justify-center gap-2.5 animate-in fade-in zoom-in-95 duration-300">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-emerald-600 shadow-sm transition-transform duration-300 animate-in zoom-in-50">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                      <span className="tracking-wide">REQUEST SUBMITTED!</span>
                    </div>
                  ) : (
                    <>
                      <span className="tracking-wide">GET PROFESSIONALS</span>
                      <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* REQUEST SUBMISSION FEEDBACK / CLOSEST SEARCH RESULTS */}
          {submissionResult && (
            <div ref={resultsRef} className="mt-10 max-w-3xl mx-auto text-left animate-in fade-in duration-300">
              {submissionResult.hasClosest && submissionResult.matchedCandidates.length > 0 ? (
                /* Matching Professionals Found */
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-emerald-200 shadow-xl space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
                          Request ID: {submissionResult.reference}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsTrackerModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-[#0B192C] hover:bg-[#1E3E62] transition shadow-2xs cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Live Request Tracker & Timeline &rarr;</span>
                        </button>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#0B192C] mt-2">
                        Closest professionals for {submissionResult.service} in {submissionResult.location}
                      </h3>
                      <p className="text-sm text-[#475569] mt-1">
                        Here are verified specialists matching your service area. Your request is registered and providers are notified.
                      </p>
                    </div>
                  </div>

                  {/* List of Closest Professionals */}
                  <div className="space-y-4 pt-2">
                    {submissionResult.matchedCandidates.slice(0, 3).map(({ professional: pro, matchScore, isVerified, isPremium }) => (
                      <div
                        key={pro.id}
                        className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#CBD5E1] transition-all"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {pro.logo ? (
                            <img
                              src={pro.logo}
                              alt={pro.business_name}
                              className="w-12 h-12 rounded-xl object-cover border border-[#E2E8F0] shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#0B192C] text-white flex items-center justify-center font-bold text-base shrink-0">
                              {pro.business_name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-[#0B192C] truncate">
                                {pro.business_name}
                              </h4>
                              {isPremium && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  ★ Priority Match
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#64748B] truncate">
                              {pro.specialization || pro.industry} • {pro.city ? `${pro.city}, ${pro.state}` : pro.state}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {pro.is_demo ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Demo Listing (Unverified)</span>
                                </span>
                              ) : isVerified ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Verified Contractor</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Verification Pending</span>
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-slate-500">
                                • {matchScore}% relevance
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedProfessional(pro)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#0B192C] bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                          >
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleLaunchModalRequest(
                                pro.specialization || pro.business_name,
                                pro.city ? `${pro.city}, ${pro.state}` : pro.state
                              )
                            }
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0B192C] hover:bg-[#1E3E62] transition-colors cursor-pointer"
                          >
                            Request Quote
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
                    <span>
                      Need more quotes? Your request is logged and verified businesses in {submissionResult.location} have received your brief.
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubmissionResult(null)}
                      className="font-bold underline ml-3 shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                /* Not Immediately Available — Exact Requested State */
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-blue-200 shadow-xl space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold">
                          Request ID: {submissionResult.reference}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsTrackerModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-[#0B192C] hover:bg-[#1E3E62] transition shadow-2xs cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Live Request Tracker &rarr;</span>
                        </button>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#0B192C] mt-2">
                        This is noted. Someone will reach out to you now.
                      </h3>
                      <p className="text-sm text-[#475569] mt-2 leading-relaxed">
                        Your request for <strong className="text-[#0B192C] font-semibold">{submissionResult.service}</strong> in <strong className="text-[#0B192C] font-semibold">{submissionResult.location}</strong> has been registered. Our matching system is alerting local service businesses and professionals in your area.
                      </p>
                      {whatsapp ? (
                        <p className="text-xs text-emerald-700 font-semibold mt-2 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>We have noted your WhatsApp number ({whatsapp}) for updates.</span>
                        </p>
                      ) : (
                        <p className="text-xs text-[#64748B] mt-2">
                          If you have a WhatsApp number, you can add it to receive instant notifications when professionals reply.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleLaunchModalRequest(submissionResult.service, submissionResult.location)}
                      className="text-xs font-bold text-[#0B192C] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Add additional project details &rarr;</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubmissionResult(null)}
                      className="text-xs font-semibold text-[#64748B] hover:text-[#0B192C]"
                    >
                      Make another request
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW MATTHORG WORKS                                                     */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-[#E5E9F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C]">
              How MatthOrg works
            </h2>
            <p className="mt-3 text-base text-[#475569]">
              Connecting you with verified professionals in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-[#FAFBFD] border border-[#E5E9F0] flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#0B192C] text-white flex items-center justify-center font-black text-lg mb-6 shadow-sm">
                  1
                </div>
                <h3 className="text-xl font-bold text-[#0B192C]">
                  Tell us what you need
                </h3>
                <p className="mt-2.5 text-sm text-[#475569] leading-relaxed">
                  Add your service and location.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-[#FAFBFD] border border-[#E5E9F0] flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1E3E62] text-white flex items-center justify-center font-black text-lg mb-6 shadow-sm">
                  2
                </div>
                <h3 className="text-xl font-bold text-[#0B192C]">
                  We find matching professionals
                </h3>
                <p className="mt-2.5 text-sm text-[#475569] leading-relaxed">
                  Your request is matched with relevant businesses and professionals.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-[#FAFBFD] border border-[#E5E9F0] flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg mb-6 shadow-sm">
                  3
                </div>
                <h3 className="text-xl font-bold text-[#0B192C]">
                  Get responses
                </h3>
                <p className="mt-2.5 text-sm text-[#475569] leading-relaxed">
                  Review professionals and choose who you want to work with.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. POPULAR SERVICES / CATEGORIES                                          */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#FAFBFD] border-b border-[#E5E9F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C]">
              Popular Services
            </h2>
            <p className="mt-2 text-base text-[#475569]">
              Select a service to start your request or see available specialists.
            </p>
          </div>

          {/* 8 Reliable Image Tiles with fallback protection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {POPULAR_SERVICES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectServiceCategory(cat.query)}
                className="group relative overflow-hidden rounded-3xl aspect-[4/3] bg-[#0B192C] text-left shadow-sm hover:shadow-xl transition-all duration-300 border border-[#E2E8F0] cursor-pointer"
              >
                {/* Image */}
                <img
                  src={cat.image}
                  alt={cat.alt}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = cat.fallback;
                    }
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-90"
                  loading="lazy"
                />

                {/* Gradient for clear text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/90 via-[#0B192C]/30 to-transparent" />

                {/* Label + Action */}
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
                  <span className="text-lg font-bold tracking-tight drop-shadow-xs">
                    {cat.name}
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
      {/* 5. CUSTOMER CTA                                                           */}
      {/* ========================================================================= */}
      <section className="py-14 bg-white border-b border-[#E5E9F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C]">
            Need a professional?
          </h3>
          <p className="mt-2 text-base text-[#475569] max-w-xl mx-auto">
            Tell us what you need and we'll help you find the right business.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                if (heroFormRef.current) {
                  heroFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="px-8 py-3.5 rounded-full text-sm font-extrabold bg-[#0B192C] text-white hover:bg-[#1E3E62] shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>GET PROFESSIONALS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BUSINESS / PROFESSIONAL SECTION                                        */}
      {/* ========================================================================= */}
      <section id="for-businesses" className="py-16 sm:py-24 bg-[#0B192C] text-white relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#1E3E62]/40 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">
              For Businesses & Professionals
            </span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Are you a business or professional?
            </h2>
            <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-200">
              Grow your business. Get more customers. Get more done.
            </h3>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              MatthOrg helps service businesses manage customer requests, leads, quotes, invoices and follow-ups — with AI assistance built into the workflow.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={handleGoToBusiness}
                className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-extrabold bg-white text-[#0B192C] hover:bg-[#F1F5F9] shadow-lg transition-all cursor-pointer text-center"
              >
                GROW MY BUSINESS
              </button>
              <button
                type="button"
                onClick={handleGoToBusiness}
                className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-extrabold bg-[#1E3E62] text-white hover:bg-[#2A5285] transition-all cursor-pointer text-center border border-white/10"
              >
                GET CUSTOMERS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BUSINESS BENEFITS                                                      */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E5E9F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C]">
              Everything you need to run and grow your service business
            </h2>
            <p className="mt-2 text-base text-[#475569]">
              Clear tools designed specifically for service professionals and contracting firms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Benefit 1 */}
            <div className="p-7 rounded-3xl bg-[#FAFBFD] border border-[#E5E9F0] hover:border-[#CBD5E1] transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-5">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B192C]">Get Customers</h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Receive relevant customer requests that match your services and location.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="p-7 rounded-3xl bg-[#FAFBFD] border border-[#E5E9F0] hover:border-[#CBD5E1] transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-5">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B192C]">Manage Leads</h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Turn customer requests into organized leads and track your sales pipeline.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="p-7 rounded-3xl bg-[#FAFBFD] border border-[#E5E9F0] hover:border-[#CBD5E1] transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-5">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B192C]">Send Quotes</h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Create professional quotations quickly and send them to customers.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="p-7 rounded-3xl bg-[#FAFBFD] border border-[#E5E9F0] hover:border-[#CBD5E1] transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold mb-5">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B192C]">Create Invoices</h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Turn accepted quotes into invoices and keep your payment workflow organized.
                </p>
              </div>
            </div>

            {/* Benefit 5 */}
            <div className="p-7 rounded-3xl bg-[#FAFBFD] border border-[#E5E9F0] hover:border-[#CBD5E1] transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold mb-5">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B192C]">Follow Up</h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Keep track of customers, deals and follow-up activities so opportunities don't get forgotten.
                </p>
              </div>
            </div>

            {/* Benefit 6: Matthew AI */}
            <div className="p-7 rounded-3xl bg-gradient-to-br from-[#F8FAFC] to-blue-50/50 border border-blue-200/60 hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#0B192C] text-white flex items-center justify-center font-bold mb-5 shadow-sm">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-[#0B192C]">AI-Assisted Business Growth</h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Matthew, MatthOrg's AI business assistant, helps you understand your sales activity, identify opportunities, prepare follow-ups and improve your business workflow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. MATTHEW AI SECTION                                                     */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#FAFBFD] border-b border-[#E5E9F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B192C]/5 text-[#0B192C] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#0B192C]" />
            <span>MatthOrg's Business AI Assistant</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B192C]">
            Your business has an AI assistant.
          </h2>
          <h3 className="mt-2 text-2xl font-bold text-[#1E3E62]">
            Meet Matthew.
          </h3>
          <p className="mt-4 text-base sm:text-lg text-[#475569] max-w-2xl mx-auto leading-relaxed">
            Matthew helps you understand your business, follow up with customers, prepare quotes, spot sales opportunities and make better business decisions.
          </p>

          {/* Interactive UI Action Cards (Realistic UI Examples Only) */}
          <div className="mt-10 max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-md text-left space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F1F5F9]">
              <div className="w-10 h-10 rounded-2xl bg-[#0B192C] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                M
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B192C]">Matthew</h4>
                <p className="text-[11px] text-[#64748B]">Business AI Assistant</p>
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Ask Matthew directly in your workspace:
            </p>

            <div className="space-y-2.5">
              {[
                'Matthew, show me my leads.',
                'Matthew, which customers need follow-up?',
                'Matthew, help me prepare a quote.',
                'Matthew, what sales opportunities should I focus on today?',
                'Matthew, how are my sales performing?',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={handleGoToBusiness}
                  className="w-full text-left p-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all flex items-center justify-between text-xs sm:text-sm font-semibold text-[#0B192C] cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#64748B] group-hover:text-[#0B192C]" />
                    <span>"{prompt}"</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0B192C] group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                Positioned inside your sales pipeline & quotation workflow.
              </span>
              <button
                type="button"
                onClick={handleGoToBusiness}
                className="text-xs font-bold text-[#0B192C] hover:underline"
              >
                Open Matthew &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BUSINESS JOURNEY ("From customer request to payment.")                  */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E5E9F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C]">
            From customer request to payment.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#475569] max-w-xl mx-auto leading-relaxed">
            MatthOrg brings the important parts of your customer journey into one place.
          </p>

          {/* Visual Compact Workflow */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold text-[#0B192C]">
            <span className="px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
              Customer Request
            </span>
            <span className="text-[#94A3B8]">&rarr;</span>
            <span className="px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
              Lead
            </span>
            <span className="text-[#94A3B8]">&rarr;</span>
            <span className="px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
              Deal
            </span>
            <span className="text-[#94A3B8]">&rarr;</span>
            <span className="px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
              Quote
            </span>
            <span className="text-[#94A3B8]">&rarr;</span>
            <span className="px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
              Invoice
            </span>
            <span className="text-[#94A3B8]">&rarr;</span>
            <span className="px-4 py-2.5 rounded-2xl bg-[#0B192C] text-white shadow-xs">
              Payment
            </span>
            <span className="text-[#94A3B8]">&rarr;</span>
            <span className="px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
              Follow-up
            </span>
            <span className="text-[#94A3B8]">&rarr;</span>
            <span className="px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
              Repeat Business
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. CUSTOMER VS BUSINESS PATHS                                            */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#FAFBFD] border-b border-[#E5E9F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Customer Path */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E2E8F0] shadow-md flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 block mb-2">
                  Customer
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C]">
                  Need a professional?
                </h3>
                <p className="mt-3 text-base text-[#475569] leading-relaxed">
                  Tell us what you need and we'll help you find the right business.
                </p>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    if (heroFormRef.current) {
                      heroFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-extrabold bg-[#0B192C] text-white hover:bg-[#1E3E62] shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>GET PROFESSIONALS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Business Path */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E2E8F0] shadow-md flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600 block mb-2">
                  Business
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C]">
                  Want more customers?
                </h3>
                <p className="mt-3 text-base text-[#475569] leading-relaxed">
                  Join MatthOrg and manage your customer requests, leads, quotes and invoices.
                </p>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleGoToBusiness}
                  className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-extrabold bg-[#0B192C] text-white hover:bg-[#1E3E62] shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>GROW MY BUSINESS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="bg-[#0B192C] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden">
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
                  MATTHORG
                </span>
              </div>
              <p className="text-sm text-[#94A3B8] max-w-sm leading-relaxed">
                Get what you need done. Connecting customers with verified professionals, and helping service businesses grow.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Explore
              </h4>
              <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                <li>
                  <a href="#request-service" className="hover:text-white transition-colors">
                    Find Professionals
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateServices ? onNavigateServices() : window.location.assign('/services')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Services Directory
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateLocations ? onNavigateLocations() : window.location.assign('/locations')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Locations Directory
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateBlog ? onNavigateBlog() : window.location.assign('/blog')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Blog & Guides
                  </button>
                </li>
              </ul>
            </div>

            {/* Business & Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Businesses & Legal
              </h4>
              <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                <li>
                  <button
                    type="button"
                    onClick={handleGoToBusiness}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    For Businesses
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onPromptLogin}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Log In
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalModalType('privacy');
                      setLegalModalOpen(true);
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalModalType('terms');
                      setLegalModalOpen(true);
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
            <p>© {new Date().getFullYear()} MatthOrg. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => {
                  setLegalModalType('privacy');
                  setLegalModalOpen(true);
                }}
                className="hover:text-white transition-colors"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => {
                  setLegalModalType('terms');
                  setLegalModalOpen(true);
                }}
                className="hover:text-white transition-colors"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={handleGoToBusiness}
                className="font-bold text-white hover:underline cursor-pointer"
              >
                Business Workspace &rarr;
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      {/* 1. Professional Profile Modal */}
      <ProfessionalProfileModal
        professional={selectedProfessional}
        isOpen={Boolean(selectedProfessional)}
        onClose={() => setSelectedProfessional(null)}
        onRequestQuote={(pro) => {
          setSelectedProfessional(null);
          handleLaunchModalRequest(
            pro.specialization || pro.business_name,
            pro.city ? `${pro.city}, ${pro.state}` : pro.state
          );
        }}
      />

      {/* 2. Quick Request Modal for detailed quote inquiries */}
      <QuickRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        prefilledService={requestPrefillService}
        prefilledLocation={requestPrefillLocation}
        onSuccessSubmit={(newLead) => {
          if (onNewLeadCreated) onNewLeadCreated(newLead);
        }}
      />

      {/* 3. Legal Documents Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        type={legalModalType}
      />

      {/* 4. Customer Request Lifecycle Progress Tracker Modal */}
      <CustomerRequestTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        initialReference={trackerActiveRef}
        initialRequest={trackerActiveRequest}
        initialMatches={trackerActiveMatches}
        onSelectProfessional={(pro) => setSelectedProfessional(pro)}
        onRequestQuote={(s, l) => handleLaunchModalRequest(s, l)}
      />
    </div>
  );
}
