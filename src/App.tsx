import React, { useState, useEffect } from 'react';
import {
  AppState,
  Quote,
  Invoice,
  Customer,
  Product,
  QuoteTemplate,
  FollowUp,
  BusinessProfile,
  User,
  PlanTier,
  Lead,
  LeadStatus,
  QuoteItem,
} from './types';
import { initialData } from './data/initialData';
import { DashboardView } from './components/DashboardView';
import { QuotesView } from './components/QuotesView';
import { InvoicesView } from './components/InvoicesView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { TemplatesView } from './components/TemplatesView';
import { FollowUpsView } from './components/FollowUpsView';
import { LeadsView } from './components/LeadsView';
import { FindLeadsView } from './components/FindLeadsView';
import { MatthewView } from './components/MatthewView';
import { MatthewMessageModal, MatthewMessageModalTarget } from './components/MatthewMessageModal';
import { syncFollowUpTasks } from './lib/followups';
import { LeadEditorModal } from './components/LeadEditorModal';
import { ServiceRequestModal } from './components/ServiceRequestModal';
import { QuoteEditorModal } from './components/QuoteEditorModal';
import { InvoiceEditorModal } from './components/InvoiceEditorModal';
import { FollowUpModal } from './components/FollowUpModal';
import { SettingsModal } from './components/SettingsModal';
import { BusinessVerificationModal } from './components/BusinessVerificationModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { SplashScreen } from './components/SplashScreen';
import { LegalModal, LegalDocType } from './components/LegalModal';
import { BlogHomePage } from './components/seo/BlogHomePage';
import { BlogArticlePage } from './components/seo/BlogArticlePage';
import { ServiceLocationPage } from './components/seo/ServiceLocationPage';
import { LocationHubPage } from './components/seo/LocationHubPage';
import { ProfessionalProfileModal } from './components/homepage/ProfessionalProfileModal';
import { QuickRequestModal } from './components/homepage/QuickRequestModal';
import { PublicProfessionalProfile } from './types';
import { registerBusinessToDirectory } from './data/professionalsData';
import { autoCreateServicesFromBusinessProfile } from './data/serviceTaxonomy';
import { generateInboundLeads } from './lib/leadGenerator';
import { supabase, onSupabaseInit, ensureSupabase } from './lib/supabase';
import {
  getOrCreateUserBusiness,
  mapBusinessRowToProfile,
  updateBusiness,
  fetchBusinessCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchBusinessProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchBusinessQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  fetchBusinessInvoices,
  createInvoice,
  convertQuoteToInvoice,
  fetchBusinessLeads,
  createLead,
  updateLead,
  deleteLead,
  hasActiveSubscription,
  claimCustomerRequest,
  isUuid,
} from './lib/db';
import { verifyPaystackPayment } from './lib/paystack';
import { Session } from '@supabase/supabase-js';
import {
  FileText,
  CreditCard,
  Users,
  Package,
  Layers,
  Clock,
  Settings,
  Plus,
  Sparkles,
  Zap,
  Building2,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Target,
  Flame,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { generateDocNumber } from './utils/formatters';

const STORAGE_KEY = 'mathorg_state_v1';

export function App() {
  const [session, setSession] = useState<Session | any>(() => {
    try {
      const saved = localStorage.getItem('mathorg_custom_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Application persistent state
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.quotes) && Array.isArray(parsed.invoices)) {
          if (parsed?.business?.business_name?.includes('Apex Solar')) {
            parsed.business.business_name = 'Matthorg Enterprise';
            if (parsed.business.email === 'sales@apexsolar.ng') parsed.business.email = 'billing@matthorg.com';
            if (parsed.business.payment_details?.account_name?.includes('Apex Solar')) {
              parsed.business.payment_details.account_name = 'Matthorg Enterprise';
            }
            if (parsed.user?.email === 'david@apexsolar.ng') parsed.user.email = 'david@matthorg.com';
          }
          parsed.quotes = Array.isArray(parsed.quotes) ? parsed.quotes : initialData.quotes;
          parsed.invoices = Array.isArray(parsed.invoices) ? parsed.invoices : initialData.invoices;
          parsed.leads = Array.isArray(parsed.leads) ? parsed.leads : initialData.leads;
          parsed.customers = Array.isArray(parsed.customers) ? parsed.customers : initialData.customers;
          parsed.products = Array.isArray(parsed.products) ? parsed.products : initialData.products;
          parsed.templates = Array.isArray(parsed.templates) ? parsed.templates : initialData.templates;
          parsed.followups = Array.isArray(parsed.followups) ? parsed.followups : initialData.followups;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved state from localStorage:', e);
    }
    return initialData;
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'matthew' | 'leads' | 'marketplace' | 'quotes' | 'invoices' | 'customers' | 'products' | 'templates' | 'followups'
  >('dashboard');

  // Mobile menu drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Matthew Assistant & Message Generation State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [activeMessageTarget, setActiveMessageTarget] = useState<MatthewMessageModalTarget | null>(null);
  const [matthewInitialPrompt, setMatthewInitialPrompt] = useState<string | undefined>(undefined);

  // Auto-sync follow-up tasks on mount
  useEffect(() => {
    setState((prev) => {
      if (!prev || typeof prev !== 'object' || Array.isArray(prev)) return initialData;
      return {
        ...prev,
        followups: syncFollowUpTasks(prev),
      };
    });
  }, []);

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [isServiceRequestModalOpen, setIsServiceRequestModalOpen] = useState(false);

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [quoteInitialAIOpen, setQuoteInitialAIOpen] = useState(false);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [activeFollowUpQuote, setActiveFollowUpQuote] = useState<Quote | null>(null);
  const [activeFollowUpItem, setActiveFollowUpItem] = useState<FollowUp | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalDocType>('privacy');
  const [isGuest, setIsGuest] = useState(false);

  // SEO Navigation and Dynamic Routing State
  const [currentRoute, setCurrentRoute] = useState<{
    view: 'landing' | 'app' | 'blog' | 'blog-article' | 'services' | 'locations';
    blogSlug?: string;
    serviceSlug?: string;
    locationSlug?: string;
    citySlug?: string;
  }>(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search;
      if (path === '/business' || path === '/app' || search.includes('view=business') || search.includes('action=workspace')) {
        return { view: 'app' };
      }
      if (path.startsWith('/blog/')) {
        const slug = path.replace('/blog/', '').split('/')[0];
        return { view: 'blog-article', blogSlug: slug };
      }
      if (path === '/blog') {
        return { view: 'blog' };
      }
      if (path.startsWith('/services')) {
        const parts = path.replace(/^\/services\/?/, '').split('/').filter(Boolean);
        const sSlug = parts[0] || 'all';
        const lSlug = parts[1];
        const cSlug = parts[2];
        return { view: 'services', serviceSlug: sSlug, locationSlug: lSlug, citySlug: cSlug };
      }
      if (path.startsWith('/locations')) {
        const parts = path.replace(/^\/locations\/?/, '').split('/').filter(Boolean);
        const lSlug = parts[0];
        const sSlug = parts[1];
        if (sSlug) {
          return { view: 'services', serviceSlug: sSlug, locationSlug: lSlug };
        }
        return { view: 'locations', locationSlug: lSlug };
      }
      if (localStorage.getItem('mathorg_custom_session')) return { view: 'app' };
    } catch {
      // ignore
    }
    return { view: 'landing' };
  });

  const [currentView, setCurrentView] = useState<'landing' | 'app'>(() => {
    if (currentRoute.view === 'app') return 'app';
    return 'landing';
  });

  // Modal helpers for SEO Pages
  const [seoSelectedProfessional, setSeoSelectedProfessional] = useState<PublicProfessionalProfile | null>(null);
  const [isSeoQuickRequestOpen, setIsSeoQuickRequestOpen] = useState(false);
  const [seoPrefillService, setSeoPrefillService] = useState('');
  const [seoPrefillLocation, setSeoPrefillLocation] = useState('');

  // Browser popstate listener for back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        if (path === '/business' || path === '/app') {
          setCurrentRoute({ view: 'app' });
          setCurrentView('app');
        } else if (path.startsWith('/blog/')) {
          const slug = path.replace('/blog/', '').split('/')[0];
          setCurrentRoute({ view: 'blog-article', blogSlug: slug });
        } else if (path === '/blog') {
          setCurrentRoute({ view: 'blog' });
        } else if (path.startsWith('/services')) {
          const parts = path.replace(/^\/services\/?/, '').split('/').filter(Boolean);
          setCurrentRoute({ view: 'services', serviceSlug: parts[0] || 'all', locationSlug: parts[1], citySlug: parts[2] });
        } else if (path.startsWith('/locations')) {
          const parts = path.replace(/^\/locations\/?/, '').split('/').filter(Boolean);
          if (parts[1]) {
            setCurrentRoute({ view: 'services', serviceSlug: parts[1], locationSlug: parts[0] });
          } else {
            setCurrentRoute({ view: 'locations', locationSlug: parts[0] });
          }
        } else {
          setCurrentRoute({ view: 'landing' });
          setCurrentView('landing');
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Paystack payment feedback toast banner
  const [paystackToast, setPaystackToast] = useState<{
    status: 'loading' | 'success' | 'failed';
    message: string;
    details?: string;
  } | null>(null);

  // Auto-verify Paystack transactions if returning from checkout (?reference=... or ?trxref=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paystackRef = params.get('reference') || params.get('trxref');

    if (paystackRef) {
      setPaystackToast({
        status: 'loading',
        message: 'Verifying payment with Paystack...',
      });

      verifyPaystackPayment(paystackRef).then((res) => {
        if (res.success && res.data) {
          const meta = res.data.metadata || {};
          const plan = meta.plan as PlanTier;
          const invoiceId = meta.invoiceId as string;

          if (plan) {
            setState((prev) => ({
              ...prev,
              user: {
                ...prev.user,
                plan: plan,
              },
            }));
            setPaystackToast({
              status: 'success',
              message: `Payment confirmed! Mathorg account upgraded to ${plan.toUpperCase()}.`,
              details: `Reference: ${paystackRef} • Paid: ₦${res.data.amount.toLocaleString()}`,
            });
          } else if (invoiceId) {
            setState((prev) => ({
              ...prev,
              invoices: prev.invoices.map((inv) =>
                inv.id === invoiceId
                  ? {
                      ...inv,
                      status: 'Paid',
                      amount_paid: res.data?.amount || inv.total,
                    }
                  : inv
              ),
            }));
            setPaystackToast({
              status: 'success',
              message: `Payment confirmed! Invoice marked as Paid.`,
              details: `Reference: ${paystackRef} • Paid: ₦${res.data.amount.toLocaleString()}`,
            });
          } else {
            setPaystackToast({
              status: 'success',
              message: 'Paystack payment confirmed successfully.',
              details: `Reference: ${paystackRef} • ₦${res.data.amount.toLocaleString()}`,
            });
          }
        } else {
          setPaystackToast({
            status: 'failed',
            message: 'Payment verification could not be confirmed.',
            details: res.error || 'Please check your transaction reference in Paystack.',
          });
        }

        // Clean query parameters from URL without full page reload
        try {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch {
          // ignore
        }
      });
    }
  }, []);

  const openLegalModal = (type: LegalDocType) => {
    setLegalModalType(type);
    setIsLegalModalOpen(true);
  };

  // Initialize Supabase Auth with dynamic callback support
  useEffect(() => {
    onSupabaseInit((client) => {
      client.auth.getSession().then(({ data: { session: sbSession } }) => {
        if (sbSession) {
          setSession(sbSession);
          try {
            localStorage.setItem('mathorg_custom_session', JSON.stringify(sbSession));
          } catch {
            // ignore
          }
          setCurrentView('app');
        }
      });

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, sbSession) => {
        if (sbSession) {
          setSession(sbSession);
          try {
            localStorage.setItem('mathorg_custom_session', JSON.stringify(sbSession));
          } catch {
            // ignore
          }
          setCurrentView('app');
        } else if (!isGuest && !localStorage.getItem('mathorg_custom_session')) {
          setSession(null);
          setCurrentView('landing');
        }
      });
    });

    ensureSupabase();
  }, [isGuest]);

  // Handle PWA / TWA deep link shortcuts and route synchronization
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const view = params.get('view');

      if (path === '/business' || path === '/app' || view === 'business' || action === 'workspace') {
        if (session || isGuest || localStorage.getItem('mathorg_custom_session')) {
          setCurrentView('app');
        } else {
          setIsLoginModalOpen(true);
        }
      } else if (path === '/' && !action && !view && !session && !isGuest && !localStorage.getItem('mathorg_custom_session')) {
        setCurrentView('landing');
      }

      if (action === 'new-quote') {
        setCurrentView('app');
        handleOpenNewQuote(false);
      } else if (action === 'new-invoice') {
        setCurrentView('app');
        handleOpenNewInvoice();
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, [session, isGuest]);

  // Update user state if session changes
  useEffect(() => {
    if (session?.user) {
      setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          id: session.user.id,
          email: session.user.email || prev.user.email,
        }
      }));
    }
  }, [session]);

  // Bootstrap & load real business from Supabase when user is authenticated
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    let isMounted = true;

    const bootstrapBusiness = async () => {
      try {
        const result = await getOrCreateUserBusiness(userId, session.user.email);
        if (result?.business && isMounted) {
          const mappedProfile = mapBusinessRowToProfile(result.business, state.business);
          
          // Fetch live customers, products, quotes, invoices & leads belonging to this authenticated business from Supabase
          let liveCustomers: Customer[] = [];
          let liveProducts: Product[] = [];
          let liveQuotes: Quote[] = [];
          let liveInvoices: Invoice[] = [];
          let liveLeads: Lead[] = [];
          try {
            const [custData, prodData, quoteData, invData, leadData] = await Promise.all([
              fetchBusinessCustomers(result.business.id),
              fetchBusinessProducts(result.business.id),
              fetchBusinessQuotes(result.business.id),
              fetchBusinessInvoices(result.business.id),
              fetchBusinessLeads(result.business.id),
            ]);
            liveCustomers = custData;
            liveProducts = prodData;
            liveQuotes = quoteData;
            liveInvoices = invData;
            liveLeads = leadData;
          } catch (fetchErr) {
            console.warn('[Mathorg] Notice fetching business records:', fetchErr);
          }

          if (isMounted) {
            setState((prev) => {
              const updatedState = {
                ...prev,
                business: mappedProfile,
                // Replace demo data with live Supabase records if available; otherwise retain current records
                customers: liveCustomers.length > 0 ? liveCustomers : prev.customers,
                products: liveProducts.length > 0 ? liveProducts : prev.products,
                quotes: liveQuotes.length > 0 ? liveQuotes : prev.quotes,
                invoices: liveInvoices.length > 0 ? liveInvoices : prev.invoices,
                leads: liveLeads.length > 0 ? liveLeads : prev.leads,
              };
              return {
                ...updatedState,
                followups: syncFollowUpTasks(updatedState),
              };
            });
          }
        }
      } catch (err: any) {
        console.warn('[Mathorg] Database notice during business bootstrap:', err?.message || err);
      }
    };

    bootstrapBusiness();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  const handleLoginSuccess = (userSession: any, registeredBizData?: any) => {
    setSession(userSession);
    const pendingRaw = localStorage.getItem('mathorg_pending_registration_biz');
    let pendingBiz: any = null;
    if (pendingRaw) {
      try {
        pendingBiz = JSON.parse(pendingRaw);
      } catch {}
      localStorage.removeItem('mathorg_pending_registration_biz');
    }
    const bizToApply = registeredBizData || pendingBiz;

    if (userSession?.user?.email) {
      setState((prev) => {
        const updatedBusiness = bizToApply
          ? {
              ...prev.business,
              id: bizToApply.id || prev.business.id,
              business_name: bizToApply.business_name || prev.business.business_name,
              industry: bizToApply.industry || prev.business.industry,
              specialization: bizToApply.specialization || prev.business.specialization,
              phone: bizToApply.phone || prev.business.phone,
              whatsapp: bizToApply.whatsapp || bizToApply.phone || prev.business.whatsapp,
              city: bizToApply.city || prev.business.city,
              state: bizToApply.state || prev.business.state,
              email: userSession.user.email,
            }
          : prev.business;

        if (bizToApply) {
          registerBusinessToDirectory(updatedBusiness);
          autoCreateServicesFromBusinessProfile(updatedBusiness);
        }

        return {
          ...prev,
          user: {
            ...prev.user,
            id: userSession.user.id || prev.user.id,
            email: userSession.user.email,
            name: bizToApply?.business_name || prev.user.name,
          },
          business: updatedBusiness,
        };
      });
    }
    setCurrentView('app');
    setIsLoginModalOpen(false);
  };

  // Listen for direct client inquiries from MatthOrg Homepage
  useEffect(() => {
    const handleNewClientLead = (e: any) => {
      const { lead } = e.detail || {};
      if (lead) {
        setState((prev) => {
          const already = (prev.leads || []).some(
            (l) => l.id === lead.id || l.lead_number === lead.lead_number
          );
          if (already) return prev;
          return {
            ...prev,
            leads: [lead, ...(prev.leads || [])],
          };
        });
      }
    };

    window.addEventListener('matthorg_new_client_lead', handleNewClientLead);
    return () => {
      window.removeEventListener('matthorg_new_client_lead', handleNewClientLead);
    };
  }, []);

  // Merge any local direct client inquiries for the active business
  useEffect(() => {
    if (!state.business?.id) return;
    try {
      const storageKey = `matthorg_leads_${state.business.id}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const storedLeads: Lead[] = JSON.parse(raw);
        if (storedLeads && storedLeads.length > 0) {
          setState((prev) => {
            const currentIds = new Set((prev.leads || []).map((l) => l.id));
            const newToMerge = storedLeads.filter((l) => !currentIds.has(l.id));
            if (newToMerge.length === 0) return prev;
            return {
              ...prev,
              leads: [...newToMerge, ...(prev.leads || [])],
            };
          });
        }
      }
    } catch {
      // ignore
    }
  }, [state.business?.id]);

  const handleLogout = async () => {
    setIsGuest(false);
    try {
      localStorage.removeItem('mathorg_custom_session');
    } catch {
      // ignore
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setCurrentView('landing');
  };

  const handleEnterAppClick = () => {
    if (session || isGuest) {
      setCurrentView('app');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Sync state to localStorage on every update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [state]);

  // Quote Handlers
  const handleOpenNewQuote = (withAI = false) => {
    setActiveQuote(null);
    setQuoteInitialAIOpen(withAI);
    setIsQuoteModalOpen(true);
  };

  const handleOpenQuote = (quote: Quote) => {
    setActiveQuote(quote);
    setQuoteInitialAIOpen(false);
    setIsQuoteModalOpen(true);
  };

  const handleSaveQuote = async (savedQuote: Quote) => {
    const businessId = state.business?.id;
    const isAuthenticated = !!(session?.user?.id && businessId);

    if (isAuthenticated) {
      try {
        const isExistingDbQuote = isUuid(savedQuote.id) && state.quotes.some((q) => q.id === savedQuote.id);

        let persistedQuote: Quote | null = null;
        if (isExistingDbQuote) {
          persistedQuote = await updateQuote(savedQuote.id, savedQuote);
        } else {
          persistedQuote = await createQuote(businessId, savedQuote);
        }

        if (persistedQuote) {
          const finalQuote = persistedQuote;
          setState((prev) => {
            const exists = prev.quotes.some((q) => q.id === finalQuote.id || q.id === savedQuote.id);
            const updatedQuotes = exists
              ? prev.quotes.map((q) => (q.id === finalQuote.id || q.id === savedQuote.id ? finalQuote : q))
              : [finalQuote, ...prev.quotes];
            return { ...prev, quotes: updatedQuotes };
          });
          setActiveQuote(finalQuote);
        }
      } catch (err: any) {
        console.error('[Mathorg] Error persisting quote to database:', err?.message || err);
        alert(`Failed to save quote: ${err?.message || 'Database permission error'}`);
        throw err;
      }
    } else {
      // Local/demo fallback
      setState((prev) => {
        const exists = prev.quotes.some((q) => q.id === savedQuote.id);
        const updatedQuotes = exists
          ? prev.quotes.map((q) => (q.id === savedQuote.id ? savedQuote : q))
          : [savedQuote, ...prev.quotes];
        return { ...prev, quotes: updatedQuotes };
      });
    }
  };

  const handleDeleteQuote = async (id: string) => {
    const businessId = state.business?.id;
    const isAuthenticated = !!(session?.user?.id && businessId);

    if (isAuthenticated && isUuid(id) && !id.startsWith('q_')) {
      try {
        const success = await deleteQuote(id);
        if (success) {
          setState((prev) => ({
            ...prev,
            quotes: prev.quotes.filter((q) => q.id !== id),
            followups: prev.followups.filter((f) => f.quote_id !== id),
          }));
        }
      } catch (err: any) {
        console.error('[Mathorg] Error deleting quote from database:', err?.message || err);
        alert(`Failed to delete quote: ${err?.message || 'Database error'}`);
      }
    } else {
      // Local removal
      setState((prev) => ({
        ...prev,
        quotes: prev.quotes.filter((q) => q.id !== id),
        followups: prev.followups.filter((f) => f.quote_id !== id),
      }));
    }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, status: Quote['status']) => {
    const businessId = state.business?.id;
    const isAuthenticated = !!(session?.user?.id && businessId);

    if (isAuthenticated && isUuid(quoteId) && !quoteId.startsWith('q_')) {
      try {
        await updateQuote(quoteId, { status });
        setState((prev) => ({
          ...prev,
          quotes: prev.quotes.map((q) => (q.id === quoteId ? { ...q, status } : q)),
        }));
      } catch (err: any) {
        console.error('[Mathorg] Error updating quote status in database:', err?.message || err);
        alert(`Failed to update quote status: ${err?.message || 'Database error'}`);
      }
    } else {
      // Local update
      setState((prev) => ({
        ...prev,
        quotes: prev.quotes.map((q) => (q.id === quoteId ? { ...q, status } : q)),
      }));
    }
  };

  // Convert Quote -> Invoice
  const handleConvertToInvoice = async (quote: Quote) => {
    if (session?.user && isUuid(state.business.id) && isUuid(quote.id)) {
      try {
        const { invoice: liveInvoice, quote: liveQuote } = await convertQuoteToInvoice(state.business.id, quote.id);
        setState((prev) => ({
          ...prev,
          invoices: [liveInvoice, ...prev.invoices.filter((inv) => inv.id !== liveInvoice.id)],
          quotes: prev.quotes.map((q) =>
            q.id === quote.id ? liveQuote : q
          ),
        }));
        setActiveInvoice(liveInvoice);
        setIsInvoiceModalOpen(true);
        return;
      } catch (err: any) {
        console.error('[Mathorg] Database error converting quote to invoice:', err);
        alert(`Failed to convert quote to invoice: ${err?.message || 'Database error'}`);
        return;
      }
    }

    const newInvoice: Invoice = {
      id: 'inv_' + Date.now(),
      invoice_number: generateDocNumber('MAT-INV', state.invoices.length),
      quote_id: quote.id,
      customer_id: quote.customer_id,
      customer_name: quote.customer_name,
      customer_phone: quote.customer_phone,
      customer_whatsapp: quote.customer_whatsapp,
      customer_email: quote.customer_email,
      customer_address: quote.customer_address,
      status: 'Unpaid',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: quote.expiry_date,
      items: quote.items.map((it) => ({
        id: 'inv_it_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        product_id: it.product_id,
        name: it.name,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        unit: it.unit,
        total: it.total,
      })),
      subtotal: quote.subtotal,
      discount_type: quote.discount_type,
      discount_val: quote.discount_val,
      discount_amount: quote.discount_amount,
      tax_rate: quote.tax_rate,
      tax_amount: quote.tax_amount,
      total: quote.total,
      amount_paid: 0,
      notes: quote.notes ? `Converted from Quote #${quote.quote_number}.\n${quote.notes}` : `Converted from Quote #${quote.quote_number}`,
      payment_details: `Bank: ${state.business.payment_details.bank_name} | Account Name: ${state.business.payment_details.account_name} | Account No: ${state.business.payment_details.account_number}`,
      created_at: new Date().toISOString(),
    };

    // Update quote with converted invoice id
    setState((prev) => ({
      ...prev,
      invoices: [newInvoice, ...prev.invoices],
      quotes: prev.quotes.map((q) =>
        q.id === quote.id ? { ...q, converted_invoice_id: newInvoice.id, status: 'Accepted' } : q
      ),
    }));

    setActiveInvoice(newInvoice);
    setIsInvoiceModalOpen(true);
  };

  // Invoice Handlers
  const handleOpenNewInvoice = () => {
    setActiveInvoice(null);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenInvoice = (invoice: Invoice) => {
    setActiveInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleSaveInvoice = async (savedInvoice: Invoice) => {
    if (session?.user && isUuid(state.business.id) && !isUuid(savedInvoice.id)) {
      try {
        const liveInvoice = await createInvoice(state.business.id, savedInvoice);
        setState((prev) => ({
          ...prev,
          invoices: [liveInvoice, ...prev.invoices.filter((i) => i.id !== savedInvoice.id)],
        }));
        return;
      } catch (err: any) {
        console.error('[Mathorg] Database error creating invoice:', err);
        alert(`Failed to save invoice: ${err?.message || 'Database error'}`);
        return;
      }
    }

    setState((prev) => {
      const exists = prev.invoices.some((i) => i.id === savedInvoice.id);
      const updatedInvoices = exists
        ? prev.invoices.map((i) => (i.id === savedInvoice.id ? savedInvoice : i))
        : [savedInvoice, ...prev.invoices];
      return { ...prev, invoices: updatedInvoices };
    });
  };

  const handleDeleteInvoice = (id: string) => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((i) => i.id !== id),
    }));
  };

  const handleMarkPaid = (invoiceId: string) => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => {
        if (inv.id === invoiceId) {
          return { ...inv, status: 'Paid', amount_paid: inv.total };
        }
        return inv;
      }),
    }));
  };

  // Follow-Up Handlers
  const handleOpenFollowUpModal = (quote?: Quote | null, fu?: FollowUp | null) => {
    setActiveFollowUpQuote(quote || null);
    setActiveFollowUpItem(fu || null);
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = (savedFu: FollowUp) => {
    setState((prev) => {
      const exists = prev.followups.some((f) => f.id === savedFu.id);
      const updated = exists
        ? prev.followups.map((f) => (f.id === savedFu.id ? savedFu : f))
        : [savedFu, ...prev.followups];

      // Also link follow-up id to quote if quote exists
      const updatedQuotes = prev.quotes.map((q) =>
        q.id === savedFu.quote_id ? { ...q, follow_up_id: savedFu.id } : q
      );

      return { ...prev, followups: updated, quotes: updatedQuotes };
    });
  };

  const handleUpdateFollowUpStatus = (id: string, status: FollowUp['status']) => {
    setState((prev) => ({
      ...prev,
      followups: prev.followups.map((f) => (f.id === id ? { ...f, status } : f)),
    }));
  };

  const handleDeleteFollowUp = (id: string) => {
    setState((prev) => ({
      ...prev,
      followups: prev.followups.filter((f) => f.id !== id),
    }));
  };

  // Customer Handlers
  const handleSaveCustomer = async (customer: Customer) => {
    // Determine active authenticated business
    const activeBizId = state.business.id;
    const exists = state.customers.some((c) => c.id === customer.id);

    // If an authenticated business is loaded and has a valid ID, persist to Supabase
    if (activeBizId && session?.user) {
      try {
        if (exists) {
          // Update existing customer in Supabase
          const updated = await updateCustomer(customer.id, customer);
          if (updated) {
            setState((prev) => ({
              ...prev,
              customers: prev.customers.map((c) => (c.id === updated.id ? updated : c)),
            }));
          }
        } else {
          // Create new customer in Supabase under active business_id
          const created = await createCustomer(activeBizId, customer);
          if (created) {
            setState((prev) => ({
              ...prev,
              customers: [created, ...prev.customers.filter((c) => c.id !== customer.id)],
            }));
          }
        }
      } catch (err: any) {
        console.error('[Mathorg] Error persisting customer to database:', err?.message || err);
        // Do not silently pretend local success if database fails
        alert(`Failed to save customer to database: ${err?.message || 'Permission denied or network error'}`);
      }
    } else {
      // Local/offline state fallback
      setState((prev) => {
        const updated = exists
          ? prev.customers.map((c) => (c.id === customer.id ? customer : c))
          : [customer, ...prev.customers];
        return { ...prev, customers: updated };
      });
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    // If authenticated business exists, delete from Supabase first
    if (session?.user && id && !id.startsWith('cust_demo')) {
      try {
        const success = await deleteCustomer(id);
        if (success) {
          setState((prev) => ({
            ...prev,
            customers: prev.customers.filter((c) => c.id !== id),
          }));
        }
      } catch (err: any) {
        console.error('[Mathorg] Error deleting customer from database:', err?.message || err);
        alert(`Failed to delete customer from database: ${err?.message || 'Permission denied or network error'}`);
      }
    } else {
      // Local removal
      setState((prev) => ({
        ...prev,
        customers: prev.customers.filter((c) => c.id !== id),
      }));
    }
  };

  const handleNewQuoteForCustomer = (customer: Customer) => {
    setActiveQuote({
      id: 'quote_' + Date.now(),
      quote_number: generateDocNumber('MAT-Q', state.quotes.length),
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_whatsapp: customer.whatsapp || customer.phone,
      customer_email: customer.email,
      customer_address: customer.address,
      status: 'Draft',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
      })(),
      items: [
        {
          id: 'item_' + Date.now(),
          name: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          unit: 'unit',
          total: 0,
        },
      ],
      subtotal: 0,
      discount_type: 'percent',
      discount_val: 0,
      discount_amount: 0,
      tax_rate: state.business.tax_rate,
      tax_amount: 0,
      total: 0,
      notes: '',
      terms: state.business.terms,
      created_at: new Date().toISOString(),
    });
    setQuoteInitialAIOpen(false);
    setIsQuoteModalOpen(true);
  };

  // Product Handlers
  const handleSaveProduct = async (product: Product) => {
    const activeBizId = state.business.id;
    const exists = state.products.some((p) => p.id === product.id);

    // If an authenticated business is loaded and has a valid ID, persist to Supabase
    if (activeBizId && session?.user) {
      try {
        if (exists) {
          // Update existing product in Supabase
          const updated = await updateProduct(product.id, product);
          if (updated) {
            setState((prev) => ({
              ...prev,
              products: prev.products.map((p) => (p.id === updated.id ? updated : p)),
            }));
          }
        } else {
          // Create new product in Supabase under active business_id
          const created = await createProduct(activeBizId, product);
          if (created) {
            setState((prev) => ({
              ...prev,
              products: [created, ...prev.products.filter((p) => p.id !== product.id)],
            }));
          }
        }
      } catch (err: any) {
        console.error('[Mathorg] Error persisting product to database:', err?.message || err);
        alert(`Failed to save product to database: ${err?.message || 'Permission denied or network error'}`);
      }
    } else {
      // Local/offline state fallback
      setState((prev) => {
        const updated = exists
          ? prev.products.map((p) => (p.id === product.id ? product : p))
          : [product, ...prev.products];
        return { ...prev, products: updated };
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    // If authenticated business exists, delete from Supabase first
    if (session?.user && id && !id.startsWith('prod_demo')) {
      try {
        const success = await deleteProduct(id);
        if (success) {
          setState((prev) => ({
            ...prev,
            products: prev.products.filter((p) => p.id !== id),
          }));
        }
      } catch (err: any) {
        console.error('[Mathorg] Error deleting product from database:', err?.message || err);
        alert(`Failed to delete product from database: ${err?.message || 'Permission denied or network error'}`);
      }
    } else {
      // Local removal
      setState((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
      }));
    }
  };

  // Template Handlers
  const handleSaveTemplate = (template: QuoteTemplate) => {
    setState((prev) => {
      const exists = prev.templates.some((t) => t.id === template.id);
      const updated = exists
        ? prev.templates.map((t) => (t.id === template.id ? template : t))
        : [template, ...prev.templates];
      return { ...prev, templates: updated };
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.filter((t) => t.id !== id),
    }));
  };

  const handleUseTemplateInQuote = (template: QuoteTemplate) => {
    const quoteItems = template.items.map((it, idx) => ({
      id: 'item_' + Date.now() + '_' + idx,
      product_id: it.product_id,
      name: it.name,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      unit: it.unit || 'unit',
      total: it.quantity * it.unit_price,
      isCatalogueMatch: true,
    }));

    const sub = quoteItems.reduce((acc, it) => acc + it.total, 0);
    const tax = (sub * state.business.tax_rate) / 100;

    setActiveQuote({
      id: 'quote_' + Date.now(),
      quote_number: generateDocNumber('MAT-Q', state.quotes.length),
      customer_id: '',
      customer_name: '',
      customer_phone: '',
      customer_whatsapp: '',
      customer_email: '',
      customer_address: '',
      status: 'Draft',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
      })(),
      items: quoteItems,
      subtotal: sub,
      discount_type: 'percent',
      discount_val: 0,
      discount_amount: 0,
      tax_rate: state.business.tax_rate,
      tax_amount: tax,
      total: sub + tax,
      notes: template.description ? `Package: ${template.name} - ${template.description}` : '',
      terms: state.business.terms,
      created_at: new Date().toISOString(),
    });
    setQuoteInitialAIOpen(false);
    setIsQuoteModalOpen(true);
  };

  // Lead & Marketplace Handlers
  const handleOpenNewLead = () => {
    setActiveLead(null);
    setIsLeadModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setActiveLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleSaveLead = async (lead: Lead) => {
    if (session?.user && isUuid(state.business.id)) {
      try {
        if (isUuid(lead.id)) {
          const updated = await updateLead(lead.id, lead);
          if (updated) {
            setState((prev) => ({
              ...prev,
              leads: (prev.leads || []).map((l) => (l.id === updated.id ? updated : l)),
            }));
          }
        } else {
          const created = await createLead(state.business.id, lead);
          if (created) {
            setState((prev) => ({
              ...prev,
              leads: [created, ...(prev.leads || []).filter((l) => l.id !== lead.id)],
            }));
          }
        }
      } catch (err: any) {
        console.warn('[Mathorg] Notice saving lead to database:', err?.message || err);
      }
    } else {
      setState((prev) => {
        const currentLeads = prev.leads || [];
        const exists = currentLeads.some((l) => l.id === lead.id);
        const updated = exists
          ? currentLeads.map((l) => (l.id === lead.id ? lead : l))
          : [lead, ...currentLeads];
        return { ...prev, leads: updated };
      });
    }

    setPaystackToast({
      status: 'success',
      message: `Lead "${lead.customer_name}" added to pipeline!`,
      details: `${lead.lead_number} • Stage: ${lead.status} • Value: ${lead.budget_formatted || 'Open'}`,
    });
  };

  const handleDeleteLead = async (leadId: string) => {
    if (session?.user && isUuid(leadId)) {
      try {
        await deleteLead(leadId);
      } catch (err: any) {
        console.warn('[Mathorg] Notice deleting lead from database:', err?.message || err);
      }
    }
    setState((prev) => ({
      ...prev,
      leads: (prev.leads || []).filter((l) => l.id !== leadId),
    }));
  };

  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    if (session?.user && isUuid(leadId)) {
      try {
        await updateLead(leadId, {
          status,
          won_at: status === 'Won' ? new Date().toISOString() : undefined,
          lost_at: status === 'Lost' ? new Date().toISOString() : undefined,
        });
      } catch (err: any) {
        console.warn('[Mathorg] Notice updating lead status in database:', err?.message || err);
      }
    }

    setState((prev) => ({
      ...prev,
      leads: (prev.leads || []).map((l) =>
        l.id === leadId
          ? {
              ...l,
              status,
              updated_at: new Date().toISOString(),
              won_at: status === 'Won' ? new Date().toISOString() : l.won_at,
              lost_at: status === 'Lost' ? new Date().toISOString() : l.lost_at,
            }
          : l
      ),
    }));
  };

  const handleGenerateInboundLeads = async () => {
    const generated = generateInboundLeads(state.business, 2);
    for (const lead of generated) {
      await handleSaveLead(lead);
    }
    setPaystackToast({
      status: 'success',
      message: `Generated ${generated.length} Inbound Leads!`,
      details: 'High-intent client requests matching your business services added to your pipeline.',
    });
  };

  const handleUnlockLead = async (lead: Lead) => {
    // Authoritative subscription verification (tier + active status + expiry)
    const isPaid = hasActiveSubscription(
      state.business.id,
      state.user.plan,
      state.business.subscription_status,
      state.business.subscription_expires_at
    );
    if (!isPaid) {
      setIsSubscriptionOpen(true);
      return;
    }

    // Atomic claim via database RPC if this lead originates from a customer request
    if (session?.user && isUuid(state.business.id) && lead.customer_request_id && isUuid(lead.customer_request_id)) {
      try {
        const claimResult = await claimCustomerRequest(state.business.id, lead.customer_request_id);
        if (claimResult.lead) {
          setState((prev) => {
            const existingIdx = (prev.leads || []).findIndex((l) => l.id === lead.id || l.id === claimResult.lead!.id);
            const updatedLeads = [...(prev.leads || [])];
            if (existingIdx >= 0) {
              updatedLeads[existingIdx] = claimResult.lead!;
            } else {
              updatedLeads.unshift(claimResult.lead!);
            }
            return {
              ...prev,
              leads: updatedLeads,
            };
          });
          return;
        }
      } catch (err: any) {
        console.warn('[Mathorg] Notice claiming customer request via atomic RPC:', err?.message || err);
      }
    }

    if (session?.user && isUuid(state.business.id) && !isUuid(lead.id)) {
      try {
        const persistedLead = await createLead(state.business.id, {
          ...lead,
          is_locked: false,
          status: lead.status === 'New' ? 'Contacted' : lead.status,
        });
        if (persistedLead) {
          setState((prev) => ({
            ...prev,
            leads: (prev.leads || []).map((l) => (l.id === lead.id ? persistedLead : l)),
          }));
          return;
        }
      } catch (err: any) {
        console.warn('[Mathorg] Notice persisting unlocked lead:', err?.message || err);
      }
    }

    setState((prev) => ({
      ...prev,
      leads: (prev.leads || []).map((l) =>
        l.id === lead.id
          ? {
              ...l,
              is_locked: false,
              status: l.status === 'New' ? 'Contacted' : l.status,
            }
          : l
      ),
    }));
  };

  const handleConvertToQuoteForLead = (lead: Lead) => {
    if (
      lead.is_locked &&
      !hasActiveSubscription(
        state.business.id,
        state.user.plan,
        state.business.subscription_status,
        state.business.subscription_expires_at
      )
    ) {
      setIsSubscriptionOpen(true);
      return;
    }

    const quoteNumber = generateDocNumber('MAT-Q', state.quotes.length);
    const hasAttachedProducts = Array.isArray(lead.attached_products) && lead.attached_products.length > 0;
    
    // If products were attached in lead, populate quote items with them
    const items: QuoteItem[] = hasAttachedProducts
      ? lead.attached_products!.map((p, idx) => ({
          id: 'item_' + Date.now() + '_' + idx,
          product_id: p.product_id,
          name: p.name,
          description: p.category ? `Catalogue category: ${p.category}` : (lead.notes || ''),
          quantity: p.quantity,
          unit_price: p.unit_price,
          unit: p.unit || 'unit',
          total: p.total || (p.quantity * p.unit_price),
          isCatalogueMatch: true,
        }))
      : [
          {
            id: 'item_' + Date.now(),
            name: lead.service_required,
            description: lead.notes || (lead.requirements_list ? lead.requirements_list.join(', ') : ''),
            quantity: 1,
            unit_price: lead.budget_min || 0,
            unit: 'job',
            total: lead.budget_min || 0,
          },
        ];

    const subtotal: number = hasAttachedProducts
      ? items.reduce((sum: number, item: QuoteItem) => sum + (item.total || 0), 0)
      : (lead.budget_min || 0);
    const tax: number = (subtotal * state.business.tax_rate) / 100;

    const fullAddress = lead.address
      ? `${lead.address}${lead.location ? ', ' + lead.location : ''}`
      : lead.location;

    const newQuote: Quote = {
      id: 'quote_' + Date.now(),
      quote_number: quoteNumber,
      customer_id: lead.customer_id || '',
      customer_name: lead.customer_name,
      customer_phone: lead.phone,
      customer_whatsapp: lead.whatsapp || lead.phone,
      customer_email: lead.email || '',
      customer_address: fullAddress,
      status: 'Draft',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
      })(),
      items,
      subtotal,
      discount_type: 'percent',
      discount_val: 0,
      discount_amount: 0,
      tax_rate: state.business.tax_rate,
      tax_amount: tax,
      total: subtotal + tax,
      notes: `Quotation prepared for Lead ${lead.lead_number}. Timeline: ${lead.timeline || 'Flexible'}. Location: ${fullAddress}.`,
      terms: state.business.terms,
      created_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      leads: (prev.leads || []).map((l) =>
        l.id === lead.id
          ? {
              ...l,
              status: 'Quoted',
              quote_id: newQuote.id,
              quote_number: newQuote.quote_number,
              updated_at: new Date().toISOString(),
            }
          : l
      ),
    }));

    setActiveQuote(newQuote);
    setQuoteInitialAIOpen(false);
    setIsQuoteModalOpen(true);
  };

  const handleSubmitServiceRequest = (newLead: Lead) => {
    setState((prev) => ({
      ...prev,
      leads: [newLead, ...(prev.leads || [])],
    }));
    setIsServiceRequestModalOpen(false);
    setActiveTab('leads');
  };

  // Settings & Plan Handlers
  const handleSaveBusiness = (updatedBiz: BusinessProfile) => {
    setState((prev) => ({ ...prev, business: updatedBiz }));
    registerBusinessToDirectory(updatedBiz);
    autoCreateServicesFromBusinessProfile(updatedBiz);
    if (session?.user?.id && updatedBiz.id && updatedBiz.id !== 'biz_mathorg_demo_1') {
      updateBusiness(updatedBiz.id, {
        name: updatedBiz.business_name,
        email: updatedBiz.email || null,
        phone: updatedBiz.phone || null,
        address: updatedBiz.address || null,
        country: updatedBiz.country || null,
        currency: updatedBiz.currency || null,
        tax_rate: updatedBiz.tax_rate,
        logo_url: updatedBiz.logo || null,
        terms: updatedBiz.terms || null,
        payment_details: JSON.stringify(updatedBiz.payment_details),
      }).catch(err => {
        console.error('[Mathorg] Failed to sync business update to Supabase:', err);
      });
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setState((prev) => ({ ...prev, user: updatedUser }));
  };

  const handleSelectPlan = (newPlan: PlanTier) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, plan: newPlan },
    }));
  };

  const handleIncrementAICount = () => {
    setState((prev) => ({
      ...prev,
      aiUsage: {
        ...prev.aiUsage,
        count: prev.aiUsage.count + 1,
      },
    }));
  };

  const handleResetData = () => {
    setState(initialData);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Navigation items config
  const marketplaceCount = (state.leads || []).filter((l) => l.source === 'marketplace').length;
  const totalLeadsCount = (state.leads || []).length;

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'matthew' as const,
      label: 'Matthew AI',
      icon: Sparkles,
      badgeColor: 'bg-emerald-600 text-white font-bold shadow-xs',
    },
    {
      id: 'leads' as const,
      label: 'Pipeline & Leads',
      icon: Target,
      count: totalLeadsCount,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      id: 'marketplace' as const,
      label: 'Find Buyer Leads',
      icon: Sparkles,
      count: marketplaceCount,
      badgeColor: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    },
    { id: 'quotes' as const, label: 'Quotes', icon: FileText, count: (state.quotes || []).length },
    { id: 'invoices' as const, label: 'Invoices', icon: CreditCard, count: (state.invoices || []).length },
    { id: 'customers' as const, label: 'Customers', icon: Users, count: (state.customers || []).length },
    { id: 'products' as const, label: 'Catalogue', icon: Package, count: (state.products || []).length },
    { id: 'templates' as const, label: 'Templates', icon: Layers, count: (state.templates || []).length },
    {
      id: 'followups' as const,
      label: 'Follow-Ups',
      icon: Clock,
      count: (state.followups || []).filter((f) => f.status === 'pending').length,
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
  ];

  const isAuthorized = Boolean(session || isGuest);

  // SEO Navigation Handlers
  const navigateToBlog = (slug?: string) => {
    if (slug) {
      window.history.pushState({}, '', `/blog/${slug}`);
      setCurrentRoute({ view: 'blog-article', blogSlug: slug });
    } else {
      window.history.pushState({}, '', '/blog');
      setCurrentRoute({ view: 'blog' });
    }
  };

  const navigateToServices = (serviceSlug?: string, locationSlug?: string) => {
    const s = serviceSlug || 'all';
    if (s === 'all') {
      if (locationSlug) {
        window.history.pushState({}, '', `/services?location=${locationSlug}`);
        setCurrentRoute({ view: 'services', serviceSlug: 'all', locationSlug });
      } else {
        window.history.pushState({}, '', `/services`);
        setCurrentRoute({ view: 'services', serviceSlug: 'all' });
      }
    } else {
      if (locationSlug) {
        window.history.pushState({}, '', `/services/${s}/${locationSlug}`);
        setCurrentRoute({ view: 'services', serviceSlug: s, locationSlug });
      } else {
        window.history.pushState({}, '', `/services/${s}`);
        setCurrentRoute({ view: 'services', serviceSlug: s });
      }
    }
  };

  const navigateToLocations = (locationSlug?: string) => {
    if (locationSlug) {
      window.history.pushState({}, '', `/locations/${locationSlug}`);
      setCurrentRoute({ view: 'locations', locationSlug });
    } else {
      window.history.pushState({}, '', '/locations');
      setCurrentRoute({ view: 'locations' });
    }
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoute({ view: 'landing' });
    setCurrentView('landing');
  };

  // SEO Service Request Handler
  const handleOpenSeoRequest = (serviceName?: string, locationName?: string) => {
    setSeoPrefillService(serviceName || '');
    setSeoPrefillLocation(locationName || '');
    setIsSeoQuickRequestOpen(true);
  };

  // 1. Blog Article View (/blog/[slug])
  if (currentRoute.view === 'blog-article' && currentRoute.blogSlug) {
    return (
      <>
        <SplashScreen />
        <BlogArticlePage
          slug={currentRoute.blogSlug}
          onNavigateHome={navigateToHome}
          onNavigateBlog={() => navigateToBlog()}
          onSelectArticle={(slug) => navigateToBlog(slug)}
          onNavigateServiceLocation={(s, l) => navigateToServices(s, l)}
          onFindPros={(cat) => navigateToServices(cat)}
          onPostRequest={(serv) => handleOpenSeoRequest(serv)}
          onJoinAsBusiness={() => {
            if (isAuthorized) {
              setCurrentRoute({ view: 'app' });
              setCurrentView('app');
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        />

        {/* Quick Request Modal for SEO conversions */}
        <QuickRequestModal
          isOpen={isSeoQuickRequestOpen}
          onClose={() => setIsSeoQuickRequestOpen(false)}
          prefilledService={seoPrefillService}
          prefilledLocation={seoPrefillLocation}
          onSuccessSubmit={handleSubmitServiceRequest}
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
        />
      </>
    );
  }

  // 2. Blog Homepage View (/blog)
  if (currentRoute.view === 'blog') {
    return (
      <>
        <SplashScreen />
        <BlogHomePage
          onSelectArticle={(slug) => navigateToBlog(slug)}
          onNavigateHome={navigateToHome}
          onNavigateServices={(s, l) => navigateToServices(s, l)}
          onNavigateLocations={(l) => navigateToLocations(l)}
          onPostRequest={() => handleOpenSeoRequest()}
        />

        <QuickRequestModal
          isOpen={isSeoQuickRequestOpen}
          onClose={() => setIsSeoQuickRequestOpen(false)}
          prefilledService={seoPrefillService}
          prefilledLocation={seoPrefillLocation}
          onSuccessSubmit={handleSubmitServiceRequest}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
        />
      </>
    );
  }

  // 3. Local Service Discovery Page (/services/[service]/[location])
  if (currentRoute.view === 'services') {
    return (
      <>
        <SplashScreen />
        <ServiceLocationPage
          serviceSlug={currentRoute.serviceSlug || 'all'}
          locationSlug={currentRoute.locationSlug}
          citySlug={currentRoute.citySlug}
          onNavigateHome={navigateToHome}
          onNavigateService={(s, l) => navigateToServices(s, l)}
          onNavigateLocation={(l, s) => (s ? navigateToServices(s, l) : navigateToLocations(l))}
          onNavigateArticle={(slug) => navigateToBlog(slug)}
          onSelectProfessional={(pro) => setSeoSelectedProfessional(pro)}
          onPostRequest={(serv, loc) => handleOpenSeoRequest(serv, loc)}
          onJoinAsBusiness={() => {
            if (isAuthorized) {
              setCurrentRoute({ view: 'app' });
              setCurrentView('app');
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        />

        <ProfessionalProfileModal
          professional={seoSelectedProfessional}
          isOpen={Boolean(seoSelectedProfessional)}
          onClose={() => setSeoSelectedProfessional(null)}
          onRequestQuote={(prof) => {
            handleOpenSeoRequest(
              prof.specialization || prof.business_name,
              prof.city ? `${prof.city}, ${prof.state}` : prof.state
            );
          }}
        />

        <QuickRequestModal
          isOpen={isSeoQuickRequestOpen}
          onClose={() => setIsSeoQuickRequestOpen(false)}
          prefilledService={seoPrefillService}
          prefilledLocation={seoPrefillLocation}
          onSuccessSubmit={handleSubmitServiceRequest}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
        />
      </>
    );
  }

  // 4. Locations Hub Page (/locations and /locations/[location])
  if (currentRoute.view === 'locations') {
    return (
      <>
        <SplashScreen />
        <LocationHubPage
          locationSlug={currentRoute.locationSlug}
          onNavigateHome={navigateToHome}
          onNavigateLocation={(l) => navigateToLocations(l)}
          onNavigateServiceLocation={(s, l) => navigateToServices(s, l)}
          onNavigateArticle={(slug) => navigateToBlog(slug)}
          onSelectProfessional={(pro) => setSeoSelectedProfessional(pro)}
          onPostRequest={(serv, loc) => handleOpenSeoRequest(serv, loc)}
          onJoinAsBusiness={() => {
            if (isAuthorized) {
              setCurrentRoute({ view: 'app' });
              setCurrentView('app');
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        />

        <ProfessionalProfileModal
          professional={seoSelectedProfessional}
          isOpen={Boolean(seoSelectedProfessional)}
          onClose={() => setSeoSelectedProfessional(null)}
          onRequestQuote={(prof) => {
            handleOpenSeoRequest(
              prof.specialization || prof.business_name,
              prof.city ? `${prof.city}, ${prof.state}` : prof.state
            );
          }}
        />

        <QuickRequestModal
          isOpen={isSeoQuickRequestOpen}
          onClose={() => setIsSeoQuickRequestOpen(false)}
          prefilledService={seoPrefillService}
          prefilledLocation={seoPrefillLocation}
          onSuccessSubmit={handleSubmitServiceRequest}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentRoute({ view: 'app' });
            setCurrentView('app');
          }}
        />
      </>
    );
  }

  // 5. Landing Page / Main Marketplace
  if (currentView === 'landing' || !isAuthorized) {
    return (
      <>
        <SplashScreen />
        <LandingPage
          business={state.business}
          currentUser={state.user}
          initialService={seoPrefillService}
          initialLocation={seoPrefillLocation}
          onOpenNewQuote={(withAI) => {
            if (isAuthorized) {
              setCurrentView('app');
              handleOpenNewQuote(withAI);
            } else {
              setIsLoginModalOpen(true);
            }
          }}
          onOpenNewInvoice={() => {
            if (isAuthorized) {
              setCurrentView('app');
              handleOpenNewInvoice();
            } else {
              setIsLoginModalOpen(true);
            }
          }}
          onEnterApp={handleEnterAppClick}
          onNavigateBusiness={() => {
            try {
              window.history.pushState({}, '', '/business');
            } catch {
              // ignore
            }
            if (isAuthorized) {
              setCurrentRoute({ view: 'app' });
              setCurrentView('app');
            } else {
              setLoginModalMode('register');
              setIsLoginModalOpen(true);
            }
          }}
          onNavigateBlog={(slug) => navigateToBlog(slug)}
          onNavigateServices={(s, l) => navigateToServices(s, l)}
          onNavigateLocations={(l) => navigateToLocations(l)}
          onPromptLogin={() => {
            setLoginModalMode('login');
            setIsLoginModalOpen(true);
          }}
          onPromptRegister={() => {
            setLoginModalMode('register');
            setIsLoginModalOpen(true);
          }}
          onNewLeadCreated={handleSubmitServiceRequest}
        />

        {/* Login & Business Registration Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          initialMode={loginModalMode}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestAccess={() => {
            setIsGuest(true);
            setCurrentView('app');
          }}
        />

        {/* Quote Editor Modal */}
        {isQuoteModalOpen && (
          <QuoteEditorModal
            isOpen={isQuoteModalOpen}
            onClose={() => setIsQuoteModalOpen(false)}
            quote={activeQuote}
            state={state}
            onSaveQuote={handleSaveQuote}
            onConvertToInvoice={handleConvertToInvoice}
            onOpenFollowUpModal={(q) => handleOpenFollowUpModal(q, null)}
            onSaveNewCustomer={handleSaveCustomer}
            onIncrementAICount={handleIncrementAICount}
            initialAIPromptOpen={quoteInitialAIOpen}
          />
        )}

        {/* Invoice Editor Modal */}
        {isInvoiceModalOpen && (
          <InvoiceEditorModal
            isOpen={isInvoiceModalOpen}
            onClose={() => setIsInvoiceModalOpen(false)}
            invoice={activeInvoice}
            state={state}
            onSaveInvoice={handleSaveInvoice}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B192C] flex flex-col selection:bg-[#3D74D9] selection:text-white">
      <SplashScreen />
      {/* Offline Alert Indicator */}
      <OfflineIndicator />

      {/* Top Navbar matching header structure */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E9F0] px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm">
        {/* Brand & Business Tag */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-left group"
            title="Configure business profile"
          >
            <div className="w-9 h-9 rounded-2xl bg-[#0B192C] p-0.5 shadow-sm group-hover:scale-105 transition flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="Matthorg" 
                className="w-full h-full object-cover rounded-[14px]" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} 
              />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5B6D85] flex items-center gap-1">
                <span>Sales Hub</span>
              </div>
              <div className="text-sm font-black tracking-tight text-[#0B192C] flex items-center gap-1.5">
                <span>MATHORG</span>
              </div>
            </div>
          </button>

          {/* Business Switch / Settings Trigger (Location/Profile style from design) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hidden md:flex items-center gap-2 text-xs text-[#5B6D85] hover:text-[#0B192C] px-3 py-1.5 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] transition group"
            title="Configure business profile, logo, currency and bank details"
          >
            <Building2 className="w-3.5 h-3.5 text-[#3D74D9]" />
            <span className="truncate max-w-[150px] font-semibold text-[#0B192C]">{state.business.business_name}</span>
            <span className="text-[#5B6D85] group-hover:text-[#0B192C] text-[10px]">⌄</span>
          </button>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Public Marketplace Link */}
          <button
            onClick={() => {
              try {
                window.history.pushState({}, '', '/');
              } catch {
                // ignore
              }
              setCurrentRoute({ view: 'landing' });
              setCurrentView('landing');
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] text-xs font-semibold text-[#5B6D85] hover:text-[#0B192C] hover:border-[#D1D8E5] transition"
            title="Browse Public Marketplace & Customer Requests"
          >
            <Globe className="w-3.5 h-3.5 text-[#3D74D9]" />
            <span className="hidden md:inline">Marketplace</span>
          </button>

          {/* Guides / Blog Quick Link */}
          <button
            onClick={() => {
              try {
                window.history.pushState({}, '', '/blog');
              } catch {
                // ignore
              }
              setCurrentRoute({ view: 'blog' });
            }}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] text-xs font-semibold text-[#3D74D9] hover:text-[#0B192C] hover:border-[#D1D8E5] transition"
            title="MatthOrg Guides & Local SEO"
          >
            <span className="hidden md:inline">Guides</span>
          </button>

          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] text-xs font-semibold text-[#5B6D85] hover:text-[#0B192C] hover:border-[#D1D8E5] transition"
            title="Log out"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden md:inline">Log out</span>
          </button>

          {/* AI Quota Pill */}
          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] text-xs text-[#5B6D85] hover:border-[#3D74D9]/50 hover:text-[#3D74D9] transition"
            title="AI Quote drafts used this month"
          >
            <Sparkles className="w-3 h-3 text-[#3D74D9]" />
            <span className="text-[11px] font-medium">
              AI: <strong>{state.aiUsage.count}</strong>/
              {state.user.plan === 'free' ? '3' : state.user.plan === 'pro' ? '50' : '200'}
            </span>
          </button>

          {/* Plan Badge */}
          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-lg border transition ${
              state.user.plan === 'pro'
                ? 'bg-[#3D74D9]/10 text-[#3D74D9] border-[#3D74D9]/20'
                : state.user.plan === 'business'
                ? 'bg-[#2E7D32]/10 text-emerald-700 border-emerald-500/20'
                : 'bg-white text-[#5B6D85] border-[#E5E9F0] hover:border-[#D1D8E5]'
            }`}
          >
            {state.user.plan}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton compact />

          {/* New Quote Quick CTA */}
          <button
            onClick={() => handleOpenNewQuote(false)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Quote</span>
          </button>

          {/* Settings icon */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-[#F4F7FB] hover:bg-[#E8EEF5] text-[#5B6D85] hover:text-[#0B192C] border border-[#E5E9F0] transition"
            title="Business Settings & Profile"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#F4F7FB] text-[#5B6D85] hover:text-[#0B192C] border border-[#E5E9F0]"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Paystack Payment Status Banner Toast */}
      {paystackToast && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3">
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg border text-xs transition-all ${
              paystackToast.status === 'loading'
                ? 'bg-blue-50 border-blue-200 text-blue-950'
                : paystackToast.status === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-2 ring-emerald-400/20'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {paystackToast.status === 'loading' ? (
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : paystackToast.status === 'success' ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  ✓
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  !
                </div>
              )}
              <div>
                <strong className="font-bold text-sm block">{paystackToast.message}</strong>
                {paystackToast.details && (
                  <p className="text-[11px] opacity-80 mt-0.5 font-mono">{paystackToast.details}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setPaystackToast(null)}
              className="p-1.5 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-900 transition text-xs font-semibold"
            >
              ✕ Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 gap-6">
        {/* Desktop Navigation Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F9FB5] px-3 py-1.5">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#3D74D9]/10 text-[#3D74D9] font-bold'
                    : 'text-[#5B6D85] hover:text-[#0B192C] hover:bg-white border border-transparent hover:border-[#E5E9F0]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      item.badgeColor || (isActive ? 'bg-[#3D74D9]/20 text-[#3D74D9]' : 'bg-white text-[#5B6D85] border border-[#E5E9F0]')
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-5 mt-5 border-t border-[#E5E9F0]">
            <div className="p-4 rounded-2xl bg-white border border-[#E5E9F0] shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#3D74D9]/10 text-[#3D74D9] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#0B192C]">AI Assistant</span>
              </div>
              <p className="text-[11px] text-[#5B6D85] leading-relaxed">
                Describe customer requests in plain English to auto-draft line items matching your saved catalogue prices.
              </p>
              <button
                onClick={() => handleOpenNewQuote(true)}
                className="w-full py-2 rounded-xl bg-[#F4F7FB] hover:bg-[#E8EEF5] text-[#3D74D9] text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Draft Quote with AI</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-16 lg:pb-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              state={state}
              onOpenNewQuote={handleOpenNewQuote}
              onOpenNewInvoice={handleOpenNewInvoice}
              onOpenQuote={handleOpenQuote}
              onOpenInvoice={handleOpenInvoice}
              onUpdateQuoteStatus={handleUpdateQuoteStatus}
              onUpdateFollowUpStatus={handleUpdateFollowUpStatus}
              onRescheduleFollowUp={(fu) => handleOpenFollowUpModal(null, fu)}
              onConvertToInvoice={handleConvertToInvoice}
              onOpenSubscription={() => setIsSubscriptionOpen(true)}
              onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
              onNavigateToLeads={() => setActiveTab('leads')}
              onNavigateToMarketplace={() => setActiveTab('marketplace')}
              onNavigateToQuotes={() => setActiveTab('quotes')}
              onNavigateToInvoices={() => setActiveTab('invoices')}
              onNavigateToSettings={() => setIsSettingsOpen(true)}
              onOpenNewLead={handleOpenNewLead}
              onOpenServiceRequest={() => setIsServiceRequestModalOpen(true)}
              onConvertToQuoteForLead={handleConvertToQuoteForLead}
              onNavigateToMatthew={(prompt) => {
                setMatthewInitialPrompt(prompt);
                setActiveTab('matthew');
              }}
              onOpenMessageModal={(target) => {
                setActiveMessageTarget(target);
                setIsMessageModalOpen(true);
              }}
              onOpenLeadModal={(lead) => {
                setActiveLead(lead);
                setIsLeadModalOpen(true);
              }}
              onOpenFollowUpsTab={() => setActiveTab('followups')}
              onDeleteQuote={handleDeleteQuote}
              onDeleteInvoice={handleDeleteInvoice}
              onDeleteFollowUp={handleDeleteFollowUp}
              onGenerateInboundLeads={handleGenerateInboundLeads}
            />
          )}

          {activeTab === 'matthew' && (
            <MatthewView
              state={state}
              initialPrompt={matthewInitialPrompt}
              onOpenLead={(lead) => {
                setActiveLead(lead);
                setIsLeadModalOpen(true);
              }}
              onOpenQuote={(quote) => {
                setActiveQuote(quote);
                setIsQuoteModalOpen(true);
              }}
              onOpenInvoice={(invoice) => {
                setActiveInvoice(invoice);
                setIsInvoiceModalOpen(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView
              leads={state.leads || []}
              business={state.business}
              currentUserPlan={state.user.plan}
              state={state}
              onOpenNewLead={handleOpenNewLead}
              onEditLead={handleEditLead}
              onDeleteLead={handleDeleteLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUnlockLead={handleUnlockLead}
              onConvertToQuote={handleConvertToQuoteForLead}
              onOpenServiceRequest={() => setIsServiceRequestModalOpen(true)}
              onOpenSubscription={() => setIsSubscriptionOpen(true)}
              onNavigateToMatthew={(prompt) => {
                setMatthewInitialPrompt(prompt);
                setActiveTab('matthew');
              }}
              onOpenMessageModal={(target) => {
                setActiveMessageTarget(target);
                setIsMessageModalOpen(true);
              }}
            />
          )}

          {activeTab === 'marketplace' && (
            <FindLeadsView
              leads={state.leads || []}
              business={state.business}
              currentUserPlan={state.user.plan}
              onUnlockLead={handleUnlockLead}
              onConvertToQuote={handleConvertToQuoteForLead}
              onOpenServiceRequest={() => setIsServiceRequestModalOpen(true)}
              onOpenSubscription={() => setIsSubscriptionOpen(true)}
              onNewLeadCreated={handleSubmitServiceRequest}
            />
          )}

          {activeTab === 'quotes' && (
            <QuotesView
              quotes={state.quotes}
              business={state.business}
              onOpenQuote={handleOpenQuote}
              onNewQuote={handleOpenNewQuote}
              onDeleteQuote={handleDeleteQuote}
              onConvertToInvoice={handleConvertToInvoice}
              onOpenFollowUpModal={(q) => handleOpenFollowUpModal(q, null)}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              invoices={state.invoices}
              business={state.business}
              onOpenInvoice={handleOpenInvoice}
              onNewInvoice={handleOpenNewInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onMarkPaid={handleMarkPaid}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={state.customers}
              quotes={state.quotes}
              invoices={state.invoices}
              business={state.business}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onNewQuoteForCustomer={handleNewQuoteForCustomer}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={state.products}
              business={state.business}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesView
              templates={state.templates}
              products={state.products}
              business={state.business}
              onSaveTemplate={handleSaveTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onUseTemplate={handleUseTemplateInQuote}
            />
          )}

          {activeTab === 'followups' && (
            <FollowUpsView
              followups={state.followups}
              quotes={state.quotes}
              business={state.business}
              onUpdateStatus={handleUpdateFollowUpStatus}
              onReschedule={(fu) => handleOpenFollowUpModal(null, fu)}
              onDeleteFollowUp={handleDeleteFollowUp}
              onConvertToInvoice={handleConvertToInvoice}
              onOpenMessageModal={(target) => {
                setActiveMessageTarget(target);
                setIsMessageModalOpen(true);
              }}
            />
          )}

          {/* Workspace Footer with Legal, Terms, and Status */}
          <footer className="mt-12 pt-6 pb-20 lg:pb-6 border-t border-[#E5E9F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8F9FB5]">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-[#0B192C] p-0.5 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="Matthorg" 
                  className="w-full h-full object-contain rounded-xs" 
                  onError={(e) => (e.currentTarget.style.display = 'none')} 
                />
              </div>
              <span>© {new Date().getFullYear()} Matthorg Technologies • Quotations. Invoices. Follow Ups.</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <button
                type="button"
                onClick={() => openLegalModal('privacy')}
                className="hover:text-[#0B192C] transition font-medium"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openLegalModal('terms')}
                className="hover:text-[#0B192C] transition font-medium"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openLegalModal('refund')}
                className="hover:text-[#0B192C] transition font-medium"
              >
                Refund Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openLegalModal('security')}
                className="hover:text-[#0B192C] transition font-medium"
              >
                Security & Compliance
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Matching design layout) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E9F0] px-3 py-1.5 flex items-center justify-around pb-safe">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex flex-col items-center py-1 px-2 rounded-xl transition relative group"
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'dashboard' ? 'text-[#0B192C] font-bold' : 'text-[#8F9FB5]'}`}>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className="flex flex-col items-center py-1 px-2 rounded-xl transition relative group"
        >
          <div className="relative">
            <Target className={`w-5 h-5 ${activeTab === 'leads' ? 'text-emerald-600' : 'text-[#8F9FB5]'}`} />
            {(state.leads || []).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${activeTab === 'leads' ? 'text-[#0B192C] font-bold' : 'text-[#8F9FB5]'}`}>Leads</span>
        </button>

        {/* Center Primary Action Button */}
        <button
          onClick={() => handleOpenNewQuote(false)}
          className="flex flex-col items-center -mt-6 bg-[#0B192C] text-white p-3.5 rounded-2xl shadow-lg shadow-[#0B192C]/20 active:scale-95 transition border-4 border-white"
          title="Create New Quote"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className="flex flex-col items-center py-1 px-2 rounded-xl transition relative group"
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${activeTab === 'quotes' ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
            {(state.quotes || []).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#3D74D9]" />
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${activeTab === 'quotes' ? 'text-[#0B192C] font-bold' : 'text-[#8F9FB5]'}`}>Quotes</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-2 rounded-xl transition relative group"
        >
          <Menu className={`w-5 h-5 ${isMobileMenuOpen ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
          <span className="text-[10px] text-[#8F9FB5] mt-0.5">More</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B192C]/80 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-72 bg-white border-l border-[#E5E9F0] h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F0]">
                <div className="text-xs font-bold text-[#0B192C] uppercase tracking-wider">Mathorg Menu</div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#5B6D85] hover:text-[#0B192C] bg-[#F4F7FB]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-[#3D74D9]/10 text-[#3D74D9]'
                          : 'text-[#5B6D85] hover:bg-[#F4F7FB]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-mono text-[#5B6D85] border border-[#E5E9F0]">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#E5E9F0] space-y-2">
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#5B6D85] hover:bg-[#F4F7FB] transition"
                >
                  <Settings className="w-4 h-4 text-[#8F9FB5]" />
                  <span>Business Settings</span>
                </button>
                <button
                  onClick={() => {
                    setIsSubscriptionOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#5B6D85] hover:bg-[#F4F7FB] transition"
                >
                  <Zap className="w-4 h-4 text-[#3D74D9]" />
                  <span>Plans & Pricing</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Log out</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E9F0] text-[11px] text-[#8F9FB5]">
              Mathorg V1 • Create. Send. Follow Up. Get Paid.
            </div>
          </div>
        </div>
      )}

      {/* Lead Editor Modal */}
      {isLeadModalOpen && (
        <LeadEditorModal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          lead={activeLead}
          state={state}
          business={state.business}
          existingProducts={state.products}
          onSaveLead={handleSaveLead}
          onConvertToQuote={handleConvertToQuoteForLead}
          onSaveProduct={handleSaveProduct}
        />
      )}

      {/* Service Request / Consumer Marketplace Portal Modal */}
      {isServiceRequestModalOpen && (
        <ServiceRequestModal
          isOpen={isServiceRequestModalOpen}
          onClose={() => setIsServiceRequestModalOpen(false)}
          business={state.business}
          onSubmitRequest={handleSubmitServiceRequest}
        />
      )}

      {/* Quote Editor Modal */}
      {isQuoteModalOpen && (
        <QuoteEditorModal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          quote={activeQuote}
          state={state}
          onSaveQuote={handleSaveQuote}
          onConvertToInvoice={handleConvertToInvoice}
          onOpenFollowUpModal={(q) => handleOpenFollowUpModal(q, null)}
          onSaveNewCustomer={handleSaveCustomer}
          onSaveProduct={handleSaveProduct}
          onIncrementAICount={handleIncrementAICount}
          initialAIPromptOpen={quoteInitialAIOpen}
        />
      )}

      {/* Invoice Editor Modal */}
      {isInvoiceModalOpen && (
        <InvoiceEditorModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          invoice={activeInvoice}
          state={state}
          onSaveInvoice={handleSaveInvoice}
          onSaveProduct={handleSaveProduct}
        />
      )}

      {/* Follow-Up Scheduler Modal */}
      {isFollowUpModalOpen && (
        <FollowUpModal
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          quote={activeFollowUpQuote}
          existingFollowUp={activeFollowUpItem}
          business={state.business}
          onSaveFollowUp={handleSaveFollowUp}
        />
      )}

      {/* Matthew Message Drafting & Approval Modal */}
      {isMessageModalOpen && activeMessageTarget && (
        <MatthewMessageModal
          isOpen={isMessageModalOpen}
          onClose={() => {
            setIsMessageModalOpen(false);
            setActiveMessageTarget(null);
          }}
          target={activeMessageTarget}
          business={state.business}
          onCompleteFollowUp={(id) => handleUpdateFollowUpStatus(id, 'completed')}
          onSnoozeFollowUp={(id, days) => {
            setState((prev) => ({
              ...prev,
              followups: prev.followups.map((f) => {
                if (f.id === id) {
                  const d = new Date();
                  d.setDate(d.getDate() + days);
                  return { ...f, reminder_date: d.toISOString().split('T')[0], status: 'snoozed' as const };
                }
                return f;
              }),
            }));
          }}
          onMarkWonClosed={(target) => {
            if (target.targetType === 'lead') {
              handleUpdateLeadStatus(target.targetId, 'Won');
            } else if (target.targetType === 'quote') {
              handleUpdateQuoteStatus(target.targetId, 'Accepted');
            } else if (target.targetType === 'invoice') {
              handleMarkPaid(target.targetId);
            }
          }}
        />
      )}

      {/* Business Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          business={state.business}
          user={state.user}
          onSaveBusiness={handleSaveBusiness}
          onUpdateUser={handleUpdateUser}
          onResetData={handleResetData}
          onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
          onViewPublicArticle={(slug) => navigateToBlog(slug)}
        />
      )}

      {/* Business Verification Modal */}
      {isVerificationModalOpen && (
        <BusinessVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          business={state.business}
          onUpdateBusiness={handleSaveBusiness}
        />
      )}

      {/* Subscription Plans Modal */}
      {isSubscriptionOpen && (
        <SubscriptionModal
          isOpen={isSubscriptionOpen}
          onClose={() => setIsSubscriptionOpen(false)}
          state={state}
          onSelectPlan={handleSelectPlan}
        />
      )}

      {/* Login & Account Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onGuestAccess={() => {
          setIsGuest(true);
          setCurrentView('app');
        }}
      />

      {/* Privacy, Terms, Refund & Security Legal Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        type={legalModalType}
      />
    </div>
  );
}

export default App;
