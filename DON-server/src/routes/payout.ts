import {Router, Request, Response} from 'express';
import Stripe from 'stripe';
import {config} from '../config';
import {validateAmount} from '../middleware/validateAmount';

const router = Router();

const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2024-04-10',
});

/**
 * POST /api/create-connected-account
 * Creates a Stripe Connect Express account for the user so they can receive payouts.
 * Body: { email: string, userId: string }
 * Returns: { accountId, accountLinkUrl }
 */
router.post('/create-connected-account', async (req: Request, res: Response) => {
  try {
    const {email, userId} = req.body;

    if (!email || !userId) {
      res.status(400).json({error: 'email and userId are required'});
      return;
    }

    // Create a Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email,
      business_type: 'individual',
      capabilities: {
        transfers: {requested: true},
      },
      business_profile: {
        url: 'https://zakat-8e5a4.web.app',
        product_description: 'Receiving donations via the public ZaKaT application',
      },
      metadata: {
        firebaseUserId: userId,
      },
    });

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${config.stripeReturnBaseUrl}/stripe-refresh`,
      return_url: `${config.stripeReturnBaseUrl}/stripe-return`,
      type: 'account_onboarding',
    });

    res.json({
      accountId: account.id,
      accountLinkUrl: accountLink.url,
    });
  } catch (err) {
    console.error('Error creating connected account:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/create-payout
 * Creates a transfer from the platform to the user's connected Stripe account.
 * Body: { amountCents: number, connectedAccountId: string, userId: string }
 * Returns: { transferId, amount }
 */
router.post('/create-payout', validateAmount, async (req: Request, res: Response) => {
  try {
    const {amountCents, connectedAccountId, userId} = req.body;

    if (!connectedAccountId) {
      res.status(400).json({error: 'connectedAccountId is required'});
      return;
    }

    if (!userId) {
      res.status(400).json({error: 'userId is required'});
      return;
    }

    // Verify the connected account exists and is active
    const account = await stripe.accounts.retrieve(connectedAccountId);

    const transfersCap = account.capabilities?.transfers;
    if (transfersCap !== 'active') {
      res.status(400).json({
        error: 'La verification de votre compte n\'est pas terminee. Veuillez completer toutes les etapes de verification Stripe.',
        needsOnboarding: true,
      });
      return;
    }

    // Create a transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'eur',
      destination: connectedAccountId,
      metadata: {
        firebaseUserId: userId,
        type: 'withdrawal',
      },
    });

    res.json({
      transferId: transfer.id,
      amount: amountCents,
    });
  } catch (err) {
    console.error('Error creating payout:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/check-account-status
 * Checks if a Stripe Connect account is fully onboarded.
 * Body: { connectedAccountId: string }
 * Returns: { isActive, needsOnboarding }
 */
router.post('/check-account-status', async (req: Request, res: Response) => {
  try {
    const {connectedAccountId} = req.body;

    if (!connectedAccountId) {
      res.status(400).json({error: 'connectedAccountId is required'});
      return;
    }

    const account = await stripe.accounts.retrieve(connectedAccountId);

    // Check if transfers capability is active
    const transfersCap = account.capabilities?.transfers;
    const canReceiveTransfers = transfersCap === 'active';

    res.json({
      isActive: canReceiveTransfers,
      needsOnboarding: !account.details_submitted,
      detailsSubmitted: account.details_submitted,
      transfersCapability: transfersCap || 'not_requested',
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (err) {
    console.error('Error checking account status:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/create-account-link
 * Creates a new account link for an existing connected account (for re-onboarding).
 * Body: { connectedAccountId: string }
 * Returns: { accountLinkUrl }
 */
router.post('/create-account-link', async (req: Request, res: Response) => {
  try {
    const {connectedAccountId} = req.body;

    if (!connectedAccountId) {
      res.status(400).json({error: 'connectedAccountId is required'});
      return;
    }

    const accountLink = await stripe.accountLinks.create({
      account: connectedAccountId,
      refresh_url: `${config.stripeReturnBaseUrl}/stripe-refresh`,
      return_url: `${config.stripeReturnBaseUrl}/stripe-return`,
      type: 'account_onboarding',
    });

    res.json({
      accountLinkUrl: accountLink.url,
    });
  } catch (err) {
    console.error('Error creating account link:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

export default router;
