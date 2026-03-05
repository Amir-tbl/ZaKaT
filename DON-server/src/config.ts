import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  stripeSecretKey: requireEnv('STRIPE_SECRET_KEY'),
  stripePublishableKey: requireEnv('STRIPE_PUBLISHABLE_KEY'),
  port: parseInt(process.env.PORT || '3000', 10),
  stripeReturnBaseUrl: process.env.STRIPE_RETURN_BASE_URL || 'https://zakat-8e5a4.web.app',
};
