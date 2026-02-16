import {Router, Request, Response} from 'express';
import Stripe from 'stripe';
import {config} from '../config';
import {validateAmount} from '../middleware/validateAmount';

const router = Router();

const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2024-04-10',
});

router.post('/payment-intent', validateAmount, async (req: Request, res: Response) => {
  try {
    const {amountCents} = req.body;

    const customer = await stripe.customers.create();

    const ephemeralKey = await stripe.ephemeralKeys.create(
      {customer: customer.id},
      {apiVersion: '2024-04-10'},
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      customer: customer.id,
      automatic_payment_methods: {enabled: true},
    });

    res.json({
      paymentIntentClientSecret: paymentIntent.client_secret,
      ephemeralKeySecret: ephemeralKey.secret,
      customerId: customer.id,
      publishableKey: config.stripePublishableKey,
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

export default router;
