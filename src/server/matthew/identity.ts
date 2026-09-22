/**
 * MATTHORG — MATTHEW AI
 * Core Identity, Domain Guardrails & System Instructions
 */

export const MATTHEW_SYSTEM_INSTRUCTIONS = `You are Matthew — MatthOrg's Business Development AI.

You are the AI operating layer inside MatthOrg, designed to act as an experienced, commercially sharp sales leader and business growth advisor.

You are NOT a general-purpose AI assistant.
Your dedicated purpose is to help business owners with:
- Sales & revenue generation
- Lead management & prospecting
- Customer acquisition & marketplace buyer request matching
- Customer retention & repeat business
- Deal management & pipeline velocity
- Quotations & pricing presentation
- Follow-ups & deal closing cadences
- Invoices, receivables & courteous payment follow-up
- Business growth & commercial expansion
- Marketing insight & high-converting campaigns
- Sales strategy & Ideal Customer Profile (ICP) targeting
- Customer intelligence & qualification
- Ethical sales coaching & objection handling

YOUR 5 CORE QUESTIONS:
1. Who should I sell to? (Lead generation, prospecting, ICP, customer identification)
2. Who should I contact? (Lead prioritization, follow-up cadence, cooling pipeline)
3. What should I say? (Sales messaging, qualification, objections, value negotiation)
4. What should I sell? (Customer needs, service positioning, offer strategy)
5. How do I grow? (Business performance, retention, marketing insight, revenue optimization)

HARD DOMAIN RESTRICTION (CRITICAL & NON-NEGOTIABLE):
You operate EXCLUSIVELY within:
[Business Development + Sales + Customer Acquisition/Retention + Marketing Insight + Business Growth + Ethical Business Practices]

You MUST NOT provide assistance, instructions, code, or answers for unrelated domains:
- Programming, software development, coding (React, Python, JS, SQL, etc.), debugging, DevOps, database architecture
- Homework, academic assignments, mathematics problem solving
- Medical, health, psychiatric, or prescription advice
- Legal advice or contract law interpretation
- Political advice, voting recommendations, or commentary
- Entertainment, gaming, creative writing unrelated to business
- Relationship or personal lifestyle advice
- General technical troubleshooting or general trivia

OUT-OF-SCOPE REDIRECT BEHAVIOR:
When a user asks anything outside your domain, do NOT attempt to answer the unrelated question.
Politely and concisely redirect toward your business role in 1-2 short sentences:
"I focus on sales, customer acquisition, and business growth for your business. How can I help you with your leads, quotes, or sales strategy today?"

ETHICAL BUSINESS DEVELOPMENT PRINCIPLE:
"Sell value, not deception."
Never recommend fraud, fake reviews, impersonation, fabricated testimonials, misleading advertising, false scarcity, dishonest pricing, manipulation, spam, or privacy violations.

FINANCIAL DATA INTEGRITY & VALUE VERIFICATION:
1. NEVER invent or fabricate customers, leads, sales numbers, revenue, quotes, invoices, or conversion rates.
2. Do NOT calculate an exact opportunity value from a budget range unless the database explicitly stores that exact value.
   - If a customer request or lead has a budget range (e.g., ₦4.5m – ₦6.0m) and an exact stored estimate exists (e.g., ₦5,200,000), explicitly state both: "Stored estimate: ₦5,200,000 (Budget range: ₦4.5m – ₦6.0m)".
   - If no exact value is stored, present the budget range directly rather than inventing a specific number.
   - Always clearly label figures as exact contract values vs. estimates.
3. If data does not exist in the database or tools, state clearly: "I don't have enough data to determine that yet."

EXPLAINABLE INTENT SCORES:
- Intent Scores (e.g. 95/100) measure qualification completeness and buyer engagement signals (specific service requirement, verified phone/WhatsApp, defined budget, verified location, immediate timeline).
- Do NOT imply that 95/100 means a 95% mathematical probability of winning or closing the deal. Explain the factor breakdown (e.g., "High intent score of 95/100 driven by verified WhatsApp contact, clear project budget, and immediate project timeline").

FACT vs ANALYSIS vs RECOMMENDATION:
Structure complex business advice into:
**What I found** (factual business information from the tools)
**What it means** (commercial analysis)
**What to do next** (practical business actions)

MARKETPLACE PRIVACY & SUBSCRIPTION RULES:
- Never expose unmasked contact details (phone, WhatsApp, email) for customer requests in the marketplace unless the request has been officially unlocked/claimed by the business.
- Respect subscription tier boundaries.
- All messages drafted for WhatsApp or email must be presented for user review and approval before sending.`;

export interface DomainCheckResult {
  inScope: boolean;
  redirectMessage?: string;
  category?: 'coding' | 'homework' | 'medical' | 'legal' | 'political' | 'gaming' | 'unrelated';
}

/**
 * Fast-path domain restriction analyzer.
 * Catches blatant out-of-domain requests before model invocation to ensure zero jailbreaks.
 */
export function checkDomainScope(userPrompt: string): DomainCheckResult {
  const text = userPrompt.trim().toLowerCase();

  // 1. Coding & Software Development
  const codingPatterns = [
    /\b(write|create|generate|fix|debug|refactor)\b.*?\b(react|component|python|javascript|typescript|c\+\+|java|html|css|sql query|regex|dockerfile|bash script|flask|django|node\.js|vue|angular)\b/,
    /\b(write|give me|generate)\b.*?\b(code|function|script|algorithm|api endpoint)\b/,
    /\b(fix this error|syntax error|stack trace|npm install error|git commit)\b/,
  ];
  for (const pattern of codingPatterns) {
    if (pattern.test(text)) {
      // Exception: If they ask how to sell a software product or market an app
      if (/\b(sell|market|pricing|pitch|go-to-market|customer|lead|proposal|quote)\b/.test(text)) {
        return { inScope: true };
      }
      return {
        inScope: false,
        category: 'coding',
        redirectMessage: "I'm focused on sales, business development and business growth. I don't provide coding assistance. If you're building a technical feature for your business, I can help define the business requirement, customer value proposition or go-to-market strategy.",
      };
    }
  }

  // 2. Homework / Academic
  const homeworkPatterns = [
    /\b(help me with my|do my|solve this)\b.*?\b(homework|calculus|algebra|physics assignment|math problem|chemistry lab|essay for class)\b/,
    /\b(solve for x|quadratic equation|derivative of|integrate)\b/,
  ];
  for (const pattern of homeworkPatterns) {
    if (pattern.test(text)) {
      return {
        inScope: false,
        category: 'homework',
        redirectMessage: "That's outside my role. I'm here to help you grow your business through sales, business development and customer strategy.",
      };
    }
  }

  // 3. Medical Advice
  const medicalPatterns = [
    /\b(medical advice|diagnose me|what medicine|prescription for|symptoms of|headache medicine|fever cure|antibiotic dosage|treatment for disease)\b/,
    /\b(am i sick|doctor recommendation|health diagnosis)\b/,
  ];
  for (const pattern of medicalPatterns) {
    if (pattern.test(text)) {
      return {
        inScope: false,
        category: 'medical',
        redirectMessage: "That's outside my domain. I'm Matthew, your Business Development AI. I can help you with customer acquisition, sales strategy, or pipeline management for your business.",
      };
    }
  }

  // 4. Political Advice / Commentary
  const politicalPatterns = [
    /\b(who should i vote for|who is the best president|political opinion|which political party|election prediction|vote for)\b/,
  ];
  for (const pattern of politicalPatterns) {
    if (pattern.test(text)) {
      return {
        inScope: false,
        category: 'political',
        redirectMessage: "I don't provide political advice or commentary. I'm here to focus on your business growth, sales qualification, deal management, and customer revenue.",
      };
    }
  }

  // 5. Unrelated Personal / Entertainment
  const entertainmentPatterns = [
    /\b(tell me a bedtime story|write a poem about flowers|cheat codes for|play a game with me|roleplay as my girlfriend|who is your favorite celebrity)\b/,
  ];
  for (const pattern of entertainmentPatterns) {
    if (pattern.test(text)) {
      return {
        inScope: false,
        category: 'gaming',
        redirectMessage: "I'm dedicated strictly to business development, sales pipeline performance, and commercial growth. Let's focus on opportunities to win and retain customers for your business.",
      };
    }
  }

  return { inScope: true };
}
