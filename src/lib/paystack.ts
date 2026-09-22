// Paystack Client Integration Library for Mathorg
// Production-grade payment initialization, verification & status checking

export interface PaystackStatus {
  isConfigured: boolean;
  publicKey: string | null;
  mode: 'live' | 'test' | 'unconfigured';
}

export interface PaystackInitResponse {
  success: boolean;
  authorization_url?: string;
  access_code?: string;
  reference?: string;
  message?: string;
  error?: string;
}

export interface PaystackVerifyResponse {
  success: boolean;
  data?: {
    status: 'success' | 'failed' | 'abandoned' | string;
    reference: string;
    amount: number; // in Naira (converted from Kobo)
    paid_at: string;
    channel: string;
    currency: string;
    customer: {
      email: string;
      customer_code?: string;
    };
    metadata?: Record<string, any>;
  };
  error?: string;
}

export async function getPaystackConfigStatus(): Promise<PaystackStatus> {
  try {
    const res = await fetch('/api/paystack/status');
    if (res.ok) {
      const data = await res.json();
      return {
        isConfigured: Boolean(data.isConfigured),
        publicKey: data.publicKey || null,
        mode: data.mode || 'unconfigured',
      };
    }
  } catch (err) {
    console.debug('Paystack status query notice:', err);
  }
  return {
    isConfigured: false,
    publicKey: null,
    mode: 'unconfigured',
  };
}

export async function initializePaystackPayment(params: {
  email: string;
  amount: number; // in Naira (e.g. 2500)
  type: 'subscription' | 'invoice' | 'lead_unlock';
  plan?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerName?: string;
  leadId?: string;
  userId?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}): Promise<PaystackInitResponse> {
  try {
    const response = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        callback_url: params.callbackUrl || window.location.href.split('?')[0],
        metadata: {
          type: params.type,
          plan: params.plan,
          invoiceId: params.invoiceId,
          invoiceNumber: params.invoiceNumber,
          customerName: params.customerName,
          leadId: params.leadId,
          userId: params.userId,
          ...(params.metadata || {}),
          custom_fields: [
            {
              display_name: 'Payment Type',
              variable_name: 'payment_type',
              value: params.type,
            },
            ...(params.plan
              ? [{ display_name: 'Plan', variable_name: 'plan', value: params.plan }]
              : []),
            ...(params.invoiceNumber
              ? [{ display_name: 'Invoice', variable_name: 'invoice_number', value: params.invoiceNumber }]
              : []),
          ],
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to initialize payment with Paystack.',
      };
    }

    return {
      success: true,
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      reference: data.reference,
      message: data.message,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error connecting to payment gateway.',
    };
  }
}

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResponse> {
  try {
    const response = await fetch(`/api/paystack/verify/${encodeURIComponent(reference)}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || data.message || 'Payment verification failed.',
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error during transaction verification.',
    };
  }
}
