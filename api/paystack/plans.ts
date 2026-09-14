export type PaystackPlanTier = 'pro' | 'business';
export type PaystackInterval = 'monthly' | 'yearly';

export const PAYSTACK_PLANS: Record<PaystackPlanTier, Record<PaystackInterval, { code: string; amount: number }>> = {
  pro: {
    monthly: { code: 'PLN_z5guft5zffzp2b1', amount: 250000 },
    yearly: { code: 'PLN_29cn2yb8vp9feu0', amount: 2500000 },
  },
  business: {
    monthly: { code: 'PLN_1rfoqn4ndigwdq8', amount: 750000 },
    yearly: { code: 'PLN_1i58v48m75d6tzo', amount: 7500000 },
  },
};

export function getPaystackPlan(plan: unknown, interval: unknown) {
  if (plan !== 'pro' && plan !== 'business') return null;
  if (interval !== 'monthly' && interval !== 'yearly') return null;
  return PAYSTACK_PLANS[plan][interval];
}