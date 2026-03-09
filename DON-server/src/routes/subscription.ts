import {Router, Request, Response} from 'express';
import Stripe from 'stripe';
import {config} from '../config';

const router = Router();

const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2024-04-10',
});

// Find or create a Stripe customer by firebaseUid
async function findOrCreateCustomer(firebaseUid: string, email?: string): Promise<Stripe.Customer> {
  // Search for existing customer with this firebaseUid in metadata
  const existing = await stripe.customers.search({
    query: `metadata["firebaseUid"]:"${firebaseUid}"`,
  });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  // Create new customer
  return stripe.customers.create({
    email,
    metadata: {firebaseUid},
  });
}

// POST /api/create-subscription
router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    const {amountCents, firebaseUid, email} = req.body;

    if (!amountCents || !firebaseUid) {
      res.status(400).json({error: 'amountCents and firebaseUid are required'});
      return;
    }

    if (amountCents < 100) {
      res.status(400).json({error: 'Minimum subscription amount is 1 EUR (100 cents)'});
      return;
    }

    const customer = await findOrCreateCustomer(firebaseUid, email);

    const ephemeralKey = await stripe.ephemeralKeys.create(
      {customer: customer.id},
      {apiVersion: '2024-04-10'},
    );

    // Require STRIPE_ZAKAT_PRODUCT_ID to be set
    if (!config.stripeZakatProductId) {
      res.status(500).json({error: 'Server misconfigured: missing STRIPE_ZAKAT_PRODUCT_ID'});
      return;
    }

    // Create subscription with inline price_data (dynamic amount)
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: 'eur',
            product: config.stripeZakatProductId,
            unit_amount: amountCents,
            recurring: {interval: 'month'},
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        firebaseUid,
        type: 'zakat_monthly',
      },
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      ephemeralKeySecret: ephemeralKey.secret,
      customerId: customer.id,
      publishableKey: config.stripePublishableKey,
    });
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

// POST /api/cancel-subscription
router.post('/cancel-subscription', async (req: Request, res: Response) => {
  try {
    const {subscriptionId, firebaseUid} = req.body;

    if (!subscriptionId || !firebaseUid) {
      res.status(400).json({error: 'subscriptionId and firebaseUid are required'});
      return;
    }

    // Verify ownership
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.metadata.firebaseUid !== firebaseUid) {
      res.status(403).json({error: 'Unauthorized'});
      return;
    }

    // Cancel at end of current period
    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({
      status: updated.status,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      currentPeriodEnd: updated.current_period_end,
    });
  } catch (err) {
    console.error('Error canceling subscription:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

// POST /api/get-subscription-status
router.post('/get-subscription-status', async (req: Request, res: Response) => {
  try {
    const {firebaseUid} = req.body;

    if (!firebaseUid) {
      res.status(400).json({error: 'firebaseUid is required'});
      return;
    }

    // Find customer
    const customers = await stripe.customers.search({
      query: `metadata["firebaseUid"]:"${firebaseUid}"`,
    });

    if (customers.data.length === 0) {
      res.json({subscription: null});
      return;
    }

    const customer = customers.data[0];

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Check for subscriptions pending cancellation
      const allSubs = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1,
      });

      if (allSubs.data.length > 0 && allSubs.data[0].status !== 'canceled') {
        const sub = allSubs.data[0];
        res.json({
          subscription: {
            id: sub.id,
            status: sub.status,
            amountCents: sub.items.data[0]?.price?.unit_amount || 0,
            currency: sub.items.data[0]?.price?.currency || 'eur',
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        return;
      }

      res.json({subscription: null});
      return;
    }

    const sub = subscriptions.data[0];
    res.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        amountCents: sub.items.data[0]?.price?.unit_amount || 0,
        currency: sub.items.data[0]?.price?.currency || 'eur',
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
  } catch (err) {
    console.error('Error getting subscription status:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

export default router;
