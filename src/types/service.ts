export interface Service {
  id?: string;
  name: string;
  description: string;
  type: "session" | "program"; // Sesión individual o programa
  modality: "presencial" | "online" | "both"; // Modalidad de atención
  duration: number; // Duración en minutos (para sesiones)
  program_duration?: { // Duración del programa (para programas)
    value: number;
    unit: "meses" | "semanas" | "dias" | "horas";
  };
  cost: number | { presencial?: number; online?: number }; // Temporal: puede ser number o jsonb
  address?: string; // Dirección específica del servicio (opcional)
  image_url?: string; // URL de la imagen del servicio
  isactive: boolean; // Nombre del campo en la base de datos
  created_at?: string;
  updated_at?: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  type: "session" | "program";
  modality: "presencial" | "online" | "both";
  duration: number;
  cost?: number; // Precio único
  address?: string; // Dirección específica del servicio (opcional)
  image_url?: string; // URL de la imagen del servicio
}

export interface ProfessionalService extends Service {
  professional_id: string;
  user_id: string;
}
