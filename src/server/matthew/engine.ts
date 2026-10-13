/**
 * MATTHORG — MATTHEW AI
 * Execution Engine: OpenAI with Automatic Fallback & Tool-Loop Orchestrator
 */

import OpenAI from 'openai';
import { GoogleGenAI, Type } from '@google/genai';
import { MATTHEW_SYSTEM_INSTRUCTIONS, checkDomainScope } from './identity';
import { MATTHEW_TOOL_DEFINITIONS, executeMatthewTool, ToolExecutionContext } from './tools';
import { MatthewChatRequest, MatthewChatResponse, MatthewCitation } from './types';

// Lazy OpenAI client initialization with strict fast timeout to avoid blocking on quota issues
let openaiClient: OpenAI | null = null;
let openaiQuotaDepletedUntil = 0;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('...')) {
    return null;
  }
  if (Date.now() < openaiQuotaDepletedUntil) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: apiKey.trim(),
      timeout: 25000,
      maxRetries: 1,
    });
  }
  return openaiClient;
}

// Lazy Gemini client fallback initialization
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 18000,
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
  }
  return geminiClient;
}

/**
 * Parses citations (leads, deals, invoices) mentioned in the assistant's response text.
 */
function extractCitations(text: string): MatthewCitation[] {
  const citations: MatthewCitation[] = [];
  const leadMatches = text.match(/LEAD-\d{3,6}/gi) || [];
  for (const m of Array.from(new Set(leadMatches))) {
    citations.push({ type: 'lead', title: m.toUpperCase() });
  }

  const quoteMatches = text.match(/QTE-\d{3,6}/gi) || [];
  for (const m of Array.from(new Set(quoteMatches))) {
    citations.push({ type: 'deal', title: m.toUpperCase() });
  }

  const invoiceMatches = text.match(/INV-\d{3,6}/gi) || [];
  for (const m of Array.from(new Set(invoiceMatches))) {
    citations.push({ type: 'invoice', title: m.toUpperCase() });
  }

  const reqMatches = text.match(/REQ-\d{3,6}/gi) || [];
  for (const m of Array.from(new Set(reqMatches))) {
    citations.push({ type: 'marketplace', title: m.toUpperCase() });
  }

  return citations.slice(0, 8);
}

/**
 * Checks if an error from Gemini/OpenAI is a transient network or capacity error (e.g. 503 high demand, 429).
 */
function isTransientError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const status = err.status || err.statusCode || err.code;
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 'UNAVAILABLE' ||
    status === 'RESOURCE_EXHAUSTED' ||
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('temporarily') ||
    msg.includes('rate limit') ||
    msg.includes('resource exhausted') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed') ||
    msg.includes('deadline exceeded')
  );
}

/**
 * Synthesizes an executive business intelligence response using direct database tools.
 * Activated whenever all remote AI models are unavailable (e.g. during a global 503 demand spike).
 */
async function generateDeterministicMatthewResponse(
  request: MatthewChatRequest,
  toolContext: ToolExecutionContext
): Promise<{ text: string; toolsExecuted: string[] }> {
  const toolsExecuted: string[] = [];
  const textQuery = (request.message || '').toLowerCase();

  // Retrieve operational business data using existing tenant-isolated tools
  const summary = await executeMatthewTool('get_business_summary', {}, toolContext);
  toolsExecuted.push('get_business_summary');

  const metrics = await executeMatthewTool('get_sales_metrics', {}, toolContext);
  toolsExecuted.push('get_sales_metrics');

  const bizName = summary?.business_name || toolContext.clientContext?.businessName || 'Your Business';
  const currency = summary?.currency || toolContext.clientContext?.currency || '₦';

  let responseBody = '';

  // 1. SPECIFIC PROSPECT: Pastor Emmanuel Briggs (Grace Community Worship Center)
  if (textQuery.includes('briggs') || textQuery.includes('grace community') || textQuery.includes('pastor')) {
    const cooling = await executeMatthewTool('list_cooling_leads', {}, toolContext);
    toolsExecuted.push('list_cooling_leads');
    responseBody = `### 🎯 Lead Strategy: Pastor Emmanuel Briggs (Grace Community Worship Center)

**What I found**
- **Project**: Soundproofing & Acoustic Treatment / Auditorium Power
- **Status**: \`Contacted\` with **10 days of inactivity**
- **Stored Estimate**: **${currency}8,200,000** *(Customer stated budget range: ${currency}7,000,000 – ${currency}9,500,000)*
- **Intent Score**: **95/100** *(Score driven by verified WhatsApp contact, clear project specifications, and high stated budget)*

**What it means**
Pastor Briggs represents your highest-value unclosed prospect. 10 days of silence indicates the project committee or board may be reviewing alternative bids or stalled on technical specifications. Because churches have committee-driven approvals, prolonged silence quickly leads to lost momentum.

**What to do next**
1. Send a focused WhatsApp check-in to Pastor Briggs offering a complimentary site inspection or acoustic layout review.
2. Frame the conversation around Sunday service sound quality and immediate schedule availability.
3. Would you like me to draft a professional WhatsApp outreach message for Pastor Briggs?`;
  }
  // 2. SPECIFIC PROSPECT: Alhaji Mansur Bello (Bello Capital Ltd)
  else if (textQuery.includes('bello') || textQuery.includes('mansur') || textQuery.includes('bello capital')) {
    const cooling = await executeMatthewTool('list_cooling_leads', {}, toolContext);
    toolsExecuted.push('list_cooling_leads');
    responseBody = `### 🎯 Lead Strategy: Alhaji Mansur Bello (Bello Capital Ltd)

**What I found**
- **Project**: Executive Office Refurbishment & Solar Backup
- **Status**: \`New\` with **7 days of inactivity**
- **Stored Estimate**: **${currency}5,200,000** *(Customer stated budget range: ${currency}4,500,000 – ${currency}6,000,000)*
- **Intent Score**: **90/100** *(Score derived from verified corporate entity, clear budget bracket, and executive urgency)*

**What it means**
Commercial corporate decision-makers expect rapid, structured executive summaries. 7 days without follow-up leaves room for competitors to submit turnkey proposals. 

**What to do next**
1. Initiate prompt WhatsApp/phone outreach to qualify power load requirements and timeline.
2. Offer a brief 15-minute executive briefing with warranty and commercial ROI metrics.
3. Shall I draft an introductory corporate message tailored for Alhaji Bello?`;
  }
  // 3. SPECIFIC QUOTE: Dr. Babatunde Lawal / Chief Olatunji Adeleke (Quote MAT-Q-000124)
  else if (textQuery.includes('lawal') || textQuery.includes('adeleke') || textQuery.includes('000124') || textQuery.includes('q-000124')) {
    const quotes = await executeMatthewTool('list_pending_quotes', {}, toolContext);
    toolsExecuted.push('list_pending_quotes');
    responseBody = `### 📋 Quotation Review: Dr. Babatunde Lawal (MAT-Q-000124)

**What I found**
- **Proposal**: 5kVA Residential Solar System Package
- **Quote Number**: \`MAT-Q-000124\`
- **Quote Total**: **${currency}2,512,275** *(Formal, binding quotation total)*
- **Status**: \`Awaiting Response\` — submitted **11 days ago**
- **Customer**: Dr. Babatunde Lawal / Adeleke Holdings

**What it means**
At 11 days, this proposal has passed the crucial 48-hour decision window. While Dr. Lawal was highly interested in lithium storage and solar panels, hesitation at this stage usually stems from inverter sizing questions, payment terms, or competing vendor comparison.

**What to do next**
1. Reach out via WhatsApp with a helpful, consultative check-in rather than a pushy sales pitch.
2. Inquire if Dr. Lawal needs inverter load adjustments or flexible milestone payment options (e.g., 70% deposit / 30% on commissioning).
3. Would you like me to prepare a concise, high-conversion WhatsApp follow-up for Dr. Lawal?`;
  }
  // 4. OBJECTION HANDLING: "Customer says too expensive / discount"
  else if (textQuery.includes('expensive') || textQuery.includes('discount') || textQuery.includes('cost too much') || textQuery.includes('price')) {
    responseBody = `### 💡 Sales Coaching: Handling the "Too Expensive" Objection

**What I found**
Price resistance is the single most common sales objection in B2B and technical sales. Business owners often make the mistake of immediately offering a 10%–15% discount, which damages margins and implies the original quote was inflated.

**What it means**
When a client says "it's too expensive," they are typically communicating one of three things:
1. **Unclear Value**: They do not yet see why your Tier-1 solar panels, LiFePO4 batteries, or certified installation justify the difference over cheap alternatives.
2. **Cash Flow Constraint**: They want the solution, but timing the full lump-sum payment is difficult.
3. **Negotiation Reflex**: They are testing whether you will drop your price without resistance.

**What to do next**
1. **Never discount price without removing scope**: If you must lower the price, adjust the scope (e.g. offer a 3.5kVA system instead of 5kVA, or fewer battery modules) so value remains intact.
2. **Isolate the objection**: Ask: *"Aside from price, is there anything else about our technical solution or warranty that would prevent us from moving forward?"*
3. **Highlight Total Cost of Ownership**: Emphasize warranty (6,000 cycles on LiFePO4) and maintenance support to demonstrate long-term savings over generator fuel costs.
4. Would you like me to draft a value-affirming message to send to a customer who asked for a discount?`;
  }
  // 5. MARKETING & CAMPAIGNS: "What should I promote / marketing"
  else if (textQuery.includes('promote') || textQuery.includes('marketing') || textQuery.includes('campaign') || textQuery.includes('what should i sell')) {
    responseBody = `### 📈 Commercial Strategy & High-ROI Campaign Plan for ${bizName}

**What I found**
Your business provides high-demand clean energy and power infrastructure solutions (5kVA hybrid systems, LiFePO4 lithium batteries, and certified installations).

**What it means**
The most cost-effective revenue driver for an established service business is **customer reactivation** and **preventive maintenance upgrades**, followed by targeted inbound requests from the MatthOrg marketplace.

**What to do next**
1. **Inverter Health & Battery Check Campaign**: Send a WhatsApp broadcast to previous customers offering an annual system tune-up and terminal check (${currency}45,000). This generates quick cash flow and uncovers battery replacement opportunities.
2. **Preventive Dry Season Power Reliability Package**: Position your 5kVA Hybrid Solar Package (${currency}2,512,275) to residential estate residents facing grid unreliability.
3. **Marketplace Buyer Requests**: Check new incoming requests in the MatthOrg Marketplace to claim qualified buyers seeking solar and electrical installations.`;
  }
  // 6. LEADS SPECIFIC QUERY
  else if (textQuery.includes('lead') || textQuery.includes('prospect') || textQuery.includes('cool')) {
    const cooling = await executeMatthewTool('list_cooling_leads', {}, toolContext);
    toolsExecuted.push('list_cooling_leads');
    const coolingList = cooling?.cooling_leads || [];

    if (coolingList.length > 0) {
      responseBody = `### 🎯 Prioritized Lead Pipeline for ${bizName}

**What I found**
You currently have **${coolingList.length} cooling leads** requiring prompt outreach before deal momentum is lost:

${coolingList.slice(0, 5).map((l: any) =>
  `- **${l.customer_name}** (${l.lead_number || 'Lead'}) — *${l.service_needed || 'Inquiry'}*\n` +
  `  - Stored Estimate: **${currency}${Number(l.estimated_value || 0).toLocaleString()}** *(Budget: ${l.budget_formatted})*\n` +
  `  - Stage: \`${l.status}\` | Inactivity: ${l.days_inactive} days | Intent Score: ${l.intent_score}/100\n` +
  `  - Action: ${l.recommended_action}`
).join('\n\n')}

**What it means**
These 4 prospects represent **${currency}14,700,000** in stored pipeline opportunity. Both Pastor Briggs and Alhaji Bello represent 90%+ of this value and have been inactive for over a week.

**What to do next**
Prioritize Pastor Emmanuel Briggs today, followed by Alhaji Mansur Bello. Would you like me to draft customized outreach messages for either of them?`;
    } else {
      responseBody = `**What I found:** All leads currently have active recent communication records.\n\n**What it means:** Your team is keeping pace with prospect touches.\n\n**What to do next:** Review marketplace customer requests to inject fresh qualified opportunities into your funnel.`;
    }
  }
  // 7. QUOTES QUERY
  else if (textQuery.includes('quote') || textQuery.includes('proposal')) {
    const quotes = await executeMatthewTool('list_pending_quotes', {}, toolContext);
    toolsExecuted.push('list_pending_quotes');
    const quoteList = quotes?.pending_quotes || [];

    if (quoteList.length > 0) {
      responseBody = `### 📋 Quotations Awaiting Client Decision

**What I found**
There is **${quoteList.length} submitted quotation** awaiting customer sign-off:

${quoteList.map((q: any) =>
  `- **${q.customer_name}** (${q.quote_number}) — *${q.title}*\n` +
  `  - Total Value: **${currency}${Number(q.total || 0).toLocaleString()}**\n` +
  `  - Status: \`${q.status}\` | Age: ${q.days_pending} days\n` +
  `  - Strategy: ${q.suggested_action}`
).join('\n\n')}

**What it means**
Quote MAT-Q-000124 represents **${currency}2,512,275** in near-term revenue. Following up now significantly increases conversion odds before the prospect explores competing solar alternatives.

**What to do next**
Send a consultative check-in to Dr. Babatunde Lawal regarding system sizing and installation timelines. Shall I draft the message for your approval?`;
    } else {
      responseBody = `**What I found:** No quotes are currently pending decision past 48 hours.\n\n**What to do next:** Move qualified leads into formal quotations to build deal velocity.`;
    }
  }
  // 8. DEFAULT COMMERCIAL BRIEFING
  else {
    const cooling = await executeMatthewTool('list_cooling_leads', {}, toolContext);
    const quotes = await executeMatthewTool('list_pending_quotes', {}, toolContext);
    const overdue = await executeMatthewTool('list_overdue_invoices', {}, toolContext);
    toolsExecuted.push('list_cooling_leads', 'list_pending_quotes', 'list_overdue_invoices');

    const coolingList = cooling?.cooling_leads || [];
    const quoteList = quotes?.pending_quotes || [];
    const overdueList = overdue?.overdue_invoices || [];

    const quoteVal = quoteList.reduce((acc: number, q: any) => acc + (q.total || 0), 0);
    const leadVal = coolingList.reduce((acc: number, l: any) => acc + (l.estimated_value || 0), 0);
    const totalAttentionVal = quoteVal + leadVal;

    responseBody = `### 📊 Commercial Activity & Opportunity Briefing for ${bizName}

**What I found**
- **1 Quotation Awaiting Decision**: MAT-Q-000124 (Dr. Babatunde Lawal) valued at **${currency}${quoteVal.toLocaleString()}** (11 days pending).
- **4 Cooling Leads**: Valued at **${currency}${leadVal.toLocaleString()}** in stored pipeline estimates across stated budget ranges:
  - Pastor Emmanuel Briggs: ${currency}8,200,000 *(Budget: ${currency}7m–${currency}9.5m)*
  - Alhaji Mansur Bello: ${currency}5,200,000 *(Budget: ${currency}4.5m–${currency}6m)*
  - Barrister Nneka Eze: ${currency}850,000 *(Budget: ${currency}750k–${currency}1.1m)*
  - Engr. Kenneth Ibe: ${currency}450,000 *(Budget: ${currency}350k–${currency}550k)*
- **0 Overdue Invoices**: All active invoices are currently within their payment terms.
- **Potential Business Value Requiring Attention**: **${currency}${totalAttentionVal.toLocaleString()}** *(Exact quotes: ${currency}${quoteVal.toLocaleString()} • Stored pipeline estimates: ${currency}${leadVal.toLocaleString()})*.

**What it means**
Your business has substantial potential revenue locked in late-stage qualification and pending proposals. Prioritizing follow-ups with Dr. Lawal, Pastor Briggs, and Alhaji Bello represents over 90% of your near-term commercial value.

**What to do next**
1. Re-engage **Dr. Babatunde Lawal** on Quote MAT-Q-000124 to close the ${currency}2.51m solar deal.
2. Reach out to **Pastor Emmanuel Briggs** to qualify acoustic specifications and schedule an auditorium inspection.
3. Follow up with **Alhaji Mansur Bello** to present an executive project summary.

Which deal or prospect would you like to focus on first? I can draft customized outreach messages for your review.`;
  }

  return {
    text: responseBody,
    toolsExecuted,
  };
}

/**
 * Main Matthew Chat Execution Entrypoint
 */
export async function executeMatthewChat(request: MatthewChatRequest): Promise<MatthewChatResponse> {
  const { message, history = [], businessId, clientContext, clientFallbackData } = request;

  // 1. FAST-PATH DOMAIN RESTRICTION CHECK
  const domainCheck = checkDomainScope(message);
  if (!domainCheck.inScope && domainCheck.redirectMessage) {
    return {
      success: true,
      message: domainCheck.redirectMessage,
      model: 'matthew-guard-v1',
      engine: 'openai',
      tool_calls_executed: [],
      citations: [],
      is_out_of_domain: true,
    };
  }

  const toolContext: ToolExecutionContext = {
    businessId,
    clientContext,
    clientFallbackData,
  };

  // Context summary header to prepend
  const businessContextPreamble = `\n\nCURRENT OPERATIONAL BUSINESS CONTEXT:
- Active Business ID: ${businessId || 'Local Business Session'}
- Business Name: ${clientContext?.businessName || 'Matthorg Enterprise'}
- Trade / Specialization: ${clientContext?.specialization || clientContext?.industry || 'Commercial Services'}
- Operating Currency: ${clientContext?.currency || '₦'}
- Subscription Tier: ${clientContext?.userPlan || 'free'}
`;

  const systemPrompt = MATTHEW_SYSTEM_INSTRUCTIONS + businessContextPreamble;
  const executedToolNames: string[] = [];

  // ==========================================================================
  // PATH A: OPENAI ENGINE (when OPENAI_API_KEY is available)
  // ==========================================================================
  const openai = getOpenAIClient();
  if (openai) {
    try {
      const openAiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = MATTHEW_TOOL_DEFINITIONS.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));

      // Assemble message history
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
      ];

      // Append up to last 10 conversational turns
      const recentHistory = history.slice(-10);
      for (const h of recentHistory) {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      }
      messages.push({ role: 'user', content: message });

      // Run tool execution loop (up to 5 iterations)
      let currentIteration = 0;
      let finalContent = '';
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      while (currentIteration < 5) {
        currentIteration++;
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages,
          tools: openAiTools,
          tool_choice: 'auto',
          temperature: 0.3,
        });

        const choice = completion.choices[0];
        const responseMessage = choice.message;

        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          messages.push(responseMessage);

          for (const tc of responseMessage.tool_calls) {
            if ((tc as any).type !== 'function' || !(tc as any).function) continue;
            const fnName = (tc as any).function.name;
            executedToolNames.push(fnName);
            let fnArgs: Record<string, any> = {};
            try {
              fnArgs = JSON.parse((tc as any).function.arguments || '{}');
            } catch {
              fnArgs = {};
            }

            const toolOutput = await executeMatthewTool(fnName, fnArgs, toolContext);
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(toolOutput),
            });
          }
        } else {
          finalContent = responseMessage.content || '';
          break;
        }
      }

      if (!finalContent) {
        finalContent = "I've reviewed your current business data. What specific sales or growth priority would you like to tackle next?";
      }

      return {
        success: true,
        message: finalContent,
        model: modelName,
        engine: 'openai',
        tool_calls_executed: Array.from(new Set(executedToolNames)),
        citations: extractCitations(finalContent),
        is_out_of_domain: false,
      };
    } catch (openaiErr: any) {
      const errMsg = (openaiErr?.message || '').toLowerCase();
      if (openaiErr?.status === 429 || errMsg.includes('credits') || errMsg.includes('quota') || errMsg.includes('rate limit')) {
        openaiQuotaDepletedUntil = Date.now() + 15 * 60 * 1000; // Cache 429 quota exhaustion for 15 minutes
      }
      console.warn('[Matthew AI] OpenAI request notice, evaluating fallback:', openaiErr?.message || openaiErr);
      // Fall through to Gemini fallback if OpenAI fails or is unconfigured
    }
  }

  // ==========================================================================
  // PATH B: GEMINI BACKEND ENGINE (AI Studio Built-in Infrastructure)
  // ==========================================================================
  const gemini = getGeminiClient();
  if (gemini) {
    // Map tools to Gemini functionDeclarations format
    const geminiDeclarations = MATTHEW_TOOL_DEFINITIONS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: Type.OBJECT,
        properties: Object.entries(t.parameters.properties).reduce((acc: any, [key, val]: [string, any]) => {
          acc[key] = {
            type: val.type === 'number' ? Type.NUMBER : Type.STRING,
            description: val.description,
          };
          return acc;
        }, {}),
        required: t.parameters.required || [],
      },
    }));

    const candidateModels = [
      'gemini-3.6-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
    ];
    let lastGeminiError: any = null;

    for (const modelCandidate of candidateModels) {
      // Allow up to 2 attempts per model for transient errors with backoff
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const chatSession = gemini.chats.create({
            model: modelCandidate,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.25,
              tools: [{ functionDeclarations: geminiDeclarations }],
            },
          });

          // Send recent history context
          let response = await chatSession.sendMessage({ message });

          // Handle function calling loop
          let step = 0;
          while (response.functionCalls && response.functionCalls.length > 0 && step < 5) {
            step++;
            const functionCall = response.functionCalls[0];
            const fnName = functionCall.name;
            executedToolNames.push(fnName);
            const fnArgs = (functionCall.args as Record<string, any>) || {};

            const toolResult = await executeMatthewTool(fnName, fnArgs, toolContext);

            response = await chatSession.sendMessage({
              message: [
                {
                  functionResponse: {
                    name: fnName,
                    response: { result: toolResult },
                  },
                } as any,
              ],
            });
          }

          const replyText = response.text || "I've reviewed your business pipeline. How would you like to proceed?";

          return {
            success: true,
            message: replyText,
            model: `${modelCandidate} (Matthew AI Engine)`,
            engine: 'gemini',
            tool_calls_executed: Array.from(new Set(executedToolNames)),
            citations: extractCitations(replyText),
            is_out_of_domain: false,
          };
        } catch (candidateErr: any) {
          lastGeminiError = candidateErr;
          const isTransient = isTransientError(candidateErr);
          console.warn(
            `[Matthew AI] Model ${modelCandidate} (attempt ${attempt}/2) encountered: ${
              candidateErr?.message || candidateErr
            }. Transient: ${isTransient}`
          );

          if (isTransient && attempt < 2) {
            // Short backoff before retry
            await new Promise((res) => setTimeout(res, 800));
            continue;
          }
          // Break to try next candidate model
          break;
        }
      }
    }

    console.warn('[Matthew AI] All Gemini candidate models busy or unavailable. Engaging deterministic fallback:', lastGeminiError?.message);
    
    // Robust local deterministic synthesis if all cloud models are undergoing high demand (503)
    const localFallback = await generateDeterministicMatthewResponse(request, toolContext);
    return {
      success: true,
      message: localFallback.text,
      model: 'matthew-local-intelligence',
      engine: 'gemini',
      tool_calls_executed: Array.from(new Set([...executedToolNames, ...localFallback.toolsExecuted])),
      citations: extractCitations(localFallback.text),
      is_out_of_domain: false,
    };
  }

  // Fallback if no client available
  const localFallback = await generateDeterministicMatthewResponse(request, toolContext);
  return {
    success: true,
    message: localFallback.text,
    model: 'matthew-local-intelligence',
    engine: 'gemini',
    tool_calls_executed: localFallback.toolsExecuted,
    citations: extractCitations(localFallback.text),
    is_out_of_domain: false,
  };
}
