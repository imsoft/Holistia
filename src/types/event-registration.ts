export type EventRegistrationStatus = 
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: string;
  status: EventRegistrationStatus;
  notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  special_requirements?: string;
  confirmation_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEventRegistrationData {
  event_id: string;
  user_id: string;
  notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  special_requirements?: string;
}
