import React, { useState, useEffect, useCallback } from 'react';
import { CustomerRequest, MatchedProfessionalCandidate, PublicProfessionalProfile } from '../types';
import {
  fetchCustomerRequestByReference,
  fetchPublicProfessionals,
  matchProfessionalsForRequest,
  isProfessionalVerified,
} from '../lib/db';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  MessageCircle,
  Phone,
  Search,
  Building2,
  MapPin,
  Sparkles,
  ArrowRight,
  X,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { buildWhatsAppLink } from '../utils/formatters';

interface CustomerRequestTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReference?: string | null;
  initialRequest?: CustomerRequest | null;
  initialMatches?: MatchedProfessionalCandidate[];
  onSelectProfessional?: (pro: PublicProfessionalProfile) => void;
  onRequestQuote?: (service: string, location: string) => void;
}

export const CustomerRequestTrackerModal: React.FC<CustomerRequestTrackerModalProps> = ({
  isOpen,
  onClose,
  initialReference,
  initialRequest,
  initialMatches,
  onSelectProfessional,
  onRequestQuote,
}) => {
  const [referenceInput, setReferenceInput] = useState<string>(initialReference || '');
  const [activeRequest, setActiveRequest] = useState<CustomerRequest | null>(initialRequest || null);
  const [matchedCandidates, setMatchedCandidates] = useState<MatchedProfessionalCandidate[]>(initialMatches || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMatchingPending, setIsMatchingPending] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [recentReferences, setRecentReferences] = useState<string[]>([]);

  // Load recent tracking references from localStorage
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('matthorg_recent_tracking_refs');
        if (stored) {
          const list: string[] = JSON.parse(stored);
          setRecentReferences(list);
        }
      }
    } catch {
      // Ignore parse error
    }
  }, []);

  const saveReferenceToHistory = (ref: string) => {
    try {
      if (typeof localStorage !== 'undefined' && ref) {
        const existing = [...recentReferences.filter((r) => r.toUpperCase() !== ref.toUpperCase())];
        existing.unshift(ref.toUpperCase());
        const trimmed = existing.slice(0, 5);
        setRecentReferences(trimmed);
        localStorage.setItem('matthorg_recent_tracking_refs', JSON.stringify(trimmed));
        localStorage.setItem('matthorg_latest_tracking_ref', ref.toUpperCase());
      }
    } catch {
      // Ignore local storage error
    }
  };

  // Resolve matches for an active request
  const resolveMatchesForRequest = useCallback(
    async (req: CustomerRequest) => {
      // Check if candidate list is already embedded
      if (req.matched_candidates && req.matched_candidates.length > 0) {
        setMatchedCandidates(req.matched_candidates);
        return;
      }

      // Check cached request matches in local storage
      try {
        const cachedKey = `matthorg_request_matches_${req.id}`;
        const cachedRaw = localStorage.getItem(cachedKey);
        if (cachedRaw) {
          const parsed: MatchedProfessionalCandidate[] = JSON.parse(cachedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMatchedCandidates(parsed);
            return;
          }
        }
      } catch {
        // Fall through to query
      }

      // Genuinely evaluate matching engine using verified database records
      setIsMatchingPending(true);
      try {
        const allPros = await fetchPublicProfessionals({ randomize: false });
        const matches = matchProfessionalsForRequest(
          {
            service: req.service_required,
            location: req.location,
            category: req.service_category,
          },
          allPros
        );

        setMatchedCandidates(matches);

        // Cache matches associated with this request
        try {
          localStorage.setItem(`matthorg_request_matches_${req.id}`, JSON.stringify(matches));
        } catch {
          // Ignore
        }
      } catch (err) {
        console.warn('[CustomerTracker] Error matching professionals:', err);
      } finally {
        setIsMatchingPending(false);
      }
    },
    []
  );

  // Load a request by reference
  const loadRequest = useCallback(
    async (ref: string, showSpinner = true) => {
      const cleanRef = (ref || '').trim();
      if (!cleanRef) return;

      if (showSpinner) setIsLoading(true);
      setErrorMessage(null);

      try {
        const req = await fetchCustomerRequestByReference(cleanRef);
        if (req) {
          setActiveRequest(req);
          setReferenceInput(req.request_number);
          saveReferenceToHistory(req.request_number);
          await resolveMatchesForRequest(req);
        } else {
          setActiveRequest(null);
          setMatchedCandidates([]);
          setErrorMessage(`No record found for reference "${cleanRef}". Please verify your reference number.`);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to fetch request status. Please check your network connection.');
      } finally {
        if (showSpinner) setIsLoading(false);
      }
    },
    [resolveMatchesForRequest]
  );

  // Sync initial props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialRequest) {
        setActiveRequest(initialRequest);
        setReferenceInput(initialRequest.request_number);
        saveReferenceToHistory(initialRequest.request_number);
        if (initialMatches && initialMatches.length > 0) {
          setMatchedCandidates(initialMatches);
        } else {
          resolveMatchesForRequest(initialRequest);
        }
      } else if (initialReference) {
        setReferenceInput(initialReference);
        loadRequest(initialReference, true);
      } else {
        // Try recovering latest tracking ref from local store
        try {
          const latest = localStorage.getItem('matthorg_latest_tracking_ref');
          if (latest) {
            setReferenceInput(latest);
            loadRequest(latest, true);
          }
        } catch {
          // Ignore
        }
      }
    }
  }, [isOpen, initialReference, initialRequest, initialMatches, loadRequest, resolveMatchesForRequest]);

  // Polling for live status updates while modal is open
  useEffect(() => {
    if (!isOpen || !activeRequest?.request_number) return;

    const interval = setInterval(() => {
      loadRequest(activeRequest.request_number, false);
    }, 10000); // Poll every 10s

    return () => clearInterval(interval);
  }, [isOpen, activeRequest?.request_number, loadRequest]);

  // Listen to live broadcast events
  useEffect(() => {
    const handleStatusUpdate = (e: any) => {
      const detail = e.detail;
      if (activeRequest && (detail.requestId === activeRequest.id || detail.requestId === activeRequest.request_number)) {
        setActiveRequest((prev) => (prev ? { ...prev, status: detail.status, updated_at: new Date().toISOString() } : prev));
      }
    };

    window.addEventListener('matthorg_request_status_updated', handleStatusUpdate);
    return () => window.removeEventListener('matthorg_request_status_updated', handleStatusUpdate);
  }, [activeRequest]);

  const handleManualRefresh = async () => {
    if (!activeRequest?.request_number) return;
    setIsRefreshing(true);
    await loadRequest(activeRequest.request_number, false);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (referenceInput.trim()) {
      loadRequest(referenceInput.trim(), true);
    }
  };

  const handleCopyReference = (ref: string) => {
    try {
      navigator.clipboard.writeText(ref);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  // Determine stage states based on active request
  // 1: Received
  // 2: Matching in progress
  // 3: Businesses matched
  // 4: Business contacted / responding
  // 5: Quote / Proposal active
  const isReceived = Boolean(activeRequest);
  const isMatching = isMatchingPending;
  const isMatched = Boolean(activeRequest && (matchedCandidates.length > 0 || activeRequest.status !== 'Open'));
  const isContacted = Boolean(
    activeRequest &&
      (activeRequest.status === 'Contacted' ||
        activeRequest.status === 'Converted' ||
        activeRequest.status === 'Closed' ||
        (activeRequest.contacted_by_business_ids && activeRequest.contacted_by_business_ids.length > 0))
  );
  const isQuoteProgress = Boolean(
    activeRequest && (activeRequest.status === 'Converted' || activeRequest.quote_id)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracker-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0B192C] text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#1E3E62] border border-white/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h2 id="tracker-modal-title" className="text-lg font-bold text-white truncate">
                Customer Request Tracker
              </h2>
              <p className="text-xs text-slate-300">
                End-to-end matching, dispatch progress & verified provider responses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeRequest && (
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Refresh latest status from database"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Reference Search / Switch Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                placeholder="Enter request reference code (e.g. REQ-123456)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-[#0B192C] uppercase placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:border-[#0B192C] focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !referenceInput.trim()}
              className="px-6 py-3 rounded-2xl bg-[#0B192C] hover:bg-[#1E3E62] disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Track Request</span>
            </button>
          </form>

          {/* Recent reference history chips */}
          {recentReferences.length > 0 && !activeRequest && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
              <span className="font-semibold">Recent Requests:</span>
              {recentReferences.map((ref) => (
                <button
                  key={ref}
                  type="button"
                  onClick={() => {
                    setReferenceInput(ref);
                    loadRequest(ref, true);
                  }}
                  className="font-mono px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B192C] transition font-bold cursor-pointer"
                >
                  {ref}
                </button>
              ))}
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{errorMessage}</p>
                <p className="text-[11px] text-rose-700">
                  Ensure the reference code matches the ID assigned when your request was created.
                </p>
              </div>
            </div>
          )}

          {/* ACTIVE REQUEST PROGRESS TIMELINE */}
          {activeRequest ? (
            <div className="space-y-6">
              {/* Reference Header Card */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Reference Number
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyReference(activeRequest.request_number)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#0B192C] font-semibold"
                      title="Copy reference code"
                    >
                      {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRef ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-2xl font-black font-mono text-[#0B192C] tracking-tight">
                    {activeRequest.request_number}
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span>
                      Submitted {new Date(activeRequest.created_at).toLocaleDateString()} at{' '}
                      {new Date(activeRequest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-[#0B192C]">{activeRequest.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                      activeRequest.status === 'Converted'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : activeRequest.status === 'Contacted'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : activeRequest.status === 'Matched'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>Status: {activeRequest.status}</span>
                  </span>
                </div>
              </div>

              {/* 5-STAGE PROGRESS WORKFLOW */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#0B192C] uppercase tracking-wider">
                  Request Lifecycle Progress
                </h3>

                <div className="space-y-3">
                  {/* STAGE 1: Request Received & Persisted */}
                  <div className="p-4 rounded-2xl border transition-all bg-white border-slate-200 shadow-2xs">
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#0B192C]">1. Request Received & Persisted</h4>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Confirmed
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Job request for <strong className="text-[#0B192C]">{activeRequest.service_required}</strong> in{' '}
                          <strong className="text-[#0B192C]">{activeRequest.location}</strong> registered securely. Communication
                          consent recorded for verified contractors.
                        </p>
                        {activeRequest.details && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-200 line-clamp-2">
                            "{activeRequest.details}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STAGE 2: Matching Engine In Progress */}
                  <div className="p-4 rounded-2xl border transition-all bg-white border-slate-200 shadow-2xs">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isMatchingPending
                            ? 'bg-blue-100 text-blue-700 animate-spin motion-reduce:animate-none'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isMatchingPending ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#0B192C]">2. Matching Engine Evaluation</h4>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              isMatchingPending
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isMatchingPending ? 'Evaluating...' : 'Complete'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Evaluated against accredited service categories, operating territory coverage, and authentic business
                          licensing.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* STAGE 3: Businesses Matched */}
                  <div className="p-4 rounded-2xl border transition-all bg-white border-slate-200 shadow-2xs">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          matchedCandidates.length > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#0B192C]">3. Matched Professionals & Coverage</h4>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              matchedCandidates.length > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {matchedCandidates.length > 0
                              ? `${matchedCandidates.length} Matched`
                              : 'Expanding Dispatch'}
                          </span>
                        </div>

                        {matchedCandidates.length > 0 ? (
                          <div className="mt-3 space-y-2.5">
                            <p className="text-xs text-slate-600">
                              Verified specialists matching your trade requirements and location:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {matchedCandidates.slice(0, 4).map(({ professional: pro, matchScore, isVerified, matchReasons }) => (
                                <div
                                  key={pro.id}
                                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <h5 className="text-xs font-bold text-[#0B192C] line-clamp-1">
                                        {pro.business_name}
                                      </h5>
                                      <span className="font-mono text-[10px] font-bold text-emerald-700 shrink-0">
                                        {matchScore}%
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                      {pro.specialization || pro.industry} • {pro.city || pro.state || 'Local Area'}
                                    </p>

                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                      {isVerified ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                          <span>Verified</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                          <Clock className="w-3 h-3 text-slate-400" />
                                          <span>Pending</span>
                                        </span>
                                      )}
                                      {matchReasons?.[0] && (
                                        <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[130px]">
                                          {matchReasons[0]}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {onSelectProfessional && (
                                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-end">
                                      <button
                                        type="button"
                                        onClick={() => onSelectProfessional(pro)}
                                        className="text-[11px] font-bold text-[#0B192C] hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>View Profile</span>
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                            No immediately accredited contractor operates exclusively in <strong>{activeRequest.location}</strong> for this exact trade. Your request has been queued on our central dispatch board and expanded to accredited providers in nearby districts.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STAGE 4: Business Response / Contact Status */}
                  <div className="p-4 rounded-2xl border transition-all bg-white border-slate-200 shadow-2xs">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isContacted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#0B192C]">4. Business Response & Contact</h4>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              isContacted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isContacted ? 'Contact Initiated' : 'Awaiting Response'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {isContacted
                            ? 'A qualified matching professional has picked up your job request and contacted you or prepared a response.'
                            : 'Request is active on the contractor board. Professionals reviewing the specifications will reach out via WhatsApp / phone.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* STAGE 5: Quote & Deal Progress */}
                  <div className="p-4 rounded-2xl border transition-all bg-white border-slate-200 shadow-2xs">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isQuoteProgress ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#0B192C]">5. Quotation & Deal Progression</h4>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              isQuoteProgress
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isQuoteProgress ? 'Proposal In Progress' : 'Pending Quotation'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {isQuoteProgress
                            ? 'Your project has progressed into formal proposal preparation.'
                            : 'Once the provider finalizes your project scope, their official quotation will be accessible here.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRequest(null);
                    setReferenceInput('');
                  }}
                  className="text-slate-500 hover:text-[#0B192C] font-semibold cursor-pointer"
                >
                  ← Track a different request
                </button>

                {onRequestQuote && (
                  <button
                    type="button"
                    onClick={() => {
                      onRequestQuote(activeRequest.service_required, activeRequest.location);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0B192C] text-white font-bold hover:bg-[#1E3E62] transition cursor-pointer"
                  >
                    Post another request
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Empty Search State */
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0B192C]">Enter a Reference Code to Track Your Request</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                When you submit a request on MatthOrg, a unique reference ID (such as <strong className="font-mono text-[#0B192C]">REQ-123456</strong>) is generated. Enter it above to view live matching progress, verified contractor cards, and quotation updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
