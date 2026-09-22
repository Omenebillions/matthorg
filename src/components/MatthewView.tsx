/**
 * MATTHORG — MATTHEW VIEW
 * Business Development, Sales & Business Growth Intelligence Interface
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  TrendingUp,
  Target,
  AlertCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  FileText,
  DollarSign,
  Users,
  Search,
  ArrowDown,
} from 'lucide-react';
import { AppState, MatthewMessage, Lead, Quote, Invoice } from '../types';
import { sendMatthewMessage } from '../lib/matthew';

interface MatthewViewProps {
  state: AppState;
  initialPrompt?: string;
  onOpenLead?: (lead: Lead) => void;
  onOpenQuote?: (quote: Quote) => void;
  onOpenInvoice?: (invoice: Invoice) => void;
  onNavigateTab?: (tab: 'leads' | 'marketplace' | 'quotes' | 'invoices' | 'customers') => void;
  onSaveMessage?: (message: MatthewMessage) => void;
}

const DEFAULT_SUGGESTIONS = [
  {
    category: 'Pipeline',
    icon: Target,
    text: 'Who should I follow up with today?',
    sub: 'Prioritize leads & stale opportunities',
  },
  {
    category: 'Sales Analysis',
    icon: TrendingUp,
    text: 'How is my business doing?',
    sub: 'Revenue metrics & win-rate analysis',
  },
  {
    category: 'Sales Coaching',
    icon: DollarSign,
    text: 'My customer says I am too expensive. What should I say?',
    sub: 'Objection handling & value negotiation',
  },
  {
    category: 'Marketplace',
    icon: Search,
    text: 'Which customer requests match my services?',
    sub: 'Find high-fit buyer opportunities',
  },
  {
    category: 'Marketing',
    icon: Lightbulb,
    text: 'What should I promote this month?',
    sub: 'Ethical campaigns & referral strategy',
  },
  {
    category: 'Retention',
    icon: Users,
    text: 'Which customers have unpaid invoices?',
    sub: 'Cash flow & payment collections',
  },
];

export const MatthewView: React.FC<MatthewViewProps> = ({
  state,
  initialPrompt,
  onOpenLead,
  onOpenQuote,
  onOpenInvoice,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<MatthewMessage[]>(() => {
    if (state.matthewMessages && state.matthewMessages.length > 0) {
      return state.matthewMessages;
    }
    return [
      {
        id: 'initial-greeting',
        role: 'assistant',
        content: `**Hello! I'm Matthew — MatthOrg's Business Development AI.**\n\nI'm the AI operating layer inside MatthOrg, dedicated to helping your business with:\n- **Sales & Lead Management** (Marketplace leads & pipeline qualification)\n- **Deal Management & Quotations** (Pricing, proposals & follow-ups)\n- **Invoices & Payment Follow-Up** (Overdue cash collection & milestone terms)\n- **Customer Acquisition & Retention** (Repeat business & commercial strategy)\n- **Business Growth & Revenue Expansion** (Sales metrics & conversion optimization)\n\nAsk me about your current leads, pending quotes, overdue invoices, or marketplace buyer requests.`,
        created_at: new Date().toISOString(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    // Primary: Scroll internal container
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight + 1500,
        behavior,
      });
    }
    // Secondary fallback: Scroll sentinel into view
    try {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    } catch {
      // ignore
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 120);
  };

  useEffect(() => {
    // Immediate scroll and slight delay to catch rendered Markdown/citations
    scrollToBottom('smooth');
    const timer = setTimeout(() => scrollToBottom('smooth'), 80);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && !isLoading) {
      handleSend(initialPrompt.trim());
    }
  }, [initialPrompt]);

  const handleSend = async (userPrompt?: string) => {
    const text = (userPrompt || input).trim();
    if (!text || isLoading) return;

    setInput('');
    setError(null);

    const userMessage: MatthewMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const assistantMessage = await sendMatthewMessage({
        message: text,
        history: newHistory,
        state,
      });

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error in Matthew chat:', err);
      setError(err?.message || 'Failed to receive response from Matthew.');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleRetry = async () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const assistantMessage = await sendMatthewMessage({
        message: lastUserMsg.content,
        history: messages,
        state,
      });

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error in Matthew chat retry:', err);
      setError(err?.message || 'Failed to receive response from Matthew.');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetConversation = () => {
    if (window.confirm('Reset this conversation with Matthew?')) {
      setMessages([
        {
          id: `greet-${Date.now()}`,
          role: 'assistant',
          content: `**Conversation reset.** I'm ready to review your pipeline, sales metrics, or growth strategy. How can I help your business right now?`,
          created_at: new Date().toISOString(),
        },
      ]);
      setError(null);
    }
  };

  const handleCitationClick = (citation: { type: string; title: string }) => {
    const iden = citation.title.toUpperCase();
    if (citation.type === 'lead') {
      const lead = (state.leads || []).find((l) => l.lead_number?.toUpperCase() === iden || l.id === iden);
      if (lead && onOpenLead) {
        onOpenLead(lead);
        return;
      }
      if (onNavigateTab) onNavigateTab('leads');
    } else if (citation.type === 'deal') {
      const quote = (state.quotes || []).find((q) => q.quote_number?.toUpperCase() === iden || q.id === iden);
      if (quote && onOpenQuote) {
        onOpenQuote(quote);
        return;
      }
      if (onNavigateTab) onNavigateTab('quotes');
    } else if (citation.type === 'invoice') {
      const inv = (state.invoices || []).find((i) => i.invoice_number?.toUpperCase() === iden || i.id === iden);
      if (inv && onOpenInvoice) {
        onOpenInvoice(inv);
        return;
      }
      if (onNavigateTab) onNavigateTab('invoices');
    } else if (citation.type === 'marketplace' && onNavigateTab) {
      onNavigateTab('marketplace');
    }
  };

  // Render message content with markdown formatting
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-[#0B192C]">
        {lines.map((line, idx) => {
          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          // Structured Header: What I found
          if (line.includes('What I found') || line.includes('WHAT I FOUND')) {
            return (
              <div key={idx} className="pt-2 pb-1 border-b border-[#E5E9F0]">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#3D74D9]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{line.replace(/\*\*/g, '')}</span>
                </div>
              </div>
            );
          }

          // Structured Header: What it means
          if (line.includes('What it means') || line.includes('WHAT IT MEANS')) {
            return (
              <div key={idx} className="pt-2 pb-1 border-b border-[#E5E9F0]">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#5B6D85]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{line.replace(/\*\*/g, '')}</span>
                </div>
              </div>
            );
          }

          // Structured Header: What I'd do next
          if (line.includes("What I'd do next") || line.includes('WHAT I DO NEXT') || line.includes('What to do next')) {
            return (
              <div key={idx} className="pt-2 pb-1 border-b border-[#E5E9F0]">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600">
                  <Target className="w-3.5 h-3.5" />
                  <span>{line.replace(/\*\*/g, '')}</span>
                </div>
              </div>
            );
          }

          // Bullet points
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const bulletText = line.trim().substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#3D74D9] font-bold mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(bulletText) }} />
              </div>
            );
          }

          // Numbered list
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#3D74D9] font-bold text-[11px] min-w-4">{numMatch[1]}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(numMatch[2]) }} />
              </div>
            );
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string): string => {
    let out = text;
    // bold
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // italic
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // quotes
    out = out.replace(/«(.*?)»/g, '<span class="italic text-[#3D74D9]">“$1”</span>');
    return out;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] sm:h-[calc(100vh-9rem)] min-h-[580px] max-w-5xl mx-auto mt-3 sm:mt-5 mb-4 bg-white rounded-3xl border border-[#E5E9F0] shadow-sm overflow-hidden relative">
      {/* Matthew Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[#E5E9F0] bg-gradient-to-r from-[#F4F7FB] via-white to-[#F4F7FB] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-[#0B192C] text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-[#3D74D9]" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0B192C]">Matthew</h2>
              <span className="w-fit px-2 py-0.5 rounded-md bg-[#3D74D9]/10 text-[#3D74D9] text-[10px] font-bold tracking-wide">
                Business Development AI
              </span>
            </div>
            <p className="text-[11px] text-[#5B6D85]">
              MatthOrg's Business Development AI • AI Operating Layer for Sales, Deals & Growth
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E5E9F0] text-[11px] text-[#5B6D85]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active: {state.business.business_name}</span>
          </div>
          <button
            onClick={handleResetConversation}
            title="Reset conversation"
            className="p-2 rounded-xl text-[#8F9FB5] hover:text-[#0B192C] hover:bg-[#E5E9F0]/60 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scrollable Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 pb-12 space-y-4 sm:space-y-5 bg-[#FAFCFF] scroll-smooth"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 ${
                  isUser
                    ? 'bg-[#0B192C] text-white rounded-tr-xs shadow-sm'
                    : 'bg-white border border-[#E5E9F0] rounded-tl-xs shadow-sm'
                }`}
              >
                {/* Out-of-Domain Notice Banner */}
                {!isUser && msg.is_out_of_domain && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Domain Redirect:</strong> Matthew is specialized strictly in business development, sales pipeline, and commercial growth.
                    </span>
                  </div>
                )}

                {/* Tool Executions Badge */}
                {!isUser && msg.tool_calls_executed && msg.tool_calls_executed.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {msg.tool_calls_executed.map((tool, tIdx) => {
                      const cleanTool = tool.replace('get_', '').replace(/_/g, ' ');
                      return (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3D74D9]/10 text-[#3D74D9] text-[10px] font-mono"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>checked {cleanTool}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Message Body */}
                {isUser ? (
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  renderFormattedContent(msg.content)
                )}

                {/* Citations / Navigation Pills */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#E5E9F0] flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#8F9FB5]">References:</span>
                    {msg.citations.map((cite, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleCitationClick(cite)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F4F7FB] hover:bg-[#3D74D9]/10 text-[#3D74D9] text-[11px] font-mono font-semibold border border-[#E5E9F0] hover:border-[#3D74D9]/30 transition"
                      >
                        <span>{cite.title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}

                <div className={`mt-2 text-[10px] flex items-center justify-between ${isUser ? 'text-gray-400 justify-end' : 'text-[#8F9FB5]'}`}>
                  {!isUser && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      Business Development AI
                    </span>
                  )}
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E5E9F0] rounded-2xl rounded-tl-xs p-4 shadow-sm flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#3D74D9]/10 text-[#3D74D9] flex items-center justify-center animate-spin">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-[#5B6D85]">Matthew is analyzing your business pipeline...</span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="text-[11px] font-bold text-red-700 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Generous spacing at the bottom so messages never clip */}
        <div className="h-6 shrink-0" />
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Latest Button */}
      {showScrollBottom && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none z-20">
          <button
            onClick={() => scrollToBottom('smooth')}
            className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-[#0B192C] text-white text-xs font-semibold shadow-lg hover:bg-[#1E3E62] transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            <span>Scroll down to latest</span>
          </button>
        </div>
      )}

      {/* Suggestion Chips (if history is short or user wants quick answers) */}
      {messages.length <= 4 && !isLoading && (
        <div className="px-4 sm:px-6 py-2.5 bg-white border-t border-[#E5E9F0] overflow-x-auto scrollbar-none flex gap-2">
          {DEFAULT_SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(item.text)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-[#F4F7FB] hover:bg-[#E8EEF5] text-left border border-[#E5E9F0] transition group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B192C]">
                  <Icon className="w-3.5 h-3.5 text-[#3D74D9]" />
                  <span>{item.text}</span>
                </div>
                <div className="text-[10px] text-[#8F9FB5] pl-5">{item.sub}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#E5E9F0]">
        <div className="flex items-end gap-2 bg-[#F4F7FB] border border-[#E5E9F0] rounded-2xl p-2 focus-within:border-[#3D74D9] focus-within:ring-1 focus-within:ring-[#3D74D9] transition">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Matthew about leads, follow-ups, quotes, or sales growth..."
            className="flex-1 bg-transparent border-0 resize-none outline-none text-xs sm:text-sm text-[#0B192C] placeholder-[#8F9FB5] px-2 py-1 max-h-32 min-h-[28px]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 ${
              input.trim() && !isLoading
                ? 'bg-[#3D74D9] text-white shadow-sm hover:bg-[#2F5EB3]'
                : 'bg-[#E5E9F0] text-[#8F9FB5] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-center text-[10px] text-[#8F9FB5]">
          Matthew — MatthOrg's Business Development AI • Sales, Deal Management & Commercial Growth
        </div>
      </div>
    </div>
  );
};
