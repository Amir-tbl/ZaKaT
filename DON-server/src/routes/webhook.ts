import {Router, Request, Response} from 'express';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import {config} from '../config';

const router = Router();

const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2024-04-10',
});

// Initialize Firebase Admin SDK (uses GOOGLE_APPLICATION_CREDENTIALS env var or default credentials)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'zakat-8e5a4',
  });
}

const adminDb = admin.firestore();

// This route must use express.raw() — registered BEFORE express.json() in index.ts
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    if (config.stripeWebhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
    } else {
      // In development without webhook secret, parse directly
      event = req.body as Stripe.Event;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    return;
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        // Only process subscription invoices
        if (!invoice.subscription) break;

        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription.id;

        // Get subscription to find firebaseUid
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const firebaseUid = subscription.metadata.firebaseUid;

        if (!firebaseUid) {
          console.warn('No firebaseUid in subscription metadata:', subscriptionId);
          break;
        }

        const amountCents = invoice.amount_paid || 0;
        const platformFeeCents = Math.round(amountCents * 0.02);
        const netAmountCents = amountCents - platformFeeCents;

        // Write donation document
        await adminDb.collection('donations').add({
          donorUid: firebaseUid,
          donorUserId: firebaseUid,
          donorName: 'Abonnement Zakat',
          targetType: 'treasury',
          targetId: null,
          amountCents,
          currency: 'eur',
          message: 'Don mensuel Zakat (automatique)',
          stripeSubscriptionId: subscriptionId,
          stripeInvoiceId: invoice.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update treasury/global
        const treasuryRef = adminDb.collection('treasury').doc('global');
        const treasuryDoc = await treasuryRef.get();

        if (treasuryDoc.exists) {
          await treasuryRef.update({
            totalAmountCents: admin.firestore.FieldValue.increment(netAmountCents),
            donationCount: admin.firestore.FieldValue.increment(1),
            lastDonationAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          await treasuryRef.set({
            totalAmountCents: netAmountCents,
            donationCount: 1,
            lastDonationAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Update subscription doc
        await adminDb.collection('subscriptions').doc(firebaseUid).set({
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
          status: subscription.status,
          amountCents: subscription.items.data[0]?.price?.unit_amount || amountCents,
          currency: 'eur',
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, {merge: true});

        console.log(`Processed subscription payment: ${amountCents} cents from ${firebaseUid}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const firebaseUid = subscription.metadata.firebaseUid;

        if (!firebaseUid) {
          console.warn('No firebaseUid in deleted subscription metadata:', subscription.id);
          break;
        }

        // Update subscription status in Firestore
        await adminDb.collection('subscriptions').doc(firebaseUid).update({
          status: 'canceled',
          cancelAtPeriodEnd: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Subscription canceled for ${firebaseUid}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription.id;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const firebaseUid = subscription.metadata.firebaseUid;

        if (firebaseUid) {
          await adminDb.collection('subscriptions').doc(firebaseUid).update({
            status: 'past_due',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`Payment failed for subscription of ${firebaseUid}`);
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    res.json({received: true});
  } catch (err) {
    console.error('Error processing webhook event:', err);
    res.status(500).json({error: 'Webhook processing failed'});
  }
});

export default router;
