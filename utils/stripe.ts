// src/services/stripe.ts
import {
  initPaymentSheet,
  presentPaymentSheet,
} from '@stripe/stripe-react-native';

export interface StripeParams {
  paymentIntent: string;
  ephemeralKey: string;
  customer: string;
}

const BACKEND_URL = 'https://YOUR_BACKEND_URL';


export async function upgradeWithStripe(
  plan: 'free' | 'pro'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. fetch params
    const res = await fetch(`${BACKEND_URL}/create-payment-sheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) throw new Error('Network error');

    const { paymentIntent, ephemeralKey, customer } = (await res.json()) as StripeParams;

    // 2. init sheet
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'Bobee',
      paymentIntentClientSecret: paymentIntent,
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
    });
    if (initError) throw new Error(initError.message);

    // 3. present
    const { error: presentError } = await presentPaymentSheet();
    if (presentError) throw new Error(presentError.message);

    return { success: true };
  } catch (e: any) {
    console.warn('Stripe upgrade failed:', e.message);
    return { success: false, error: e.message };
  }
}
