import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

// Helper function to calculate commission amount
export function calculateCommission(
  serviceAmount: number,
  commissionPercentage: number = 15
): number {
  return Math.round(serviceAmount * (commissionPercentage / 100) * 100) / 100;
}

// Helper function to format amount for Stripe (cents)
export function formatAmountForStripe(
  amount: number
): number {
  // Stripe requires amounts in cents
  return Math.round(amount * 100);
}

// Helper function to format amount from Stripe (cents to regular)
export function formatAmountFromStripe(
  amount: number
): number {
  return amount / 100;
}

