export interface Professional {
  id: string;
  slug: string;
  name: string;
  email: string;
  whatsapp?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  profession: string;
  therapyTypes?: string[];
  costs?: {
    presencial: number;
    online: number;
  };
  serviceType?: "in-person" | "online" | "both";
  location: string | {
    city: string;
    state: string;
    country: string;
    address?: string;
  };
  bookingOption?: boolean;
  serviceDescription?: string;
  biography?: string;
  profilePhoto?: string;
  gallery?: string[];
  // Campos adicionales para compatibilidad
  phone?: string;
  specialization?: string;
  patients?: number;
  status?: "active" | "inactive" | "suspended";
  verified?: boolean;
  joinDate?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  services?: Array<{
    name: string;
    description: string;
    presencialCost?: number;
    onlineCost?: number;
  }>;
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  sessionDuration?: number;
  breakTime?: number;
  bookedSlots?: string[];
}

export interface ProfessionalApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
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
}
