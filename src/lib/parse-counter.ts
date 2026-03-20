// /home/user/matthorg/src/lib/parse-counter.ts
import { createClient } from '@/utils/supabase/server'

interface ParseQuota {
  allowed: boolean
  remaining: number
  limit: number
  usage: number
  percentUsed: number
}

const PLAN_LIMITS = {
  free: 50,
  starter: 500,
  pro: 2000,
  business: 10000,
  enterprise: 100000
} as const

type PlanType = keyof typeof PLAN_LIMITS

/**
 * Track and enforce parse quota for an organization
 */
export async function trackParse(orgId: string): Promise<ParseQuota> {
  const supabase = await createClient()  // ✅ FIX: Added await
  
  try {
    // 1. Get organization's subscription plan
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      console.error('Failed to fetch org plan:', orgError)
      // Default to free plan if org not found
      return {
        allowed: true,
        remaining: PLAN_LIMITS.free,
        limit: PLAN_LIMITS.free,
        usage: 0,
        percentUsed: 0
      }
    }

    const plan = (org.subscription_plan || 'free') as PlanType
    const monthlyLimit = PLAN_LIMITS[plan] || PLAN_LIMITS.free

    // 2. Calculate current month's usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(0)
    endOfMonth.setHours(23, 59, 59, 999)

    const { data: usageData, error: usageError } = await supabase
      .from('parse_usage')
      .select('parse_count')
      .eq('organization_id', orgId)
      .gte('parse_date', startOfMonth.toISOString().split('T')[0])
      .lte('parse_date', endOfMonth.toISOString().split('T')[0])

    if (usageError) {
      console.error('Failed to fetch usage:', usageError)
    }

    const currentUsage = usageData?.reduce((sum, record) => sum + (record.parse_count || 0), 0) || 0

    // 3. Check if under limit
    if (currentUsage >= monthlyLimit) {
      return {
        allowed: false,
        remaining: 0,
        limit: monthlyLimit,
        usage: currentUsage,
        percentUsed: 100
      }
    }

    // 4. Record this parse (daily aggregate)
    const today = new Date().toISOString().split('T')[0]
    
    const { error: upsertError } = await supabase
      .from('parse_usage')
      .upsert({
        organization_id: orgId,
        parse_date: today,
        parse_count: 1
      }, {
        onConflict: 'organization_id, parse_date',
        ignoreDuplicates: false
      })

    if (upsertError) {
      console.error('Failed to record parse usage:', upsertError)
    }

    const newUsage = currentUsage + 1

    return {
      allowed: true,
      remaining: monthlyLimit - newUsage,
      limit: monthlyLimit,
      usage: newUsage,
      percentUsed: (newUsage / monthlyLimit) * 100
    }

  } catch (error) {
    console.error('Parse tracking error:', error)
    // Fail open - allow parse but log error
    return {
      allowed: true,
      remaining: PLAN_LIMITS.free,
      limit: PLAN_LIMITS.free,
      usage: 0,
      percentUsed: 0
    }
  }
}

/**
 * Get current parse quota without recording a new parse
 */
export async function getParseQuota(orgId: string): Promise<ParseQuota> {
  const supabase = await createClient()  // ✅ FIX: Added await
  
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_plan')
    .eq('id', orgId)
    .single()

  const plan = (org?.subscription_plan || 'free') as PlanType
  const monthlyLimit = PLAN_LIMITS[plan] || PLAN_LIMITS.free

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: usageData } = await supabase
    .from('parse_usage')
    .select('parse_count')
    .eq('organization_id', orgId)
    .gte('parse_date', startOfMonth.toISOString().split('T')[0])

  const currentUsage = usageData?.reduce((sum, record) => sum + (record.parse_count || 0), 0) || 0

  return {
    allowed: currentUsage < monthlyLimit,
    remaining: Math.max(0, monthlyLimit - currentUsage),
    limit: monthlyLimit,
    usage: currentUsage,
    percentUsed: (currentUsage / monthlyLimit) * 100
  }
}

/**
 * Reset parse usage for an organization (admin only)
 */
export async function resetParseUsage(orgId: string): Promise<void> {
  const supabase = await createClient()  // ✅ FIX: Added await
  
  await supabase
    .from('parse_usage')
    .delete()
    .eq('organization_id', orgId)
}

/**
 * Get parse usage history for an organization
 */
export async function getParseHistory(orgId: string, months: number = 3) {
  const supabase = await createClient()  // ✅ FIX: Added await
  
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  
  const { data } = await supabase
    .from('parse_usage')
    .select('parse_date, parse_count')
    .eq('organization_id', orgId)
    .gte('parse_date', startDate.toISOString().split('T')[0])
    .order('parse_date', { ascending: false })
  
  return data || []
}