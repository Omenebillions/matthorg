import { getPaystackPlan } from './plans';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const reference = typeof req.query?.reference === 'string' ? req.query.reference : '';
  if (!secretKey) return res.status(503).json({ error: 'Payments are not configured on the server.' });
  if (!reference) return res.status(400).json({ error: 'A payment reference is required.' });

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(502).json({ error: data.message || 'Paystack could not verify the transaction.' });
    }
    const plan = data.data?.metadata?.mathorg_plan;
    const interval = data.data?.metadata?.mathorg_interval || 'monthly';
    const selectedPlan = getPaystackPlan(plan, interval);
    const verified = data.data?.status === 'success'
      && Boolean(selectedPlan)
      && data.data?.amount === selectedPlan?.amount
      && (!data.data?.plan || data.data.plan === selectedPlan?.code);
    return res.status(200).json({
      verified,
      plan: verified ? plan : null,
      interval: verified ? interval : null,
      reference: data.data?.reference || reference,
    });
  } catch (error) {
    console.error('Paystack verification failed:', error);
    return res.status(502).json({ error: 'Unable to connect to Paystack.' });
  }
}