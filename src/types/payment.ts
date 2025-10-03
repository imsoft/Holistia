export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface Payment {
  id: string;
  appointment_id: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  amount: number; // Commission amount (15%)
  service_amount: number; // Original service amount (100%)
  commission_percentage: number;
  currency: string;
  status: PaymentStatus;
  patient_id: string;
  professional_id: string;
  description: string | null;
  payment_method: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export interface CreatePaymentData {
  appointment_id: string;
  service_amount: number;
  patient_id: string;
  professional_id: string;
  description?: string;
  commission_percentage?: number; // Default 15%
}

export interface StripeCheckoutSessionData {
  sessionId: string;
  url: string;
}

export interface PaymentIntentData {
  payment_intent_id: string;
  client_secret: string;
  amount: number;
  currency: string;
}

