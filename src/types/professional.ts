export interface Professional {
  id: string;
  slug?: string;
  name?: string;
  // Campos de la base de datos professional_applications
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  instagram?: string;  // Campo privado, solo visible para administradores
  profession: string;
  specializations?: string[];
  languages?: string[];
  experience?: string;
  certifications?: string[];
  wellness_areas?: string[];
  services?: Array<{
    name: string;
    description: string;
    presencialCost?: string | number;
    onlineCost?: string | number;
  }>;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  biography?: string;
  profile_photo?: string;
  gallery?: string[];
  status?: "pending" | "under_review" | "approved" | "rejected";
  created_at?: string;
  updated_at?: string;
  // Campos adicionales para compatibilidad
  whatsapp?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  therapyTypes?: string[];
  wellnessAreas?: string[];
  costs?: {
    presencial: number;
    online: number;
  };
  serviceType?: "in-person" | "online" | "both";
  modality?: "presencial" | "online" | "both"; // Modalidad calculada basada en servicios
  imagePosition?: string; // Posición de la imagen en la card (ej: "center center", "top left", etc.)
  location?: string | {
    city: string;
    state: string;
    country: string;
    address?: string;
  };
  bookingOption?: boolean;
  serviceDescription?: string;
  profilePhoto?: string;
  specialization?: string;
  patients?: number;
  verified?: boolean;
  is_verified?: boolean;
  joinDate?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  // Campos específicos de la base de datos
  working_start_time?: string;
  working_end_time?: string;
  working_days?: number[];
  sessionDuration?: number;
  breakTime?: number;
  bookedSlots?: string[];
  registration_fee_paid?: boolean;
  registration_fee_amount?: number;
  registration_fee_currency?: string;
  registration_fee_payment_id?: string;
  registration_fee_paid_at?: string;
  registration_fee_expires_at?: string;
  registration_fee_stripe_session_id?: string;
  // Review stats
  average_rating?: number;
  total_reviews?: number;
}

export interface ProfessionalApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  instagram?: string;  // Campo privado, solo visible para administradores
  profession: string;
  specialization: string;
  location: string;
  experience: string;
  education: string;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  documents: Array<{
    name: string;
    status: "complete" | "pending" | "incomplete";
  }>;
  avatar: string;
  registration_fee_paid?: boolean;
  registration_fee_amount?: number;
  registration_fee_currency?: string;
  registration_fee_payment_id?: string;
  registration_fee_paid_at?: string;
  registration_fee_expires_at?: string;
  registration_fee_stripe_session_id?: string;
}
