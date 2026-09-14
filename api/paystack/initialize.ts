import { getPaystackPlan } from './plans';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return res.status(503).json({ error: 'Payments are not configured on the server.' });

  const { email, plan, interval = 'monthly' } = req.body || {};
  const selectedPlan = getPaystackPlan(plan, interval);
  if (typeof email !== 'string' || !email.includes('@') || !selectedPlan) {
    return res.status(400).json({ error: 'A valid email and paid plan are required.' });
  }

  const origin = process.env.APP_URL || `https://${req.headers.host}`;
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: selectedPlan.amount,
        currency: 'NGN',
        plan: selectedPlan.code,
        callback_url: `${origin}/?payment=paystack&plan=${encodeURIComponent(plan)}&interval=${encodeURIComponent(interval)}`,
        metadata: { mathorg_plan: plan, mathorg_interval: interval },
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.status || !data.data?.authorization_url) {
      return res.status(502).json({ error: data.message || 'Paystack could not initialize the transaction.' });
    }
    return res.status(200).json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference });
  } catch (error) {
    console.error('Paystack initialization failed:', error);
    return res.status(502).json({ error: 'Unable to connect to Paystack.' });
  }
}