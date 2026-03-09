import express from 'express';
import cors from 'cors';
import {config} from './config';
import paymentRoutes from './routes/payment';
import payoutRoutes from './routes/payout';
import subscriptionRoutes from './routes/subscription';
import webhookRoutes from './routes/webhook';

const app = express();

app.use(cors());

// Webhook route MUST be registered BEFORE express.json() because
// Stripe webhook signature verification requires the raw body
app.use('/api', express.raw({type: 'application/json'}), webhookRoutes);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({status: 'ok'});
});

app.use('/api', paymentRoutes);
app.use('/api', payoutRoutes);
app.use('/api', subscriptionRoutes);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`DON-server listening on 0.0.0.0:${config.port}`);
});
