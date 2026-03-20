// components/dashboard/AIFinancialAssistant.tsx
'use client'

import { useState, useCallback } from 'react'
import { SparklesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/useToast'

export default function AIFinancialAssistant() {
  const [query, setQuery] = useState('')
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(false)
  const [rateLimit, setRateLimit] = useState({ remaining: 100, reset: 0 })
  const { showToast } = useToast()

  const predefinedQueries = [
    "What are my top spending categories this month?",
    "Are there any unusual transactions I should review?",
    "How does this month compare to last month?",
    "What's my profit trend over the last 30 days?",
    "Any seasonal patterns in my sales data?",
    "What's my most profitable product category?",
  ]

  const askAI = useCallback(async (question: string) => {
    setLoading(true)
    setInsight('')

    try {
      const response = await fetch('/api/ai-financial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: question }),
      })

      // Check rate limit headers
      const remaining = response.headers.get('X-RateLimit-Remaining')
      if (remaining) {
        setRateLimit(prev => ({ ...prev, remaining: parseInt(remaining) }))
      }

      if (!response.ok) {
        if (response.status === 429) {
          showToast('Rate limit reached. Please wait a moment.', 'warning')
        } else if (response.status === 503) {
          showToast('AI service temporarily unavailable', 'error')
        } else {
          showToast('Failed to get AI insights', 'error')
        }
        return
      }

      const data = await response.json()
      setInsight(data.insight)

    } catch (error) {
      console.error('AI request failed:', error)
      showToast('Failed to connect to AI service', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold">AI Financial Analyst</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheckIcon className="w-4 h-4 text-green-500" />
          <span className="text-gray-500">End-to-end encrypted</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">{rateLimit.remaining} credits left</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Input area */}
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your finances... (e.g., 'What were my top expenses last month?')"
            className="w-full p-3 border rounded-lg min-h-[100px] focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {query.length}/500
          </div>
        </div>

        {/* Quick questions */}
        <div className="flex flex-wrap gap-2">
          {predefinedQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(q)
                askAI(q)
              }}
              disabled={loading}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Submit button */}
        <button
          onClick={() => askAI(query)}
          disabled={loading || !query.trim()}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            'Get Financial Insights'
          )}
        </button>

        {/* Privacy notice */}
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <ShieldCheckIcon className="w-3 h-3" />
          Your data is anonymized before sending. No specific transaction details are shared.
        </p>

        {/* Insights output */}
        {insight && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Financial Insights</h4>
            <p className="text-sm text-blue-800 whitespace-pre-line">{insight}</p>
          </div>
        )}
      </div>
    </div>
  )
}