import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

// Helper function to calculate commission amount (platform fee)
export function calculateCommission(
  serviceAmount: number,
  commissionPercentage: number = 15
): number {
  return Math.round(serviceAmount * (commissionPercentage / 100) * 100) / 100;
}

// Helper function to calculate transfer amount (what the professional/organizer receives)
export function calculateTransferAmount(
  serviceAmount: number,
  commissionPercentage: number = 15
): number {
  const commission = calculateCommission(serviceAmount, commissionPercentage);
  return Math.round((serviceAmount - commission) * 100) / 100;
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

/**
 * Create a Stripe Connect account for a professional or event organizer
 * @param email - Email of the account holder
 * @param businessType - Type of business (individual or company)
 * @param country - Country code (default: MX)
 * @returns Stripe account ID
 */
export async function createConnectAccount(
  email: string,
  businessType: 'individual' | 'company' = 'individual',
  country: string = 'MX'
): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'express',
    country,
    email,
    business_type: businessType,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account.id;
}

/**
 * Create an account link for onboarding
 * @param accountId - Stripe Connect account ID
 * @param returnUrl - URL to return to after onboarding
 * @param refreshUrl - URL to return to if onboarding needs to be restarted
 * @returns Account link URL
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

/**
 * Retrieve account status
 * @param accountId - Stripe Connect account ID
 * @returns Account details with status
 */
export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  
  return {
    id: account.id,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    requirements: account.requirements,
  };
}

/**
 * Create a dashboard login link for a connected account
 * @param accountId - Stripe Connect account ID
 * @returns Dashboard login URL
 */
export async function createLoginLink(accountId: string): Promise<string> {
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}

