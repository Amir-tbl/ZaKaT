const BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000'
  : 'https://your-production-server.com'; // TODO: replace with production URL

interface PaymentSheetParams {
  paymentIntentClientSecret: string;
  ephemeralKeySecret: string;
  customerId: string;
  publishableKey: string;
}

export async function fetchPaymentSheetParams(
  amountCents: number,
): Promise<PaymentSheetParams> {
  const response = await fetch(`${BASE_URL}/api/payment-intent`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({amountCents}),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.error || `Erreur serveur (${response.status})`,
    );
  }

  return response.json();
}
