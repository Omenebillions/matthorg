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
} from './types';
import { initialData } from './data/initialData';
import { DashboardView } from './components/DashboardView';
import { QuotesView } from './components/QuotesView';
import { InvoicesView } from './components/InvoicesView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { TemplatesView } from './components/TemplatesView';
import { FollowUpsView } from './components/FollowUpsView';
import { QuoteEditorModal } from './components/QuoteEditorModal';
import { InvoiceEditorModal } from './components/InvoiceEditorModal';
import { FollowUpModal } from './components/FollowUpModal';
import { SettingsModal } from './components/SettingsModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { SplashScreen } from './components/SplashScreen';
import { LegalModal, LegalDocType } from './components/LegalModal';
import { supabase, onSupabaseInit, ensureSupabase } from './lib/supabase';
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
        if (parsed?.business?.business_name?.includes('Apex Solar')) {
          parsed.business.business_name = 'Matthorg Enterprise';
          if (parsed.business.email === 'sales@apexsolar.ng') parsed.business.email = 'billing@matthorg.com';
          if (parsed.business.payment_details?.account_name?.includes('Apex Solar')) {
            parsed.business.payment_details.account_name = 'Matthorg Enterprise';
          }
          if (parsed.user?.email === 'david@apexsolar.ng') parsed.user.email = 'david@matthorg.com';
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved state from localStorage:', e);
    }
    return initialData;
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'quotes' | 'invoices' | 'customers' | 'products' | 'templates' | 'followups'
  >('dashboard');

  // Mobile menu drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [quoteInitialAIOpen, setQuoteInitialAIOpen] = useState(false);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [activeFollowUpQuote, setActiveFollowUpQuote] = useState<Quote | null>(null);
  const [activeFollowUpItem, setActiveFollowUpItem] = useState<FollowUp | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalDocType>('privacy');
  const [isGuest, setIsGuest] = useState(false);
  const [currentView, setCurrentView] = useState<'landing' | 'app'>(() => {
    try {
      if (localStorage.getItem('mathorg_custom_session')) return 'app';
    } catch {
      // ignore
    }
    return 'landing';
  });

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

  // Handle PWA / TWA deep link shortcuts (e.g. ?action=new-quote)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'new-quote') {
      setCurrentView('app');
      handleOpenNewQuote(false);
    } else if (action === 'new-invoice') {
      setCurrentView('app');
      handleOpenNewInvoice();
    } else if (action === 'workspace') {
      setCurrentView('app');
    }
  }, []);

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

  const handleLoginSuccess = (userSession: any) => {
    setSession(userSession);
    if (userSession?.user?.email) {
      setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          id: userSession.user.id || prev.user.id,
          email: userSession.user.email,
        }
      }));
    }
    setCurrentView('app');
    setIsLoginModalOpen(false);
  };

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

  // Load state from Supabase when user logs in
  useEffect(() => {
    if (session?.user?.id) {
      supabase
        .from('workspaces')
        .select('state')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (data && data.state) {
            setState(data.state as AppState);
          }
        });
    }
  }, [session?.user?.id]);

  // Sync state to Supabase in background
  // Requires a 'workspaces' table with columns: id (uuid, pk), user_id (uuid), state (jsonb)
  useEffect(() => {
    if (session?.user?.id) {
      supabase
        .from('workspaces')
        .upsert(
          { user_id: session.user.id, state: state },
          { onConflict: 'user_id' }
        )
        .then(({ error }) => {
          if (error) console.error('Failed to sync to Supabase:', error);
        });
    }
  }, [state, session?.user?.id]);

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

  const handleSaveQuote = (savedQuote: Quote) => {
    setState((prev) => {
      const exists = prev.quotes.some((q) => q.id === savedQuote.id);
      const updatedQuotes = exists
        ? prev.quotes.map((q) => (q.id === savedQuote.id ? savedQuote : q))
        : [savedQuote, ...prev.quotes];
      return { ...prev, quotes: updatedQuotes };
    });
  };

  const handleDeleteQuote = (id: string) => {
    setState((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((q) => q.id !== id),
      followups: prev.followups.filter((f) => f.quote_id !== id),
    }));
  };

  const handleUpdateQuoteStatus = (quoteId: string, status: Quote['status']) => {
    setState((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) => (q.id === quoteId ? { ...q, status } : q)),
    }));
  };

  // Convert Quote -> Invoice
  const handleConvertToInvoice = (quote: Quote) => {
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

  const handleSaveInvoice = (savedInvoice: Invoice) => {
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
  const handleSaveCustomer = (customer: Customer) => {
    setState((prev) => {
      const exists = prev.customers.some((c) => c.id === customer.id);
      const updated = exists
        ? prev.customers.map((c) => (c.id === customer.id ? customer : c))
        : [customer, ...prev.customers];
      return { ...prev, customers: updated };
    });
  };

  const handleDeleteCustomer = (id: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
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
  const handleSaveProduct = (product: Product) => {
    setState((prev) => {
      const exists = prev.products.some((p) => p.id === product.id);
      const updated = exists
        ? prev.products.map((p) => (p.id === product.id ? product : p))
        : [product, ...prev.products];
      return { ...prev, products: updated };
    });
  };

  const handleDeleteProduct = (id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
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

  // Settings & Plan Handlers
  const handleSaveBusiness = (updatedBiz: BusinessProfile) => {
    setState((prev) => ({ ...prev, business: updatedBiz }));
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
  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'quotes' as const, label: 'Quotes', icon: FileText, count: state.quotes.length },
    { id: 'invoices' as const, label: 'Invoices', icon: CreditCard, count: state.invoices.length },
    { id: 'customers' as const, label: 'Customers', icon: Users, count: state.customers.length },
    { id: 'products' as const, label: 'Catalogue', icon: Package, count: state.products.length },
    { id: 'templates' as const, label: 'Templates', icon: Layers, count: state.templates.length },
    {
      id: 'followups' as const,
      label: 'Follow-Ups',
      icon: Clock,
      count: state.followups.filter((f) => f.status === 'pending').length,
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
  ];

  const isAuthorized = Boolean(session || isGuest);

  if (currentView === 'landing' || !isAuthorized) {
    return (
      <>
        <SplashScreen />
        <LandingPage
          business={state.business}
          currentUser={state.user}
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
          onPromptLogin={() => setIsLoginModalOpen(true)}
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
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
          className="flex flex-col items-center py-1 px-3 rounded-xl transition relative group"
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'dashboard' ? 'text-[#0B192C] font-bold' : 'text-[#8F9FB5]'}`}>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className="flex flex-col items-center py-1 px-3 rounded-xl transition relative group"
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${activeTab === 'quotes' ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
            {state.quotes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#3D74D9]" />
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${activeTab === 'quotes' ? 'text-[#0B192C] font-bold' : 'text-[#8F9FB5]'}`}>Quotes</span>
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
          onClick={() => setActiveTab('invoices')}
          className="flex flex-col items-center py-1 px-3 rounded-xl transition relative group"
        >
          <CreditCard className={`w-5 h-5 ${activeTab === 'invoices' ? 'text-[#3D74D9]' : 'text-[#8F9FB5]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'invoices' ? 'text-[#0B192C] font-bold' : 'text-[#8F9FB5]'}`}>Invoices</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-3 rounded-xl transition relative group"
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
