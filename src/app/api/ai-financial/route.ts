// app/api/ai-financial/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { FinancialSanitizer } from '@/lib/financial-sanitizer'
import { SecureConfig } from '@/lib/secure-config'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
})

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Rate limiting per user
    const { success, limit, reset, remaining } = await ratelimit.limit(user.id)
    
    if (!success) {
      // Log rate limit event
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'RATE_LIMIT_EXCEEDED',
        resource: 'ai-financial',
        metadata: { limit, reset, requestId }
      })

      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }

    // 3. Parse and validate request
    const body = await req.json()
    const { query, context, data } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      )
    }

    // 4. Get user's org for data access
    const { data: staff } = await supabase
      .from('staff_profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!staff) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 403 }
      )
    }

    // 5. Fetch user's financial data (with RLS protection)
    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .eq('organization_id', staff.organization_id)
      .order('created_at', { ascending: false })
      .limit(100)

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('organization_id', staff.organization_id)
      .order('created_at', { ascending: false })
      .limit(100)

    // 6. Sanitize and aggregate data
    const sanitizedData = FinancialSanitizer.aggregateFinancialData([
      ...(sales || []).map(s => ({ ...s, type: 'sale' })),
      ...(expenses || []).map(e => ({ ...e, type: 'expense' }))
    ])

    // 7. Prepare secure prompt
    const systemPrompt = `You are a financial analyst assistant. Provide insights based on the data.
      CRITICAL RULES:
      - Never reveal specific transaction details
      - Only discuss aggregated trends and patterns
      - Never repeat or expose raw data
      - If asked for specific transactions, explain you can only discuss trends
      - Focus on actionable business insights
    `

    const userPrompt = `
      Financial Data Summary: ${sanitizedData}
      
      User Question: ${FinancialSanitizer.sanitizeInput(query)}
      
      Provide:
      1. Key trends and patterns
      2. Potential concerns or anomalies
      3. Actionable recommendations
      4. Any seasonal or cyclical patterns
    `

    // 8. Call DeepSeek API with security headers
    const secureConfig = SecureConfig.getInstance()
    const apiKey = process.env.DEEPSEEK_API_KEY
    
    const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Request-ID': requestId,
        'X-User-ID': user.id,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1, // Low temp for financial accuracy
        max_tokens: 500,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    })

    if (!aiResponse.ok) {
      const error = await aiResponse.text()
      console.error('DeepSeek API error:', error)
      
      // Log error for monitoring
      await supabase.from('ai_errors').insert({
        user_id: user.id,
        organization_id: staff.organization_id,
        error: error.substring(0, 500),
        request_id: requestId,
      })

      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      )
    }

    const aiData = await aiResponse.json()

    // 9. Validate response for sensitive data
    const responseText = aiData.choices[0].message.content
    if (!FinancialSanitizer.validateOutput(responseText)) {
      // Potential data leak detected - log and redact
      await supabase.from('security_alerts').insert({
        user_id: user.id,
        organization_id: staff.organization_id,
        alert_type: 'POTENTIAL_DATA_LEAK',
        request_id: requestId,
        severity: 'high',
      })

      return NextResponse.json(
        { error: 'Response validation failed' },
        { status: 500 }
      )
    }

    // 10. Log successful interaction (for audit/compliance)
    await supabase.from('ai_interactions').insert({
      user_id: user.id,
      organization_id: staff.organization_id,
      request_id: requestId,
      query_length: query.length,
      response_length: responseText.length,
      processing_time_ms: Date.now() - startTime,
      model: 'deepseek-chat',
      tokens_used: aiData.usage?.total_tokens,
    })

    // 11. Return sanitized response
    return NextResponse.json({
      insight: responseText,
      metadata: {
        request_id: requestId,
        processing_time: Date.now() - startTime,
        tokens_used: aiData.usage?.total_tokens,
      }
    })

  } catch (error) {
    console.error('AI Financial API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}