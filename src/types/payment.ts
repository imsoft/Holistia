export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentType = 'appointment' | 'event' | 'registration';

export interface Payment {
  id: string;
  appointment_id: string | null;
  event_id: string | null;
  event_registration_id: string | null;
  professional_application_id?: string | null;
  payment_type: PaymentType;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  amount: number; // Commission amount (15% for appointments, 25% for events, 100% for registration)
  service_amount: number; // Original service amount (100%)
  commission_percentage: number;
  currency: string;
  status: PaymentStatus;
  patient_id: string;
  professional_id: string | null;
  description: string | null;
  payment_method: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export interface CreatePaymentData {
  appointment_id?: string;
  event_id?: string;
  service_amount: number;
  patient_id: string;
  professional_id?: string;
  description?: string;
  commission_percentage?: number; // Default 15% for appointments, 20% for events
}

export interface CreateEventPaymentData {
  event_id: string;
  service_amount: number;
  patient_id: string;
  description?: string;
}

export interface CreateRegistrationPaymentData {
  professional_application_id: string;
  user_id: string;
  amount?: number; // Default 1000 MXN
  description?: string;
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

