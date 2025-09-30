export interface BecomeProfessionalForm {
  // Información Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Información Profesional
  profession: string;
  specialization: string;
  experience: string;
  education: string;
  location: string;
  
  // Documentos
  cedula: File | null;
  titulo: File | null;
  comprobanteDomicilio: File | null;
  cartaRecomendacion: File | null;
  
  // Información de Servicios
  services: Array<{
    name: string;
    description: string;
    presencialCost?: number;
    onlineCost?: number;
  }>;
  
  // Horarios de Trabajo
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  sessionDuration: number;
  breakTime: number;
  
  // Información Adicional
  bio: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  bio?: string;
  location?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
}
