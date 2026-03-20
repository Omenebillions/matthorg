// app/api/parse-natural-language/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { trackParse } from '@/lib/parse-counter'

export async function POST(req: NextRequest) {
  try {
    const { text, orgId } = await req.json()
    
    // Validate input
    if (!text || !orgId) {
      return NextResponse.json(
        { error: 'Missing text or orgId' },
        { status: 400 }
      )
    }
    
    // 1. Check parse quota
    const { allowed, remaining, limit, usage } = await trackParse(orgId)
    
    if (!allowed) {
      return NextResponse.json({
        error: 'Monthly parse limit reached',
        upgradeUrl: '/settings/billing',
        quota: { remaining, limit, usage }
      }, { status: 403 })
    }
    
    // 2. Parse with AI
    const parsed = await parseWithAI(text)
    
    // 3. Include quota info in response
    return NextResponse.json({
      ...parsed,
      quota: { remaining, limit, usage: usage + 1 }
    })

  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json(
      { error: 'Failed to parse input' },
      { status: 500 }
    )
  }
}

// AI parsing function
async function parseWithAI(text: string) {
  const prompt = `
    Parse this business entry into structured data.
    
    Input: "${text}"
    
    Return JSON with:
    - type: "sale" | "expense" | "product" | "unknown"
    - confidence: number 0-1
    - data: {
        product?: string
        quantity?: number
        amount?: number
        customer?: string
        category?: string
        description?: string
        payment_method?: "cash" | "card" | "transfer"
      }
    - raw: the original text
  `

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a business data parser. Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    })
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'AI parsing failed')
  }
  
  const parsed = JSON.parse(data.choices[0].message.content)
  
  return {
    ...parsed,
    raw: text
  }
}