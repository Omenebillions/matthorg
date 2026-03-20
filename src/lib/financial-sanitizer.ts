// lib/financial-sanitizer.ts
export class FinancialSanitizer {
    // PII patterns to detect and redact
    private static piiPatterns = [
      { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: 'name' },
      { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, type: 'credit_card' },
      { pattern: /\b[A-Z]{2}\d{2}[A-Z]{2}\d{4}\b/g, type: 'iban' },
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'ssn' },
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: 'email' },
      { pattern: /\b\d{10,15}\b/g, type: 'phone' },
    ]
  
    // Sanitize input before sending to AI
    static sanitizeInput(text: string, context: 'general' | 'financial' = 'financial'): string {
      let sanitized = text
  
      // Remove PII
      this.piiPatterns.forEach(({ pattern, type }) => {
        sanitized = sanitized.replace(pattern, `[REDACTED_${type.toUpperCase()}]`)
      })
  
      // Financial-specific sanitization
      if (context === 'financial') {
        // Replace actual amounts with placeholders (keep structure)
        sanitized = sanitized.replace(/\b\d+\.?\d*\b/g, (match) => {
          const num = parseFloat(match)
          if (num > 1000000) return '[LARGE_AMOUNT]'
          if (num > 1000) return '[MEDIUM_AMOUNT]'
          return '[SMALL_AMOUNT]'
        })
      }
  
      return sanitized
    }
  
    // Validate output for sensitive data leakage
    static validateOutput(text: string): boolean {
      // Check if any PII might have leaked
      for (const { pattern } of this.piiPatterns) {
        if (pattern.test(text)) {
          return false // Potential PII leak detected
        }
      }
      return true
    }
  
    // Financial data aggregation (summarize before sending)
    static aggregateFinancialData(transactions: any[]): string {
      const summary = {
        totalSales: transactions.reduce((sum, t) => sum + t.amount, 0),
        avgTransaction: 0,
        categorySummary: {} as Record<string, number>,
        anomalies: [] as string[],
      }
  
      summary.avgTransaction = summary.totalSales / transactions.length
  
      // Categorize
      transactions.forEach(t => {
        const cat = t.category || 'uncategorized'
        summary.categorySummary[cat] = (summary.categorySummary[cat] || 0) + 1
      })
  
      // Detect anomalies
      const amounts = transactions.map(t => t.amount)
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const stdDev = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length)
  
      transactions.forEach(t => {
        if (Math.abs(t.amount - mean) > 3 * stdDev) {
          summary.anomalies.push(`Unusual transaction: ${t.description || t.id}`)
        }
      })
  
      return JSON.stringify(summary, null, 2)
    }
  }